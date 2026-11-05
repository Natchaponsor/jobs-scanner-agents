import { describe, expect, it } from "vitest";
import { mergeJobs, pruneClosed } from "./mergeJobs";
import type { Job } from "./types";

function job(overrides: Partial<Job> & { id: string }): Job {
  return {
    sourceType: "company",
    sourceName: "Acme",
    roleTitle: "Engineer",
    function: "Software Engineer",
    locationCountry: "United States",
    locationState: "",
    locationCity: "",
    locationRaw: "",
    yearsExperience: "not-specified",
    jobType: "FT",
    workMode: "not-specified",
    workAuthorization: "n/a",
    industry: "Software",
    url: `https://example.com/${overrides.id}`,
    discoveredAt: "2026-01-01T00:00:00.000Z",
    saved: false,
    applied: false,
    appliedAt: null,
    ...overrides,
  };
}

describe("mergeJobs", () => {
  it("adds unseen jobs and counts them", () => {
    const { jobs, jobsNew } = mergeJobs([job({ id: "a" })], [job({ id: "a" }), job({ id: "b" })]);
    expect(jobs.map((j) => j.id).sort()).toEqual(["a", "b"]);
    expect(jobsNew).toBe(1);
  });
  it("keeps the existing entry, preserving saved/applied state, instead of overwriting it", () => {
    const { jobs } = mergeJobs([job({ id: "a", saved: true })], [job({ id: "a", saved: false })]);
    expect(jobs[0].saved).toBe(true);
  });
});

describe("pruneClosed", () => {
  const none = new Set<string>();

  it("removes a job the snapshot no longer lists, for a company the snapshot still covers", () => {
    const existing = [job({ id: "open" }), job({ id: "closed" })];
    const { jobs, removed } = pruneClosed(existing, [job({ id: "open" })], none);
    expect(jobs.map((j) => j.id)).toEqual(["open"]);
    expect(removed).toBe(1);
  });

  it("never removes a job you saved or applied to, even when it has closed", () => {
    const existing = [job({ id: "kept-saved", saved: true }), job({ id: "kept-applied", applied: true }), job({ id: "x" })];
    const { jobs } = pruneClosed(existing, [job({ id: "other" })], none);
    expect(jobs.map((j) => j.id).sort()).toEqual(["kept-applied", "kept-saved"]);
  });

  it("leaves alone jobs from companies the snapshot doesn't cover at all", () => {
    const existing = [job({ id: "local-only", sourceName: "OnlyScannedLocally" })];
    const { jobs, removed } = pruneClosed(existing, [job({ id: "z", sourceName: "Acme" })], none);
    expect(jobs).toHaveLength(1);
    expect(removed).toBe(0);
  });

  it("leaves alone a company whose source errored in this run, even if it still has stale jobs", () => {
    const existing = [job({ id: "stale", sourceName: "Acme" })];
    const { jobs } = pruneClosed(existing, [job({ id: "z", sourceName: "Acme" })], new Set(["Acme"]));
    expect(jobs.map((j) => j.id)).toEqual(["stale"]);
  });

  it("doesn't prune GitHub-list ('social') jobs when the snapshot has no social jobs (the list failed)", () => {
    const existing = [job({ id: "s1", sourceType: "social", sourceName: "Acme" })];
    const { jobs, removed } = pruneClosed(existing, [job({ id: "c1", sourceName: "Acme" })], none);
    expect(jobs).toHaveLength(1);
    expect(removed).toBe(0);
  });

  it("does prune social jobs once the snapshot proves the list worked", () => {
    const existing = [job({ id: "s-old", sourceType: "social", sourceName: "Acme" })];
    const { removed } = pruneClosed(existing, [job({ id: "s-new", sourceType: "social", sourceName: "Acme" })], none);
    expect(removed).toBe(1);
  });
});
