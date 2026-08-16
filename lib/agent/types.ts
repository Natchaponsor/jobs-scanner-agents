import type { Filters } from "../types";

export type NotifyChannel = "ntfy" | "macos";
export type NotifyFrequency = "immediate" | "hourly" | "daily";

/**
 * A saved search the agent scans against and alerts on. `filters` is the exact same shape as
 * the dashboard's own filter bar, so "interesting" means exactly what it would mean if you set
 * these filters by hand and looked at the results yourself — no separate matching logic.
 */
export interface JobProfile {
  name: string;
  filters: Filters;
  notify: {
    channel: NotifyChannel;
    /** Required when channel is "ntfy" — https://ntfy.sh topic. Topics aren't authenticated by
     *  default, so pick something unguessable, not something like "my-job-alerts". */
    ntfyTopic?: string;
    /**
     * Minimum gap between notifications for this profile. The agent scans on every run
     * regardless; this only throttles how often you actually get pinged — new matches queue
     * up in state and get flushed together once the gap has passed. If the agent itself runs
     * less often than this (e.g. launchd set to run daily but a profile says "hourly"), the
     * run cadence is the real limit — this setting can only make notifications less frequent,
     * never more frequent than the agent actually runs.
     */
    frequency: NotifyFrequency;
  };
}

/** Enough about a match to render a notification later, without depending on the job still
 *  being present in a future scan (postings disappear once filled/closed). */
export interface PendingJobSummary {
  id: string;
  roleTitle: string;
  sourceName: string;
  location: string;
  url: string;
}

export interface ProfileState {
  /** Every job id (`Job.id`, `"{sourceName}::{url}"`) this profile has ever matched — once
   *  here, never queued again, even after a notification flush. */
  seenJobIds: string[];
  /** Matches queued for the next notification flush; cleared once actually sent. */
  pending: PendingJobSummary[];
  lastNotifiedAt: string | null;
}
