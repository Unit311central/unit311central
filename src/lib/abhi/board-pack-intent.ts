/**
 * ABHI Board Pack Generation — natural-language capability intent.
 * Used only on the ABHI workspace to invoke boardpack.generate.
 *
 * Analysis questions (risks, briefing, actions, health) must NOT match —
 * those route to Executive Intelligence tools first.
 */

import { parseExplicitAbhiBoardMeetingDate } from "@/lib/abhi/board-pack-date";

export type AbhiBoardPackIntent = {
  tool: "boardpack.generate";
  args: { meetingDate?: string; when?: string; focus?: string };
  reason: string;
};

/**
 * True when the user is explicitly asking to generate board meeting materials.
 * Requires a generation verb — mere mentions of "board pack" for analysis do not match.
 */
export function resolveAbhiBoardPackIntent(message: string): AbhiBoardPackIntent | null {
  const text = message.trim();
  if (!text) return null;
  const lower = text.toLowerCase();

  // Analysis / briefing language wins — never treat as pack generation.
  if (
    /\b(briefing|org(anisational|anizational)?\s+health|organisation\s+health|overdue\s+actions?|board\s+insights?|biggest\s+risks?|what\s+decisions?|deteriorat|improv(ed|ing)|action\s+centre|summarise|summarize|how\s+is|are\s+whx|what\s+should\s+the\s+board)\b/.test(
      lower,
    ) &&
    !/\b(create|generate|prepare|build|make|produce|draft|assemble|export)\b/.test(lower)
  ) {
    return null;
  }

  const boardMaterials =
    /\bboard\s+(pack|packs|deck|decks|papers?|presentation|materials)\b/.test(lower) ||
    /\bboard\s+meeting\s+(pack|papers?|materials|deck|presentation)\b/.test(lower);

  if (!boardMaterials) return null;

  // Require an explicit generation / delivery verb.
  const wantsGenerate =
    /\b(create|generate|prepare|build|make|produce|draft|assemble|export|ready)\b/.test(lower) ||
    /\b(give|send|get)\s+(me\s+)?(a\s+|the\s+)?board\s+(pack|deck|papers?)\b/.test(lower);

  if (!wantsGenerate) return null;

  // Exclude pure financial board PDF asks (those stay on generateFinancialReportPdf).
  if (
    /\b(board\s+financial|financial\s+board|board\s+p\s*(&|and)\s*l)\b/.test(lower) &&
    !/\b(pack|deck|papers?|presentation)\b/.test(lower)
  ) {
    return null;
  }

  const meetingDate = parseExplicitAbhiBoardMeetingDate(text);
  return {
    tool: "boardpack.generate",
    args: {
      ...(meetingDate ? { meetingDate } : {}),
      // Pass raw phrase so the tool can resolve "tomorrow" / "next week".
      when: text.slice(0, 240),
      focus: text.slice(0, 240),
    },
    reason: "abhi_board_pack_generation",
  };
}
