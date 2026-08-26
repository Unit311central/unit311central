/**
 * OmniTransit (SAEC workspace) — Operations fixtures in ZAR.
 */

import type { LogisticsShipment } from "@/lib/logistics-data";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

export const OMNITRANSIT_ASSET_KPIS = {
  totalValueZar: 18_400_000,
  totalCount: 312,
  depreciationValueZar: 2_150_000,
} as const;

export type OmniTransitOperationsDashboardSummary = {
  assetsTotalValueZar: number;
  assetsTotalCount: number;
  assetsDepreciationZar: number;
  inventorySkuCount: number;
  inventoryOnHandValueZar: number;
  procurementSpendMtdZar: number;
  procurementOpenPos: number;
  logisticsInboundInTransit: number;
  logisticsOutboundInTransit: number;
  logisticsLatePct3Mo: number;
  logisticsAvgCourierSpendZar: number;
};

export type OmniTransitInventoryCharts = {
  statusMix: Array<{ name: string; value: number }>;
  valueByLocation: Array<{ location: string; value: number }>;
  stockMovement: Array<{ month: string; inbound: number; outbound: number }>;
};

const IN_TRANSIT_STATUSES = new Set<LogisticsShipment["status"]>([
  "In transit",
  "Out for delivery",
  "Awaiting pickup",
]);

export function formatOmniTransitZar(value: number, maximumFractionDigits = 0): string {
  const rounded = Math.ceil(Number(value) || 0);
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: SAEC_REPORTING_CURRENCY,
    minimumFractionDigits: 0,
    maximumFractionDigits,
  }).format(rounded);
}

export function countShipmentsInTransit(
  shipments: LogisticsShipment[],
  direction: LogisticsShipment["direction"],
) {
  return shipments.filter(
    (row) => row.direction === direction && IN_TRANSIT_STATUSES.has(row.status),
  ).length;
}

export function getOmniTransitOperationsDashboardSummary(
  shipments: LogisticsShipment[],
): OmniTransitOperationsDashboardSummary {
  const inbound = countShipmentsInTransit(shipments, "inbound");
  const outbound = countShipmentsInTransit(shipments, "outbound");

  return {
    assetsTotalValueZar: OMNITRANSIT_ASSET_KPIS.totalValueZar,
    assetsTotalCount: OMNITRANSIT_ASSET_KPIS.totalCount,
    assetsDepreciationZar: OMNITRANSIT_ASSET_KPIS.depreciationValueZar,
    inventorySkuCount: 184,
    inventoryOnHandValueZar: 6_280_000,
    procurementSpendMtdZar: 4_850_000,
    procurementOpenPos: 14,
    logisticsInboundInTransit: inbound,
    logisticsOutboundInTransit: outbound,
    logisticsLatePct3Mo: 4.2,
    logisticsAvgCourierSpendZar: 1_850,
  };
}

export function getOmniTransitInventoryCharts(): OmniTransitInventoryCharts {
  return {
    statusMix: [
      { name: "Available", value: 62 },
      { name: "Allocated", value: 24 },
      { name: "In transit", value: 9 },
      { name: "Quarantine", value: 7 },
    ],
    valueByLocation: [
      { location: "Johannesburg", value: 2_400_000 },
      { location: "Cape Town", value: 1_680_000 },
      { location: "Durban", value: 1_420_000 },
      { location: "Pretoria", value: 980_000 },
    ],
    stockMovement: [
      { month: "Mar", inbound: 820_000, outbound: 760_000 },
      { month: "Apr", inbound: 890_000, outbound: 810_000 },
      { month: "May", inbound: 940_000, outbound: 880_000 },
      { month: "Jun", inbound: 910_000, outbound: 860_000 },
      { month: "Jul", inbound: 980_000, outbound: 920_000 },
      { month: "Aug", inbound: 950_000, outbound: 890_000 },
    ],
  };
}
