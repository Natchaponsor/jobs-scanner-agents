"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Radar, Settings, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import { useJobsStore } from "@/store/useJobsStore";
import { filterAndSortJobs } from "@/lib/selectors";
import { exportJobsToExcel } from "@/lib/excel";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/sources", label: "Scan sources" },
];

export function NavBar() {
  const pathname = usePathname();
  const { jobs, filters, sortBy, savedOnly, appliedOnly } = useJobsStore();

  const visibleJobs = useMemo(
    () => filterAndSortJobs(jobs, filters, { savedOnly, appliedOnly, sortBy }),
    [jobs, filters, savedOnly, appliedOnly, sortBy]
  );

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Radar className="h-5 w-5 text-accent-strong" />
          <span className="font-serif text-lg font-semibold tracking-tight text-fg">Jobs Scanner Agents</span>
        </div>
        <nav className="flex items-center gap-1">
          <Link
            href={LINKS[0].href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === LINKS[0].href ? "bg-accent-tint text-accent-strong" : "text-fg-muted hover:text-fg"
            )}
          >
            {LINKS[0].label}
          </Link>

          {pathname === "/" && (
            <button
              type="button"
              onClick={() => exportJobsToExcel(visibleJobs)}
              disabled={visibleJobs.length === 0}
              aria-label="Export visible roles to Excel"
              title="Export visible roles to Excel"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-fg-muted transition-colors hover:text-fg disabled:cursor-not-allowed disabled:opacity-40"
            >
              <span className="inline-flex items-center gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Export
              </span>
            </button>
          )}

          <Link
            href={LINKS[1].href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              pathname === LINKS[1].href ? "bg-accent-tint text-accent-strong" : "text-fg-muted hover:text-fg"
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Settings className="h-3.5 w-3.5" />
              {LINKS[1].label}
            </span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
