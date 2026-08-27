import { NextResponse } from "next/server";

import { requireWolfCentralWorkspace } from "@/lib/wolf/wolf-central-auth";
import {
  buildWolfEstateSnapshot,
  ensureWolfEstateSeed,
} from "@/lib/wolf/central/estate-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { workspace } = await requireWolfCentralWorkspace();
    await ensureWolfEstateSeed(workspace.id);
    const estate = await buildWolfEstateSnapshot(workspace.id);
    return NextResponse.json({ estate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load WOLF estate.";
    const status =
      message.includes("Authentication") ||
      message.includes("Workspace context") ||
      message.includes("only available")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
