/**
 * ABHI Board Pack Generation — natural-language capability intent.
 * Used only on the ABHI workspace to invoke boardpack.generate.
 */

export type AbhiBoardPackIntent = {
  tool: "boardpack.generate";
  args: { meetingDate?: string; focus?: string };
  reason: string;
};

function isoDaysFromToday(offset: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function nextWeekday(targetDow: number): string {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  const delta = (targetDow - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function inferMeetingDate(lower: string): string | undefined {
  if (/\btomorrow\b/.test(lower)) return isoDaysFromToday(1);
  if (/\bnext week\b/.test(lower)) return isoDaysFromToday(7);
  if (/\bmonday\b/.test(lower)) return nextWeekday(1);
  if (/\btuesday\b/.test(lower)) return nextWeekday(2);
  if (/\bwednesday\b/.test(lower)) return nextWeekday(3);
  if (/\bthursday\b/.test(lower)) return nextWeekday(4);
  if (/\bfriday\b/.test(lower)) return nextWeekday(5);
  const iso = lower.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso?.[1]) return iso[1];
  return undefined;
}

/**
 * True when the user is asking for board meeting materials / pack / deck / papers.
 * This is capability intent for the ABHI Board Pack generator — not a generic PDF report.
 */
export function resolveAbhiBoardPackIntent(message: string): AbhiBoardPackIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  const boardMaterials =
    /\bboard\s+(pack|packs|deck|decks|papers?|presentation|materials|report)\b/.test(lower) ||
    /\bboard\s+meeting\s+(pack|papers?|materials|deck|presentation|report)\b/.test(lower) ||
    (/\bboard\b/.test(lower) &&
      /\b(pack|deck|papers?|presentation|materials|report)\b/.test(lower) &&
      /\b(create|generate|prepare|build|make|produce|draft|assemble|ready)\b/.test(lower));

  if (!boardMaterials) return null;

  // Exclude pure financial board PDF asks (those stay on generateFinancialReportPdf).
  if (
    /\b(board\s+financial|financial\s+board|board\s+p\s*(&|and)\s*l)\b/.test(lower) &&
    !/\b(pack|deck|papers?|presentation)\b/.test(lower)
  ) {
    return null;
  }

  const meetingDate = inferMeetingDate(lower);
  return {
    tool: "boardpack.generate",
    args: {
      ...(meetingDate ? { meetingDate } : {}),
      focus: text.slice(0, 240),
    },
    reason: "abhi_board_pack_generation",
  };
}
