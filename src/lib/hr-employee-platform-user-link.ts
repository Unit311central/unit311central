/**
 * Canonical Employee ↔ Platform User relationship (Stage 1 foundation).
 *
 * Business rules:
 * - Employee (hr_employees) is HR/business data scoped to a workspace.
 * - Platform User (platform_users) is login identity; workspace access via workspace_users.
 * - platform_user_id on hr_employees is the optional 1:1 link per workspace when set.
 * - internal_operators is NOT part of this link (legacy / Unit311 internal catalogue).
 */

export class HrEmployeePlatformUserLinkError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "HrEmployeePlatformUserLinkError";
    this.status = status;
  }
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizePlatformUserId(value: unknown): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (!UUID_RE.test(raw)) return null;
  return raw.toLowerCase();
}

export type ValidateEmployeePlatformUserLinkInput = {
  employeeWorkspaceId: string;
  platformUserId: string;
  /** platform_users.workspace_id (primary workspace on identity row). */
  platformUserPrimaryWorkspaceId: string | null;
  /** workspace_ids from workspace_users memberships for this platform user. */
  platformUserMembershipWorkspaceIds: readonly string[];
  /** Another employee id already using this platform_user_id in the same workspace. */
  conflictingEmployeeId?: string | null;
  /** Employee id being linked (exclude self from duplicate check). */
  employeeId?: string;
};

/**
 * Ensures a platform user may be linked to an employee in the given workspace.
 * Does not grant cross-workspace access — user must belong to the employee workspace.
 */
export function validateEmployeePlatformUserLink(
  input: ValidateEmployeePlatformUserLinkInput,
): void {
  const workspaceId = String(input.employeeWorkspaceId ?? "").trim();
  const platformUserId = normalizePlatformUserId(input.platformUserId);
  if (!workspaceId) {
    throw new HrEmployeePlatformUserLinkError("Workspace context is required.", 400);
  }
  if (!platformUserId) {
    throw new HrEmployeePlatformUserLinkError("A valid platform user id is required.", 400);
  }

  const memberships = new Set(
    input.platformUserMembershipWorkspaceIds
      .map((id) => String(id ?? "").trim())
      .filter(Boolean),
  );
  const primary = input.platformUserPrimaryWorkspaceId
    ? String(input.platformUserPrimaryWorkspaceId).trim()
    : null;

  const belongsToWorkspace =
    memberships.has(workspaceId) || (primary !== null && primary === workspaceId);

  if (!belongsToWorkspace) {
    throw new HrEmployeePlatformUserLinkError(
      "Platform user does not belong to this workspace and cannot be linked to this employee.",
      409,
    );
  }

  const conflict = input.conflictingEmployeeId?.trim();
  if (conflict && (!input.employeeId || conflict !== input.employeeId)) {
    throw new HrEmployeePlatformUserLinkError(
      "This platform user is already linked to another employee in this workspace.",
      409,
    );
  }
}

/** Documented behaviour for Case D — remove platform access from employee record. */
export const UNLINK_EMPLOYEE_PLATFORM_USER_BEHAVIOUR = {
  clearsPlatformUserId: true,
  clearsLegacyOperatorId: true,
  deletesPlatformUser: false,
  deletesEmployee: false,
} as const;
