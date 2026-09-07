/**
 * Standalone scan runner for the daily GitHub Actions workflow (.github/workflows/daily-scan.yml).
 * Runs the exact same adapters/runScan logic as the local "Scan now" button — no Next.js server
 * needed, just plain Node — against every *enabled* default source, and writes the result to
 * data/jobs.json in the same `{ jobs, run }` shape /api/scan returns, so the local app's merge
 * logic (see store/useJobsStore.ts's syncFromGithub) can treat it identically to a live scan.
 *
 * Run locally with `npm run scan:ci`.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { DEFAULT_SOURCES } from "../lib/defaultSources";
import { runScan } from "../lib/runScan";

async function main() {
  const enabled = DEFAULT_SOURCES.filter((s) => s.enabled);
  console.log(`Scanning ${enabled.length} enabled sources...`);

  // "" (not e.g. "Product Manager") so every source returns its full listing rather than one
  // narrowed to a single function keyword — this snapshot is meant to be comprehensive, not
  // scoped to whichever function the dashboard's filter happened to default to.
  const result = await runScan(enabled, "");

  console.log(
    `Scanned ${result.run.sourcesScanned} sources, found ${result.run.jobsFound} jobs, ${result.run.errors.length} error(s).`
  );
  for (const err of result.run.errors) {
    console.warn(`  - ${err.sourceName}: ${err.message}`);
  }

  mkdirSync("data", { recursive: true });
  writeFileSync("data/jobs.json", JSON.stringify(result, null, 2) + "\n");
  console.log("Wrote data/jobs.json");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
