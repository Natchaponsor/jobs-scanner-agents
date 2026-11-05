/**
 * Standalone scan runner for the daily GitHub Actions workflow (.github/workflows/daily-scan.yml).
 * Runs the exact same adapters/runScan logic as the local "Scan now" button — no Next.js server
 * needed, just plain Node — against every *enabled* default source, and writes the result to
 * data/jobs.json in the same `{ jobs, run }` shape /api/scan returns, so the local app's merge
 * logic (see store/useJobsStore.ts's syncFromGithub) can treat it identically to a live scan.
 *
 * Beyond just scanning, this keeps the committed snapshot trustworthy and cheap to store:
 *  - Deterministic output: jobs sorted by id, one job per line. Without this the file came out
 *    in adapter-completion order, so nearly every line "changed" every day (~270k-line diffs).
 *  - Stable first-seen dates: a job already in the previous snapshot keeps its `discoveredAt`.
 *    Sources that don't publish a posting date otherwise get stamped "now" on every scan.
 *  - Loud failures: every failing source becomes a GitHub Actions warning annotation and a row
 *    in the run summary (flagged when it was also failing last run), instead of being buried in
 *    the JSON of a green run.
 *  - Guardrails: refuses to overwrite the snapshot with an empty or much smaller one, or one
 *    where too many sources failed — a bad run shouldn't wipe out good data, since the app
 *    treats a snapshot as the source of truth for what's still open.
 *
 * Run locally with `npm run scan:ci`.
 */
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { DEFAULT_SOURCES } from "../lib/defaultSources";
import { runScan } from "../lib/runScan";
import type { Job, ScanRun } from "../lib/types";

const OUTPUT = "data/jobs.json";
/** Refuse to publish a snapshot with fewer than this fraction of the previous one's jobs. */
const MIN_JOBS_RATIO = 0.7;
/** Refuse to publish when more than this fraction of the scanned sources errored. */
const MAX_ERROR_RATIO = 0.25;

interface Snapshot {
  jobs: Job[];
  run: ScanRun;
}

function readPrevious(): Snapshot | null {
  if (!existsSync(OUTPUT)) return null;
  try {
    return JSON.parse(readFileSync(OUTPUT, "utf8")) as Snapshot;
  } catch {
    return null; // corrupt/partial previous file shouldn't block publishing a good one
  }
}

/** One job per line inside otherwise-ordinary JSON, so git diffs show only the jobs that changed. */
function serialize(run: ScanRun, jobs: Job[]): string {
  return `{"run":${JSON.stringify(run)},"jobs":[\n${jobs.map((j) => JSON.stringify(j)).join(",\n")}\n]}\n`;
}

function fail(message: string): never {
  console.error(`::error title=Daily scan not published::${message}`);
  summary(`## ❌ Snapshot not published\n\n${message}\n\nThe previous \`data/jobs.json\` was left untouched.\n`);
  process.exit(1);
}

function summary(markdown: string) {
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, markdown + "\n");
}

async function main() {
  const enabled = DEFAULT_SOURCES.filter((s) => s.enabled);
  console.log(`Scanning ${enabled.length} enabled sources...`);

  // "" (not e.g. "Product Manager") so every source returns its full listing rather than one
  // narrowed to a single function keyword — this snapshot is meant to be comprehensive, not
  // scoped to whichever function the dashboard's filter happened to default to.
  const result = await runScan(enabled, "");
  const previous = readPrevious();

  // Stable first-seen dates (see header comment).
  if (previous) {
    const firstSeen = new Map(previous.jobs.map((j) => [j.id, j.discoveredAt]));
    for (const job of result.jobs) job.discoveredAt = firstSeen.get(job.id) ?? job.discoveredAt;
  }
  result.jobs.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

  const { run, jobs } = result;
  console.log(`Scanned ${run.sourcesScanned} sources, found ${jobs.length} jobs, ${run.errors.length} error(s).`);

  const stillFailing = new Set((previous?.run.errors ?? []).map((e) => e.sourceName));
  for (const err of run.errors) {
    const repeat = stillFailing.has(err.sourceName);
    console.warn(`::warning title=Source failed${repeat ? " (again)" : ""}::${err.sourceName}: ${err.message}`);
  }

  if (jobs.length === 0) fail("The scan returned zero jobs.");
  if (run.errors.length / run.sourcesScanned > MAX_ERROR_RATIO) {
    fail(`${run.errors.length} of ${run.sourcesScanned} sources failed (limit ${Math.round(MAX_ERROR_RATIO * 100)}%): ${run.errors.map((e) => e.sourceName).join(", ")}.`);
  }
  if (previous && jobs.length < previous.jobs.length * MIN_JOBS_RATIO) {
    fail(`Only ${jobs.length} jobs found vs ${previous.jobs.length} in the previous snapshot (minimum ${Math.round(MIN_JOBS_RATIO * 100)}%).`);
  }

  const previousIds = new Set((previous?.jobs ?? []).map((j) => j.id));
  const currentIds = new Set(jobs.map((j) => j.id));
  const added = jobs.filter((j) => !previousIds.has(j.id)).length;
  const removed = previous ? previous.jobs.filter((j) => !currentIds.has(j.id)).length : 0;

  mkdirSync("data", { recursive: true });
  writeFileSync(OUTPUT, serialize(run, jobs));
  console.log(`Wrote ${OUTPUT} (+${added} / -${removed} vs previous)`);

  const rows = run.errors.map((e) => `| ${e.sourceName} | ${stillFailing.has(e.sourceName) ? "yes" : "new"} | ${e.message.replace(/\|/g, "\\|")} |`);
  summary(
    [
      `## ✅ Snapshot published: ${jobs.length.toLocaleString()} jobs`,
      "",
      `${run.sourcesScanned} sources scanned · **+${added}** new · **−${removed}** closed vs the previous snapshot.`,
      "",
      run.errors.length === 0
        ? "No source errors."
        : `### ⚠️ ${run.errors.length} source(s) failed\n\n| Source | Failed last run too? | Error |\n|---|---|---|\n${rows.join("\n")}`,
    ].join("\n")
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
