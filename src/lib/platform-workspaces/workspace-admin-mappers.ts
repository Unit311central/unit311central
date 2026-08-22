import { countEnabledModules } from "@/lib/platform-workspaces/module-catalogue";
import {
  resolveCustomerHostname,
  workspacePrimaryUrlForWorkspace,
} from "@/lib/platform-workspaces/workspace-hostname";
import type {
  WorkspaceAdminRecord,
  WorkspaceAdminStatus,
  WorkspaceImportClient,
  WorkspaceImportEmployee,
  WorkspaceProvisioningState,
  WorkspaceType,
} from "@/lib/platform-workspaces/types";

export function nowIso(): string {
  return new Date().toISOString();
}

export function workspacePrimaryUrl(slug: string, customerHostname?: string | null): string {
  return workspacePrimaryUrlForWorkspace(slug, customerHostname);
}

export function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

export function mapWorkspaceType(value: string | null | undefined): WorkspaceType {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "demo") return "Demo";
  if (normalized === "internal") return "Internal";
  return "Customer";
}

export function mapStatus(value: string | null | undefined): WorkspaceAdminStatus {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "archived") return "Archived";
  if (normalized === "onboarding") return "Onboarding";
  if (normalized === "pending payment" || normalized === "pending") return "Pending Payment";
  return "Preparing";
}

type WorkspaceSettingsRow = {
  timezone?: string | null;
  currency?: string | null;
  logo_url?: string | null;
  primary_colour?: string | null;
  secondary_colour?: string | null;
} | null;

export type WorkspaceAdminMetadataRow = {
  company_name?: string | null;
  contact_name?: string | null;
  contact_email?: string | null;
  country?: string | null;
  description?: string | null;
  branding_display_name?: string | null;
  enabled_modules?: string[] | null;
  enabled_sub_modules?: string[] | null;
  pending_employees?: WorkspaceImportEmployee[] | null;
  pending_clients?: WorkspaceImportClient[] | null;
  created_by?: string | null;
  provisioning_database_status?: string | null;
  provisioning_authentication_status?: string | null;
  provisioning_infrastructure_status?: string | null;
  provisioning_deployment_status?: string | null;
  provisioning_workspace_record_status?: string | null;
  provisioning_overall_status?: string | null;
  provisioning_last_message?: string | null;
  customer_hostname?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type WorkspaceRow = {
  id: string;
  name: string;
  slug: string;
  workspace_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  workspace_settings?: WorkspaceSettingsRow | WorkspaceSettingsRow[];
  workspace_admin_metadata?: WorkspaceAdminMetadataRow | WorkspaceAdminMetadataRow[] | null;
};

function firstRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function asProvisioningStatus(
  value: string | null | undefined,
): WorkspaceProvisioningState["databaseStatus"] {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "complete") return "complete";
  if (normalized === "skipped") return "skipped";
  if (normalized === "failed") return "failed";
  return "not_started";
}

function asOverallStatus(
  value: string | null | undefined,
): WorkspaceProvisioningState["overallStatus"] {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "in_progress") return "in_progress";
  if (normalized === "complete") return "complete";
  if (normalized === "failed") return "failed";
  return "not_started";
}

function asWorkspaceRecordStatus(
  value: string | null | undefined,
): WorkspaceProvisioningState["workspaceRecordStatus"] {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pending") return "pending";
  if (normalized === "complete") return "complete";
  if (normalized === "failed") return "failed";
  return "not_started";
}

export function mapProvisioningState(metadata: WorkspaceAdminMetadataRow | null): WorkspaceProvisioningState {
  if (!metadata) {
    return {
      databaseStatus: "complete",
      authenticationStatus: "not_started",
      infrastructureStatus: "not_started",
      deploymentStatus: "not_started",
      workspaceRecordStatus: "complete",
      overallStatus: "not_started",
      lastMessage: "Workspace registry record loaded from database.",
    };
  }

  return {
    databaseStatus: asProvisioningStatus(metadata.provisioning_database_status),
    authenticationStatus: asProvisioningStatus(metadata.provisioning_authentication_status),
    infrastructureStatus: asProvisioningStatus(metadata.provisioning_infrastructure_status),
    deploymentStatus: asProvisioningStatus(metadata.provisioning_deployment_status),
    workspaceRecordStatus: asWorkspaceRecordStatus(metadata.provisioning_workspace_record_status),
    overallStatus: asOverallStatus(metadata.provisioning_overall_status),
    lastMessage: metadata.provisioning_last_message ?? undefined,
  };
}

export function mapWorkspaceRowToRecord(
  row: WorkspaceRow,
  counts: { userCount: number; enabledModuleCount: number },
): WorkspaceAdminRecord {
  const settings = firstRelation(row.workspace_settings);
  const metadata = firstRelation(row.workspace_admin_metadata);
  const enabledModules = [...(metadata?.enabled_modules ?? [])];
  const enabledSubModules = [...(metadata?.enabled_sub_modules ?? [])];
  const customerHostname = resolveCustomerHostname(
    row.slug,
    metadata?.customer_hostname,
    row.name,
  );

  return {
    workspaceId: row.id,
    name: row.name,
    slug: row.slug,
    type: mapWorkspaceType(row.workspace_type),
    status: mapStatus(row.status),
    companyName: metadata?.company_name?.trim() || row.name,
    contact: {
      name: metadata?.contact_name?.trim() ?? "",
      email: metadata?.contact_email?.trim().toLowerCase() ?? "",
    },
    country: metadata?.country?.trim() ?? "",
    timezone: settings?.timezone?.trim() || "Europe/London",
    currency: settings?.currency?.trim() || "GBP",
    description: metadata?.description?.trim() ?? "",
    enabledModules,
    enabledSubModules,
    branding: {
      displayName: metadata?.branding_display_name?.trim() || row.name,
      logoUrl: settings?.logo_url ?? null,
      primaryColour: settings?.primary_colour?.trim() || "#0b2d63",
      secondaryColour: settings?.secondary_colour?.trim() || "#2563eb",
    },
    pendingEmployees: [...(metadata?.pending_employees ?? [])],
    pendingClients: [...(metadata?.pending_clients ?? [])],
    userCount: counts.userCount,
    enabledModuleCount:
      enabledModules.length > 0 || enabledSubModules.length > 0
        ? countEnabledModules(enabledModules, enabledSubModules)
        : counts.enabledModuleCount,
    primaryUrl: workspacePrimaryUrl(row.slug, customerHostname),
    customerHostname,
    createdAt: metadata?.created_at ?? row.created_at,
    createdBy: metadata?.created_by?.trim() || "system",
    updatedAt: metadata?.updated_at ?? row.updated_at,
    provisioning: mapProvisioningState(metadata),
  };
}
