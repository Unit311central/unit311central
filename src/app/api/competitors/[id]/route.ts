import { NextRequest, NextResponse } from "next/server";

import { deleteCompetitor, updateCompetitor } from "@/lib/competitors-service";
import { ensureCompetitorsTable, withCompetitorsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureCompetitorsTable();
    const { id } = await context.params;
    const body = (await request.json()) as {
      companyName?: string;
      website?: string;
      services?: string;
      serviceCategories?: string;
      droneTechnology?: string;
      lastRevenue?: string;
      notes?: string;
    };

    const competitor = await withCompetitorsTable(() => updateCompetitor(id, body));
    return NextResponse.json({ competitor });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update competitor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureCompetitorsTable();
    const { id } = await context.params;
    await withCompetitorsTable(() => deleteCompetitor(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete competitor";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
