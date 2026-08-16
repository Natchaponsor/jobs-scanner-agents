import { runScan } from "../runScan";
import { filterAndSortJobs } from "../selectors";
import { DEFAULT_SOURCES } from "../defaultSources";
import { loadState, saveState } from "./state";
import { notify } from "./notify";
import type { Job } from "../types";
import type { JobProfile, PendingJobSummary } from "./types";

const FREQUENCY_MS: Record<JobProfile["notify"]["frequency"], number> = {
  immediate: 0,
  hourly: 60 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
};

function toSummary(job: Job): PendingJobSummary {
  return {
    id: job.id,
    roleTitle: job.roleTitle,
    sourceName: job.sourceName,
    location: job.locationCity || job.locationCountry || job.locationRaw,
    url: job.url,
  };
}

export async function runProfileOnce(profile: JobProfile, opts: { dryRun: boolean }): Promise<void> {
  const state = loadState(profile.name);
  const sources = DEFAULT_SOURCES.filter((s) => s.enabled);

  const { jobs, run } = await runScan(sources, profile.filters.function);
  if (run.errors.length > 0) {
    console.warn(
      `[${profile.name}] ${run.errors.length} source(s) failed: ${run.errors.map((e) => e.sourceName).join(", ")}`
    );
  }

  const matches = filterAndSortJobs(jobs, profile.filters, { savedOnly: false, appliedOnly: false, sortBy: "newest" });

  const seen = new Set(state.seenJobIds);
  const newMatches = matches.filter((j) => !seen.has(j.id));
  for (const j of newMatches) seen.add(j.id);
  state.seenJobIds = Array.from(seen);
  state.pending = [...state.pending, ...newMatches.map(toSummary)];

  console.log(
    `[${profile.name}] scanned ${sources.length} source(s), ${matches.length} match the filters, ${newMatches.length} new, ${state.pending.length} pending notification`
  );

  const minGap = FREQUENCY_MS[profile.notify.frequency];
  const dueForNotification =
    state.pending.length > 0 &&
    (!state.lastNotifiedAt || Date.now() - new Date(state.lastNotifiedAt).getTime() >= minGap);

  if (dueForNotification) {
    await notify(profile, state.pending, opts.dryRun);
    if (!opts.dryRun) {
      state.pending = [];
      state.lastNotifiedAt = new Date().toISOString();
    }
  }

  if (!opts.dryRun) saveState(profile.name, state);
}
