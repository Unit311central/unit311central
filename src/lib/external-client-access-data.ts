/** External Client Access (MOD-160 / program MOD-620). */

import { ABHI_SLUG } from "@/lib/abhi-surface";
import { DEMO_SITE_URL } from "@/lib/app-domains";
import { demoClientPortalPublicPath } from "@/lib/demo/demo-client-portal-routes";
import { buildEcaPortalConfigsForWorkspace } from "@/lib/portals/eca-seed";
import { resolvePortalWorkspaceSlugFromBrowser } from "@/lib/portals/resolve-browser-workspace";
import { ONWARDAIR_SLUG } from "@/lib/onwardair-surface";

export const ECA_PORTAL_MODULES = [
  "Projects",
  "Files",
  "Support",
  "Training",
  "Invoices",
  "Contracts",
  "Documents",
  "Reports",
  "Calendar",
  "Communications",
  "Tasks",
  "Assets",
  "Custom Pages",
] as const;

export type EcaPortalModule = (typeof ECA_PORTAL_MODULES)[number];

export type EcaPortalConfig = {
  id: string;
  clientId: string;
  clientName: string;
  portalName: string;
  logoLabel: string;
  brandPrimary: string;
  brandAccent: string;
  modules: EcaPortalModule[];
  landingPage: string;
  supportContact: string;
  notificationsEnabled: boolean;
  documentBranding: string;
  users: number;
  activeSessions: number;
  pendingInvites: number;
  lockedAccounts: number;
  storageGb: number;
  lastLogin: string;
  /** When set, portal access is enabled for this client. */
  portalAccessEnabled?: boolean;
  /** Unique public portal URL (Talanton company portals). */
  portalUrl?: string;
};

export type EcaAuditEvent = {
  id: string;
  at: string;
  kind:
    | "Invitation"
    | "Password Reset"
    | "Permission Change"
    | "Failed Login"
    | "Successful Login"
    | "Portal Activity";
  actor: string;
  detail: string;
  clientName: string;
};

export type EcaInvitation = {
  id: string;
  email: string;
  clientName: string;
  role: string;
  modules: EcaPortalModule[];
  status: "Draft" | "Sent" | "Accepted";
  createdAt: string;
};

export function ecaStatusClass(status: string): string {
  const key = status.toLowerCase();
  if (key.includes("accept") || key.includes("success") || key.includes("enabled")) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (key.includes("fail") || key.includes("locked")) {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (key.includes("pending") || key.includes("sent") || key.includes("draft")) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-white/15 bg-white/[0.04] text-white/70";
}

/** ABHI HealthTech member companies used to seed the External Client Access dashboard. */
const ABHI_ECA_MEMBERS = [
  {
    id: "portal-abhi-centrak",
    clientId: "abhi-cli-centrak",
    clientName: "Centrak",
    portalName: "Centrak Member Portal",
    logoLabel: "CT",
    brandPrimary: "#C2185B",
    brandAccent: "#880E4F",
    modules: ["Projects", "Files", "Support", "Calendar", "Communications", "Reports"] as const,
    landingPage: "Projects",
    supportContact: "demo@centrak.com",
    notificationsEnabled: true,
    documentBranding: "ABHI member letterhead",
    users: 4,
    activeSessions: 2,
    pendingInvites: 0,
    lockedAccounts: 0,
    storageGb: 6.4,
    lastLogin: "2026-07-30T09:12:00Z",
  },
  {
    id: "portal-abhi-gama",
    clientId: "abhi-cli-gama-healthcare-ltd",
    clientName: "GAMA Healthcare Ltd",
    portalName: "GAMA Healthcare Member Portal",
    logoLabel: "GH",
    brandPrimary: "#0ea5e9",
    brandAccent: "#0369a1",
    modules: ["Projects", "Files", "Support", "Documents", "Reports", "Training"] as const,
    landingPage: "Documents",
    supportContact: "info@gamahealthcare.com",
    notificationsEnabled: true,
    documentBranding: "ABHI member letterhead",
    users: 6,
    activeSessions: 1,
    pendingInvites: 1,
    lockedAccounts: 0,
    storageGb: 11.8,
    lastLogin: "2026-07-29T14:40:00Z",
  },
  {
    id: "portal-abhi-zeumed",
    clientId: "abhi-cli-zeumed",
    clientName: "Zeumed",
    portalName: "Zeumed Member Portal",
    logoLabel: "ZM",
    brandPrimary: "#34d399",
    brandAccent: "#059669",
    modules: ["Projects", "Files", "Support", "Calendar", "Communications"] as const,
    landingPage: "Files",
    supportContact: "fionakiernan@zeumed.com",
    notificationsEnabled: true,
    documentBranding: "ABHI member letterhead",
    users: 3,
    activeSessions: 0,
    pendingInvites: 1,
    lockedAccounts: 0,
    storageGb: 3.1,
    lastLogin: "2026-07-24T11:05:00Z",
  },
  {
    id: "portal-abhi-ddc-dolphin",
    clientId: "abhi-cli-ddc-dolphin-ltd",
    clientName: "DDC Dolphin Ltd",
    portalName: "DDC Dolphin Member Portal",
    logoLabel: "DD",
    brandPrimary: "#a78bfa",
    brandAccent: "#7c3aed",
    modules: ["Projects", "Invoices", "Contracts", "Documents", "Reports"] as const,
    landingPage: "Invoices",
    supportContact: "demo@ddcdolphin.com",
    notificationsEnabled: false,
    documentBranding: "ABHI member letterhead",
    users: 5,
    activeSessions: 1,
    pendingInvites: 0,
    lockedAccounts: 1,
    storageGb: 8.9,
    lastLogin: "2026-07-27T08:22:00Z",
  },
  {
    id: "portal-abhi-wavetec",
    clientId: "abhi-cli-wavetec",
    clientName: "Wavetec",
    portalName: "Wavetec Member Portal",
    logoLabel: "WV",
    brandPrimary: "#f59e0b",
    brandAccent: "#b45309",
    modules: ["Projects", "Files", "Support", "Reports", "Training"] as const,
    landingPage: "Projects",
    supportContact: "demo@wavetec.com",
    notificationsEnabled: true,
    documentBranding: "ABHI member letterhead",
    users: 7,
    activeSessions: 3,
    pendingInvites: 2,
    lockedAccounts: 0,
    storageGb: 14.2,
    lastLogin: "2026-07-31T16:50:00Z",
  },
] as const;

function createAbhiSeedEcaPortals(): EcaPortalConfig[] {
  return ABHI_ECA_MEMBERS.map((member) => ({
    ...member,
    modules: [...member.modules],
  }));
}

function createNorthstarDemoEcaPortals(): EcaPortalConfig[] {
  const base = DEMO_SITE_URL.replace(/\/$/, "");
  return [
    {
      id: "portal-nst-sheffield",
      clientId: "nst-cli-sheffield",
      clientName: "Sheffield Precision Engineering",
      portalName: "Sheffield Precision Client Portal",
      logoLabel: "SP",
      brandPrimary: "#0ea5e9",
      brandAccent: "#0369a1",
      modules: ["Projects", "Files", "Support", "Documents", "Reports", "Invoices"],
      landingPage: "Projects",
      supportContact: "t.bradley@sheffieldprecision.co.uk",
      notificationsEnabled: true,
      documentBranding: "Northstar client letterhead",
      users: 6,
      activeSessions: 2,
      pendingInvites: 0,
      lockedAccounts: 0,
      storageGb: 14.2,
      lastLogin: "2026-08-15T09:40:00Z",
      portalAccessEnabled: true,
      portalUrl: `${base}${demoClientPortalPublicPath("sheffield-precision")}`,
    },
    {
      id: "portal-nst-peak",
      clientId: "nst-cli-peak",
      clientName: "Peak District Breweries",
      portalName: "Peak District Breweries Portal",
      logoLabel: "PD",
      brandPrimary: "#34d399",
      brandAccent: "#059669",
      modules: ["Projects", "Files", "Support", "Documents", "Reports", "Training"],
      landingPage: "Projects",
      supportContact: "d.wright@peakbrew.co.uk",
      notificationsEnabled: true,
      documentBranding: "Northstar client letterhead",
      users: 4,
      activeSessions: 1,
      pendingInvites: 0,
      lockedAccounts: 0,
      storageGb: 8.6,
      lastLogin: "2026-08-14T16:22:00Z",
      portalAccessEnabled: true,
      portalUrl: `${base}${demoClientPortalPublicPath("peak-district-breweries")}`,
    },
    {
      id: "portal-nst-midlands",
      clientId: "nst-cli-midlands",
      clientName: "Midlands Food Processing Co",
      portalName: "Midlands Food Client Portal",
      logoLabel: "MF",
      brandPrimary: "#f59e0b",
      brandAccent: "#b45309",
      modules: ["Projects", "Files", "Support", "Documents", "Reports", "Calendar"],
      landingPage: "Files",
      supportContact: "h.marsh@midlandsfood.co.uk",
      notificationsEnabled: true,
      documentBranding: "Northstar client letterhead",
      users: 5,
      activeSessions: 1,
      pendingInvites: 0,
      lockedAccounts: 0,
      storageGb: 11.3,
      lastLogin: "2026-08-13T11:05:00Z",
      portalAccessEnabled: true,
      portalUrl: `${base}${demoClientPortalPublicPath("midlands-food-processing")}`,
    },
  ];
}

export function createSeedEcaPortals(): EcaPortalConfig[] {
  const portalSlug = resolvePortalWorkspaceSlugFromBrowser();
  if (portalSlug) {
    const fromRegistry = buildEcaPortalConfigsForWorkspace(portalSlug) as EcaPortalConfig[];
    if (fromRegistry.length > 0) return fromRegistry;
    if (portalSlug === ABHI_SLUG) return createAbhiSeedEcaPortals();
  }

  if (typeof window !== "undefined") {
    try {
      const { isBrowserDemoSurface, getDemoEnterpriseFixtures } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        return createNorthstarDemoEcaPortals();
      }
    } catch {
      // Fall through to Internal seed.
    }
  }

  return [
    {
      id: "portal-001",
      clientId: "client-aeroparts",
      clientName: "AeroParts Iberia",
      portalName: "AeroParts Workspace",
      logoLabel: "AP",
      brandPrimary: "#0ea5e9",
      brandAccent: "#0369a1",
      modules: ["Projects", "Files", "Support", "Documents", "Reports", "Training"],
      landingPage: "Projects",
      supportContact: "support@aeroparts-iberia.example",
      notificationsEnabled: true,
      documentBranding: "AeroParts letterhead",
      users: 18,
      activeSessions: 4,
      pendingInvites: 2,
      lockedAccounts: 0,
      storageGb: 42.6,
      lastLogin: "2026-07-20T21:14:00Z",
    },
    {
      id: "portal-002",
      clientId: "client-skyline",
      clientName: "Skyline Survey Co",
      portalName: "Skyline Client Portal",
      logoLabel: "SS",
      brandPrimary: "#34d399",
      brandAccent: "#059669",
      modules: ["Projects", "Files", "Support", "Calendar", "Communications", "Assets"],
      landingPage: "Files",
      supportContact: "help@skyline.example",
      notificationsEnabled: true,
      documentBranding: "Skyline branded PDF",
      users: 9,
      activeSessions: 1,
      pendingInvites: 1,
      lockedAccounts: 1,
      storageGb: 18.2,
      lastLogin: "2026-07-19T10:02:00Z",
    },
    {
      id: "portal-003",
      clientId: "client-northwind",
      clientName: "Northwind Logistics",
      portalName: "Northwind Portal",
      logoLabel: "NL",
      brandPrimary: "#a78bfa",
      brandAccent: "#7c3aed",
      modules: ["Projects", "Invoices", "Contracts", "Documents", "Reports"],
      landingPage: "Documents",
      supportContact: "portal@northwind.example",
      notificationsEnabled: false,
      documentBranding: "Northwind standard",
      users: 12,
      activeSessions: 2,
      pendingInvites: 0,
      lockedAccounts: 0,
      storageGb: 27.4,
      lastLogin: "2026-07-20T08:40:00Z",
    },
  ];
}

export function createSeedEcaAudit(): EcaAuditEvent[] {
  const portalSlug = resolvePortalWorkspaceSlugFromBrowser();
  if (portalSlug === ABHI_SLUG) {
    return [
      { id: "aud-1", at: "2026-07-31T16:50:00Z", kind: "Successful Login", actor: "demo@wavetec.com", detail: "Portal session started", clientName: "Wavetec" },
      { id: "aud-2", at: "2026-07-30T09:12:00Z", kind: "Successful Login", actor: "demo@centrak.com", detail: "Portal session started", clientName: "Centrak" },
      { id: "aud-3", at: "2026-07-29T16:05:00Z", kind: "Invitation", actor: "Membership", detail: "Invited a contact at GAMA Healthcare Ltd as Contributor", clientName: "GAMA Healthcare Ltd" },
      { id: "aud-4", at: "2026-07-28T19:22:00Z", kind: "Failed Login", actor: "unknown@external.example", detail: "Invalid password (3rd attempt)", clientName: "DDC Dolphin Ltd" },
      { id: "aud-5", at: "2026-07-24T11:05:00Z", kind: "Password Reset", actor: "Membership", detail: "Reset issued for fionakiernan@zeumed.com", clientName: "Zeumed" },
    ];
  }

  if (portalSlug === ONWARDAIR_SLUG) {
    return [
          {
            id: "aud-oa-1",
            at: "2026-08-04T18:22:00Z",
            kind: "Successful Login",
            actor: "demo@coastalfreightpartners.com",
            detail: "Portal session started",
            clientName: "Coastal Freight Partners",
          },
          {
            id: "aud-oa-2",
            at: "2026-08-03T14:10:00Z",
            kind: "Portal Activity",
            actor: "demo@coastalfreightpartners.com",
            detail: "Viewed Fleet & VTOL · CFP-01 status",
            clientName: "Coastal Freight Partners",
          },
          {
            id: "aud-oa-3",
            at: "2026-08-02T11:05:00Z",
            kind: "Permission Change",
            actor: "Operations",
            detail: "Enabled Assets module for Coastal Freight Partners",
            clientName: "Coastal Freight Partners",
          },
          {
            id: "aud-oa-4",
            at: "2026-07-30T09:40:00Z",
            kind: "Invitation",
            actor: "Operations",
            detail: "Invited e.vargas@coastalfreightpartners.com as Contributor",
            clientName: "Coastal Freight Partners",
          },
          {
            id: "aud-oa-5",
            at: "2026-07-28T16:18:00Z",
            kind: "Failed Login",
            actor: "unknown@external.example",
            detail: "Invalid password (1st attempt)",
            clientName: "Coastal Freight Partners",
          },
        ];
  }

  if (typeof window !== "undefined") {
    try {
      const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        return [
          {
            id: "aud-nst-1",
            at: "2026-08-15T09:40:00Z",
            kind: "Successful Login",
            actor: "t.bradley@sheffieldprecision.co.uk",
            detail: "Portal session started",
            clientName: "Sheffield Precision Engineering",
          },
          {
            id: "aud-nst-2",
            at: "2026-08-14T16:22:00Z",
            kind: "Portal Activity",
            actor: "d.wright@peakbrew.co.uk",
            detail: "Downloaded IoT monitoring rollout pack",
            clientName: "Peak District Breweries",
          },
          {
            id: "aud-nst-3",
            at: "2026-08-13T11:05:00Z",
            kind: "Successful Login",
            actor: "h.marsh@midlandsfood.co.uk",
            detail: "Portal session started",
            clientName: "Midlands Food Processing Co",
          },
          {
            id: "aud-nst-4",
            at: "2026-08-12T14:18:00Z",
            kind: "Permission Change",
            actor: "Operations",
            detail: "Enabled Reports module for Peak District Breweries",
            clientName: "Peak District Breweries",
          },
          {
            id: "aud-nst-5",
            at: "2026-08-10T08:55:00Z",
            kind: "Failed Login",
            actor: "unknown@external.example",
            detail: "Invalid password (2nd attempt)",
            clientName: "Sheffield Precision Engineering",
          },
        ];
      }
    } catch {
      // Fall through.
    }
  }
  return [
    { id: "aud-1", at: "2026-07-20T21:14:00Z", kind: "Successful Login", actor: "carmen@aeroparts.example", detail: "Portal session started", clientName: "AeroParts Iberia" },
    { id: "aud-2", at: "2026-07-20T16:05:00Z", kind: "Invitation", actor: "Operations", detail: "Invited leo@skyline.example as Contributor", clientName: "Skyline Survey Co" },
    { id: "aud-3", at: "2026-07-19T19:22:00Z", kind: "Failed Login", actor: "unknown@external.example", detail: "Invalid password (3rd attempt)", clientName: "Skyline Survey Co" },
    { id: "aud-4", at: "2026-07-19T12:10:00Z", kind: "Permission Change", actor: "Operations", detail: "Enabled Invoices module for Northwind", clientName: "Northwind Logistics" },
    { id: "aud-5", at: "2026-07-18T09:45:00Z", kind: "Password Reset", actor: "Operations", detail: "Reset issued for maria@aeroparts.example", clientName: "AeroParts Iberia" },
  ];
}

export function createSeedEcaInvitations(): EcaInvitation[] {
  const portalSlug = resolvePortalWorkspaceSlugFromBrowser();
  if (portalSlug === ABHI_SLUG) {
    return [
      {
        id: "inv-1",
        email: "membership@bbraun.com",
        clientName: "GAMA Healthcare Ltd",
        role: "Contributor",
        modules: ["Projects", "Files", "Support"],
        status: "Sent",
        createdAt: "2026-07-29",
      },
      {
        id: "inv-2",
        email: "ops@ddcdolphin.com",
        clientName: "DDC Dolphin Ltd",
        role: "Viewer",
        modules: ["Invoices", "Reports"],
        status: "Draft",
        createdAt: "2026-07-27",
      },
    ];
  }

  if (portalSlug === ONWARDAIR_SLUG) {
    return [
          {
            id: "inv-oa-1",
            email: "e.vargas@coastalfreightpartners.com",
            clientName: "Coastal Freight Partners",
            role: "Contributor",
            modules: ["Projects", "Files", "Support", "Assets"],
            status: "Accepted",
            createdAt: "2026-07-30",
          },
          {
            id: "inv-oa-2",
            email: "ops@coastalfreightpartners.com",
            clientName: "Coastal Freight Partners",
            role: "Viewer",
            modules: ["Documents", "Reports"],
            status: "Sent",
            createdAt: "2026-08-01",
          },
        ];
  }

  if (typeof window !== "undefined") {
    try {
      const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        return [];
      }
    } catch {
      // Fall through.
    }
  }
  return [
    {
      id: "inv-1",
      email: "leo@skyline.example",
      clientName: "Skyline Survey Co",
      role: "Contributor",
      modules: ["Projects", "Files", "Support"],
      status: "Sent",
      createdAt: "2026-07-20",
    },
    {
      id: "inv-2",
      email: "ana@aeroparts.example",
      clientName: "AeroParts Iberia",
      role: "Viewer",
      modules: ["Documents", "Reports"],
      status: "Draft",
      createdAt: "2026-07-19",
    },
  ];
}
