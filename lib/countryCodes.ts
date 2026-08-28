/**
 * Country name → display abbreviation, for the "major locations" tag on /sources. The four
 * countries this project cares about most (see the README) get their conventional short forms;
 * everything else gets its standard 2-letter code. If a country's code would collide with one
 * of those four reserved ones, `countryCode` falls back to a 3-letter code instead of silently
 * showing the wrong country.
 */
const RESERVED: Record<string, string> = {
  "United States": "US",
  "United Kingdom": "UK",
  Thailand: "TH",
  Singapore: "SG",
};

const OTHER_CODES: Record<string, string> = {
  Canada: "CA",
  Japan: "JP",
  India: "IN",
  Australia: "AU",
  "South Korea": "KR",
  China: "CN",
  Taiwan: "TW",
  "Hong Kong": "HK",
  Indonesia: "ID",
  Malaysia: "MY",
  Philippines: "PH",
  Vietnam: "VN",
  "New Zealand": "NZ",
  Ireland: "IE",
  Germany: "DE",
  France: "FR",
  Spain: "ES",
  Netherlands: "NL",
  Switzerland: "CH",
  Sweden: "SE",
  Mexico: "MX",
  Brazil: "BR",
  Israel: "IL",
  UAE: "AE",
};

const COUNTRY_CODES: Record<string, string> = { ...RESERVED, ...OTHER_CODES };
const RESERVED_CODES = new Set(Object.values(RESERVED));

export function countryCode(country: string): string {
  const known = COUNTRY_CODES[country];
  if (known) return known;

  const guess = country.slice(0, 2).toUpperCase();
  // A country outside the known table happening to guess its way into one of the four reserved
  // codes would silently misrepresent it (e.g. reading as Thailand/UK/US/Singapore) — extend to
  // 3 letters instead.
  return RESERVED_CODES.has(guess) ? country.slice(0, 3).toUpperCase() : guess;
}
