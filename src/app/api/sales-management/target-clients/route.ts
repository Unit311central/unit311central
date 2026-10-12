import { NextRequest, NextResponse } from "next/server";

import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireTargetClientsApiContext, targetClientsErrorResponse } from "@/lib/target-clients-api-context";
import {
  validateAddTargetClientForm,
  type AddTargetClientFormValues,
} from "@/lib/target-clients";
import {
  TargetClientDuplicateError,
  createTargetClientFromForm,
  listTargetClients,
} from "@/lib/target-clients-service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);
    const clients = await listTargetClients({ workspaceId: workspace.id });
    return NextResponse.json({
      clients,
      workspace: { id: workspace.id, slug: workspace.slug },
    });
  } catch (error) {
    return targetClientsErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const workspace = await requireTargetClientsApiContext(request);

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

    const client = await createTargetClientFromForm(values, { workspaceId: workspace.id });
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
