/**
 * OnwardAir Board Portal — public /board routes + LHS nav.
 */

import { ONWARDAIR_LUMINARY_ADVISORS } from "@/lib/onwardair/board-members-seed";

export const OA_BOARD_PORTAL_PATH = "board";
export const OA_BOARD_CLIENT_ID = "oa-cli-board";
export const OA_BOARD_USERNAME = "board@onwardair.tech";

export type OaBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "decks"
  | "minutes"
  | "risk"
  | "members";

export const OA_BOARD_NAV: {
  id: OaBoardPortalSection;
  label: string;
  href: string;
}[] = [
  { id: "dashboard", label: "Board Dashboard", href: "/board" },
  { id: "meetings", label: "Board Meetings", href: "/board/meetings" },
  { id: "decks", label: "Board Decks", href: "/board/decks" },
  { id: "minutes", label: "Minutes & Decisions", href: "/board/minutes" },
  { id: "risk", label: "Risk Register", href: "/board/risk" },
  { id: "members", label: "Board Members", href: "/board/members" },
];

export type OaBoardPortalMember = {
  id: string;
  name: string;
  role: string;
  organisation: string;
  notes: string;
};

export const OA_BOARD_PORTAL_MEMBERS: OaBoardPortalMember[] =
  ONWARDAIR_LUMINARY_ADVISORS.map((row, index) => ({
    id: `oa-bm-${index + 1}`,
    name: row.fullName,
    role: row.roleTitle,
    organisation: row.organisation,
    notes: row.notes,
  }));

export function parseOaBoardPortalSection(
  section: string[] | undefined,
): OaBoardPortalSection | null {
  if (!section?.length) return "dashboard";
  const key = section[0]?.toLowerCase();
  if (key === "meetings") return "meetings";
  if (key === "decks" || key === "packs") return "decks";
  if (key === "minutes" || key === "decisions") return "minutes";
  if (key === "risk" || key === "risks") return "risk";
  if (key === "members") return "members";
  if (key === "dashboard") return "dashboard";
  return null;
}
