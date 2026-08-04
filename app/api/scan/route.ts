import { NextRequest, NextResponse } from "next/server";
import { runScan } from "@/lib/runScan";
import type { ScanSource } from "@/lib/types";

/**
 * Stateless scan proxy, mirroring the quote-proxy pattern: the server runs the adapters
 * (avoids CORS + keeps scraping logic off the client bundle) but persists nothing itself —
 * the client stores results in localStorage via useJobsStore.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { sources: ScanSource[]; function: string };

  if (!Array.isArray(body.sources) || body.sources.length === 0) {
    return NextResponse.json({ error: "No enabled scan sources." }, { status: 400 });
  }

  const result = await runScan(body.sources, body.function || "Product Manager");
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store" } });
}
