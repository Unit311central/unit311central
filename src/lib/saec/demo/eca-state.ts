import type { EcaMockState } from "@/lib/external-client-access-mock-store";
import type { EcaPortalConfig, EcaAuditEvent, EcaInvitation } from "@/lib/external-client-access-data";

const SAEC_CLIENT_PORTALS: EcaPortalConfig[] = [
  {
    id: "portal-saec-hyprop",
    clientId: "saec-client-hyprop",
    clientName: "Hyprop Investments",
    portalName: "Hyprop · SAEC Client Portal",
    logoLabel: "Hyprop",
    brandPrimary: "#1F4FBF",
    brandAccent: "#F59E0B",
    modules: ["Projects", "Support", "Documents", "Invoices", "Calendar"],
    landingPage: "Dashboard",
    supportContact: "support@saec.biz",
    notificationsEnabled: true,
    documentBranding: "SAEC",
    users: 6,
    activeSessions: 2,
    pendingInvites: 1,
    lockedAccounts: 0,
    storageGb: 4.2,
    lastLogin: "2026-08-22",
    portalAccessEnabled: true,
    portalUrl: "https://clients.saec.demo/hyprop",
  },
  {
    id: "portal-saec-growthpoint",
    clientId: "saec-client-growthpoint",
    clientName: "Growthpoint Properties",
    portalName: "Growthpoint · SAEC Client Portal",
    logoLabel: "Growthpoint",
    brandPrimary: "#0F766E",
    brandAccent: "#38BDF8",
    modules: ["Projects", "Support", "Documents", "Reports"],
    landingPage: "Service status",
    supportContact: "support@saec.biz",
    notificationsEnabled: true,
    documentBranding: "SAEC",
    users: 8,
    activeSessions: 3,
    pendingInvites: 0,
    lockedAccounts: 0,
    storageGb: 6.1,
    lastLogin: "2026-08-24",
    portalAccessEnabled: true,
    portalUrl: "https://clients.saec.demo/growthpoint",
  },
  {
    id: "portal-saec-va",
    clientId: "saec-client-va",
    clientName: "V&A Waterfront",
    portalName: "V&A Waterfront · SAEC Client Portal",
    logoLabel: "V&A",
    brandPrimary: "#1E3A5F",
    brandAccent: "#E11D48",
    modules: ["Projects", "Support", "Documents", "Tasks"],
    landingPage: "Projects",
    supportContact: "support@saec.biz",
    notificationsEnabled: true,
    documentBranding: "SAEC",
    users: 5,
    activeSessions: 1,
    pendingInvites: 1,
    lockedAccounts: 0,
    storageGb: 3.4,
    lastLogin: "2026-08-20",
    portalAccessEnabled: true,
    portalUrl: "https://clients.saec.demo/vawaterfront",
  },
];

const SAEC_ECA_AUDIT: EcaAuditEvent[] = [
  {
    id: "saec-eca-aud-1",
    at: new Date().toISOString(),
    kind: "Portal Activity",
    actor: "Annelize Fourie",
    detail: "Viewed Centurion Mall commissioning schedule",
    clientName: "Hyprop Investments",
  },
  {
    id: "saec-eca-aud-2",
    at: new Date().toISOString(),
    kind: "Successful Login",
    actor: "Thabo Mokoena",
    detail: "Logged into client portal",
    clientName: "Growthpoint Properties",
  },
];

const SAEC_ECA_INVITATIONS: EcaInvitation[] = [
  {
    id: "saec-inv-hyprop",
    email: "annelize.fourie@hyprop.demo",
    clientName: "Hyprop Investments",
    role: "Facilities Manager",
    modules: ["Projects", "Support", "Documents"],
    status: "Accepted",
    createdAt: "2026-07-01",
  },
];

export function buildSaecEcaState(): EcaMockState {
  return {
    portals: SAEC_CLIENT_PORTALS,
    audit: SAEC_ECA_AUDIT,
    invitations: SAEC_ECA_INVITATIONS,
  };
}
