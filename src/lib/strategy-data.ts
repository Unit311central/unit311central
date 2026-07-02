export type StrategyCategory = "surveying" | "inspection" | "media";

export type StrategyItem = {
  id: string;
  category: StrategyCategory;
  label: string;
  sortOrder: number;
  notes: string;
  priority: number | null;
  updatedAt: string;
};

export const STRATEGY_PRIORITY_OPTIONS = [1, 2, 3, 4, 5] as const;

/** Matrice 4T hardware / software required to deliver each capability (reference data). */
export const STRATEGY_MATRICE_4T_FEATURES: Record<StrategyCategory, Record<string, string>> = {
  surveying: {
    "Stockpile & volume Analytics":
      "Onboard mapping camera, D-RTK 3 base station, WebODM volumetrics",
    "Construction & volume Surveying":
      "Onboard mapping camera, D-RTK 3 RTK positioning, WebODM",
    "Site measurements": "Onboard mapping camera, D-RTK 3, DJI Terra measurements",
    "Earthworks monitoring": "Onboard mapping camera, grid missions, WebODM change detection",
    "Construction progress intelligence":
      "Onboard mapping camera, FlightHub 2 missions, WebODM timeline",
    "Point clouds": "Onboard mapping camera, WebODM photogrammetry / DJI Terra",
    Orthomosaics: "Onboard mapping camera, WebODM orthophoto processing",
    "DSM/DTM models": "Onboard mapping camera, WebODM DSM/DTM export",
    Volumetrics: "Onboard mapping camera, D-RTK 3, WebODM cut/fill analysis",
    "Progress comparison": "Onboard mapping camera, WebODM temporal comparison",
  },
  inspection: {
    "Building & roof inspections": "Telephoto zoom camera, omnidirectional obstacle sensing",
    "Solar inspections (thermal)": "Thermal camera, telephoto zoom camera",
    "Industrial inspections": "Telephoto zoom camera, FlightHub 2 waypoint missions",
    Warehouses: "Telephoto zoom camera, indoor obstacle sensing",
    "Logistics parks": "Mapping camera + telephoto zoom, corridor missions",
    "Rail inspections": "Telephoto zoom camera, linear corridor flight paths",
    "Road inspections": "Mapping camera, telephoto zoom for defect detail",
    "Pipeline inspections": "Telephoto zoom camera, corridor mapping missions",
    "Utility inspections": "Telephoto zoom camera, thermal camera",
    "Asset condition reporting": "Telephoto zoom camera, FlightHub 2 media capture",
  },
  media: {
    "Real estate": "Onboard wide camera, 4K stabilised video",
    Hospitality: "Onboard wide camera, gimbal-stabilised cinematic video",
    Tourism: "Onboard wide camera, intelligent flight modes",
    "Construction marketing": "Onboard wide + tele cameras, 4K HDR video",
    Marinas: "Onboard wide camera, waypoint missions over water",
    Ports: "Wide camera + telephoto zoom for vessel detail",
    "Yacht marketing": "Onboard wide camera, low-altitude cinematic passes",
    "Corporate content": "Onboard wide camera, smooth gimbal flight modes",
    "Event coverage": "Onboard wide camera, 4K live view / recording",
  },
};

export function getMatrice4tFeature(category: StrategyCategory, label: string): string {
  return STRATEGY_MATRICE_4T_FEATURES[category][label] ?? "—";
}

export const STRATEGY_COLUMNS: {
  id: StrategyCategory;
  title: string;
  labels: string[];
}[] = [
  {
    id: "surveying",
    title: "Surveying & Geospatial Intelligence",
    labels: [
      "Stockpile & volume Analytics",
      "Construction & volume Surveying",
      "Site measurements",
      "Earthworks monitoring",
      "Construction progress intelligence",
      "Point clouds",
      "Orthomosaics",
      "DSM/DTM models",
      "Volumetrics",
      "Progress comparison",
    ],
  },
  {
    id: "inspection",
    title: "Inspection & Asset Intelligence",
    labels: [
      "Building & roof inspections",
      "Solar inspections (thermal)",
      "Industrial inspections",
      "Warehouses",
      "Logistics parks",
      "Rail inspections",
      "Road inspections",
      "Pipeline inspections",
      "Utility inspections",
      "Asset condition reporting",
    ],
  },
  {
    id: "media",
    title: "Premium Media & Broadcast",
    labels: [
      "Real estate",
      "Hospitality",
      "Tourism",
      "Construction marketing",
      "Marinas",
      "Ports",
      "Yacht marketing",
      "Corporate content",
      "Event coverage",
    ],
  },
];

type DbStrategyItem = {
  id: string;
  category: StrategyCategory;
  label: string;
  sort_order: number;
  notes: string | null;
  priority: number | null;
  updated_at: string;
};

export function mapStrategyItem(row: DbStrategyItem): StrategyItem {
  return {
    id: row.id,
    category: row.category,
    label: row.label,
    sortOrder: row.sort_order,
    notes: row.notes ?? "",
    priority: row.priority,
    updatedAt: row.updated_at,
  };
}
