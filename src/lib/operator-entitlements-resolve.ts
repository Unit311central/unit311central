import {
  defaultAllowedViewsForRoles,
  defaultHomeTilesForRoles,
  normalizeAllowedViews,
  normalizeHomeTiles,
} from "@/lib/access-presets";
import type { CommandCentreHomeTileId } from "@/lib/command-centre-home-tiles";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import {
  normalizeUserDepartments,
  normalizeUserRoles,
  primaryUserDepartment,
  primaryUserRole,
  type UserDepartment,
  type UserRole,
} from "@/lib/user-management-data";

export type ResolvedOperatorEntitlements = {
  role: UserRole;
  roles: UserRole[];
  department: UserDepartment;
  departments: UserDepartment[];
  allowedViews: InternalOperationsView[] | null;
  homeTiles: CommandCentreHomeTileId[] | null;
};

export function isSuperOperatorRole(roles: readonly UserRole[]): boolean {
  return roles.includes("Admin") || roles.includes("Board") || roles.includes("Exec");
}

/**
 * Canonical effective view grants for an operator.
 * Admin/Board/Exec → unrestricted (null). Otherwise union role presets with stored grants.
 */
export function resolveEffectiveAllowedViews(
  roles: readonly UserRole[],
  departments: readonly UserDepartment[],
  storedAllowedViews: readonly InternalOperationsView[] | null | undefined,
): InternalOperationsView[] | null {
  if (isSuperOperatorRole(roles)) {
    return null;
  }

  const preset = defaultAllowedViewsForRoles(roles, departments);
  const stored = normalizeAllowedViews(storedAllowedViews);
  if (stored == null) {
    return preset;
  }

  const merged = new Set<InternalOperationsView>(preset);
  for (const view of stored) merged.add(view);
  return [...merged];
}

export function resolveEffectiveHomeTiles(
  roles: readonly UserRole[],
  departments: readonly UserDepartment[],
  storedHomeTiles: unknown,
): CommandCentreHomeTileId[] | null {
  if (isSuperOperatorRole(roles)) {
    return defaultHomeTilesForRoles(roles, departments);
  }
  const normalized = normalizeHomeTiles(storedHomeTiles);
  if (normalized) return normalized;
  return defaultHomeTilesForRoles(roles, departments);
}

export function resolveOperatorEntitlementsFromOperatorRow(row: {
  role?: string | null;
  roles?: unknown;
  department?: string | null;
  departments?: unknown;
  allowed_views?: unknown;
  dashboard_prefs?: unknown;
}): ResolvedOperatorEntitlements {
  const roles = normalizeUserRoles(row.roles, row.role);
  const role = primaryUserRole(roles);
  const departments = normalizeUserDepartments(row.departments, row.department);
  const department = primaryUserDepartment(departments);

  return {
    role,
    roles,
    department,
    departments,
    allowedViews: resolveEffectiveAllowedViews(
      roles,
      departments,
      normalizeAllowedViews(row.allowed_views),
    ),
    homeTiles: resolveEffectiveHomeTiles(
      roles,
      departments,
      row.dashboard_prefs &&
        typeof row.dashboard_prefs === "object" &&
        row.dashboard_prefs !== null &&
        "homeTiles" in (row.dashboard_prefs as object)
        ? (row.dashboard_prefs as { homeTiles?: unknown }).homeTiles
        : null,
    ),
  };
}

export function allowedViewsForRolePatch(
  roles: readonly UserRole[],
  departments: readonly UserDepartment[],
  explicitAllowedViews: InternalOperationsView[] | null | undefined,
): InternalOperationsView[] | null {
  if (isSuperOperatorRole(roles)) {
    return null;
  }
  if (explicitAllowedViews !== undefined) {
    return explicitAllowedViews;
  }
  return defaultAllowedViewsForRoles(roles, departments);
}
