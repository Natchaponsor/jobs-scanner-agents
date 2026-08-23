import type { Adapter } from "../types";
import { fetchSuccessFactorsRegion } from "./successfactors";

const SEARCH_URL = "https://careers.ey.com/ey/search/";
// EY's global SuccessFactors site lists ~7,300 jobs worldwide (max startrow seen: 7275) —
// scoped via locationsearch to the regions this scanner cares about instead of paginating
// through every EY office on the planet.
const REGIONS = ["United States", "Singapore", "Thailand"];

/**
 * careers.ey.com runs on SAP SuccessFactors' Career Site Builder (same template as SAP's own
 * jobs.sap.com below) — server-renders its full listing, confirmed via plain curl.
 * `locationsearch` genuinely filters (confirmed real Singapore- and Thailand-tagged postings),
 * unlike the free-text `q` search on some of the other consulting firms' sites. See
 * lib/adapters/html/successfactors.ts for the shared fetch/parse logic.
 */
export const eyAdapter: Adapter = {
  async fetch() {
    const results = await Promise.all(REGIONS.map((region) => fetchSuccessFactorsRegion("EY", SEARCH_URL, region)));
    return results.flat();
  },
};
