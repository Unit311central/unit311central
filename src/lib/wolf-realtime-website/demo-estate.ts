import { WOLF_DEMO_RESERVE_SEEDS } from "@/lib/wolf/central/demo-seed";
import { computeWolfEstateMetrics } from "@/lib/wolf/central/estate-metrics";
import type { WolfEstateSnapshot, WolfReserveRecord } from "@/lib/wolf/central/types";

/** Marketing-only snapshot — same demo reserve definitions as WOLF Central seed data. */
export function buildWolfRealtimeMarketingEstateSnapshot(): WolfEstateSnapshot {
  const reserves: WolfReserveRecord[] = WOLF_DEMO_RESERVE_SEEDS.map((seed) => ({
    ...seed,
    id: `marketing-${seed.slug}`,
  }));
  return {
    reserves,
    alerts: [],
    metrics: computeWolfEstateMetrics(reserves),
    generatedAt: new Date(0).toISOString(),
  };
}
