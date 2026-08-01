/**
 * ABHI customer host detection (abhi.unit311central.com).
 */

export const ABHI_SLUG = "abhi";

export const ABHI_LOGO_SRC = "/images/workspaces/abhi.jpg";

export const ABHI_LINKEDIN_URL = "https://www.linkedin.com/company/abhi/";
export const ABHI_X_URL = "https://x.com/UK_ABHI";
export const ABHI_EVENTS_CALENDAR_EMAIL = "events@abhi.org.uk";

/** Member companies signed up by year (Clients Dashboard growth chart). */
export const ABHI_MEMBER_SIGNUP_GROWTH = [
  { year: "2024", members: 320 },
  { year: "2025", members: 350 },
  { year: "2026", members: 379 },
] as const;

export function isAbhiSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === ABHI_SLUG
  );
}

export function getBrowserWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host.includes("abhi")) return ABHI_SLUG;
  return "";
}

export function isBrowserAbhiSurface(): boolean {
  return isAbhiSlug(getBrowserWorkspaceSlug());
}
