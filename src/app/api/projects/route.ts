import { NextRequest, NextResponse } from "next/server";

import type { ProjectPhase } from "@/lib/projects-data";
import { createProject, listProjects } from "@/lib/internal-projects-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load projects";
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
      clientId?: string;
      clientName?: string;
      site?: string;
      region?: string;
      operator?: string;
      phase?: ProjectPhase;
      startDate?: string | null;
      endDate?: string | null;
      notes?: string;
    };

    if (!body.name?.trim()) {
      return NextResponse.json({ error: "Project name is required" }, { status: 400 });
    }
    if (!body.clientName?.trim()) {
      return NextResponse.json({ error: "Client is required" }, { status: 400 });
    }

    const project = await createProject({
      name: body.name,
      clientId: body.clientId,
      clientName: body.clientName,
      site: body.site,
      region: body.region,
      operator: body.operator,
      phase: body.phase,
      startDate: body.startDate,
      endDate: body.endDate,
      notes: body.notes,
    });

    return NextResponse.json({ project });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create project";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
