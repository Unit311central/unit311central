import {
  GREENDESERT_BOARD_CLIENT_ID,
  GREENDESERT_BOARD_PORTAL_ORIGIN,
  GREENDESERT_BOARD_USERNAME,
} from "@/lib/greendesert/greendesert-board-portal-data";
import type { EcaMockState } from "@/lib/external-client-access-mock-store";
import type { EcaPortalConfig } from "@/lib/external-client-access-data";

const GREENDESERT_ECA_PORTALS: EcaPortalConfig[] = [
  {
    id: "portal-gd-board",
    clientId: GREENDESERT_BOARD_CLIENT_ID,
    clientName: "Green Desert Board",
    portalName: "Board Portal",
    logoLabel: "BD",
    brandPrimary: "#166534",
    brandAccent: "#14532d",
    modules: ["Documents", "Reports", "Calendar", "Communications"],
    landingPage: "Documents",
    supportContact: GREENDESERT_BOARD_USERNAME,
    notificationsEnabled: true,
    documentBranding: "Green Desert board pack letterhead",
    users: 4,
    activeSessions: 1,
    pendingInvites: 0,
    lockedAccounts: 0,
    storageGb: 2.4,
    lastLogin: "2026-09-04T09:30:00Z",
    portalAccessEnabled: true,
    portalUrl: `${GREENDESERT_BOARD_PORTAL_ORIGIN}/board`,
  },
  {
    id: "portal-gd-jeddah",
    clientId: "greendesert-cli-jeddah-technologies",
    clientName: "Jeddah Technologies",
    portalName: "Jeddah Technologies Client Portal",
    logoLabel: "JT",
    brandPrimary: "#0d9488",
    brandAccent: "#115e59",
    modules: ["Projects", "Files", "Support", "Documents", "Reports", "Communications"],
    landingPage: "Projects",
    supportContact: "jeddahtechnologies@greendesert.unit311central.com",
    notificationsEnabled: true,
    documentBranding: "Jeddah Technologies programme letterhead",
    users: 6,
    activeSessions: 2,
    pendingInvites: 1,
    lockedAccounts: 0,
    storageGb: 8.6,
    lastLogin: "2026-09-03T14:15:00Z",
    portalAccessEnabled: true,
    portalUrl: `${GREENDESERT_BOARD_PORTAL_ORIGIN}/jeddahtechnologies`,
  },
];

export function buildGreenDesertEcaState(): EcaMockState {
  return {
    portals: GREENDESERT_ECA_PORTALS.map((portal) => ({ ...portal })),
    audit: [
      {
        id: "gd-audit-001",
        at: "2026-09-04T09:30:00Z",
        kind: "Successful Login",
        actor: GREENDESERT_BOARD_USERNAME,
        detail: "Board portal dashboard access",
        clientName: "Green Desert Board",
      },
      {
        id: "gd-audit-002",
        at: "2026-09-03T14:15:00Z",
        kind: "Portal Activity",
        actor: "jeddahtechnologies@greendesert.unit311central.com",
        detail: "Viewed reactor deployment project files",
        clientName: "Jeddah Technologies",
      },
    ],
    invitations: [],
  };
}
