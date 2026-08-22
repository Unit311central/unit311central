import { RESERVED_UNIT311_SUBDOMAINS, UNIT311_SITE_HOST } from "@/lib/app-domains";
import {
  countEnabledModules,
  resolveProvisioningModuleKeys,
} from "@/lib/platform-workspaces/module-catalogue";
import {
  createWorkspaceId,
  findAdminRecordById,
  findAdminRecordBySlug,
  readAdminRecords,
  upsertAdminRecord,
} from "@/lib/platform-workspaces/workspace-admin-store";
import { queueWorkspaceUserProvisioning } from "@/lib/platform-workspaces/user-provisioning-adapter";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceAdminStatus,
  WorkspaceListFilters,
  WorkspaceProvisioningState,
  WorkspaceType,
} from "@/lib/platform-workspaces/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { provisionCustomerWorkspace } from "@/lib/workspace-provisioning-service";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

function nowIso(): string {
  return new Date().toISOString();
}

function workspacePrimaryUrl(slug: string): string {
  return `https://${slug.trim().toLowerCase()}.${UNIT311_SITE_HOST}`;
}

function normalizeSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
}

function mapWorkspaceType(value: string | null | undefined): WorkspaceType {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "demo") return "Demo";
  if (normalized === "internal") return "Internal";
  return "Customer";
}

function mapStatus(value: string | null | undefined): WorkspaceAdminStatus {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "archived") return "Archived";
  if (normalized === "onboarding") return "Onboarding";
  if (normalized === "pending payment" || normalized === "pending") return "Pending Payment";
  return "Preparing";
}

function seedRecords(): WorkspaceAdminRecord[] {
  const createdAt = "2026-01-15T10:00:00.000Z";
  return [
    {
      workspaceId: "seed-unit311-internal",
      name: "Unit311 Central",
      slug: INTERNAL_WORKSPACE_SLUG,
      type: "Internal",
      status: "Active",
      companyName: "Unit311 Central Ltd",
      contact: { name: "Platform Operations", email: "ops@unit311central.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "GBP",
      description: "Internal Central operations workspace.",
      enabledModules: ["home", "executive-assistant", "business-central", "financials", "settings"],
      enabledSubModules: [],
      branding: {
        displayName: "Unit311 Central",
        logoUrl: null,
        primaryColour: "#0b2d63",
        secondaryColour: "#2563eb",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 24,
      enabledModuleCount: 5,
      primaryUrl: workspacePrimaryUrl(INTERNAL_WORKSPACE_SLUG),
      createdAt,
      createdBy: "system",
      updatedAt: createdAt,
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        lastMessage: "Live internal workspace.",
      },
    },
    {
      workspaceId: "seed-demo-workspace",
      name: "Unit311 Central Demo",
      slug: "demo",
      type: "Demo",
      status: "Active",
      companyName: "Northstar Demo Corp",
      contact: { name: "Demo Owner", email: "demo@unit311central.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "USD",
      description: "Permanent demo workspace for sales and training.",
      enabledModules: ["home", "executive-assistant", "business-central", "financials", "board"],
      enabledSubModules: [],
      branding: {
        displayName: "Northstar Demo",
        logoUrl: null,
        primaryColour: "#0F766E",
        secondaryColour: "#14B8A6",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 12,
      enabledModuleCount: 5,
      primaryUrl: workspacePrimaryUrl("demo"),
      createdAt: "2026-02-01T09:30:00.000Z",
      createdBy: "system",
      updatedAt: "2026-02-01T09:30:00.000Z",
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "complete",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        lastMessage: "Demo workspace is live.",
      },
    },
    {
      workspaceId: "seed-onwardair-customer",
      name: "OnwardAir",
      slug: "onwardair",
      type: "Customer",
      status: "Active",
      companyName: "OnwardAir Ltd",
      contact: { name: "Operations Lead", email: "ops@onwardair.example.com" },
      country: "United Kingdom",
      timezone: "Europe/London",
      currency: "GBP",
      description: "Customer workspace for OnwardAir programme delivery.",
      enabledModules: [
        "home",
        "executive-assistant",
        "business-central",
        "engineering",
        "fundraising",
        "board",
      ],
      enabledSubModules: [],
      branding: {
        displayName: "OnwardAir",
        logoUrl: null,
        primaryColour: "#0369A1",
        secondaryColour: "#38BDF8",
      },
      pendingEmployees: [],
      pendingClients: [],
      userCount: 18,
      enabledModuleCount: 6,
      primaryUrl: workspacePrimaryUrl("onwardair"),
      createdAt: "2026-03-10T14:20:00.000Z",
      createdBy: "admin",
      updatedAt: "2026-03-10T14:20:00.000Z",
      provisioning: {
        databaseStatus: "complete",
        authenticationStatus: "complete",
        infrastructureStatus: "pending",
        deploymentStatus: "complete",
        workspaceRecordStatus: "complete",
        lastMessage: "Application live; infrastructure automation pending Phase 3.",
      },
    },
  ];
}

async function ensureSeededRecords(): Promise<WorkspaceAdminRecord[]> {
  const existing = await readAdminRecords();
  if (existing.length > 0) return existing;
  const seeds = seedRecords();
  for (const record of seeds) {
    await upsertAdminRecord(record);
  }
  return seeds;
}

async function loadSupabaseWorkspaces(): Promise<
  Array<{
    id: string;
    name: string;
    slug: string;
    workspace_type: string;
    status: string;
    created_at: string;
    updated_at: string;
  }>
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, name, slug, workspace_type, status, created_at, updated_at")
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ""),
    slug: String(row.slug ?? ""),
    workspace_type: String(row.workspace_type ?? ""),
    status: String(row.status ?? ""),
    created_at: String(row.created_at ?? nowIso()),
    updated_at: String(row.updated_at ?? nowIso()),
  }));
}

async function countWorkspaceUsers(workspaceId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createTenancyServerClient();
  const { count, error } = await supabase
    .from("workspace_users")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error || count == null) return 0;
  return count;
}

async function countEnabledWorkspaceModules(workspaceId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 0;
  const supabase = createTenancyServerClient();
  const { count, error } = await supabase
    .from("workspace_modules")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("enabled", true);
  if (error || count == null) return 0;
  return count;
}

async function mergeWithRegistry(): Promise<WorkspaceAdminRecord[]> {
  const seeded = await ensureSeededRecords();
  const byId = new Map(seeded.map((record) => [record.workspaceId, record]));
  const bySlug = new Map(seeded.map((record) => [record.slug, record]));

  const registry = await loadSupabaseWorkspaces();
  for (const row of registry) {
    const existing = byId.get(row.id) ?? bySlug.get(row.slug);
    const userCount = await countWorkspaceUsers(row.id);
    const moduleCount = await countEnabledWorkspaceModules(row.id);
    const merged: WorkspaceAdminRecord = existing
      ? {
          ...existing,
          workspaceId: row.id,
          name: row.name || existing.name,
          slug: row.slug,
          type: mapWorkspaceType(row.workspace_type),
          status: mapStatus(row.status),
          userCount: userCount || existing.userCount,
          enabledModuleCount: moduleCount || existing.enabledModuleCount,
          primaryUrl: workspacePrimaryUrl(row.slug),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        }
      : {
          workspaceId: row.id,
          name: row.name,
          slug: row.slug,
          type: mapWorkspaceType(row.workspace_type),
          status: mapStatus(row.status),
          companyName: row.name,
          contact: { name: "", email: "" },
          country: "",
          timezone: "Europe/London",
          currency: "GBP",
          description: "",
          enabledModules: [],
          enabledSubModules: [],
          branding: {
            displayName: row.name,
            logoUrl: null,
            primaryColour: "#0b2d63",
            secondaryColour: "#2563eb",
          },
          pendingEmployees: [],
          pendingClients: [],
          userCount,
          enabledModuleCount: moduleCount,
          primaryUrl: workspacePrimaryUrl(row.slug),
          createdAt: row.created_at,
          createdBy: "system",
          updatedAt: row.updated_at,
          provisioning: {
            databaseStatus: "complete",
            authenticationStatus: "not_started",
            infrastructureStatus: "not_started",
            deploymentStatus: "not_started",
            workspaceRecordStatus: "complete",
            lastMessage: "Workspace registry record loaded from database.",
          },
        };
    byId.set(merged.workspaceId, merged);
    bySlug.set(merged.slug, merged);
    await upsertAdminRecord(merged);
  }

  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export async function listWorkspaceAdminRecords(
  filters: WorkspaceListFilters = {},
): Promise<WorkspaceAdminRecord[]> {
  const records = await mergeWithRegistry();
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

export async function getWorkspaceAdminRecord(
  workspaceId: string,
): Promise<WorkspaceAdminRecord | null> {
  await mergeWithRegistry();
  return findAdminRecordById(workspaceId);
}

export async function isWorkspaceSlugAvailable(slug: string): Promise<boolean> {
  const normalized = normalizeSlug(slug);
  if (!normalized) return false;
  if (RESERVED_UNIT311_SUBDOMAINS.has(normalized)) return false;
  if (await findAdminRecordBySlug(normalized)) return false;
  if (isSupabaseConfigured()) {
    const supabase = createTenancyServerClient();
    const { data } = await supabase
      .from("workspaces")
      .select("id")
      .eq("slug", normalized)
      .maybeSingle();
    if (data) return false;
  }
  return true;
}

async function syncWorkspaceModules(workspaceId: string, moduleKeys: string[]): Promise<void> {
  if (!isSupabaseConfigured() || moduleKeys.length === 0) return;
  const supabase = createTenancyServerClient();
  const uniqueKeys = [...new Set(moduleKeys)];
  for (const moduleKey of uniqueKeys) {
    await supabase.from("workspace_modules").upsert(
      {
        workspace_id: workspaceId,
        module_key: moduleKey,
        enabled: true,
        updated_at: nowIso(),
      },
      { onConflict: "workspace_id,module_key" },
    );
  }
}

async function syncWorkspaceSettings(
  workspaceId: string,
  input: CreateWorkspaceInput,
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createTenancyServerClient();
  await supabase.from("workspace_settings").upsert(
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
}

export async function createWorkspaceAdminRecord(
  input: CreateWorkspaceInput,
  createdBy: string,
): Promise<WorkspaceAdminRecord> {
  const slug = normalizeSlug(input.slug);
  if (!slug) throw new Error("Workspace slug is required.");
  if (!(await isWorkspaceSlugAvailable(slug))) {
    throw new Error(`Workspace slug "${slug}" is already in use.`);
  }
  if (!input.name.trim()) throw new Error("Workspace name is required.");
  if (!input.companyName.trim()) throw new Error("Company name is required.");
  if (!input.contactEmail.trim()) throw new Error("Primary contact email is required.");

  const moduleKeys = resolveProvisioningModuleKeys(input.enabledModules, input.enabledSubModules);
  const provisioning: WorkspaceProvisioningState = {
    databaseStatus: "not_started",
    authenticationStatus: "not_started",
    infrastructureStatus: "not_started",
    deploymentStatus: "not_started",
    workspaceRecordStatus: "pending",
    lastMessage: "Creating workspace record.",
  };

  let workspaceId = createWorkspaceId();
  let status: WorkspaceAdminStatus = input.type === "Demo" ? "Active" : "Pending Payment";

  if (isSupabaseConfigured()) {
    try {
      const provisioned = await provisionCustomerWorkspace({
        companyName: input.companyName.trim(),
        workspaceSlug: slug,
      });
      workspaceId = provisioned.workspaceId;
      provisioning.workspaceRecordStatus = "complete";
      provisioning.databaseStatus = "complete";

      const supabase = createTenancyServerClient();
      await supabase
        .from("workspaces")
        .update({
          name: input.name.trim(),
          workspace_type: input.type,
          status,
          updated_at: nowIso(),
        })
        .eq("id", workspaceId);

      await syncWorkspaceSettings(workspaceId, input);
      await syncWorkspaceModules(workspaceId, moduleKeys);
      provisioning.lastMessage =
        "Workspace database foundation provisioned via provision_workspace().";
    } catch (error) {
      provisioning.workspaceRecordStatus = "failed";
      provisioning.lastMessage =
        error instanceof Error ? error.message : "Workspace database provisioning failed.";
      throw error;
    }
  } else {
    provisioning.workspaceRecordStatus = "complete";
    provisioning.databaseStatus = "skipped";
    provisioning.lastMessage = "Supabase not configured — workspace stored in admin repository.";
  }

  const userProvisioning = await queueWorkspaceUserProvisioning({
    workspaceId,
    workspaceSlug: slug,
    employees: input.employees,
  });
  if (userProvisioning.status === "queued") {
    provisioning.authenticationStatus = "pending";
    provisioning.lastMessage = `${provisioning.lastMessage} ${userProvisioning.message}`;
  }

  const timestamp = nowIso();
  const record: WorkspaceAdminRecord = {
    workspaceId,
    name: input.name.trim(),
    slug,
    type: input.type,
    status,
    companyName: input.companyName.trim(),
    contact: {
      name: input.contactName.trim(),
      email: input.contactEmail.trim().toLowerCase(),
    },
    country: input.country.trim(),
    timezone: input.timezone,
    currency: input.currency,
    description: input.description.trim(),
    enabledModules: [...input.enabledModules],
    enabledSubModules: [...input.enabledSubModules],
    branding: { ...input.branding },
    pendingEmployees: [...input.employees],
    pendingClients: [...input.clients],
    userCount: input.employees.length,
    enabledModuleCount: countEnabledModules(input.enabledModules, input.enabledSubModules),
    primaryUrl: workspacePrimaryUrl(slug),
    createdAt: timestamp,
    createdBy,
    updatedAt: timestamp,
    provisioning,
  };

  await upsertAdminRecord(record);
  return record;
}

export async function updateWorkspaceAdminRecord(
  workspaceId: string,
  patch: UpdateWorkspaceInput,
): Promise<WorkspaceAdminRecord> {
  await mergeWithRegistry();
  const existing = await findAdminRecordById(workspaceId);
  if (!existing) throw new Error("Workspace not found.");

  const next: WorkspaceAdminRecord = {
    ...existing,
    ...patch,
    contact: patch.contact ? { ...existing.contact, ...patch.contact } : existing.contact,
    branding: patch.branding ? { ...existing.branding, ...patch.branding } : existing.branding,
    enabledModules: patch.enabledModules ? [...patch.enabledModules] : existing.enabledModules,
    enabledSubModules: patch.enabledSubModules
      ? [...patch.enabledSubModules]
      : existing.enabledSubModules,
    pendingEmployees: patch.pendingEmployees
      ? [...patch.pendingEmployees]
      : existing.pendingEmployees,
    pendingClients: patch.pendingClients ? [...patch.pendingClients] : existing.pendingClients,
    updatedAt: nowIso(),
    enabledModuleCount: countEnabledModules(
      patch.enabledModules ?? existing.enabledModules,
      patch.enabledSubModules ?? existing.enabledSubModules,
    ),
  };

  if (isSupabaseConfigured()) {
    const supabase = createTenancyServerClient();
    if (patch.name || patch.status) {
      await supabase
        .from("workspaces")
        .update({
          ...(patch.name ? { name: patch.name } : {}),
          ...(patch.status ? { status: patch.status } : {}),
          updated_at: next.updatedAt,
        })
        .eq("id", workspaceId);
    }
    if (patch.timezone || patch.currency || patch.branding) {
      await supabase.from("workspace_settings").upsert(
        {
          workspace_id: workspaceId,
          timezone: next.timezone,
          currency: next.currency,
          logo_url: next.branding.logoUrl,
          primary_colour: next.branding.primaryColour,
          secondary_colour: next.branding.secondaryColour,
          updated_at: next.updatedAt,
        },
        { onConflict: "workspace_id" },
      );
    }
    if (patch.enabledModules || patch.enabledSubModules) {
      const moduleKeys = resolveProvisioningModuleKeys(
        next.enabledModules,
        next.enabledSubModules,
      );
      await syncWorkspaceModules(workspaceId, moduleKeys);
    }
  }

  await upsertAdminRecord(next);
  return next;
}

export async function archiveWorkspaceAdminRecord(
  workspaceId: string,
): Promise<WorkspaceAdminRecord> {
  return updateWorkspaceAdminRecord(workspaceId, { status: "Archived" });
}

export { normalizeSlug };
