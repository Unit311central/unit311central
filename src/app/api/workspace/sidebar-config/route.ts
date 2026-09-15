import { NextResponse } from "next/server";

import {
  listSidebarCatalogueModules,
  sanitizeSidebarModulePayload,
  type WorkspaceSidebarModuleRecord,
} from "@/lib/platform-workspaces/workspace-sidebar-config";
import { canManageWorkspaceSidebar } from "@/lib/platform-workspaces/workspace-sidebar-access";
import {
  loadWorkspaceSidebarConfig,
  saveWorkspaceSidebarModuleRows,
} from "@/lib/platform-workspaces/workspace-sidebar-config-service";
import { getPlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { getCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace?.id) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const canManage = await canManageWorkspaceSidebar(session, workspace);
  const catalogue = listSidebarCatalogueModules({ workspaceSlug: workspace.slug });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      catalogue,
      modules: catalogue.map((entry, index) => ({
        moduleId: entry.id,
        enabled: true,
        displayOrder: (index + 1) * 10,
      })),
      enabledModuleIds: catalogue.map((entry) => entry.id),
      canManage,
      persisted: false,
    });
  }

  try {
    const config = await loadWorkspaceSidebarConfig(workspace.id, workspace.slug);
    return NextResponse.json({
      catalogue,
      modules: config.modules,
      enabledModuleIds: config.enabledModuleIds,
      canManage,
      persisted: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load sidebar config.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

type PutBody = {
  modules?: Array<{ moduleId?: string; enabled?: boolean; displayOrder?: number }>;
};

export async function PUT(request: Request) {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace?.id) {
    return NextResponse.json({ error: "Workspace not found." }, { status: 404 });
  }

  const canManage = await canManageWorkspaceSidebar(session, workspace);
  if (!canManage) {
    return NextResponse.json({ error: "Insufficient permissions." }, { status: 403 });
  }

  let body: PutBody;
  try {
    body = (await request.json()) as PutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const sanitized = sanitizeSidebarModulePayload(body.modules ?? [], workspace.slug);
  if (!sanitized) {
    return NextResponse.json({ error: "No valid sidebar modules supplied." }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  }

  try {
    const config = await saveWorkspaceSidebarModuleRows(workspace.id, sanitized, {
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({
      ok: true,
      modules: config.modules,
      enabledModuleIds: config.enabledModuleIds,
      enabledSubModules: config.enabledSubModuleKeys,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save sidebar config.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
