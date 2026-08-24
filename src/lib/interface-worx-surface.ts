/**
 * Interface Worx customer host + draft public website detection.
 * Workspace: interfaceworx.unit311central.com
 * Draft site: iw-website.unit311central.com (future production: interfaceworx.com)
 */

import { normalizeHost, UNIT311_SITE_HOST } from "@/lib/app-domains";

export const INTERFACE_WORX_SLUG = "interfaceworx";

/** Draft public website subdomain (not a workspace slug). */
export const INTERFACE_WORX_WEBSITE_SUBDOMAIN = "iw-website";

export const INTERFACE_WORX_WEBSITE_HOST = `${INTERFACE_WORX_WEBSITE_SUBDOMAIN}.${UNIT311_SITE_HOST}`;

export const INTERFACE_WORX_WEBSITE_URL = `https://${INTERFACE_WORX_WEBSITE_HOST}`;

/** Future intended production domain — not configured in this task. */
export const INTERFACE_WORX_FUTURE_DOMAIN = "www.interfaceworx.com";

export const INTERFACE_WORX_WEBSITE_LOGO_SRC =
  "/images/workspaces/interfaceworx/logowebsite.svg";

export const INTERFACE_WORX_WORKSPACE_LOGO_SRC =
  "/images/workspaces/interfaceworx/interfacelogo.svg";

export const INTERFACE_WORX_HERO_IMAGE_SRC =
  "/images/workspaces/interfaceworx/hero.jpg";

export const INTERFACE_WORX_PRIMARY = "#CC5500";
export const INTERFACE_WORX_SECONDARY = "#FCBD8F";

export const INTERFACE_WORX_MISSION =
  "Interface Worx develops prosthetic interface technologies that improve outcomes and widen access to essential care for people living with amputation worldwide.";

export const INTERFACE_WORX_EMAIL = "info@interfaceworx.com";

export const INTERFACE_WORX_LINKEDIN_URL =
  "https://www.linkedin.com/company/interfaceworx";

export const INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_WIDTH = 360;
export const INTERFACE_WORX_WEBSITE_LOGO_INTRINSIC_HEIGHT = 72;

export const INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_WIDTH = 360;
export const INTERFACE_WORX_WORKSPACE_LOGO_INTRINSIC_HEIGHT = 72;

export function isInterfaceWorxSlug(slug: string | null | undefined): boolean {
  return (
    String(slug ?? "")
      .trim()
      .toLowerCase() === INTERFACE_WORX_SLUG
  );
}

export function isInterfaceWorxWebsiteHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  if (normalized === INTERFACE_WORX_WEBSITE_HOST) return true;
  if (normalized === "iw-website.localhost") return true;
  return false;
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
  if (host.includes("interfaceworx")) return INTERFACE_WORX_SLUG;
  return "";
}

export function isBrowserInterfaceWorxSurface(): boolean {
  return isInterfaceWorxSlug(getBrowserWorkspaceSlug());
}

/** App Router implementation prefix for the draft public site (not a browser URL). */
export const INTERFACE_WORX_WEBSITE_ROUTE_PREFIX = "/sites/interface-worx";

/**
 * Map a browser path on iw-website.* to the App Router implementation path.
 */
export function interfaceWorxWebsiteImplPath(pathname: string): string {
  const path = pathname === "/" || pathname === "" ? "/" : pathname.replace(/\/$/, "");
  if (path === "/") return INTERFACE_WORX_WEBSITE_ROUTE_PREFIX;
  if (path === "/about") return `${INTERFACE_WORX_WEBSITE_ROUTE_PREFIX}/about`;
  if (path === "/contact") return `${INTERFACE_WORX_WEBSITE_ROUTE_PREFIX}/contact`;
  return INTERFACE_WORX_WEBSITE_ROUTE_PREFIX;
}
