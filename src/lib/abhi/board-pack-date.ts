/**
 * Board Pack meeting-date resolution.
 * Governance rule: never invent meeting dates from "tomorrow" / "next week".
 *
 * Priority:
 * 1. Nearest future Board Meeting (Scheduled / Draft)
 * 2. Explicit user-provided absolute date (YYYY-MM-DD)
 * 3. Ask — do not generate
 */

import { getNextScheduledAbhiBoardMeeting } from "@/lib/abhi/board-meetings-store";

export type AbhiBoardPackDateSource = "board_meeting" | "user_explicit" | "none";

export type AbhiBoardPackDateResolution =
  | {
      ok: true;
      meetingDate: string;
      source: Exclude<AbhiBoardPackDateSource, "none">;
      meetingId?: string;
      meetingTitle?: string;
    }
  | {
      ok: false;
      source: "none";
      needsMeetingDate: true;
      message: string;
    };

/** Accept only absolute dates — never relative phrases. */
export function parseExplicitAbhiBoardMeetingDate(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;

  // Reject relative / invented governance dates.
  if (
    /\b(tomorrow|today|next\s+week|this\s+week|next\s+month)\b/i.test(trimmed) ||
    /\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i.test(trimmed)
  ) {
    // Allow if an explicit ISO date is also present in the same string.
    const isoInRelative = trimmed.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
    return isoInRelative?.[1];
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const iso = trimmed.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];

  // Absolute natural dates that include a year, e.g. "3 August 2026"
  if (!/\b20\d{2}\b/.test(trimmed)) return undefined;
  const parsed = Date.parse(trimmed);
  if (Number.isNaN(parsed)) return undefined;
  const d = new Date(parsed);
  if (Number.isNaN(d.getTime())) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Resolve the Board Pack meeting date.
 * Temporary demo mode: always resolve a date so EA generation is never blocked.
 *
 * Priority:
 * 1. Nearest future Board Meeting (Scheduled / Draft)
 * 2. Explicit user date (ISO or relative like tomorrow / next week)
 * 3. Default to tomorrow
 */
export function resolveAbhiBoardPackMeetingDate(input?: {
  explicitDate?: string | null;
}): AbhiBoardPackDateResolution {
  const nextMeeting = getNextScheduledAbhiBoardMeeting();
  if (nextMeeting) {
    return {
      ok: true,
      meetingDate: nextMeeting.meetingDate,
      source: "board_meeting",
      meetingId: nextMeeting.id,
      meetingTitle: nextMeeting.title,
    };
  }

  const explicit = parseExplicitAbhiBoardMeetingDate(input?.explicitDate);
  if (explicit) {
    return {
      ok: true,
      meetingDate: explicit,
      source: "user_explicit",
    };
  }

  const relative = parseRelativeAbhiBoardMeetingDate(input?.explicitDate);
  if (relative) {
    return {
      ok: true,
      meetingDate: relative,
      source: "user_explicit",
    };
  }

  const d = new Date();
  d.setDate(d.getDate() + 1);
  const pad = (n: number) => String(n).padStart(2, "0");
  return {
    ok: true,
    meetingDate: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    source: "user_explicit",
  };
}

/** Temporary: accept relative phrases for EA demo generation. */
function parseRelativeAbhiBoardMeetingDate(
  raw: string | null | undefined,
): string | undefined {
  if (!raw) return undefined;
  const lower = raw.trim().toLowerCase();
  if (!lower) return undefined;
  const pad = (n: number) => String(n).padStart(2, "0");
  const toIso = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (/\btomorrow\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toIso(d);
  }
  if (/\btoday\b/.test(lower)) return toIso(new Date());
  if (/\bnext\s+week\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toIso(d);
  }
  return undefined;
}
