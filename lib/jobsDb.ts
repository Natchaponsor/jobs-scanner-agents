import type { Job } from "./types";

/**
 * Where the scanned jobs live in the browser. They used to be persisted in localStorage along
 * with everything else, but a full scan is now ~26k jobs (~16M characters) — well past
 * localStorage's ~5-10M-character quota, and a quota error there makes every state update throw.
 * IndexedDB has no practical limit at this size, and stores the array as-is (no JSON string
 * round-trip on every write). Everything small (filters, enabled sources, sort, ...) stays in
 * localStorage via the zustand persist middleware.
 *
 * Saved/applied status lives on the job objects themselves, so it's persisted here too.
 * If IndexedDB is unavailable (some private-browsing modes) loadJobs/saveJobs quietly no-op and
 * jobs just last for the session — a re-scan or GitHub sync brings them back.
 */
const DB_NAME = "jobs-scanner-agents";
const STORE = "kv";
const KEY = "jobs";

function open(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadJobs(): Promise<Job[] | null> {
  const db = await open();
  if (!db) return null;
  return new Promise((resolve) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(KEY);
    request.onsuccess = () => resolve(Array.isArray(request.result) ? (request.result as Job[]) : null);
    request.onerror = () => resolve(null);
  });
}

export async function saveJobs(jobs: Job[]): Promise<void> {
  const db = await open();
  if (!db) return;
  await new Promise<void>((resolve) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(jobs, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => resolve();
    tx.onabort = () => resolve();
  });
}
