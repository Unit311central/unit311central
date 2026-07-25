/**
 * Natural-language datetime helpers for calendar EA actions.
 * Accepts ISO strings and CEO phrasing like "next Tuesday at 10a".
 */

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  sun: 0,
  monday: 1,
  mon: 1,
  tuesday: 2,
  tue: 2,
  tues: 2,
  wednesday: 3,
  wed: 3,
  thursday: 4,
  thu: 4,
  thur: 4,
  thurs: 4,
  friday: 5,
  fri: 5,
  saturday: 6,
  sat: 6,
};

function normalizeAmPmToken(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\b(\d{1,2})\s*a\b(?![m])/g, "$1am")
    .replace(/\b(\d{1,2})\s*p\b(?![m])/g, "$1pm")
    .replace(/\b(\d{1,2}):(\d{2})\s*a\b(?![m])/g, "$1:$2am")
    .replace(/\b(\d{1,2}):(\d{2})\s*p\b(?![m])/g, "$1:$2pm");
}

function parseClock(raw: string): { hours: number; minutes: number } | null {
  const text = normalizeAmPmToken(raw);
  const m = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/i);
  if (!m) return null;
  let hours = Number(m[1]);
  const minutes = m[2] ? Number(m[2]) : 0;
  const meridiem = (m[3] || "").toLowerCase();
  if (!Number.isFinite(hours) || hours > 23 || minutes > 59) return null;
  if (meridiem === "pm" && hours < 12) hours += 12;
  if (meridiem === "am" && hours === 12) hours = 0;
  // Bare early hours (1–7) without am/pm → afternoon in business context.
  if (!meridiem && hours >= 1 && hours <= 7) hours += 12;
  return { hours, minutes };
}

function nextWeekday(from: Date, weekday: number): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  return d;
}

function applyClock(day: Date, clock: { hours: number; minutes: number }): Date {
  const d = new Date(day);
  d.setHours(clock.hours, clock.minutes, 0, 0);
  return d;
}

/**
 * Resolve CEO-style when-phrases to an ISO datetime.
 * Returns null when nothing usable is found.
 */
export function parseNaturalWhen(
  raw: string,
  now: Date = new Date(),
): string | null {
  const value = normalizeAmPmToken(String(raw || "").trim());
  if (!value) return null;

  const isoTry = new Date(value);
  if (
    !Number.isNaN(isoTry.getTime()) &&
    (/^\d{4}-\d{2}-\d{2}/.test(value) || value.includes("T") || /gmt|utc|z$/i.test(value))
  ) {
    return isoTry.toISOString();
  }

  const clock = parseClock(value);
  const lower = value.toLowerCase();

  if (/\btomorrow\b/.test(lower)) {
    const day = new Date(now);
    day.setDate(day.getDate() + 1);
    return applyClock(day, clock ?? { hours: 10, minutes: 0 }).toISOString();
  }

  if (/\btoday\b/.test(lower)) {
    return applyClock(now, clock ?? { hours: 10, minutes: 0 }).toISOString();
  }

  const weekdayHit = lower.match(
    /\b(?:next\s+)?(sunday|sun|monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat)\b/,
  );
  if (weekdayHit?.[1]) {
    const weekday = WEEKDAYS[weekdayHit[1]];
    if (weekday != null) {
      const day = nextWeekday(now, weekday);
      return applyClock(day, clock ?? { hours: 10, minutes: 0 }).toISOString();
    }
  }

  // Time-only ("10am", "10a", "15:30") → next occurrence from now.
  if (clock && /(?:am|pm|\d:\d{2})/i.test(value) && !/[a-z]{4,}/i.test(value.replace(/am|pm/gi, ""))) {
    let day = applyClock(now, clock);
    if (day.getTime() <= now.getTime()) {
      day = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    }
    return day.toISOString();
  }

  if (!Number.isNaN(isoTry.getTime()) && isoTry.getFullYear() > 2000) {
    return isoTry.toISOString();
  }

  return null;
}

/** Pull a when-phrase out of a full schedule sentence. */
export function extractWhenPhrase(message: string): string | null {
  const text = normalizeAmPmToken(message);
  const patterns = [
    /\b((?:next\s+)?(?:monday|mon|tuesday|tue|tues|wednesday|wed|thursday|thu|thur|thurs|friday|fri|saturday|sat|sunday|sun)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)?)/i,
    /\b((?:today|tomorrow)(?:\s+at\s+\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)?)/i,
    /\bat\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm|a|p)?)\b/i,
    /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return null;
}

/** "with Manpower" / "for Peak Infrastructure" client fragment. */
export function extractMeetingClientName(message: string): string | null {
  const text = message.trim();
  const withMatch = text.match(
    /\b(?:with|for)\s+([A-Z][A-Za-z0-9&'.-]+(?:\s+[A-Z][A-Za-z0-9&'.-]+){0,5}(?:\s+(?:Ltd|Limited|LLC|Inc|PLC|LLP))?)/,
  );
  if (withMatch?.[1]) {
    const name = withMatch[1]
      .replace(/\s+(?:next|on|at|tomorrow|today)\b.*$/i, "")
      .trim();
    if (name.length >= 2) return name;
  }
  return null;
}

export function defaultMeetingTitle(clientName?: string | null, title?: string | null): string {
  const explicit = typeof title === "string" ? title.trim() : "";
  if (explicit) return explicit;
  const client = typeof clientName === "string" ? clientName.trim() : "";
  if (client) return `Meeting with ${client}`;
  return "Meeting";
}

/**
 * Enrich schedule-meeting input from the original CEO sentence.
 */
export function enrichScheduleMeetingInput(
  message: string,
  input: Record<string, unknown>,
  now: Date = new Date(),
): Record<string, unknown> {
  const next = { ...input };
  const clientFromMsg = extractMeetingClientName(message);
  if (!asNonEmpty(next.clientName) && clientFromMsg) {
    next.clientName = clientFromMsg;
  }

  const whenPhrase =
    asNonEmpty(next.startsAt) || extractWhenPhrase(message) || "";
  const parsed = parseNaturalWhen(whenPhrase, now);
  if (parsed) next.startsAt = parsed;

  if (!asNonEmpty(next.endsAt) && parsed) {
    next.endsAt = new Date(new Date(parsed).getTime() + 60 * 60 * 1000).toISOString();
  }

  next.title = defaultMeetingTitle(
    asNonEmpty(next.clientName),
    asNonEmpty(next.title),
  );

  return next;
}

function asNonEmpty(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  return t ? t : null;
}
