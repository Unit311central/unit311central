export type HealthComponentStatus = "ok" | "degraded" | "failed" | "unknown";

export type OverallHealthStatus = "operational" | "critical" | "degraded";

export type HealthComponentId =
  | "application"
  | "database"
  | "supabase"
  | "storage"
  | "openai"
  | "github_monitoring";

export type HealthComponentReport = {
  id: HealthComponentId;
  label: string;
  critical: boolean;
  status: HealthComponentStatus;
  /** Internal dashboard only — never sent on public /api/health */
  detail?: string;
};

export type HealthIncidentRow = {
  id: string;
  component: string;
  severity: "critical" | "warning";
  status: "open" | "resolved";
  startedAt: string;
  endedAt: string | null;
  summary: string;
};

export type ExternalMonitoringReport = {
  label: string;
  status: HealthComponentStatus;
  productionHealthUrl: string;
  workflowPath: string;
  lastCheckAt: string | null;
  lastFailureAt: string | null;
  lastRecoveryAt: string | null;
  lastHttpStatus: number | null;
};

export type SystemHealthReport = {
  overall: OverallHealthStatus;
  checkedAt: string;
  components: HealthComponentReport[];
  externalMonitoring: ExternalMonitoringReport;
  incidents: HealthIncidentRow[];
};

export const PRODUCTION_HEALTH_URL_DEFAULT =
  "https://client.unit311central.com/api/health";

export const UNIT311_HEALTH_WORKFLOW_PATH =
  ".github/workflows/unit311-health-check.yml";
