/**
 * Talanton Board Meetings landing layout.
 * Run: node --import tsx src/lib/__tests__/talanton-board-meetings-layout.check.ts
 */
import assert from "node:assert/strict";

import {
  formatBoardMeetingLongDate,
  partitionBoardMeetingsForLanding,
  TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW,
} from "@/lib/talanton/board-meetings-layout";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";

function meeting(partial: Partial<GovernanceMeeting> & Pick<GovernanceMeeting, "id" | "meetingDate">): GovernanceMeeting {
  return {
    meetingType: "Board Meeting",
    title: "Talanton Impact Board — Test",
    status: "Held",
    attendees: [],
    minutes: "",
    decisions: [],
    actions: [],
    meetingInviteUrl: "",
    archived: false,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

const ref = new Date("2026-09-29T12:00:00Z");

const may = meeting({ id: "m1", meetingDate: "2026-05-14", status: "Held" });
const aug = meeting({ id: "m2", meetingDate: "2026-08-20", status: "Scheduled" });
const nov = meeting({ id: "m3", meetingDate: "2026-11-15", status: "Draft" });

const withNext = partitionBoardMeetingsForLanding([may, aug, nov], ref);
assert.equal(withNext.nextMeeting?.id, "m3");
assert.equal(withNext.useNextMeetingPreview, false);
assert.equal(withNext.previousSlots.filter((s) => s.meeting).length, 2);

const noFuture = partitionBoardMeetingsForLanding([may, aug], ref);
assert.equal(noFuture.nextMeeting, null);
assert.ok(noFuture.useNextMeetingPreview);

assert.equal(
  formatBoardMeetingLongDate(TALANTON_BOARD_NEXT_MEETING_UI_PREVIEW.meetingDate),
  "15 November 2026",
);

console.log("prove:talanton-board-meetings-layout: OK");
