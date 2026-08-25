import { NextResponse } from "next/server";

import { requireSaecInstallationsWorkspace } from "@/lib/saec/installations-auth";
import {
  buildSaecInstallationsDashboard,
  ensureSaecInstallationSeed,
} from "@/lib/saec/installations-service";
import type { SaecInstallationAssetType } from "@/lib/saec/installations-types";

export const dynamic = "force-dynamic";

function parseAssetType(value: string | null): SaecInstallationAssetType {
  return value === "escalator" ? "escalator" : "elevator";
}

export async function GET(request: Request) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const url = new URL(request.url);
    const assetType = parseAssetType(url.searchParams.get("assetType"));
    await ensureSaecInstallationSeed(workspace.id);
    const dashboard = await buildSaecInstallationsDashboard(workspace.id, assetType);
    return NextResponse.json({ dashboard });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load installations dashboard.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
