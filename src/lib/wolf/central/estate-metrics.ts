import type { WolfEstateMetrics, WolfReserveRecord } from "@/lib/wolf/central/types";

export function computeWolfEstateMetrics(reserves: WolfReserveRecord[]): WolfEstateMetrics {
  const largeDrones = reserves.reduce((sum, r) => sum + r.largeDroneCount, 0);
  const smallDrones = reserves.reduce((sum, r) => sum + r.smallDroneCount, 0);
  const docks = reserves.reduce((sum, r) => sum + r.dockCount, 0);
  return {
    reserveCount: reserves.length,
    largeDrones,
    smallDrones,
    totalAircraft: largeDrones + smallDrones,
    docks,
    batteries: docks * 4,
  };
}
