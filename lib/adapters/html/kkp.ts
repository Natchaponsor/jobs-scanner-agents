import type { Adapter } from "../types";
import { fetchSuccessFactorsRegion } from "./successfactors";

const SEARCH_URL = "https://careers.kkpfg.com/search/";

/**
 * careers.kkpfg.com (Kiatnakin Phatra Financial Group, a major Thai bank) runs the same SAP
 * SuccessFactors Career Site Builder template as EY/SAP above — server-renders its full
 * listing, confirmed via plain curl. ~125 jobs total, and since KKP only hires in Thailand
 * there's no need to scope by region like EY/SAP do — in fact scoping to `locationsearch=
 * Thailand` actually *undercounts* here (~75 of 125), because some rows render their location
 * in Thai script ("กรุงเทพมหานคร, ไทย") rather than English "Thailand", which the locationsearch
 * filter doesn't match. Passing an empty region returns the full unfiltered (already
 * all-Thailand) listing instead. See lib/adapters/html/successfactors.ts for the shared
 * fetch/parse logic.
 */
export const kkpAdapter: Adapter = {
  async fetch() {
    return fetchSuccessFactorsRegion("KKP", SEARCH_URL, "");
  },
};
