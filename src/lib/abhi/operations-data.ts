import { getInventorySnapshotForWorkspace } from "@/lib/inventory-mock-store";
import { ABHI_SLUG } from "@/lib/abhi-surface";

export type AbhiOperationsDashboardSummary = {
  assetsTotal: number;
  assetsInService: number;
  assetsMaintenance: number;
  inventoryTotal: number;
  inventoryOperational: number;
  inventoryLowStockHints: number;
  openPurchaseOrders: number;
  pendingApprovals: number;
  suppliersActive: number;
  procurementSpendMtdGbp: number;
  procurementBudgetGbp: number;
  activeShipments: number;
  inboundShipments: number;
  outboundShipments: number;
};

/** Operations dashboard KPIs for abhi.* (GBP procurement spend). */
export function getAbhiOperationsDashboardSummary(): AbhiOperationsDashboardSummary {
  const inventory = getInventorySnapshotForWorkspace(ABHI_SLUG);
  const assets = inventory.assets.filter((row) => !row.archived);
  const inService = assets.filter((row) => row.status === "operational").length;
  const maintenance = assets.filter((row) => row.status === "maintenance").length;

  return {
    assetsTotal: assets.length,
    assetsInService: inService,
    assetsMaintenance: maintenance,
    inventoryTotal: assets.length,
    inventoryOperational: inService,
    inventoryLowStockHints: assets.filter((row) => /reorder|low stock/i.test(row.notes?.[0]?.text ?? "")).length,
    openPurchaseOrders: 6,
    pendingApprovals: 2,
    suppliersActive: 5,
    procurementSpendMtdGbp: 48_600,
    procurementBudgetGbp: 120_000,
    activeShipments: 4,
    inboundShipments: 2,
    outboundShipments: 2,
  };
}
