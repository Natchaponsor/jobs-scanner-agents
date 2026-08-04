import type { Adapter } from "./types";

/**
 * Scaffold for career sites that are genuinely client-rendered with no server-side content
 * and no discoverable API (currently: TikTok/lifeattiktok.com). Not a place to route sites
 * that are actively bot-mitigated (Cloudflare challenges, obfuscated/rotating API paths,
 * TLS-fingerprint blocking) — those stay `unimplemented` on principle, not because a browser
 * would technically get past them. See README's coverage table for the current breakdown.
 *
 * Not implemented in v1 — needs `npx playwright install chromium`, then real
 * page.goto/selector logic per source.identifier. Left as a clear "not yet supported" no-op
 * rather than a fake/broken scraper.
 */
export const playwrightGenericAdapter: Adapter = {
  async fetch(source) {
    throw new Error(`${source.name}: no scraper configured yet (custom career site, needs Playwright adapter)`);
  },
};
