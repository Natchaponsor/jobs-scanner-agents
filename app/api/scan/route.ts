import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/runScan";
import type { ScanSource } from "@/lib/types";

/**
 * Stateless scan proxy, mirroring the quote-proxy pattern: the server runs the adapters
 * (avoids CORS + keeps scraping logic off the client bundle) but persists nothing itself —
 * the client stores results in localStorage via useJobsStore.
 *
 * A full scan across every enabled source has taken anywhere from ~15s to ~70s in testing —
 * comfortably under Node's own limits locally, but a real constraint once this runs as a
 * hosted serverless function. 60 is the max Vercel's Hobby tier allows for a standard
 * function; if "Scan now" times out there with a lot of sources enabled, turn on "Fluid
 * Compute" in the Vercel project's Settings → Functions (still free on Hobby) and bump this
 * to 300.
 */
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { sources: ScanSource[]; function: string };

  if (!Array.isArray(body.sources) || body.sources.length === 0) {
    return NextResponse.json({ error: "No enabled scan sources." }, { status: 400 });
  }

  const result = await runScan(body.sources, body.function || "Product Manager");
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
