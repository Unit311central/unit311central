import { ATTENDANCE_GRACE_MINUTES } from "@/lib/attendance/constants";
import { londonIsoDate, londonParts, minutesFromClock } from "@/lib/attendance/time";

export type AttendanceEventType = "IN" | "OUT";

export type AttendanceStatusLabel =
  | "Complete"
  | "Currently on site"
  | "Missing clock-out"
  | "Late arrival"
  | "Early departure"
  | "Late arrival · Early departure"
  | "Absent"
  | "Expected";

export type DayEvent = {
  eventType: AttendanceEventType;
  eventTimestamp: string;
};

export type DaySchedule = {
  expectedStart: string;
  expectedEnd: string;
};

export type ClassifiedAttendanceDay = {
  status: AttendanceStatusLabel;
  clockIn: string | null;
  clockOut: string | null;
  hoursWorked: number | null;
  clockInCount: number;
  late: boolean;
  early: boolean;
  onSite: boolean;
  missingClockOut: boolean;
  absent: boolean;
};

export function classifyAttendanceDay(input: {
  events: readonly DayEvent[];
  schedule: DaySchedule | null;
  dayIso: string;
  asOf: Date;
}): ClassifiedAttendanceDay {
  const sorted = [...input.events].sort((left, right) =>
    left.eventTimestamp.localeCompare(right.eventTimestamp),
  );
  const clockIns = sorted.filter((event) => event.eventType === "IN");
  const clockOuts = sorted.filter((event) => event.eventType === "OUT");
  const firstIn = clockIns[0] ?? null;

  let open: string | null = null;
  let workedMinutes = 0;
  let lastClosedOut: string | null = null;
  for (const event of sorted) {
    if (event.eventType === "IN") {
      if (!open) open = event.eventTimestamp;
      continue;
    }
    if (!open) continue;
    workedMinutes +=
      (new Date(event.eventTimestamp).getTime() - new Date(open).getTime()) / 60_000;
    lastClosedOut = event.eventTimestamp;
    open = null;
  }

  const expectedStart = input.schedule ? minutesFromClock(input.schedule.expectedStart) : null;
  const expectedEnd = input.schedule ? minutesFromClock(input.schedule.expectedEnd) : null;
  const asOfParts = londonParts(input.asOf);
  const asOfMinutes = asOfParts.hour * 60 + asOfParts.minute;
  const asOfIsDay = londonIsoDate(input.asOf) === input.dayIso;
  const dayHasEnded = !asOfIsDay && londonIsoDate(input.asOf) > input.dayIso;

  const late = Boolean(
    firstIn &&
      expectedStart != null &&
      minutesOf(firstIn.eventTimestamp) > expectedStart + ATTENDANCE_GRACE_MINUTES,
  );
  const early = Boolean(
    !open &&
      lastClosedOut &&
      expectedEnd != null &&
      minutesOf(lastClosedOut) < expectedEnd - ATTENDANCE_GRACE_MINUTES,
  );

  let status: AttendanceStatusLabel;
  if (!firstIn) {
    const shiftStarted =
      expectedStart != null && (dayHasEnded || (asOfIsDay && asOfMinutes >= expectedStart));
    status = shiftStarted ? "Absent" : "Expected";
  } else if (open) {
    const shiftEnded =
      dayHasEnded ||
      (expectedEnd != null && asOfIsDay && asOfMinutes > expectedEnd + ATTENDANCE_GRACE_MINUTES);
    status = shiftEnded ? "Missing clock-out" : "Currently on site";
  } else if (late && early) {
    status = "Late arrival · Early departure";
  } else if (late) {
    status = "Late arrival";
  } else if (early) {
    status = "Early departure";
  } else {
    status = "Complete";
  }

  const hoursWorked =
    open || workedMinutes <= 0 ? null : Math.round((workedMinutes / 60) * 10) / 10;

  return {
    status,
    clockIn: firstIn?.eventTimestamp ?? null,
    clockOut: open ? null : (lastClosedOut ?? clockOuts.at(-1)?.eventTimestamp ?? null),
    hoursWorked,
    clockInCount: clockIns.length,
    late,
    early,
    onSite: status === "Currently on site",
    missingClockOut: status === "Missing clock-out",
    absent: status === "Absent",
  };
}

function minutesOf(iso: string): number {
  const parts = londonParts(new Date(iso));
  return parts.hour * 60 + parts.minute;
}
