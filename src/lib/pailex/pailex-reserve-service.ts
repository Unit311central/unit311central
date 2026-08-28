import "server-only";

import { WOLF_DEMO_ALERT_SEEDS, WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";
import type {
  WolfEstateAlert,
  WolfEstateSnapshot,
  WolfReserveRecord,
} from "@/lib/wolf/central/types";
import { computeWolfEstateMetrics } from "@/lib/wolf/central/estate-metrics";
import {
  buildWolfEstateSnapshot,
  ensureWolfEstateSeed,
} from "@/lib/wolf/central/estate-service";
import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { PAILEX_RESERVE_SEED_SLUG } from "@/lib/pailex/pailex-surface";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

export type PailexReserveSnapshot = {
  reserve: WolfReserveRecord;
  alerts: WolfEstateAlert[];
  generatedAt: string;
  dataSource: "wolf-central-db" | "demo-seed";
};

function demoSeedReserve(): WolfReserveRecord {
  const seed = WOLF_DEMO_RESERVE_SEEDS.find((row) => row.slug === PAILEX_RESERVE_SEED_SLUG);
  if (!seed) {
    throw new Error("PAILEX demo reserve seed is missing.");
  }
  return { id: seed.slug, ...seed };
}

function demoSeedAlerts(reserveId: string): WolfEstateAlert[] {
  return WOLF_DEMO_ALERT_SEEDS.filter((row) => row.reserveId === reserveId).map((row, index) => ({
    id: `pailex-alert-${index + 1}`,
    reserveId: row.reserveId,
    reserveName: row.reserveName,
    title: row.title,
    detail: row.detail,
    severity: row.severity,
    createdAt: new Date().toISOString(),
  }));
}

async function findWolfCentralWorkspaceId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createSupabaseServiceRoleClient();
  const { data } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", WOLF_CENTRAL_SLUG)
    .maybeSingle();
  return data?.id ? String(data.id) : null;
}

/** Load PAILEX reserve context from WOLF Central estate when available. */
export async function buildPailexReserveSnapshot(): Promise<PailexReserveSnapshot> {
  const centralWorkspaceId = await findWolfCentralWorkspaceId();
  if (centralWorkspaceId) {
    await ensureWolfEstateSeed(centralWorkspaceId);
    const estate: WolfEstateSnapshot = await buildWolfEstateSnapshot(centralWorkspaceId);
    const reserve =
      estate.reserves.find((row) => row.slug === PAILEX_RESERVE_SEED_SLUG) ??
      estate.reserves.find((row) => row.futureWorkspaceSlug === "pailex") ??
      null;
    if (reserve) {
      const alerts = estate.alerts.filter((row) => row.reserveId === reserve.id);
      return {
        reserve,
        alerts,
        generatedAt: estate.generatedAt,
        dataSource: "wolf-central-db",
      };
    }
  }

  const reserve = demoSeedReserve();
  return {
    reserve,
    alerts: demoSeedAlerts(reserve.id),
    generatedAt: new Date().toISOString(),
    dataSource: "demo-seed",
  };
}

export function pailexDashboardMetrics(reserve: WolfReserveRecord) {
  return computeWolfEstateMetrics([reserve]);
}
