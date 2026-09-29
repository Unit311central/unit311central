import { TALANTON_BOARD_MEETING_TZID } from "@/lib/cronofy/config";
import {
  createOrUpdateCronofyEvent,
  extractJoinUrlFromConferencing,
  listCronofyCalendars,
  pickWritableCalendarForConferencing,
  readCronofyEvents,
} from "@/lib/cronofy/client";
import { getValidCronofyAccessToken } from "@/lib/cronofy/cronofy-account-service";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import {
  upsertGovernanceMeeting,
} from "@/lib/talanton/workspace-governance-service";
import type { CurrentWorkspace } from "@/lib/workspace-context";

export type CreateBoardMeetingCalendarResult =
  | {
      ok: true;
      meeting: GovernanceMeeting;
      joinUrl: string;
      provider: string;
      calendarId: string;
      integratedConferencingAvailable: boolean;
    }
  | {
      ok: false;
      code:
        | "NO_CALENDAR_CONNECTION"
        | "NO_WRITABLE_CALENDAR"
        | "INTEGRATED_CONFERENCING_UNAVAILABLE"
        | "CONFERENCING_PENDING_TIMEOUT"
        | "CONFERENCING_NOT_GENERATED";
      message: string;
      meeting: GovernanceMeeting;
      calendarProvider?: string;
      integratedConferencingAvailable?: boolean;
    };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function localDateTimeParts(isoStart: string, tzid: string): { startLocal: string; endLocal: string } {
  const start = new Date(isoStart);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzid,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const toParts = (d: Date) => {
    const parts = fmt.formatToParts(d);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}:${get("second")}`;
  };
  return { startLocal: toParts(start), endLocal: toParts(end) };
}

export async function createTalantonBoardMeetingOnlineEvent(args: {
  workspace: CurrentWorkspace;
  platformUserId: string;
  meeting: GovernanceMeeting;
  calendarId?: string;
  tzid?: string;
}): Promise<CreateBoardMeetingCalendarResult> {
  const tzid = args.tzid ?? TALANTON_BOARD_MEETING_TZID;
  const startIso =
    args.meeting.meetingStartAt ??
    `${args.meeting.meetingDate.slice(0, 10)}T14:00:00.000Z`;
  const endIso =
    args.meeting.meetingEndAt ??
    new Date(Date.parse(startIso) + 2 * 60 * 60 * 1000).toISOString();

  let accessToken: string;
  let linkedProvider = "";
  try {
    const token = await getValidCronofyAccessToken({
      platformUserId: args.platformUserId,
      workspaceId: args.workspace.id,
    });
    accessToken = token.accessToken;
    linkedProvider = token.account.linkedProviderName;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Calendar not connected.";
    return {
      ok: false,
      code: "NO_CALENDAR_CONNECTION",
      message,
      meeting: args.meeting,
    };
  }

  const calendars = await listCronofyCalendars(accessToken);
  console.info(
    "[cronofy/board-meeting] calendars",
    JSON.stringify({
      meetingId: args.meeting.id,
      platformUserId: args.platformUserId,
      workspaceId: args.workspace.id,
      calendarCount: calendars.length,
      calendars: calendars.map((c) => ({
        calendarId: c.calendar_id,
        calendarName: c.calendar_name,
        providerName: c.provider_name,
        profileName: c.profile_name,
        calendarPrimary: c.calendar_primary,
        integratedConferencingAvailable: c.calendar_integrated_conferencing_available,
        readonly: c.calendar_readonly,
        deleted: c.calendar_deleted,
      })),
    }),
  );

  let calendar = args.calendarId
    ? calendars.find((c) => c.calendar_id === args.calendarId && !c.calendar_deleted && !c.calendar_readonly)
    : undefined;
  let integratedAvailable = Boolean(calendar?.calendar_integrated_conferencing_available);
  if (!calendar) {
    const picked = pickWritableCalendarForConferencing(calendars);
    if (!picked) {
      return {
        ok: false,
        code: "NO_WRITABLE_CALENDAR",
        message: "No writable calendar was found on your Cronofy account.",
        meeting: args.meeting,
      };
    }
    calendar = picked.calendar;
    integratedAvailable = picked.integratedAvailable;
  }

  console.info(
    "[cronofy/board-meeting] selected-calendar",
    JSON.stringify({
      meetingId: args.meeting.id,
      calendarId: calendar.calendar_id,
      providerName: calendar.provider_name,
      profileName: calendar.profile_name,
      integratedConferencingAvailable: integratedAvailable,
    }),
  );

  if (!integratedAvailable) {
    return {
      ok: false,
      code: "INTEGRATED_CONFERENCING_UNAVAILABLE",
      message:
        "Microsoft Teams online meetings are not available for this calendar. Personal Outlook.com accounts and some Microsoft calendars cannot use Cronofy integrated Teams conferencing — connect a Microsoft 365 work or school account with Teams licensing.",
      meeting: args.meeting,
      calendarProvider: calendar.provider_name,
      integratedConferencingAvailable: false,
    };
  }

  const conferencingProfileId: "integrated" = "integrated";
  const { startLocal, endLocal } = localDateTimeParts(startIso, tzid);
  const eventId = args.meeting.cronofyEventId || args.meeting.id;

  await createOrUpdateCronofyEvent({
    accessToken,
    calendarId: calendar.calendar_id,
    eventId,
    summary: args.meeting.title,
    start: startLocal,
    end: endLocal,
    tzid,
    conferencingProfileId,
    description: "Talanton Impact board meeting (Unit311 Central).",
  });

  const from = new Date(Date.parse(startIso) - 60 * 60 * 1000).toISOString();
  const to = new Date(Date.parse(endIso) + 60 * 60 * 1000).toISOString();

  let joinUrl: string | null = null;
  let provider: string | null = null;
  let pending = true;

  for (let attempt = 0; attempt < 8; attempt += 1) {
    await sleep(attempt === 0 ? 800 : 1500);
    const events = await readCronofyEvents({
      accessToken,
      calendarId: calendar.calendar_id,
      from,
      to,
    });
    const event = events.find((e) => e.event_id === eventId);
    const parsed = extractJoinUrlFromConferencing(event?.conferencing);
    pending = parsed.pending;
    joinUrl = parsed.joinUrl;
    provider = parsed.provider;
    console.info(
      "[cronofy/board-meeting] poll-conferencing",
      JSON.stringify({
        meetingId: args.meeting.id,
        attempt: attempt + 1,
        eventFound: Boolean(event),
        pending: parsed.pending,
        provider: parsed.provider,
        hasJoinUrl: Boolean(parsed.joinUrl),
      }),
    );
    if (joinUrl) break;
    if (!pending && !joinUrl) break;
  }

  const partialUpdate: GovernanceMeeting = {
    ...args.meeting,
    meetingStartAt: startIso,
    meetingEndAt: endIso,
    cronofyCalendarId: calendar.calendar_id,
    cronofyEventId: eventId,
    connectedCalendarProvider: calendar.provider_name || linkedProvider,
    conferencingProvider: provider ?? "",
    meetingInviteUrl: joinUrl ?? args.meeting.meetingInviteUrl ?? "",
    status: args.meeting.status === "Draft" ? "Scheduled" : args.meeting.status,
  };

  const saved = await upsertGovernanceMeeting(args.workspace.id, partialUpdate);

  if (!joinUrl) {
    if (pending) {
      console.warn(
        "[cronofy/board-meeting] conferencing-pending-timeout",
        JSON.stringify({ meetingId: args.meeting.id, eventId, calendarId: calendar.calendar_id }),
      );
      return {
        ok: false,
        code: "CONFERENCING_PENDING_TIMEOUT",
        message:
          "The calendar event was created but the online meeting link is still being generated. Try again in a minute or open your calendar.",
        meeting: saved,
        calendarProvider: calendar.provider_name,
        integratedConferencingAvailable: integratedAvailable,
      };
    }
    console.warn(
      "[cronofy/board-meeting] conferencing-not-generated",
      JSON.stringify({
        meetingId: args.meeting.id,
        eventId,
        calendarId: calendar.calendar_id,
        provider,
      }),
    );
    return {
      ok: false,
      code: "CONFERENCING_NOT_GENERATED",
      message:
        "The calendar event was saved, but Cronofy did not return an integrated conferencing join URL. The connected account may not include Teams licensing.",
      meeting: saved,
      calendarProvider: calendar.provider_name,
      integratedConferencingAvailable: integratedAvailable,
    };
  }

  const withUrl = await upsertGovernanceMeeting(args.workspace.id, {
    ...saved,
    meetingInviteUrl: joinUrl,
    conferencingProvider: provider ?? saved.conferencingProvider ?? "",
  });

  console.info(
    "[cronofy/board-meeting] success",
    JSON.stringify({
      meetingId: args.meeting.id,
      calendarId: calendar.calendar_id,
      provider: provider ?? "",
      joinUrlHost: (() => {
        try {
          return new URL(joinUrl).host;
        } catch {
          return "";
        }
      })(),
      meetingInviteUrlPersisted: Boolean(withUrl.meetingInviteUrl),
    }),
  );

  return {
    ok: true,
    meeting: withUrl,
    joinUrl,
    provider: provider ?? "",
    calendarId: calendar.calendar_id,
    integratedConferencingAvailable: integratedAvailable,
  };
}
