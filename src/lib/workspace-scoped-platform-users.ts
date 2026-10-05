import { listWorkspaceTenantUsers } from "@/lib/platform-users-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";
import type { ManagedUser } from "@/lib/user-management-data";

/**
 * Workspace membership directory (platform_users ∩ workspace_users).
 * Never uses the global internal_operators catalogue.
 */
export async function listWorkspacePersonDirectory(
  workspaceId: string,
  options?: { activeOnly?: boolean },
): Promise<ManagedUser[]> {
  const users = await listWorkspaceTenantUsers(workspaceId);
  if (!options?.activeOnly) return users;
  return users.filter((user) => user.status === "Active");
}

export async function listActiveMessagingOperatorsForWorkspace(
  workspaceId: string,
): Promise<ManagedUser[]> {
  return listWorkspacePersonDirectory(workspaceId, { activeOnly: true });
}

/** Slugs where legacy global internal_operators may still be used for Unit311-internal-only tooling. */
export function isUnit311InternalWorkspaceSlug(slug: string | null | undefined): boolean {
  const normalized = String(slug ?? "").trim().toLowerCase();
  return normalized === INTERNAL_WORKSPACE_SLUG || normalized === "internal";
}
