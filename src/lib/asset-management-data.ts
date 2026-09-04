import { getOwnerUserIdForRegion } from "@/lib/user-management-data";

export type AssetOperationalStatus =
  | "Standby"
  | "In Flight"
  | "In Hangar"
  | "Maintenance"
  | "Stopped"
  | "In Service"
  | "Active Licence";

export type RtkCalibrationMode =
  | "Uncalibrated"
  | "Satellite Differential"
  | "Network RTK";

export type ControlSource = "RC" | "App" | "Cloud";

export type ManagedAsset = {
  id: string;
  assetTag: string;
  category: string;
  location: string;
  model: string;
  serialNumber: string;
  operationalStatus: AssetOperationalStatus;
  purchaseDate: string;
  firmwareVersion: string;
  drtk3BaseSerial: string;
  rtkCalibrationMode: RtkCalibrationMode;
  insuranceExpiry: string;
  lastMaintenanceDate: string;
  nextMaintenanceDue: string;
  totalFlightHours: number;
  storageUsedGb: number;
  assignedClientId: string | null;
  assignedToUserId: string | null;
  controlSource: ControlSource;
  notes: string;
  /** Links live simulator telemetry when set (matches DRONE_ID). */
  telemetryDroneId?: string;
};

export const DEFAULT_ASSET_CATEGORIES = [
  "Aircraft",
  "RTK Base Station",
  "Battery",
  "Remote Controller",
  "Payload Module",
  "Charging Hub",
  "Transport Case",
  "4G Connectivity",
  "Software Licence",
] as const;

/** Technology Management — hardware asset register categories (Central platform). */
export const TECHNOLOGY_ASSET_CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Mobile",
  "Networking Hardware",
  "Server",
  "Peripheral",
] as const;

export const DEFAULT_ASSET_LOCATIONS = ["Barcelona", "Porto", "Oxford"] as const;

export const MODELS_BY_CATEGORY: Record<string, string[]> = {
  Aircraft: ["DJI Matrice 4T"],
  "RTK Base Station": [
    "DJI D-RTK 3 Multifunctional Station",
    "DJI D-RTK 2 Mobile Station",
  ],
  Battery: ["TB65 Intelligent Flight Battery", "TB60 Intelligent Flight Battery"],
  "Remote Controller": ["DJI RC Plus Enterprise", "DJI RC Plus"],
  "Payload Module": [
    "Matrice 4T Integrated Payload (Wide/Tele/Thermal)",
    "Laser Rangefinder Module",
  ],
  "Charging Hub": ["BS65 Intelligent Battery Station", "TB65 Charging Hub"],
  "Transport Case": [
    "DJI Safety Case (Matrice 4 Series)",
    "Pelican 1690 Custom Foam Insert",
  ],
  "4G Connectivity": ["DJI Cellular Dongle 2", "DJI eSIM Dongle"],
  "Software Licence": ["FlightHub 2 Organisation", "DJI Terra Advanced", "DJI Modify"],
  Laptop: ["MacBook Pro 14\" M3", "Dell Latitude 5450", "Lenovo ThinkPad X1 Carbon"],
  Desktop: ["Dell OptiPlex Tower", "HP EliteDesk", "Custom Workstation"],
  Mobile: ["iPhone 15 Pro", "Samsung Galaxy S24", "Google Pixel 8"],
  "Networking Hardware": ["Cisco Meraki MR46", "Ubiquiti UniFi AP", "Fortinet FortiGate 60F"],
  Server: ["Dell PowerEdge R750", "HPE ProLiant DL380", "AWS Outpost rack"],
  "Mobile Phone": ["iPhone 15", "iPhone 15 Pro", "Samsung Galaxy S24"],
  Tablet: ["iPad Pro 11\"", "iPad 10th Gen"],
  Camera: ["Sony A7 IV", "Canon EOS R6 Mark II", "GoPro Hero 12"],
  "AV / Audio": ["Rode Wireless Pro", "Shure MV7+", "DJIMIC Mini"],
  "Exhibition Equipment": [
    "3×3 Shell Scheme Kit",
    "Pop-up Banner Stand",
    "LED Exhibition Lighting Rig",
    "Counter / Reception Desk",
  ],
  "Display / Screen": ["Samsung 55\" QLED", "Epson EB-L210SW Projector", "Portable LED Wall Panel"],
  Monitor: ["Dell UltraSharp U2723QE", "LG UltraFine 27"],
  Peripheral: ["CalDigit TS4 Dock", "Logitech MX Keys Combo", "Brother HL-L8260CDW"],
  "Flight Case": ["Peli 1650 Exhibition Case", "Peli Air 1535"],
};

export const ASSET_STATUS_OPTIONS: AssetOperationalStatus[] = [
  "Standby",
  "In Flight",
  "In Hangar",
  "Maintenance",
  "Stopped",
  "In Service",
  "Active Licence",
];

export const RTK_CALIBRATION_OPTIONS: RtkCalibrationMode[] = [
  "Uncalibrated",
  "Satellite Differential",
  "Network RTK",
];

export const CONTROL_SOURCE_OPTIONS: ControlSource[] = ["RC", "App", "Cloud"];

export const FIRMWARE_VERSION_OPTIONS = [
  "v09.02.0001",
  "v09.01.0014",
  "v08.04.0008",
  "N/A",
] as const;

export type AssetRegistryState = {
  assets: ManagedAsset[];
  categories: string[];
  locations: string[];
};

let assetCounter = 0;

export function createAssetId() {
  assetCounter += 1;
  return `asset-${assetCounter}`;
}

function locationCode(location: string) {
  switch (location) {
    case "Barcelona":
      return "BCN";
    case "Porto":
      return "PRT";
    case "Oxford":
      return "OXF";
    case "London":
      return "LDN";
    case "Cambridge":
      return "CAM";
    case "Manchester":
      return "MAN";
    default:
      return location.slice(0, 3).toUpperCase();
  }
}

function categoryPrefix(category: string) {
  switch (category) {
    case "Aircraft":
      return "M4T";
    case "RTK Base Station":
      return "DRTK3";
    case "Battery":
      return "BAT";
    case "Remote Controller":
      return "RC";
    case "Payload Module":
      return "PLD";
    case "Charging Hub":
      return "CHG";
    case "Transport Case":
      return "CASE";
    case "4G Connectivity":
      return "4G";
    case "Software Licence":
      return "LIC";
    case "Laptop":
      return "LT";
    case "Mobile Phone":
      return "PH";
    case "Tablet":
      return "TAB";
    case "Camera":
      return "CAM";
    case "AV / Audio":
      return "AV";
    case "Exhibition Equipment":
      return "EXH";
    case "Display / Screen":
      return "DSP";
    case "Monitor":
      return "MON";
    case "Peripheral":
      return "PER";
    case "Flight Case":
      return "CASE";
    default:
      return "AST";
  }
}

function defaultStatusForCategory(category: string): AssetOperationalStatus {
  if (category === "Software Licence") return "Active Licence";
  if (category === "Charging Hub") return "In Service";
  if (category === "Transport Case" || category === "Flight Case") return "In Hangar";
  if (
    category === "Laptop" ||
    category === "Mobile Phone" ||
    category === "Tablet" ||
    category === "Camera" ||
    category === "AV / Audio" ||
    category === "Exhibition Equipment" ||
    category === "Display / Screen" ||
    category === "Monitor" ||
    category === "Peripheral"
  ) {
    return "In Service";
  }
  return "Standby";
}

type SeedAsset = {
  id?: string;
  category: string;
  location: string;
  assetTag: string;
  model: string;
  serialNumber: string;
  purchaseDate: string;
  operationalStatus?: AssetOperationalStatus;
  firmwareVersion?: string;
  drtk3BaseSerial?: string;
  rtkCalibrationMode?: RtkCalibrationMode;
  totalFlightHours?: number;
  assignedClientId?: string | null;
  assignedToUserId?: string | null;
  notes?: string;
  telemetryDroneId?: string;
};

function buildSeedAsset(seed: SeedAsset): ManagedAsset {
  assetCounter += 1;
  return {
    id: seed.id ?? `asset-${assetCounter}`,
    assetTag: seed.assetTag,
    category: seed.category,
    location: seed.location,
    model: seed.model,
    serialNumber: seed.serialNumber,
    operationalStatus: seed.operationalStatus ?? defaultStatusForCategory(seed.category),
    purchaseDate: seed.purchaseDate,
    firmwareVersion: seed.firmwareVersion ?? FIRMWARE_VERSION_OPTIONS[0],
    drtk3BaseSerial: seed.drtk3BaseSerial ?? "",
    rtkCalibrationMode: seed.rtkCalibrationMode ?? "Network RTK",
    insuranceExpiry: "2027-06-30",
    lastMaintenanceDate: "2026-05-01",
    nextMaintenanceDue: "2026-11-01",
    totalFlightHours: seed.totalFlightHours ?? 0,
    storageUsedGb: seed.category === "Aircraft" ? 64 : 0,
    assignedClientId: seed.assignedClientId ?? null,
    assignedToUserId: seed.assignedToUserId ?? getOwnerUserIdForRegion(seed.location),
    controlSource: seed.category === "Software Licence" ? "Cloud" : "RC",
    notes: seed.notes ?? "",
    telemetryDroneId: seed.telemetryDroneId,
  };
}

function seedsForLocation(
  location: (typeof DEFAULT_ASSET_LOCATIONS)[number],
  clientId: string,
  serialSuffix: string,
): SeedAsset[] {
  const code = locationCode(location);

  return [
    {
      category: "Aircraft",
      location,
      assetTag: `DC-M4T-${code}`,
      model: "DJI Matrice 4T",
      serialNumber: `1581F5BKD2280${serialSuffix}001`,
      purchaseDate: location === "Barcelona" ? "2024-03-12" : location === "Porto" ? "2024-07-18" : "2025-01-09",
      totalFlightHours: location === "Barcelona" ? 412 : location === "Porto" ? 286 : 118,
      assignedClientId: clientId,
      drtk3BaseSerial: `DRTK3-${code}-001`,
      notes:
        location === "Oxford"
          ? "FlightHub sandbox linked airframe · primary demo drone."
          : `${location} survey operations airframe.`,
      telemetryDroneId: location === "Oxford" ? "DC-TEST-001" : undefined,
    },
    {
      category: "RTK Base Station",
      location,
      assetTag: `DRTK3-${code}-001`,
      model: "DJI D-RTK 3 Multifunctional Station",
      serialNumber: `DRTK3SN${serialSuffix}7788`,
      purchaseDate: "2024-03-10",
      rtkCalibrationMode: "Network RTK",
      notes: "Network RTK calibrated · RTCM broadcast to local fleet.",
    },
    {
      category: "Battery",
      location,
      assetTag: `BAT-${code}-01`,
      model: "TB65 Intelligent Flight Battery",
      serialNumber: `TB65${serialSuffix}11001`,
      purchaseDate: "2024-03-12",
      notes: "Primary flight battery set A.",
    },
    {
      category: "Battery",
      location,
      assetTag: `BAT-${code}-02`,
      model: "TB65 Intelligent Flight Battery",
      serialNumber: `TB65${serialSuffix}11002`,
      purchaseDate: "2024-03-12",
      notes: "Reserve flight battery set B.",
    },
    {
      category: "Remote Controller",
      location,
      assetTag: `RC-${code}-01`,
      model: "DJI RC Plus Enterprise",
      serialNumber: `RCPE${serialSuffix}44001`,
      purchaseDate: "2024-03-15",
      firmwareVersion: "v09.01.0014",
      notes: "Assigned pilot handset · encrypted link profile.",
    },
    {
      category: "Payload Module",
      location,
      assetTag: `PLD-${code}-01`,
      model: "Matrice 4T Integrated Payload (Wide/Tele/Thermal)",
      serialNumber: `PLD4T${serialSuffix}9001`,
      purchaseDate: "2024-03-12",
      notes: "Wide + tele + thermal factory payload · R-JPEG radiometric verified.",
    },
    {
      category: "Charging Hub",
      location,
      assetTag: `CHG-${code}-01`,
      model: "BS65 Intelligent Battery Station",
      serialNumber: `BS65${serialSuffix}33001`,
      purchaseDate: "2024-04-01",
      operationalStatus: "In Service",
      notes: "Hangar charging bay · dual TB65 rotation.",
    },
    {
      category: "Transport Case",
      location,
      assetTag: `CASE-${code}-01`,
      model: "DJI Safety Case (Matrice 4 Series)",
      serialNumber: `CASE${serialSuffix}22001`,
      purchaseDate: "2024-03-12",
      operationalStatus: "In Hangar",
      notes: "Road case with foam for airframe + RC + batteries.",
    },
    {
      category: "4G Connectivity",
      location,
      assetTag: `4G-${code}-01`,
      model: "DJI Cellular Dongle 2",
      serialNumber: `DNG2${serialSuffix}55001`,
      purchaseDate: "2024-06-01",
      notes: "eSIM provisioned · cloud uplink for FlightHub OSD.",
    },
    {
      category: "Software Licence",
      location,
      assetTag: `FH2-${code}-01`,
      model: "FlightHub 2 Organisation",
      serialNumber: `FH2-LIC-${code}-2026`,
      purchaseDate: "2025-01-01",
      operationalStatus: "Active Licence",
      firmwareVersion: "N/A",
      notes: "Organisation seat bundle · telemetry + media sync.",
    },
  ];
}

function createSaecAssetRegistry(): AssetRegistryState {
  const { SAEC_ASSET_SEEDS, SAEC_ASSET_CATEGORIES, SAEC_ASSET_LOCATIONS } =
    require("@/lib/saec/demo/assets") as typeof import("@/lib/saec/demo/assets");
  return {
    assets: SAEC_ASSET_SEEDS.map((seed) => buildSeedAsset({ ...seed })),
    categories: [...SAEC_ASSET_CATEGORIES],
    locations: [...SAEC_ASSET_LOCATIONS],
  };
}

function createAbhiAssetRegistry(): AssetRegistryState {
  const categories = [
    "Laptop",
    "Mobile Phone",
    "Tablet",
    "Camera",
    "AV / Audio",
    "Exhibition Equipment",
    "Display / Screen",
    "Monitor",
    "Peripheral",
    "Flight Case",
    "Software Licence",
  ];
  const locations = ["London", "Cambridge", "Manchester"];
  const seeds: SeedAsset[] = [
    // Laptops — London HQ
    {
      assetTag: "ABHI-LT-001",
      category: "Laptop",
      location: "London",
      model: "MacBook Pro 14\" M3",
      serialNumber: "C02YK1ABHI001",
      purchaseDate: "2024-09-12",
      operationalStatus: "In Service",
      firmwareVersion: "macOS 15.5",
      notes: "CEO · London HQ",
    },
    {
      assetTag: "ABHI-LT-002",
      category: "Laptop",
      location: "London",
      model: "MacBook Pro 14\" M3",
      serialNumber: "C02YK1ABHI002",
      purchaseDate: "2024-09-12",
      operationalStatus: "In Service",
      firmwareVersion: "macOS 15.5",
      notes: "Membership Director · Jane Lewis",
    },
    {
      assetTag: "ABHI-LT-003",
      category: "Laptop",
      location: "London",
      model: "Dell Latitude 5450",
      serialNumber: "DL5450-UK-1003",
      purchaseDate: "2025-01-20",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Finance · London Victoria",
    },
    {
      assetTag: "ABHI-LT-004",
      category: "Laptop",
      location: "London",
      model: "Dell Latitude 5450",
      serialNumber: "DL5450-UK-1004",
      purchaseDate: "2025-01-20",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Events team · WHX programme lead",
    },
    {
      assetTag: "ABHI-LT-005",
      category: "Laptop",
      location: "Cambridge",
      model: "Lenovo ThinkPad X1 Carbon",
      serialNumber: "X1C-UK-1005",
      purchaseDate: "2025-03-04",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Policy & regulatory · Cambridge office",
    },
    {
      assetTag: "ABHI-LT-006",
      category: "Laptop",
      location: "Manchester",
      model: "Dell Latitude 5450",
      serialNumber: "DL5450-UK-1006",
      purchaseDate: "2025-04-15",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "North membership engagement",
    },
    {
      assetTag: "ABHI-LT-007",
      category: "Laptop",
      location: "London",
      model: "Lenovo ThinkPad X1 Carbon",
      serialNumber: "X1C-UK-1007",
      purchaseDate: "2024-11-08",
      operationalStatus: "Maintenance",
      firmwareVersion: "N/A",
      notes: "Spare pool · keyboard replacement",
    },
    {
      assetTag: "ABHI-LT-008",
      category: "Laptop",
      location: "London",
      model: "MacBook Pro 14\" M3",
      serialNumber: "C02YK1ABHI008",
      purchaseDate: "2025-06-02",
      operationalStatus: "In Service",
      firmwareVersion: "macOS 15.5",
      notes: "Communications & content",
    },
    // Phones
    {
      assetTag: "ABHI-PH-001",
      category: "Mobile Phone",
      location: "London",
      model: "iPhone 15 Pro",
      serialNumber: "IP15P-UK-2001",
      purchaseDate: "2024-10-01",
      operationalStatus: "In Service",
      firmwareVersion: "iOS 18.5",
      notes: "CEO handset",
    },
    {
      assetTag: "ABHI-PH-002",
      category: "Mobile Phone",
      location: "London",
      model: "iPhone 15",
      serialNumber: "IP15-UK-2002",
      purchaseDate: "2024-10-01",
      operationalStatus: "In Service",
      firmwareVersion: "iOS 18.5",
      notes: "Membership Director",
    },
    {
      assetTag: "ABHI-PH-003",
      category: "Mobile Phone",
      location: "London",
      model: "iPhone 15",
      serialNumber: "IP15-UK-2003",
      purchaseDate: "2025-02-14",
      operationalStatus: "In Service",
      firmwareVersion: "iOS 18.5",
      notes: "Events field phone · international travel SIM",
    },
    {
      assetTag: "ABHI-PH-004",
      category: "Mobile Phone",
      location: "Cambridge",
      model: "Samsung Galaxy S24",
      serialNumber: "SGS24-UK-2004",
      purchaseDate: "2025-03-18",
      operationalStatus: "In Service",
      firmwareVersion: "Android 15",
      notes: "Policy team on-call",
    },
    {
      assetTag: "ABHI-PH-005",
      category: "Mobile Phone",
      location: "Manchester",
      model: "iPhone 15",
      serialNumber: "IP15-UK-2005",
      purchaseDate: "2025-04-22",
      operationalStatus: "In Service",
      firmwareVersion: "iOS 18.5",
      notes: "North region lead",
    },
    {
      assetTag: "ABHI-PH-006",
      category: "Mobile Phone",
      location: "London",
      model: "iPhone 15",
      serialNumber: "IP15-UK-2006",
      purchaseDate: "2024-08-30",
      operationalStatus: "Standby",
      firmwareVersion: "iOS 18.5",
      notes: "Hot desk / visitor pool",
    },
    // Tablets — registration & pavilion
    {
      assetTag: "ABHI-TAB-001",
      category: "Tablet",
      location: "London",
      model: "iPad Pro 11\"",
      serialNumber: "IPADP-UK-3001",
      purchaseDate: "2025-01-10",
      operationalStatus: "In Service",
      firmwareVersion: "iPadOS 18.5",
      notes: "Member registration · events kit",
    },
    {
      assetTag: "ABHI-TAB-002",
      category: "Tablet",
      location: "London",
      model: "iPad 10th Gen",
      serialNumber: "IPAD10-UK-3002",
      purchaseDate: "2025-01-10",
      operationalStatus: "In Service",
      firmwareVersion: "iPadOS 18.5",
      notes: "Pavilion visitor capture",
    },
    {
      assetTag: "ABHI-TAB-003",
      category: "Tablet",
      location: "Manchester",
      model: "iPad 10th Gen",
      serialNumber: "IPAD10-UK-3003",
      purchaseDate: "2025-05-06",
      operationalStatus: "In Service",
      firmwareVersion: "iPadOS 18.5",
      notes: "Regional roadshow check-in",
    },
    // Cameras & AV
    {
      assetTag: "ABHI-CAM-001",
      category: "Camera",
      location: "London",
      model: "Sony A7 IV",
      serialNumber: "ILCE7M4-UK-4001",
      purchaseDate: "2024-06-18",
      operationalStatus: "In Service",
      firmwareVersion: "v3.01",
      notes: "Primary events / press photography",
    },
    {
      assetTag: "ABHI-CAM-002",
      category: "Camera",
      location: "London",
      model: "Canon EOS R6 Mark II",
      serialNumber: "R6M2-UK-4002",
      purchaseDate: "2025-02-03",
      operationalStatus: "In Service",
      firmwareVersion: "v1.5.0",
      notes: "Secondary body · working group coverage",
    },
    {
      assetTag: "ABHI-CAM-003",
      category: "Camera",
      location: "London",
      model: "GoPro Hero 12",
      serialNumber: "GP12-UK-4003",
      purchaseDate: "2024-11-22",
      operationalStatus: "In Service",
      firmwareVersion: "v2.20",
      notes: "Pavilion / exhibition B-roll",
    },
    {
      assetTag: "ABHI-AV-001",
      category: "AV / Audio",
      location: "London",
      model: "Rode Wireless Pro",
      serialNumber: "RODEWP-UK-4101",
      purchaseDate: "2024-07-09",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Interview lav kit · dual TX",
    },
    {
      assetTag: "ABHI-AV-002",
      category: "AV / Audio",
      location: "London",
      model: "Shure MV7+",
      serialNumber: "MV7P-UK-4102",
      purchaseDate: "2025-03-11",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Podcast / hybrid meeting mic · HQ studio",
    },
    // Exhibition equipment
    {
      assetTag: "ABHI-EXH-001",
      category: "Exhibition Equipment",
      location: "London",
      model: "3×3 Shell Scheme Kit",
      serialNumber: "SHELL-UK-5001",
      purchaseDate: "2023-09-01",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "UK pavilion modular walls · WHX / Hospitalar",
    },
    {
      assetTag: "ABHI-EXH-002",
      category: "Exhibition Equipment",
      location: "London",
      model: "Pop-up Banner Stand",
      serialNumber: "BANNER-UK-5002",
      purchaseDate: "2024-04-16",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Set of 8 retractable banners · brand refresh 2025 artwork",
    },
    {
      assetTag: "ABHI-EXH-003",
      category: "Exhibition Equipment",
      location: "London",
      model: "LED Exhibition Lighting Rig",
      serialNumber: "LEDRIG-UK-5003",
      purchaseDate: "2024-08-21",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "Pavilion lighting · flight-cased",
    },
    {
      assetTag: "ABHI-EXH-004",
      category: "Exhibition Equipment",
      location: "London",
      model: "Counter / Reception Desk",
      serialNumber: "DESK-UK-5004",
      purchaseDate: "2023-10-12",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "Branded membership desk · UK pavilion",
    },
    {
      assetTag: "ABHI-EXH-005",
      category: "Exhibition Equipment",
      location: "Manchester",
      model: "Pop-up Banner Stand",
      serialNumber: "BANNER-UK-5005",
      purchaseDate: "2025-05-28",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Regional roadshow pack · 4 stands",
    },
    // Displays
    {
      assetTag: "ABHI-DSP-001",
      category: "Display / Screen",
      location: "London",
      model: "Samsung 55\" QLED",
      serialNumber: "QN55-UK-6001",
      purchaseDate: "2024-05-14",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "HQ boardroom presentation display",
    },
    {
      assetTag: "ABHI-DSP-002",
      category: "Display / Screen",
      location: "London",
      model: "Epson EB-L210SW Projector",
      serialNumber: "EBL210-UK-6002",
      purchaseDate: "2024-02-27",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Working group / seminar kit",
    },
    {
      assetTag: "ABHI-DSP-003",
      category: "Display / Screen",
      location: "London",
      model: "Portable LED Wall Panel",
      serialNumber: "LEDWALL-UK-6003",
      purchaseDate: "2025-01-30",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "2×2m pavilion media wall",
    },
    // Monitors & peripherals
    {
      assetTag: "ABHI-MON-001",
      category: "Monitor",
      location: "London",
      model: "Dell UltraSharp U2723QE",
      serialNumber: "U2723-UK-7001",
      purchaseDate: "2024-09-12",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Dual desk kit · membership ops",
    },
    {
      assetTag: "ABHI-MON-002",
      category: "Monitor",
      location: "Cambridge",
      model: "LG UltraFine 27",
      serialNumber: "LGUF27-UK-7002",
      purchaseDate: "2025-03-04",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Cambridge hot-desk monitors (pair)",
    },
    {
      assetTag: "ABHI-PER-001",
      category: "Peripheral",
      location: "London",
      model: "CalDigit TS4 Dock",
      serialNumber: "TS4-UK-7101",
      purchaseDate: "2024-09-12",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Thunderbolt dock pool · HQ (×6)",
    },
    {
      assetTag: "ABHI-PER-002",
      category: "Peripheral",
      location: "London",
      model: "Brother HL-L8260CDW",
      serialNumber: "BR8260-UK-7102",
      purchaseDate: "2023-11-05",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Colour laser · London admin floor",
    },
    // Flight cases
    {
      assetTag: "ABHI-CASE-001",
      category: "Flight Case",
      location: "London",
      model: "Peli 1650 Exhibition Case",
      serialNumber: "PELI1650-UK-8001",
      purchaseDate: "2023-09-01",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "Shell scheme hardware transit",
    },
    {
      assetTag: "ABHI-CASE-002",
      category: "Flight Case",
      location: "London",
      model: "Peli Air 1535",
      serialNumber: "PELI1535-UK-8002",
      purchaseDate: "2024-06-18",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "Camera + AV carry-on kit",
    },
    {
      assetTag: "ABHI-LIC-001",
      category: "Software Licence",
      location: "London",
      model: "Microsoft 365 Business Premium",
      serialNumber: "M365-ABHI-60SEATS",
      purchaseDate: "2025-07-01",
      operationalStatus: "Active Licence",
      firmwareVersion: "N/A",
      notes: "60 seats · GBP annual billing",
    },
  ];

  return {
    assets: seeds.map(buildSeedAsset),
    categories,
    locations,
  };
}

function createTalantonAssetRegistry(): AssetRegistryState {
  const categories = [
    "Laptop",
    "Camera",
    "Meeting Room Equipment",
    "Office Equipment",
    "Monitor",
    "Peripheral",
    "Software Licence",
  ];
  const locations = ["Nairobi HQ", "London Office", "Field Kit"];
  const seeds: SeedAsset[] = [
    {
      assetTag: "TI-LT-001",
      category: "Laptop",
      location: "Nairobi HQ",
      model: "Dell Latitude 5550",
      serialNumber: "DL5550-KE-1001",
      purchaseDate: "2025-04-12",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Assigned · Impact Director",
    },
    {
      assetTag: "TI-LT-002",
      category: "Laptop",
      location: "Nairobi HQ",
      model: "Lenovo ThinkPad X1 Carbon",
      serialNumber: "X1C-KE-1002",
      purchaseDate: "2025-06-02",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Assigned · Portfolio Ops",
    },
    {
      assetTag: "TI-LT-003",
      category: "Laptop",
      location: "London Office",
      model: "MacBook Pro 14",
      serialNumber: "MBP14-UK-1003",
      purchaseDate: "2025-02-18",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Assigned · Board Secretary travel kit",
    },
    {
      assetTag: "TI-CAM-001",
      category: "Camera",
      location: "Field Kit",
      model: "Sony ZV-E10 II",
      serialNumber: "ZVE10-KE-2001",
      purchaseDate: "2025-01-20",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Portfolio company site storytelling kit",
    },
    {
      assetTag: "TI-CAM-002",
      category: "Camera",
      location: "Nairobi HQ",
      model: "Canon EOS R50",
      serialNumber: "R50-KE-2002",
      purchaseDate: "2024-11-08",
      operationalStatus: "In Hangar",
      firmwareVersion: "N/A",
      notes: "Board / LP event photography",
    },
    {
      assetTag: "TI-MR-001",
      category: "Meeting Room Equipment",
      location: "Nairobi HQ",
      model: "Logitech Rally Bar",
      serialNumber: "RALLY-KE-3001",
      purchaseDate: "2024-09-15",
      operationalStatus: "In Service",
      firmwareVersion: "1.18.2",
      notes: "Boardroom hybrid meetings",
    },
    {
      assetTag: "TI-MR-002",
      category: "Meeting Room Equipment",
      location: "Nairobi HQ",
      model: "Samsung 75\" QLED Display",
      serialNumber: "Q75-KE-3002",
      purchaseDate: "2024-09-15",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Main boardroom presentation display",
    },
    {
      assetTag: "TI-OE-001",
      category: "Office Equipment",
      location: "Nairobi HQ",
      model: "HP LaserJet Pro MFP",
      serialNumber: "HPMFP-KE-4001",
      purchaseDate: "2024-05-22",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Admin floor · secure print",
    },
    {
      assetTag: "TI-OE-002",
      category: "Office Equipment",
      location: "London Office",
      model: "Herman Miller Aeron Chair (pool ×4)",
      serialNumber: "HM-UK-4002",
      purchaseDate: "2025-03-01",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Hot-desk seating pool",
    },
    {
      assetTag: "TI-MON-001",
      category: "Monitor",
      location: "Nairobi HQ",
      model: "Dell UltraSharp U2723QE",
      serialNumber: "U2723-KE-5001",
      purchaseDate: "2025-04-12",
      operationalStatus: "In Service",
      firmwareVersion: "N/A",
      notes: "Dual desk kit · portfolio ops",
    },
    {
      assetTag: "TI-LIC-001",
      category: "Software Licence",
      location: "Nairobi HQ",
      model: "Microsoft 365 Business Premium",
      serialNumber: "M365-TI-40SEATS",
      purchaseDate: "2025-07-01",
      operationalStatus: "Active Licence",
      firmwareVersion: "N/A",
      notes: "40 seats · USD annual billing",
    },
  ];

  return {
    assets: seeds.map(buildSeedAsset),
    categories,
    locations,
  };
}

export function createInitialAssetRegistry(): AssetRegistryState {
  assetCounter = 0;

  if (typeof window !== "undefined") {
    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        const { createOnwardAirAssetRegistry } =
          require("@/lib/onwardair/operations-data") as typeof import("@/lib/onwardair/operations-data");
        return createOnwardAirAssetRegistry();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserSaecSurface } =
        require("@/lib/saec-surface") as typeof import("@/lib/saec-surface");
      if (isBrowserSaecSurface()) {
        return createSaecAssetRegistry();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        return createAbhiAssetRegistry();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (isBrowserTalantonImpactSurface()) {
        return createTalantonAssetRegistry();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCorpCentreSurface } =
        require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
      if (isBrowserCorpCentreSurface()) {
        const categories = [
          "Laptop",
          "Desktop",
          "Monitor",
          "Network Switch",
          "Firewall",
          "Server",
          "Mobile Phone",
          "Access Point",
          "Software Licence",
          "Peripheral",
        ];
        const locations = ["Alexandria", "Melbourne", "Brisbane"];
        const seeds: SeedAsset[] = [
          {
            assetTag: "CC-LT-001",
            category: "Laptop",
            location: "Alexandria",
            model: "Dell Latitude 5540",
            serialNumber: "DL5540-AU-1001",
            purchaseDate: "2025-03-12",
            operationalStatus: "In Service",
            firmwareVersion: "N/A",
            notes: "Assigned · Peter Durning",
          },
          {
            assetTag: "CC-LT-002",
            category: "Laptop",
            location: "Alexandria",
            model: "Lenovo ThinkPad T14",
            serialNumber: "LT-T14-AU-1002",
            purchaseDate: "2025-05-02",
            operationalStatus: "In Service",
            firmwareVersion: "N/A",
            notes: "Assigned · Daniel Sazdanoff",
          },
          {
            assetTag: "CC-SRV-001",
            category: "Server",
            location: "Alexandria",
            model: "Dell PowerEdge R760",
            serialNumber: "PE-R760-AU-2201",
            purchaseDate: "2024-11-18",
            operationalStatus: "In Service",
            firmwareVersion: "2.4.1",
            notes: "Primary virtualisation host · Alexandria rack A2",
          },
          {
            assetTag: "CC-FW-001",
            category: "Firewall",
            location: "Alexandria",
            model: "Fortinet FortiGate 100F",
            serialNumber: "FG100F-AU-3301",
            purchaseDate: "2024-09-01",
            operationalStatus: "In Service",
            firmwareVersion: "7.4.3",
            notes: "Edge firewall · Sydney internet handoff",
          },
          {
            assetTag: "CC-SW-001",
            category: "Network Switch",
            location: "Alexandria",
            model: "Cisco Catalyst 9200",
            serialNumber: "C9200-AU-4401",
            purchaseDate: "2024-09-01",
            operationalStatus: "In Service",
            firmwareVersion: "17.12.1",
            notes: "Core switch · Alexandria floor 3",
          },
          {
            assetTag: "CC-AP-001",
            category: "Access Point",
            location: "Melbourne",
            model: "Ubiquiti UniFi 6 Pro",
            serialNumber: "U6P-AU-5501",
            purchaseDate: "2025-01-20",
            operationalStatus: "In Service",
            firmwareVersion: "6.6.77",
            notes: "Melbourne office Wi-Fi",
          },
          {
            assetTag: "CC-MON-001",
            category: "Monitor",
            location: "Alexandria",
            model: "Dell UltraSharp U2723QE",
            serialNumber: "U2723-AU-6601",
            purchaseDate: "2025-03-12",
            operationalStatus: "In Service",
            firmwareVersion: "N/A",
            notes: "Dual monitor kit · ops desk",
          },
          {
            assetTag: "CC-PH-001",
            category: "Mobile Phone",
            location: "Brisbane",
            model: "iPhone 15 Pro",
            serialNumber: "IP15P-AU-7701",
            purchaseDate: "2025-06-08",
            operationalStatus: "In Service",
            firmwareVersion: "iOS 18.5",
            notes: "Field technician handset · John Amoroso",
          },
          {
            assetTag: "CC-LIC-001",
            category: "Software Licence",
            location: "Alexandria",
            model: "Microsoft 365 Business Premium",
            serialNumber: "M365-CC-45SEATS",
            purchaseDate: "2025-07-01",
            operationalStatus: "Active Licence",
            firmwareVersion: "N/A",
            notes: "45 seats · AUD billing",
          },
          {
            assetTag: "CC-DSK-001",
            category: "Desktop",
            location: "Alexandria",
            model: "HP EliteDesk 800 G9",
            serialNumber: "ED800-AU-8801",
            purchaseDate: "2024-08-14",
            operationalStatus: "Maintenance",
            firmwareVersion: "N/A",
            notes: "Spare bench PC · awaiting SSD swap",
          },
        ];
        return {
          assets: seeds.map(buildSeedAsset),
          categories,
          locations,
        };
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserDemoSurface, getDemoEnterpriseFixtures } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        const fixtures = getDemoEnterpriseFixtures();
        const locations = fixtures.offices.map((office) => office.city);
        const techCategories = [...TECHNOLOGY_ASSET_CATEGORIES];
        const assets = fixtures.assets.slice(0, 36).map((row, index) => {
          const office =
            fixtures.offices.find((item) => item.id === row.officeId) ?? fixtures.offices[0];
          const category = techCategories[index % techCategories.length] ?? "Laptop";
          return buildSeedAsset({
            id: row.id,
            assetTag: `IT-${String(index + 1).padStart(4, "0")}`,
            category,
            location: office?.city ?? "Manchester",
            model: row.sku ?? getModelsForCategory(category)[0] ?? "Laptop",
            serialNumber: `NST-${String(index + 1).padStart(5, "0")}`,
            operationalStatus: "In Service",
            purchaseDate: new Date().toISOString().slice(0, 10),
            firmwareVersion: "N/A",
            notes: `${fixtures.tag} · assigned to ${row.assignedTo}`,
            assignedToUserId: null,
            assignedClientId: null,
          });
        });
        return {
          assets,
          categories: [...TECHNOLOGY_ASSET_CATEGORIES],
          locations: locations.length ? locations : [...DEFAULT_ASSET_LOCATIONS],
        };
      }
    } catch {
      // Fall through to Internal registry.
    }

    try {
      const { isBrowserCustomerWorkspaceSurface } =
        require("@/lib/customer-workspace-surface") as typeof import("@/lib/customer-workspace-surface");
      if (isBrowserCustomerWorkspaceSurface()) {
        return {
          assets: [],
          categories: [...TECHNOLOGY_ASSET_CATEGORIES],
          locations: [],
        };
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserWolfCentralSurface } =
        require("@/lib/wolf/wolf-surface") as typeof import("@/lib/wolf/wolf-surface");
      if (isBrowserWolfCentralSurface()) {
        return {
          assets: [],
          categories: [...DEFAULT_ASSET_CATEGORIES],
          locations: [],
        };
      }
    } catch {
      // Fall through.
    }
  }

  const assets = [
    ...seedsForLocation("Barcelona", "client-1", "234"),
    ...seedsForLocation("Porto", "client-2", "876"),
    ...seedsForLocation("Oxford", "client-3", "445"),
  ].map(buildSeedAsset);

  return {
    assets,
    categories: [...DEFAULT_ASSET_CATEGORIES],
    locations: [...DEFAULT_ASSET_LOCATIONS],
  };
}

/** @deprecated Use createInitialAssetRegistry().assets */
export function createInitialAssets(): ManagedAsset[] {
  return createInitialAssetRegistry().assets;
}

export function getModelsForCategory(category: string): string[] {
  return MODELS_BY_CATEGORY[category] ?? ["Other / Custom"];
}

export function createBlankAsset(
  categories: string[],
  locations: string[],
  category?: string,
  location?: string,
): ManagedAsset {
  const resolvedCategory = category ?? categories[0] ?? "Laptop";
  const resolvedLocation = location ?? locations[0] ?? "";
  const models = getModelsForCategory(resolvedCategory);
  const code = locationCode(resolvedLocation);
  const prefix = categoryPrefix(resolvedCategory);

  return {
    id: createAssetId(),
    assetTag: `${prefix}-${code}-NEW`,
    category: resolvedCategory,
    location: resolvedLocation,
    model: models[0] ?? "",
    serialNumber: "",
    operationalStatus: defaultStatusForCategory(resolvedCategory),
    purchaseDate: new Date().toISOString().slice(0, 10),
    firmwareVersion: resolvedCategory === "Software Licence" ? "N/A" : FIRMWARE_VERSION_OPTIONS[0],
    drtk3BaseSerial: "",
    rtkCalibrationMode: "Uncalibrated",
    insuranceExpiry: "",
    lastMaintenanceDate: "",
    nextMaintenanceDue: "",
    totalFlightHours: 0,
    storageUsedGb: 0,
    assignedClientId: null,
    assignedToUserId: getOwnerUserIdForRegion(resolvedLocation),
    controlSource: resolvedCategory === "Software Licence" ? "Cloud" : "RC",
    notes: "",
  };
}

export function assetStatusClass(status: AssetOperationalStatus | string) {
  switch (status) {
    case "In Flight":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Standby":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Stopped":
      return "border-white/20 bg-white/10 text-white/60";
    case "Maintenance":
      return "border-amber-400/40 bg-amber-500/15 text-amber-200";
    case "In Hangar":
      return "border-violet-400/40 bg-violet-500/15 text-violet-200";
    case "In Service":
      return "border-cyan-400/40 bg-cyan-500/15 text-cyan-200";
    case "Active Licence":
      return "border-indigo-400/40 bg-indigo-500/15 text-indigo-200";
    default:
      return "border-white/15 bg-white/5 text-white/50";
  }
}

export function formatAssetDate(value: string) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function isAircraftAsset(asset: ManagedAsset) {
  return asset.category === "Aircraft";
}

export function isRtkAsset(asset: ManagedAsset) {
  return asset.category === "RTK Base Station";
}

export function isSoftwareAsset(asset: ManagedAsset) {
  return asset.category === "Software Licence";
}
