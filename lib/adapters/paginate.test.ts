import { describe, expect, it } from "vitest";
import { mapLimit, remainingOffsets, withRetry } from "./paginate";

describe("remainingOffsets", () => {
  it("covers every page after the first, up to the total", () => {
    expect(remainingOffsets(65, 20)).toEqual([20, 40, 60]);
    expect(remainingOffsets(40, 20)).toEqual([20]);
  });
  it("returns nothing when the first page already holds everything", () => {
    expect(remainingOffsets(0, 20)).toEqual([]);
    expect(remainingOffsets(20, 20)).toEqual([]);
    expect(remainingOffsets(7, 20)).toEqual([]);
  });
  it("stops at the per-source ceiling instead of paging through a huge listing", () => {
    expect(remainingOffsets(10_000, 100, 300)).toEqual([100, 200]);
  });
});

describe("mapLimit", () => {
  it("preserves input order even when later items finish first", async () => {
    const out = await mapLimit([30, 5, 15, 1], 4, async (ms) => {
      await new Promise((r) => setTimeout(r, ms));
      return ms;
    });
    expect(out).toEqual([30, 5, 15, 1]);
  });
  it("never has more than `limit` calls in flight", async () => {
    let inFlight = 0;
    let peak = 0;
    await mapLimit(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((r) => setTimeout(r, 2));
      inFlight--;
    });
    expect(peak).toBeLessThanOrEqual(3);
  });
  it("handles an empty list", async () => {
    expect(await mapLimit([], 5, async (x) => x)).toEqual([]);
  });
});

describe("withRetry", () => {
  it("retries once and returns the second attempt's result", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls++;
      if (calls === 1) throw new Error("transient");
      return "ok";
    });
    expect(result).toBe("ok");
    expect(calls).toBe(2);
  });
  it("gives up and rethrows after the last attempt", async () => {
    await expect(withRetry(async () => { throw new Error("down"); })).rejects.toThrow("down");
  });
});
