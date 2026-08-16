/**
 * OnwardAir customer host detection (onwardair.unit311central.com).
 * Short alias host `onward.unit311central.com` is accepted and canonicalized.
 */

export const ONWARDAIR_SLUG = "onwardair";

/** Accepted host/workspace slugs that map to the OnwardAir tenant. */
export const ONWARDAIR_SLUG_ALIASES = ["onwardair", "onward"] as const;

/** OnwardAir reports and displays money in USD across Home, Financials, and modules. */
export const ONWARDAIR_REPORTING_CURRENCY = "USD";

/** Official wordmark — vector SVG (crisp at any size) + matching high-res PNG. */
export const ONWARDAIR_LOGO_SRC = "/images/workspaces/onwardair-logo.svg";
/** White wordmark for dark UI chrome. */
export const ONWARDAIR_LOGO_PNG_SRC = "/images/workspaces/onwardair-logo.png";
/** Dark navy wordmark for white print / board-pack pages. */
export const ONWARDAIR_LOGO_DARK_PNG_SRC = "/images/workspaces/onwardair-logo-dark.png";
export const ONWARDAIR_LOGO_INTRINSIC_WIDTH = 640;
export const ONWARDAIR_LOGO_INTRINSIC_HEIGHT = 168;

/**
 * Home LHS stripe + RHS title accent — RGB(38, 123, 144).
 * Must stay hex so CSS `${accent}99` alpha suffixes remain valid.
 */
export const ONWARDAIR_HOME_ACCENT = "#267B90";

/** Executive Assistant — mint RGB(18, 184, 134). */
export const ONWARDAIR_EA_ACCENT = "#12B886";

/**
 * Unique OnwardAir LHS accents — every module a distinct hue (no near-dupes).
 * Values are hex; RGB equivalents documented in comments.
 */
export const ONWARDAIR_MODULE_ACCENTS: Readonly<Record<string, string>> = {
  /** RGB(37, 99, 235) */
  "Business Central": "#2563EB",
  /** RGB(192, 38, 211) */
  "OnwardAir Intelligence": "#C026D3",
  /** RGB(22, 101, 52) */
  Financials: "#166534",
  /** RGB(217, 119, 6) */
  Fundraising: "#D97706",
  /** RGB(190, 18, 60) */
  Board: "#BE123C",
  /** RGB(120, 113, 108) */
  "Corporate Information": "#78716C",
  /** RGB(2, 132, 199) — sky, not Home teal */
  Operations: "#0284C7",
  /** RGB(79, 70, 229) */
  "Technology Management": "#4F46E5",
  /** RGB(219, 39, 119) */
  "Human Resources": "#DB2777",
  /** RGB(8, 145, 178) */
  "Business Productivity": "#0891B2",
  /** RGB(220, 38, 38) — alert red, not Board crimson / HR pink */
  "Support Desk": "#DC2626",
  /** RGB(234, 88, 12) */
  "Project Management": "#EA580C",
  /** RGB(124, 58, 237) — violet, not Board crimson */
  Engineering: "#7C3AED",
  /** RGB(202, 138, 4) — gold, not Fundraising amber */
  Training: "#CA8A04",
  /** RGB(101, 163, 13) */
  QMS: "#65A30D",
  /** RGB(244, 114, 182) */
  "Marketing & Events": "#F472B6",
  /** RGB(108, 99, 255) */
  Tools: "#6C63FF",
  /** RGB(15, 118, 110) — deep teal, not BP cyan / Ops sky */
  "External Client Access": "#0F766E",
  /** RGB(100, 116, 139) — slate, not Tools purple */
  Settings: "#64748B",
};

export function canonicalizeOnwardAirSlug(
  slug: string | null | undefined,
): string | null {
  const normalized = String(slug ?? "")
    .trim()
    .toLowerCase();
  if (!normalized) return null;
  if ((ONWARDAIR_SLUG_ALIASES as readonly string[]).includes(normalized)) {
    return ONWARDAIR_SLUG;
  }
  return null;
}

export function isOnwardAirSlug(slug: string | null | undefined): boolean {
  return canonicalizeOnwardAirSlug(slug) !== null;
}

export function getBrowserOnwardAirWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  try {
    const { isOnDemoHostBrowser, readBrowserDemoPreviewSlug } =
      require("@/lib/demo/workspace-preview") as typeof import("@/lib/demo/workspace-preview");
    if (isOnDemoHostBrowser()) {
      const preview = readBrowserDemoPreviewSlug();
      if (canonicalizeOnwardAirSlug(preview)) return ONWARDAIR_SLUG;
    }
  } catch {
    /* ignore */
  }
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) {
    return canonicalizeOnwardAirSlug(match[1]) ?? match[1];
  }
  if (
    host === "onwardair.localhost" ||
    host.startsWith("onwardair.") ||
    host === "onward.localhost" ||
    host.startsWith("onward.")
  ) {
    return ONWARDAIR_SLUG;
  }
  return "";
}

export function isBrowserOnwardAirSurface(): boolean {
  if (typeof window === "undefined") return false;
  if (isOnwardAirSlug(getBrowserOnwardAirWorkspaceSlug())) return true;
  // Fallback for preview / alternate hosts that still carry the tenant name.
  const host = window.location.hostname.toLowerCase();
  return host.includes("onwardair") || host === "onward.unit311central.com";
}

/** Resolve the forced OnwardAir LHS accent for a nav section (pins + workspaces). */
export function resolveOnwardAirNavAccent(section: {
  kind?: "pin" | "workspace";
  label?: string | null;
  color?: string;
  items: readonly { view?: string | null }[];
}): string | null {
  if (!isBrowserOnwardAirSurface()) return null;
  if (section.kind === "pin") {
    if (section.items.some((item) => item.view === "home")) return ONWARDAIR_HOME_ACCENT;
    if (section.items.some((item) => item.view === "executive-assistant")) {
      return ONWARDAIR_EA_ACCENT;
    }
    return section.color ?? null;
  }
  if (section.label && ONWARDAIR_MODULE_ACCENTS[section.label]) {
    return ONWARDAIR_MODULE_ACCENTS[section.label];
  }
  return section.color ?? null;
}
