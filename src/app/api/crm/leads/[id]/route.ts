import { NextRequest, NextResponse } from "next/server";

import type { LeadStatus } from "@/lib/crm-data";
import { deleteLead, updateLead } from "@/lib/crm-leads-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      companyName?: string;
      contactName?: string;
      email?: string;
      phone?: string;
      status?: LeadStatus;
      source?: string;
      nextAction?: string;
      nextActionDate?: string | null;
      estimatedValue?: number | null;
      notes?: string;
    };

    const lead = await updateLead(id, body);
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteLead(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
