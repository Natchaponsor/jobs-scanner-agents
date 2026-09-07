"use client";

import { Fragment, useState } from "react";
import { Bookmark, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/cn";
import { statusLabel, locationLabel } from "@/lib/format";
import { useJobsStore } from "@/store/useJobsStore";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Job } from "@/lib/types";

interface CompanyGroup {
  company: string;
  jobs: Job[];
}

/** Stable group-by: a company's position in the list is set by its first occurrence, so
 *  sorting by "Newest" still clusters correctly whenever a company's roles were discovered
 *  together (the common case), and sorting by "Company" clusters them perfectly every time. */
function groupByCompany(jobs: Job[]): CompanyGroup[] {
  const order: string[] = [];
  const byCompany = new Map<string, Job[]>();
  for (const job of jobs) {
    if (!byCompany.has(job.sourceName)) {
      byCompany.set(job.sourceName, []);
      order.push(job.sourceName);
    }
    byCompany.get(job.sourceName)!.push(job);
  }
  return order.map((company) => ({ company, jobs: byCompany.get(company)! }));
}

function commonFunction(jobs: Job[]): string | null {
  const first = jobs[0].function;
  return jobs.every((j) => j.function === first) ? first : null;
}

function commonLocation(jobs: Job[]): string | null {
  const first = locationLabel(jobs[0]);
  return jobs.every((j) => locationLabel(j) === first) ? first : null;
}

function ActionButtons({ job }: { job: Job }) {
  const { toggleSaved, markApplied } = useJobsStore();
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={() => toggleSaved(job.id)}
        aria-label={job.saved ? "Unsave" : "Save"}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border transition-colors",
          job.saved ? "border-accent bg-accent-tint text-accent-strong" : "border-border text-fg-muted hover:text-fg"
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
  );
}

function JobRow({ job, number, nested }: { job: Job; number: number | null; nested?: boolean }) {
  return (
    <tr className={cn("border-b border-border last:border-0 hover:bg-panel/50", nested && "bg-panel/30")}>
      <td className="px-4 py-4 align-top text-fg-subtle">{number ?? ""}</td>
      <td className={cn("px-4 py-4 align-top", nested && "pl-9")}>
        {!nested && <div className="font-serif text-base font-medium text-fg">{job.sourceName}</div>}
        <div className="text-sm text-fg-muted">{job.roleTitle}</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {job.yearsExperience !== "not-specified" && <Badge tone="accent">{job.yearsExperience} yrs</Badge>}
          {job.workMode !== "not-specified" && <Badge tone="neutral">{job.workMode}</Badge>}
          {job.workAuthorization !== "n/a" && <Badge tone="neutral">{job.workAuthorization}</Badge>}
        </div>
      </td>
      <td className="px-4 py-4 align-top text-fg-muted">{locationLabel(job)}</td>
      <td className="px-4 py-4 align-top">
        <Badge tone={job.applied ? "new" : "neutral"}>{statusLabel(job)}</Badge>
      </td>
      <td className="px-4 py-4 align-top">
        <ActionButtons job={job} />
      </td>
    </tr>
  );
}

function ClusterHeaderRow({
  number,
  group,
  isOpen,
  onToggle,
}: {
  number: number;
  group: CompanyGroup;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const fn = commonFunction(group.jobs);
  const loc = commonLocation(group.jobs);
  return (
    <tr className="border-b border-border last:border-0 hover:bg-panel/50">
      <td className="px-4 py-4 align-top text-fg-subtle">{number}</td>
      <td className="px-4 py-4 align-top">
        <button type="button" onClick={onToggle} className="flex w-full min-w-0 flex-col items-start text-left">
          <span className="flex items-center gap-1.5">
            <span className="font-serif text-base font-medium text-fg">{group.company}</span>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 shrink-0 text-fg-subtle" />
            ) : (
              <ChevronRight className="h-4 w-4 shrink-0 text-fg-subtle" />
            )}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <Badge tone="accent">{group.jobs.length} roles</Badge>
            {fn && <span className="text-sm text-fg-muted">{fn}</span>}
          </span>
        </button>
      </td>
      <td className="px-4 py-4 align-top text-fg-muted">{loc ?? `${group.jobs.length} locations`}</td>
      <td className="px-4 py-4 align-top text-fg-subtle">—</td>
      <td className="px-4 py-4 align-top text-right">
        <button
          type="button"
          onClick={onToggle}
          className="inline-flex h-9 items-center rounded-lg border border-border px-3 text-sm font-medium text-fg-muted transition-colors hover:text-fg"
        >
          {isOpen ? "Hide roles" : "View roles"}
        </button>
      </td>
    </tr>
  );
}

export function JobsTable({ jobs, startIndex }: { jobs: Job[]; startIndex: number }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  if (jobs.length === 0) {
    return (
      <EmptyState
        title="No roles match your filters yet"
        subtitle="Run a scan, or loosen your filters — location, function, and years of experience all narrow the list."
      />
    );
  }

  const groups = groupByCompany(jobs);

  function toggle(company: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(company)) next.delete(company);
      else next.add(company);
      return next;
    });
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
          {groups.map((group, gi) => {
            const number = startIndex + gi + 1;
            if (group.jobs.length === 1) {
              return <JobRow key={group.jobs[0].id} job={group.jobs[0]} number={number} />;
            }
            const isOpen = expanded.has(group.company);
            return (
              <Fragment key={group.company}>
                <ClusterHeaderRow number={number} group={group} isOpen={isOpen} onToggle={() => toggle(group.company)} />
                {isOpen && group.jobs.map((job) => <JobRow key={job.id} job={job} number={null} nested />)}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
