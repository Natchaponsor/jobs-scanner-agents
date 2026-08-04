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

  await Promise.all(
    enabled.map(async (source) => {
      try {
        const adapter = ADAPTERS[source.adapterType];
        const raw = await adapter.fetch(source, { function: functionQuery });
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
