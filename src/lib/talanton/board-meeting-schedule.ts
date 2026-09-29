import { TALANTON_BOARD_MEETING_TZID } from "@/lib/cronofy/config";

const DEFAULT_DURATION_MINUTES = 120;

function formatPartsInTz(date: Date, tzid: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: tzid,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return {
    y: get("year"),
    m: get("month"),
    d: get("day"),
    h: get("hour"),
    min: get("minute"),
  };
}

/** Convert wall-clock date+time in tzid to UTC ISO string. */
export function localWallClockToUtcIso(
  date: string,
  time: string,
  tzid: string = TALANTON_BOARD_MEETING_TZID,
): string {
  const [year, month, day] = date.slice(0, 10).split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error("Invalid meeting date or time.");
  }

  let guessMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let i = 0; i < 96; i += 1) {
    const p = formatPartsInTz(new Date(guessMs), tzid);
    const targetKey = `${date.slice(0, 10)} ${time.slice(0, 5)}`;
    const actualKey = `${p.y}-${p.m}-${p.d} ${p.h}:${p.min}`;
    if (actualKey === targetKey) {
      return new Date(guessMs).toISOString();
    }
    const actualDate = new Date(`${p.y}-${p.m}-${p.d}T${p.h}:${p.min}:00Z`);
    const targetDate = new Date(`${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00Z`);
    guessMs += targetDate.getTime() - actualDate.getTime();
  }
  return new Date(guessMs).toISOString();
}

export function boardMeetingStartEndFromLocal(args: {
  date: string;
  time: string;
  tzid?: string;
  durationMinutes?: number;
}): { meetingDate: string; meetingStartAt: string; meetingEndAt: string } {
  const tzid = args.tzid ?? TALANTON_BOARD_MEETING_TZID;
  const startIso = localWallClockToUtcIso(args.date, args.time, tzid);
  const duration = args.durationMinutes ?? DEFAULT_DURATION_MINUTES;
  const endIso = new Date(Date.parse(startIso) + duration * 60 * 1000).toISOString();
  return {
    meetingDate: args.date.slice(0, 10),
    meetingStartAt: startIso,
    meetingEndAt: endIso,
  };
}
