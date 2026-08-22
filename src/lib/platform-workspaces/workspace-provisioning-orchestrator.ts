import { provisionWorkspaceClients } from "@/lib/platform-workspaces/client-provisioning-adapter";
import { provisionInitialWorkspaceAdministrator } from "@/lib/platform-workspaces/initial-admin-provisioning-adapter";
import { nowIso } from "@/lib/platform-workspaces/workspace-admin-mappers";
import {
  isCustomerHostnameAvailable,
  registerWorkspaceHostAlias,
} from "@/lib/platform-workspaces/workspace-host-alias-service";
import {
  isValidCustomerHostname,
  resolveCustomerHostname,
  workspacePrimaryUrlForWorkspace,
} from "@/lib/platform-workspaces/workspace-hostname";
import {
  provisionWorkspaceLoginPage,
  verifyWorkspaceLoginPageReady,
} from "@/lib/platform-workspaces/workspace-login-page-service";
import { provisionWorkspaceUsers } from "@/lib/platform-workspaces/user-provisioning-adapter";
import type {
  InitialWorkspaceAdministratorInput,
  WorkspaceImportClient,
  WorkspaceImportEmployee,
  WorkspaceLoginPageInput,
  WorkspaceProvisioningState,
  WorkspaceType,
} from "@/lib/platform-workspaces/types";
import { findWorkspaceBySlug } from "@/lib/workspace-host";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { assertInitialAdministratorPasswordForProvisioning } from "@/lib/platform-workspaces/initial-admin-password";

export type WorkspaceProvisioningOverallStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "failed";

export type WorkspaceProvisioningContext = {
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  workspaceType: WorkspaceType;
  companyName: string;
  contactName: string;
  contactEmail: string;
  customerHostname: string;
  employees: WorkspaceImportEmployee[];
  clients: WorkspaceImportClient[];
  loginPage: WorkspaceLoginPageInput;
  initialAdministrator: InitialWorkspaceAdministratorInput;
};

export type WorkspaceProvisioningRunResult = {
  overallStatus: WorkspaceProvisioningOverallStatus;
  provisioning: WorkspaceProvisioningState;
  primaryUrl: string;
  initialAdministratorEmail: string;
};

type MetadataProvisioningRow = {
  provisioning_database_status?: string | null;
  provisioning_authentication_status?: string | null;
  provisioning_infrastructure_status?: string | null;
  provisioning_deployment_status?: string | null;
  provisioning_workspace_record_status?: string | null;
  provisioning_login_page_status?: string | null;
  provisioning_initial_admin_status?: string | null;
  provisioning_overall_status?: string | null;
  provisioning_last_message?: string | null;
  customer_hostname?: string | null;
  initial_admin_email?: string | null;
  initial_admin_user_id?: string | null;
};

const IN_PROGRESS_STALE_MS = 5 * 60 * 1000;

function asStepStatus(
  value: string | null | undefined,
): WorkspaceProvisioningState["databaseStatus"] | "failed" {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "complete") return "complete";
  if (normalized === "skipped") return "skipped";
  if (normalized === "failed") return "failed";
  return "not_started";
}

function buildProvisioningState(metadata: MetadataProvisioningRow | null): WorkspaceProvisioningState {
  return {
    databaseStatus: asStepStatus(metadata?.provisioning_database_status),
    authenticationStatus: asStepStatus(metadata?.provisioning_authentication_status),
    infrastructureStatus: asStepStatus(metadata?.provisioning_infrastructure_status),
    deploymentStatus: asStepStatus(metadata?.provisioning_deployment_status),
    workspaceRecordStatus: asStepStatus(metadata?.provisioning_workspace_record_status) as WorkspaceProvisioningState["workspaceRecordStatus"],
    loginPageStatus: asStepStatus(metadata?.provisioning_login_page_status),
    initialAdminStatus: asStepStatus(metadata?.provisioning_initial_admin_status),
    overallStatus: (metadata?.provisioning_overall_status?.trim().toLowerCase() ||
      "not_started") as WorkspaceProvisioningOverallStatus,
    lastMessage: metadata?.provisioning_last_message ?? undefined,
  };
}

async function loadMetadata(workspaceId: string): Promise<MetadataProvisioningRow | null> {
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspace_admin_metadata")
    .select(
      "provisioning_database_status, provisioning_authentication_status, provisioning_infrastructure_status, provisioning_deployment_status, provisioning_workspace_record_status, provisioning_login_page_status, provisioning_initial_admin_status, provisioning_overall_status, provisioning_last_message, customer_hostname, initial_admin_email, initial_admin_user_id, updated_at",
    )
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) {
    throw new Error(error.message || "Failed to load workspace provisioning metadata.");
  }
  return data;
}

async function persistProvisioningState(
  workspaceId: string,
  provisioning: WorkspaceProvisioningState,
  customerHostname: string,
): Promise<void> {
  const supabase = createTenancyServerClient();
  const { error } = await supabase
    .from("workspace_admin_metadata")
    .update({
      customer_hostname: customerHostname,
      provisioning_database_status: provisioning.databaseStatus,
      provisioning_authentication_status: provisioning.authenticationStatus,
      provisioning_infrastructure_status: provisioning.infrastructureStatus,
      provisioning_deployment_status: provisioning.deploymentStatus,
      provisioning_workspace_record_status: provisioning.workspaceRecordStatus,
      provisioning_login_page_status: provisioning.loginPageStatus ?? "not_started",
      provisioning_initial_admin_status: provisioning.initialAdminStatus ?? "not_started",
      provisioning_overall_status: provisioning.overallStatus,
      provisioning_last_message: provisioning.lastMessage ?? null,
      updated_at: nowIso(),
    })
    .eq("workspace_id", workspaceId);
  if (error) {
    throw new Error(error.message || "Failed to persist provisioning state.");
  }
}

async function markWorkspaceActive(workspaceId: string, workspaceType: WorkspaceType): Promise<void> {
  const supabase = createTenancyServerClient();
  const status = workspaceType === "Demo" ? "Active" : "Active";
  const { error } = await supabase
    .from("workspaces")
    .update({
      status,
      onboarding_completed: workspaceType === "Demo",
      updated_at: nowIso(),
    })
    .eq("id", workspaceId);
  if (error) {
    throw new Error(error.message || "Failed to activate workspace.");
  }
}

async function verifyInitialAdministratorReady(
  workspaceId: string,
  expectedEmail: string,
): Promise<boolean> {
  const supabase = createTenancyServerClient();
  const { data: metadata } = await supabase
    .from("workspace_admin_metadata")
    .select("initial_admin_user_id, initial_admin_email, provisioning_initial_admin_status")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (metadata?.provisioning_initial_admin_status !== "complete") return false;
  if (!metadata.initial_admin_user_id) return false;
  if (
    metadata.initial_admin_email &&
    String(metadata.initial_admin_email).toLowerCase() !== expectedEmail.trim().toLowerCase()
  ) {
    return false;
  }

  const userId = String(metadata.initial_admin_user_id);
  const { data: user } = await supabase
    .from("platform_users")
    .select("id, is_active, password_hash")
    .eq("id", userId)
    .maybeSingle();

  if (!user?.id || !user.is_active || !user.password_hash) return false;

  const { data: membership } = await supabase
    .from("workspace_users")
    .select("role, is_owner")
    .eq("workspace_id", workspaceId)
    .eq("user_id", userId)
    .maybeSingle();

  return membership?.role === "admin" && membership?.is_owner === true;
}

function isProvisioningComplete(state: WorkspaceProvisioningState): boolean {
  const steps = [
    state.databaseStatus,
    state.infrastructureStatus,
    state.loginPageStatus,
    state.initialAdminStatus,
    state.authenticationStatus,
    state.deploymentStatus,
    state.workspaceRecordStatus,
  ];
  return steps.every((step) => step === "complete" || step === "skipped");
}

/**
 * Idempotent Phase 3 orchestrator. Safe to call from create and from retry endpoint.
 */
export async function runWorkspaceProvisioning(
  context: WorkspaceProvisioningContext,
): Promise<WorkspaceProvisioningRunResult> {
  const customerHostname = resolveCustomerHostname(
    context.workspaceSlug,
    context.customerHostname,
  );
  if (!isValidCustomerHostname(customerHostname)) {
    throw new Error(`Customer hostname "${customerHostname}" is not valid or is reserved.`);
  }

  const metadata = await loadMetadata(context.workspaceId);
  const updatedAt = (metadata as { updated_at?: string } | null)?.updated_at;
  const current = buildProvisioningState(metadata);
  const adminEmail = context.initialAdministrator.email.trim().toLowerCase();

  if (current.overallStatus === "complete" && isProvisioningComplete(current)) {
    return {
      overallStatus: "complete",
      provisioning: current,
      primaryUrl: workspacePrimaryUrlForWorkspace(
        context.workspaceSlug,
        customerHostname,
      ),
      initialAdministratorEmail: metadata?.initial_admin_email?.trim().toLowerCase() || adminEmail,
    };
  }

  if (current.overallStatus === "in_progress" && updatedAt) {
    const ageMs = Date.now() - new Date(updatedAt).getTime();
    if (ageMs < IN_PROGRESS_STALE_MS) {
      throw new Error("Provisioning is already in progress for this workspace.");
    }
  }

  const hostnameAvailable = await isCustomerHostnameAvailable(
    customerHostname,
    context.workspaceId,
  );
  if (!hostnameAvailable) {
    throw new Error(`Customer hostname "${customerHostname}" is already in use.`);
  }

  let provisioning: WorkspaceProvisioningState = {
    ...current,
    overallStatus: "in_progress",
    lastMessage: "Starting workspace provisioning.",
  };
  await persistProvisioningState(context.workspaceId, provisioning, customerHostname);

  try {
    // 1–2. Workspace record + hostname registration
    if (provisioning.databaseStatus !== "complete") {
      provisioning = {
        ...provisioning,
        databaseStatus: "complete",
        lastMessage: "Workspace database foundation is ready.",
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    if (provisioning.workspaceRecordStatus !== "complete") {
      provisioning = {
        ...provisioning,
        workspaceRecordStatus: "complete",
        lastMessage: "Workspace registry record is ready.",
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    const slugDiffers = customerHostname !== context.workspaceSlug;
    if (slugDiffers) {
      await registerWorkspaceHostAlias({
        aliasSubdomain: customerHostname,
        workspaceId: context.workspaceId,
        workspaceSlug: context.workspaceSlug,
      });
      provisioning = {
        ...provisioning,
        infrastructureStatus: "complete",
        lastMessage: `Customer host alias registered: ${customerHostname}.unit311central.com → ${context.workspaceSlug}.`,
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    } else if (provisioning.infrastructureStatus !== "complete") {
      provisioning = {
        ...provisioning,
        infrastructureStatus: "complete",
        lastMessage:
          "Shared wildcard DNS and routing are active for this workspace hostname.",
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    // 3. Login page configuration
    if (provisioning.loginPageStatus !== "complete") {
      const login = await provisionWorkspaceLoginPage({
        workspaceId: context.workspaceId,
        loginPage: context.loginPage,
      });
      provisioning = {
        ...provisioning,
        loginPageStatus: login.status === "skipped" ? "skipped" : "complete",
        lastMessage: login.message,
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    // 4–6. Initial Full Workspace Administrator
    if (provisioning.initialAdminStatus !== "complete") {
      assertInitialAdministratorPasswordForProvisioning(context.initialAdministrator);
      const admin = await provisionInitialWorkspaceAdministrator({
        workspaceId: context.workspaceId,
        workspaceSlug: context.workspaceSlug,
        companyName: context.companyName,
        administrator: context.initialAdministrator,
      });
      const supabase = createTenancyServerClient();
      await supabase
        .from("workspace_admin_metadata")
        .update({
          provisioning_initial_admin_status: "complete",
          updated_at: nowIso(),
        })
        .eq("workspace_id", context.workspaceId);
      provisioning = {
        ...provisioning,
        initialAdminStatus: admin.status === "skipped" ? "skipped" : "complete",
        lastMessage: admin.message,
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    // 7–9. Employee/user imports (excluding initial administrator)
    if (provisioning.authenticationStatus !== "complete" && provisioning.authenticationStatus !== "skipped") {
      const auth = await provisionWorkspaceUsers({
        workspaceId: context.workspaceId,
        workspaceSlug: context.workspaceSlug,
        companyName: context.companyName,
        contactName: context.contactName,
        contactEmail: context.contactEmail,
        employees: context.employees,
        excludeEmails: [adminEmail],
      });
      provisioning = {
        ...provisioning,
        authenticationStatus: auth.status === "skipped" ? "skipped" : "complete",
        lastMessage: auth.message,
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    // 10. Client imports
    const clients = await provisionWorkspaceClients({
      workspaceId: context.workspaceId,
      workspaceSlug: context.workspaceSlug,
      customerHostname,
      clients: context.clients,
    });
    if (clients.message) {
      provisioning = {
        ...provisioning,
        lastMessage: `${provisioning.lastMessage ?? ""} ${clients.message}`.trim(),
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    // 11. Activate workspace
    await markWorkspaceActive(context.workspaceId, context.workspaceType);

    // 12–14. Verification gates before reporting complete
    const resolvedWorkspace = await findWorkspaceBySlug(customerHostname);
    if (!resolvedWorkspace || resolvedWorkspace.slug !== context.workspaceSlug) {
      throw new Error(
        `Customer hostname ${customerHostname}.unit311central.com does not resolve to workspace ${context.workspaceSlug}.`,
      );
    }

    const loginReady = await verifyWorkspaceLoginPageReady(context.workspaceId);
    if (!loginReady) {
      throw new Error("Customer login page configuration is not ready.");
    }

    const adminReady = await verifyInitialAdministratorReady(context.workspaceId, adminEmail);
    if (!adminReady) {
      throw new Error("Initial workspace administrator is not login-ready.");
    }

    if (provisioning.deploymentStatus !== "complete") {
      provisioning = {
        ...provisioning,
        deploymentStatus: "complete",
        lastMessage:
          `${provisioning.lastMessage ?? ""} Shared application deployment is live.`.trim(),
      };
      await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    }

    const primaryUrl = workspacePrimaryUrlForWorkspace(
      context.workspaceSlug,
      customerHostname,
    );

    provisioning = {
      ...provisioning,
      overallStatus: "complete",
      lastMessage: `Workspace ready at ${primaryUrl}. Administrator: ${adminEmail}.`,
    };
    await persistProvisioningState(context.workspaceId, provisioning, customerHostname);

    return {
      overallStatus: "complete",
      provisioning,
      primaryUrl,
      initialAdministratorEmail: adminEmail,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Workspace provisioning failed.";
    provisioning = {
      ...provisioning,
      overallStatus: "failed",
      lastMessage: message,
    };
    await persistProvisioningState(context.workspaceId, provisioning, customerHostname);
    throw error;
  }
}

export function isWorkspaceProvisioningComplete(
  provisioning: WorkspaceProvisioningState,
): boolean {
  return provisioning.overallStatus === "complete" && isProvisioningComplete(provisioning);
}
