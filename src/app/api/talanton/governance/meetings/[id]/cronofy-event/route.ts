import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { createTalantonBoardMeetingOnlineEvent } from "@/lib/talanton/board-meeting-cronofy-service";
import {
  listGovernanceMeetings,
  requireTalantonGovernanceWorkspace,
} from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const meeting = (await listGovernanceMeetings(workspace.id)).find((m) => m.id === id);
    if (!meeting) {
      return NextResponse.json({ error: "Meeting not found." }, { status: 404 });
    }

    const body = (await request.json().catch(() => ({}))) as { calendarId?: string };
    const result = await createTalantonBoardMeetingOnlineEvent({
      workspace,
      platformUserId: session.sub,
      meeting,
      calendarId: body.calendarId?.trim() || undefined,
    });

    console.info(
      "[governance/meetings cronofy-event]",
      JSON.stringify({
        meetingId: id,
        platformUserId: session.sub,
        ok: result.ok,
        code: result.ok ? "OK" : result.code,
        provider: result.ok ? result.provider : undefined,
        integratedConferencingAvailable: result.integratedConferencingAvailable,
        calendarProvider: result.ok ? undefined : result.calendarProvider,
        hasJoinUrl: result.ok ? Boolean(result.joinUrl) : Boolean(result.meeting.meetingInviteUrl),
      }),
    );

    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to create online meeting.";
    console.error("[governance/meetings cronofy-event]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
