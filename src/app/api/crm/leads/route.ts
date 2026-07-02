import { NextRequest, NextResponse } from "next/server";

import type { LeadStatus } from "@/lib/crm-data";
import { createLead, listLeads } from "@/lib/crm-leads-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const status = request.nextUrl.searchParams.get("status") as LeadStatus | "All" | null;
    const leads = await listLeads(status ?? "All");
    return NextResponse.json({ leads });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load leads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
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

    if (!body.companyName?.trim() || !body.contactName?.trim()) {
      return NextResponse.json(
        { error: "Company name and contact name are required" },
        { status: 400 },
      );
    }

    const lead = await createLead(body as { companyName: string; contactName: string });
    return NextResponse.json({ lead });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create lead";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
