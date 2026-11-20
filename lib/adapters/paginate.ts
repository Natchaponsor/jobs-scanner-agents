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

/** A non-2xx response, carrying what a retry needs to know: the status (is this worth retrying?)
 *  and how long the server asked us to wait (`Retry-After`). */
export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterMs?: number
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/** The server answered with a bot-mitigation challenge (Cloudflare's managed challenge,
 *  identified by its `cf-mitigated` header) instead of data. Waiting and retrying can't clear
 *  that — it's a decision about what kind of client this is, not a rate limit — so it's never
 *  retried, and it's named for what it is rather than reported as a bare "HTTP 429". */
export class BotChallengeError extends HttpError {
  constructor(label: string, status: number) {
    super(`${label}: blocked by a Cloudflare bot challenge (HTTP ${status})`, status);
    this.name = "BotChallengeError";
  }
}

/** Throw for a non-OK response (a BotChallengeError if it's a bot challenge, else an HttpError);
 *  a no-op otherwise. */
export function assertOk(res: Response, label: string): void {
  if (res.ok) return;
  if (res.headers.get("cf-mitigated")) throw new BotChallengeError(label, res.status);
  const header = Number(res.headers.get("retry-after"));
  throw new HttpError(`${label}: HTTP ${res.status}`, res.status, Number.isFinite(header) && header > 0 ? header * 1000 : undefined);
}

/** Worth retrying: rate limiting, server-side errors, and network failures. A 404/403/etc. won't
 *  start succeeding a second later, so those fail immediately. */
function isRetryable(err: unknown): boolean {
  if (err instanceof BotChallengeError) return false;
  return !(err instanceof HttpError) || err.status === 429 || err.status >= 500;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const MAX_BACKOFF_MS = 30_000;

/**
 * Retry a flaky request. Fetching dozens of pages makes a transient failure likely enough that
 * it shouldn't throw away the whole source — and a bare immediate retry does nothing against rate
 * limiting (HTTP 429), which is what took down the daily scan: pass `baseDelayMs` for exponential
 * backoff (base, 2x, 4x, ... capped at 30s, with jitter), which defers to the server's
 * `Retry-After` when it sends one. The default is no delay, which keeps simple callers instant.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 2, baseDelayMs = 0 }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === attempts - 1) break;
      const backoff = baseDelayMs * 2 ** i * (1 + Math.random() * 0.25);
      const requested = err instanceof HttpError ? err.retryAfterMs : undefined;
      await sleep(Math.min(requested ?? backoff, MAX_BACKOFF_MS));
    }
  }
  throw lastError;
}

/** Caps how many calls are in flight at once across *everything* that shares the limiter —
 *  unlike `mapLimit`, which bounds one list. Workday applies its rate limit per client IP, not per
 *  tenant, so ten tenants each running 6 requests at a time still looks like 60 to it. */
export function createLimiter(max: number) {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async function run<T>(fn: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
    active++;
    try {
      return await fn();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}

/** Offsets for every page after the first: pageSize, 2*pageSize, ... up to min(total, maxJobs). */
export function remainingOffsets(total: number, pageSize: number, maxJobs: number = MAX_JOBS_PER_SOURCE): number[] {
  const offsets: number[] = [];
  for (let offset = pageSize; offset < Math.min(total, maxJobs); offset += pageSize) offsets.push(offset);
  return offsets;
}
