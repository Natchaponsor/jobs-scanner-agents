"use client";

import { Download } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { Segmented } from "@/components/ui/Segmented";
import { Button } from "@/components/ui/Button";
import { exportJobsToExcel } from "@/lib/excel";
import type { Job } from "@/lib/types";

export function Toolbar({ resultCount, visibleJobs }: { resultCount: number; visibleJobs: Job[] }) {
  const { sortBy, setSortBy, savedOnly, setSavedOnly, appliedOnly, setAppliedOnly, perPage, setPerPage } =
    useJobsStore();

  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-fg-muted">{resultCount} roles showing</p>
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={sortBy}
          onChange={setSortBy}
          options={[
            { label: "Newest", value: "newest" },
            { label: "Company", value: "company" },
          ]}
        />
        <Button variant={savedOnly ? "primary" : "secondary"} size="sm" onClick={() => setSavedOnly(!savedOnly)}>
          Saved only
        </Button>
        <Button variant={appliedOnly ? "primary" : "secondary"} size="sm" onClick={() => setAppliedOnly(!appliedOnly)}>
          Applied only
        </Button>
        <select
          value={perPage}
          onChange={(e) => setPerPage(Number(e.target.value) as 20 | 50 | 100)}
          className="h-9 rounded-lg border border-border bg-white px-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
          <option value={100}>100 / page</option>
        </select>
        <Button variant="secondary" size="sm" onClick={() => exportJobsToExcel(visibleJobs)}>
          <Download className="h-3.5 w-3.5" />
          Export
        </Button>
      </div>
    </div>
  );
}
