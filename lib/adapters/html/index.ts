import type { Adapter } from "../types";
import { googleAdapter } from "./google";
import { twoSigmaAdapter } from "./twosigma";
import { linemanWongnaiAdapter } from "./linemanwongnai";
import { intuitAdapter } from "./intuit";
import { blackrockAdapter } from "./blackrock";
import { bcgAdapter } from "./bcg";
import { deloitteAdapter } from "./deloitte";
import { eyAdapter } from "./ey";
import { pwcAdapter } from "./pwc";
import { kpmgAdapter } from "./kpmg";
import { ciscoAdapter } from "./cisco";
import { ebayAdapter } from "./ebay";
import { hsbcAdapter } from "./hsbc";
import { sapAdapter } from "./sap";
import { airasiaAdapter } from "./airasia";
import { optiverAdapter } from "./optiver";

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
  "co-bcg": bcgAdapter,
  "co-deloitte": deloitteAdapter,
  "co-ey": eyAdapter,
  "co-pwc": pwcAdapter,
  "co-kpmg": kpmgAdapter,
  "co-cisco": ciscoAdapter,
  "co-ebay": ebayAdapter,
  "co-hsbc": hsbcAdapter,
  "co-sap": sapAdapter,
  "co-airasia": airasiaAdapter,
  "co-optiver": optiverAdapter,
};

export const htmlScrapeAdapter: Adapter = {
  async fetch(source, query) {
    const scraper = HTML_SCRAPERS[source.id];
    if (!scraper) throw new Error(`${source.name}: no HTML scraper registered for this source yet`);
    return scraper.fetch(source, query);
  },
};
