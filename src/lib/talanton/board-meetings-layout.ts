/**
 * Board Meetings landing layout — next meeting, quarterly previous row, archive partition.
 * Uses GovernanceMeeting records only (no invented meeting history).
 */

import type { GovernanceMeeting } from "@/lib/talanton/governance-types";

/** UI layout example when no upcoming board meeting exists in governance data. */
export const TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW = {
  title: "Talanton Impact Board",
  monthLabel: "November 2026",
  meetingDate: "2026-11-15",
} as const;

export type BoardMeetingSlot = {
  quarterLabel: "Q1" | "Q2" | "Q3";
  meeting: GovernanceMeeting | null;
};

export type BoardMeetingsLandingPartition = {
  nextMeeting: GovernanceMeeting | null;
  /** When true, show {@link TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW} (not a DB record). */
  useNextMeetingPreview: boolean;
  previousSlots: BoardMeetingSlot[];
  archiveMeetings: GovernanceMeeting[];
};

function isBoardMeeting(m: GovernanceMeeting): boolean {
  return m.meetingType === "Board Meeting";
}

function yearOf(isoDate: string): number {
  return Number.parseInt(isoDate.slice(0, 4), 10);
}

export function formatBoardMeetingMonthYear(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export function formatBoardMeetingLongDate(isoDate: string): string {
  const d = new Date(`${isoDate.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return isoDate;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

export function partitionBoardMeetingsForLanding(
  meetings: readonly GovernanceMeeting[],
  referenceDate = new Date(),
): BoardMeetingsLandingPartition {
  const today = referenceDate.toISOString().slice(0, 10);
  const activeBoard = meetings
    .filter((m) => isBoardMeeting(m) && !m.archived)
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));

  const upcoming = activeBoard
    .filter((m) => m.meetingDate >= today && m.status !== "Held")
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));

  const nextMeeting = upcoming[0] ?? null;
  const useNextMeetingPreview = !nextMeeting;

  const cycleYear = nextMeeting ? yearOf(nextMeeting.meetingDate) : yearOf(today);

  const previousCandidates = activeBoard
    .filter((m) => {
      if (nextMeeting && m.id === nextMeeting.id) return false;
      if (yearOf(m.meetingDate) !== cycleYear) return false;
      if (nextMeeting && m.meetingDate >= nextMeeting.meetingDate) return false;
      return m.meetingDate < today || m.status === "Held";
    })
    .sort((a, b) => a.meetingDate.localeCompare(b.meetingDate));

  const previousThree = previousCandidates.slice(-3);
  const previousSlots: BoardMeetingSlot[] = (
    [
      { quarterLabel: "Q1" as const, meeting: previousThree[0] ?? null },
      { quarterLabel: "Q2" as const, meeting: previousThree[1] ?? null },
      { quarterLabel: "Q3" as const, meeting: previousThree[2] ?? null },
    ]
  );

  const featuredIds = new Set<string>();
  if (nextMeeting) featuredIds.add(nextMeeting.id);
  for (const slot of previousSlots) {
    if (slot.meeting) featuredIds.add(slot.meeting.id);
  }

  const archiveMeetings = meetings
    .filter((m) => isBoardMeeting(m))
    .filter((m) => m.archived || !featuredIds.has(m.id))
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));

  return {
    nextMeeting,
    useNextMeetingPreview,
    previousSlots,
    archiveMeetings,
  };
}

export function boardDeckHrefForMeetingDate(meetingDate: string): string {
  return `/board/decks?meeting=${encodeURIComponent(meetingDate.slice(0, 10))}`;
}

export function boardMinutesHref(meetingId?: string): string {
  const base = "/internaldashboard?view=board-minutes";
  if (!meetingId) return base;
  return `${base}&meeting=${encodeURIComponent(meetingId)}`;
}
