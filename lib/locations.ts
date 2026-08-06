/**
 * Location classification and filtering. Real posting location strings are wildly
 * inconsistent across ATSs — multi-location semicolon lists, 2/3-letter country codes,
 * "US-Remote" style prefixes, bare city names with no country at all. The old approach
 * (split on comma, treat the last segment as the country) only worked for the clean
 * "City, ST"/"City, Country" case and left the majority of postings "not-specified" or
 * misclassified (e.g. "San Francisco" ending up as the country). This scans the *entire*
 * raw string for keyword signals instead, which is far more robust for the same reason
 * the extraction rules in lib/extract.ts work on raw text rather than a rigid format.
 */

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", FL: "Florida", GA: "Georgia",
  HI: "Hawaii", ID: "Idaho", IL: "Illinois", IN: "Indiana", IA: "Iowa",
  KS: "Kansas", KY: "Kentucky", LA: "Louisiana", ME: "Maine", MD: "Maryland",
  MA: "Massachusetts", MI: "Michigan", MN: "Minnesota", MS: "Mississippi", MO: "Missouri",
  MT: "Montana", NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota", OH: "Ohio",
  OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont",
  VA: "Virginia", WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
  DC: "District of Columbia",
};
const US_STATE_ABBR_RE = new RegExp(`\\b(${Object.keys(US_STATES).join("|")})\\b`);
const US_STATE_NAME_RE = new RegExp(`\\b(${Object.values(US_STATES).join("|")})\\b`, "i");

/** Countries that make up the "APAC" filter bucket, excluding Singapore/Thailand — those
 *  get their own dedicated filter option instead of being folded into the broader group. */
export const APAC_OTHER_COUNTRIES = [
  "Japan", "India", "Australia", "South Korea", "China", "Taiwan", "Hong Kong",
  "Indonesia", "Malaysia", "Philippines", "Vietnam", "New Zealand",
];

const APAC_OTHER_PATTERNS: [string, RegExp][] = [
  ["Japan", /\bjapan\b|\btokyo\b|\bjpn\b/i],
  ["India", /\bindia\b|\bbangalore\b|\bbengaluru\b|\bmumbai\b|\bhyderabad\b|\bpune\b|\bgurgaon\b|\bgurugram\b|\bind\b/i],
  ["Australia", /\baustralia\b|\bsydney\b|\bmelbourne\b|\baus\b/i],
  ["South Korea", /\bsouth korea\b|\bkorea\b|\bseoul\b|\bkor\b/i],
  ["China", /\bchina\b|\bshanghai\b|\bbeijing\b|\bshenzhen\b|\bchn\b/i],
  ["Taiwan", /\btaiwan\b|\btaipei\b|\btwn\b/i],
  ["Hong Kong", /\bhong kong\b|\bhkg\b/i],
  ["Indonesia", /\bindonesia\b|\bjakarta\b|\bidn\b/i],
  ["Malaysia", /\bmalaysia\b|\bkuala lumpur\b|\bmys\b/i],
  ["Philippines", /\bphilippines\b|\bmanila\b|\bphl\b/i],
  ["Vietnam", /\bvietnam\b|\bhanoi\b|\bho chi minh\b|\bvnm\b/i],
  ["New Zealand", /\bnew zealand\b|\bauckland\b|\bnzl\b/i],
];

/** Checked ahead of the US fallback specifically to stop Canadian postings using a bare
 *  "CA" prefix (e.g. "CA-Remote-Ontario") from being swept up as California/United States. */
const CANADA_RE = /\bcanada\b|\bontario\b|\btoronto\b|\bvancouver\b|\bmontreal\b|\bquebec\b/i;

/** Explicit names for other frequently-seen countries so they display correctly and don't
 *  fall through to the (much weaker) last-comma-segment guess. Not exhaustive — anything
 *  else still falls back to that guess, or "not-specified". */
const OTHER_COUNTRY_PATTERNS: [string, RegExp][] = [
  ["Ireland", /\bireland\b|\bdublin\b/i],
  ["Germany", /\bgermany\b|\bmunich\b|\bberlin\b/i],
  ["France", /\bfrance\b|\bparis\b/i],
  ["Spain", /\bspain\b|\bmadrid\b|\bbarcelona\b/i],
  ["Netherlands", /\bnetherlands\b|\bamsterdam\b/i],
  ["Switzerland", /\bswitzerland\b|\bzurich\b/i],
  ["Sweden", /\bsweden\b|\bstockholm\b/i],
  ["Mexico", /\bmexico\b/i],
  ["Brazil", /\bbrazil\b/i],
  ["Israel", /\bisrael\b/i],
  ["UAE", /\buae\b|\bdubai\b|\babu dhabi\b/i],
];

const SINGAPORE_RE = /\bsingapore\b|\bsgp\b/i;
const THAILAND_RE = /\bthailand\b|\bbangkok\b|\btha\b/i;
const UK_RE = /\bunited kingdom\b|\bengland\b|\bscotland\b|\bwales\b|\blondon\b|\bgbr\b|\buk\b/i;
const US_RE = /\bunited states\b|\busa\b|\bus[- ]remote\b|\bremote[- ]us\b|\bus-|-us\b/i;

/** Big-city aliases for suggested-city chips — a literal substring match on "Bay Area"
 *  would never hit a real posting (companies list "San Francisco"/"Mountain View", not
 *  "Bay Area"), so these expand to the actual city names postings use. */
export const CITY_ALIASES: Record<string, string[]> = {
  "bay area": ["san francisco", "mountain view", "palo alto", "menlo park", "san jose", "sunnyvale", "santa clara", "redwood city", "oakland", "cupertino"],
  "sf": ["san francisco"],
  "ny": ["new york", "new york city", "nyc", "brooklyn"],
  "nyc": ["new york", "new york city", "nyc", "brooklyn"],
  "sg": ["singapore"],
};

export interface CountryOption {
  label: string;
  value: string;
}

export const COUNTRY_FILTER_OPTIONS: CountryOption[] = [
  { label: "Any country", value: "any" },
  { label: "US", value: "United States" },
  { label: "UK", value: "United Kingdom" },
  { label: "Singapore", value: "Singapore" },
  { label: "Thailand", value: "Thailand" },
  { label: "APAC", value: "APAC" },
];

/** Suggested-city chips, keyed by the country filter's `value`. */
export const SUGGESTED_CITIES: Record<string, string[]> = {
  "United States": ["SF", "Seattle", "Bay Area", "NY", "Chicago", "Texas", "Boston"],
  "United Kingdom": ["London"],
  Singapore: ["SG"],
  Thailand: ["Bangkok"],
};

export function matchesCountryFilter(jobCountry: string, filterValue: string): boolean {
  if (filterValue === "any") return true;
  if (filterValue === "APAC") return APAC_OTHER_COUNTRIES.includes(jobCountry);
  return jobCountry === filterValue;
}

export function cityMatchesQuery(city: string, state: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = `${city} ${state}`.toLowerCase();
  const aliasTerms = CITY_ALIASES[q];
  if (aliasTerms) return aliasTerms.some((term) => haystack.includes(term));
  return haystack.includes(q);
}

export function classifyLocation(raw: string): { country: string; state: string; city: string } {
  const cleaned = raw.trim();
  if (!cleaned) return { country: "not-specified", state: "", city: "not-specified" };
  const lower = cleaned.toLowerCase();

  let country = "";
  if (SINGAPORE_RE.test(lower)) country = "Singapore";
  else if (THAILAND_RE.test(lower)) country = "Thailand";
  else if (UK_RE.test(lower)) country = "United Kingdom";
  else if (CANADA_RE.test(lower)) country = "Canada";
  else {
    for (const [name, pattern] of APAC_OTHER_PATTERNS) {
      if (pattern.test(lower)) {
        country = name;
        break;
      }
    }
  }
  if (!country) {
    for (const [name, pattern] of OTHER_COUNTRY_PATTERNS) {
      if (pattern.test(lower)) {
        country = name;
        break;
      }
    }
  }
  if (!country && (US_RE.test(lower) || US_STATE_ABBR_RE.test(cleaned) || US_STATE_NAME_RE.test(cleaned))) {
    country = "United States";
  }
  if (!country) {
    // Fall back to the old last-segment heuristic for anything not covered above — still
    // useful for clean "City, Country" strings from countries we don't explicitly pattern-match.
    const parts = cleaned.split(/[,;]/).map((p) => p.trim()).filter(Boolean);
    country = parts.length > 1 ? parts[parts.length - 1] : "not-specified";
  }

  const stateAbbrMatch = cleaned.match(US_STATE_ABBR_RE);
  const stateNameMatch = cleaned.match(US_STATE_NAME_RE);
  const state = stateAbbrMatch ? US_STATES[stateAbbrMatch[1].toUpperCase()] : stateNameMatch ? stateNameMatch[1] : "";

  const firstSegment = cleaned.split(/[,;]/)[0]?.trim() ?? "";
  const firstSegmentIsCountryOrState =
    firstSegment.toLowerCase() === country.toLowerCase() ||
    US_STATE_ABBR_RE.test(firstSegment) ||
    US_STATE_NAME_RE.test(firstSegment);
  const city = firstSegment && !firstSegmentIsCountryOrState ? firstSegment : "not-specified";

  return { country, state, city };
}
