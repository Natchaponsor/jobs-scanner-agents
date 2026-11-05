import type { Job } from "./types";

/** Merge freshly-fetched jobs into what's already known, by id — a job already in the store keeps
 *  its existing entry (preserving saved/applied state) rather than being overwritten. Used by both
 *  a live scan and a GitHub snapshot sync. */
export function mergeJobs(existing: Job[], found: Job[]): { jobs: Job[]; jobsNew: number } {
  const byId = new Map(existing.map((j) => [j.id, j]));
  let jobsNew = 0;
  for (const job of found) {
    if (!byId.has(job.id)) {
      jobsNew += 1;
      byId.set(job.id, job);
    }
  }
  return { jobs: Array.from(byId.values()), jobsNew };
}

/**
 * Drop postings the daily snapshot no longer lists, so closed roles don't pile up forever
 * (merging alone only ever adds). Deliberately conservative — a job is removed only when ALL of:
 *  - you haven't saved or applied to it,
 *  - the snapshot demonstrably covers its company (the company still has other jobs in the
 *    snapshot) and that company's source didn't error in this run, and
 *  - it isn't in the snapshot.
 * Jobs from companies the snapshot doesn't cover at all (a source you only ever scanned locally,
 * or one that failed this run) are left alone. Jobs from the GitHub new-grad list ("social"
 * jobs, attributed to many different companies) are only pruned when the snapshot actually
 * contains some social jobs — i.e. when that source demonstrably worked.
 */
export function pruneClosed(
  existing: Job[],
  snapshotJobs: Job[],
  failedSourceNames: ReadonlySet<string>
): { jobs: Job[]; removed: number } {
  const snapshotIds = new Set(snapshotJobs.map((j) => j.id));
  const coveredCompanies = new Set(snapshotJobs.map((j) => j.sourceName));
  for (const name of failedSourceNames) coveredCompanies.delete(name);
  const snapshotHasSocial = snapshotJobs.some((j) => j.sourceType === "social");

  const jobs = existing.filter((job) => {
    if (job.saved || job.applied) return true;
    if (snapshotIds.has(job.id)) return true;
    if (!coveredCompanies.has(job.sourceName)) return true;
    if (job.sourceType === "social" && !snapshotHasSocial) return true;
    return false;
  });
  return { jobs, removed: existing.length - jobs.length };
}
