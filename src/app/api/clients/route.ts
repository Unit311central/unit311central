import { NextRequest, NextResponse } from "next/server";

import type {
  ClientAccountStatus,
  ClientContractType,
  ClientIndustry,
  ClientRegion,
} from "@/lib/client-management-data";
import { createInternalClient, listInternalClients } from "@/lib/internal-clients-service";
import { ensureInternalClientsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureInternalClientsTable();
    const clients = await listInternalClients();
    return NextResponse.json({ clients });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load clients";
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
      industry?: ClientIndustry;
      primaryContact?: string;
      email?: string;
      phone?: string;
      region?: ClientRegion;
      accountStatus?: ClientAccountStatus;
      contractType?: ClientContractType;
      taxId?: string;
      billingAddress?: string;
      activeProjects?: number;
      notes?: string;
      platformUrl?: string;
    };

    await ensureInternalClientsTable();
    const client = await createInternalClient(body);
    return NextResponse.json({ client });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create client";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
