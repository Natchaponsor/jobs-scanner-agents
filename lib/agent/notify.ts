import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { JobProfile, PendingJobSummary } from "./types";

const execFileAsync = promisify(execFile);

function formatMessage(profileName: string, jobs: PendingJobSummary[]): { title: string; body: string } {
  const title = `${jobs.length} new job${jobs.length === 1 ? "" : "s"} - ${profileName}`;
  const lines = jobs.slice(0, 10).map((j) => `${j.roleTitle} @ ${j.sourceName} (${j.location || "location n/a"})`);
  if (jobs.length > 10) lines.push(`...and ${jobs.length - 10} more`);
  return { title, body: lines.join("\n") };
}

/** HTTP header values must be Latin-1/ASCII (fetch throws otherwise) — ntfy's Title header has
 *  no such restriction on the body, only headers, so profile names or job titles with smart
 *  quotes/dashes/emoji need to be brought into range rather than crashing the whole notify. */
function toHeaderSafe(value: string): string {
  return value
    .replace(/[—–]/g, "-")
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^\x00-\xFF]/g, "?");
}

async function notifyMacOS(title: string, body: string): Promise<void> {
  // osascript's AppleScript string literals only need double quotes and backslashes escaped.
  const escape = (s: string) => s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  await execFileAsync("osascript", ["-e", `display notification "${escape(body)}" with title "${escape(title)}"`]);
}

async function notifyNtfy(topic: string, title: string, body: string): Promise<void> {
  const res = await fetch(`https://ntfy.sh/${encodeURIComponent(topic)}`, {
    method: "POST",
    headers: { Title: toHeaderSafe(title), Priority: "default" },
    body,
  });
  if (!res.ok) throw new Error(`ntfy.sh: HTTP ${res.status}`);
}

export async function notify(profile: JobProfile, jobs: PendingJobSummary[], dryRun: boolean): Promise<void> {
  if (jobs.length === 0) return;
  const { title, body } = formatMessage(profile.name, jobs);

  if (dryRun) {
    console.log(`[dry run] would notify via ${profile.notify.channel}:\n${title}\n${body}\n`);
    return;
  }

  if (profile.notify.channel === "macos") {
    await notifyMacOS(title, body);
  } else {
    if (!profile.notify.ntfyTopic) throw new Error(`Profile "${profile.name}": ntfy channel needs notify.ntfyTopic set`);
    await notifyNtfy(profile.notify.ntfyTopic, title, body);
  }
}
