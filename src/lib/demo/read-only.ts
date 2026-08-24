import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

export const DEMO_PROSPECT_USERNAME = "demo@unit311central.com";
export const DEMO_ADMIN_USERNAME = "admin@unit311central.com";

/** Demo host identities — see docs/DEMO_RELEASE_MODEL.md */
export type DemoRole = "owner" | "platform-admin" | null;

export function resolveDemoRole(username: string | null | undefined): DemoRole {
  const normalized = String(username ?? "").trim().toLowerCase();
  if (normalized === DEMO_PROSPECT_USERNAME) return "owner";
  if (normalized === DEMO_ADMIN_USERNAME) return "platform-admin";
  return null;
}

/** Demo Owner (`demo@…`) — primary Demo workspace account. */
export function isDemoOwnerUsername(username: string | null | undefined): boolean {
  return resolveDemoRole(username) === "owner";
}

/** Legacy alias used by /portals and fixture helpers. */
export function isDemoProspectUsername(username: string | null | undefined): boolean {
  return isDemoOwnerUsername(username);
}

/** Unit311 platform admin on Demo host (`admin@…`). */
export function isDemoAdminUsername(username: string | null | undefined): boolean {
  return resolveDemoRole(username) === "platform-admin";
}

/** Global Unit311 platform admin (internal + demo). */
export const isUnit311GlobalAdminUsername = isDemoAdminUsername;

export function applyUnit311GlobalAdminEntitlements<
  T extends {
    role?: string | null;
    roles?: string[] | null;
    department?: string | null;
    departments?: string[] | null;
    allowedViews?: string[] | null;
  },
>(payload: T): T {
  return {
    ...payload,
    role: "Admin",
    roles: ["Admin"],
    department: payload.department ?? "Corporate",
    departments: payload.departments?.length ? payload.departments : ["Corporate"],
    allowedViews: null,
  };
}

export function isDemoWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG;
}

export function isDemoReadOnlySession(input: {
  workspaceSlug?: string | null;
  username?: string | null;
}): boolean {
  if (!isDemoWorkspaceSlug(input.workspaceSlug)) return false;
  // Demo Owner and platform admin may mutate on the Demo workspace (DEMO_RELEASE_MODEL).
  // Internal operators visiting Demo were never read-only; keep that behaviour.
  return false;
}

export function demoMutationBlockedMessage(): string {
  return "This Demo workspace session is read-only. Sign in as the Demo Owner or admin@unit311central.com to make changes.";
}
