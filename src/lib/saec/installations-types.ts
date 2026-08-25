/** SAEC bespoke Installations — demo operational asset types (workspace-scoped). */

export const SAEC_ELEVATOR_MODELS = [
  "KLH Goods Lift",
  "KLK1 MRA Lift",
  "KLG Panorama Elevator",
  "KLW MRL Lift",
] as const;

export const SAEC_ESCALATOR_MODELS = [
  "KLF Commercial",
  "KRF/KLRP Moving Walk",
] as const;

export type SaecElevatorModel = (typeof SAEC_ELEVATOR_MODELS)[number];
export type SaecEscalatorModel = (typeof SAEC_ESCALATOR_MODELS)[number];

export type SaecInstallationAssetType = "elevator" | "escalator";

export type SaecAssetOperationalStatus = "online" | "offline" | "maintenance";

export type SaecMaintenanceStatus = "ok" | "due" | "overdue" | "scheduled";

export type SaecContractStatus = "active" | "expired" | "pending";

export type SaecEngineerFieldStatus = "On Site" | "En Route" | "Available" | "Off Duty";

export type SaecInstallationCityId =
  | "johannesburg"
  | "cape-town"
  | "durban"
  | "pretoria"
  | "gqeberha"
  | "vereeniging"
  | "soshanguve"
  | "east-london"
  | "bloemfontein"
  | "pietermaritzburg";

export type SaecInstallationCity = {
  id: SaecInstallationCityId;
  label: string;
  /** WGS84 latitude for geographic map placement. */
  latitude: number;
  /** WGS84 longitude for geographic map placement. */
  longitude: number;
  /** Optional label offset (px) when cities cluster — marker stays at geographic point. */
  labelOffsetX?: number;
  labelOffsetY?: number;
};

export type SaecInstallationAsset = {
  id: string;
  workspaceId: string;
  assetType: SaecInstallationAssetType;
  assetCode: string;
  model: string;
  siteName: string;
  customerName: string;
  cityId: SaecInstallationCityId;
  cityLabel: string;
  levelLabel: string;
  status: SaecAssetOperationalStatus;
  maintenanceStatus: SaecMaintenanceStatus;
  contractStatus: SaecContractStatus;
  assignedEngineerId: string | null;
  assignedEngineerName: string | null;
  engineerFieldStatus: SaecEngineerFieldStatus | null;
  nextMaintenanceDate: string | null;
  lastMaintenanceDate: string | null;
  maintenanceFrequencyMonths: number;
  installedDate: string;
  faults: SaecInstallationFault[];
  documents: SaecInstallationDocument[];
  createdAt: string;
  updatedAt: string;
};

export type SaecInstallationFault = {
  id: string;
  reportedAt: string;
  summary: string;
  severity: "low" | "medium" | "high";
  status: "open" | "resolved";
};

export type SaecInstallationDocument = {
  id: string;
  label: string;
  uploadedAt: string;
};

export type SaecMaintenanceRecord = {
  id: string;
  workspaceId: string;
  assetId: string;
  date: string;
  engineerName: string;
  maintenanceType: string;
  result: string;
  notes: string;
  createdAt: string;
};

export type SaecCitySiteSummary = {
  id: string;
  siteName: string;
  customerName: string;
  unitCount: number;
};

export type SaecCityRecentAsset = {
  id: string;
  assetCode: string;
  siteName: string;
  status: SaecAssetOperationalStatus;
};

export type SaecCityAggregate = {
  cityId: SaecInstallationCityId;
  cityLabel: string;
  latitude: number;
  longitude: number;
  labelOffsetX?: number;
  labelOffsetY?: number;
  total: number;
  online: number;
  offline: number;
  maintenanceDue: number;
  overdue: number;
  engineersAssigned: number;
  engineersOnRoad: number;
  sites: SaecCitySiteSummary[];
  recentAssets: SaecCityRecentAsset[];
};

export type SaecInstallationsDashboardSnapshot = {
  assetType: SaecInstallationAssetType;
  kpis: SaecInstallationsKpis;
  cities: SaecCityAggregate[];
  engineersOnRoad: SaecEngineerAssignmentSummary[];
};

export type SaecInstallationsKpis = {
  total: number;
  online: number;
  offline: number;
  maintenanceDue: number;
  overdueMaintenance: number;
  engineersOnRoad: number;
  openServiceAssignments: number;
};

export type SaecEngineerAssignmentSummary = {
  engineerId: string;
  engineerName: string;
  assetCode: string;
  assignmentLabel: string;
  cityLabel: string;
  status: SaecEngineerFieldStatus;
};

export type SaecInstallationAssetInput = {
  assetType: SaecInstallationAssetType;
  assetCode: string;
  model: string;
  siteName: string;
  customerName: string;
  cityId: SaecInstallationCityId;
  levelLabel: string;
  status: SaecAssetOperationalStatus;
  maintenanceStatus: SaecMaintenanceStatus;
  contractStatus: SaecContractStatus;
  assignedEngineerId?: string | null;
  assignedEngineerName?: string | null;
  engineerFieldStatus?: SaecEngineerFieldStatus | null;
  nextMaintenanceDate?: string | null;
  lastMaintenanceDate?: string | null;
  maintenanceFrequencyMonths?: number;
  installedDate?: string;
};
