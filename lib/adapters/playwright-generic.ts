import type { Adapter } from "./types";

/**
 * Scaffold for custom career sites without a public JSON API (Google, Microsoft, TikTok,
 * Agoda, JPMorgan, Amex, Two Sigma, Citadel, Column). Not implemented in v1 — these sites
 * need per-company Playwright scripts (install with `npx playwright install chromium`,
 * then extend this adapter with real page.goto/selector logic per source.identifier).
 *
 * Left as a clear "not yet supported" no-op rather than a fake/broken scraper.
 */
export const playwrightGenericAdapter: Adapter = {
  async fetch(source) {
    throw new Error(`${source.name}: no scraper configured yet (custom career site, needs Playwright adapter)`);
  },
};
