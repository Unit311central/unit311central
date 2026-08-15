import { getPortalPackBySlug } from "@/lib/portals/registry";
import type { PortalRouteDefinition } from "@/lib/portals/types";

export type EcaPortalSeedModule =
  | "Projects"
  | "Files"
  | "Support"
  | "Training"
  | "Invoices"
  | "Contracts"
  | "Documents"
  | "Reports"
  | "Calendar"
  | "Communications"
  | "Tasks"
  | "Assets"
  | "Custom Pages";

export type EcaPortalSeedConfig = {
  id: string;
  clientId: string;
  clientName: string;
  portalName: string;
  logoLabel: string;
  brandPrimary: string;
  brandAccent: string;
  modules: EcaPortalSeedModule[];
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
  portalAccessEnabled?: boolean;
  portalUrl?: string;
};

const DEFAULT_ECA_MODULES: EcaPortalSeedModule[] = [
  "Projects",
  "Files",
  "Support",
  "Documents",
  "Reports",
  "Training",
];

function routeIdPrefix(workspaceSlug: string): string {
  if (workspaceSlug === "onwardair") return "portal-oa";
  if (workspaceSlug === "talantonimpact") return "portal-ti";
  if (workspaceSlug === "abhi") return "portal-abhi";
  return `portal-${workspaceSlug}`;
}

function shouldIncludeRouteInEca(route: PortalRouteDefinition): boolean {
  return route.portalKind !== "board" && route.portalKind !== "overview";
}

/**
 * Build External Client Access seed rows from the central portal registry.
 */
export function buildEcaPortalConfigsForWorkspace(workspaceSlug: string): EcaPortalSeedConfig[] {
  const pack = getPortalPackBySlug(workspaceSlug);
  if (!pack) return [];

  const origin = pack.origin.replace(/\/$/, "");
  const routes = pack.routes.filter(shouldIncludeRouteInEca);

  if (workspaceSlug === "talantonimpact") {
    const accents = [
      ["#10b981", "#047857"],
      ["#0ea5e9", "#0369a1"],
      ["#f59e0b", "#b45309"],
      ["#8b5cf6", "#6d28d9"],
      ["#ef4444", "#b91c1c"],
    ] as const;
    return routes.map((route, index) => {
      const [primary, accent] = accents[index % accents.length];
      const initials = route.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
      return {
        id: `${routeIdPrefix(workspaceSlug)}-${route.path}`,
        clientId: route.clientId,
        clientName: route.displayName,
        portalName: `${route.displayName} Portal`,
        logoLabel: initials || "TI",
        brandPrimary: primary,
        brandAccent: accent,
        modules: [...DEFAULT_ECA_MODULES],
        landingPage: "Documents",
        supportContact: route.username,
        notificationsEnabled: true,
        documentBranding: "Talanton Impact letterhead",
        users: 4 + (index % 8),
        activeSessions: index % 3,
        pendingInvites: index % 2,
        lockedAccounts: 0,
        storageGb: 8 + index * 1.4,
        lastLogin: "2026-07-28T10:00:00Z",
        portalAccessEnabled: true,
        portalUrl: `${origin}/${route.path}`,
      };
    });
  }

  if (workspaceSlug === "onwardair") {
    return routes.map((route) => ({
      id: `${routeIdPrefix(workspaceSlug)}-${route.path.replace(/\./g, "-")}`,
      clientId: route.clientId,
      clientName: route.displayName,
      portalName: `${route.displayName} Portal`,
      logoLabel: "CF",
      brandPrimary: "#0d9488",
      brandAccent: "#0b1f3a",
      modules: [...DEFAULT_ECA_MODULES, "Assets"],
      landingPage: "Projects",
      supportContact: route.username,
      notificationsEnabled: true,
      documentBranding: "OnwardAir client programme letterhead",
      users: 3,
      activeSessions: 1,
      pendingInvites: 0,
      lockedAccounts: 0,
      storageGb: 4.8,
      lastLogin: "2026-08-04T18:22:00Z",
      portalAccessEnabled: true,
      portalUrl: `${origin}/${route.path}`,
    }));
  }

  return routes.map((route, index) => ({
    id: `${routeIdPrefix(workspaceSlug)}-${route.path}`,
    clientId: route.clientId,
    clientName: route.displayName,
    portalName: `${route.displayName} Portal`,
    logoLabel: route.displayName.slice(0, 2).toUpperCase(),
    brandPrimary: "#C2185B",
    brandAccent: "#880E4F",
    modules: ["Projects", "Files", "Support", "Calendar", "Communications", "Reports"],
    landingPage: "Projects",
    supportContact: route.username,
    notificationsEnabled: true,
    documentBranding: "Member letterhead",
    users: 3 + (index % 4),
    activeSessions: index % 2,
    pendingInvites: 0,
    lockedAccounts: 0,
    storageGb: 5 + index,
    lastLogin: "2026-07-30T09:12:00Z",
    portalAccessEnabled: true,
    portalUrl: `${origin}/${route.path}`,
  }));
}
