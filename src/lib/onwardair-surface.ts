/**
 * OnwardAir customer host detection (onwardair.unit311central.com).
 */

export const ONWARDAIR_SLUG = "onwardair";

/** OnwardAir reports and displays money in USD across Home, Financials, and modules. */
export const ONWARDAIR_REPORTING_CURRENCY = "USD";

/** Official wordmark — vector SVG (crisp at any size) + matching high-res PNG. */
export const ONWARDAIR_LOGO_SRC = "/images/workspaces/onwardair-logo.svg";
export const ONWARDAIR_LOGO_PNG_SRC = "/images/workspaces/onwardair-logo.png";
export const ONWARDAIR_LOGO_INTRINSIC_WIDTH = 640;
export const ONWARDAIR_LOGO_INTRINSIC_HEIGHT = 168;

/** Home LHS stripe + RHS title accent — exact RGB(38, 123, 144). */
export const ONWARDAIR_HOME_ACCENT = "rgb(38, 123, 144)";

/** Executive Assistant — mint (unique vs Financials forest green). */
export const ONWARDAIR_EA_ACCENT = "#12B886";

/**
 * Unique LHS accents for every OnwardAir workspace module.
 * Intentionally spaced hues so blues/golds/greens never collide.
 */
export const ONWARDAIR_MODULE_ACCENTS: Readonly<Record<string, string>> = {
  "Business Central": "#2563EB",
  "OnwardAir Intelligence": "#C026D3",
  Financials: "#15803D",
  Fundraising: "#F59E0B",
  Board: "#F43F5E",
  "Corporate Information": "#A16207",
  Operations: "#0D9488",
  "Technology Management": "#8B5CF6",
  "Human Resources": "#EC4899",
  "Business Productivity": "#22D3EE",
  "Project Management": "#F97316",
  Engineering: "#EF4444",
  Training: "#EAB308",
  QMS: "#84CC16",
  "Marketing & Events": "#E11D48",
};

export function isOnwardAirSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === ONWARDAIR_SLUG
  );
}

export function getBrowserOnwardAirWorkspaceSlug(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname.toLowerCase();
  const match = host.match(/^([a-z0-9-]+)\.unit311central\.com$/i);
  if (match?.[1]) return match[1];
  if (host === "onwardair.localhost" || host.startsWith("onwardair.")) return ONWARDAIR_SLUG;
  return "";
}

export function isBrowserOnwardAirSurface(): boolean {
  if (typeof window === "undefined") return false;
  if (isOnwardAirSlug(getBrowserOnwardAirWorkspaceSlug())) return true;
  // Fallback for preview / alternate hosts that still carry the tenant name.
  return window.location.hostname.toLowerCase().includes("onwardair");
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
