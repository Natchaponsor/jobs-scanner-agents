"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Search } from "lucide-react";
import { useJobsStore } from "@/store/useJobsStore";
import { FUNCTION_LABELS } from "@/lib/extract";
import { COUNTRY_FILTER_OPTIONS, SUGGESTED_CITIES } from "@/lib/locations";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { YoeBucket, JobType, WorkMode, WorkAuthorization } from "@/lib/types";

const YOE_OPTIONS: { label: string; value: YoeBucket | "any" }[] = [
  { label: "Any", value: "any" },
  { label: "0-3 yrs", value: "0-3" },
  { label: "3-5 yrs", value: "3-5" },
  { label: "5-10 yrs", value: "5-10" },
  { label: "10+ yrs", value: "10+" },
];

const JOB_TYPE_OPTIONS: { label: string; value: JobType | "any" }[] = [
  { label: "Any", value: "any" },
  { label: "Full-time", value: "FT" },
  { label: "Part-time", value: "PT" },
  { label: "Internship", value: "Internship" },
];

const WORK_MODE_OPTIONS: { label: string; value: WorkMode | "any" }[] = [
  { label: "Any", value: "any" },
  { label: "In-person", value: "in-person" },
  { label: "Hybrid", value: "hybrid" },
  { label: "Remote", value: "remote" },
];

const WORK_AUTHORIZATION_OPTIONS: { label: string; value: WorkAuthorization | "any" }[] = [
  { label: "Any", value: "any" },
  { label: "US Citizen Only", value: "US Citizen Only" },
  { label: "Sponsorship Available", value: "Sponsorship Available" },
  { label: "n/a", value: "n/a" },
];

function fieldClass() {
  return "h-10 w-full rounded-lg border border-border bg-white px-3 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-accent";
}

export function FiltersBar() {
  const [showMore, setShowMore] = useState(false);
  const { filters, sources, setFilters } = useJobsStore();
  const industries = Array.from(new Set(sources.map((s) => s.industry).filter((i) => i !== "any"))).sort();

  return (
    <Card className="mb-4">
      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle" />
        <input
          value={filters.search}
          onChange={(e) => setFilters({ search: e.target.value })}
          placeholder="Search by company or role"
          className={`${fieldClass()} pl-9`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">Location</label>
          <div className="flex gap-2">
            <select
              value={filters.locationCountry}
              onChange={(e) => setFilters({ locationCountry: e.target.value, locationCity: "" })}
              className={fieldClass()}
            >
              {COUNTRY_FILTER_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <input
              value={filters.locationCity}
              onChange={(e) => setFilters({ locationCity: e.target.value })}
              placeholder="City or state"
              className={fieldClass()}
            />
          </div>
          {SUGGESTED_CITIES[filters.locationCountry] && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {SUGGESTED_CITIES[filters.locationCountry].map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setFilters({ locationCity: city })}
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors",
                    filters.locationCity === city
                      ? "border-accent bg-accent-tint text-accent-strong"
                      : "border-border text-fg-muted hover:text-fg"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">Function</label>
          <select
            value={filters.function}
            onChange={(e) => setFilters({ function: e.target.value })}
            className={fieldClass()}
          >
            <option value="any">Any function</option>
            {FUNCTION_LABELS.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
            Years of experience
          </label>
          <select
            value={filters.yearsExperience}
            onChange={(e) => setFilters({ yearsExperience: e.target.value as YoeBucket | "any" })}
            className={fieldClass()}
          >
            {YOE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Button variant="ghost" size="sm" className="mt-3" onClick={() => setShowMore((v) => !v)}>
        More filters
        {showMore ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {showMore && (
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">Job type</label>
            <select
              value={filters.jobType}
              onChange={(e) => setFilters({ jobType: e.target.value as JobType | "any" })}
              className={fieldClass()}
            >
              {JOB_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">Work mode</label>
            <select
              value={filters.workMode}
              onChange={(e) => setFilters({ workMode: e.target.value as WorkMode | "any" })}
              className={fieldClass()}
            >
              {WORK_MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">
              Work authorization
            </label>
            <select
              value={filters.workAuthorization}
              onChange={(e) => setFilters({ workAuthorization: e.target.value as WorkAuthorization | "any" })}
              disabled={filters.locationCountry !== "United States"}
              className={cn(fieldClass(), "disabled:cursor-not-allowed disabled:opacity-50")}
            >
              {WORK_AUTHORIZATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            {filters.locationCountry !== "United States" && (
              <p className="mt-1 text-xs text-fg-subtle">US jobs only</p>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-fg-subtle">Industry</label>
            <select
              value={filters.industry}
              onChange={(e) => setFilters({ industry: e.target.value })}
              className={fieldClass()}
            >
              <option value="any">Any industry</option>
              {industries.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </Card>
  );
}
