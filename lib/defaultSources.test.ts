import { describe, expect, it } from "vitest";
import { DEFAULT_SOURCES } from "./defaultSources";

const KNOWN_INDUSTRIES = new Set([
  "any", // social platforms only
  "Finance",
  "Consulting",
  "Travel",
  "Big Tech",
  "Software",
  "Media",
  "E-Commerce",
  "Social Media",
  "AI",
]);

function industryOf(id: string): string | undefined {
  return DEFAULT_SOURCES.find((s) => s.id === id)?.industry;
}

describe("DEFAULT_SOURCES industry tagging", () => {
  it("[feature] no source is left on the old generic 'Tech' catch-all", () => {
    const stillTech = DEFAULT_SOURCES.filter((s) => s.industry === "Tech");
    expect(stillTech.map((s) => s.name)).toEqual([]);
  });

  it("every source's industry is one of the known, differentiated values", () => {
    const unknown = DEFAULT_SOURCES.filter((s) => !KNOWN_INDUSTRIES.has(s.industry));
    expect(unknown.map((s) => `${s.name}: ${s.industry}`)).toEqual([]);
  });

  it("[feature] at least 9 distinct real industry values are in use (up from 7 before this change)", () => {
    const real = new Set(DEFAULT_SOURCES.map((s) => s.industry).filter((i) => i !== "any"));
    expect(real.size).toBeGreaterThanOrEqual(9);
  });

  it("reassigns former 'Tech' companies to Big Tech", () => {
    for (const id of ["co-amazon", "co-google", "co-nvidia", "co-microsoft", "co-apple", "co-meta", "co-tesla"]) {
      expect(industryOf(id), id).toBe("Big Tech");
    }
  });

  it("reassigns former 'Tech' companies to E-Commerce", () => {
    for (const id of ["co-quince", "co-shopee", "co-ebay", "co-lazada"]) {
      expect(industryOf(id), id).toBe("E-Commerce");
    }
  });

  it("reassigns former 'Tech' companies to Social Media", () => {
    for (const id of ["co-handshake-co", "co-linkedin", "co-line"]) {
      expect(industryOf(id), id).toBe("Social Media");
    }
  });

  it("merges former 'Tech' companies into the existing Travel/Software/Media industries", () => {
    for (const id of ["co-linemanwongnai", "co-uber", "co-doordash"]) {
      expect(industryOf(id), id).toBe("Travel");
    }
    for (const id of ["co-cisco", "co-servicenow"]) {
      expect(industryOf(id), id).toBe("Software");
    }
    expect(industryOf("co-tiktok")).toBe("Media");
  });

  it("leaves industries that were already correct untouched", () => {
    expect(industryOf("co-airbnb")).toBe("Travel");
    expect(industryOf("co-adobe")).toBe("Software");
    expect(industryOf("co-spotify")).toBe("Media");
    expect(industryOf("co-jpmorgan")).toBe("Finance");
    expect(industryOf("co-mckinsey")).toBe("Consulting");
    expect(industryOf("co-openai")).toBe("AI");
  });
});
