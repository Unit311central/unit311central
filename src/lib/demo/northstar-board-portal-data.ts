/**
 * Northstar Demo Board Portal — public /board routes + LHS nav.
 */

export const NORTHSTAR_BOARD_PORTAL_PATH = "board";
export const NORTHSTAR_BOARD_CLIENT_ID = "nst-cli-board";
export const NORTHSTAR_BOARD_USERNAME = "board@unit311central.com";

export type NorthstarBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "decks"
  | "minutes"
  | "risk"
  | "members";

export const NORTHSTAR_BOARD_NAV: {
  id: NorthstarBoardPortalSection;
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

export function parseNorthstarBoardPortalSection(
  section: string[] | undefined,
): NorthstarBoardPortalSection | null {
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
