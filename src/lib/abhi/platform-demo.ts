/**
 * ABHI platform demo users (demo@abhi.org.uk / admin@abhi.org.uk) on abhi.* hosts.
 * Fixture + entitlement helpers — keep edge-safe (no heavy nav imports).
 */

import type { PlatformSession } from "@/lib/platform-session";
import type { UserDepartment, UserRole } from "@/lib/user-management-data";
import { ABHI_SLUG, isAbhiSlug } from "@/lib/abhi-surface";

import {
  isAbhiPortalsAllowedUsername,
  isAbhiDemoPlatformUsername,
} from "@/lib/abhi/portals-auth";

export { isAbhiDemoPlatformUsername, isAbhiPortalsAllowedUsername };

export function isAbhiPlatformDemoSession(session: PlatformSession | null | undefined): boolean {
  if (!session) return false;
  return isAbhiPortalsAllowedUsername(session.username);
}

/** Internal staff on abhi.* (not external portal members). */
export function isAbhiInternalStaffSession(session: PlatformSession | null | undefined): boolean {
  if (!session) return false;
  return session.userType === "internal";
}

/** True when ABHI should use curated fixtures instead of missing/partial DB tables. */
export function usesAbhiFixtureApis(workspaceSlug: string | null | undefined): boolean {
  return isAbhiSlug(workspaceSlug);
}

export function allowsAbhiPlatformWorkspaceAccess(
  session: PlatformSession,
  workspaceSlug: string | null | undefined,
): boolean {
  if (!isAbhiSlug(workspaceSlug)) return false;
  if (isAbhiPortalsAllowedUsername(session.username)) return true;
  return session.userType === "internal";
}

export type AbhiPlatformWhoamiEntitlements = {
  role: UserRole;
  roles: UserRole[];
  department: UserDepartment;
  departments: UserDepartment[];
  allowedViews: null;
  dashboardPrefs: null;
};

/** Executive entitlements for ABHI demo platform logins (Management, full nav). */
export function getAbhiPlatformWhoamiEntitlements(): AbhiPlatformWhoamiEntitlements {
  return {
    role: "Exec",
    roles: ["Exec", "Admin"],
    department: "Corporate",
    departments: ["Corporate", "Operations"],
    allowedViews: null,
    dashboardPrefs: null,
  };
}

/** Full ABHI workspace nav for internal staff (working groups, accelerators, intelligence, LMS). */
export function getAbhiInternalStaffWhoamiEntitlements(): Pick<
  AbhiPlatformWhoamiEntitlements,
  "allowedViews" | "dashboardPrefs"
> {
  return {
    allowedViews: null,
    dashboardPrefs: null,
  };
}

export function resolveAbhiWorkspaceSlug(workspaceSlug: string | null | undefined): string {
  return isAbhiSlug(workspaceSlug) ? ABHI_SLUG : String(workspaceSlug ?? "").trim().toLowerCase();
}
