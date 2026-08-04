import type { Adapter } from "./types";

interface OracleRequisition {
  Id: string;
  Title: string;
  PostedDate?: string;
  PrimaryLocation?: string;
  JobFamily?: string;
  ShortDescriptionStr?: string;
  ExternalQualificationsStr?: string;
  ExternalResponsibilitiesStr?: string;
  WorkplaceType?: string;
}

/**
 * Generic adapter for Oracle Fusion Recruiting Cloud's public candidate-experience REST API
 * — the same platform JPMorgan runs on `jpmc.fa.oraclecloud.com`. identifier = `{tenant}|{siteNumber}`,
 * e.g. `jpmc|CX_1001`. This is Oracle's own documented public endpoint (not a scrape/reverse-engineer),
 * unauthenticated, meant to back exactly this kind of candidate-experience search UI.
 */
export const oracleFusionAdapter: Adapter = {
  async fetch(source, query) {
    const [tenant, siteNumber] = source.identifier.split("|");
    if (!tenant || !siteNumber) throw new Error(`Oracle Fusion ${source.name}: malformed identifier "${source.identifier}"`);

    // Oracle's `finder` syntax uses literal `;`/`,` as delimiters — encoding the whole
    // expression (rather than just the keyword value) breaks parsing and silently returns
    // an empty result set instead of an error.
    const keyword = encodeURIComponent(`"${query.function}"`);
    const finder = `findReqs;siteNumber=${siteNumber},limit=25,keyword=${keyword}`;
    const url = `https://${tenant}.fa.oraclecloud.com/hcmRestApi/resources/latest/recruitingCEJobRequisitions?onlyData=true&expand=requisitionList&finder=${finder}`;
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error(`Oracle Fusion ${source.name}: HTTP ${res.status}`);
    const data = (await res.json()) as { items: { requisitionList?: OracleRequisition[] }[] };
    const reqs = data.items[0]?.requisitionList ?? [];

    return reqs.map((req) => ({
      title: req.Title,
      location: req.PrimaryLocation ?? "",
      url: `https://${tenant}.fa.oraclecloud.com/hcmUI/CandidateExperience/en/sites/${siteNumber}/job/${req.Id}`,
      postedAt: req.PostedDate ?? null,
      description: `${req.ShortDescriptionStr ?? ""} ${req.ExternalQualificationsStr ?? ""} ${req.ExternalResponsibilitiesStr ?? ""}`,
      workMode: req.WorkplaceType === "Remote" ? ("remote" as const) : req.WorkplaceType === "Hybrid" ? ("hybrid" as const) : undefined,
    }));
  },
};
