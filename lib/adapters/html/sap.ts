import type { Adapter } from "../types";
import { fetchSuccessFactorsRegion } from "./successfactors";

const SEARCH_URL = "https://jobs.sap.com/search/";
// SAP's global site lists ~925 jobs worldwide (max startrow seen: 900) — small enough to not
// need location scoping, but kept consistent with the EY adapter's approach.
const REGIONS = ["United States", "Singapore", "Thailand"];

/**
 * jobs.sap.com runs on SAP's own SuccessFactors Career Site Builder — same `tr.data-row`
 * template as EY above (fittingly, since EY runs on SAP's product). Server-renders its full
 * listing, confirmed via plain curl: 23 Singapore-tagged and 4 Thailand-tagged postings. See
 * lib/adapters/html/successfactors.ts for the shared fetch/parse logic.
 */
export const sapAdapter: Adapter = {
  async fetch() {
    const results = await Promise.all(REGIONS.map((region) => fetchSuccessFactorsRegion("SAP", SEARCH_URL, region)));
    return results.flat();
  },
};
