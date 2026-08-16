import * as cheerio from "cheerio";
import type { Adapter } from "../types";
import type { RawJob } from "../../extract";

const US_BASE = "https://www.kpmguscareers.com";
const TH_BASE = "https://kpmg.com";
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const US_PAGE_SIZE = 12;

/**
 * KPMG operates as independent member firms per country, so there's no single global career
 * site — this merges the two that were actually investigated:
 * - US (kpmguscareers.com): server-renders its full listing, confirmed via plain curl.
 *   Paginates via `?spage=N` (not the `?p=N` convention the other Radancy adapters use —
 *   this KPMG instance is themed differently enough that it needed its own selectors too:
 *   `a.box-shadow`, not `a.sr-item`).
 * - Thailand (kpmg.com/th/en/careers): an Adobe Experience Manager site — job postings are
 *   individual content pages listed directly on the "Experienced Hires" page, not run through
 *   a separate ATS. All ~30 postings render on one page (no pagination needed); location is
 *   just tagged "Bangkok, Thailand" rather than fetched per-posting.
 * Singapore wasn't found on this pass — KPMG Singapore's own site didn't resolve at the URLs
 * tried.
 */
export const kpmgAdapter: Adapter = {
  async fetch() {
    const [us, th] = await Promise.all([fetchUS(), fetchThailand()]);
    return [...us, ...th];
  },
};

async function fetchUS(): Promise<RawJob[]> {
  const first = await fetchUSPage(1);
  const remainingPages = Math.ceil(first.total / US_PAGE_SIZE) - 1;
  const rest = await Promise.all(
    Array.from({ length: Math.max(remainingPages, 0) }, (_, i) => fetchUSPage(i + 2))
  );
  return [first, ...rest].flatMap((page) => page.jobs);
}

async function fetchUSPage(page: number): Promise<{ jobs: RawJob[]; total: number }> {
  const res = await fetch(`${US_BASE}/job-search/?spage=${page}`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`KPMG US: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const total = Number($('span[data-action="count"]').first().text().trim() || 0);
  const jobs: RawJob[] = [];
  $("div.search--item").each((_, el) => {
    const item = $(el);
    const link = item.find("a.box-shadow").first();
    const title = link.find(".list-view .h5").first().text().trim();
    const href = link.attr("href");
    const info = link.find(".list-view .text-xs.text-dark-grey").first().text().trim();
    const location = info.split(" | ").slice(1).join(" | ");
    if (!title || !href) return;
    jobs.push({ title, location, url: new URL(href, US_BASE).toString(), postedAt: null, description: "" });
  });

  return { jobs, total };
}

async function fetchThailand(): Promise<RawJob[]> {
  const res = await fetch(`${TH_BASE}/th/en/careers/experienced-hires.html`, {
    headers: { "User-Agent": UA, Accept: "text/html" },
  });
  if (!res.ok) throw new Error(`KPMG Thailand: HTTP ${res.status}`);
  const $ = cheerio.load(await res.text());

  const jobs: RawJob[] = [];
  const seen = new Set<string>();
  $('a[href^="/th/en/careers/"]').each((_, el) => {
    const href = $(el).attr("href") ?? "";
    // Real postings are exactly /th/en/careers/{department}/{slug}.html — section/nav links
    // (/th/en/careers.html, /th/en/careers/audit-and-assurance.html) have one fewer segment.
    if (!/^\/th\/en\/careers\/[^/]+\/[^/]+\.html$/.test(href)) return;
    if (seen.has(href)) return;
    seen.add(href);

    const title = $(el).text().trim();
    if (!title) return;
    jobs.push({
      title,
      location: "Bangkok, Thailand",
      url: new URL(href, TH_BASE).toString(),
      postedAt: null,
      description: "",
    });
  });

  return jobs;
}
