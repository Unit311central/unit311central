import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { ensureSoftwareAssetRegisterTables } from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import {
  createSoftwareAsset,
  getSoftwareAssetsSummary,
} from "@/lib/software-assets-service";
import type { SoftwareAsset } from "@/lib/software-assets-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { ensureDemoSoftwareAssetsSeeded } from "@/lib/demo/demo-software-assets-seed";
import { isDemoWorkspaceSlug } from "@/lib/demo/read-only";
import { isTalantonImpactSlug } from "@/lib/talanton-surface";
import { ensureTalantonSoftwareAssetsSeeded } from "@/lib/talanton/software-assets-seed";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    await ensureSoftwareAssetRegisterTables();
    if (isDemoWorkspaceSlug(workspace.slug)) {
      await ensureDemoSoftwareAssetsSeeded(workspace.id).catch(() => undefined);
    } else if (isTalantonImpactSlug(workspace.slug)) {
      await ensureTalantonSoftwareAssetsSeeded(workspace.id).catch(() => undefined);
    }
    const { assets, summary } = await getSoftwareAssetsSummary({ workspaceId: workspace.id });
    if (isDemoWorkspaceSlug(workspace.slug)) {
      summary.currency = "GBP";
    } else if (isTalantonImpactSlug(workspace.slug)) {
      summary.currency = "USD";
    }
    return NextResponse.json({
      assets,
      summary,
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load software assets";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as Partial<SoftwareAsset> & { password?: string | null };
    await ensureSoftwareAssetRegisterTables();
    const asset = await createSoftwareAsset(body, { workspaceId: workspace.id });
    return NextResponse.json({ asset });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create software asset";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
