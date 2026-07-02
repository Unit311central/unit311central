import { NextRequest, NextResponse } from "next/server";

import type { ManagedClient } from "@/lib/client-management-data";
import { deleteInternalClient, updateInternalClient } from "@/lib/internal-clients-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as Partial<ManagedClient>;
    const client = await updateInternalClient(id, body);
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const { id } = await context.params;
    await deleteInternalClient(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
