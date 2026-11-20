import type { Job } from "./types";

/**
 * The daily scan's "did this run silently lose data?" check (see scripts/scan.ts). A scan that
 * comes back with far fewer jobs than the last snapshot usually means something broke without
 * erroring (a layout change, a source returning an empty page) — so it isn't published.
 *
 * It must compare like with like, though. Jobs from a source that's been *turned off* since the
 * last snapshot, or that *errored* this run (its last-known jobs are carried forward separately),
 * are expected to be missing from the fresh results, and counting them made the check fire when
 * nothing was wrong. So only jobs from sources that are enabled and healthy are in scope.
 */
export function shrinkCheck(opts: {
  previousJobs: Job[];
  /** Jobs this run produced, before any carry-forward — i.e. from healthy, enabled sources only. */
  freshJobCount: number;
  enabledCompanyNames: ReadonlySet<string>;
  erroredNames: ReadonlySet<string>;
  /** Whether the GitHub-list ("social") source is enabled and didn't error. */
  socialHealthy: boolean;
  minRatio: number;
}): { ok: boolean; expected: number; actual: number } {
  const { previousJobs, freshJobCount, enabledCompanyNames, erroredNames, socialHealthy, minRatio } = opts;
  const expected = previousJobs.filter((job) =>
    job.sourceType === "social"
      ? socialHealthy
      : enabledCompanyNames.has(job.sourceName) && !erroredNames.has(job.sourceName)
  ).length;
  return { ok: expected === 0 || freshJobCount >= expected * minRatio, expected, actual: freshJobCount };
}
