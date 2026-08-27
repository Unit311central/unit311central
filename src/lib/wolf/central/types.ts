/** WOLF Central estate registry — summary-level deployment records (not customer workspaces). */

export type WolfOperationalStatus = "normal" | "attention";

export type WolfDomainSummary = {
  status: WolfOperationalStatus;
  headline: string;
  detail?: string;
};

export type WolfAnimalsSummary = WolfDomainSummary & {
  detections?: number;
  censusStatus?: string;
};

export type WolfContainmentSummary = WolfDomainSummary & {
  patrolsCompleted?: number;
  patrolsTotal?: number;
  anomalyCount?: number;
};

export type WolfEnvironmentSummary = WolfDomainSummary & {
  fireStatus?: string;
  floodStatus?: string;
};

export type WolfDroneOperationsSummary = WolfDomainSummary & {
  activeMissions?: number;
  completedMissions?: number;
  failedMissions?: number;
};

export type WolfReserveRecord = {
  id: string;
  slug: string;
  name: string;
  country: string;
  latitude: number;
  longitude: number;
  isDemo: boolean;
  deploymentStatus: string;
  largeDroneCount: number;
  smallDroneCount: number;
  dockCount: number;
  fleetOperational: number;
  fleetTotal: number;
  animals: WolfAnimalsSummary;
  containment: WolfContainmentSummary;
  environment: WolfEnvironmentSummary;
  droneOperations: WolfDroneOperationsSummary;
  attentionStatus: WolfOperationalStatus;
  /** Future customer workspace slug — null until provisioned. */
  futureWorkspaceSlug: string | null;
  hasCustomerWorkspace: boolean;
};

export type WolfEstateAlert = {
  id: string;
  reserveId: string;
  reserveName: string;
  title: string;
  detail: string;
  severity: WolfOperationalStatus;
  createdAt: string;
};

export type WolfEstateMetrics = {
  reserveCount: number;
  largeDrones: number;
  smallDrones: number;
  totalAircraft: number;
  docks: number;
  batteries: number;
};

export type WolfEstateSnapshot = {
  reserves: WolfReserveRecord[];
  alerts: WolfEstateAlert[];
  metrics: WolfEstateMetrics;
  generatedAt: string;
};
