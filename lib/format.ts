import { differenceInCalendarDays, format } from "date-fns";
import type { Job } from "./types";

/** Smallest-to-biggest display string, e.g. "Mountain View, California", "Bangkok, Thailand",
 *  "California, United States" (state known but no parsed city) — always pairs the smallest
 *  known unit with the next-biggest one for context, rather than a bare city/state that reads
 *  ambiguously on its own. */
export function locationLabel(job: Job): string {
  const city = job.locationCity !== "not-specified" ? job.locationCity : "";
  const state = job.locationState || "";
  const country = job.locationCountry !== "not-specified" ? job.locationCountry : "";

  if (city) return [city, state || country].filter(Boolean).join(", ");
  if (state) return [state, country].filter(Boolean).join(", ");
  if (country) return country;
  return job.locationRaw || "Not specified";
}

export function statusLabel(job: Job): string {
  if (job.applied) {
    return job.appliedAt ? `Applied ${format(new Date(job.appliedAt), "MMM d")}` : "Applied";
  }
  const days = differenceInCalendarDays(new Date(), new Date(job.discoveredAt));
  if (days <= 0) return "Discovered today";
  if (days === 1) return "Discovered yesterday";
  return "Opened";
}

export function lastScanLabel(lastScanAt: string | null): string {
  if (!lastScanAt) return "Never scanned";
  return `Scanned ${format(new Date(lastScanAt), "MMM d, h:mm a")}`;
}

export function lastSyncLabel(lastSyncAt: string | null): string {
  if (!lastSyncAt) return "Never synced";
  return `Synced ${format(new Date(lastSyncAt), "MMM d, h:mm a")}`;
}
