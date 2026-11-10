import { ATTENDANCE_TIME_ZONE } from "@/lib/attendance/constants";

const WEEKDAY_INDEX: Record<string, number> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
};

export type LondonParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  /** ISO weekday: Monday = 1 … Sunday = 7. */
  weekday: number;
};

export function londonParts(date: Date): LondonParts {
  const formatted = new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_TIME_ZONE,
    hourCycle: "h23",
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).formatToParts(date);
  const parts = Object.fromEntries(
    formatted.filter((part) => part.type !== "literal").map((part) => [part.type, part.value]),
  );
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    weekday: WEEKDAY_INDEX[parts.weekday ?? ""] ?? 1,
  };
}

export function londonIsoDate(date: Date): string {
  const parts = londonParts(date);
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function formatLondonTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

export function formatLondonDate(isoDate: string): string {
  const noon = londonWallTimeToUtc(isoDate, "12:00");
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: ATTENDANCE_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(noon);
}

/** Convert a Europe/London wall-clock time to a UTC instant. */
export function londonWallTimeToUtc(isoDate: string, hhmm: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  const [hour, minute] = hhmm.split(":").map(Number);
  const guess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const corrected = new Date(guess.getTime() - londonOffsetMs(guess));
  const refinedOffset = londonOffsetMs(corrected);
  if (refinedOffset !== londonOffsetMs(guess)) {
    return new Date(guess.getTime() - refinedOffset);
  }
  return corrected;
}

export function addLondonDays(isoDate: string, days: number): string {
  const noon = londonWallTimeToUtc(isoDate, "12:00");
  noon.setUTCDate(noon.getUTCDate() + days);
  return londonIsoDate(noon);
}

/** Monday of the Europe/London week containing `from`. */
export function londonWeekMonday(from = new Date()): string {
  const parts = londonParts(from);
  const delta = parts.weekday === 7 ? -6 : 1 - parts.weekday;
  return addLondonDays(londonIsoDate(from), delta);
}

export function londonWeekDays(from = new Date()): string[] {
  const monday = londonWeekMonday(from);
  return [0, 1, 2, 3, 4].map((offset) => addLondonDays(monday, offset));
}

export function minutesFromClock(hhmm: string): number {
  const [hour, minute] = hhmm.split(":").map(Number);
  return hour * 60 + minute;
}

export function clockFromMinutesAfterEight(minute: number): string {
  const total = 8 * 60 + Math.max(0, Math.floor(minute));
  const hour = Math.floor(total / 60);
  const mins = total % 60;
  return `${pad(hour)}:${pad(mins)}`;
}

function londonOffsetMs(date: Date): number {
  const parts = londonParts(date);
  const wallAsUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0);
  const truncated = date.getTime() - (date.getUTCSeconds() * 1000 + date.getUTCMilliseconds());
  return wallAsUtc - truncated;
}

function pad(value: number): string {
  return String(value).padStart(2, "0");
}
