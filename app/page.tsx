"use client";

import { useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { filterAndSortJobs } from "@/lib/selectors";
import { lastScanLabel } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FiltersBar } from "@/components/dashboard/FiltersBar";
import { Toolbar } from "@/components/dashboard/Toolbar";
import { JobsTable } from "@/components/dashboard/JobsTable";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return d.toDateString() === now.toDateString();
}

export default function DashboardPage() {
  const {
    jobs,
    filters,
    sortBy,
    savedOnly,
    appliedOnly,
    perPage,
    lastScanAt,
    lastScanRun,
    isScanning,
    hasHydrated,
    runScan,
  } = useJobsStore();
  const [page, setPage] = useState(1);

  const filtered = useMemo(
    () => filterAndSortJobs(jobs, filters, { savedOnly, appliedOnly, sortBy }),
    [jobs, filters, savedOnly, appliedOnly, sortBy]
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, pageCount);
  const pageJobs = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  const stats = {
    total: jobs.length,
    today: jobs.filter((j) => isToday(j.discoveredAt)).length,
    saved: jobs.filter((j) => j.saved).length,
    applied: jobs.filter((j) => j.applied).length,
  };

  if (!hasHydrated) {
    return <div className="text-sm text-fg-muted">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-fg">Job openings</h1>
          <p className="text-sm text-fg-muted">Full-time roles across your scanning scope, scanned on demand.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="text-xs text-fg-subtle">{lastScanLabel(lastScanAt)}</span>
          <Button variant="primary" onClick={() => runScan()} disabled={isScanning}>
            <RefreshCw className={`h-4 w-4 ${isScanning ? "animate-spin" : ""}`} />
            {isScanning ? "Scanning…" : "Scan now"}
          </Button>
        </div>
      </div>

      {lastScanRun && lastScanRun.errors.length > 0 && (
        <Card className="mb-4 border-loss/40 bg-loss/5 p-4">
          <p className="text-sm font-medium text-loss">
            {lastScanRun.errors.length} source{lastScanRun.errors.length > 1 ? "s" : ""} failed on the last scan
          </p>
          <ul className="mt-1 space-y-0.5 text-xs text-fg-muted">
            {lastScanRun.errors.map((e) => (
              <li key={e.sourceName}>
                <span className="font-medium text-fg">{e.sourceName}:</span> {e.message}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total tracked", value: stats.total },
          { label: "Discovered today", value: stats.today },
          { label: "Saved", value: stats.saved },
          { label: "Applied", value: stats.applied },
        ].map((s) => (
          <Card key={s.label} className="p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-fg-subtle">{s.label}</p>
            <p className="font-serif text-2xl font-semibold text-fg">{s.value}</p>
          </Card>
        ))}
      </div>

      <FiltersBar />
      <Toolbar resultCount={filtered.length} />
      <JobsTable jobs={pageJobs} startIndex={(currentPage - 1) * perPage} />

      {pageCount > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <Button variant="secondary" size="sm" disabled={currentPage <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-fg-muted">
            Page {currentPage} of {pageCount}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage >= pageCount}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
