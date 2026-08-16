import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";

export const DEMO_PROSPECT_USERNAME = "demo@unit311central.com";
export const DEMO_ADMIN_USERNAME = "admin@unit311central.com";

export type DemoRole = "prospect" | "admin" | null;

export function resolveDemoRole(username: string | null | undefined): DemoRole {
  const normalized = String(username ?? "").trim().toLowerCase();
  if (normalized === DEMO_PROSPECT_USERNAME) return "prospect";
  if (normalized === DEMO_ADMIN_USERNAME) return "admin";
  return null;
}

export function isDemoProspectUsername(username: string | null | undefined): boolean {
  return resolveDemoRole(username) === "prospect";
}

export function isDemoAdminUsername(username: string | null | undefined): boolean {
  return resolveDemoRole(username) === "admin";
}

export function isDemoWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === DEMO_WORKSPACE_SLUG;
}

export function isDemoReadOnlySession(input: {
  workspaceSlug?: string | null;
  username?: string | null;
}): boolean {
  if (!isDemoWorkspaceSlug(input.workspaceSlug)) return false;
  return isDemoProspectUsername(input.username);
}

export function demoMutationBlockedMessage(): string {
  return "Demo is read-only for prospect users. Sign in as admin@unit311central.com to make changes or reset the Demo.";
}
