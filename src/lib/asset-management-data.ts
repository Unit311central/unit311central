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
    default:
      return "AST";
  }
}

function defaultStatusForCategory(category: string): AssetOperationalStatus {
  if (category === "Software Licence") return "Active Licence";
  if (category === "Charging Hub") return "In Service";
  if (category === "Transport Case") return "In Hangar";
  return "Standby";
}

type SeedAsset = {
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
    id: `asset-${assetCounter}`,
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

export function createInitialAssetRegistry(): AssetRegistryState {
  assetCounter = 0;

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
  const resolvedCategory = category ?? categories[0] ?? "Aircraft";
  const resolvedLocation = location ?? locations[0] ?? "Oxford";
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
