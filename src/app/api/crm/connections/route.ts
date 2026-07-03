import { NextRequest, NextResponse } from "next/server";

import { createConnection, listConnections } from "@/lib/crm-connections-service";
import { createInitialConnections } from "@/lib/connections-seed-data";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ connections: createInitialConnections(), source: "local" });
  }

  try {
    const connections = await listConnections();
    if (connections.length === 0) {
      return NextResponse.json({ connections: createInitialConnections(), source: "local" });
    }
    return NextResponse.json({ connections });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load connections";
    return NextResponse.json({
      connections: createInitialConnections(),
      source: "local",
      warning: message,
    });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      role?: string;
      specialties?: string;
      background?: string;
      countryExperience?: string;
      city?: string;
      country?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const connection = await createConnection({
      name: body.name,
      role: body.role,
      specialties: body.specialties,
      background: body.background,
      countryExperience: body.countryExperience,
      city: body.city,
      country: body.country,
    });

    return NextResponse.json({ connection });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
