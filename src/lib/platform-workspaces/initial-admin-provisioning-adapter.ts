import {
  hashPlatformPasswordForUser,
  normalizePlatformUsername,
} from "@/lib/platform-auth";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import type { InitialWorkspaceAdministratorInput } from "@/lib/platform-workspaces/types";

export type InitialAdminProvisioningRequest = {
  workspaceId: string;
  workspaceSlug: string;
  companyName: string;
  administrator: InitialWorkspaceAdministratorInput;
};

export type InitialAdminProvisioningResult = {
  status: "complete" | "skipped" | "failed";
  userId?: string;
  email: string;
  message: string;
};

async function ensureWorkspaceAdministratorMembership(input: {
  workspaceId: string;
  platformUserId: string;
}): Promise<void> {
  const supabase = createTenancyServerClient();
  const { data: existing } = await supabase
    .from("workspace_users")
    .select("id, role, is_owner")
    .eq("workspace_id", input.workspaceId)
    .eq("user_id", input.platformUserId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("workspace_users")
      .update({
        role: "admin",
        is_owner: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) {
      throw new Error(error.message || "Failed to update workspace administrator membership.");
    }
    return;
  }

  const { error } = await supabase.from("workspace_users").insert({
    workspace_id: input.workspaceId,
    user_id: input.platformUserId,
    role: "admin",
    is_owner: true,
  });
  if (error) {
    throw new Error(error.message || "Failed to create workspace administrator membership.");
  }
}

/**
 * Create or update the mandatory initial Full Workspace Administrator.
 * Idempotent per workspace via initial_admin_user_id metadata and email lookup.
 */
export async function provisionInitialWorkspaceAdministrator(
  request: InitialAdminProvisioningRequest,
): Promise<InitialAdminProvisioningResult> {
  const email = request.administrator.email.trim().toLowerCase();
  const firstName = request.administrator.firstName.trim();
  const lastName = request.administrator.lastName.trim();
  const password = request.administrator.password;
  const username = normalizePlatformUsername(email);
  const displayName = `${firstName} ${lastName}`.trim() || email;
  const passwordHash = hashPlatformPasswordForUser(username, password);

  const supabase = createTenancyServerClient();

  const { data: metadata } = await supabase
    .from("workspace_admin_metadata")
    .select("initial_admin_user_id, initial_admin_email")
    .eq("workspace_id", request.workspaceId)
    .maybeSingle();

  if (metadata?.initial_admin_user_id) {
    const userId = String(metadata.initial_admin_user_id);
    const patch: Record<string, unknown> = {
      display_name: displayName,
      workspace_id: request.workspaceId,
      is_active: true,
      email_verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (password) {
      patch.password_hash = passwordHash;
    }
    const { error } = await supabase
      .from("platform_users")
      .update(patch)
      .eq("id", userId);
    if (error) {
      throw new Error(error.message || "Failed to refresh initial administrator credentials.");
    }
    await ensureWorkspaceAdministratorMembership({
      workspaceId: request.workspaceId,
      platformUserId: userId,
    });
    return {
      status: "complete",
      userId,
      email,
      message: "Initial workspace administrator is ready.",
    };
  }

  const { data: existingMembership } = await supabase
    .from("workspace_users")
    .select("user_id, platform_users!inner(id, email, username)")
    .eq("workspace_id", request.workspaceId)
    .eq("is_owner", true)
    .limit(1)
    .maybeSingle();

  if (existingMembership?.user_id) {
    const userId = String(existingMembership.user_id);
    await ensureWorkspaceAdministratorMembership({
      workspaceId: request.workspaceId,
      platformUserId: userId,
    });
    await supabase
      .from("workspace_admin_metadata")
      .update({
        initial_admin_user_id: userId,
        initial_admin_email: email,
        initial_admin_first_name: firstName,
        initial_admin_last_name: lastName,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", request.workspaceId);
    return {
      status: "complete",
      userId,
      email,
      message: "Existing workspace administrator membership reused.",
    };
  }

  const { data: byEmail } = await supabase
    .from("platform_users")
    .select("id, workspace_id")
    .eq("email", email)
    .maybeSingle();

  if (byEmail?.id) {
    const existingWorkspaceId = byEmail.workspace_id ? String(byEmail.workspace_id) : null;
    if (existingWorkspaceId && existingWorkspaceId !== request.workspaceId) {
      throw new Error(
        `The email ${email} is already assigned to another workspace. Use a different administrator email.`,
      );
    }
    const userId = String(byEmail.id);
    const { error } = await supabase
      .from("platform_users")
      .update({
        username,
        display_name: displayName,
        password_hash: passwordHash,
        user_type: "internal",
        redirect_path: "/dashboard",
        client_name: request.companyName,
        is_active: true,
        email,
        email_verified_at: new Date().toISOString(),
        workspace_id: request.workspaceId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);
    if (error) {
      throw new Error(error.message || "Failed to update existing platform user for administrator.");
    }
    await ensureWorkspaceAdministratorMembership({
      workspaceId: request.workspaceId,
      platformUserId: userId,
    });
    await supabase
      .from("workspace_admin_metadata")
      .update({
        initial_admin_user_id: userId,
        initial_admin_email: email,
        initial_admin_first_name: firstName,
        initial_admin_last_name: lastName,
        updated_at: new Date().toISOString(),
      })
      .eq("workspace_id", request.workspaceId);
    return {
      status: "complete",
      userId,
      email,
      message: "Initial workspace administrator account updated.",
    };
  }

  const { data: created, error: createError } = await supabase
    .from("platform_users")
    .insert({
      username,
      display_name: displayName,
      password_hash: passwordHash,
      user_type: "internal",
      redirect_path: "/dashboard",
      client_name: request.companyName,
      is_active: true,
      email,
      email_verified_at: new Date().toISOString(),
      workspace_id: request.workspaceId,
    })
    .select("id")
    .single();

  if (createError || !created?.id) {
    throw new Error(createError?.message || "Failed to create initial workspace administrator.");
  }

  const userId = String(created.id);
  await ensureWorkspaceAdministratorMembership({
    workspaceId: request.workspaceId,
    platformUserId: userId,
  });

  await supabase
    .from("workspace_admin_metadata")
    .update({
      initial_admin_user_id: userId,
      initial_admin_email: email,
      initial_admin_first_name: firstName,
      initial_admin_last_name: lastName,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", request.workspaceId);

  return {
    status: "complete",
    userId,
    email,
    message: "Initial Full Workspace Administrator created.",
  };
}
