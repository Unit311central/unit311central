export type DemoClientPortalConfig = {
  slug: string;
  companyName: string;
  companyId: string;
  contactFirst: string;
  contactLast: string;
  contactEmail: string;
};

export const DEMO_CLIENT_PORTALS: readonly DemoClientPortalConfig[] = [
  {
    slug: "sheffield-precision",
    companyName: "Sheffield Precision Engineering",
    companyId: "nst-cli-sheffield",
    contactFirst: "Tom",
    contactLast: "Bradley",
    contactEmail: "t.bradley@sheffieldprecision.co.uk",
  },
  {
    slug: "peak-district-breweries",
    companyName: "Peak District Breweries",
    companyId: "nst-cli-peak",
    contactFirst: "Daniel",
    contactLast: "Wright",
    contactEmail: "d.wright@peakbrew.co.uk",
  },
  {
    slug: "midlands-food-processing",
    companyName: "Midlands Food Processing Co",
    companyId: "nst-cli-midlands",
    contactFirst: "Helen",
    contactLast: "Marsh",
    contactEmail: "h.marsh@midlandsfood.co.uk",
  },
] as const;

const RESERVED_DEMO_PATHS = new Set([
  "login",
  "dashboard",
  "internaldashboard",
  "board",
  "portals",
  "api",
  "samples",
  "demo-client",
  "demo-client-portal",
  "company-overview",
  "_next",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

export function getDemoClientPortal(slug: string): DemoClientPortalConfig | null {
  const normalized = slug.trim().toLowerCase();
  return DEMO_CLIENT_PORTALS.find((row) => row.slug === normalized) ?? null;
}

/** Match `/{slug}` on demo host — e.g. /sheffield-precision */
export function matchDemoClientPortalSlug(pathname: string): string | null {
  const segment = pathname.replace(/^\/+|\/+$/g, "").split("/").filter(Boolean)[0];
  if (!segment || segment.includes(".")) return null;
  if (RESERVED_DEMO_PATHS.has(segment.toLowerCase())) return null;
  return getDemoClientPortal(segment)?.slug ?? null;
}

export const PRIMARY_DEMO_CLIENT_PORTAL_SLUG = DEMO_CLIENT_PORTALS[0]?.slug ?? "sheffield-precision";

export function demoClientPortalPublicPath(slug: string = PRIMARY_DEMO_CLIENT_PORTAL_SLUG) {
  return `/${slug}`;
}
