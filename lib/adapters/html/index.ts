import type { Adapter } from "../types";
import { googleAdapter } from "./google";
import { twoSigmaAdapter } from "./twosigma";
import { linemanWongnaiAdapter } from "./linemanwongnai";
import { intuitAdapter } from "./intuit";
import { blackrockAdapter } from "./blackrock";

/**
 * HTML structure isn't standardized like an ATS API, so each company gets its own parser.
 * Dispatches by `source.id` (see lib/defaultSources.ts) rather than a shared identifier shape.
 */
const HTML_SCRAPERS: Record<string, Adapter> = {
  "co-google": googleAdapter,
  "co-twosigma": twoSigmaAdapter,
  "co-linemanwongnai": linemanWongnaiAdapter,
  "co-intuit": intuitAdapter,
  "co-blackrock": blackrockAdapter,
};

export const htmlScrapeAdapter: Adapter = {
  async fetch(source, query) {
    const scraper = HTML_SCRAPERS[source.id];
    if (!scraper) throw new Error(`${source.name}: no HTML scraper registered for this source yet`);
    return scraper.fetch(source, query);
  },
};
