/**
 * ABHI customer host detection (abhi.unit311central.com).
 */

export const ABHI_SLUG = "abhi";

/** Transparent ABHI wordmark (PNG with alpha). Prefer this over abhi.jpg. */
export const ABHI_LOGO_SRC = "/images/workspaces/abhi-logo.png";

/** Intrinsic pixel size of {@link ABHI_LOGO_SRC}. */
export const ABHI_LOGO_INTRINSIC_WIDTH = 640;
export const ABHI_LOGO_INTRINSIC_HEIGHT = 224;

export const ABHI_LINKEDIN_URL = "https://www.linkedin.com/company/abhi/";
export const ABHI_X_URL = "https://x.com/UK_ABHI";
export const ABHI_EVENTS_CALENDAR_EMAIL = "events@abhi.org.uk";

/** Active member companies (excludes onboarding / pre-active accounts). */
export const ABHI_ACTIVE_MEMBER_COUNT = 375;

/** Member companies in onboarding — not counted as active until live. */
export const ABHI_ONBOARDING_MEMBER_COUNT = 5;

/** Active members signed up by year (Clients Dashboard growth chart). */
export const ABHI_MEMBER_SIGNUP_GROWTH = [
  { year: "2021", members: 248 },
  { year: "2022", members: 276 },
  { year: "2023", members: 298 },
  { year: "2024", members: 320 },
  { year: "2025", members: 350 },
  { year: "2026", members: ABHI_ACTIVE_MEMBER_COUNT },
] as const;

/** Current active membership by region (sums to {@link ABHI_ACTIVE_MEMBER_COUNT}). */
export const ABHI_MEMBERS_BY_REGION = [
  { region: "UK", members: 241 },
  { region: "EU", members: 78 },
  { region: "North America", members: 56 },
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
  try {
    const { isOnDemoHostBrowser, readBrowserDemoPreviewSlug } =
      require("@/lib/demo/workspace-preview") as typeof import("@/lib/demo/workspace-preview");
    if (isOnDemoHostBrowser()) return readBrowserDemoPreviewSlug();
  } catch {
    /* ignore */
  }
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host.includes("abhi")) return ABHI_SLUG;
  return "";
}

export function isBrowserAbhiSurface(): boolean {
  return isAbhiSlug(getBrowserWorkspaceSlug());
}

/** ABHI renames the Unit311 Details module and root folder in the UI. */
export const ABHI_DETAILS_DISPLAY_NAME = "ABHI Details";
export const UNIT311_DETAILS_LEGACY_FOLDER_NAME = "Unit311 Details";

/** Map legacy/internal folder names to ABHI-facing labels (browser ABHI only). */
export function displayAbhiFolderName(name: string): string {
  if (!isBrowserAbhiSurface()) return name;
  if (name.trim() === UNIT311_DETAILS_LEGACY_FOLDER_NAME) {
    return ABHI_DETAILS_DISPLAY_NAME;
  }
  return name;
}
