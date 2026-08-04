import type { Filters, Job } from "./types";
import type { SortBy } from "@/store/useJobsStore";

export function filterAndSortJobs(
  jobs: Job[],
  filters: Filters,
  opts: { savedOnly: boolean; appliedOnly: boolean; sortBy: SortBy }
): Job[] {
  const search = filters.search.trim().toLowerCase();

  const filtered = jobs.filter((job) => {
    if (opts.savedOnly && !job.saved) return false;
    if (opts.appliedOnly && !job.applied) return false;

    if (filters.locationCountry !== "any" && job.locationCountry !== "not-specified") {
      if (job.locationCountry !== filters.locationCountry) return false;
    }
    const cityQuery = filters.locationCity.trim().toLowerCase();
    if (cityQuery && job.locationCity !== "not-specified") {
      const haystack = `${job.locationCity} ${job.locationState}`.toLowerCase();
      if (!haystack.includes(cityQuery)) return false;
    }
    if (filters.function.trim() && filters.function !== "any") {
      if (job.function.toLowerCase() !== filters.function.trim().toLowerCase()) return false;
    }
    if (filters.yearsExperience !== "any" && job.yearsExperience !== "not-specified") {
      if (job.yearsExperience !== filters.yearsExperience) return false;
    }
    if (filters.jobType !== "any" && job.jobType !== filters.jobType) return false;
    if (filters.workMode !== "any" && job.workMode !== "not-specified") {
      if (job.workMode !== filters.workMode) return false;
    }
    if (filters.industry !== "any" && job.industry !== filters.industry) return false;

    if (search) {
      const haystack = `${job.sourceName} ${job.roleTitle}`.toLowerCase();
      if (!haystack.includes(search)) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (opts.sortBy === "company") return a.sourceName.localeCompare(b.sourceName);
    return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime();
  });

  return sorted;
}
