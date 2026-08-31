import { NextResponse } from "next/server";

import { getSaecDiscoveryAccess } from "@/lib/saec-discovery/access-service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const access = await getSaecDiscoveryAccess();
    return NextResponse.json(access, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return NextResponse.json(
      {
        allowed: false,
        userId: null,
        error: error instanceof Error ? error.message : "Unable to verify SAEC Discovery access.",
      },
      { status: 503 },
    );
  }
}
