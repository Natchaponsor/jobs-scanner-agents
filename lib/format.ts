import { differenceInCalendarDays, format } from "date-fns";
import type { Job } from "./types";

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
