import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { runProfileOnce } from "../lib/agent/runProfile";
import type { JobProfile } from "../lib/agent/types";

const CONFIG_PATH = path.join(process.cwd(), "agent.profiles.json");
const dryRun = process.argv.includes("--dry-run");

async function main() {
  if (!existsSync(CONFIG_PATH)) {
    console.error(
      "No agent.profiles.json found. Copy agent.profiles.example.json to agent.profiles.json and fill in your filters + ntfy topic."
    );
    process.exitCode = 1;
    return;
  }

  const profiles = JSON.parse(readFileSync(CONFIG_PATH, "utf-8")) as JobProfile[];
  if (profiles.length === 0) {
    console.log("agent.profiles.json has no profiles — nothing to do.");
    return;
  }

  if (dryRun) console.log("--dry-run: scanning for real, but not sending notifications or saving state.\n");

  for (const profile of profiles) {
    try {
      await runProfileOnce(profile, { dryRun });
    } catch (err) {
      console.error(`[${profile.name}] failed:`, err instanceof Error ? err.message : err);
    }
  }
}

main();
