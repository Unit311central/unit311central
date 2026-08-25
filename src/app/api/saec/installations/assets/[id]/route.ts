import { NextRequest, NextResponse } from "next/server";

import { requireSaecInstallationsWorkspace } from "@/lib/saec/installations-auth";
import {
  deleteSaecInstallationAsset,
  getSaecInstallationAsset,
  listSaecMaintenanceForAsset,
  updateSaecInstallationAsset,
} from "@/lib/saec/installations-service";
import type { SaecInstallationAssetInput } from "@/lib/saec/installations-types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const { id } = await context.params;
    const asset = await getSaecInstallationAsset(workspace.id, id);
    if (!asset) {
      return NextResponse.json({ error: "Asset not found." }, { status: 404 });
    }
    const maintenance = await listSaecMaintenanceForAsset(workspace.id, id);
    return NextResponse.json({ asset, maintenance });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load installation asset.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const { id } = await context.params;
    const body = (await request.json()) as Partial<SaecInstallationAssetInput>;
    const asset = await updateSaecInstallationAsset(workspace.id, id, body);
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update installation asset.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { workspace } = await requireSaecInstallationsWorkspace();
    const { id } = await context.params;
    await deleteSaecInstallationAsset(workspace.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete installation asset.";
    const status =
      message.includes("Authentication") || message.includes("Workspace context") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
