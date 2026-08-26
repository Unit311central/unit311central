import { NextResponse } from "next/server";

import { runCriticalHealthProbes } from "@/lib/system-health/probes";

export const dynamic = "force-dynamic";

/**
 * Public production health probe — minimal response, no sensitive detail.
 */
export async function GET() {
  const { ok } = await runCriticalHealthProbes();

  if (ok) {
    return NextResponse.json(
      { status: "ok" },
      {
        status: 200,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }

  return NextResponse.json(
    { status: "unavailable" },
    {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
