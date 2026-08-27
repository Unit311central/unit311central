import "server-only";

import { WOLF_DEMO_ALERT_SEEDS, WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";
import type {
  WolfAnimalsSummary,
  WolfContainmentSummary,
  WolfDroneOperationsSummary,
  WolfEnvironmentSummary,
  WolfEstateAlert,
  WolfEstateMetrics,
  WolfEstateSnapshot,
  WolfReserveRecord,
} from "@/lib/wolf/central/types";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

type DbReserveRow = {
  id: string;
  central_workspace_id: string;
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  is_demo: boolean;
  deployment_status: string;
  large_drone_count: number;
  small_drone_count: number;
  dock_count: number;
  fleet_operational: number;
  fleet_total: number;
  animals_summary: WolfAnimalsSummary;
  containment_summary: WolfContainmentSummary;
  environment_summary: WolfEnvironmentSummary;
  drone_operations_summary: WolfDroneOperationsSummary;
  attention_status: string;
  future_workspace_slug: string | null;
  has_customer_workspace: boolean;
};

type DbAlertRow = {
  id: string;
  central_workspace_id: string;
  reserve_id: string;
  reserve_name: string;
  title: string;
  detail: string;
  severity: string;
  created_at: string;
};

function requireServiceSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServiceRoleClient();
}

function mapReserve(row: DbReserveRow): WolfReserveRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    country: row.country,
    latitude: row.latitude,
    longitude: row.longitude,
    isDemo: row.is_demo,
    deploymentStatus: row.deployment_status,
    largeDroneCount: row.large_drone_count,
    smallDroneCount: row.small_drone_count,
    dockCount: row.dock_count,
    fleetOperational: row.fleet_operational,
    fleetTotal: row.fleet_total,
    animals: row.animals_summary,
    containment: row.containment_summary,
    environment: row.environment_summary,
    droneOperations: row.drone_operations_summary,
    attentionStatus: row.attention_status === "attention" ? "attention" : "normal",
    futureWorkspaceSlug: row.future_workspace_slug,
    hasCustomerWorkspace: row.has_customer_workspace,
  };
}

function mapAlert(row: DbAlertRow): WolfEstateAlert {
  return {
    id: row.id,
    reserveId: row.reserve_id,
    reserveName: row.reserve_name,
    title: row.title,
    detail: row.detail,
    severity: row.severity === "attention" ? "attention" : "normal",
    createdAt: row.created_at,
  };
}

import { computeWolfEstateMetrics } from "@/lib/wolf/central/estate-metrics";

export async function ensureWolfEstateSeed(centralWorkspaceId: string): Promise<void> {
  const supabase = requireServiceSupabase();

  const { count, error: countError } = await supabase
    .from("wolf_reserves")
    .select("id", { count: "exact", head: true })
    .eq("central_workspace_id", centralWorkspaceId);

  if (countError) {
    throw new Error(countError.message || "Failed to check WOLF estate seed.");
  }
  if ((count ?? 0) > 0) return;

  const reserveRows = WOLF_DEMO_RESERVE_SEEDS.map((seed) => ({
    id: seed.slug,
    central_workspace_id: centralWorkspaceId,
    slug: seed.slug,
    name: seed.name,
    country: seed.country,
    latitude: seed.latitude,
    longitude: seed.longitude,
    is_demo: seed.isDemo,
    deployment_status: seed.deploymentStatus,
    large_drone_count: seed.largeDroneCount,
    small_drone_count: seed.smallDroneCount,
    dock_count: seed.dockCount,
    fleet_operational: seed.fleetOperational,
    fleet_total: seed.fleetTotal,
    animals_summary: seed.animals,
    containment_summary: seed.containment,
    environment_summary: seed.environment,
    drone_operations_summary: seed.droneOperations,
    attention_status: seed.attentionStatus,
    future_workspace_slug: seed.futureWorkspaceSlug,
    has_customer_workspace: seed.hasCustomerWorkspace,
  }));

  const { error: reserveError } = await supabase.from("wolf_reserves").insert(reserveRows);
  if (reserveError) {
    throw new Error(reserveError.message || "Failed to seed WOLF reserves.");
  }

  const alertRows = WOLF_DEMO_ALERT_SEEDS.map((seed, index) => ({
    id: `wolf-alert-${index + 1}`,
    central_workspace_id: centralWorkspaceId,
    reserve_id: seed.reserveId,
    reserve_name: seed.reserveName,
    title: seed.title,
    detail: seed.detail,
    severity: seed.severity,
  }));

  const { error: alertError } = await supabase.from("wolf_estate_alerts").insert(alertRows);
  if (alertError) {
    throw new Error(alertError.message || "Failed to seed WOLF estate alerts.");
  }
}

/** Load WOLF estate snapshot — only rows scoped to the given WOLF Central workspace. */
export async function buildWolfEstateSnapshot(centralWorkspaceId: string): Promise<WolfEstateSnapshot> {
  const supabase = requireServiceSupabase();

  const { data: reserveData, error: reserveError } = await supabase
    .from("wolf_reserves")
    .select("*")
    .eq("central_workspace_id", centralWorkspaceId)
    .order("name", { ascending: true });

  if (reserveError) {
    throw new Error(reserveError.message || "Failed to load WOLF reserves.");
  }

  const { data: alertData, error: alertError } = await supabase
    .from("wolf_estate_alerts")
    .select("*")
    .eq("central_workspace_id", centralWorkspaceId)
    .order("created_at", { ascending: false });

  if (alertError) {
    throw new Error(alertError.message || "Failed to load WOLF estate alerts.");
  }

  const reserves = (reserveData as DbReserveRow[]).map(mapReserve);
  const alerts = (alertData as DbAlertRow[]).map(mapAlert);
  const metrics = computeWolfEstateMetrics(reserves);

  return {
    reserves,
    alerts,
    metrics,
    generatedAt: new Date().toISOString(),
  };
}

export function isWolfCentralWorkspaceSlug(slug: string | null | undefined): boolean {
  return String(slug ?? "").trim().toLowerCase() === WOLF_CENTRAL_SLUG;
}
