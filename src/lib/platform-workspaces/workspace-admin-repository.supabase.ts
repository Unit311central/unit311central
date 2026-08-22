import { RESERVED_UNIT311_SUBDOMAINS } from "@/lib/app-domains";
import {
  countEnabledModules,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  mapWorkspaceRowToRecord,
  normalizeSlug,
  nowIso,
  type WorkspaceAdminMetadataRow,
} from "@/lib/platform-workspaces/workspace-admin-mappers";
import type { WorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository";
import {
  resolveCustomerHostname,
  isValidCustomerHostname,
} from "@/lib/platform-workspaces/workspace-hostname";
import { isCustomerHostnameAvailable } from "@/lib/platform-workspaces/workspace-host-alias-service";
import { runWorkspaceProvisioning } from "@/lib/platform-workspaces/workspace-provisioning-orchestrator";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceAdminStatus,
  WorkspaceListFilters,
  WorkspaceProvisioningState,
} from "@/lib/platform-workspaces/types";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { provisionCustomerWorkspace } from "@/lib/workspace-provisioning-service";

const WORKSPACE_SELECT = `
  id,
  name,
  slug,
  workspace_type,
  status,
  created_at,
  updated_at,
  workspace_settings (
    timezone,
    currency,
    logo_url,
    primary_colour,
    secondary_colour
  ),
  workspace_admin_metadata (
    company_name,
    contact_name,
    contact_email,
    country,
    description,
    branding_display_name,
    enabled_modules,
    enabled_sub_modules,
    pending_employees,
    pending_clients,
    created_by,
    provisioning_database_status,
    provisioning_authentication_status,
    provisioning_infrastructure_status,
    provisioning_deployment_status,
    provisioning_workspace_record_status,
    provisioning_overall_status,
    provisioning_last_message,
    customer_hostname,
    created_at,
    updated_at
  )
`;

function applyListFilters(
  records: WorkspaceAdminRecord[],
  filters: WorkspaceListFilters = {},
): WorkspaceAdminRecord[] {
  const query = (filters.query ?? "").trim().toLowerCase();
  return records.filter((record) => {
    if (filters.type && filters.type !== "all" && record.type !== filters.type) return false;
    if (filters.status && filters.status !== "all" && record.status !== filters.status) return false;
    if (!query) return true;
    return (
      record.name.toLowerCase().includes(query) ||
      record.slug.toLowerCase().includes(query) ||
      record.companyName.toLowerCase().includes(query) ||
      record.contact.email.toLowerCase().includes(query)
    );
  });
}

async function countWorkspaceUsers(workspaceId: string): Promise<number> {
  const supabase = createTenancyServerClient();
  const { count, error } = await supabase
    .from("workspace_users")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error || count == null) return 0;
  return count;
}

async function countEnabledWorkspaceModules(workspaceId: string): Promise<number> {
  const supabase = createTenancyServerClient();
  const { count, error } = await supabase
    .from("workspace_modules")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);
  if (error || count == null) return 0;
  return count;
}

async function syncWorkspaceModules(workspaceId: string, moduleKeys: string[]): Promise<void> {
  if (moduleKeys.length === 0) return;
  const supabase = createTenancyServerClient();
  const uniqueKeys = [...new Set(moduleKeys)];
  for (const moduleKey of uniqueKeys) {
    const { error } = await supabase.from("workspace_modules").upsert(
      {
        workspace_id: workspaceId,
        module_key: moduleKey,
        enabled: true,
        updated_at: nowIso(),
      },
      { onConflict: "workspace_id,module_key" },
    );
    if (error) {
      throw new Error(error.message || `Failed to sync module "${moduleKey}".`);
    }
  }
}

async function syncWorkspaceSettings(
  workspaceId: string,
  input: Pick<CreateWorkspaceInput, "timezone" | "currency" | "branding">,
): Promise<void> {
  const supabase = createTenancyServerClient();
  const { error } = await supabase.from("workspace_settings").upsert(
    {
      workspace_id: workspaceId,
      timezone: input.timezone,
      currency: input.currency,
      logo_url: input.branding.logoUrl,
      primary_colour: input.branding.primaryColour,
      secondary_colour: input.branding.secondaryColour,
      updated_at: nowIso(),
    },
    { onConflict: "workspace_id" },
  );
  if (error) {
    throw new Error(error.message || "Failed to sync workspace settings.");
  }
}

function metadataPayload(
  input: CreateWorkspaceInput,
  createdBy: string,
  provisioning: WorkspaceProvisioningState,
  customerHostname: string,
  timestamp: string,
): WorkspaceAdminMetadataRow & { workspace_id: string; updated_at: string } {
  return {
    workspace_id: "",
    company_name: input.companyName.trim(),
    contact_name: input.contactName.trim(),
    contact_email: input.contactEmail.trim().toLowerCase(),
    country: input.country.trim(),
    description: input.description.trim(),
    branding_display_name: input.branding.displayName.trim(),
    enabled_modules: [...input.enabledModules],
    enabled_sub_modules: [...input.enabledSubModules],
    pending_employees: [...input.employees],
    pending_clients: [...input.clients],
    created_by: createdBy,
    customer_hostname: customerHostname,
    provisioning_database_status: provisioning.databaseStatus,
    provisioning_authentication_status: provisioning.authenticationStatus,
    provisioning_infrastructure_status: provisioning.infrastructureStatus,
    provisioning_deployment_status: provisioning.deploymentStatus,
    provisioning_workspace_record_status: provisioning.workspaceRecordStatus,
    provisioning_overall_status: provisioning.overallStatus ?? "not_started",
    provisioning_last_message: provisioning.lastMessage ?? null,
    created_at: timestamp,
    updated_at: timestamp,
  };
}

export function createSupabaseWorkspaceAdminRepository(): WorkspaceAdminRepository {
  return {
    kind: "supabase",

    async list(filters = {}) {
      const supabase = createTenancyServerClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select(WORKSPACE_SELECT)
        .order("name", { ascending: true });
      if (error) {
        throw new Error(error.message || "Failed to list workspaces.");
      }

      const records: WorkspaceAdminRecord[] = [];
      for (const row of data ?? []) {
        const workspaceId = String(row.id);
        const [userCount, enabledModuleCount] = await Promise.all([
          countWorkspaceUsers(workspaceId),
          countEnabledWorkspaceModules(workspaceId),
        ]);
        records.push(
          mapWorkspaceRowToRecord(
            {
              id: workspaceId,
              name: String(row.name ?? ""),
              slug: String(row.slug ?? ""),
              workspace_type: String(row.workspace_type ?? ""),
              status: String(row.status ?? ""),
              created_at: String(row.created_at ?? nowIso()),
              updated_at: String(row.updated_at ?? nowIso()),
              workspace_settings: row.workspace_settings,
              workspace_admin_metadata: row.workspace_admin_metadata,
            },
            { userCount, enabledModuleCount },
          ),
        );
      }

      return applyListFilters(records, filters);
    },

    async getById(workspaceId) {
      const supabase = createTenancyServerClient();
      const { data, error } = await supabase
        .from("workspaces")
        .select(WORKSPACE_SELECT)
        .eq("id", workspaceId)
        .maybeSingle();
      if (error) {
        throw new Error(error.message || "Failed to load workspace.");
      }
      if (!data) return null;

      const [userCount, enabledModuleCount] = await Promise.all([
        countWorkspaceUsers(workspaceId),
        countEnabledWorkspaceModules(workspaceId),
      ]);

      return mapWorkspaceRowToRecord(
        {
          id: workspaceId,
          name: String(data.name ?? ""),
          slug: String(data.slug ?? ""),
          workspace_type: String(data.workspace_type ?? ""),
          status: String(data.status ?? ""),
          created_at: String(data.created_at ?? nowIso()),
          updated_at: String(data.updated_at ?? nowIso()),
          workspace_settings: data.workspace_settings,
          workspace_admin_metadata: data.workspace_admin_metadata,
        },
        { userCount, enabledModuleCount },
      );
    },

    async isSlugAvailable(slug) {
      const normalized = normalizeSlug(slug);
      if (!normalized) return false;
      if (RESERVED_UNIT311_SUBDOMAINS.has(normalized)) return false;

      const supabase = createTenancyServerClient();
      const { data } = await supabase
        .from("workspaces")
        .select("id")
        .eq("slug", normalized)
        .maybeSingle();
      return !data;
    },

    async create(input, createdBy) {
      const slug = normalizeSlug(input.slug);
      if (!slug) throw new Error("Workspace slug is required.");
      if (!(await this.isSlugAvailable(slug))) {
        throw new Error(`Workspace slug "${slug}" is already in use.`);
      }
      if (!input.name.trim()) throw new Error("Workspace name is required.");
      if (!input.companyName.trim()) throw new Error("Company name is required.");
      if (!input.contactEmail.trim()) throw new Error("Primary contact email is required.");

      const customerHostname = resolveCustomerHostname(slug, input.customerHostname);
      if (!isValidCustomerHostname(customerHostname)) {
        throw new Error(`Customer hostname "${customerHostname}" is not valid or is reserved.`);
      }
      if (!(await isCustomerHostnameAvailable(customerHostname))) {
        throw new Error(`Customer hostname "${customerHostname}" is already in use.`);
      }

      const moduleKeys = resolveProvisioningModuleKeys(input.enabledModules, input.enabledSubModules);
      const provisioning: WorkspaceProvisioningState = {
        databaseStatus: "not_started",
        authenticationStatus: "not_started",
        infrastructureStatus: "not_started",
        deploymentStatus: "not_started",
        workspaceRecordStatus: "pending",
        overallStatus: "not_started",
        lastMessage: "Creating workspace record.",
      };

      const status: WorkspaceAdminStatus = input.type === "Demo" ? "Active" : "Pending Payment";
      let workspaceId: string;

      try {
        const provisioned = await provisionCustomerWorkspace({
          companyName: input.companyName.trim(),
          workspaceSlug: slug,
        });
        workspaceId = provisioned.workspaceId;
        provisioning.workspaceRecordStatus = "complete";
        provisioning.databaseStatus = "complete";

        const supabase = createTenancyServerClient();
        const { error: workspaceError } = await supabase
          .from("workspaces")
          .update({
            name: input.name.trim(),
            workspace_type: input.type,
            status,
            updated_at: nowIso(),
          })
          .eq("id", workspaceId);
        if (workspaceError) {
          throw new Error(workspaceError.message || "Failed to update workspace identity.");
        }

        await syncWorkspaceSettings(workspaceId, input);
        await syncWorkspaceModules(workspaceId, moduleKeys);
        provisioning.lastMessage =
          "Workspace database foundation provisioned via provision_workspace().";
      } catch (error) {
        provisioning.workspaceRecordStatus = "failed";
        provisioning.overallStatus = "failed";
        provisioning.lastMessage =
          error instanceof Error ? error.message : "Workspace database provisioning failed.";
        throw error;
      }

      const timestamp = nowIso();
      const metadata = metadataPayload(input, createdBy, provisioning, customerHostname, timestamp);
      metadata.workspace_id = workspaceId;

      const supabase = createTenancyServerClient();
      const { error: metadataError } = await supabase.from("workspace_admin_metadata").upsert(
        metadata,
        { onConflict: "workspace_id" },
      );
      if (metadataError) {
        throw new Error(metadataError.message || "Failed to persist workspace admin metadata.");
      }

      await runWorkspaceProvisioning({
        workspaceId,
        workspaceSlug: slug,
        workspaceType: input.type,
        companyName: input.companyName.trim(),
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail.trim().toLowerCase(),
        customerHostname,
        employees: input.employees,
        clients: input.clients,
      });

      const record = await this.getById(workspaceId);
      if (!record) {
        throw new Error("Workspace was created but could not be loaded.");
      }
      return record;
    },

    async provision(workspaceId) {
      const existing = await this.getById(workspaceId);
      if (!existing) throw new Error("Workspace not found.");

      await runWorkspaceProvisioning({
        workspaceId: existing.workspaceId,
        workspaceSlug: existing.slug,
        workspaceType: existing.type,
        companyName: existing.companyName,
        contactName: existing.contact.name,
        contactEmail: existing.contact.email,
        customerHostname: existing.customerHostname,
        employees: existing.pendingEmployees,
        clients: existing.pendingClients,
      });

      const record = await this.getById(workspaceId);
      if (!record) {
        throw new Error("Workspace was provisioned but could not be loaded.");
      }
      return record;
    },

    async update(workspaceId, patch) {
      const existing = await this.getById(workspaceId);
      if (!existing) throw new Error("Workspace not found.");

      const updatedAt = nowIso();
      const supabase = createTenancyServerClient();

      if (patch.name || patch.status) {
        const { error } = await supabase
          .from("workspaces")
          .update({
            ...(patch.name ? { name: patch.name } : {}),
            ...(patch.status ? { status: patch.status } : {}),
            updated_at: updatedAt,
          })
          .eq("id", workspaceId);
        if (error) {
          throw new Error(error.message || "Failed to update workspace identity.");
        }
      }

      const nextTimezone = patch.timezone ?? existing.timezone;
      const nextCurrency = patch.currency ?? existing.currency;
      const nextBranding = patch.branding ? { ...existing.branding, ...patch.branding } : existing.branding;

      if (patch.timezone || patch.currency || patch.branding) {
        const { error } = await supabase.from("workspace_settings").upsert(
          {
            workspace_id: workspaceId,
            timezone: nextTimezone,
            currency: nextCurrency,
            logo_url: nextBranding.logoUrl,
            primary_colour: nextBranding.primaryColour,
            secondary_colour: nextBranding.secondaryColour,
            updated_at: updatedAt,
          },
          { onConflict: "workspace_id" },
        );
        if (error) {
          throw new Error(error.message || "Failed to update workspace settings.");
        }
      }

      const nextEnabledModules = patch.enabledModules ?? existing.enabledModules;
      const nextEnabledSubModules = patch.enabledSubModules ?? existing.enabledSubModules;
      if (patch.enabledModules || patch.enabledSubModules) {
        const moduleKeys = resolveProvisioningModuleKeys(nextEnabledModules, nextEnabledSubModules);
        await syncWorkspaceModules(workspaceId, moduleKeys);
      }

      const metadataPatch: Record<string, unknown> = { updated_at: updatedAt };
      if (patch.companyName !== undefined) metadataPatch.company_name = patch.companyName;
      if (patch.contact) {
        if (patch.contact.name !== undefined) metadataPatch.contact_name = patch.contact.name;
        if (patch.contact.email !== undefined) {
          metadataPatch.contact_email = patch.contact.email.trim().toLowerCase();
        }
      }
      if (patch.country !== undefined) metadataPatch.country = patch.country;
      if (patch.description !== undefined) metadataPatch.description = patch.description;
      if (patch.branding?.displayName !== undefined) {
        metadataPatch.branding_display_name = patch.branding.displayName;
      }
      if (patch.enabledModules) metadataPatch.enabled_modules = [...patch.enabledModules];
      if (patch.enabledSubModules) metadataPatch.enabled_sub_modules = [...patch.enabledSubModules];
      if (patch.pendingEmployees) metadataPatch.pending_employees = [...patch.pendingEmployees];
      if (patch.pendingClients) metadataPatch.pending_clients = [...patch.pendingClients];

      if (Object.keys(metadataPatch).length > 1) {
        const { error } = await supabase
          .from("workspace_admin_metadata")
          .upsert(
            {
              workspace_id: workspaceId,
              company_name: patch.companyName ?? existing.companyName,
              contact_name: patch.contact?.name ?? existing.contact.name,
              contact_email: patch.contact?.email ?? existing.contact.email,
              country: patch.country ?? existing.country,
              description: patch.description ?? existing.description,
              branding_display_name: nextBranding.displayName,
              enabled_modules: nextEnabledModules,
              enabled_sub_modules: nextEnabledSubModules,
              pending_employees: patch.pendingEmployees ?? existing.pendingEmployees,
              pending_clients: patch.pendingClients ?? existing.pendingClients,
              created_by: existing.createdBy,
              updated_at: updatedAt,
            },
            { onConflict: "workspace_id" },
          );
        if (error) {
          throw new Error(error.message || "Failed to update workspace admin metadata.");
        }
      }

      const record = await this.getById(workspaceId);
      if (!record) {
        throw new Error("Workspace was updated but could not be loaded.");
      }
      return record;
    },

    async archive(workspaceId) {
      return this.update(workspaceId, { status: "Archived" });
    },
  };
}
