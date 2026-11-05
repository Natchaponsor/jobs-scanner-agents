/**
 * Shared pagination helpers for the adapters whose APIs cap how much one request returns
 * (Workday 20/page, Oracle Fusion and Amazon 100/page, Google 20/page).
 *
 * Why there's a ceiling at all: every job ends up in the browser's local store, so a source
 * that lists thousands of postings can't be unbounded. 2,500 per source covers every Workday
 * tenant in the default list in full (the largest is ~1,400) and takes the newest-first slice of
 * the very large ones (JPMorgan ~7,200, Amazon 10,000+).
 */
export const MAX_JOBS_PER_SOURCE = 2500;

/** Run `fn` over `items` with at most `limit` calls in flight, returning results in input order. */
export async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

/** Retry a flaky request once — fetching 70 pages makes a single transient failure likely enough
 *  that it shouldn't throw away the whole source. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError;
}

/** Offsets for every page after the first: pageSize, 2*pageSize, ... up to min(total, maxJobs). */
export function remainingOffsets(total: number, pageSize: number, maxJobs: number = MAX_JOBS_PER_SOURCE): number[] {
  const offsets: number[] = [];
  for (let offset = pageSize; offset < Math.min(total, maxJobs); offset += pageSize) offsets.push(offset);
  return offsets;
}
