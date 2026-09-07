import { ADAPTERS } from "./adapters";
import { normalize } from "./extract";
import type { Job, ScanRun, ScanSource } from "./types";

export interface ScanResult {
  jobs: Job[];
  run: ScanRun;
}

export async function runScan(sources: ScanSource[], functionQuery: string): Promise<ScanResult> {
  const startedAt = new Date().toISOString();
  const enabled = sources.filter((s) => s.enabled);
  const errors: ScanRun["errors"] = [];
  const jobs: Job[] = [];

  // A handful of adapters (Workday, Oracle Fusion, Amazon, Google) pass `query.function` straight
  // through as a literal server-side keyword search — so the dashboard's "Any function" filter,
  // whose value is the literal string "any", would otherwise search those APIs for the word
  // "any" instead of returning everything. Normalize it to "" here, once, rather than in every
  // adapter — each of those adapters already treats an empty string as "no filter" (confirmed
  // directly against each API), except Oracle Fusion, which needs to omit its keyword clause
  // entirely (see lib/adapters/oracle-fusion.ts).
  const normalizedFunction = functionQuery === "any" ? "" : functionQuery;

  await Promise.all(
    enabled.map(async (source) => {
      try {
        const adapter = ADAPTERS[source.adapterType];
        const raw = await adapter.fetch(source, { function: normalizedFunction });
        for (const rawJob of raw) {
          jobs.push(normalize(rawJob, source));
        }
      } catch (err) {
        errors.push({ sourceName: source.name, message: err instanceof Error ? err.message : String(err) });
      }
    })
  );

  return {
    jobs,
    run: {
      id: crypto.randomUUID(),
      startedAt,
      finishedAt: new Date().toISOString(),
      sourcesScanned: enabled.length,
      jobsFound: jobs.length,
      jobsNew: 0, // filled in client-side after dedupe against existing store state
      errors,
    },
  };
}
