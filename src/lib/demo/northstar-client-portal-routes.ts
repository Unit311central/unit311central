import { DEMO_SITE_URL } from "@/lib/app-domains";
import { getDemoClientPortal, type DemoClientPortalConfig } from "@/lib/demo/demo-client-portal-routes";

export const SHEFFIELD_PORTAL_USERNAME = "demo@sheffieldprecision.com";
export const SHEFFIELD_PORTAL_PASSWORD = "Sheffield2026$";
export const SHEFFIELD_PORTAL_PATH = "sheffield-precision";

export type NorthstarDemoClientPortalRoute = DemoClientPortalConfig & {
  path: string;
  username: string;
  redirectPath: string;
  companyLogoSrc: string;
};

const SHEFFIELD_ROUTE: NorthstarDemoClientPortalRoute = {
  slug: SHEFFIELD_PORTAL_PATH,
  path: SHEFFIELD_PORTAL_PATH,
  companyName: "Sheffield Precision Engineering",
  companyId: "nst-cli-sheffield",
  contactFirst: "Tom",
  contactLast: "Bradley",
  contactEmail: "t.bradley@sheffieldprecision.co.uk",
  username: SHEFFIELD_PORTAL_USERNAME,
  redirectPath: `/${SHEFFIELD_PORTAL_PATH}`,
  companyLogoSrc: "/images/portals/sheffield-precision.svg?v=sheffield-client",
};

export function getNorthstarDemoClientPortalBySlug(
  slug: string | null | undefined,
): NorthstarDemoClientPortalRoute | null {
  const portal = getDemoClientPortal(String(slug ?? ""));
  if (!portal || portal.slug !== SHEFFIELD_PORTAL_PATH) return null;
  return SHEFFIELD_ROUTE;
}

export function matchNorthstarDemoClientPortalPathname(pathname: string): {
  route: NorthstarDemoClientPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (!parts.length) return null;
  const route = getNorthstarDemoClientPortalBySlug(parts[0]);
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function resolveNorthstarDemoClientPortalRedirect(options: {
  redirectPath?: string | null;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const username = String(options.username ?? "")
    .trim()
    .toLowerCase();
  if (username === SHEFFIELD_PORTAL_USERNAME) {
    return SHEFFIELD_ROUTE.redirectPath;
  }

  const candidates = [options.redirectPath, options.nextRaw];
  for (const raw of candidates) {
    const trimmed = String(raw ?? "").trim();
    if (!trimmed) continue;
    const pathOnly = trimmed.startsWith("/") ? trimmed.split("?")[0] : null;
    if (pathOnly === SHEFFIELD_ROUTE.redirectPath || pathOnly?.startsWith(`${SHEFFIELD_ROUTE.redirectPath}/`)) {
      return SHEFFIELD_ROUTE.redirectPath;
    }
  }
  return null;
}

export function resolveNorthstarDemoClientPortalPostLoginUrl(options: {
  redirectPath?: string | null;
  nextRaw?: string | null;
  username?: string | null;
}): string | null {
  const path = resolveNorthstarDemoClientPortalRedirect(options);
  if (!path) return null;
  return `${DEMO_SITE_URL.replace(/\/$/, "")}${path}`;
}
