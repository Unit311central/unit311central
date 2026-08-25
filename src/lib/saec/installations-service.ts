import "server-only";

import {
  assertSaecSeedTotals,
  buildSaecInstallationSeed,
} from "@/lib/saec/installations-seed";
import type {
  SaecCityAggregate,
  SaecCitySiteSummary,
  SaecEngineerAssignmentSummary,
  SaecInstallationAsset,
  SaecInstallationAssetInput,
  SaecInstallationAssetType,
  SaecInstallationDocument,
  SaecInstallationFault,
  SaecInstallationsDashboardSnapshot,
  SaecInstallationsKpis,
  SaecMaintenanceRecord,
} from "@/lib/saec/installations-types";
import { SAEC_INSTALLATION_CITIES } from "@/lib/saec/installations-cities";
import { SAEC_INSTALLATION_ENGINEERS } from "@/lib/saec/installations-engineers";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type DbAssetRow = {
  id: string;
  workspace_id: string;
  asset_type: string;
  asset_code: string;
  model: string;
  site_name: string;
  customer_name: string;
  city_id: string;
  city_label: string;
  level_label: string;
  status: string;
  maintenance_status: string;
  contract_status: string;
  assigned_engineer_id: string | null;
  assigned_engineer_name: string | null;
  engineer_field_status: string | null;
  next_maintenance_date: string | null;
  last_maintenance_date: string | null;
  maintenance_frequency_months: number;
  installed_date: string;
  faults: SaecInstallationFault[] | null;
  documents: SaecInstallationDocument[] | null;
  created_at: string;
  updated_at: string;
};

type DbMaintenanceRow = {
  id: string;
  workspace_id: string;
  asset_id: string;
  date: string;
  engineer_name: string;
  maintenance_type: string;
  result: string;
  notes: string;
  created_at: string;
};

function requireServiceSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function mapAsset(row: DbAssetRow): SaecInstallationAsset {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    assetType: row.asset_type as SaecInstallationAssetType,
    assetCode: row.asset_code,
    model: row.model,
    siteName: row.site_name,
    customerName: row.customer_name,
    cityId: row.city_id as SaecInstallationAsset["cityId"],
    cityLabel: row.city_label,
    levelLabel: row.level_label,
    status: row.status as SaecInstallationAsset["status"],
    maintenanceStatus: row.maintenance_status as SaecInstallationAsset["maintenanceStatus"],
    contractStatus: row.contract_status as SaecInstallationAsset["contractStatus"],
    assignedEngineerId: row.assigned_engineer_id,
    assignedEngineerName: row.assigned_engineer_name,
    engineerFieldStatus: row.engineer_field_status as SaecInstallationAsset["engineerFieldStatus"],
    nextMaintenanceDate: row.next_maintenance_date,
    lastMaintenanceDate: row.last_maintenance_date,
    maintenanceFrequencyMonths: row.maintenance_frequency_months,
    installedDate: row.installed_date,
    faults: row.faults ?? [],
    documents: row.documents ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMaintenance(row: DbMaintenanceRow): SaecMaintenanceRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    assetId: row.asset_id,
    date: row.date,
    engineerName: row.engineer_name,
    maintenanceType: row.maintenance_type,
    result: row.result,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

function assetToDb(asset: SaecInstallationAsset): DbAssetRow {
  return {
    id: asset.id,
    workspace_id: asset.workspaceId,
    asset_type: asset.assetType,
    asset_code: asset.assetCode,
    model: asset.model,
    site_name: asset.siteName,
    customer_name: asset.customerName,
    city_id: asset.cityId,
    city_label: asset.cityLabel,
    level_label: asset.levelLabel,
    status: asset.status,
    maintenance_status: asset.maintenanceStatus,
    contract_status: asset.contractStatus,
    assigned_engineer_id: asset.assignedEngineerId,
    assigned_engineer_name: asset.assignedEngineerName,
    engineer_field_status: asset.engineerFieldStatus,
    next_maintenance_date: asset.nextMaintenanceDate,
    last_maintenance_date: asset.lastMaintenanceDate,
    maintenance_frequency_months: asset.maintenanceFrequencyMonths,
    installed_date: asset.installedDate,
    faults: asset.faults,
    documents: asset.documents,
    created_at: asset.createdAt,
    updated_at: asset.updatedAt,
  };
}

function newId(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 10)}`;
}

export async function ensureSaecInstallationSeed(workspaceId: string): Promise<void> {
  const supabase = requireServiceSupabase();
  const { count, error } = await supabase
    .from("saec_installation_assets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
  if ((count ?? 0) > 0) return;

  const seed = buildSaecInstallationSeed(workspaceId);
  assertSaecSeedTotals(seed.assets);

  const assetRows = seed.assets.map((asset) => assetToDb(asset));
  const { error: assetError } = await supabase.from("saec_installation_assets").insert(assetRows);
  if (assetError) throw new Error(assetError.message);

  const maintenanceRows = seed.maintenance.map((row) => ({
    id: row.id,
    workspace_id: row.workspaceId,
    asset_id: row.assetId,
    date: row.date,
    engineer_name: row.engineerName,
    maintenance_type: row.maintenanceType,
    result: row.result,
    notes: row.notes,
    created_at: row.createdAt,
  }));
  const { error: maintError } = await supabase.from("saec_installation_maintenance").insert(maintenanceRows);
  if (maintError) throw new Error(maintError.message);
}

export async function listSaecInstallationAssets(
  workspaceId: string,
  assetType?: SaecInstallationAssetType,
): Promise<SaecInstallationAsset[]> {
  const supabase = requireServiceSupabase();
  let query = supabase
    .from("saec_installation_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("asset_code", { ascending: true });
  if (assetType) query = query.eq("asset_type", assetType);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as DbAssetRow[]).map(mapAsset);
}

export async function getSaecInstallationAsset(
  workspaceId: string,
  assetId: string,
): Promise<SaecInstallationAsset | null> {
  const supabase = requireServiceSupabase();
  const { data, error } = await supabase
    .from("saec_installation_assets")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", assetId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapAsset(data as DbAssetRow) : null;
}

export async function listSaecMaintenanceForAsset(
  workspaceId: string,
  assetId: string,
): Promise<SaecMaintenanceRecord[]> {
  const supabase = requireServiceSupabase();
  const { data, error } = await supabase
    .from("saec_installation_maintenance")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("asset_id", assetId)
    .order("date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data as DbMaintenanceRow[]).map(mapMaintenance);
}

function buildKpis(assets: SaecInstallationAsset[]): SaecInstallationsKpis {
  const engineersOnRoad = assets.filter(
    (row) =>
      row.engineerFieldStatus === "On Site" || row.engineerFieldStatus === "En Route",
  ).length;
  return {
    total: assets.length,
    online: assets.filter((row) => row.status === "online").length,
    offline: assets.filter((row) => row.status === "offline").length,
    maintenanceDue: assets.filter((row) => row.maintenanceStatus === "due").length,
    overdueMaintenance: assets.filter((row) => row.maintenanceStatus === "overdue").length,
    engineersOnRoad,
    openServiceAssignments: assets.filter(
      (row) => row.maintenanceStatus === "due" || row.maintenanceStatus === "overdue" || row.status !== "online",
    ).length,
  };
}

function buildCityAggregates(
  assets: SaecInstallationAsset[],
  assetType: SaecInstallationAssetType,
): SaecCityAggregate[] {
  return SAEC_INSTALLATION_CITIES.map((city) => {
    const cityAssets = assets.filter((row) => row.cityId === city.id);
    const siteMap = new Map<string, SaecCitySiteSummary>();
    for (const asset of cityAssets) {
      const key = asset.siteName;
      const existing = siteMap.get(key);
      if (existing) {
        existing.unitCount += 1;
      } else {
        siteMap.set(key, {
          id: `site-${city.id}-${siteSlug(key)}`,
          siteName: asset.siteName,
          customerName: asset.customerName,
          unitCount: 1,
        });
      }
    }
    const engineersAssigned = new Set(
      cityAssets.map((row) => row.assignedEngineerId).filter(Boolean),
    ).size;
    return {
      cityId: city.id,
      cityLabel: city.label,
      mapX: city.mapX,
      mapY: city.mapY,
      total: cityAssets.length,
      online: cityAssets.filter((row) => row.status === "online").length,
      offline: cityAssets.filter((row) => row.status === "offline").length,
      maintenanceDue: cityAssets.filter((row) => row.maintenanceStatus === "due").length,
      overdue: cityAssets.filter((row) => row.maintenanceStatus === "overdue").length,
      engineersAssigned,
      sites: [...siteMap.values()].sort((a, b) => b.unitCount - a.unitCount),
    };
  });
}

function siteSlug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildEngineerAssignments(assets: SaecInstallationAsset[]): SaecEngineerAssignmentSummary[] {
  const summaries: SaecEngineerAssignmentSummary[] = [];
  for (const asset of assets) {
    if (
      asset.assignedEngineerId &&
      asset.assignedEngineerName &&
      (asset.engineerFieldStatus === "On Site" || asset.engineerFieldStatus === "En Route")
    ) {
      summaries.push({
        engineerId: asset.assignedEngineerId,
        engineerName: asset.assignedEngineerName,
        assetCode: asset.assetCode,
        assignmentLabel:
          asset.status === "offline"
            ? `${asset.assetCode.split("-")[0]} fault`
            : `${asset.assetCode.split("-")[0]} service`,
        cityLabel: asset.cityLabel,
        status: asset.engineerFieldStatus ?? "Available",
      });
    }
  }
  return summaries.slice(0, 12);
}

export async function buildSaecInstallationsDashboard(
  workspaceId: string,
  assetType: SaecInstallationAssetType,
): Promise<SaecInstallationsDashboardSnapshot> {
  await ensureSaecInstallationSeed(workspaceId);
  const assets = await listSaecInstallationAssets(workspaceId, assetType);
  return {
    assetType,
    kpis: buildKpis(assets),
    cities: buildCityAggregates(assets, assetType),
    engineersOnRoad: buildEngineerAssignments(assets),
  };
}

export async function createSaecInstallationAsset(
  workspaceId: string,
  input: SaecInstallationAssetInput,
): Promise<SaecInstallationAsset> {
  const supabase = requireServiceSupabase();
  const now = new Date().toISOString();
  const id = newId("saec-inst");
  const row: DbAssetRow = {
    id,
    workspace_id: workspaceId,
    asset_type: input.assetType,
    asset_code: input.assetCode.trim(),
    model: input.model,
    site_name: input.siteName.trim(),
    customer_name: input.customerName?.trim() ?? "Demo Property Holdings",
    city_id: input.cityId,
    city_label: input.cityId,
    level_label: input.levelLabel ?? "L1",
    status: input.status,
    maintenance_status: input.maintenanceStatus,
    contract_status: input.contractStatus,
    assigned_engineer_id: input.assignedEngineerId ?? null,
    assigned_engineer_name: input.assignedEngineerName ?? null,
    engineer_field_status: input.engineerFieldStatus ?? null,
    next_maintenance_date: input.nextMaintenanceDate ?? null,
    last_maintenance_date: input.lastMaintenanceDate ?? null,
    maintenance_frequency_months: input.maintenanceFrequencyMonths ?? 3,
    installed_date: input.installedDate ?? now.slice(0, 10),
    faults: [],
    documents: [],
    created_at: now,
    updated_at: now,
  };
  const city = SAEC_INSTALLATION_CITIES.find((entry) => entry.id === input.cityId);
  if (city) row.city_label = city.label;

  const { data, error } = await supabase.from("saec_installation_assets").insert(row).select("*").single();
  if (error) throw new Error(error.message);
  return mapAsset(data as DbAssetRow);
}

export async function updateSaecInstallationAsset(
  workspaceId: string,
  assetId: string,
  patch: Partial<SaecInstallationAssetInput>,
): Promise<SaecInstallationAsset> {
  const supabase = requireServiceSupabase();
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.assetCode) updates.asset_code = patch.assetCode.trim();
  if (patch.model) updates.model = patch.model;
  if (patch.siteName) updates.site_name = patch.siteName.trim();
  if (patch.customerName !== undefined) updates.customer_name = patch.customerName;
  if (patch.cityId) {
    updates.city_id = patch.cityId;
    const city = SAEC_INSTALLATION_CITIES.find((entry) => entry.id === patch.cityId);
    if (city) updates.city_label = city.label;
  }
  if (patch.levelLabel) updates.level_label = patch.levelLabel;
  if (patch.status) updates.status = patch.status;
  if (patch.maintenanceStatus) updates.maintenance_status = patch.maintenanceStatus;
  if (patch.contractStatus) updates.contract_status = patch.contractStatus;
  if (patch.assignedEngineerId !== undefined) updates.assigned_engineer_id = patch.assignedEngineerId;
  if (patch.assignedEngineerName !== undefined) updates.assigned_engineer_name = patch.assignedEngineerName;
  if (patch.engineerFieldStatus !== undefined) updates.engineer_field_status = patch.engineerFieldStatus;
  if (patch.nextMaintenanceDate !== undefined) updates.next_maintenance_date = patch.nextMaintenanceDate;
  if (patch.lastMaintenanceDate !== undefined) updates.last_maintenance_date = patch.lastMaintenanceDate;
  if (patch.maintenanceFrequencyMonths !== undefined) {
    updates.maintenance_frequency_months = patch.maintenanceFrequencyMonths;
  }
  if (patch.installedDate) updates.installed_date = patch.installedDate;

  const { data, error } = await supabase
    .from("saec_installation_assets")
    .update(updates)
    .eq("workspace_id", workspaceId)
    .eq("id", assetId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapAsset(data as DbAssetRow);
}

export async function deleteSaecInstallationAsset(workspaceId: string, assetId: string): Promise<void> {
  const supabase = requireServiceSupabase();
  const { error } = await supabase
    .from("saec_installation_assets")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", assetId);
  if (error) throw new Error(error.message);
}

export async function createSaecMaintenanceAssignment(
  workspaceId: string,
  input: {
    assetId: string;
    date: string;
    engineerName: string;
    maintenanceType: string;
    result?: string;
    notes?: string;
  },
): Promise<SaecMaintenanceRecord> {
  const supabase = requireServiceSupabase();
  const id = newId("saec-maint");
  const now = new Date().toISOString();
  const row = {
    id,
    workspace_id: workspaceId,
    asset_id: input.assetId,
    date: input.date,
    engineer_name: input.engineerName,
    maintenance_type: input.maintenanceType,
    result: input.result ?? "Scheduled",
    notes: input.notes ?? "",
    created_at: now,
  };
  const { data, error } = await supabase.from("saec_installation_maintenance").insert(row).select("*").single();
  if (error) throw new Error(error.message);

  await supabase
    .from("saec_installation_assets")
    .update({
      maintenance_status: "scheduled",
      next_maintenance_date: input.date,
      updated_at: now,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", input.assetId);

  return mapMaintenance(data as DbMaintenanceRow);
}

export function listSaecInstallationEngineerOptions() {
  return SAEC_INSTALLATION_ENGINEERS;
}
