/**
 * Northstar Industrial Technologies — Operations fixtures (GBP).
 * Used on demo.unit311central.com for dashboard KPIs and module charts.
 */

import { calcPoTotals, type GoodsReceipt, type PurchaseOrder, type PurchaseRequisition } from "@/lib/procurement-data";
import type { LogisticsShipment } from "@/lib/logistics-data";

export const NORTHSTAR_ASSET_KPIS = {
  totalValueGbp: 4_200_000,
  totalCount: 248,
  depreciationValueGbp: 890_000,
} as const;

export type NorthstarOperationsDashboardSummary = {
  assetsTotalValueGbp: number;
  assetsTotalCount: number;
  assetsDepreciationGbp: number;
  inventorySkuCount: number;
  inventoryOnHandValueGbp: number;
  procurementSpendMtdGbp: number;
  procurementOpenPos: number;
  logisticsInboundInTransit: number;
  logisticsOutboundInTransit: number;
  logisticsLatePct3Mo: number;
  logisticsAvgCourierSpendGbp: number;
};

export type NorthstarInventoryCharts = {
  statusMix: Array<{ name: string; value: number }>;
  valueByLocation: Array<{ location: string; value: number }>;
  stockMovement: Array<{ month: string; inbound: number; outbound: number }>;
};

export type LogisticsLatePeriodMonths = 1 | 3 | 6 | 12;

export type NorthstarLogisticsKpis = {
  inboundInTransit: number;
  outboundInTransit: number;
  lateDeliveryPct: number;
  avgCourierSpendPerPackageGbp: number;
  periodMonths: LogisticsLatePeriodMonths;
};

const IN_TRANSIT_STATUSES = new Set<LogisticsShipment["status"]>([
  "In transit",
  "Out for delivery",
  "Awaiting pickup",
]);

function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function formatNorthstarGbp(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits,
  }).format(value);
}

export function countShipmentsInTransit(
  shipments: LogisticsShipment[],
  direction: LogisticsShipment["direction"],
) {
  return shipments.filter(
    (row) => row.direction === direction && IN_TRANSIT_STATUSES.has(row.status),
  ).length;
}

/** Demo late-delivery and courier spend keyed by trailing period (months). */
const LATE_DELIVERY_PCT: Record<LogisticsLatePeriodMonths, number> = {
  1: 6.2,
  3: 8.4,
  6: 9.1,
  12: 7.8,
};

const AVG_COURIER_SPEND_GBP: Record<LogisticsLatePeriodMonths, number> = {
  1: 22.8,
  3: 24.6,
  6: 23.9,
  12: 25.1,
};

export function getNorthstarLogisticsKpis(
  shipments: LogisticsShipment[],
  periodMonths: LogisticsLatePeriodMonths = 3,
): NorthstarLogisticsKpis {
  return {
    inboundInTransit: countShipmentsInTransit(shipments, "inbound"),
    outboundInTransit: countShipmentsInTransit(shipments, "outbound"),
    lateDeliveryPct: LATE_DELIVERY_PCT[periodMonths],
    avgCourierSpendPerPackageGbp: AVG_COURIER_SPEND_GBP[periodMonths],
    periodMonths,
  };
}

export function getNorthstarOperationsDashboardSummary(
  shipments: LogisticsShipment[] = [],
): NorthstarOperationsDashboardSummary {
  const logistics = getNorthstarLogisticsKpis(shipments, 3);
  return {
    assetsTotalValueGbp: NORTHSTAR_ASSET_KPIS.totalValueGbp,
    assetsTotalCount: NORTHSTAR_ASSET_KPIS.totalCount,
    assetsDepreciationGbp: NORTHSTAR_ASSET_KPIS.depreciationValueGbp,
    inventorySkuCount: 186,
    inventoryOnHandValueGbp: 620_000,
    procurementSpendMtdGbp: 142_400,
    procurementOpenPos: 12,
    logisticsInboundInTransit: logistics.inboundInTransit,
    logisticsOutboundInTransit: logistics.outboundInTransit,
    logisticsLatePct3Mo: logistics.lateDeliveryPct,
    logisticsAvgCourierSpendGbp: logistics.avgCourierSpendPerPackageGbp,
  };
}

export function getNorthstarInventoryCharts(): NorthstarInventoryCharts {
  return {
    statusMix: [
      { name: "Operational", value: 142 },
      { name: "Maintenance", value: 18 },
      { name: "Reserved", value: 24 },
      { name: "Out of service", value: 8 },
    ],
    valueByLocation: [
      { location: "London", value: 280_000 },
      { location: "Berlin", value: 145_000 },
      { location: "Singapore", value: 98_000 },
      { location: "Sydney", value: 72_000 },
      { location: "Manchester", value: 85_000 },
    ],
    stockMovement: [
      { month: "Mar", inbound: 42, outbound: 38 },
      { month: "Apr", inbound: 48, outbound: 41 },
      { month: "May", inbound: 51, outbound: 47 },
      { month: "Jun", inbound: 46, outbound: 44 },
      { month: "Jul", inbound: 55, outbound: 49 },
      { month: "Aug", inbound: 52, outbound: 50 },
    ],
  };
}

function poLine(item: string, qty: number, unitPrice: number, supplierId: string, supplierName: string) {
  return {
    id: uid("line"),
    item,
    description: item,
    sku: `NST-${Math.floor(Math.random() * 9000 + 1000)}`,
    quantity: qty,
    unit: "ea",
    unitPrice,
    estimatedCost: unitPrice,
    taxPct: 20,
    discountPct: 0,
    preferredSupplierId: supplierId,
    preferredSupplierName: supplierName,
  };
}

function buildPo(
  partial: Pick<PurchaseOrder, "id" | "poNumber" | "supplierId" | "supplierName" | "status" | "lines"> &
    Partial<PurchaseOrder>,
): PurchaseOrder {
  const totals = calcPoTotals(partial.lines);
  return {
    id: partial.id,
    poNumber: partial.poNumber,
    supplierId: partial.supplierId,
    supplierName: partial.supplierName,
    supplierContact: partial.supplierContact ?? "Account Manager",
    deliveryAddress: partial.deliveryAddress ?? "London HQ, United Kingdom",
    billingAddress: partial.billingAddress ?? "Northstar Industrial Technologies Ltd",
    currency: "GBP",
    paymentTerms: partial.paymentTerms ?? "Net 30",
    expectedDelivery: partial.expectedDelivery ?? isoDaysFromNow(14),
    status: partial.status,
    requisitionId: partial.requisitionId ?? null,
    lines: partial.lines,
    notes: partial.notes ?? "",
    subtotal: totals.subtotal,
    taxTotal: totals.taxTotal,
    discountTotal: totals.discountTotal,
    grandTotal: totals.grandTotal,
    emailedAt: partial.emailedAt ?? isoDaysFromNow(-2),
    createdAt: partial.createdAt ?? isoDaysFromNow(-12),
    updatedAt: partial.updatedAt ?? isoDaysFromNow(0),
  };
}

/** Procurement PO / requisition seeds merged into demo fixture state. */
export function getNorthstarProcurementSeed(): {
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
} {
  const sup1 = "mag-sup-1";
  const sup2 = "mag-sup-2";
  const sup3 = "mag-sup-3";

  const requisitions: PurchaseRequisition[] = [
    {
      id: "nst-req-1",
      requestNumber: "PR-2026-1042",
      requestDate: isoDaysFromNow(-5),
      requestedBy: "Oliver Hayes",
      department: "Engineering",
      costCentre: "ENG-01",
      priority: "high",
      requiredDate: isoDaysFromNow(10),
      businessJustification: "PLC spares for Sheffield plant line upgrade.",
      budgetCode: "CAPEX-PLANT",
      status: "manager_approval",
      lines: [poLine("Siemens S7-1500 CPU module", 4, 2800, sup1, "Harbor Energy Supply")],
      attachments: [],
      approvalHistory: [],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-5),
      updatedAt: isoDaysFromNow(-1),
    },
    {
      id: "nst-req-2",
      requestNumber: "PR-2026-1043",
      requestDate: isoDaysFromNow(-3),
      requestedBy: "Priya Shah",
      department: "Operations",
      costCentre: "OPS-02",
      priority: "normal",
      requiredDate: isoDaysFromNow(21),
      businessJustification: "Laptop refresh for APAC delivery pod.",
      budgetCode: "OPEX-IT",
      status: "finance_approval",
      lines: [poLine("MacBook Pro 16\" M3 Max", 12, 2400, sup2, "CDW UK")],
      attachments: [],
      approvalHistory: [],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-3),
      updatedAt: isoDaysFromNow(0),
    },
    {
      id: "nst-req-3",
      requestNumber: "PR-2026-1038",
      requestDate: isoDaysFromNow(-18),
      requestedBy: "Marcus Morgan",
      department: "Consulting",
      costCentre: "CON-01",
      priority: "normal",
      requiredDate: isoDaysFromNow(-2),
      businessJustification: "Client workshop materials — Cascade Health.",
      budgetCode: "OPEX-DELIVERY",
      status: "purchasing",
      lines: [
        poLine("Workshop signage kit", 6, 420, sup3, "Print & Board Pack Co"),
        poLine("Branded notebooks", 120, 8.5, sup3, "Print & Board Pack Co"),
      ],
      attachments: [],
      approvalHistory: [],
      linkedPoId: "nst-po-3",
      createdAt: isoDaysFromNow(-18),
      updatedAt: isoDaysFromNow(-4),
    },
  ];

  const purchaseOrders: PurchaseOrder[] = [
    buildPo({
      id: "nst-po-1",
      poNumber: "PO-2026-1188",
      supplierId: sup1,
      supplierName: "Harbor Energy Supply",
      status: "sent",
      lines: [poLine("Industrial IoT gateway kit", 8, 4200, sup1, "Harbor Energy Supply")],
      createdAt: isoDaysFromNow(-8),
    }),
    buildPo({
      id: "nst-po-2",
      poNumber: "PO-2026-1190",
      supplierId: sup2,
      supplierName: "CDW UK",
      status: "acknowledged",
      lines: [poLine("Dell Precision workstation", 6, 3200, sup2, "CDW UK")],
      createdAt: isoDaysFromNow(-15),
    }),
    buildPo({
      id: "nst-po-3",
      poNumber: "PO-2026-1175",
      supplierId: sup3,
      supplierName: "Print & Board Pack Co",
      status: "partially_received",
      requisitionId: "nst-req-3",
      lines: [
        poLine("Workshop signage kit", 6, 420, sup3, "Print & Board Pack Co"),
        poLine("Branded notebooks", 120, 8.5, sup3, "Print & Board Pack Co"),
      ],
      createdAt: isoDaysFromNow(-20),
    }),
    buildPo({
      id: "nst-po-4",
      poNumber: "PO-2026-1162",
      supplierId: sup1,
      supplierName: "Harbor Energy Supply",
      status: "received",
      lines: [poLine("Safety relay modules", 24, 185, sup1, "Harbor Energy Supply")],
      createdAt: isoDaysFromNow(-28),
    }),
    buildPo({
      id: "nst-po-5",
      poNumber: "PO-2026-1154",
      supplierId: sup2,
      supplierName: "CDW UK",
      status: "invoiced",
      lines: [poLine("MacBook Pro 14\" fleet", 18, 2200, sup2, "CDW UK")],
      createdAt: isoDaysFromNow(-35),
    }),
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: "nst-gr-1",
      receiptNumber: "GR-2026-0892",
      poId: "nst-po-3",
      poNumber: "PO-2026-1175",
      supplierName: "Print & Board Pack Co",
      deliveryDate: isoDaysFromNow(-6),
      receivedBy: "Warehouse — London",
      lines: purchaseOrders[2].lines.map((line) => ({
        lineId: line.id,
        item: line.item,
        orderedQty: line.quantity,
        receivedQty: Math.ceil(line.quantity / 2),
        damagedQty: 0,
        backOrderQty: line.quantity - Math.ceil(line.quantity / 2),
      })),
      photos: [],
      notes: "Partial delivery — notebooks pending.",
      inventoryUpdated: true,
      createdAt: isoDaysFromNow(-6),
    },
    {
      id: "nst-gr-2",
      receiptNumber: "GR-2026-0881",
      poId: "nst-po-4",
      poNumber: "PO-2026-1162",
      supplierName: "Harbor Energy Supply",
      deliveryDate: isoDaysFromNow(-12),
      receivedBy: "Sheffield plant",
      lines: purchaseOrders[3].lines.map((line) => ({
        lineId: line.id,
        item: line.item,
        orderedQty: line.quantity,
        receivedQty: line.quantity,
        damagedQty: 0,
        backOrderQty: 0,
      })),
      photos: [],
      notes: "",
      inventoryUpdated: true,
      createdAt: isoDaysFromNow(-12),
    },
  ];

  return { requisitions, purchaseOrders, goodsReceipts };
}
