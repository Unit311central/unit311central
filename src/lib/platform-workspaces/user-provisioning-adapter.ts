import type { WorkspaceImportEmployee } from "@/lib/platform-workspaces/types";

export type UserProvisioningRequest = {
  workspaceId: string;
  workspaceSlug: string;
  employees: WorkspaceImportEmployee[];
};

export type UserProvisioningResult = {
  status: "queued" | "skipped" | "failed";
  queuedCount: number;
  message: string;
};

/**
 * Phase 2 boundary — authentication user provisioning is not connected yet.
 * The wizard records intent; this adapter returns an honest queued status.
 */
export async function queueWorkspaceUserProvisioning(
  request: UserProvisioningRequest,
): Promise<UserProvisioningResult> {
  if (request.employees.length === 0) {
    return {
      status: "skipped",
      queuedCount: 0,
      message: "No employees were provided for provisioning.",
    };
  }

  return {
    status: "queued",
    queuedCount: request.employees.length,
    message:
      `${request.employees.length} user(s) queued for authentication provisioning. ` +
      "Initial passwords and auth accounts will be created when Phase 3 provisioning connects.",
  };
}
