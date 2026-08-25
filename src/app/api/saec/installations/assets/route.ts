import { NextRequest, NextResponse } from "next/server";

import { requireSaecInstallationsWorkspace } from "@/lib/saec/installations-auth";
import {
  createSaecInstallationAsset,
  ensureSaecInstallationSeed,
  listSaecInstallationAssets,
  listSaecInstallationEngineerOptions,
} from "@/lib/saec/installations-service";
import type {
  SaecInstallationAssetInput,
  SaecInstallationAssetType,
} from "@/lib/saec/installations-types";

export const dynamic = "force-dynamic";

function parseAssetType(value: string | null): SaecInstallationAssetType | undefined {
  if (value === "elevator" || value === "escalator") return value;
  return undefined;
}

export async function GET(request: NextRequest) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    await ensureSaecInstallationSeed(workspace.id);
    const assetType = parseAssetType(request.nextUrl.searchParams.get("assetType"));
    const assets = await listSaecInstallationAssets(workspace.id, assetType);
    return NextResponse.json({
      assets,
      engineers: listSaecInstallationEngineerOptions(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load installation assets.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const body = (await request.json()) as SaecInstallationAssetInput;
    if (!body.assetCode?.trim()) {
      return NextResponse.json({ error: "Asset ID is required." }, { status: 400 });
    }
    if (!body.siteName?.trim()) {
      return NextResponse.json({ error: "Site is required." }, { status: 400 });
    }
    const asset = await createSaecInstallationAsset(workspace.id, body);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create installation asset.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
