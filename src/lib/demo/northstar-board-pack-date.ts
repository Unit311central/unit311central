/**
 * Northstar board deck meeting-date resolution — never invent Q1 2026 when user did not ask.
 */

import { NORTHSTAR_BOARD_MEETINGS } from "@/lib/demo/board-data";
import { parseExplicitAbhiBoardMeetingDate } from "@/lib/abhi/board-pack-date";

export type NorthstarBoardPackDateResolution =
  | { ok: true; meetingDate: string; meetingTitle?: string }
  | { ok: false; needsMeetingDate: true; message: string; options: Array<{ date: string; title: string }> };

function nextScheduledNorthstarBoardMeeting() {
  const scheduled = NORTHSTAR_BOARD_MEETINGS.filter((m) => m.status === "scheduled").sort((a, b) =>
    a.date.localeCompare(b.date),
  );
  return scheduled[0] ?? null;
}

export function resolveNorthstarBoardPackMeetingDate(input?: {
  meetingDate?: string | null;
  when?: string | null;
}): NorthstarBoardPackDateResolution {
  const explicit =
    parseExplicitAbhiBoardMeetingDate(input?.meetingDate) ??
    parseExplicitAbhiBoardMeetingDate(input?.when);
  if (explicit) {
    const match = NORTHSTAR_BOARD_MEETINGS.find((m) => m.date === explicit);
    return {
      ok: true,
      meetingDate: explicit,
      meetingTitle: match?.title,
    };
  }

  const scheduled = nextScheduledNorthstarBoardMeeting();
  if (scheduled) {
    return {
      ok: true,
      meetingDate: scheduled.date,
      meetingTitle: scheduled.title,
    };
  }

  const options = NORTHSTAR_BOARD_MEETINGS.filter(
    (m) => m.status === "scheduled" || m.status === "draft",
  )
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((m) => ({ date: m.date, title: m.title }));

  return {
    ok: false,
    needsMeetingDate: true,
    message:
      "Which board meeting is this deck for? Pick a meeting date below or tell me the date (e.g. 18 August 2026).",
    options: options.length
      ? options
      : scheduled
        ? [{ date: scheduled.date, title: scheduled.title }]
        : [],
  };
}
