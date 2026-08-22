import { NextRequest, NextResponse } from "next/server";

import { engineeringSopActor, engineeringSopErrorResponse } from "@/lib/engineering-sop/api-helpers";
import {
  approveEngineeringSop,
  createEngineeringSopFromTemplate,
  createEngineeringSopVersion,
  rejectEngineeringSop,
  retireEngineeringSop,
  submitEngineeringSopForReview,
} from "@/lib/engineering-sop/service";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }
  try {
    const session = await requirePlatformSession();
    const { id } = await context.params;
    const body = (await request.json()) as { action?: string; comment?: string; title?: string; number?: string; owner?: string };
    const actor = engineeringSopActor(session);
    switch (body.action) {
      case "submit":
        return NextResponse.json({ sop: await submitEngineeringSopForReview(id, actor) });
      case "approve":
        return NextResponse.json({ sop: await approveEngineeringSop(id, actor) });
      case "reject":
        return NextResponse.json({ sop: await rejectEngineeringSop(id, actor, body.comment) });
      case "retire":
        return NextResponse.json({ sop: await retireEngineeringSop(id, actor) });
      case "version":
        return NextResponse.json({ sop: await createEngineeringSopVersion(id, actor) });
      case "from-template":
        return NextResponse.json({
          sop: await createEngineeringSopFromTemplate(id, { title: body.title, number: body.number, owner: body.owner }, actor),
        });
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (error) {
    return engineeringSopErrorResponse(error);
  }
}
