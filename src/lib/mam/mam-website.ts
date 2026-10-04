/**
 * MAM public marketing website — host routing and site constants.
 * Workspace app: mam.unit311central.com
 * Public site: mam.vercel.app (staging) → mam.ma (production)
 */

import { normalizeHost } from "@/lib/app-domains";

/** Change once when mam.ma is live — metadata, canonical URLs, sitemap. */
export const MAM_WEBSITE_CANONICAL_ORIGIN = "https://mam.vercel.app";

/** Staging / alternate hosts that serve the public site (not the Unit311 workspace). */
export const MAM_WEBSITE_HOSTS = [
  "mam.vercel.app",
  "mam.ma",
  "www.mam.ma",
  "mam-website.localhost",
] as const;

export const MAM_WEBSITE_ROUTE_PREFIX = "/sites/mam";

export const MAM_WEBSITE_TITLE = "MAM | Moroccan Advanced Manufacturing";

export const MAM_WEBSITE_DESCRIPTION =
  "MAM provides advanced additive manufacturing and precision production services from Casablanca, Morocco.";

export const MAM_WEBSITE_TAGLINE = "Advanced manufacturing, engineered in Morocco.";

export const MAM_CONTACT_EMAIL = "info@mam.ma";

export const MAM_LOCATION_LABEL = "Casablanca, Morocco";

/** Unsplash — replace with owned assets when available. */
export const MAM_HERO_IMAGE =
  "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?auto=format&fit=crop&w=2400&q=80";

export const MAM_MANUFACTURING_HERO_IMAGE =
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=2400&q=80";

export const MAM_PROCESS_IMAGE =
  "https://images.unsplash.com/photo-1537462718619-9953ed47382b?auto=format&fit=crop&w=2000&q=80";

export const MAM_CASA_IMAGE =
  "https://images.unsplash.com/photo-1590073242678-70ee282f8e76?auto=format&fit=crop&w=2000&q=80";

export const MAM_PUBLIC_NAV = [
  { href: "/", label: "Home" },
  { href: "/manufacturing", label: "Manufacturing" },
  { href: "/capabilities", label: "Capabilities" },
  { href: "/industries", label: "Industries" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
] as const;

export type MamPublicPath = (typeof MAM_PUBLIC_NAV)[number]["href"] | "/contact";

const PUBLIC_PATHS = new Set<string>([
  "/",
  "/manufacturing",
  "/capabilities",
  "/industries",
  "/about",
  "/contact",
]);

export function isMamWebsiteHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  if (!normalized) return false;
  return MAM_WEBSITE_HOSTS.some((h) => normalized === h);
}

export function mamWebsiteImplPath(pathname: string): string {
  const path = pathname === "/" || pathname === "" ? "/" : pathname.replace(/\/$/, "");
  if (path === "/") return MAM_WEBSITE_ROUTE_PREFIX;
  if (path === "/manufacturing") return `${MAM_WEBSITE_ROUTE_PREFIX}/manufacturing`;
  if (path === "/capabilities") return `${MAM_WEBSITE_ROUTE_PREFIX}/capabilities`;
  if (path === "/industries") return `${MAM_WEBSITE_ROUTE_PREFIX}/industries`;
  if (path === "/about") return `${MAM_WEBSITE_ROUTE_PREFIX}/about`;
  if (path === "/contact") return `${MAM_WEBSITE_ROUTE_PREFIX}/contact`;
  return MAM_WEBSITE_ROUTE_PREFIX;
}

export function isMamPublicWebsitePath(pathname: string): boolean {
  const path = pathname === "/" || pathname === "" ? "/" : pathname.replace(/\/$/, "");
  return PUBLIC_PATHS.has(path);
}
