import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { isClientType, type ManagedClient } from "@/lib/client-management-data";
import {
  deleteInternalClient,
  getInternalClient,
  updateInternalClient,
} from "@/lib/internal-clients-service";
import {
  clientAllowedInRequestedSalesContext,
  readRequestedSalesBusinessContext,
  salesBusinessContextStatus,
} from "@/lib/sales-business-context";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { requestTargetsWolfSentinel } from "@/lib/wolf/wolf-sentinel";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const client = await getInternalClient(id, { workspaceId: workspace.id });
    if (!client) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const requested = readRequestedSalesBusinessContext(request);
    if (!clientAllowedInRequestedSalesContext(client, workspace.slug, requested)) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load client";
    return NextResponse.json(
      { error: message },
      { status: salesBusinessContextStatus(error) ?? apiErrorStatus(error) },
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const existing = await getInternalClient(id, { workspaceId: workspace.id });
    if (!existing) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const requested = readRequestedSalesBusinessContext(request);
    if (!clientAllowedInRequestedSalesContext(existing, workspace.slug, requested)) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const body = (await request.json()) as Partial<ManagedClient>;
    if (requestTargetsWolfSentinel(request.headers)) {
      body.clientType = "wolf";
    }
    if (Object.prototype.hasOwnProperty.call(body, "clientType") && !isClientType(body.clientType)) {
      return NextResponse.json({ error: "Client type is required." }, { status: 400 });
    }
    const client = await updateInternalClient(id, body, { workspaceId: workspace.id });
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update client";
    const status =
      message.includes("Cannot delete this client") || message.includes("paid invoice")
        ? 409
        : salesBusinessContextStatus(error) ?? apiErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const existing = await getInternalClient(id, { workspaceId: workspace.id });
    if (!existing) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    const requested = readRequestedSalesBusinessContext(request);
    if (!clientAllowedInRequestedSalesContext(existing, workspace.slug, requested)) {
      return NextResponse.json({ error: "Client not found." }, { status: 404 });
    }
    await deleteInternalClient(id, { workspaceId: workspace.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete client";
    const status =
      message.includes("Cannot delete this client") || message.includes("paid invoice")
        ? 409
        : salesBusinessContextStatus(error) ?? apiErrorStatus(error);
    return NextResponse.json({ error: message }, { status });
  }
}
