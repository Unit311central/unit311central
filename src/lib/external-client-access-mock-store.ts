import {
  createSeedEcaAudit,
  createSeedEcaInvitations,
  createSeedEcaPortals,
  type EcaAuditEvent,
  type EcaInvitation,
  type EcaPortalConfig,
  type EcaPortalModule,
} from "@/lib/external-client-access-data";

export type EcaMockState = {
  portals: EcaPortalConfig[];
  audit: EcaAuditEvent[];
  invitations: EcaInvitation[];
};

let state: EcaMockState = {
  portals: createSeedEcaPortals(),
  audit: createSeedEcaAudit(),
  invitations: createSeedEcaInvitations(),
};

const listeners = new Set<() => void>();
function emit() {
  for (const listener of listeners) listener();
}

export function subscribeEcaMockStore(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getEcaMockSnapshot() {
  return state;
}

export function updatePortalConfig(
  id: string,
  patch: Partial<
    Pick<
      EcaPortalConfig,
      | "portalName"
      | "brandPrimary"
      | "brandAccent"
      | "modules"
      | "landingPage"
      | "supportContact"
      | "notificationsEnabled"
      | "documentBranding"
      | "logoLabel"
    >
  >,
) {
  const clientName = state.portals.find((p) => p.id === id)?.clientName ?? id;
  const event: EcaAuditEvent = {
    id: `aud-${Date.now()}`,
    at: new Date().toISOString(),
    kind: "Permission Change",
    actor: "Operations",
    detail: `Updated portal configuration for ${id}`,
    clientName,
  };
  state = {
    ...state,
    portals: state.portals.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    audit: [event, ...state.audit].slice(0, 40),
  };
  emit();
}

export function togglePortalModule(id: string, moduleName: EcaPortalModule) {
  const portal = state.portals.find((row) => row.id === id);
  if (!portal) return;
  const modules = portal.modules.includes(moduleName)
    ? portal.modules.filter((m) => m !== moduleName)
    : [...portal.modules, moduleName];
  updatePortalConfig(id, { modules });
}

export function createInvitation(input: Omit<EcaInvitation, "id" | "createdAt" | "status">) {
  const invitation: EcaInvitation = {
    ...input,
    id: `inv-${Date.now()}`,
    status: "Sent",
    createdAt: new Date().toISOString().slice(0, 10),
  };
  const event: EcaAuditEvent = {
    id: `aud-${Date.now()}`,
    at: new Date().toISOString(),
    kind: "Invitation",
    actor: "Operations",
    detail: `Invited ${input.email} as ${input.role}`,
    clientName: input.clientName,
  };
  state = {
    ...state,
    invitations: [invitation, ...state.invitations],
    portals: state.portals.map((portal) =>
      portal.clientName === input.clientName
        ? { ...portal, pendingInvites: portal.pendingInvites + 1 }
        : portal,
    ),
    audit: [event, ...state.audit].slice(0, 40),
  };
  emit();
  return invitation;
}
