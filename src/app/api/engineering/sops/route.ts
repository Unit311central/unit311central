import { NextRequest, NextResponse } from "next/server";

import { createEngineeringSop, listEngineeringSops } from "@/lib/engineering-sop/service";
import { engineeringSopActor, engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    await requirePlatformSession();
    const params = request.nextUrl.searchParams;
    const sops = await listEngineeringSops(undefined, {
      search: params.get("search") ?? undefined,
      status: params.get("status") ?? undefined,
      templatesOnly: params.get("templates") === "1",
      excludeTemplates: params.get("templates") !== "1",
    });
    return NextResponse.json({ sops });
  } catch (error) {
    return engineeringSopErrorResponse(error, "Failed to load SOPs.");
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const body = (await request.json()) as Record<string, unknown>;
    const sop = await createEngineeringSop(
      {
        number: String(body.number ?? ""),
        title: String(body.title ?? ""),
        owner: String(body.owner ?? ""),
        approver: String(body.approver ?? ""),
        reviewDate: String(body.reviewDate ?? ""),
        category: typeof body.category === "string" ? body.category : null,
        summary: typeof body.summary === "string" ? body.summary : "",
        isTemplate: body.isTemplate === true,
        sections: Array.isArray(body.sections) ? body.sections : undefined,
      },
      engineeringSopActor(session),
    );
    return NextResponse.json({ sop }, { status: 201 });
  } catch (error) {
    return engineeringSopErrorResponse(error, "Failed to create SOP.");
  }
}
