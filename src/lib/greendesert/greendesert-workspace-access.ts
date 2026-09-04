import { isUnit311GlobalAdminUsername } from "@/lib/demo/read-only";
import type { PlatformSession } from "@/lib/platform-session";

import { GREENDESERT_SLUG, isGreenDesertSlug } from "@/lib/greendesert-surface";

/** Workspace operators with dashboard access on greendesert.* */
export function isGreenDesertWorkspaceOperatorUsername(
  username: string | null | undefined,
): boolean {
  const normalized = String(username ?? "").trim().toLowerCase();
  return (
    normalized === "admin@greendesert.unit311central.com" ||
    normalized === "board@greendesert.unit311central.com"
  );
}

/**
 * Authorize greendesert.unit311central.com sessions.
 * Internal operators, workspace admins, and Unit311 global admins may access the tenant.
 */
export function allowsGreenDesertWorkspaceAccess(
  session: PlatformSession,
  workspaceSlug: string | null | undefined,
): boolean {
  if (!isGreenDesertSlug(workspaceSlug)) return false;
  if (isUnit311GlobalAdminUsername(session.username)) return true;
  if (isGreenDesertWorkspaceOperatorUsername(session.username)) return true;
  if (session.userType === "internal") return true;
  return false;
}

export function resolveGreenDesertWorkspaceSlug(workspaceSlug: string | null | undefined): string {
  return isGreenDesertSlug(workspaceSlug) ? GREENDESERT_SLUG : String(workspaceSlug ?? "").trim().toLowerCase();
}
