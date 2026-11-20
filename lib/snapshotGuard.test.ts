import { describe, expect, it } from "vitest";
import { shrinkCheck } from "./snapshotGuard";
import type { Job } from "./types";

const job = (sourceName: string, i: number, sourceType: Job["sourceType"] = "company"): Job =>
  ({ id: `${sourceName}-${i}`, sourceName, sourceType } as Job);
const many = (name: string, n: number, type: Job["sourceType"] = "company") => Array.from({ length: n }, (_, i) => job(name, i, type));
const names = (...n: string[]) => new Set(n);

const base = { erroredNames: names(), socialHealthy: true, minRatio: 0.7 };

describe("shrinkCheck", () => {
  it("passes when the fresh count holds up", () => {
    const r = shrinkCheck({ ...base, previousJobs: many("A", 100), freshJobCount: 95, enabledCompanyNames: names("A") });
    expect(r.ok).toBe(true);
  });

  it("fails on silent shrinkage in a healthy, enabled source", () => {
    const r = shrinkCheck({ ...base, previousJobs: many("A", 100), freshJobCount: 40, enabledCompanyNames: names("A") });
    expect(r).toMatchObject({ ok: false, expected: 100, actual: 40 });
  });

  it("ignores jobs from sources that have since been turned off", () => {
    // 100 of A's jobs plus 50 of B's, but B is now disabled — only A's 100 should be expected.
    const r = shrinkCheck({ ...base, previousJobs: [...many("A", 100), ...many("B", 50)], freshJobCount: 100, enabledCompanyNames: names("A") });
    expect(r).toMatchObject({ ok: true, expected: 100 });
  });

  it("ignores jobs from sources that errored this run (they're carried forward separately)", () => {
    const r = shrinkCheck({
      ...base,
      previousJobs: [...many("A", 100), ...many("Down", 100)],
      freshJobCount: 100,
      enabledCompanyNames: names("A", "Down"),
      erroredNames: names("Down"),
    });
    expect(r).toMatchObject({ ok: true, expected: 100 });
  });

  it("only expects GitHub-list ('social') jobs when that source is healthy", () => {
    const previousJobs = [...many("A", 10), ...many("Stripe", 90, "social")];
    expect(shrinkCheck({ ...base, previousJobs, freshJobCount: 10, enabledCompanyNames: names("A"), socialHealthy: false }).ok).toBe(true);
    expect(shrinkCheck({ ...base, previousJobs, freshJobCount: 10, enabledCompanyNames: names("A"), socialHealthy: true }).ok).toBe(false);
  });

  it("passes on a first run with nothing to compare against", () => {
    expect(shrinkCheck({ ...base, previousJobs: [], freshJobCount: 5, enabledCompanyNames: names("A") }).ok).toBe(true);
  });
});
