/** Website Management (MOD-150 / program MOD-610). */

export const WEBSITE_CMS_TYPES = ["WordPress", "Other"] as const;
export type WebsiteCmsType = (typeof WEBSITE_CMS_TYPES)[number];

export const WEBSITE_ENVIRONMENTS = ["Production", "Staging", "Development"] as const;
export type WebsiteEnvironment = (typeof WEBSITE_ENVIRONMENTS)[number];

export type ManagedWebsite = {
  id: string;
  name: string;
  cms: WebsiteCmsType;
  url: string;
  restApiUrl: string;
  environment: WebsiteEnvironment;
  domain: string;
  sslStatus: "Valid" | "Expiring" | "Invalid";
  lastDeployment: string;
  lastSync: string;
  pages: number;
  posts: number;
  media: number;
  pluginUpdates: number;
  themeUpdates: number;
  backups: number;
  analyticsVisitors: number;
  connectionStatus: "connected" | "disconnected" | "error";
  providerCode: string;
  clientName: string;
};

export type WebsiteContentItem = {
  id: string;
  websiteId: string;
  kind: "Page" | "Post" | "Media" | "Menu" | "Plugin" | "Theme";
  title: string;
  status: "Draft" | "Published" | "Scheduled" | "Archived";
  updatedAt: string;
  author: string;
};

export type WebsiteDeployment = {
  id: string;
  websiteId: string;
  environment: WebsiteEnvironment;
  at: string;
  by: string;
  note: string;
  status: "Succeeded" | "Failed" | "Rolled back";
};

export function websiteStatusClass(status: string): string {
  const key = status.toLowerCase();
  if (key.includes("connected") || key.includes("published") || key.includes("valid") || key.includes("succeeded")) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (key.includes("error") || key.includes("invalid") || key.includes("failed")) {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (key.includes("expir") || key.includes("draft") || key.includes("scheduled")) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-white/15 bg-white/[0.04] text-white/70";
}

export function createSeedWebsites(): ManagedWebsite[] {
  return [
    {
      id: "web-001",
      name: "Unit311 Marketing",
      cms: "WordPress",
      url: "https://unit311central.com",
      restApiUrl: "https://unit311central.com/wp-json",
      environment: "Production",
      domain: "unit311central.com",
      sslStatus: "Valid",
      lastDeployment: "2026-07-19T16:20:00Z",
      lastSync: "2026-07-20T22:10:00Z",
      pages: 28,
      posts: 64,
      media: 312,
      pluginUpdates: 3,
      themeUpdates: 1,
      backups: 14,
      analyticsVisitors: 18420,
      connectionStatus: "connected",
      providerCode: "cms.wordpress",
      clientName: "Unit311 Central",
    },
    {
      id: "web-002",
      name: "AeroParts Public Site",
      cms: "WordPress",
      url: "https://www.aeroparts-iberia.example",
      restApiUrl: "https://www.aeroparts-iberia.example/wp-json",
      environment: "Staging",
      domain: "aeroparts-iberia.example",
      sslStatus: "Valid",
      lastDeployment: "2026-07-17T11:00:00Z",
      lastSync: "2026-07-18T08:40:00Z",
      pages: 16,
      posts: 22,
      media: 98,
      pluginUpdates: 5,
      themeUpdates: 0,
      backups: 8,
      analyticsVisitors: 4210,
      connectionStatus: "connected",
      providerCode: "cms.wordpress",
      clientName: "AeroParts Iberia",
    },
  ];
}

export function createSeedWebsiteContent(websiteId: string): WebsiteContentItem[] {
  return [
    { id: `${websiteId}-p1`, websiteId, kind: "Page", title: "Home", status: "Published", updatedAt: "2026-07-18", author: "Marketing" },
    { id: `${websiteId}-p2`, websiteId, kind: "Page", title: "Solutions", status: "Published", updatedAt: "2026-07-16", author: "Marketing" },
    { id: `${websiteId}-po1`, websiteId, kind: "Post", title: "Platform release notes", status: "Published", updatedAt: "2026-07-15", author: "Product" },
    { id: `${websiteId}-po2`, websiteId, kind: "Post", title: "Customer story draft", status: "Draft", updatedAt: "2026-07-19", author: "Marketing" },
    { id: `${websiteId}-m1`, websiteId, kind: "Media", title: "hero-drone.jpg", status: "Published", updatedAt: "2026-07-10", author: "Design" },
    { id: `${websiteId}-pl1`, websiteId, kind: "Plugin", title: "SEO Toolkit", status: "Published", updatedAt: "2026-07-01", author: "Ops" },
    { id: `${websiteId}-t1`, websiteId, kind: "Theme", title: "Unit311 Theme", status: "Published", updatedAt: "2026-06-20", author: "Design" },
  ];
}

export function createSeedDeployments(websiteId: string): WebsiteDeployment[] {
  return [
    { id: `${websiteId}-d1`, websiteId, environment: "Production", at: "2026-07-19T16:20:00Z", by: "Ops", note: "Homepage hero refresh", status: "Succeeded" },
    { id: `${websiteId}-d2`, websiteId, environment: "Staging", at: "2026-07-18T09:10:00Z", by: "Marketing", note: "Blog layout test", status: "Succeeded" },
    { id: `${websiteId}-d3`, websiteId, environment: "Production", at: "2026-07-12T14:00:00Z", by: "Ops", note: "Plugin update rollback", status: "Rolled back" },
  ];
}
