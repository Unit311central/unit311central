import { NextRequest, NextResponse } from "next/server";

import { createSupportTicket, listSupportTickets } from "@/lib/support-tickets-service";
import type { SupportTicketPriority } from "@/lib/support-data";
import { ensureSupportTicketsTable, withSupportTicketsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureSupportTicketsTable();
    const includeArchived = request.nextUrl.searchParams.get("includeArchived") !== "false";
    const tickets = await withSupportTicketsTable(() => listSupportTickets(includeArchived));
    return NextResponse.json({ tickets });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load support tickets";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      organisation?: string;
      priority?: SupportTicketPriority;
      description?: string;
      userAssigned?: string | null;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const name = body.name.trim();
    const ticket = await withSupportTicketsTable(() =>
      createSupportTicket({
        ...body,
        name,
      }),
    );
    return NextResponse.json({ ticket });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create support ticket";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
