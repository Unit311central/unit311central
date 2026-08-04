/**
 * OnwardAir Operations fixtures — Houston / USD / FLEX Pod prototype ops.
 * Surface-gated client mocks only; do not wipe shared DB rows.
 */

import type { ManagedAsset } from "@/lib/asset-management-data";
import type {
  InventoryActivityItem,
  InventoryAsset,
  InventoryNote,
} from "@/lib/inventory-data";
import { emptyAssignment } from "@/lib/inventory-data";
import type {
  FeaturedRouteSnapshot,
  LogisticsShipment,
} from "@/lib/logistics-data";
import {
  calcPoTotals,
  DEFAULT_ROLE_PERMISSIONS,
  type AiInsight,
  type ApprovalRule,
  type GoodsReceipt,
  type IntegrationConnector,
  type ProcurementLineItem,
  type PurchaseOrder,
  type PurchaseRequisition,
  type SupplierContract,
  type SupplierInvoiceMatch,
  type SupplierRecord,
} from "@/lib/procurement-data";

export type OaOperationsDashboardSummary = {
  assetsTotal: number;
  assetsInService: number;
  assetsMaintenance: number;
  inventoryTotal: number;
  inventoryOperational: number;
  inventoryLowStockHints: number;
  openPurchaseOrders: number;
  pendingApprovals: number;
  spendMtdUsd: number;
  monthlyBudgetUsd: number;
  suppliersActive: number;
  shipmentsActive: number;
  shipmentsInbound: number;
  shipmentsOutbound: number;
  shipmentsInternational: number;
  featuredRouteLabel: string;
};

function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function line(
  partial: Partial<ProcurementLineItem> & { item: string },
): ProcurementLineItem {
  return {
    id: partial.id ?? uid("line"),
    item: partial.item,
    description: partial.description ?? partial.item,
    sku: partial.sku ?? `OA-${Math.floor(Math.random() * 9000 + 1000)}`,
    quantity: partial.quantity ?? 1,
    unit: partial.unit ?? "ea",
    unitPrice: partial.unitPrice ?? partial.estimatedCost ?? 0,
    estimatedCost: partial.estimatedCost ?? partial.unitPrice ?? 0,
    taxPct: partial.taxPct ?? 8.25,
    discountPct: partial.discountPct ?? 0,
    preferredSupplierId: partial.preferredSupplierId ?? "",
    preferredSupplierName: partial.preferredSupplierName ?? "",
  };
}

function stockNote(text: string): InventoryNote[] {
  return [
    {
      id: uid("note"),
      at: isoDaysFromNow(0),
      author: "Ops",
      kind: "operational",
      text,
    },
  ];
}

function seedInv(
  partial: Omit<InventoryAsset, "id" | "archived"> & { id?: string; archived?: boolean },
): InventoryAsset {
  return {
    id: partial.id ?? uid("asset"),
    archived: partial.archived ?? false,
    ...partial,
  };
}

/** Houston HQ asset register — engineering, lab, IT, facility (no Unit311 drones). */
export function createOnwardAirAssetRegistry(): {
  assets: ManagedAsset[];
  categories: string[];
  locations: string[];
} {
  const categories = [
    "Laptop",
    "Workstation",
    "Lab Equipment",
    "Test Bench",
    "3D Printer",
    "Tooling",
    "Vehicle",
    "Facility Equipment",
    "Monitor",
    "Software Licence",
  ];
  const locations = ["Houston HQ", "Houston Lab", "Flight Test Bay", "Field Kit"];

  const seeds: Array<{
    assetTag: string;
    category: string;
    location: string;
    model: string;
    serialNumber: string;
    purchaseDate: string;
    operationalStatus: ManagedAsset["operationalStatus"];
    firmwareVersion?: string;
    notes: string;
  }> = [
    {
      assetTag: "OA-LT-001",
      category: "Laptop",
      location: "Houston HQ",
      model: "MacBook Pro 16\" M3 Max",
      serialNumber: "MBP16-HOU-1001",
      purchaseDate: "2025-03-12",
      operationalStatus: "In Service",
      notes: "Assigned · CEO / flight ops briefing kit",
    },
    {
      assetTag: "OA-LT-002",
      category: "Laptop",
      location: "Houston HQ",
      model: "Dell Precision 5690",
      serialNumber: "DP5690-HOU-1002",
      purchaseDate: "2025-05-08",
      operationalStatus: "In Service",
      notes: "Assigned · Aero structures engineer",
    },
    {
      assetTag: "OA-LT-003",
      category: "Laptop",
      location: "Houston Lab",
      model: "Lenovo ThinkPad P16",
      serialNumber: "P16-HOU-1003",
      purchaseDate: "2025-06-20",
      operationalStatus: "In Service",
      notes: "Assigned · Avionics / GNC",
    },
    {
      assetTag: "OA-WS-001",
      category: "Workstation",
      location: "Houston Lab",
      model: "HP Z4 G5 Tower",
      serialNumber: "Z4G5-HOU-2001",
      purchaseDate: "2025-02-14",
      operationalStatus: "In Service",
      notes: "CAD / FEA desk · SolidWorks + ANSYS",
    },
    {
      assetTag: "OA-WS-002",
      category: "Workstation",
      location: "Houston HQ",
      model: "HP Z4 G5 Tower",
      serialNumber: "Z4G5-HOU-2002",
      purchaseDate: "2025-04-02",
      operationalStatus: "In Service",
      notes: "Flight controls simulation desk",
    },
    {
      assetTag: "OA-LAB-001",
      category: "Lab Equipment",
      location: "Houston Lab",
      model: "Keysight Oscilloscope DSOX3024T",
      serialNumber: "KEY-DSO-3001",
      purchaseDate: "2024-11-18",
      operationalStatus: "In Service",
      firmwareVersion: "7.40",
      notes: "Avionics signal integrity bench",
    },
    {
      assetTag: "OA-LAB-002",
      category: "Lab Equipment",
      location: "Houston Lab",
      model: "Fluke 1587 FC Insulation Multimeter",
      serialNumber: "FLU-1587-3002",
      purchaseDate: "2025-01-09",
      operationalStatus: "In Service",
      notes: "High-voltage harness checkout",
    },
    {
      assetTag: "OA-TB-001",
      category: "Test Bench",
      location: "Flight Test Bay",
      model: "FLEX Pod battery pack load bank",
      serialNumber: "OA-LB-4001",
      purchaseDate: "2025-07-01",
      operationalStatus: "In Service",
      firmwareVersion: "1.2.0",
      notes: "Prototype pack discharge / cycle test",
    },
    {
      assetTag: "OA-TB-002",
      category: "Test Bench",
      location: "Flight Test Bay",
      model: "Motor / ESC dyno rig",
      serialNumber: "OA-DYNO-4002",
      purchaseDate: "2025-08-15",
      operationalStatus: "Maintenance",
      notes: "Scheduled sensor recalibration",
    },
    {
      assetTag: "OA-3DP-001",
      category: "3D Printer",
      location: "Houston Lab",
      model: "Markforged X7",
      serialNumber: "MF-X7-5001",
      purchaseDate: "2025-03-28",
      operationalStatus: "In Service",
      firmwareVersion: "Eiger 4.8",
      notes: "Composite tooling fixtures · FLEX Pod brackets",
    },
    {
      assetTag: "OA-TOOL-001",
      category: "Tooling",
      location: "Houston Lab",
      model: "Snap-on aerospace tool chest",
      serialNumber: "SNAP-HOU-6001",
      purchaseDate: "2024-09-12",
      operationalStatus: "In Service",
      notes: "Prototype assembly bay · calibrated torque set",
    },
    {
      assetTag: "OA-VEH-001",
      category: "Vehicle",
      location: "Houston HQ",
      model: "Ford Transit cargo van",
      serialNumber: "1FTBW-HOU-7001",
      purchaseDate: "2025-02-01",
      operationalStatus: "In Service",
      notes: "Parts runs · Ellington Field / supplier pickups",
    },
    {
      assetTag: "OA-FAC-001",
      category: "Facility Equipment",
      location: "Houston HQ",
      model: "Liebert CRAC unit (lab HVAC)",
      serialNumber: "LBT-CRAC-8001",
      purchaseDate: "2024-08-20",
      operationalStatus: "In Service",
      notes: "Lab climate control · battery storage room",
    },
    {
      assetTag: "OA-MON-001",
      category: "Monitor",
      location: "Houston HQ",
      model: "Dell UltraSharp U3223QE",
      serialNumber: "U3223-HOU-9001",
      purchaseDate: "2025-05-08",
      operationalStatus: "In Service",
      notes: "Dual desk kit · aero engineering",
    },
    {
      assetTag: "OA-LIC-001",
      category: "Software Licence",
      location: "Houston HQ",
      model: "SolidWorks Premium (5 seats)",
      serialNumber: "SW-OA-5SEATS",
      purchaseDate: "2025-07-01",
      operationalStatus: "Active Licence",
      notes: "Annual USD · CAD seats for FLEX Pod design",
    },
    {
      assetTag: "OA-LIC-002",
      category: "Software Licence",
      location: "Houston HQ",
      model: "MATLAB + Simulink (3 seats)",
      serialNumber: "ML-OA-3SEATS",
      purchaseDate: "2025-07-01",
      operationalStatus: "Active Licence",
      notes: "Flight controls / GNC modelling",
    },
  ];

  const assets: ManagedAsset[] = seeds.map((seed, index) => ({
    id: `oa-asset-${index + 1}`,
    assetTag: seed.assetTag,
    category: seed.category,
    location: seed.location,
    model: seed.model,
    serialNumber: seed.serialNumber,
    operationalStatus: seed.operationalStatus,
    purchaseDate: seed.purchaseDate,
    firmwareVersion: seed.firmwareVersion ?? "N/A",
    drtk3BaseSerial: "",
    rtkCalibrationMode: "Uncalibrated",
    insuranceExpiry: "2027-06-30",
    lastMaintenanceDate: "2026-05-01",
    nextMaintenanceDue: "2026-11-01",
    totalFlightHours: 0,
    storageUsedGb: 0,
    assignedClientId: null,
    assignedToUserId: null,
    controlSource: seed.category === "Software Licence" ? "Cloud" : "RC",
    notes: seed.notes,
  }));

  return { assets, categories, locations };
}

export type OaInventoryMockState = {
  assets: InventoryAsset[];
  activity: InventoryActivityItem[];
};

/** Consumables & spares for Houston prototype build — all USD. */
export function seedOnwardAirInventoryState(): OaInventoryMockState {
  const assets = [
    seedInv({
      id: "oa-inv-1",
      assetTag: "INV-5101",
      name: "Li-ion pouch cells (pack A spares)",
      category: "Battery Cells",
      manufacturer: "Samsung SDI",
      model: "INR21700-50E lot",
      serialNumber: "CELL-HOU-01",
      purchaseDate: isoDaysFromNow(-40),
      purchaseCost: "$12,400",
      warrantyExpiry: isoDaysFromNow(320),
      currentValue: "$11,200",
      location: "Houston Lab · battery cage",
      status: "operational",
      condition: "excellent",
      department: "Propulsion",
      assignedTo: "",
      nextService: isoDaysFromNow(45),
      certificationExpiry: isoDaysFromNow(180),
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 80 cells · FLEX Pod pack A reserve"),
    }),
    seedInv({
      id: "oa-inv-2",
      assetTag: "INV-5102",
      name: "Carbon fibre prepreg (roll stock)",
      category: "Composites",
      manufacturer: "Toray",
      model: "T700 prepreg 12k",
      serialNumber: "CF-HOU-02",
      purchaseDate: isoDaysFromNow(-25),
      purchaseCost: "$8,600",
      warrantyExpiry: "",
      currentValue: "$7,900",
      location: "Houston Lab · cold store",
      status: "operational",
      condition: "excellent",
      department: "Structures",
      assignedTo: "",
      nextService: "",
      certificationExpiry: isoDaysFromNow(90),
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 2 rolls · freezer logged · 60-day outlife"),
    }),
    seedInv({
      id: "oa-inv-3",
      assetTag: "INV-5103",
      name: "Aerospace fastener kit (AN / MS)",
      category: "Hardware",
      manufacturer: "Fastenal Aerospace",
      model: "AN960 / MS21042 assortment",
      serialNumber: "FST-HOU-03",
      purchaseDate: isoDaysFromNow(-55),
      purchaseCost: "$1,850",
      warrantyExpiry: "",
      currentValue: "$1,650",
      location: "Houston Lab · crib",
      status: "operational",
      condition: "good",
      department: "Assembly",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 12 kits · reorder when < 4"),
    }),
    seedInv({
      id: "oa-inv-4",
      assetTag: "INV-5104",
      name: "Avionics wire harness spares",
      category: "Avionics",
      manufacturer: "TE Connectivity",
      model: "MIL-spec harness set",
      serialNumber: "HAR-HOU-04",
      purchaseDate: isoDaysFromNow(-70),
      purchaseCost: "$4,200",
      warrantyExpiry: isoDaysFromNow(400),
      currentValue: "$3,900",
      location: "Houston Lab · avionics rack",
      status: "operational",
      condition: "excellent",
      department: "Avionics",
      assignedTo: "",
      nextService: isoDaysFromNow(120),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 3 harness sets"),
    }),
    seedInv({
      id: "oa-inv-5",
      assetTag: "INV-5105",
      name: "PPE kit (lab + bay)",
      category: "Safety",
      manufacturer: "3M / Honeywell",
      model: "Prototype bay PPE pack",
      serialNumber: "PPE-HOU-05",
      purchaseDate: isoDaysFromNow(-15),
      purchaseCost: "$640",
      warrantyExpiry: "",
      currentValue: "$580",
      location: "Flight Test Bay · locker",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: isoDaysFromNow(365),
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 18 kits · low stock alert at 8"),
    }),
    seedInv({
      id: "oa-inv-6",
      assetTag: "INV-5106",
      name: "USB-C dock + laptop spare pool",
      category: "IT Equipment",
      manufacturer: "CalDigit",
      model: "TS4 spare pool",
      serialNumber: "DOCK-HOU-06",
      purchaseDate: isoDaysFromNow(-90),
      purchaseCost: "$1,050",
      warrantyExpiry: isoDaysFromNow(500),
      currentValue: "$920",
      location: "Houston HQ · IT cupboard",
      status: "operational",
      condition: "excellent",
      department: "Technology",
      assignedTo: "",
      nextService: isoDaysFromNow(180),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 4 docks"),
    }),
    seedInv({
      id: "oa-inv-7",
      assetTag: "INV-5107",
      name: "Courier packaging (battery UN3480 kits)",
      category: "Packaging",
      manufacturer: "Labelmaster",
      model: "UN3480 lithium shipper kit",
      serialNumber: "PKG-HOU-07",
      purchaseDate: isoDaysFromNow(-20),
      purchaseCost: "$980",
      warrantyExpiry: "",
      currentValue: "$860",
      location: "Houston HQ · mail room",
      status: "operational",
      condition: "excellent",
      department: "Logistics",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 10 kits · US + international hazmat"),
    }),
    seedInv({
      id: "oa-inv-8",
      assetTag: "INV-5108",
      name: "Propulsion ESC spares (100A)",
      category: "Propulsion",
      manufacturer: "Aero ESC Co",
      model: "100A FOC ESC",
      serialNumber: "ESC-HOU-08",
      purchaseDate: isoDaysFromNow(-35),
      purchaseCost: "$3,600",
      warrantyExpiry: isoDaysFromNow(280),
      currentValue: "$3,200",
      location: "Flight Test Bay · stores",
      status: "maintenance",
      condition: "fair",
      department: "Propulsion",
      assignedTo: "",
      nextService: isoDaysFromNow(7),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 2 units · firmware burn-in pending"),
    }),
  ];

  return {
    assets,
    activity: [
      {
        id: "act-oa-inv-1",
        at: isoDaysFromNow(0),
        label: "OnwardAir inventory loaded",
        detail:
          "Houston HQ / lab spares — battery cells, composites, avionics, PPE · USD valuation",
      },
    ],
  };
}

export type OaProcurementMockState = {
  suppliers: SupplierRecord[];
  requisitions: PurchaseRequisition[];
  purchaseOrders: PurchaseOrder[];
  goodsReceipts: GoodsReceipt[];
  invoiceMatches: SupplierInvoiceMatch[];
  approvalRules: ApprovalRule[];
  contracts: SupplierContract[];
  aiInsights: AiInsight[];
  integrations: IntegrationConnector[];
  rolePermissions: typeof DEFAULT_ROLE_PERMISSIONS;
  currentRole: keyof typeof DEFAULT_ROLE_PERMISSIONS;
  monthlyBudget: number;
};

/** Procurement seed — USD only, Houston aerospace suppliers. */
export function seedOnwardAirProcurementState(): OaProcurementMockState {
  const suppliers: SupplierRecord[] = [
    {
      id: "oa-sup-battery",
      companyName: "Gulf Coast Battery Systems",
      contacts: [
        {
          name: "Maria Chen",
          email: "maria@gulfcoastbattery.example",
          phone: "+1 713 555 0142",
          role: "Account Manager",
        },
      ],
      addresses: [
        {
          label: "Warehouse",
          line1: "4200 Energy Corridor Blvd",
          city: "Houston",
          country: "United States",
          postcode: "77042",
        },
      ],
      taxId: "US-EIN-82-4419021",
      paymentTerms: "Net 30",
      bankDetails: "Chase Business — 000987654321",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(200),
      contractExpiry: isoDaysFromNow(280),
      rating: 4.6,
      performanceScore: 92,
      onTimeDeliveryPct: 94,
      qualityScore: 93,
      priceCompetitiveness: 86,
      averageLeadTimeDays: 12,
      totalSpend: 68400,
      notes: "Li-ion cells, BMSs, and pack assembly fixtures for FLEX Pod.",
      documents: [],
      category: "Battery & Propulsion",
      currency: "USD",
      status: "active",
    },
    {
      id: "oa-sup-composites",
      companyName: "Toray Advanced Composites (US)",
      contacts: [
        {
          name: "James Okonkwo",
          email: "james.okonkwo@toray.example",
          phone: "+1 310 555 0198",
          role: "Sales Engineer",
        },
      ],
      addresses: [
        {
          label: "US Distribution",
          line1: "2100 Aviation Way",
          city: "Torrance",
          country: "United States",
          postcode: "90501",
        },
      ],
      taxId: "US-EIN-95-2201144",
      paymentTerms: "Net 45",
      bankDetails: "Bank of America — 004455667788",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(240),
      contractExpiry: isoDaysFromNow(320),
      rating: 4.8,
      performanceScore: 95,
      onTimeDeliveryPct: 91,
      qualityScore: 97,
      priceCompetitiveness: 78,
      averageLeadTimeDays: 18,
      totalSpend: 42600,
      notes: "Carbon prepreg and tooling materials for airframe skins.",
      documents: [],
      category: "Composites",
      currency: "USD",
      status: "active",
    },
    {
      id: "oa-sup-machine",
      companyName: "Ellington Precision Machine",
      contacts: [
        {
          name: "Tom Rivera",
          email: "tom@ellingtonprecision.example",
          phone: "+1 281 555 0177",
          role: "Shop Lead",
        },
      ],
      addresses: [
        {
          label: "Shop",
          line1: "16800 Space Center Blvd",
          city: "Houston",
          country: "United States",
          postcode: "77058",
        },
      ],
      taxId: "US-EIN-76-3302210",
      paymentTerms: "Net 15",
      bankDetails: "Frost Bank — 112233445566",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(160),
      contractExpiry: isoDaysFromNow(210),
      rating: 4.5,
      performanceScore: 90,
      onTimeDeliveryPct: 96,
      qualityScore: 94,
      priceCompetitiveness: 88,
      averageLeadTimeDays: 7,
      totalSpend: 31800,
      notes: "CNC machining of brackets, mounts, and ground-support fixtures.",
      documents: [],
      category: "Machine Shop",
      currency: "USD",
      status: "active",
    },
    {
      id: "oa-sup-avionics",
      companyName: "SkyLink Avionics Supply",
      contacts: [
        {
          name: "Priya Nair",
          email: "priya@skylinkavionics.example",
          phone: "+1 408 555 0112",
          role: "Account Executive",
        },
      ],
      addresses: [
        {
          label: "HQ",
          line1: "900 Innovation Dr",
          city: "San Jose",
          country: "United States",
          postcode: "95134",
        },
      ],
      taxId: "US-EIN-94-1188220",
      paymentTerms: "Net 30",
      bankDetails: "Wells Fargo — 009988776655",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(190),
      contractExpiry: isoDaysFromNow(260),
      rating: 4.4,
      performanceScore: 89,
      onTimeDeliveryPct: 88,
      qualityScore: 92,
      priceCompetitiveness: 82,
      averageLeadTimeDays: 14,
      totalSpend: 27400,
      notes: "Flight controllers, IMUs, and connector assemblies.",
      documents: [],
      category: "Avionics",
      currency: "USD",
      status: "active",
    },
    {
      id: "oa-sup-freight",
      companyName: "FedEx Freight · Houston",
      contacts: [
        {
          name: "Dispatch Desk",
          email: "hou.freight@fedex.example",
          phone: "+1 800 555 0133",
          role: "Dispatch",
        },
      ],
      addresses: [
        {
          label: "Houston Hub",
          line1: "16600 John F Kennedy Blvd",
          city: "Houston",
          country: "United States",
          postcode: "77032",
        },
      ],
      taxId: "US-EIN-71-0427000",
      paymentTerms: "Net 15",
      bankDetails: "FedEx corporate billing",
      preferred: false,
      insuranceExpiry: isoDaysFromNow(365),
      contractExpiry: isoDaysFromNow(365),
      rating: 4.2,
      performanceScore: 87,
      onTimeDeliveryPct: 93,
      qualityScore: 90,
      priceCompetitiveness: 80,
      averageLeadTimeDays: 2,
      totalSpend: 9200,
      notes: "Domestic inbound/outbound to Houston HQ and Ellington Field.",
      documents: [],
      category: "Logistics Services",
      currency: "USD",
      status: "active",
    },
    {
      id: "oa-sup-it",
      companyName: "CDW Business (US)",
      contacts: [
        {
          name: "Alex Brooks",
          email: "alex.brooks@cdw.example",
          phone: "+1 800 555 0190",
          role: "Account Manager",
        },
      ],
      addresses: [
        {
          label: "US Sales",
          line1: "200 N Milwaukee Ave",
          city: "Vernon Hills",
          country: "United States",
          postcode: "60061",
        },
      ],
      taxId: "US-EIN-36-3310460",
      paymentTerms: "Net 30",
      bankDetails: "JPMorgan Chase — 001122334455",
      preferred: false,
      insuranceExpiry: isoDaysFromNow(300),
      contractExpiry: isoDaysFromNow(340),
      rating: 4.3,
      performanceScore: 88,
      onTimeDeliveryPct: 95,
      qualityScore: 91,
      priceCompetitiveness: 85,
      averageLeadTimeDays: 5,
      totalSpend: 24600,
      notes: "Engineering laptops, docks, and monitors for Houston HQ.",
      documents: [],
      category: "IT Hardware",
      currency: "USD",
      status: "active",
    },
  ];

  const requisitions: PurchaseRequisition[] = [
    {
      id: "oa-req-1",
      requestNumber: "PR-2026-4001",
      requestDate: isoDaysFromNow(-4),
      requestedBy: "Elena Vasquez",
      department: "Propulsion",
      costCentre: "OPS-HOU",
      priority: "high",
      requiredDate: isoDaysFromNow(18),
      businessJustification:
        "Additional pouch cells for FLEX Pod pack A flight-test spare set.",
      budgetCode: "BUD-PROP-26",
      status: "manager_approval",
      lines: [
        line({
          item: "INR21700-50E pouch cells (lot)",
          sku: "CELL-50E-80",
          quantity: 80,
          unitPrice: 42,
          preferredSupplierId: "oa-sup-battery",
          preferredSupplierName: "Gulf Coast Battery Systems",
        }),
      ],
      attachments: [],
      approvalHistory: [
        {
          id: uid("ap"),
          at: isoDaysFromNow(-4),
          actor: "Elena Vasquez",
          role: "employee",
          action: "submitted",
          note: "Submitted for manager approval",
        },
      ],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-4),
      updatedAt: isoDaysFromNow(-4),
    },
    {
      id: "oa-req-2",
      requestNumber: "PR-2026-3995",
      requestDate: isoDaysFromNow(-14),
      requestedBy: "Marcus Hale",
      department: "Structures",
      costCentre: "OPS-HOU",
      priority: "normal",
      requiredDate: isoDaysFromNow(5),
      businessJustification: "Prepreg restock for skin layup campaign.",
      budgetCode: "BUD-STR-26",
      status: "po_created",
      lines: [
        line({
          item: "T700 carbon prepreg roll",
          sku: "CF-T700-12K",
          quantity: 2,
          unitPrice: 4100,
          preferredSupplierId: "oa-sup-composites",
          preferredSupplierName: "Toray Advanced Composites (US)",
        }),
      ],
      attachments: [],
      approvalHistory: [
        {
          id: uid("ap"),
          at: isoDaysFromNow(-14),
          actor: "Marcus Hale",
          role: "employee",
          action: "submitted",
          note: "Submitted",
        },
        {
          id: uid("ap"),
          at: isoDaysFromNow(-12),
          actor: "Scott Parazynski",
          role: "department_manager",
          action: "approved",
          note: "Approved — prototype schedule critical",
        },
      ],
      linkedPoId: "oa-po-2",
      createdAt: isoDaysFromNow(-14),
      updatedAt: isoDaysFromNow(-10),
    },
    {
      id: "oa-req-3",
      requestNumber: "PR-2026-3988",
      requestDate: isoDaysFromNow(-22),
      requestedBy: "Priya Desai",
      department: "Avionics",
      costCentre: "OPS-HOU",
      priority: "normal",
      requiredDate: isoDaysFromNow(-3),
      businessJustification: "IMU + connector kit for flight controller bench.",
      budgetCode: "BUD-AV-26",
      status: "po_created",
      lines: [
        line({
          item: "IMU + MIL connector kit",
          sku: "AV-IMU-KIT",
          quantity: 4,
          unitPrice: 890,
          preferredSupplierId: "oa-sup-avionics",
          preferredSupplierName: "SkyLink Avionics Supply",
        }),
      ],
      attachments: [],
      approvalHistory: [
        {
          id: uid("ap"),
          at: isoDaysFromNow(-22),
          actor: "Priya Desai",
          role: "employee",
          action: "submitted",
          note: "Submitted",
        },
        {
          id: uid("ap"),
          at: isoDaysFromNow(-20),
          actor: "Scott Parazynski",
          role: "department_manager",
          action: "approved",
          note: "Approved",
        },
      ],
      linkedPoId: "oa-po-3",
      createdAt: isoDaysFromNow(-22),
      updatedAt: isoDaysFromNow(-16),
    },
    {
      id: "oa-req-4",
      requestNumber: "PR-2026-4004",
      requestDate: isoDaysFromNow(-1),
      requestedBy: "Jordan Lee",
      department: "Technology",
      costCentre: "OPS-HOU",
      priority: "normal",
      requiredDate: isoDaysFromNow(21),
      businessJustification: "Laptop refresh for two new Houston engineering hires.",
      budgetCode: "BUD-IT-26",
      status: "submitted",
      lines: [
        line({
          item: "Dell Precision 5690 Laptop",
          sku: "DELL-P5690",
          quantity: 2,
          unitPrice: 2890,
          preferredSupplierId: "oa-sup-it",
          preferredSupplierName: "CDW Business (US)",
        }),
      ],
      attachments: [],
      approvalHistory: [
        {
          id: uid("ap"),
          at: isoDaysFromNow(-1),
          actor: "Jordan Lee",
          role: "employee",
          action: "submitted",
          note: "Submitted",
        },
      ],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-1),
      updatedAt: isoDaysFromNow(-1),
    },
  ];

  const poLines2 = [
    line({
      item: "T700 carbon prepreg roll",
      sku: "CF-T700-12K",
      quantity: 2,
      unitPrice: 4100,
      preferredSupplierId: "oa-sup-composites",
      preferredSupplierName: "Toray Advanced Composites (US)",
    }),
  ];
  const totals2 = calcPoTotals(poLines2);

  const poLines3 = [
    line({
      item: "IMU + MIL connector kit",
      sku: "AV-IMU-KIT",
      quantity: 4,
      unitPrice: 890,
      preferredSupplierId: "oa-sup-avionics",
      preferredSupplierName: "SkyLink Avionics Supply",
    }),
  ];
  const totals3 = calcPoTotals(poLines3);

  const poLines1 = [
    line({
      item: "Motor mount CNC set (Al 7075)",
      sku: "CNC-MM-7075",
      quantity: 6,
      unitPrice: 420,
      preferredSupplierId: "oa-sup-machine",
      preferredSupplierName: "Ellington Precision Machine",
    }),
  ];
  const totals1 = calcPoTotals(poLines1);

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "oa-po-1",
      poNumber: "PO-2026-5101",
      supplierId: "oa-sup-machine",
      supplierName: "Ellington Precision Machine",
      supplierContact: "Tom Rivera <tom@ellingtonprecision.example>",
      deliveryAddress: "OnwardAir HQ · Houston, TX 77058",
      billingAddress: "OnwardAir Finance · Houston, TX",
      currency: "USD",
      paymentTerms: "Net 15",
      expectedDelivery: isoDaysFromNow(8),
      status: "sent",
      requisitionId: null,
      lines: poLines1,
      notes: "Prototype motor mounts — flight-test bay receiving.",
      ...totals1,
      emailedAt: isoDaysFromNow(-2),
      createdAt: isoDaysFromNow(-3),
      updatedAt: isoDaysFromNow(-2),
    },
    {
      id: "oa-po-2",
      poNumber: "PO-2026-5094",
      supplierId: "oa-sup-composites",
      supplierName: "Toray Advanced Composites (US)",
      supplierContact: "James Okonkwo <james.okonkwo@toray.example>",
      deliveryAddress: "OnwardAir Lab · Houston, TX 77058",
      billingAddress: "OnwardAir Finance · Houston, TX",
      currency: "USD",
      paymentTerms: "Net 45",
      expectedDelivery: isoDaysFromNow(-2),
      status: "received",
      requisitionId: "oa-req-2",
      lines: poLines2,
      notes: "Cold-chain delivery confirmed · freezer logged.",
      ...totals2,
      emailedAt: isoDaysFromNow(-12),
      createdAt: isoDaysFromNow(-12),
      updatedAt: isoDaysFromNow(-2),
    },
    {
      id: "oa-po-3",
      poNumber: "PO-2026-5088",
      supplierId: "oa-sup-avionics",
      supplierName: "SkyLink Avionics Supply",
      supplierContact: "Priya Nair <priya@skylinkavionics.example>",
      deliveryAddress: "OnwardAir Lab · Houston, TX 77058",
      billingAddress: "OnwardAir Finance · Houston, TX",
      currency: "USD",
      paymentTerms: "Net 30",
      expectedDelivery: isoDaysFromNow(-8),
      status: "received",
      requisitionId: "oa-req-3",
      lines: poLines3,
      notes: "Received into avionics rack stores.",
      ...totals3,
      emailedAt: isoDaysFromNow(-18),
      createdAt: isoDaysFromNow(-18),
      updatedAt: isoDaysFromNow(-8),
    },
  ];

  const goodsReceipts: GoodsReceipt[] = [
    {
      id: "oa-gr-2",
      receiptNumber: "GR-2026-5094",
      poId: "oa-po-2",
      poNumber: "PO-2026-5094",
      supplierName: "Toray Advanced Composites (US)",
      deliveryDate: isoDaysFromNow(-2),
      receivedBy: "Marcus Hale",
      lines: poLines2.map((l) => ({
        lineId: l.id,
        item: l.item,
        orderedQty: l.quantity,
        receivedQty: l.quantity,
        damagedQty: 0,
        backOrderQty: 0,
      })),
      photos: [],
      notes: "Temperature logger OK",
      inventoryUpdated: true,
      createdAt: isoDaysFromNow(-2),
    },
    {
      id: "oa-gr-3",
      receiptNumber: "GR-2026-5088",
      poId: "oa-po-3",
      poNumber: "PO-2026-5088",
      supplierName: "SkyLink Avionics Supply",
      deliveryDate: isoDaysFromNow(-8),
      receivedBy: "Priya Desai",
      lines: poLines3.map((l) => ({
        lineId: l.id,
        item: l.item,
        orderedQty: l.quantity,
        receivedQty: l.quantity,
        damagedQty: 0,
        backOrderQty: 0,
      })),
      photos: [],
      notes: "",
      inventoryUpdated: true,
      createdAt: isoDaysFromNow(-8),
    },
  ];

  const invoiceMatches: SupplierInvoiceMatch[] = [
    {
      id: "oa-inv-match-2",
      invoiceNumber: "INV-TORAY-88421",
      supplierId: "oa-sup-composites",
      supplierName: "Toray Advanced Composites (US)",
      poId: "oa-po-2",
      poNumber: "PO-2026-5094",
      receiptId: "oa-gr-2",
      receiptNumber: "GR-2026-5094",
      invoiceDate: isoDaysFromNow(-1),
      invoiceTotal: totals2.grandTotal,
      poTotal: totals2.grandTotal,
      receiptTotal: totals2.grandTotal,
      currency: "USD",
      matchStatus: "matched",
      mismatches: [],
      status: "approved",
      createdAt: isoDaysFromNow(-1),
    },
  ];

  const approvalRules: ApprovalRule[] = [
    {
      id: "oa-rule-1",
      name: "Manager under $5,000",
      minValue: 0,
      maxValue: 5000,
      department: "any",
      businessUnit: "any",
      costCentre: "any",
      project: "any",
      levels: [{ level: 1, role: "department_manager", label: "Department Manager" }],
      active: true,
    },
    {
      id: "oa-rule-2",
      name: "Finance $5,000–$25,000",
      minValue: 5000,
      maxValue: 25000,
      department: "any",
      businessUnit: "any",
      costCentre: "any",
      project: "any",
      levels: [
        { level: 1, role: "department_manager", label: "Department Manager" },
        { level: 2, role: "finance", label: "Finance" },
      ],
      active: true,
    },
  ];

  const contracts: SupplierContract[] = [
    {
      id: "oa-con-1",
      title: "Battery cells MSA 2026",
      supplierId: "oa-sup-battery",
      supplierName: "Gulf Coast Battery Systems",
      contractValue: 120000,
      currency: "USD",
      startDate: isoDaysFromNow(-120),
      renewalDate: isoDaysFromNow(240),
      noticePeriodDays: 30,
      owner: "Elena Vasquez",
      status: "active",
      documents: [],
      reminderSent: false,
      notes: "Volume pricing for FLEX Pod pack campaigns",
    },
    {
      id: "oa-con-2",
      title: "Composites supply agreement",
      supplierId: "oa-sup-composites",
      supplierName: "Toray Advanced Composites (US)",
      contractValue: 85000,
      currency: "USD",
      startDate: isoDaysFromNow(-90),
      renewalDate: isoDaysFromNow(270),
      noticePeriodDays: 45,
      owner: "Marcus Hale",
      status: "active",
      documents: [],
      reminderSent: false,
      notes: "Cold-chain SLAs included",
    },
  ];

  const aiInsights: AiInsight[] = [
    {
      id: "oa-ai-1",
      kind: "replenishment",
      title: "PPE kits approaching reorder point",
      detail: "Bay locker stock at 18 kits — reorder recommended below 8.",
      confidence: 0.82,
      actionLabel: "Open inventory INV-5105",
      relatedIds: ["oa-inv-5"],
      createdAt: isoDaysFromNow(0),
    },
    {
      id: "oa-ai-2",
      kind: "preferred_supplier",
      title: "Prefer Gulf Coast Battery for cell lots",
      detail: "On-time 94% · Houston lead time beats West Coast options by ~6 days.",
      confidence: 0.9,
      actionLabel: "Apply preferred supplier",
      relatedIds: ["oa-sup-battery"],
      createdAt: isoDaysFromNow(-1),
    },
  ];
  const integrations: IntegrationConnector[] = [
    {
      id: "oa-int-qbo",
      platform: "QuickBooks",
      status: "connected",
      lastSyncAt: isoDaysFromNow(-1),
      syncPurchaseOrders: true,
      syncInvoices: true,
      notes: "POs and supplier bills sync nightly · USD.",
    },
    {
      id: "oa-int-xero",
      platform: "Xero",
      status: "available",
      lastSyncAt: null,
      syncPurchaseOrders: true,
      syncInvoices: true,
      notes: "",
    },
  ];

  return {
    suppliers,
    requisitions,
    purchaseOrders,
    goodsReceipts,
    invoiceMatches,
    approvalRules,
    contracts,
    aiInsights,
    integrations,
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    currentRole: "purchasing_officer",
    monthlyBudget: 75000,
  };
}

/**
 * Logistics: 5 US packages in/out of Houston + 2 international.
 */
export const ONWARDAIR_LOGISTICS_SHIPMENTS: LogisticsShipment[] = [
  {
    id: "oa-shp-us-in-1",
    trackingNumber: "7946OA1100112233",
    direction: "inbound",
    status: "In transit",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/",
    sentAt: new Date(Date.now() - 1.5 * 86400000).toISOString(),
    eta: new Date(Date.now() + 0.8 * 86400000).toISOString(),
    origin: "Gulf Coast Battery Systems · Houston Energy Corridor",
    destination: "OnwardAir HQ · Houston, TX 77058",
    recipient: "Propulsion receiving · Houston Lab",
    sender: "Gulf Coast Battery Systems",
    sentBy: "Elena Vasquez",
    contents: "Li-ion pouch cell lot (80) · UN3480 documented",
    weightKg: 22.4,
    featured: true,
  },
  {
    id: "oa-shp-us-in-2",
    trackingNumber: "1ZOA99101234567890",
    direction: "inbound",
    status: "Out for delivery",
    carrier: "UPS",
    carrierTrackingUrl: "https://www.ups.com/track",
    sentAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    eta: new Date(Date.now() + 0.3 * 86400000).toISOString(),
    origin: "SkyLink Avionics Supply · San Jose, CA",
    destination: "OnwardAir Lab · Houston, TX 77058",
    recipient: "Avionics rack · Priya Desai",
    sender: "SkyLink Avionics Supply",
    sentBy: "Priya Desai",
    contents: "IMU + MIL connector kits (×4)",
    weightKg: 6.8,
  },
  {
    id: "oa-shp-us-out-1",
    trackingNumber: "7946OA2200334455",
    direction: "outbound",
    status: "In transit",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/",
    sentAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    eta: new Date(Date.now() + 1 * 86400000).toISOString(),
    origin: "OnwardAir HQ · Houston, TX",
    destination: "Partner demo desk · Dallas, TX",
    recipient: "Airport ops partner · DFW",
    sender: "OnwardAir Logistics",
    sentBy: "Ops Coordinator",
    contents: "Ground-support fixture samples + briefing packs",
    weightKg: 11.2,
  },
  {
    id: "oa-shp-us-out-2",
    trackingNumber: "1ZOA88202345678901",
    direction: "outbound",
    status: "Scheduled",
    carrier: "UPS",
    carrierTrackingUrl: "https://www.ups.com/track",
    sentAt: new Date(Date.now()).toISOString(),
    eta: new Date(Date.now() + 2 * 86400000).toISOString(),
    origin: "OnwardAir HQ · Houston, TX",
    destination: "Supplier QA · Denver, CO",
    recipient: "Machine shop QA receiving",
    sender: "OnwardAir Logistics",
    sentBy: "Marcus Hale",
    contents: "CNC motor-mount first-article returns for inspection",
    weightKg: 8.5,
  },
  {
    id: "oa-shp-us-out-3",
    trackingNumber: "7946OA3300556677",
    direction: "outbound",
    status: "Delivered",
    carrier: "FedEx",
    carrierTrackingUrl: "https://www.fedex.com/fedextrack/",
    sentAt: new Date(Date.now() - 5 * 86400000).toISOString(),
    eta: new Date(Date.now() - 2 * 86400000).toISOString(),
    origin: "OnwardAir HQ · Houston, TX",
    destination: "Counsel desk · Austin, TX",
    recipient: "IP counsel · Austin",
    sender: "OnwardAir Logistics",
    sentBy: "Company Secretary",
    contents: "Executed NDA / supplier diligence originals",
    weightKg: 1.4,
  },
  {
    id: "oa-shp-intl-in-1",
    trackingNumber: "JD0146000OA8765432",
    direction: "inbound",
    status: "Customs hold",
    carrier: "DHL",
    carrierTrackingUrl: "https://www.dhl.com/us-en/home/tracking.html",
    sentAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    eta: new Date(Date.now() + 1.5 * 86400000).toISOString(),
    origin: "Toray Advanced Composites · Nagoya, Japan",
    destination: "OnwardAir Lab · Houston, TX 77058",
    recipient: "Structures · cold store",
    sender: "Toray Advanced Composites",
    sentBy: "Marcus Hale",
    contents: "International — T700 prepreg rolls (cold chain) · Japan → Houston",
    weightKg: 38.0,
    notes: "IAEA/hazmat not applicable · freezer transfer on clear",
  },
  {
    id: "oa-shp-intl-out-1",
    trackingNumber: "JD0146000OA1122334",
    direction: "outbound",
    status: "In transit",
    carrier: "DHL",
    carrierTrackingUrl: "https://www.dhl.com/us-en/home/tracking.html",
    sentAt: new Date(Date.now() - 2.5 * 86400000).toISOString(),
    eta: new Date(Date.now() + 2 * 86400000).toISOString(),
    origin: "OnwardAir HQ · Houston, TX",
    destination: "Partner briefing · Dubai Aerospace Hub, UAE",
    recipient: "MENA partner receiving",
    sender: "OnwardAir Logistics",
    sentBy: "Business Development",
    contents: "International — FLEX Pod scale model + technical brief binders",
    weightKg: 14.6,
  },
];

export const FEATURED_HOUSTON_ROUTE: FeaturedRouteSnapshot = {
  shipmentId: "oa-shp-us-in-1",
  label: "Energy Corridor → Houston HQ",
  currentLeg: "ground",
  progressPct: 68,
  currentLocationLabel: "I-10 East — approaching Clear Lake",
  origin: { name: "Energy Corridor", lat: 29.7766, lng: -95.6345 },
  destination: { name: "Houston HQ", lat: 29.6073, lng: -95.158 },
  route: [
    { lat: 29.7766, lng: -95.6345 },
    { lat: 29.72, lng: -95.45 },
    { lat: 29.66, lng: -95.3 },
    { lat: 29.6073, lng: -95.158 },
  ],
  currentPosition: { lat: 29.66, lng: -95.3 },
};

export function getOaOperationsDashboardSummary(): OaOperationsDashboardSummary {
  const assets = createOnwardAirAssetRegistry().assets;
  const inventory = seedOnwardAirInventoryState();
  const procurement = seedOnwardAirProcurementState();
  const shipments = ONWARDAIR_LOGISTICS_SHIPMENTS;

  const openPoStatuses = new Set(["draft", "sent", "acknowledged", "partially_received"]);
  const pendingStatuses = new Set([
    "submitted",
    "manager_approval",
    "finance_approval",
    "purchasing",
  ]);
  const activeShipmentStatuses = new Set([
    "In transit",
    "Out for delivery",
    "Awaiting pickup",
    "Customs hold",
    "Scheduled",
  ]);

  const spendMtdUsd = procurement.purchaseOrders
    .filter(
      (po) =>
        po.status === "sent" ||
        po.status === "received" ||
        po.status === "partially_received" ||
        po.status === "invoiced",
    )
    .reduce((sum, po) => sum + (po.grandTotal || 0), 0);

  const internationalIds = new Set(["oa-shp-intl-in-1", "oa-shp-intl-out-1"]);

  return {
    assetsTotal: assets.length,
    assetsInService: assets.filter(
      (a) => a.operationalStatus === "In Service" || a.operationalStatus === "Active Licence",
    ).length,
    assetsMaintenance: assets.filter((a) => a.operationalStatus === "Maintenance").length,
    inventoryTotal: inventory.assets.length,
    inventoryOperational: inventory.assets.filter((a) => a.status === "operational").length,
    inventoryLowStockHints: inventory.assets.filter((a) =>
      a.notes.some((n) => /low stock|reorder/i.test(n.text)),
    ).length,
    openPurchaseOrders: procurement.purchaseOrders.filter((po) =>
      openPoStatuses.has(po.status),
    ).length,
    pendingApprovals: procurement.requisitions.filter((r) =>
      pendingStatuses.has(r.status),
    ).length,
    spendMtdUsd,
    monthlyBudgetUsd: procurement.monthlyBudget,
    suppliersActive: procurement.suppliers.filter((s) => s.status === "active").length,
    shipmentsActive: shipments.filter((s) => activeShipmentStatuses.has(s.status)).length,
    shipmentsInbound: shipments.filter((s) => s.direction === "inbound").length,
    shipmentsOutbound: shipments.filter((s) => s.direction === "outbound").length,
    shipmentsInternational: shipments.filter((s) => internationalIds.has(s.id)).length,
    featuredRouteLabel: FEATURED_HOUSTON_ROUTE.label,
  };
}
