import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { ProfileState } from "./types";

const STATE_DIR = path.join(process.cwd(), "agent-state");

function stateFilePath(profileName: string): string {
  const safe = profileName.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-");
  return path.join(STATE_DIR, `${safe}.json`);
}

export function loadState(profileName: string): ProfileState {
  const file = stateFilePath(profileName);
  if (!existsSync(file)) return { seenJobIds: [], pending: [], lastNotifiedAt: null };
  return JSON.parse(readFileSync(file, "utf-8")) as ProfileState;
}

export function saveState(profileName: string, state: ProfileState): void {
  if (!existsSync(STATE_DIR)) mkdirSync(STATE_DIR, { recursive: true });
  writeFileSync(stateFilePath(profileName), JSON.stringify(state, null, 2));
}
