/**
 * Green Desert Board Portal — public /board routes + LHS nav.
 */

import { UNIT311_SITE_HOST } from "@/lib/app-domains";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";

export const GREENDESERT_BOARD_PORTAL_PATH = "board";
export const GREENDESERT_BOARD_CLIENT_ID = "greendesert-cli-board";
export const GREENDESERT_BOARD_USERNAME = "board@greendesert.unit311central.com";
export const GREENDESERT_BOARD_PORTAL_ORIGIN = `https://${GREENDESERT_SLUG}.${UNIT311_SITE_HOST}`;

export type GreenDesertBoardPortalSection =
  | "dashboard"
  | "meetings"
  | "decks"
  | "minutes"
  | "risk"
  | "members";

export const GREENDESERT_BOARD_NAV: {
  id: GreenDesertBoardPortalSection;
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

export function matchGreenDesertBoardPortalPathname(pathname: string): {
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  if (cleaned === "/board") return { rest: "" };
  if (cleaned.startsWith("/board/")) {
    return { rest: cleaned.slice("/board".length) || "" };
  }
  return null;
}

export function isGreenDesertBoardPortalRedirectPath(
  redirectPath: string | null | undefined,
): boolean {
  return matchGreenDesertBoardPortalPathname(String(redirectPath ?? "")) != null;
}

export function resolveGreenDesertBoardPortalSessionRedirect(options: {
  redirectPath?: string | null;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const username = String(options.username ?? "")
    .trim()
    .toLowerCase();
  if (username === GREENDESERT_BOARD_USERNAME) {
    return `/${GREENDESERT_BOARD_PORTAL_PATH}`;
  }

  const candidates = [options.redirectPath, options.nextRaw];
  for (const raw of candidates) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) continue;
    const pathOnly = trimmed.startsWith("/") ? trimmed.split("?")[0] : null;
    if (pathOnly && matchGreenDesertBoardPortalPathname(pathOnly)) {
      return `/${GREENDESERT_BOARD_PORTAL_PATH}`;
    }
  }
  return null;
}

export function resolveGreenDesertBoardPortalPostLoginUrl(options: {
  redirectPath?: string | null;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const path = resolveGreenDesertBoardPortalSessionRedirect(options);
  if (!path) return null;
  return `${GREENDESERT_BOARD_PORTAL_ORIGIN.replace(/\/$/, "")}${path}`;
}

export function parseGreenDesertBoardPortalSection(
  section: string[] | undefined,
): GreenDesertBoardPortalSection | null {
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
