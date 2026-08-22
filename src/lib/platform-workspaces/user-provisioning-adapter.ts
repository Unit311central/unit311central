import {
  generatePlatformPassword,
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { ensureWorkspaceOwnerMembership } from "@/lib/workspace-provisioning-service";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import type { WorkspaceImportEmployee } from "@/lib/platform-workspaces/types";

export type UserProvisioningRequest = {
  workspaceId: string;
  workspaceSlug: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  employees: WorkspaceImportEmployee[];
  /** Emails that must not be re-provisioned (e.g. initial workspace administrator). */
  excludeEmails?: string[];
};

export type UserProvisioningResult = {
  status: "complete" | "skipped" | "failed";
  provisionedCount: number;
  message: string;
};

type ProvisionTarget = WorkspaceImportEmployee & {
  isOwner?: boolean;
};

function buildProvisionTargets(request: UserProvisioningRequest): ProvisionTarget[] {
  const exclude = new Set(
    (request.excludeEmails ?? []).map((email) => email.trim().toLowerCase()).filter(Boolean),
  );
  const targets: ProvisionTarget[] = request.employees
    .filter((employee) => !exclude.has(employee.email.trim().toLowerCase()))
    .map((employee) => ({ ...employee }));
  return targets;
}

/** @internal Exported for generic provisioning tests. */
export function buildWorkspaceProvisionTargets(
  request: UserProvisioningRequest,
): ProvisionTarget[] {
  return buildProvisionTargets(request);
}

async function upsertPlatformUser(input: {
  workspaceId: string;
  companyName: string;
  employee: ProvisionTarget;
}): Promise<string> {
  const supabase = createTenancyServerClient();
  const email = input.employee.email.trim().toLowerCase();
  const username = normalizePlatformUsername(email);
  const displayName = `${input.employee.firstName} ${input.employee.lastName}`.trim() || email;
  const password = generatePlatformPassword(14);
  const passwordHash = hashPlatformPasswordForUser(username, password);

  const { data: byEmail } = await supabase
    .from("platform_users")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  const { data: byUsername } = await supabase
    .from("platform_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  const userId = byEmail?.id ?? byUsername?.id;
  const patch = {
    username,
    display_name: displayName,
    password_hash: passwordHash,
    user_type: "internal" as const,
    redirect_path: "/dashboard",
    client_name: input.companyName,
    is_active: true,
    email,
    email_verified_at: new Date().toISOString(),
    workspace_id: input.workspaceId,
    updated_at: new Date().toISOString(),
  };

  if (userId) {
    const { error } = await supabase.from("platform_users").update(patch).eq("id", userId);
    if (error) {
      throw new Error(`Failed to update platform user ${email}: ${error.message}`);
    }
    return String(userId);
  }

  const { data: created, error } = await supabase
    .from("platform_users")
    .insert(patch)
    .select("id")
    .single();
  if (error) {
    throw new Error(`Failed to create platform user ${email}: ${error.message}`);
  }
  return String(created.id);
}

/**
 * Phase 3 — create platform_users + workspace_users for wizard imports.
 * Idempotent per email within the workspace.
 */
export async function provisionWorkspaceUsers(
  request: UserProvisioningRequest,
): Promise<UserProvisioningResult> {
  const targets = buildProvisionTargets(request);
  if (targets.length === 0) {
    return {
      status: "skipped",
      provisionedCount: 0,
      message: "No additional employees were provided for authentication provisioning.",
    };
  }

  let provisionedCount = 0;
  for (const employee of targets) {
    const userId = await upsertPlatformUser({
      workspaceId: request.workspaceId,
      companyName: request.companyName,
      employee,
    });
    const isOwner = Boolean(employee.isOwner || employee.role?.toLowerCase() === "owner");
    if (isOwner) {
      await ensureWorkspaceOwnerMembership({
        workspaceId: request.workspaceId,
        platformUserId: userId,
      });
    } else {
      const supabase = createTenancyServerClient();
      const { data: existing } = await supabase
        .from("workspace_users")
        .select("id")
        .eq("workspace_id", request.workspaceId)
        .eq("user_id", userId)
        .maybeSingle();
      if (!existing?.id) {
        const { error } = await supabase.from("workspace_users").insert({
          workspace_id: request.workspaceId,
          user_id: userId,
          role: employee.role?.trim() || "member",
          is_owner: false,
        });
        if (error) {
          throw new Error(`Failed to add workspace membership for ${employee.email}: ${error.message}`);
        }
      }
    }
    provisionedCount += 1;
  }

  return {
    status: "complete",
    provisionedCount,
    message:
      provisionedCount === 1
        ? "1 authentication account provisioned."
        : `${provisionedCount} authentication accounts provisioned.`,
  };
}

/** @deprecated Use provisionWorkspaceUsers — kept for memory repository compatibility. */
export async function queueWorkspaceUserProvisioning(
  request: Omit<UserProvisioningRequest, "companyName" | "contactName" | "contactEmail"> & {
    employees: WorkspaceImportEmployee[];
  },
): Promise<{ status: "queued" | "skipped" | "failed"; queuedCount: number; message: string }> {
  const result = await provisionWorkspaceUsers({
    ...request,
    companyName: request.workspaceSlug,
    contactName: "",
    contactEmail: "",
  });
  return {
    status: result.status === "complete" ? "queued" : result.status,
    queuedCount: result.provisionedCount,
    message: result.message,
  };
}
