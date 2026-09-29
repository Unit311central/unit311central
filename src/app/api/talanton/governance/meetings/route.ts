import { NextRequest, NextResponse } from "next/server";

import { apiErrorStatus } from "@/lib/api-error-status";
import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import { boardMeetingStartEndFromLocal } from "@/lib/talanton/board-meeting-schedule";
import {
  ensureGovernanceMeetings,
  requireTalantonGovernanceWorkspace,
  upsertGovernanceMeeting,
} from "@/lib/talanton/workspace-governance-service";
import { getPlatformSession } from "@/lib/platform-session";
import { WorkspaceAccessError } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }
  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const meetings = await ensureGovernanceMeetings({
      workspaceId: workspace.id,
      workspaceSlug: workspace.slug,
    });
    return NextResponse.json({ meetings });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to load governance meetings.";
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}

export async function POST(request: NextRequest) {
  const demoBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoBlock) return demoBlock;

  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const workspace = await requireTalantonGovernanceWorkspace();
    const body = (await request.json()) as Partial<GovernanceMeeting> & {
      meetingTime?: string;
      meetingTzid?: string;
    };
    const now = new Date().toISOString();
    let meetingDate = body.meetingDate?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);
    let meetingStartAt = body.meetingStartAt ?? null;
    let meetingEndAt = body.meetingEndAt ?? null;
    if (body.meetingTime?.trim()) {
      const schedule = boardMeetingStartEndFromLocal({
        date: meetingDate,
        time: body.meetingTime.trim(),
        tzid: body.meetingTzid,
      });
      meetingDate = schedule.meetingDate;
      meetingStartAt = schedule.meetingStartAt;
      meetingEndAt = schedule.meetingEndAt;
    }
    const meeting: GovernanceMeeting = {
      id: body.id?.trim() || `gov-${crypto.randomUUID().slice(0, 8)}`,
      meetingDate,
      meetingType: body.meetingType ?? "Board Meeting",
      title: body.title?.trim() || "New governance meeting",
      status: body.status ?? "Draft",
      attendees: body.attendees ?? [],
      minutes: body.minutes ?? "",
      decisions: body.decisions ?? [],
      actions: body.actions ?? [],
      meetingInviteUrl: body.meetingInviteUrl?.trim() ?? "",
      meetingStartAt,
      meetingEndAt,
      cronofyCalendarId: body.cronofyCalendarId ?? "",
      cronofyEventId: body.cronofyEventId ?? "",
      conferencingProvider: body.conferencingProvider ?? "",
      connectedCalendarProvider: body.connectedCalendarProvider ?? "",
      archived: body.archived ?? false,
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };
    const saved = await upsertGovernanceMeeting(workspace.id, meeting);
    return NextResponse.json({ meeting: saved }, { status: 201 });
  } catch (error) {
    if (error instanceof WorkspaceAccessError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    const message = error instanceof Error ? error.message : "Failed to create meeting.";
    console.error("[governance/meetings POST]", message);
    return NextResponse.json({ error: message }, { status: apiErrorStatus(error) });
  }
}
