import { NextRequest, NextResponse } from "next/server";

import type {
  ClientAccountStatus,
  ClientContractType,
  ClientIndustry,
  ClientRegion,
} from "@/lib/client-management-data";
import { apiErrorStatus } from "@/lib/api-error-status";
import { createInternalClient, listInternalClients } from "@/lib/internal-clients-service";
import type { ManagedClient } from "@/lib/client-management-data";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarClients } from "@/lib/demo/module-fixtures";
import { enrichNorthstarClientsWithFilesRoots } from "@/lib/demo/northstar-files-fixtures";
import { ensureInternalClientsTable } from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  if (await isDemoApiRequest()) {
    return NextResponse.json({
      clients: enrichNorthstarClientsWithFilesRoots(getNorthstarClients() as ManagedClient[]),
      workspace: { id: "demo-workspace", slug: "demo", name: "Demo" },
    });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const clients = await listInternalClients({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    // Talanton portfolio companies are investments (Portfolio Companies), not BC clients.
    const visibleClients =
      workspace.slug === "talantonimpact"
        ? clients.filter((c) => !String(c.id).startsWith("ti-cli-"))
        : clients;
    return NextResponse.json({
      clients: visibleClients,
      workspace: { id: workspace.id, slug: workspace.slug, name: workspace.name },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load clients";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      companyName?: string;
      industry?: ClientIndustry;
      primaryContact?: string;
      email?: string;
      phone?: string;
      region?: ClientRegion;
      accountStatus?: ClientAccountStatus;
      contractType?: ClientContractType;
      taxId?: string;
      billingAddress?: string;
      activeProjects?: number;
      notes?: string;
      platformUrl?: string;
    };

    await ensureInternalClientsTable();
    const client = await createInternalClient(body, {
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
