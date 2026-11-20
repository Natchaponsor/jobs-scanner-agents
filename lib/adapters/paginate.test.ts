import { describe, expect, it } from "vitest";
import { BotChallengeError, HttpError, assertOk, createLimiter, mapLimit, remainingOffsets, withRetry } from "./paginate";

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

describe("withRetry — rate limiting", () => {
  const rateLimited = (retryAfterMs?: number) => new HttpError("Workday: HTTP 429", 429, retryAfterMs);

  it("retries a 429 with backoff and succeeds once the server lets up", async () => {
    let calls = 0;
    const result = await withRetry(
      async () => {
        calls++;
        if (calls < 3) throw rateLimited();
        return "ok";
      },
      { attempts: 5, baseDelayMs: 1 }
    );
    expect(result).toBe("ok");
    expect(calls).toBe(3);
  });

  it("waits at least as long as the server's Retry-After asked", async () => {
    let calls = 0;
    const start = Date.now();
    await withRetry(
      async () => {
        calls++;
        if (calls === 1) throw rateLimited(60);
        return "ok";
      },
      { attempts: 2, baseDelayMs: 1 }
    );
    expect(Date.now() - start).toBeGreaterThanOrEqual(55);
  });

  it("does not retry an error that can't start succeeding (404, 403)", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => { calls++; throw new HttpError("HTTP 404", 404); }, { attempts: 5, baseDelayMs: 1 })
    ).rejects.toThrow("404");
    expect(calls).toBe(1);
  });

  it("does retry server errors", async () => {
    let calls = 0;
    await withRetry(async () => { calls++; if (calls === 1) throw new HttpError("HTTP 503", 503); return 1; }, { attempts: 3, baseDelayMs: 1 });
    expect(calls).toBe(2);
  });

  it("gives up after the configured attempts", async () => {
    let calls = 0;
    await expect(withRetry(async () => { calls++; throw rateLimited(); }, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow("429");
    expect(calls).toBe(3);
  });
});

describe("assertOk", () => {
  it("passes a 2xx response through", () => {
    expect(() => assertOk(new Response("{}", { status: 200 }), "x")).not.toThrow();
  });
  it("throws an HttpError carrying the status and Retry-After (in ms)", () => {
    const res = new Response("", { status: 429, headers: { "retry-after": "7" } });
    try {
      assertOk(res, "Workday Adobe");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(HttpError);
      expect((err as HttpError).status).toBe(429);
      expect((err as HttpError).retryAfterMs).toBe(7000);
      expect((err as Error).message).toBe("Workday Adobe: HTTP 429");
    }
  });
});

describe("Cloudflare bot challenges", () => {
  const challenge = () => new Response("Security Check", { status: 429, headers: { "cf-mitigated": "challenge" } });

  it("assertOk names a challenge for what it is, not a bare 429", () => {
    try {
      assertOk(challenge(), "Workday Adobe");
      throw new Error("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(BotChallengeError);
      expect((err as Error).message).toBe("Workday Adobe: blocked by a Cloudflare bot challenge (HTTP 429)");
    }
  });

  it("is never retried — waiting can't clear a challenge — even though it's a 429", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => { calls++; assertOk(challenge(), "x"); }, { attempts: 6, baseDelayMs: 1 })
    ).rejects.toBeInstanceOf(BotChallengeError);
    expect(calls).toBe(1);
  });

  it("a plain 429 without the cf-mitigated header is still treated as ordinary rate limiting", () => {
    expect(() => assertOk(new Response("", { status: 429 }), "x")).toThrow(HttpError);
    expect(() => assertOk(new Response("", { status: 429 }), "x")).not.toThrow(BotChallengeError);
  });
});

describe("createLimiter", () => {
  it("caps in-flight calls across every caller sharing it, not just within one list", async () => {
    const limit = createLimiter(3);
    let inFlight = 0;
    let peak = 0;
    const task = () =>
      limit(async () => {
        inFlight++;
        peak = Math.max(peak, inFlight);
        await new Promise((r) => setTimeout(r, 3));
        inFlight--;
      });
    // Two independent "sources", each launching 10 at once — 20 callers, one limiter.
    await Promise.all([...Array.from({ length: 10 }, task), ...Array.from({ length: 10 }, task)]);
    expect(peak).toBeLessThanOrEqual(3);
  });
  it("still returns every result and propagates errors", async () => {
    const limit = createLimiter(2);
    expect(await Promise.all([1, 2, 3, 4].map((n) => limit(async () => n * 2)))).toEqual([2, 4, 6, 8]);
    await expect(limit(async () => { throw new Error("boom"); })).rejects.toThrow("boom");
    expect(await limit(async () => "still works")).toBe("still works");
  });
});
