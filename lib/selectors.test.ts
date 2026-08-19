import { describe, expect, it } from "vitest";
import { filterAndSortJobs } from "./selectors";
import { DEFAULT_FILTERS } from "./filters";
import type { Filters, Job } from "./types";

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: overrides.id ?? Math.random().toString(36),
    sourceType: "company",
    sourceName: "Acme",
    roleTitle: "Software Engineer",
    function: "Software Engineer",
    locationCountry: "United States",
    locationState: "CA",
    locationCity: "San Francisco",
    locationRaw: "San Francisco, CA",
    yearsExperience: "3-5",
    jobType: "FT",
    workMode: "remote",
    workAuthorization: "n/a",
    industry: "Software",
    url: "https://example.com/job",
    discoveredAt: new Date().toISOString(),
    saved: false,
    applied: false,
    appliedAt: null,
    ...overrides,
  };
}

// Isolates the filter under test: no location/function/etc. narrowing.
const baseFilters: Filters = { ...DEFAULT_FILTERS, locationCountry: "any", locationCity: "", function: "any" };
const opts = { savedOnly: false, appliedOnly: false, sortBy: "newest" as const };

describe("filterAndSortJobs — work authorization filter", () => {
  it("passes every job through when the filter is 'any'", () => {
    const jobs = [
      makeJob({ id: "1", workAuthorization: "US Citizen Only" }),
      makeJob({ id: "2", workAuthorization: "Sponsorship Available" }),
      makeJob({ id: "3", workAuthorization: "n/a" }),
      makeJob({ id: "4", locationCountry: "Thailand", workAuthorization: "n/a" }),
    ];
    const result = filterAndSortJobs(jobs, { ...baseFilters, workAuthorization: "any" }, opts);
    expect(result).toHaveLength(4);
  });

  it("restricts US jobs to the selected work authorization value", () => {
    const jobs = [
      makeJob({ id: "us-citizen", locationCountry: "United States", workAuthorization: "US Citizen Only" }),
      makeJob({ id: "us-sponsor", locationCountry: "United States", workAuthorization: "Sponsorship Available" }),
      makeJob({ id: "us-na", locationCountry: "United States", workAuthorization: "n/a" }),
    ];
    const result = filterAndSortJobs(jobs, { ...baseFilters, workAuthorization: "US Citizen Only" }, opts);
    expect(result.map((j) => j.id)).toEqual(["us-citizen"]);
  });

  it("[feature] never excludes non-US jobs, regardless of the selected value — the filter is US-only by design", () => {
    const jobs = [
      makeJob({ id: "th", locationCountry: "Thailand", workAuthorization: "n/a" }),
      makeJob({ id: "sg", locationCountry: "Singapore", workAuthorization: "n/a" }),
      makeJob({ id: "us-mismatch", locationCountry: "United States", workAuthorization: "Sponsorship Available" }),
    ];
    const result = filterAndSortJobs(jobs, { ...baseFilters, workAuthorization: "US Citizen Only" }, opts);
    // Thailand and Singapore postings pass through untouched even though neither is
    // "US Citizen Only" — only the US posting is actually held to the filter, and it's
    // correctly excluded since it doesn't match.
    expect(result.map((j) => j.id).sort()).toEqual(["sg", "th"]);
  });

  it("combines with other filters normally (e.g. explicitly scoping to United States)", () => {
    const jobs = [
      makeJob({ id: "us-match", locationCountry: "United States", workAuthorization: "Sponsorship Available" }),
      makeJob({ id: "us-miss", locationCountry: "United States", workAuthorization: "US Citizen Only" }),
      makeJob({ id: "th-would-match", locationCountry: "Thailand", workAuthorization: "n/a" }),
    ];
    const result = filterAndSortJobs(
      jobs,
      { ...baseFilters, locationCountry: "United States", workAuthorization: "Sponsorship Available" },
      opts
    );
    expect(result.map((j) => j.id)).toEqual(["us-match"]);
  });
});
