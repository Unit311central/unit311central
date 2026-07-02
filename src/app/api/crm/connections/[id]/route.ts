import { NextRequest, NextResponse } from "next/server";

import { deleteConnection, updateConnection } from "@/lib/crm-connections-service";
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
      name?: string;
      role?: string;
      specialties?: string;
      background?: string;
      countryExperience?: string;
      city?: string;
      country?: string;
    };

    const connection = await updateConnection(id, body);
    return NextResponse.json({ connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteConnection(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
