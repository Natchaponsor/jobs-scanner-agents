"use client";

import { Bookmark, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusLabel, locationLabel } from "@/lib/format";
import { useJobsStore } from "@/store/useJobsStore";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Job } from "@/lib/types";

export function JobsTable({ jobs, startIndex }: { jobs: Job[]; startIndex: number }) {
  const { toggleSaved, markApplied } = useJobsStore();

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No roles match your filters yet"
        subtitle="Run a scan, or loosen your filters — location, function, and years of experience all narrow the list."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-fg-subtle">
            <th className="w-12 px-4 py-3">No.</th>
            <th className="px-4 py-3">Company/ Role</th>
            <th className="px-4 py-3">Location</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job, i) => (
            <tr key={job.id} className="border-b border-border last:border-0 hover:bg-panel/50">
              <td className="px-4 py-4 align-top text-fg-subtle">{startIndex + i + 1}</td>
              <td className="px-4 py-4 align-top">
                <div className="font-serif text-base font-medium text-fg">{job.sourceName}</div>
                <div className="text-sm text-fg-muted">{job.roleTitle}</div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {job.yearsExperience !== "not-specified" && (
                    <Badge tone="accent">{job.yearsExperience} yrs</Badge>
                  )}
                  {job.workMode !== "not-specified" && <Badge tone="neutral">{job.workMode}</Badge>}
                  {job.workAuthorization !== "n/a" && <Badge tone="neutral">{job.workAuthorization}</Badge>}
                </div>
              </td>
              <td className="px-4 py-4 align-top text-fg-muted">{locationLabel(job)}</td>
              <td className="px-4 py-4 align-top">
                <Badge tone={job.applied ? "new" : "neutral"}>{statusLabel(job)}</Badge>
              </td>
              <td className="px-4 py-4 align-top">
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => toggleSaved(job.id)}
                    aria-label={job.saved ? "Unsave" : "Save"}
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
                      job.saved
                        ? "border-accent bg-accent-tint text-accent-strong"
                        : "border-border text-fg-muted hover:text-fg"
                    )}
                  >
                    <Bookmark className="h-4 w-4" fill={job.saved ? "currentColor" : "none"} />
                  </button>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => markApplied(job.id)}
                    className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-accent px-3 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
                  >
                    Apply
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
