# Background agent (branch: `agent-scanner`)

Runs the same scan the dashboard's "Scan now" button runs, but on a schedule, without a
browser open, and pings you when something matching a saved profile shows up. Everything here
is zero-cost: no paid services, no LLM calls — it reuses the exact same filter logic
(`lib/selectors.ts`) the dashboard uses, so "interesting" means exactly what it would mean if
you set these filters by hand.

This branch is not merged into `main`. Nothing here changes how the app behaves today —
`npm run dev` and the dashboard are untouched.

## How it works

A **profile** is a saved search: the same filter fields as the dashboard's filter bar
(location, function, years of experience, job type, work mode, industry, search), plus how you
want to be notified and how often.

Each run of `npm run agent`:
1. Scans every currently-enabled default source (same sources as `/sources`).
2. Filters the results through each profile's `filters`, using the dashboard's own filter
   function — no separate matching logic to keep in sync.
3. Diffs against that profile's saved state (`agent-state/<profile>.json`) to find genuinely
   new matches — a job is never flagged twice, even across restarts.
4. Queues new matches, and flushes them as one notification once the profile's `frequency` gap
   has passed since the last one. The agent always scans on every run; `frequency` only
   throttles how often you're actually pinged — it can't notify *more* often than the agent
   itself runs.

## Setup

1. Copy the example config and edit it:
   ```bash
   cp agent.profiles.example.json agent.profiles.json
   ```
   Add one object per saved search. `filters` fields match `lib/types.ts`'s `Filters` type
   exactly (same values the dashboard's dropdowns use). For `notify`:
   - `channel`: `"ntfy"` or `"macos"`
   - `ntfyTopic`: required for `"ntfy"` — pick a random, hard-to-guess string. ntfy.sh topics
     aren't authenticated by default, so anyone who knows the topic name can read it.
   - `frequency`: `"immediate"`, `"hourly"`, or `"daily"`

2. Install the ntfy app (iOS/Android/desktop) and subscribe to your topic, or just open
   `https://ntfy.sh/<your-topic>` in a browser to watch it live.

3. Dry-run it — scans for real, prints what it *would* send, but doesn't actually notify or
   save state:
   ```bash
   npm run agent -- --dry-run
   ```

4. Once a dry run looks right, run it for real once to confirm a notification actually lands:
   ```bash
   npm run agent
   ```

## Scheduling with launchd

`launchd/com.jobsscanner.agent.plist` is pre-filled for this machine (runs `npm run agent`
daily at 9:00am). If you move the repo or reinstall Node, update `WorkingDirectory` and the
`npm` path (`which npm`) in the plist first.

Install:
```bash
cp launchd/com.jobsscanner.agent.plist ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.jobsscanner.agent.plist
```

Check it's registered:
```bash
launchctl list | grep jobsscanner
```

Logs land in `/tmp/jobs-scanner-agent.log` and `/tmp/jobs-scanner-agent.error.log`.

Uninstall:
```bash
launchctl unload ~/Library/LaunchAgents/com.jobsscanner.agent.plist
rm ~/Library/LaunchAgents/com.jobsscanner.agent.plist
```

## Known limitations (v1, on this branch)

- Sources are always "every enabled default source" — a profile can't scope to a subset of
  companies yet, only to filter criteria.
- If a scan run fails partway (a source's adapter errors), that source's jobs just don't show
  up for that run; nothing crashes, and it's logged. It'll pick back up next run.
- `frequency: "hourly"` is only meaningful if the agent itself runs at least hourly — with the
  included daily launchd schedule, every frequency setting effectively behaves like "daily".
