import { NextResponse } from "next/server";

import { getClientOnboardingQuestionnaireSummary } from "@/lib/client-onboarding-service";
import { isDemoApiRequest } from "@/lib/demo/demo-request";
import { getNorthstarOnboardingQuestionnaire } from "@/lib/demo/northstar-api-fixtures";
import { requireInternalWorkspaceSession } from "@/lib/internal-admin-auth";
import { ensureClientOnboardingRecordsTable } from "@/lib/internal-db-migrations";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  if (await isDemoApiRequest()) {
    const summary = getNorthstarOnboardingQuestionnaire(id);
    if (!summary) {
      return NextResponse.json({ error: "Questionnaire details not found." }, { status: 404 });
    }
    return NextResponse.json({ summary });
  }

  const auth = await requireInternalWorkspaceSession();
  if ("error" in auth) return auth.error;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await ensureClientOnboardingRecordsTable().catch(() => false);

    const summary = await getClientOnboardingQuestionnaireSummary(id, auth.workspace.id);

    if (!summary) {
      return NextResponse.json({ error: "Questionnaire details not found." }, { status: 404 });
    }

    return NextResponse.json({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load questionnaire details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
