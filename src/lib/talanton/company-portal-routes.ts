/**
 * Route-based Talanton portfolio company portals + Board governance portal.
 * Public URLs live on talantonimpact.unit311central.com/{path} only — no company subdomains.
 */

export type TalantonCompanyPortalRoute = {
  path: string;
  displayName: string;
  /** internal_clients.id */
  clientId: string;
  /** portfolio-data company id (empty for Board portal) */
  companyId: string;
  username: string;
  redirectPath: string;
  /** Portfolio company portal vs Talanton Board governance portal. */
  portalKind?: "company" | "board";
};

export const TALANTON_COMPANY_PORTAL_ROUTES: readonly TalantonCompanyPortalRoute[] = [
  {
    path: "board",
    displayName: "Talanton Impact Board",
    clientId: "ti-cli-board",
    companyId: "",
    username: "board@talantonimpact.com",
    redirectPath: "/board",
    portalKind: "board",
  },
  {
    path: "ethicalapparelafrica",
    displayName: "Ethical Apparel Africa",
    clientId: "ti-cli-ethical-apparel-africa",
    companyId: "ti-co-ethical-apparel-africa",
    username: "demo@ethicalapparelafrica.com",
    redirectPath: "/ethicalapparelafrica",
  },
  {
    path: "arcrideglobal",
    displayName: "ARC Ride",
    clientId: "ti-cli-arc-ride",
    companyId: "ti-co-arc-ride",
    username: "demo@arcrideglobal.com",
    redirectPath: "/arcrideglobal",
  },
  {
    path: "burnstoves",
    displayName: "Burn Manufacturing",
    clientId: "ti-cli-burn-manufacturing",
    companyId: "ti-co-burn-manufacturing",
    username: "demo@burnmfg.com",
    redirectPath: "/burnstoves",
  },
  {
    path: "kentegrabiotech",
    displayName: "Kentegra Biotechnology",
    clientId: "ti-cli-kentegra-biotechnology",
    companyId: "ti-co-kentegra-biotechnology",
    username: "demo@kentegrabiotech.com",
    redirectPath: "/kentegrabiotech",
  },
  {
    path: "longmilescoffee",
    displayName: "Long Miles Coffee",
    clientId: "ti-cli-long-miles-coffee",
    companyId: "ti-co-long-miles-coffee",
    username: "demo@longmilescoffee.com",
    redirectPath: "/longmilescoffee",
  },
  {
    path: "pharmakina",
    displayName: "Pharmakina",
    clientId: "ti-cli-pharmakina",
    companyId: "ti-co-pharmakina",
    username: "demo@pharmakina.com",
    redirectPath: "/pharmakina",
  },
  {
    path: "moko",
    displayName: "Moko Home + Living",
    clientId: "ti-cli-moko-home-living",
    companyId: "ti-co-moko-home-living",
    username: "demo@moko.co.ke",
    redirectPath: "/moko",
  },
  {
    path: "pwr",
    displayName: "Power Resources International",
    clientId: "ti-cli-power-resources-international",
    companyId: "ti-co-power-resources-international",
    username: "demo@pwr.ltd",
    redirectPath: "/pwr",
  },
  {
    path: "autosprings",
    displayName: "Auto Springs East Africa PLC",
    clientId: "ti-cli-auto-springs-east-africa-plc",
    companyId: "ti-co-auto-springs-east-africa-plc",
    username: "demo@autosprings.net",
    redirectPath: "/autosprings",
  },
  {
    path: "biofarms",
    displayName: "BioFarms Limited",
    clientId: "ti-cli-biofarms-limited",
    companyId: "ti-co-biofarms-limited",
    username: "demo@biofarms.co.ke",
    redirectPath: "/biofarms",
  },
  {
    path: "endasportswear",
    displayName: "Enda Sportswear",
    clientId: "ti-cli-enda-sportswear",
    companyId: "ti-co-enda-sportswear",
    username: "demo@endasportswear.com",
    redirectPath: "/endasportswear",
  },
  {
    path: "kijaniforestry",
    displayName: "Kijani Forestry",
    clientId: "ti-cli-kijani-forestry",
    companyId: "ti-co-kijani-forestry",
    username: "demo@kijaniforestry.com",
    redirectPath: "/kijaniforestry",
  },
  {
    path: "kivutilapia",
    displayName: "Kivu Tilapia Farm Ltd",
    clientId: "ti-cli-kivu-tilapia-farm-ltd",
    companyId: "ti-co-kivu-tilapia-farm-ltd",
    username: "demo@kivutilapia.com",
    redirectPath: "/kivutilapia",
  },
  {
    path: "masakafarms",
    displayName: "Masaka Farms",
    clientId: "ti-cli-masaka-farms",
    companyId: "ti-co-masaka-farms",
    username: "demo@masakafarms.com",
    redirectPath: "/masakafarms",
  },
  {
    path: "owppharma",
    displayName: "OWP Pharmaceuticals",
    clientId: "ti-cli-owp-pharmaceuticals",
    companyId: "ti-co-owp-pharmaceuticals",
    username: "demo@owppharma.com",
    redirectPath: "/owppharma",
  },
  {
    path: "pezesha",
    displayName: "Pezesha",
    clientId: "ti-cli-pezesha",
    companyId: "ti-co-pezesha",
    username: "demo@pezesha.com",
    redirectPath: "/pezesha",
  },
  {
    path: "poa",
    displayName: "poa! Internet",
    clientId: "ti-cli-poa-internet",
    companyId: "ti-co-poa-internet",
    username: "demo@poa.co.ke",
    redirectPath: "/poa",
  },
  {
    path: "rabboni",
    displayName: "Rabboni Group",
    clientId: "ti-cli-rabboni-group",
    companyId: "ti-co-rabboni-group",
    username: "demo@rabboni.co.ug",
    redirectPath: "/rabboni",
  },
  {
    path: "tarajischools",
    displayName: "Taraji Afrika",
    clientId: "ti-cli-taraji-afrika",
    companyId: "ti-co-taraji-afrika",
    username: "demo@tarajischools.com",
    redirectPath: "/tarajischools",
  },
] as const;

const BY_PATH = new Map(TALANTON_COMPANY_PORTAL_ROUTES.map((r) => [r.path, r]));
const BY_COMPANY_ID = new Map(
  TALANTON_COMPANY_PORTAL_ROUTES.filter((r) => r.companyId).map((r) => [r.companyId, r]),
);
const BY_CLIENT_ID = new Map(TALANTON_COMPANY_PORTAL_ROUTES.map((r) => [r.clientId, r]));

export function getCompanyPortalByPath(
  path: string | null | undefined,
): TalantonCompanyPortalRoute | null {
  const key = String(path ?? "")
    .trim()
    .toLowerCase()
    .replace(/^\/+|\/+$/g, "")
    .split("/")[0];
  if (!key) return null;
  return BY_PATH.get(key) ?? null;
}

export function getCompanyPortalByCompanyId(
  companyId: string | null | undefined,
): TalantonCompanyPortalRoute | null {
  if (!companyId) return null;
  return BY_COMPANY_ID.get(companyId) ?? BY_CLIENT_ID.get(companyId) ?? null;
}

export function companyPortalAbsoluteUrl(route: TalantonCompanyPortalRoute): string {
  return `https://talantonimpact.unit311central.com${route.redirectPath}`;
}

export function isTalantonCompanyPortalPath(pathname: string | null | undefined): boolean {
  return getCompanyPortalByPath(pathname) != null;
}

export function matchTalantonCompanyPortalPathname(pathname: string): {
  route: TalantonCompanyPortalRoute;
  rest: string;
} | null {
  const cleaned = pathname.split("?")[0] || "/";
  const parts = cleaned.split("/").filter(Boolean);
  if (parts.length === 0) return null;
  const route = BY_PATH.get(parts[0].toLowerCase());
  if (!route) return null;
  const rest = parts.length > 1 ? `/${parts.slice(1).join("/")}` : "";
  return { route, rest };
}

export function publicCompanyPortalHref(path: string, rest = ""): string {
  const suffix = rest && !rest.startsWith("/") ? `/${rest}` : rest;
  return `/${path}${suffix}`;
}
