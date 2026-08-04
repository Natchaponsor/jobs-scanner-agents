"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { DEFAULT_SOURCES } from "@/lib/defaultSources";
import type { Filters, Job, ScanRun, ScanSource } from "@/lib/types";

export type SortBy = "newest" | "company";

interface JobsState {
  jobs: Job[];
  sources: ScanSource[];
  filters: Filters;
  sortBy: SortBy;
  savedOnly: boolean;
  appliedOnly: boolean;
  perPage: 20 | 50 | 100;
  lastScanAt: string | null;
  lastScanRun: ScanRun | null;
  isScanning: boolean;
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  setFilters: (patch: Partial<Filters>) => void;
  clearFilters: () => void;
  setSortBy: (v: SortBy) => void;
  setSavedOnly: (v: boolean) => void;
  setAppliedOnly: (v: boolean) => void;
  setPerPage: (v: 20 | 50 | 100) => void;

  toggleSource: (id: string) => void;
  addCustomSource: (name: string, url: string) => void;
  removeSource: (id: string) => void;

  toggleSaved: (id: string) => void;
  markApplied: (id: string) => void;
  unmarkApplied: (id: string) => void;

  runScan: () => Promise<void>;
}

export const useJobsStore = create<JobsState>()(
  persist(
    (set, get) => ({
      jobs: [],
      sources: DEFAULT_SOURCES,
      filters: DEFAULT_FILTERS,
      sortBy: "newest",
      savedOnly: false,
      appliedOnly: false,
      perPage: 20,
      lastScanAt: null,
      lastScanRun: null,
      isScanning: false,
      hasHydrated: false,

      setHasHydrated: (v) => set({ hasHydrated: v }),
      setFilters: (patch) => set((state) => ({ filters: { ...state.filters, ...patch } })),
      clearFilters: () => set({ filters: DEFAULT_FILTERS }),
      setSortBy: (v) => set({ sortBy: v }),
      setSavedOnly: (v) => set({ savedOnly: v }),
      setAppliedOnly: (v) => set({ appliedOnly: v }),
      setPerPage: (v) => set({ perPage: v }),

      toggleSource: (id) =>
        set((state) => ({
          sources: state.sources.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)),
        })),

      addCustomSource: (name, url) =>
        set((state) => ({
          sources: [
            ...state.sources,
            {
              id: `custom-${crypto.randomUUID()}`,
              category: "company",
              name,
              identifier: url,
              adapterType: "unimplemented",
              enabled: false,
              isDefault: false,
              industry: "any",
            },
          ],
        })),

      removeSource: (id) => set((state) => ({ sources: state.sources.filter((s) => s.id !== id) })),

      toggleSaved: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, saved: !j.saved } : j)),
        })),

      markApplied: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === id ? { ...j, applied: true, appliedAt: new Date().toISOString() } : j
          ),
        })),

      unmarkApplied: (id) =>
        set((state) => ({
          jobs: state.jobs.map((j) => (j.id === id ? { ...j, applied: false, appliedAt: null } : j)),
        })),

      runScan: async () => {
        const { sources, filters, jobs } = get();
        const enabledSources = sources.filter((s) => s.enabled);
        if (enabledSources.length === 0) return;

        set({ isScanning: true });
        try {
          const res = await fetch("/api/scan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sources: enabledSources, function: filters.function }),
          });
          if (!res.ok) throw new Error(`Scan failed: HTTP ${res.status}`);
          const data = (await res.json()) as { jobs: Job[]; run: ScanRun };

          const existingById = new Map(jobs.map((j) => [j.id, j]));
          let jobsNew = 0;
          for (const found of data.jobs) {
            if (!existingById.has(found.id)) {
              jobsNew += 1;
              existingById.set(found.id, found);
            }
            // If already known, keep the existing entry (preserves saved/applied state)
            // instead of overwriting with the freshly-fetched one.
          }

          set({
            jobs: Array.from(existingById.values()),
            lastScanAt: new Date().toISOString(),
            lastScanRun: { ...data.run, jobsNew },
          });
        } finally {
          set({ isScanning: false });
        }
      },
    }),
    {
      name: "jobs-scanner-agents-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        jobs: state.jobs,
        sources: state.sources,
        filters: state.filters,
        sortBy: state.sortBy,
        savedOnly: state.savedOnly,
        appliedOnly: state.appliedOnly,
        perPage: state.perPage,
        lastScanAt: state.lastScanAt,
        lastScanRun: state.lastScanRun,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
