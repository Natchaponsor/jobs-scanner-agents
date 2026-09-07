"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { DEFAULT_FILTERS } from "@/lib/filters";
import { DEFAULT_SOURCES } from "@/lib/defaultSources";
import { WORKING_ADAPTER_TYPES } from "@/lib/types";
import type { Filters, Job, ScanRun, ScanSource, SourceGroup } from "@/lib/types";

export type SortBy = "newest" | "company";

/** The repo's daily GitHub Actions workflow (.github/workflows/daily-scan.yml) commits its
 *  scan result here — see scripts/scan.ts and README's "Running the daily scan on GitHub"
 *  section. raw.githubusercontent.com serves this with permissive CORS, so the browser can
 *  fetch it directly with no proxy route needed. */
const GITHUB_SNAPSHOT_URL = "https://raw.githubusercontent.com/Natchaponsor/jobs-scanner-agents/main/data/jobs.json";

/** Shared by runScan and syncFromGithub: merge freshly-fetched jobs into what's already known,
 *  by id — a job already in the store keeps its existing entry (preserving saved/applied
 *  state) rather than being overwritten by the newly-fetched one. */
function mergeJobs(existing: Job[], found: Job[]): { jobs: Job[]; jobsNew: number } {
  const existingById = new Map(existing.map((j) => [j.id, j]));
  let jobsNew = 0;
  for (const job of found) {
    if (!existingById.has(job.id)) {
      jobsNew += 1;
      existingById.set(job.id, job);
    }
  }
  return { jobs: Array.from(existingById.values()), jobsNew };
}

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
  /** Distinct from lastScanAt/lastScanRun — this is when jobs were last pulled in from the
   *  GitHub Actions daily snapshot rather than a live local scan. */
  lastSyncAt: string | null;
  lastSyncRun: ScanRun | null;
  isSyncing: boolean;
  hasHydrated: boolean;

  setHasHydrated: (v: boolean) => void;
  setFilters: (patch: Partial<Filters>) => void;
  clearFilters: () => void;
  setSortBy: (v: SortBy) => void;
  setSavedOnly: (v: boolean) => void;
  setAppliedOnly: (v: boolean) => void;
  setPerPage: (v: 20 | 50 | 100) => void;

  toggleSource: (id: string) => void;
  setGroupEnabled: (group: SourceGroup, enabled: boolean) => void;
  addCustomSource: (name: string, url: string) => void;
  removeSource: (id: string) => void;

  toggleSaved: (id: string) => void;
  markApplied: (id: string) => void;
  unmarkApplied: (id: string) => void;

  runScan: () => Promise<void>;
  syncFromGithub: () => Promise<void>;
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
      lastSyncAt: null,
      lastSyncRun: null,
      isSyncing: false,
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

      setGroupEnabled: (group, enabled) =>
        set((state) => ({
          sources: state.sources.map((s) =>
            s.group === group && WORKING_ADAPTER_TYPES.includes(s.adapterType) ? { ...s, enabled } : s
          ),
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
              group: null,
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

          const { jobs: merged, jobsNew } = mergeJobs(jobs, data.jobs);
          set({
            jobs: merged,
            lastScanAt: new Date().toISOString(),
            lastScanRun: { ...data.run, jobsNew },
          });
        } finally {
          set({ isScanning: false });
        }
      },

      syncFromGithub: async () => {
        const { jobs } = get();
        set({ isSyncing: true });
        try {
          const res = await fetch(GITHUB_SNAPSHOT_URL, { cache: "no-store" });
          if (!res.ok) throw new Error(`Sync failed: HTTP ${res.status}`);
          const data = (await res.json()) as { jobs: Job[]; run: ScanRun };

          const { jobs: merged, jobsNew } = mergeJobs(jobs, data.jobs);
          set({
            jobs: merged,
            lastSyncAt: new Date().toISOString(),
            lastSyncRun: { ...data.run, jobsNew },
          });
        } finally {
          set({ isSyncing: false });
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
        lastSyncAt: state.lastSyncAt,
        lastSyncRun: state.lastSyncRun,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
      // Sources are persisted wholesale, so a browser with existing state would otherwise
      // never pick up companies added to DEFAULT_SOURCES later (e.g. Column/Google/Two
      // Sigma/JPMorgan added after v1). Merge on load: sync each default source's config
      // (identifier/adapterType/etc.) from code while preserving the user's enabled/disabled
      // choice, add any new defaults that aren't in storage yet, and keep custom sources as-is.
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<JobsState> | undefined;
        if (!persisted?.sources) return { ...currentState, ...persisted };

        const persistedById = new Map(persisted.sources.map((s) => [s.id, s]));
        const mergedDefaults = DEFAULT_SOURCES.map((def) => {
          const existing = persistedById.get(def.id);
          return existing ? { ...def, enabled: existing.enabled } : def;
        });
        const customSources = persisted.sources.filter((s) => !s.isDefault);

        return {
          ...currentState,
          ...persisted,
          sources: [...mergedDefaults, ...customSources],
        };
      },
    }
  )
);
