/**
 * Client-side Inventory Management mock store for demos.
 * Future: swap selectors/mutations for GET/POST /api/inventory/... endpoints.
 */

import type {
  InventoryActivityItem,
  InventoryAsset,
  InventoryAssignment,
  InventoryDocument,
  InventoryHistoryEvent,
  InventoryNote,
  InventoryServiceRecord,
} from "@/lib/inventory-data";
import { emptyAssignment } from "@/lib/inventory-data";
import { tryGetDemoFixtures } from "@/lib/demo-enterprise/demo-mock-gate";

type Listener = () => void;

export type InventoryMockState = {
  assets: InventoryAsset[];
  activity: InventoryActivityItem[];
};

export function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function pushHistory(
  asset: InventoryAsset,
  label: string,
  detail: string,
): InventoryHistoryEvent[] {
  return [{ id: uid("hist"), at: isoDaysFromNow(0), label, detail }, ...asset.history].slice(
    0,
    30,
  );
}

function nextAssetTag(existing: InventoryAsset[]) {
  const nums = existing
    .map((a) => /^INV-(\d+)$/i.exec(a.assetTag)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const next = (nums.length ? Math.max(...nums) : 1000) + 1;
  return `INV-${next}`;
}

function seedAsset(
  partial: Omit<InventoryAsset, "id" | "archived"> & { id?: string; archived?: boolean },
): InventoryAsset {
  return {
    id: partial.id ?? uid("asset"),
    archived: partial.archived ?? false,
    ...partial,
  };
}

function seedAbhiInventoryState(): InventoryMockState {
  const stockNote = (text: string): InventoryNote[] => [
    {
      id: uid("note"),
      at: isoDaysFromNow(0),
      author: "Ops",
      kind: "operational",
      text,
    },
  ];

  const assets = [
    seedAsset({
      id: "abhi-inv-1",
      assetTag: "INV-3001",
      name: "ABHI Membership Brochures (pack of 100)",
      category: "Other",
      manufacturer: "ABHI Print",
      model: "MEM-BROCHURE-2026",
      serialNumber: "BROCH-LDN-01",
      purchaseDate: isoDaysFromNow(-45),
      purchaseCost: "£480",
      warrantyExpiry: "",
      currentValue: "£420",
      location: "London stores",
      status: "operational",
      condition: "excellent",
      department: "Membership",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [
        {
          id: uid("hist"),
          at: isoDaysFromNow(-2),
          label: "Stock received",
          detail: "Reprint batch · 12 packs",
        },
      ],
      notes: stockNote("On hand: 9 packs · reserved for WHX pavilion"),
    }),
    seedAsset({
      id: "abhi-inv-2",
      assetTag: "INV-3002",
      name: "Event name badges (box of 250)",
      category: "Other",
      manufacturer: "Badgemaster",
      model: "PVC-CR80",
      serialNumber: "BADGE-LDN-02",
      purchaseDate: isoDaysFromNow(-30),
      purchaseCost: "£210",
      warrantyExpiry: "",
      currentValue: "£190",
      location: "London stores",
      status: "operational",
      condition: "excellent",
      department: "Events",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 6 boxes · printer ribbons stored separately"),
    }),
    seedAsset({
      id: "abhi-inv-3",
      assetTag: "INV-3003",
      name: "Lanyards — ABHI branded (pack of 100)",
      category: "Other",
      manufacturer: "EventWear UK",
      model: "LANYARD-NAVY",
      serialNumber: "LANY-LDN-03",
      purchaseDate: isoDaysFromNow(-60),
      purchaseCost: "£160",
      warrantyExpiry: "",
      currentValue: "£140",
      location: "London stores",
      status: "operational",
      condition: "good",
      department: "Events",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 4 packs"),
    }),
    seedAsset({
      id: "abhi-inv-4",
      assetTag: "INV-3004",
      name: "A4 printer paper (reams × 5)",
      category: "Other",
      manufacturer: "Xerox",
      model: "Premier 80gsm",
      serialNumber: "PAPER-LDN-04",
      purchaseDate: isoDaysFromNow(-14),
      purchaseCost: "£42",
      warrantyExpiry: "",
      currentValue: "£38",
      location: "London admin cupboard",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 18 reams across HQ"),
    }),
    seedAsset({
      id: "abhi-inv-5",
      assetTag: "INV-3005",
      name: "Ballpoint pens (box of 50)",
      category: "Other",
      manufacturer: "Bic",
      model: "Cristal",
      serialNumber: "PEN-LDN-05",
      purchaseDate: isoDaysFromNow(-20),
      purchaseCost: "£18",
      warrantyExpiry: "",
      currentValue: "£15",
      location: "London admin cupboard",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 7 boxes"),
    }),
    seedAsset({
      id: "abhi-inv-6",
      assetTag: "INV-3006",
      name: "Sticky notes assortment",
      category: "Other",
      manufacturer: "Post-it",
      model: "Super Sticky Mixed",
      serialNumber: "NOTE-LDN-06",
      purchaseDate: isoDaysFromNow(-25),
      purchaseCost: "£24",
      warrantyExpiry: "",
      currentValue: "£20",
      location: "London admin cupboard",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 12 packs"),
    }),
    seedAsset({
      id: "abhi-inv-7",
      assetTag: "INV-3007",
      name: "Coffee beans — Fairtrade (1kg)",
      category: "Other",
      manufacturer: "Union Coffee",
      model: "House Blend",
      serialNumber: "COFFEE-LDN-07",
      purchaseDate: isoDaysFromNow(-7),
      purchaseCost: "£28",
      warrantyExpiry: "",
      currentValue: "£22",
      location: "London kitchen",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 6 kg · reorder at 2 kg"),
    }),
    seedAsset({
      id: "abhi-inv-8",
      assetTag: "INV-3008",
      name: "Tea bags — English Breakfast (box of 200)",
      category: "Other",
      manufacturer: "Twinings",
      model: "English Breakfast",
      serialNumber: "TEA-LDN-08",
      purchaseDate: isoDaysFromNow(-10),
      purchaseCost: "£14",
      warrantyExpiry: "",
      currentValue: "£12",
      location: "London kitchen",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 5 boxes"),
    }),
    seedAsset({
      id: "abhi-inv-9",
      assetTag: "INV-3009",
      name: "Bottled water (case of 24)",
      category: "Other",
      manufacturer: "Highland Spring",
      model: "500ml Still",
      serialNumber: "WATER-LDN-09",
      purchaseDate: isoDaysFromNow(-5),
      purchaseCost: "£9",
      warrantyExpiry: "",
      currentValue: "£8",
      location: "London kitchen",
      status: "operational",
      condition: "excellent",
      department: "Events",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 14 cases · boardroom + events"),
    }),
    seedAsset({
      id: "abhi-inv-10",
      assetTag: "INV-3010",
      name: "Cleaning wipes / hand sanitiser kit",
      category: "Other",
      manufacturer: "Diversey",
      model: "Office Hygiene Pack",
      serialNumber: "HYG-LDN-10",
      purchaseDate: isoDaysFromNow(-18),
      purchaseCost: "£36",
      warrantyExpiry: "",
      currentValue: "£30",
      location: "London facilities",
      status: "operational",
      condition: "good",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 8 kits"),
    }),
    seedAsset({
      id: "abhi-inv-11",
      assetTag: "INV-3011",
      name: "Toner cartridge — Brother HL-L8260CDW (CMYK set)",
      category: "IT Equipment",
      manufacturer: "Brother",
      model: "TN-421 CMYK",
      serialNumber: "TONER-LDN-11",
      purchaseDate: isoDaysFromNow(-40),
      purchaseCost: "£220",
      warrantyExpiry: isoDaysFromNow(300),
      currentValue: "£180",
      location: "London admin cupboard",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 2 full sets · black spare ×3"),
    }),
    seedAsset({
      id: "abhi-inv-12",
      assetTag: "INV-3012",
      name: "Visitor badge sleeves (pack of 100)",
      category: "Other",
      manufacturer: "Durable",
      model: "Hard Badge Holder",
      serialNumber: "SLEEVE-LDN-12",
      purchaseDate: isoDaysFromNow(-35),
      purchaseCost: "£45",
      warrantyExpiry: "",
      currentValue: "£40",
      location: "London reception",
      status: "operational",
      condition: "excellent",
      department: "Membership",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 3 packs"),
    }),
    seedAsset({
      id: "abhi-inv-13",
      assetTag: "INV-3013",
      name: "Working group folder packs",
      category: "Other",
      manufacturer: "ABHI Print",
      model: "WG-FOLDER-A4",
      serialNumber: "FOLDER-CAM-13",
      purchaseDate: isoDaysFromNow(-50),
      purchaseCost: "£95",
      warrantyExpiry: "",
      currentValue: "£80",
      location: "Cambridge office",
      status: "operational",
      condition: "good",
      department: "Policy",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 40 folders"),
    }),
    seedAsset({
      id: "abhi-inv-14",
      assetTag: "INV-3014",
      name: "Milk / oat milk (fridge stock)",
      category: "Other",
      manufacturer: "Various",
      model: "Fresh dairy & alt",
      serialNumber: "MILK-LDN-14",
      purchaseDate: isoDaysFromNow(-2),
      purchaseCost: "£16",
      warrantyExpiry: "",
      currentValue: "£12",
      location: "London kitchen",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("Weekly order · use-by monitored"),
    }),
    seedAsset({
      id: "abhi-inv-15",
      assetTag: "INV-3015",
      name: "Biscuits / meeting catering snacks",
      category: "Other",
      manufacturer: "Walkers / McVitie's",
      model: "Assorted",
      serialNumber: "SNACK-LDN-15",
      purchaseDate: isoDaysFromNow(-8),
      purchaseCost: "£32",
      warrantyExpiry: "",
      currentValue: "£28",
      location: "London kitchen",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 10 tins · boardroom stock"),
    }),
  ];

  return {
    assets,
    activity: [
      {
        id: "act-abhi-inv-1",
        at: isoDaysFromNow(0),
        label: "ABHI inventory loaded",
        detail: "Membership collaterals, badges, and office consumables · London / Cambridge",
      },
    ],
  };
}

function seedTalantonInventoryState(): InventoryMockState {
  const stockNote = (text: string): InventoryNote[] => [
    {
      id: uid("note"),
      at: isoDaysFromNow(0),
      author: "Ops",
      kind: "operational",
      text,
    },
  ];

  const assets = [
    seedAsset({
      id: "ti-inv-1",
      assetTag: "INV-4101",
      name: "A4 Letterhead (Talanton Impact)",
      category: "Office Supplies",
      manufacturer: "Nairobi Print Co",
      model: "TI Letterhead 500",
      serialNumber: "LH-NBO-01",
      purchaseDate: isoDaysFromNow(-45),
      purchaseCost: "$180",
      warrantyExpiry: "",
      currentValue: "$140",
      location: "Nairobi HQ stores",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 8 reams · board pack printing"),
    }),
    seedAsset({
      id: "ti-inv-2",
      assetTag: "INV-4102",
      name: "Board Pack Binders (A4)",
      category: "Office Supplies",
      manufacturer: "Office Depot",
      model: "Ring binder 25mm",
      serialNumber: "BIND-NBO-02",
      purchaseDate: isoDaysFromNow(-30),
      purchaseCost: "$95",
      warrantyExpiry: "",
      currentValue: "$80",
      location: "Nairobi HQ stores",
      status: "operational",
      condition: "good",
      department: "Governance",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 24 binders"),
    }),
    seedAsset({
      id: "ti-inv-3",
      assetTag: "INV-4103",
      name: "Visitor Lanyards + Cards",
      category: "Office Supplies",
      manufacturer: "BadgePro",
      model: "Visitor kit",
      serialNumber: "LANY-NBO-03",
      purchaseDate: isoDaysFromNow(-60),
      purchaseCost: "$120",
      warrantyExpiry: "",
      currentValue: "$90",
      location: "Nairobi reception",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 40 sets"),
    }),
    seedAsset({
      id: "ti-inv-4",
      assetTag: "INV-4104",
      name: "USB-C Docking Spares",
      category: "IT Equipment",
      manufacturer: "CalDigit",
      model: "TS4 spare pool",
      serialNumber: "DOCK-NBO-04",
      purchaseDate: isoDaysFromNow(-90),
      purchaseCost: "$1,200",
      warrantyExpiry: isoDaysFromNow(600),
      currentValue: "$980",
      location: "Nairobi IT cupboard",
      status: "operational",
      condition: "excellent",
      department: "Technology",
      assignedTo: "",
      nextService: isoDaysFromNow(120),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 3 docks"),
    }),
    seedAsset({
      id: "ti-inv-5",
      assetTag: "INV-4105",
      name: "Camera Battery + SD Card Kit",
      category: "IT Equipment",
      manufacturer: "Sony",
      model: "Field media kit",
      serialNumber: "CAMKIT-NBO-05",
      purchaseDate: isoDaysFromNow(-40),
      purchaseCost: "$310",
      warrantyExpiry: isoDaysFromNow(320),
      currentValue: "$280",
      location: "Field Kit locker",
      status: "operational",
      condition: "good",
      department: "Impact",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 2 kits · site visit storytelling"),
    }),
    seedAsset({
      id: "ti-inv-6",
      assetTag: "INV-4106",
      name: "Meeting Room Marker Packs",
      category: "Office Supplies",
      manufacturer: "Expo",
      model: "Whiteboard markers",
      serialNumber: "MRK-NBO-06",
      purchaseDate: isoDaysFromNow(-10),
      purchaseCost: "$48",
      warrantyExpiry: "",
      currentValue: "$40",
      location: "Nairobi boardroom",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 12 packs"),
    }),
    seedAsset({
      id: "ti-inv-7",
      assetTag: "INV-4107",
      name: "Courier Packaging (document envelopes)",
      category: "Office Supplies",
      manufacturer: "DHL Supply",
      model: "A4 document wallets",
      serialNumber: "PKG-NBO-07",
      purchaseDate: isoDaysFromNow(-15),
      purchaseCost: "$65",
      warrantyExpiry: "",
      currentValue: "$55",
      location: "Nairobi mail room",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [],
      notes: stockNote("On hand: 50 envelopes · US/UK shipments"),
    }),
  ];

  return {
    assets,
    activity: [
      {
        id: "act-ti-inv-1",
        at: isoDaysFromNow(0),
        label: "Talanton inventory loaded",
        detail: "Office supplies, board pack materials, and field media kits · Nairobi HQ",
      },
    ],
  };
}

function seedState(): InventoryMockState {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserWolfCentralSurface } =
        require("@/lib/wolf/wolf-surface") as typeof import("@/lib/wolf/wolf-surface");
      if (isBrowserWolfCentralSurface()) {
        return { assets: [], activity: [] };
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCustomerWorkspaceSurface } =
        require("@/lib/customer-workspace-surface") as typeof import("@/lib/customer-workspace-surface");
      if (isBrowserCustomerWorkspaceSurface()) {
        return { assets: [], activity: [] };
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        const { seedOnwardAirInventoryState } =
          require("@/lib/onwardair/operations-data") as typeof import("@/lib/onwardair/operations-data");
        return seedOnwardAirInventoryState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        return seedAbhiInventoryState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (isBrowserTalantonImpactSurface()) {
        return seedTalantonInventoryState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserSaecSurface } =
        require("@/lib/saec-surface") as typeof import("@/lib/saec-surface");
      if (isBrowserSaecSurface()) {
        const { buildSaecInventoryState } =
          require("@/lib/saec/demo/inventory-state") as typeof import("@/lib/saec/demo/inventory-state");
        return buildSaecInventoryState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCorpCentreSurface } =
        require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
      if (isBrowserCorpCentreSurface()) {
        const assets = [
          seedAsset({
            id: "cc-inv-1",
            assetTag: "INV-2001",
            name: "Cat6 Patch Lead Pack (50)",
            category: "IT Equipment",
            manufacturer: "Belkin",
            model: "CAT6-50PK",
            serialNumber: "BEL-CAT6-AU-01",
            purchaseDate: isoDaysFromNow(-90),
            purchaseCost: "AU$420",
            warrantyExpiry: isoDaysFromNow(640),
            currentValue: "AU$380",
            location: "Alexandria stores",
            status: "operational",
            condition: "excellent",
            department: "Operations",
            assignedTo: "",
            nextService: isoDaysFromNow(120),
            certificationExpiry: isoDaysFromNow(365),
            assignment: emptyAssignment(),
            services: [],
            documents: [],
            history: [
              {
                id: uid("hist"),
                at: isoDaysFromNow(0),
                label: "Stock received",
                detail: "Inbound from Sydney wholesaler · 50 units",
              },
            ],
            notes: [
              {
                id: uid("note"),
                at: isoDaysFromNow(0),
                author: "Ops",
                kind: "operational",
                text: "On hand: 42 · reserved for client installs",
              },
            ],
          }),
          seedAsset({
            id: "cc-inv-2",
            assetTag: "INV-2002",
            name: "Ubiquiti UniFi Access Point",
            category: "IT Equipment",
            manufacturer: "Ubiquiti",
            model: "U6-Pro",
            serialNumber: "U6P-STOCK-02",
            purchaseDate: isoDaysFromNow(-60),
            purchaseCost: "AU$289",
            warrantyExpiry: isoDaysFromNow(700),
            currentValue: "AU$260",
            location: "Alexandria stores",
            status: "operational",
            condition: "excellent",
            department: "Operations",
            assignedTo: "",
            nextService: isoDaysFromNow(90),
            certificationExpiry: isoDaysFromNow(400),
            assignment: emptyAssignment(),
            services: [],
            documents: [],
            history: [],
            notes: [
              {
                id: uid("note"),
                at: isoDaysFromNow(-2),
                author: "Mick",
                kind: "operational",
                text: "On hand: 8 · spare for Melbourne / Brisbane sites",
              },
            ],
          }),
          seedAsset({
            id: "cc-inv-3",
            assetTag: "INV-2003",
            name: "Dell Latitude 5540 (spare pool)",
            category: "IT Equipment",
            manufacturer: "Dell",
            model: "Latitude 5540",
            serialNumber: "DL5540-SPARE-03",
            purchaseDate: isoDaysFromNow(-120),
            purchaseCost: "AU$2,150",
            warrantyExpiry: isoDaysFromNow(900),
            currentValue: "AU$1,900",
            location: "Alexandria stores",
            status: "operational",
            condition: "good",
            department: "Technology",
            assignedTo: "",
            nextService: isoDaysFromNow(45),
            certificationExpiry: isoDaysFromNow(500),
            assignment: emptyAssignment(),
            services: [],
            documents: [],
            history: [],
            notes: [
              {
                id: uid("note"),
                at: isoDaysFromNow(-5),
                author: "Daniel",
                kind: "operational",
                text: "Hot-swap laptop pool · imaged with CorpCentre standard build",
              },
            ],
          }),
          seedAsset({
            id: "cc-inv-4",
            assetTag: "INV-2004",
            name: "Cisco SFP+ Transceiver Kit",
            category: "IT Equipment",
            manufacturer: "Cisco",
            model: "SFP-10G-SR",
            serialNumber: "SFP10G-AU-04",
            purchaseDate: isoDaysFromNow(-30),
            purchaseCost: "AU$640",
            warrantyExpiry: isoDaysFromNow(700),
            currentValue: "AU$640",
            location: "Alexandria stores",
            status: "operational",
            condition: "excellent",
            department: "Technology",
            assignedTo: "",
            nextService: isoDaysFromNow(180),
            certificationExpiry: isoDaysFromNow(365),
            assignment: emptyAssignment(),
            services: [],
            documents: [],
            history: [],
            notes: [
              {
                id: uid("note"),
                at: isoDaysFromNow(0),
                author: "Elias",
                kind: "operational",
                text: "On hand: 12 · for data centre patching",
              },
            ],
          }),
          seedAsset({
            id: "cc-inv-5",
            assetTag: "INV-2005",
            name: "APC Smart-UPS 1500VA",
            category: "IT Equipment",
            manufacturer: "APC",
            model: "SMT1500IC",
            serialNumber: "APC-UPS-AU-05",
            purchaseDate: isoDaysFromNow(-200),
            purchaseCost: "AU$1,120",
            warrantyExpiry: isoDaysFromNow(500),
            currentValue: "AU$900",
            location: "Melbourne office",
            status: "maintenance",
            condition: "fair",
            department: "Operations",
            assignedTo: "John Amoroso",
            nextService: isoDaysFromNow(10),
            certificationExpiry: isoDaysFromNow(90),
            assignment: {
              employee: "John Amoroso",
              department: "Operations",
              office: "Melbourne",
              project: "Office UPS refresh",
              issueDate: isoDaysFromNow(-14),
              expectedReturn: isoDaysFromNow(21),
            },
            services: [],
            documents: [],
            history: [],
            notes: [
              {
                id: uid("note"),
                at: isoDaysFromNow(-1),
                author: "John",
                kind: "operational",
                text: "Battery health check scheduled",
              },
            ],
          }),
          seedAsset({
            id: "cc-inv-6",
            assetTag: "INV-2006",
            name: "Starlink Mini Kit (field)",
            category: "IT Equipment",
            manufacturer: "SpaceX",
            model: "Starlink Mini",
            serialNumber: "SL-MINI-AU-06",
            purchaseDate: isoDaysFromNow(-40),
            purchaseCost: "AU$799",
            warrantyExpiry: isoDaysFromNow(690),
            currentValue: "AU$750",
            location: "Brisbane van",
            status: "operational",
            condition: "good",
            department: "Operations",
            assignedTo: "Mick Lenton",
            nextService: isoDaysFromNow(60),
            certificationExpiry: isoDaysFromNow(300),
            assignment: {
              employee: "Mick Lenton",
              department: "Operations",
              office: "Brisbane",
              project: "Remote site connectivity",
              issueDate: isoDaysFromNow(-20),
              expectedReturn: "",
            },
            services: [],
            documents: [],
            history: [],
            notes: [],
          }),
        ];
        return {
          assets,
          activity: [
            {
              id: uid("act"),
              at: isoDaysFromNow(0),
              label: "CorpCentre inventory loaded",
              detail: "IT services stock and field kit · Alexandria stores",
            },
          ],
        };
      }
    } catch {
      // Fall through.
    }
  }

  const fixtures = tryGetDemoFixtures();
  if (fixtures) {
    const officeById = new Map(fixtures.offices.map((office) => [office.id, office]));
    const stockAssets = fixtures.inventory.map((row, index) =>
      seedAsset({
        id: row.id,
        assetTag: row.sku,
        name: row.name,
        category: "IT Equipment",
        manufacturer: fixtures.company.tradingName,
        model: row.sku,
        serialNumber: `MAG-${row.sku}-${index + 1}`,
        purchaseDate: isoDaysFromNow(-200 - index),
        purchaseCost: "£1,200",
        warrantyExpiry: isoDaysFromNow(200),
        currentValue: "£900",
        location: row.location,
        status: "operational",
        condition: "good",
        department: "Operations",
        assignedTo: "",
        nextService: isoDaysFromNow(45 + index),
        certificationExpiry: isoDaysFromNow(180),
        assignment: emptyAssignment(),
        services: [],
        documents: [],
        history: [
          {
            id: uid("hist"),
            at: isoDaysFromNow(0),
            label: "Stock counted",
            detail: `${fixtures.tag} On hand: ${row.qty}`,
          },
        ],
        notes: [
          {
            id: uid("note"),
            at: isoDaysFromNow(0),
            author: "Operations",
            kind: "operational",
            text: `${fixtures.tag} Stock on hand: ${row.qty}`,
          },
        ],
      }),
    );
    const assignedAssets = fixtures.assets.slice(0, 40).map((row, index) => {
      const office = officeById.get(row.officeId);
      return seedAsset({
        id: row.id,
        assetTag: `LAP-${String(index + 1).padStart(4, "0")}`,
        name: row.name,
        category: "IT Equipment",
        manufacturer: "Apple",
        model: row.sku ?? "MacBook Pro",
        serialNumber: `MAG-LT-${index + 1}`,
        purchaseDate: isoDaysFromNow(-120 - index),
        purchaseCost: "£2,400",
        warrantyExpiry: isoDaysFromNow(400),
        currentValue: "£1,800",
        location: office?.city ?? "Manchester",
        status: "operational",
        condition: "excellent",
        department: "Consulting",
        assignedTo: row.assignedTo,
        nextService: isoDaysFromNow(60 + index),
        certificationExpiry: isoDaysFromNow(365),
        assignment: {
          employee: row.assignedTo,
          department: "Consulting",
          office: office?.city ?? "Manchester",
          project: "Client delivery",
          issueDate: isoDaysFromNow(-90),
          expectedReturn: "",
        },
        services: [],
        documents: [],
        history: [
          {
            id: uid("hist"),
            at: isoDaysFromNow(-90),
            label: "Assigned",
            detail: `Issued to ${row.assignedTo}`,
          },
        ],
        notes: [
          {
            id: uid("note"),
            at: isoDaysFromNow(-30),
            author: "IT",
            kind: "operational",
            text: `${fixtures.tag} Endpoint for ${row.assignedTo}`,
          },
        ],
      });
    });
    return {
      assets: [...stockAssets, ...assignedAssets],
      activity: [
        {
          id: "act-mag-inv-1",
          at: isoDaysFromNow(0),
          label: "Demo inventory loaded",
          detail: `${fixtures.company.tradingName} IT and stock register.`,
        },
      ],
    };
  }

  const assets: InventoryAsset[] = [
    seedAsset({
      id: "inv-dji-m350-bcn",
      assetTag: "INV-1001",
      name: "DJI Matrice 350 RTK",
      category: "Aircraft",
      manufacturer: "DJI",
      model: "Matrice 350 RTK",
      serialNumber: "M350-BCN-2024-0142",
      purchaseDate: isoDaysFromNow(-420),
      purchaseCost: "€28,400",
      warrantyExpiry: isoDaysFromNow(310),
      currentValue: "€24,200",
      location: "Barcelona",
      status: "operational",
      condition: "excellent",
      department: "Field Operations",
      assignedTo: "María García",
      nextService: isoDaysFromNow(22),
      certificationExpiry: isoDaysFromNow(45),
      assignment: {
        employee: "María García",
        department: "Field Operations",
        office: "Barcelona HQ",
        project: "Port survey Q3",
        issueDate: isoDaysFromNow(-14),
        expectedReturn: isoDaysFromNow(30),
      },
      services: [
        {
          id: "svc-1001-a",
          type: "inspection",
          date: isoDaysFromNow(-90),
          nextDue: isoDaysFromNow(22),
          provider: "Unit311 Technical",
          outcome: "Passed — gimbal calibration within tolerance",
          notes: "Propellers replaced",
          status: "completed",
        },
      ],
      documents: [
        {
          id: "doc-1001-a",
          kind: "manual",
          name: "M350_Operators_Manual.pdf",
          uploadedAt: isoDaysFromNow(-400),
        },
        {
          id: "doc-1001-b",
          kind: "certificate",
          name: "EASA_SORA_Class_C.pdf",
          uploadedAt: isoDaysFromNow(-60),
        },
      ],
      history: [
        {
          id: "hist-1001-a",
          at: isoDaysFromNow(-14),
          label: "Assigned",
          detail: "Issued to María García · Port survey Q3",
        },
        {
          id: "hist-1001-b",
          at: isoDaysFromNow(-90),
          label: "Inspection completed",
          detail: "Annual airframe inspection — passed",
        },
      ],
      notes: [
        {
          id: "note-1001-a",
          at: isoDaysFromNow(-7),
          author: "Hannes Weber",
          kind: "operational",
          text: "Primary survey aircraft for Barcelona coastal corridor.",
        },
      ],
    }),
    seedAsset({
      id: "inv-dji-m30t-pt",
      assetTag: "INV-1002",
      name: "DJI M30T Thermal",
      category: "Aircraft",
      manufacturer: "DJI",
      model: "M30T",
      serialNumber: "M30T-PT-2023-0088",
      purchaseDate: isoDaysFromNow(-540),
      purchaseCost: "€19,800",
      warrantyExpiry: isoDaysFromNow(190),
      currentValue: "€16,400",
      location: "Porto",
      status: "maintenance",
      condition: "good",
      department: "Technical",
      assignedTo: "",
      nextService: isoDaysFromNow(5),
      certificationExpiry: isoDaysFromNow(38),
      assignment: emptyAssignment(),
      services: [
        {
          id: "svc-1002-a",
          type: "repair",
          date: isoDaysFromNow(-2),
          nextDue: isoDaysFromNow(5),
          provider: "DJI Authorised Service",
          outcome: "Thermal sensor recalibration in progress",
          notes: "Awaiting replacement gimbal board",
          status: "scheduled",
        },
      ],
      documents: [
        {
          id: "doc-1002-a",
          kind: "invoice",
          name: "DJI_Service_Order_8842.pdf",
          uploadedAt: isoDaysFromNow(-2),
        },
      ],
      history: [
        {
          id: "hist-1002-a",
          at: isoDaysFromNow(-2),
          label: "Sent to maintenance",
          detail: "Thermal drift detected during Porto pipeline inspection",
        },
      ],
      notes: [
        {
          id: "note-1002-a",
          at: isoDaysFromNow(-1),
          author: "Carlos Mendoza",
          kind: "issue",
          text: "Grounded until thermal calibration certificate renewed.",
        },
      ],
    }),
    seedAsset({
      id: "inv-batt-tb60-01",
      assetTag: "INV-1003",
      name: "TB60 Battery Pack (Pair)",
      category: "Battery",
      manufacturer: "DJI",
      model: "TB60",
      serialNumber: "TB60-BCN-4421",
      purchaseDate: isoDaysFromNow(-180),
      purchaseCost: "€1,240",
      warrantyExpiry: isoDaysFromNow(550),
      currentValue: "€980",
      location: "Barcelona",
      status: "operational",
      condition: "good",
      department: "Field Operations",
      assignedTo: "María García",
      nextService: isoDaysFromNow(55),
      certificationExpiry: "",
      assignment: {
        employee: "María García",
        department: "Field Operations",
        office: "Barcelona HQ",
        project: "Port survey Q3",
        issueDate: isoDaysFromNow(-14),
        expectedReturn: isoDaysFromNow(30),
      },
      services: [],
      documents: [
        {
          id: "doc-1003-a",
          kind: "warranty",
          name: "TB60_Warranty_2025.pdf",
          uploadedAt: isoDaysFromNow(-175),
        },
      ],
      history: [
        {
          id: "hist-1003-a",
          at: isoDaysFromNow(-14),
          label: "Issued with aircraft",
          detail: "Paired with INV-1001 for field deployment",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-batt-tb60-02",
      assetTag: "INV-1004",
      name: "TB60 Battery Pack (Pair)",
      category: "Battery",
      manufacturer: "DJI",
      model: "TB60",
      serialNumber: "TB60-BCN-4422",
      purchaseDate: isoDaysFromNow(-180),
      purchaseCost: "€1,240",
      warrantyExpiry: isoDaysFromNow(550),
      currentValue: "€980",
      location: "Barcelona",
      status: "operational",
      condition: "excellent",
      department: "Logistics",
      assignedTo: "",
      nextService: isoDaysFromNow(120),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [
        {
          id: "hist-1004-a",
          at: isoDaysFromNow(-30),
          label: "Returned to stock",
          detail: "Checked in after Oxford training exercise",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-gs-dji-dock",
      assetTag: "INV-1005",
      name: "DJI Dock 2 Ground Station",
      category: "Ground Station",
      manufacturer: "DJI",
      model: "Dock 2",
      serialNumber: "DOCK2-PT-0012",
      purchaseDate: isoDaysFromNow(-300),
      purchaseCost: "€42,500",
      warrantyExpiry: isoDaysFromNow(430),
      currentValue: "€38,000",
      location: "Porto",
      status: "operational",
      condition: "good",
      department: "Operations",
      assignedTo: "Paul Fotheringham",
      nextService: isoDaysFromNow(18),
      certificationExpiry: isoDaysFromNow(52),
      assignment: {
        employee: "Paul Fotheringham",
        department: "Operations",
        office: "Porto Field Hub",
        project: "Automated corridor monitoring",
        issueDate: isoDaysFromNow(-60),
        expectedReturn: "",
      },
      services: [
        {
          id: "svc-1005-a",
          type: "calibration",
          date: isoDaysFromNow(-120),
          nextDue: isoDaysFromNow(18),
          provider: "DJI Enterprise",
          outcome: "RTK base link verified",
          notes: "",
          status: "completed",
        },
      ],
      documents: [
        {
          id: "doc-1005-a",
          kind: "manual",
          name: "Dock2_Installation_Guide.pdf",
          uploadedAt: isoDaysFromNow(-295),
        },
        {
          id: "doc-1005-b",
          kind: "certificate",
          name: "Site_Safety_Assessment_Porto.pdf",
          uploadedAt: isoDaysFromNow(-90),
        },
      ],
      history: [
        {
          id: "hist-1005-a",
          at: isoDaysFromNow(-60),
          label: "Site commissioning",
          detail: "Porto automated monitoring corridor live",
        },
      ],
      notes: [
        {
          id: "note-1005-a",
          at: isoDaysFromNow(-10),
          author: "Paul Fotheringham",
          kind: "operational",
          text: "Primary dock for north corridor — fibre backhaul installed.",
        },
      ],
    }),
    seedAsset({
      id: "inv-laptop-dell-01",
      assetTag: "INV-1006",
      name: "Dell Latitude 7440",
      category: "IT Equipment",
      manufacturer: "Dell",
      model: "Latitude 7440",
      serialNumber: "DL7440-BCN-7781",
      purchaseDate: isoDaysFromNow(-240),
      purchaseCost: "€1,680",
      warrantyExpiry: isoDaysFromNow(490),
      currentValue: "€1,200",
      location: "Barcelona",
      status: "operational",
      condition: "good",
      department: "Technical",
      assignedTo: "Hannes Weber",
      nextService: isoDaysFromNow(200),
      certificationExpiry: "",
      assignment: {
        employee: "Hannes Weber",
        department: "Technical",
        office: "Barcelona HQ",
        project: "",
        issueDate: isoDaysFromNow(-200),
        expectedReturn: "",
      },
      services: [],
      documents: [
        {
          id: "doc-1006-a",
          kind: "invoice",
          name: "Dell_Invoice_2025.pdf",
          uploadedAt: isoDaysFromNow(-240),
        },
      ],
      history: [
        {
          id: "hist-1006-a",
          at: isoDaysFromNow(-200),
          label: "Issued",
          detail: "Standard engineering laptop allocation",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-laptop-dell-02",
      assetTag: "INV-1007",
      name: "Dell Latitude 7440",
      category: "IT Equipment",
      manufacturer: "Dell",
      model: "Latitude 7440",
      serialNumber: "DL7440-OXF-3310",
      purchaseDate: isoDaysFromNow(-120),
      purchaseCost: "€1,680",
      warrantyExpiry: isoDaysFromNow(610),
      currentValue: "€1,450",
      location: "Oxford",
      status: "operational",
      condition: "excellent",
      department: "Sales",
      assignedTo: "Ashley Cole",
      nextService: isoDaysFromNow(300),
      certificationExpiry: "",
      assignment: {
        employee: "Ashley Cole",
        department: "Sales",
        office: "Oxford Representative Office",
        project: "UK enterprise pipeline",
        issueDate: isoDaysFromNow(-90),
        expectedReturn: "",
      },
      services: [],
      documents: [],
      history: [],
      notes: [],
    }),
    seedAsset({
      id: "inv-van-transit",
      assetTag: "INV-1008",
      name: "Ford Transit Custom L2H2",
      category: "Vehicle",
      manufacturer: "Ford",
      model: "Transit Custom",
      serialNumber: "WF0XXXTTGXHR12345",
      purchaseDate: isoDaysFromNow(-730),
      purchaseCost: "€34,900",
      warrantyExpiry: isoDaysFromNow(-100),
      currentValue: "€22,400",
      location: "Barcelona",
      status: "operational",
      condition: "fair",
      department: "Logistics",
      assignedTo: "David Llorens",
      nextService: isoDaysFromNow(12),
      certificationExpiry: isoDaysFromNow(28),
      assignment: {
        employee: "David Llorens",
        department: "Logistics",
        office: "Barcelona HQ",
        project: "Equipment shuttle — BCN/Porto",
        issueDate: isoDaysFromNow(-365),
        expectedReturn: "",
      },
      services: [
        {
          id: "svc-1008-a",
          type: "service",
          date: isoDaysFromNow(-180),
          nextDue: isoDaysFromNow(12),
          provider: "Ford Barcelona Service",
          outcome: "Full service completed",
          notes: "Brake pads replaced",
          status: "completed",
        },
      ],
      documents: [
        {
          id: "doc-1008-a",
          kind: "certificate",
          name: "ITV_Certificate_2026.pdf",
          uploadedAt: isoDaysFromNow(-30),
        },
        {
          id: "doc-1008-b",
          kind: "other",
          name: "Fleet_Insurance_Policy.pdf",
          uploadedAt: isoDaysFromNow(-200),
        },
      ],
      history: [
        {
          id: "hist-1008-a",
          at: isoDaysFromNow(-30),
          label: "ITV renewed",
          detail: "Roadworthiness certificate valid until next expiry",
        },
      ],
      notes: [
        {
          id: "note-1008-a",
          at: isoDaysFromNow(-5),
          author: "David Llorens",
          kind: "damage",
          text: "Minor scratch on nearside sliding door — cosmetic only.",
        },
      ],
    }),
    seedAsset({
      id: "inv-anafi-usa",
      assetTag: "INV-1009",
      name: "Parrot ANAFI USA",
      category: "Aircraft",
      manufacturer: "Parrot",
      model: "ANAFI USA",
      serialNumber: "ANAFI-USA-OXF-004",
      purchaseDate: isoDaysFromNow(-600),
      purchaseCost: "€7,200",
      warrantyExpiry: isoDaysFromNow(-30),
      currentValue: "€4,800",
      location: "Oxford",
      status: "out_of_service",
      condition: "poor",
      department: "Field Operations",
      assignedTo: "",
      nextService: isoDaysFromNow(-15),
      certificationExpiry: isoDaysFromNow(-5),
      assignment: emptyAssignment(),
      services: [
        {
          id: "svc-1009-a",
          type: "repair",
          date: isoDaysFromNow(-20),
          nextDue: isoDaysFromNow(-15),
          provider: "Parrot Support",
          outcome: "Motor assembly failure — awaiting parts",
          notes: "EOL assessment pending",
          status: "overdue",
        },
      ],
      documents: [],
      history: [
        {
          id: "hist-1009-a",
          at: isoDaysFromNow(-20),
          label: "Marked out of service",
          detail: "Motor failure during Oxford demo flight",
        },
      ],
      notes: [
        {
          id: "note-1009-a",
          at: isoDaysFromNow(-18),
          author: "Ashley Cole",
          kind: "issue",
          text: "Recommend retirement — repair cost exceeds replacement threshold.",
        },
      ],
    }),
    seedAsset({
      id: "inv-gs-rtk-base",
      assetTag: "INV-1010",
      name: "Emlid Reach RS2+ Base",
      category: "Ground Station",
      manufacturer: "Emlid",
      model: "Reach RS2+",
      serialNumber: "RS2P-BCN-0099",
      purchaseDate: isoDaysFromNow(-400),
      purchaseCost: "€2,850",
      warrantyExpiry: isoDaysFromNow(330),
      currentValue: "€2,400",
      location: "Barcelona",
      status: "operational",
      condition: "excellent",
      department: "Technical",
      assignedTo: "",
      nextService: isoDaysFromNow(40),
      certificationExpiry: isoDaysFromNow(33),
      assignment: emptyAssignment(),
      services: [
        {
          id: "svc-1010-a",
          type: "calibration",
          date: isoDaysFromNow(-60),
          nextDue: isoDaysFromNow(40),
          provider: "Emlid Calibration Lab",
          outcome: "Passed",
          notes: "",
          status: "completed",
        },
      ],
      documents: [
        {
          id: "doc-1010-a",
          kind: "certificate",
          name: "RS2_Calibration_Cert.pdf",
          uploadedAt: isoDaysFromNow(-60),
        },
      ],
      history: [],
      notes: [],
    }),
    seedAsset({
      id: "inv-macbook-pro",
      assetTag: "INV-1011",
      name: "MacBook Pro 14\" M3 Pro",
      category: "IT Equipment",
      manufacturer: "Apple",
      model: "MacBook Pro 14",
      serialNumber: "MBP14-PT-2201",
      purchaseDate: isoDaysFromNow(-90),
      purchaseCost: "€2,890",
      warrantyExpiry: isoDaysFromNow(640),
      currentValue: "€2,700",
      location: "Porto",
      status: "operational",
      condition: "excellent",
      department: "Operations",
      assignedTo: "Elena Ruiz",
      nextService: isoDaysFromNow(365),
      certificationExpiry: "",
      assignment: {
        employee: "Elena Ruiz",
        department: "Operations",
        office: "Porto Field Hub",
        project: "Dock operations console",
        issueDate: isoDaysFromNow(-75),
        expectedReturn: "",
      },
      services: [],
      documents: [
        {
          id: "doc-1011-a",
          kind: "invoice",
          name: "Apple_Store_Invoice.pdf",
          uploadedAt: isoDaysFromNow(-90),
        },
      ],
      history: [
        {
          id: "hist-1011-a",
          at: isoDaysFromNow(-75),
          label: "Assigned",
          detail: "Dock operations console — Porto hub",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-tool-kit",
      assetTag: "INV-1012",
      name: "Field Maintenance Tool Kit",
      category: "Tools",
      manufacturer: "Wiha",
      model: "Precision Field Set",
      serialNumber: "TOOL-KIT-BCN-01",
      purchaseDate: isoDaysFromNow(-500),
      purchaseCost: "€680",
      warrantyExpiry: "",
      currentValue: "€420",
      location: "Barcelona",
      status: "operational",
      condition: "good",
      department: "Technical",
      assignedTo: "Carlos Mendoza",
      nextService: isoDaysFromNow(90),
      certificationExpiry: "",
      assignment: {
        employee: "Carlos Mendoza",
        department: "Technical",
        office: "Barcelona HQ",
        project: "",
        issueDate: isoDaysFromNow(-120),
        expectedReturn: "",
      },
      services: [],
      documents: [],
      history: [],
      notes: [
        {
          id: "note-1012-a",
          at: isoDaysFromNow(-20),
          author: "Carlos Mendoza",
          kind: "operational",
          text: "Torx T6 driver replaced — rest of kit complete.",
        },
      ],
    }),
    seedAsset({
      id: "inv-batt-tb65",
      assetTag: "INV-1013",
      name: "TB65 Intelligent Flight Battery",
      category: "Battery",
      manufacturer: "DJI",
      model: "TB65",
      serialNumber: "TB65-PT-1108",
      purchaseDate: isoDaysFromNow(-60),
      purchaseCost: "€890",
      warrantyExpiry: isoDaysFromNow(670),
      currentValue: "€820",
      location: "Porto",
      status: "maintenance",
      condition: "fair",
      department: "Logistics",
      assignedTo: "",
      nextService: isoDaysFromNow(8),
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [
        {
          id: "svc-1013-a",
          type: "inspection",
          date: isoDaysFromNow(-1),
          nextDue: isoDaysFromNow(8),
          provider: "Unit311 Technical",
          outcome: "Cell imbalance detected — cycling required",
          notes: "",
          status: "scheduled",
        },
      ],
      documents: [],
      history: [
        {
          id: "hist-1013-a",
          at: isoDaysFromNow(-1),
          label: "Battery inspection",
          detail: "Removed from rotation pending balance cycle",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-survey-van",
      assetTag: "INV-1014",
      name: "Mercedes Sprinter Survey Rig",
      category: "Vehicle",
      manufacturer: "Mercedes-Benz",
      model: "Sprinter 316",
      serialNumber: "WDB9066331N445566",
      purchaseDate: isoDaysFromNow(-900),
      purchaseCost: "€58,000",
      warrantyExpiry: isoDaysFromNow(-400),
      currentValue: "€38,500",
      location: "Oxford",
      status: "operational",
      condition: "good",
      department: "Field Operations",
      assignedTo: "Pablo Serrano",
      nextService: isoDaysFromNow(35),
      certificationExpiry: isoDaysFromNow(48),
      assignment: {
        employee: "Pablo Serrano",
        department: "Field Operations",
        office: "Oxford Representative Office",
        project: "UK rail corridor mapping",
        issueDate: isoDaysFromNow(-45),
        expectedReturn: isoDaysFromNow(60),
      },
      services: [],
      documents: [
        {
          id: "doc-1014-a",
          kind: "photo",
          name: "Sprinter_Rig_Config.jpg",
          uploadedAt: isoDaysFromNow(-800),
        },
      ],
      history: [
        {
          id: "hist-1014-a",
          at: isoDaysFromNow(-45),
          label: "Deployed",
          detail: "UK rail corridor mapping programme",
        },
      ],
      notes: [],
    }),
    seedAsset({
      id: "inv-retired-mavic",
      assetTag: "INV-1015",
      name: "DJI Mavic 3 Enterprise (Retired)",
      category: "Aircraft",
      manufacturer: "DJI",
      model: "Mavic 3 Enterprise",
      serialNumber: "M3E-BCN-2019-003",
      purchaseDate: isoDaysFromNow(-1200),
      purchaseCost: "€4,200",
      warrantyExpiry: isoDaysFromNow(-800),
      currentValue: "€0",
      location: "Barcelona",
      status: "retired",
      condition: "poor",
      department: "Operations",
      assignedTo: "",
      nextService: "",
      certificationExpiry: "",
      assignment: emptyAssignment(),
      services: [],
      documents: [],
      history: [
        {
          id: "hist-1015-a",
          at: isoDaysFromNow(-180),
          label: "Retired",
          detail: "Replaced by Matrice fleet — disposed per e-waste policy",
        },
      ],
      notes: [],
      archived: true,
    }),
  ];

  const activity: InventoryActivityItem[] = [
    {
      id: "act-inv-1",
      at: isoDaysFromNow(0),
      label: "Service due",
      detail: "INV-1008 Ford Transit — service in 12 days",
    },
    {
      id: "act-inv-2",
      at: isoDaysFromNow(-1),
      label: "Asset returned",
      detail: "INV-1004 TB60 Battery — returned to Barcelona stock",
    },
    {
      id: "act-inv-3",
      at: isoDaysFromNow(-2),
      label: "Maintenance opened",
      detail: "INV-1002 DJI M30T — thermal sensor repair",
    },
    {
      id: "act-inv-4",
      at: isoDaysFromNow(-3),
      label: "Asset assigned",
      detail: "INV-1001 Matrice 350 — María García · Port survey Q3",
    },
    {
      id: "act-inv-5",
      at: isoDaysFromNow(-5),
      label: "Certification expiring",
      detail: "INV-1005 DJI Dock 2 — site certificate in 52 days",
    },
    {
      id: "act-inv-6",
      at: isoDaysFromNow(-7),
      label: "Asset retired",
      detail: "INV-1015 Mavic 3 Enterprise — end of life",
    },
    {
      id: "act-inv-7",
      at: isoDaysFromNow(-10),
      label: "Document uploaded",
      detail: "INV-1008 Ford Transit — ITV certificate on file",
    },
  ];

  return { assets, activity };
}

let state = seedState();
const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function pushActivity(label: string, detail: string) {
  state = {
    ...state,
    activity: [
      { id: uid("act"), at: isoDaysFromNow(0), label, detail },
      ...state.activity,
    ].slice(0, 40),
  };
}

function findAsset(id: string) {
  return state.assets.find((item) => item.id === id);
}

function updateAsset(id: string, updater: (asset: InventoryAsset) => InventoryAsset) {
  state = {
    ...state,
    assets: state.assets.map((asset) => (asset.id === id ? updater(asset) : asset)),
  };
}

export function subscribeInventoryMockStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getInventoryMockSnapshot(): InventoryMockState {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserWolfCentralSurface } =
        require("@/lib/wolf/wolf-surface") as typeof import("@/lib/wolf/wolf-surface");
      if (isBrowserWolfCentralSurface()) {
        const hasLegacy =
          state.assets.length > 0 ||
          state.activity.some((row) => /Barcelona|Porto|Oxford|Matrice|DJI|Unit311/i.test(row.detail));
        if (hasLegacy) {
          state = { assets: [], activity: [] };
        }
        return state;
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCustomerWorkspaceSurface } =
        require("@/lib/customer-workspace-surface") as typeof import("@/lib/customer-workspace-surface");
      if (isBrowserCustomerWorkspaceSurface()) {
        const hasLegacy =
          state.assets.length > 0 ||
          state.activity.some((row) => /Barcelona|Porto|Oxford|Matrice|DJI|Unit311/i.test(row.detail));
        if (hasLegacy) {
          state = { assets: [], activity: [] };
        }
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        const hasStale =
          !state.activity.some((row) => row.id === "act-oa-inv-1") ||
          state.assets.some(
            (a) =>
              /Barcelona|Unit311|Matrice|DJI/i.test(a.location) ||
              /Barcelona|Unit311|Matrice|DJI/i.test(a.name) ||
              /Unit311/i.test(a.notes.map((n) => n.text).join(" ")),
          );
        if (hasStale) {
          state = seedState();
        }
        return state;
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (
        isBrowserAbhiSurface() &&
        !state.activity.some((row) => row.id === "act-abhi-inv-1")
      ) {
        state = seedState();
        return state;
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (
        isBrowserTalantonImpactSurface() &&
        !state.activity.some((row) => row.id === "act-ti-inv-1")
      ) {
        state = seedState();
        return state;
      }
    } catch {
      // Fall through.
    }

    if (tryGetDemoFixtures() && !state.activity.some((row) => row.id === "act-mag-inv-1")) {
      state = seedState();
    }
  }
  return state;
}

/** Server-safe inventory seed selection by workspace slug (for EA tools). */
export function getInventorySnapshotForWorkspace(slug?: string | null): InventoryMockState {
  try {
    const { isOnwardAirSlug } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    if (isOnwardAirSlug(slug)) {
      const { seedOnwardAirInventoryState } =
        require("@/lib/onwardair/operations-data") as typeof import("@/lib/onwardair/operations-data");
      return seedOnwardAirInventoryState();
    }
  } catch {
    // fall through
  }
  try {
    const { isAbhiSlug } = require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
    if (isAbhiSlug(slug)) return seedAbhiInventoryState();
  } catch {
    // fall through
  }
  try {
    const { isTalantonImpactSlug } =
      require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
    if (isTalantonImpactSlug(slug)) return seedTalantonInventoryState();
  } catch {
    // fall through
  }
  return getInventoryMockSnapshot();
}

export function resetInventoryMockStore() {
  state = seedState();
  emit();
}

export function listInventoryActivity() {
  return state.activity;
}

/* —— Assets —— */

export function upsertInventoryAsset(
  input: Partial<InventoryAsset> & { id?: string },
) {
  const existing = input.id ? findAsset(input.id) : null;
  const next: InventoryAsset = {
    id: existing?.id ?? uid("asset"),
    assetTag: input.assetTag ?? existing?.assetTag ?? nextAssetTag(state.assets),
    name: input.name ?? existing?.name ?? "New asset",
    category: input.category ?? existing?.category ?? "Other",
    manufacturer: input.manufacturer ?? existing?.manufacturer ?? "",
    model: input.model ?? existing?.model ?? "",
    serialNumber: input.serialNumber ?? existing?.serialNumber ?? "",
    purchaseDate: input.purchaseDate ?? existing?.purchaseDate ?? isoDaysFromNow(0),
    purchaseCost: input.purchaseCost ?? existing?.purchaseCost ?? "",
    warrantyExpiry: input.warrantyExpiry ?? existing?.warrantyExpiry ?? "",
    currentValue: input.currentValue ?? existing?.currentValue ?? "",
    location: input.location ?? existing?.location ?? "Barcelona",
    status: input.status ?? existing?.status ?? "operational",
    condition: input.condition ?? existing?.condition ?? "good",
    department: input.department ?? existing?.department ?? "",
    assignedTo: input.assignedTo ?? existing?.assignedTo ?? "",
    nextService: input.nextService ?? existing?.nextService ?? "",
    certificationExpiry:
      input.certificationExpiry ?? existing?.certificationExpiry ?? "",
    assignment: input.assignment ?? existing?.assignment ?? emptyAssignment(),
    services: input.services ?? existing?.services ?? [],
    documents: input.documents ?? existing?.documents ?? [],
    history: input.history ?? existing?.history ?? [],
    notes: input.notes ?? existing?.notes ?? [],
    archived: input.archived ?? existing?.archived ?? false,
  };

  if (!existing) {
    next.history = pushHistory(
      { ...next, history: [] },
      "Asset registered",
      `${next.assetTag} · ${next.name}`,
    );
  }

  state = {
    ...state,
    assets: existing
      ? state.assets.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.assets],
  };
  pushActivity(
    existing ? "Asset updated" : "Asset added",
    `${next.assetTag} · ${next.name}`,
  );
  emit();
  return next;
}

export function deleteInventoryAsset(id: string) {
  const asset = findAsset(id);
  state = { ...state, assets: state.assets.filter((item) => item.id !== id) };
  if (asset) pushActivity("Asset deleted", `${asset.assetTag} · ${asset.name}`);
  emit();
}

export function archiveInventoryAsset(id: string) {
  updateAsset(id, (asset) => ({
    ...asset,
    archived: true,
    history: pushHistory(asset, "Asset archived", `${asset.assetTag} · ${asset.name}`),
  }));
  const asset = findAsset(id);
  if (asset) pushActivity("Asset archived", `${asset.assetTag} · ${asset.name}`);
  emit();
}

export function retireInventoryAsset(id: string) {
  updateAsset(id, (asset) => ({
    ...asset,
    status: "retired",
    archived: true,
    assignedTo: "",
    assignment: emptyAssignment(),
    history: pushHistory(asset, "Asset retired", `${asset.assetTag} · ${asset.name}`),
  }));
  const asset = findAsset(id);
  if (asset) pushActivity("Asset retired", `${asset.assetTag} · ${asset.name}`);
  emit();
}

export function duplicateInventoryAsset(id: string) {
  const source = findAsset(id);
  if (!source) return null;
  const copy: InventoryAsset = {
    ...source,
    id: uid("asset"),
    assetTag: nextAssetTag(state.assets),
    name: `${source.name} (Copy)`,
    serialNumber: "",
    assignedTo: "",
    assignment: emptyAssignment(),
    services: source.services.map((svc) => ({ ...svc, id: uid("svc") })),
    documents: source.documents.map((doc) => ({ ...doc, id: uid("doc") })),
    history: [
      {
        id: uid("hist"),
        at: isoDaysFromNow(0),
        label: "Duplicated",
        detail: `Copied from ${source.assetTag}`,
      },
    ],
    notes: [],
    archived: false,
    status: source.status === "retired" ? "operational" : source.status,
  };
  state = { ...state, assets: [copy, ...state.assets] };
  pushActivity("Asset duplicated", `${copy.assetTag} from ${source.assetTag}`);
  emit();
  return copy;
}

/* —— Assignment —— */

export function assignInventoryAsset(id: string, assignment: InventoryAssignment) {
  updateAsset(id, (asset) => ({
    ...asset,
    assignedTo: assignment.employee,
    department: assignment.department || asset.department,
    assignment,
    history: pushHistory(
      asset,
      "Asset assigned",
      `${assignment.employee}${assignment.project ? ` · ${assignment.project}` : ""}`,
    ),
  }));
  const asset = findAsset(id);
  if (asset) {
    pushActivity("Asset assigned", `${asset.assetTag} → ${assignment.employee}`);
  }
  emit();
}

export function transferInventoryAsset(id: string, assignment: InventoryAssignment) {
  const prior = findAsset(id);
  updateAsset(id, (asset) => ({
    ...asset,
    assignedTo: assignment.employee,
    department: assignment.department || asset.department,
    assignment,
    history: pushHistory(
      asset,
      "Asset transferred",
      `${prior?.assignedTo || "Unassigned"} → ${assignment.employee}`,
    ),
  }));
  const asset = findAsset(id);
  if (asset) {
    pushActivity(
      "Asset transferred",
      `${asset.assetTag} → ${assignment.employee}`,
    );
  }
  emit();
}

export function returnInventoryAsset(id: string) {
  updateAsset(id, (asset) => ({
    ...asset,
    assignedTo: "",
    assignment: emptyAssignment(),
    history: pushHistory(
      asset,
      "Asset returned",
      asset.assignedTo ? `Returned from ${asset.assignedTo}` : "Returned to stock",
    ),
  }));
  const asset = findAsset(id);
  if (asset) pushActivity("Asset returned", `${asset.assetTag} · ${asset.name}`);
  emit();
}

/* —— Maintenance —— */

export function addInventoryService(
  assetId: string,
  input: Omit<InventoryServiceRecord, "id" | "status"> & { status?: InventoryServiceRecord["status"] },
) {
  const record: InventoryServiceRecord = {
    id: uid("svc"),
    type: input.type,
    date: input.date,
    nextDue: input.nextDue,
    provider: input.provider,
    outcome: input.outcome,
    notes: input.notes,
    status: input.status ?? "completed",
  };
  updateAsset(assetId, (asset) => ({
    ...asset,
    services: [record, ...asset.services],
    nextService: input.nextDue || asset.nextService,
    history: pushHistory(asset, "Service recorded", `${record.type} · ${record.provider}`),
  }));
  const asset = findAsset(assetId);
  if (asset) {
    pushActivity("Service recorded", `${asset.assetTag} · ${record.type}`);
  }
  emit();
  return record;
}

export function scheduleInventoryService(
  assetId: string,
  input: Omit<InventoryServiceRecord, "id" | "status">,
) {
  return addInventoryService(assetId, { ...input, status: "scheduled" });
}

export function completeInventoryService(assetId: string, serviceId: string, outcome: string) {
  updateAsset(assetId, (asset) => ({
    ...asset,
    services: asset.services.map((svc) =>
      svc.id === serviceId
        ? { ...svc, status: "completed", outcome, date: isoDaysFromNow(0) }
        : svc,
    ),
    nextService:
      asset.services.find((svc) => svc.id === serviceId)?.nextDue || asset.nextService,
    history: pushHistory(asset, "Service completed", outcome),
  }));
  const asset = findAsset(assetId);
  if (asset) {
    pushActivity("Service completed", `${asset.assetTag} · ${outcome.slice(0, 60)}`);
  }
  emit();
}

/* —— Documents & notes —— */

export function addInventoryDocument(
  assetId: string,
  input: Omit<InventoryDocument, "id" | "uploadedAt"> & { uploadedAt?: string },
) {
  const doc: InventoryDocument = {
    id: uid("doc"),
    kind: input.kind,
    name: input.name,
    uploadedAt: input.uploadedAt ?? isoDaysFromNow(0),
  };
  updateAsset(assetId, (asset) => ({
    ...asset,
    documents: [doc, ...asset.documents],
    history: pushHistory(asset, "Document added", doc.name),
  }));
  const asset = findAsset(assetId);
  if (asset) pushActivity("Document added", `${asset.assetTag} · ${doc.name}`);
  emit();
  return doc;
}

export function addInventoryNote(
  assetId: string,
  input: Omit<InventoryNote, "id" | "at"> & { at?: string; author?: string },
) {
  const note: InventoryNote = {
    id: uid("note"),
    at: input.at ?? isoDaysFromNow(0),
    author: input.author ?? "Operations",
    kind: input.kind,
    text: input.text,
  };
  updateAsset(assetId, (asset) => ({
    ...asset,
    notes: [note, ...asset.notes],
    history: pushHistory(asset, "Note added", `${note.kind} · ${note.author}`),
  }));
  const asset = findAsset(assetId);
  if (asset) pushActivity("Note added", `${asset.assetTag} · ${note.kind}`);
  emit();
  return note;
}
