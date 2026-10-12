import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import {
  requireTargetClientsApiContext,
  targetClientsErrorResponse,
} from "@/lib/target-clients-api-context";
import {
  validateAddTargetClientForm,
  type AddTargetClientFormValues,
} from "@/lib/target-clients";
import {
  TargetClientDuplicateError,
  deleteTargetClient,
  updateTargetClientFromForm,
} from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);

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
    const workspace = await requireTargetClientsApiContext(request);

    const { id } = await context.params;
    await deleteTargetClient(id, { workspaceId: workspace.id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return targetClientsErrorResponse(error);
  }
}
