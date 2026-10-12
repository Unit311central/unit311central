import { NextRequest, NextResponse } from "next/server";

import { getRequestHost } from "@/lib/app-domains";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  assertTargetClientsApiHost,
  validateAddTargetClientForm,
  type AddTargetClientFormValues,
} from "@/lib/target-clients";
import {
  TargetClientDuplicateError,
  deleteTargetClient,
  updateTargetClientFromForm,
} from "@/lib/target-clients-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

function assertInternalCentralWorkspace(slug: string) {
  if (slug !== INTERNAL_WORKSPACE_SLUG) {
    throw new Error("Target Clients is only available on the internal Unit311Central workspace.");
  }
}

function targetClientsErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Request failed.";
  let status = 500;
  if (
    message.includes("Authentication required") ||
    message.includes("Workspace context") ||
    message.includes("Session")
  ) {
    status = 401;
  } else if (message.includes("only available on the internal") || message.includes("not a Target Client")) {
    status = 403;
  } else if (message.includes("Lead not found")) {
    status = 404;
  }
  return NextResponse.json({ error: message }, { status });
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
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const { id } = await context.params;
    const body = (await request.json()) as Partial<AddTargetClientFormValues>;
    const values: AddTargetClientFormValues = {
      companyName: String(body.companyName ?? ""),
      website: String(body.website ?? ""),
      sector: String(body.sector ?? ""),
      contactName: String(body.contactName ?? ""),
      contactPosition: String(body.contactPosition ?? ""),
      email: String(body.email ?? ""),
    };

    const fieldErrors = validateAddTargetClientForm(values);
    if (Object.keys(fieldErrors).length > 0) {
      return NextResponse.json({ error: "Validation failed.", fieldErrors }, { status: 400 });
    }

    const client = await updateTargetClientFromForm(id, values, { workspaceId: workspace.id });
    return NextResponse.json({ client });
  } catch (error) {
    if (error instanceof TargetClientDuplicateError) {
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          matches: error.matches.map((lead) => ({
            id: lead.id,
            companyName: lead.companyName,
            email: lead.email,
            status: lead.status,
          })),
        },
        { status: 409 },
      );
    }
    return targetClientsErrorResponse(error);
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
    assertTargetClientsApiHost(getRequestHost(request));
    assertInternalCentralWorkspace(workspace.slug);

    const { id } = await context.params;
    await deleteTargetClient(id, { workspaceId: workspace.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return targetClientsErrorResponse(error);
  }
}
