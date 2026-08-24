import { NextRequest, NextResponse } from "next/server";

import { approveExpense } from "@/lib/expense-management/approvals-service";
import { scheduleApprovedExpense } from "@/lib/expense-management/approvals-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const { id } = await context.params;
    const body = (await request.json().catch(() => ({}))) as { comment?: string; schedule?: boolean };

    await approveExpense(id, workspace.id, workspace.slug, {
      userId: session.sub,
      displayName: session.displayName,
    }, body.comment);

    if (body.schedule) {
      await scheduleApprovedExpense(id, workspace.id, workspace.slug);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approve failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
