import "server-only";

import {
  applyMetadataEnabledModuleHints,
  applyWolfCentralSharkSidebarRows,
  buildSidebarConfigSnapshot,
  defaultWorkspaceSidebarModuleRows,
  deriveSidebarRowsFromLegacyEnabledModules,
  mergeCatalogueWithPersistedRows,
  resolveProvisioningKeysFromSidebarRows,
  type WorkspaceSidebarModuleRecord,
} from "@/lib/platform-workspaces/workspace-sidebar-config";
import { DEMO_SLUG } from "@/lib/platform-workspaces/demo-provisioning";
import { defaultEnabledSubModules } from "@/lib/platform-workspaces/module-catalogue";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

type SidebarModuleRow = {
  module_id: string;
  enabled: boolean;
  display_order: number;
};

function mapRow(row: SidebarModuleRow): WorkspaceSidebarModuleRecord {
  return {
    moduleId: row.module_id,
    enabled: row.enabled,
    displayOrder: row.display_order,
  };
}

function nowIso() {
  return new Date().toISOString();
}

async function readLegacyEnabledModules(workspaceId: string): Promise<string[] | null> {
  const supabase = createTenancyServerClient();
  const { data } = await supabase
    .from("workspace_admin_metadata")
    .select("enabled_modules")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!data?.enabled_modules || !Array.isArray(data.enabled_modules)) return null;
  return data.enabled_modules.map((id) => String(id));
}

async function readWorkspaceSlug(workspaceId: string): Promise<string | null> {
  const supabase = createTenancyServerClient();
  const { data } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", workspaceId)
    .maybeSingle();
  return data?.slug ? String(data.slug) : null;
}

async function bootstrapSidebarRows(
  workspaceId: string,
  workspaceSlug: string | null,
): Promise<WorkspaceSidebarModuleRecord[]> {
  const legacyEnabledModules = await readLegacyEnabledModules(workspaceId);
  return deriveSidebarRowsFromLegacyEnabledModules(legacyEnabledModules, workspaceSlug);
}

export async function loadWorkspaceSidebarModuleRows(
  workspaceId: string,
  workspaceSlug?: string | null,
): Promise<WorkspaceSidebarModuleRecord[]> {
  const resolvedSlug =
    workspaceSlug ?? (isSupabaseConfigured() ? await readWorkspaceSlug(workspaceId) : null);

  if (resolvedSlug === DEMO_SLUG) {
    const rows = defaultWorkspaceSidebarModuleRows(resolvedSlug).map((row) => ({
      ...row,
      enabled: true,
    }));
    return applyWolfCentralSharkSidebarRows(rows, resolvedSlug);
  }

  if (!isSupabaseConfigured()) {
    return applyWolfCentralSharkSidebarRows(
      deriveSidebarRowsFromLegacyEnabledModules(null, resolvedSlug),
      resolvedSlug,
    );
  }

  const supabase = createTenancyServerClient();
  const { data, error } = await supabase
    .from("workspace_sidebar_modules")
    .select("module_id, enabled, display_order")
    .eq("workspace_id", workspaceId)
    .order("display_order", { ascending: true });

  if (error) {
    throw new Error(error.message || "Failed to load workspace sidebar modules.");
  }

  if (!data?.length) {
    const bootstrapped = await bootstrapSidebarRows(workspaceId, resolvedSlug);
    await saveWorkspaceSidebarModuleRows(workspaceId, bootstrapped, {
      syncMetadata: false,
      workspaceSlug: resolvedSlug,
    });
    return applyWolfCentralSharkSidebarRows(bootstrapped, resolvedSlug);
  }

  const legacyEnabledModules = await readLegacyEnabledModules(workspaceId);
  const merged = mergeCatalogueWithPersistedRows(data.map(mapRow), resolvedSlug);
  const withMetadata = applyMetadataEnabledModuleHints(merged, legacyEnabledModules);
  return applyWolfCentralSharkSidebarRows(withMetadata, resolvedSlug);
}

export async function loadWorkspaceSidebarConfig(
  workspaceId: string,
  workspaceSlug?: string | null,
) {
  const modules = await loadWorkspaceSidebarModuleRows(workspaceId, workspaceSlug);
  return buildSidebarConfigSnapshot(modules);
}

async function syncWorkspaceAdminMetadata(
  workspaceId: string,
  snapshot: ReturnType<typeof buildSidebarConfigSnapshot>,
): Promise<void> {
  const supabase = createTenancyServerClient();
  const payload = {
    enabled_modules: snapshot.enabledModuleIds,
    enabled_sub_modules: snapshot.enabledSubModuleKeys,
    updated_at: nowIso(),
  };

  const { data: existing } = await supabase
    .from("workspace_admin_metadata")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("workspace_admin_metadata")
      .update(payload)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(error.message || "Failed to update workspace metadata.");
    return;
  }

  const { error } = await supabase.from("workspace_admin_metadata").insert({
    workspace_id: workspaceId,
    ...payload,
    company_name: "",
    contact_name: "",
    contact_email: "",
    country: "",
    description: "",
    branding_display_name: "",
    created_by: "sidebar-config",
  });
  if (error) throw new Error(error.message || "Failed to create workspace metadata.");
}

async function syncWorkspaceModuleKeys(
  workspaceId: string,
  enabledKeys: readonly string[],
): Promise<void> {
  const supabase = createTenancyServerClient();
  const enabledSet = new Set(enabledKeys);

  const { data: existing, error: readError } = await supabase
    .from("workspace_modules")
    .select("module_key, enabled")
    .eq("workspace_id", workspaceId);

  if (readError) {
    throw new Error(readError.message || "Failed to read workspace modules.");
  }

  const seen = new Set<string>();
  for (const row of existing ?? []) {
    const moduleKey = String(row.module_key);
    seen.add(moduleKey);
    const shouldEnable = enabledSet.has(moduleKey);
    if (Boolean(row.enabled) === shouldEnable) continue;
    const { error } = await supabase
      .from("workspace_modules")
      .update({ enabled: shouldEnable, updated_at: nowIso() })
      .eq("workspace_id", workspaceId)
      .eq("module_key", moduleKey);
    if (error) throw new Error(error.message || `Failed to update module "${moduleKey}".`);
  }

  for (const moduleKey of enabledSet) {
    if (seen.has(moduleKey)) continue;
    const { error } = await supabase.from("workspace_modules").upsert(
      {
        workspace_id: workspaceId,
        module_key: moduleKey,
        enabled: true,
        updated_at: nowIso(),
      },
      { onConflict: "workspace_id,module_key" },
    );
    if (error) throw new Error(error.message || `Failed to enable module "${moduleKey}".`);
  }
}

export async function saveWorkspaceSidebarModuleRows(
  workspaceId: string,
  rows: readonly WorkspaceSidebarModuleRecord[],
  options?: { syncMetadata?: boolean; workspaceSlug?: string | null },
): Promise<ReturnType<typeof buildSidebarConfigSnapshot>> {
  const resolvedSlug =
    options?.workspaceSlug ??
    (isSupabaseConfigured() ? await readWorkspaceSlug(workspaceId) : null);

  if (!isSupabaseConfigured()) {
    return buildSidebarConfigSnapshot(rows);
  }

  const merged = mergeCatalogueWithPersistedRows(rows, resolvedSlug);
  const snapshot = buildSidebarConfigSnapshot(merged);
  const supabase = createTenancyServerClient();
  const timestamp = nowIso();

  const upsertRows = merged.map((row) => ({
    workspace_id: workspaceId,
    module_id: row.moduleId,
    enabled: row.enabled,
    display_order: row.displayOrder,
    updated_at: timestamp,
  }));

  const { error } = await supabase.from("workspace_sidebar_modules").upsert(upsertRows, {
    onConflict: "workspace_id,module_id",
  });
  if (error) {
    throw new Error(error.message || "Failed to save workspace sidebar modules.");
  }

  if (options?.syncMetadata !== false) {
    await syncWorkspaceAdminMetadata(workspaceId, snapshot);
    const moduleKeys = resolveProvisioningKeysFromSidebarRows(merged);
    await syncWorkspaceModuleKeys(workspaceId, moduleKeys);
  }

  return snapshot;
}

/** Derive enabled sub-modules when metadata is empty but sidebar rows exist. */
export function enabledSubModulesForSidebarRows(
  rows: readonly WorkspaceSidebarModuleRecord[],
): string[] {
  const enabledModuleIds = rows.filter((row) => row.enabled).map((row) => row.moduleId);
  return defaultEnabledSubModules(enabledModuleIds);
}
