import { NextResponse } from "next/server";

import { requirePailexWorkspace } from "@/lib/pailex/pailex-auth";
import { buildPailexReserveSnapshot } from "@/lib/pailex/pailex-reserve-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requirePailexWorkspace();
    const snapshot = await buildPailexReserveSnapshot();
    return NextResponse.json({ snapshot });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load PAILEX reserve.";
    const status =
      message.includes("Authentication") ||
      message.includes("Workspace context") ||
      message.includes("only available")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
