/**
 * Demo-only attendance module checks.
 * Run: node --import tsx src/lib/__tests__/attendance-demo.check.ts
 */
import assert from "node:assert/strict";

import { ATTENDANCE_CAST } from "@/lib/attendance/cast";
import { DEMO_ATTENDANCE_WORKSPACE_ID } from "@/lib/attendance/constants";
import { assertDemoAttendanceWorkspace, simulationResetFilter } from "@/lib/attendance/isolation";
import { injectDemoAttendanceNav } from "@/lib/attendance/nav";
import { classifyAttendanceDay } from "@/lib/attendance/status";
import {
  simulationBeatKey,
  simulationBeatsForWeekday,
} from "@/lib/attendance/simulation-script";
import { londonWallTimeToUtc } from "@/lib/attendance/time";
import { internalSurveyNavSections } from "@/lib/internal-operations-data";

assert.equal(DEMO_ATTENDANCE_WORKSPACE_ID, "9f555e68-6430-4c9a-889b-b135f2acf8bf");
assert.equal(ATTENDANCE_CAST.length, 5);
assert.deepEqual(
  ATTENDANCE_CAST.map((member) => [member.employeeNumber, member.firstName, member.department]),
  [
    ["EMP001", "John", "Care"],
    ["EMP002", "Sarah", "Nursing"],
    ["EMP003", "David", "Maintenance"],
    ["EMP004", "Emma", "Administration"],
    ["EMP005", "James", "Care"],
  ],
);

assert.throws(() => assertDemoAttendanceWorkspace({ id: DEMO_ATTENDANCE_WORKSPACE_ID, slug: "unit311" }));
assert.throws(() =>
  assertDemoAttendanceWorkspace({
    id: "00000000-0000-4000-8000-000000000001",
    slug: "demo",
  }),
);
assert.doesNotThrow(() =>
  assertDemoAttendanceWorkspace({ id: DEMO_ATTENDANCE_WORKSPACE_ID, slug: "demo" }),
);

const reset = simulationResetFilter("9f555e68-6430-4c9a-889b-b135f2acf8bf");
assert.equal(reset.workspaceId, DEMO_ATTENDANCE_WORKSPACE_ID);
assert.equal(reset.source, "SIMULATED");
assert.throws(() => simulationResetFilter("not-a-uuid"));

const demoNav = injectDemoAttendanceNav(internalSurveyNavSections, "demo");
const demoTools = demoNav.find((section) => section.label === "Tools");
const attendance = demoTools?.items.find((item) => item.label === "ATTENDANCE");
assert.ok(attendance);
assert.equal(attendance?.view, undefined);
assert.deepEqual(
  attendance?.children?.map((child) => child.label),
  ["Dashboard", "Employees", "Test"],
);
assert.deepEqual(
  attendance?.children?.map((child) => child.view),
  ["attendance-dashboard", "attendance-employees", "attendance-test"],
);

for (const slug of ["unit311", "onwardair", "abhi", "talantonimpact", "wolf-central"]) {
  const nav = injectDemoAttendanceNav(internalSurveyNavSections, slug);
  const tools = nav.find((section) => section.label === "Tools");
  assert.ok(!tools?.items.some((item) => item.label === "ATTENDANCE"), `${slug} must not show Attendance`);
}

const canonicalTools = internalSurveyNavSections.find((section) => section.label === "Tools");
assert.ok(!canonicalTools?.items.some((item) => item.label === "ATTENDANCE"));

assert.equal(londonWallTimeToUtc("2026-11-09", "09:12").toISOString(), "2026-11-09T09:12:00.000Z");

const asOfEvening = new Date("2026-11-09T18:00:00.000Z");
const late = classifyAttendanceDay({
  dayIso: "2026-11-09",
  asOf: asOfEvening,
  schedule: { expectedStart: "08:30", expectedEnd: "17:00" },
  events: [
    { eventType: "IN", eventTimestamp: "2026-11-09T09:12:00.000Z" },
    { eventType: "OUT", eventTimestamp: "2026-11-09T17:02:00.000Z" },
  ],
});
assert.equal(late.status, "Late arrival");
assert.equal(late.late, true);
assert.equal(late.hoursWorked, 7.8);

const complete = classifyAttendanceDay({
  dayIso: "2026-11-09",
  asOf: asOfEvening,
  schedule: { expectedStart: "08:00", expectedEnd: "16:30" },
  events: [
    { eventType: "IN", eventTimestamp: "2026-11-09T08:02:00.000Z" },
    { eventType: "OUT", eventTimestamp: "2026-11-09T16:28:00.000Z" },
  ],
});
assert.equal(complete.status, "Complete");
assert.equal(complete.hoursWorked, 8.4);

const onSite = classifyAttendanceDay({
  dayIso: "2026-11-09",
  asOf: new Date("2026-11-09T10:00:00.000Z"),
  schedule: { expectedStart: "08:30", expectedEnd: "17:00" },
  events: [{ eventType: "IN", eventTimestamp: "2026-11-09T09:12:00.000Z" }],
});
assert.equal(onSite.status, "Currently on site");
assert.equal(onSite.onSite, true);
assert.equal(onSite.late, true);

const early = classifyAttendanceDay({
  dayIso: "2026-11-11",
  asOf: new Date("2026-11-11T18:00:00.000Z"),
  schedule: { expectedStart: "08:00", expectedEnd: "16:30" },
  events: [
    { eventType: "IN", eventTimestamp: "2026-11-11T08:04:00.000Z" },
    { eventType: "OUT", eventTimestamp: "2026-11-11T15:00:00.000Z" },
  ],
});
assert.equal(early.status, "Early departure");

const missing = classifyAttendanceDay({
  dayIso: "2026-11-13",
  asOf: new Date("2026-11-13T18:00:00.000Z"),
  schedule: { expectedStart: "08:00", expectedEnd: "17:00" },
  events: [{ eventType: "IN", eventTimestamp: "2026-11-13T08:06:00.000Z" }],
});
assert.equal(missing.status, "Missing clock-out");
assert.equal(missing.clockOut, null);

const absent = classifyAttendanceDay({
  dayIso: "2026-11-12",
  asOf: new Date("2026-11-12T18:00:00.000Z"),
  schedule: { expectedStart: "09:00", expectedEnd: "17:30" },
  events: [],
});
assert.equal(absent.status, "Absent");

const expected = classifyAttendanceDay({
  dayIso: "2026-11-12",
  asOf: new Date("2026-11-12T08:00:00.000Z"),
  schedule: { expectedStart: "09:00", expectedEnd: "17:30" },
  events: [],
});
assert.equal(expected.status, "Expected");

const scenarios = new Set(simulationBeatsForWeekday(1).concat(
  simulationBeatsForWeekday(2),
  simulationBeatsForWeekday(3),
  simulationBeatsForWeekday(4),
  simulationBeatsForWeekday(5),
).map((beat) => beat.scenario));
for (const scenario of ["Normal clock-in", "Normal clock-out", "Late arrival", "Early departure", "Missing clock-out"]) {
  assert.ok(scenarios.has(scenario), scenario);
}
assert.ok(!simulationBeatsForWeekday(4).some((beat) => beat.employeeNumber === "EMP004"));
assert.equal(simulationBeatsForWeekday(5).filter((beat) => beat.employeeNumber === "EMP003").length, 1);

for (let weekday = 1; weekday <= 5; weekday += 1) {
  const keys = simulationBeatsForWeekday(weekday).map((beat) => simulationBeatKey(beat, `day-${weekday}`));
  assert.equal(new Set(keys).size, keys.length);
}

console.log("ok  attendance-demo checks passed");
