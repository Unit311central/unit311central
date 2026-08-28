import type { InternalOperationsView } from "@/lib/internal-operations-data";
import type { PailexDemoRecord } from "@/lib/pailex/pailex-demo-data";
import {
  PAILEX_ALERTS,
  PAILEX_ANIMAL_REGISTRY,
  PAILEX_CERTIFICATIONS,
  PAILEX_CONTAINMENT_INCIDENTS,
  PAILEX_DOCUMENTS,
  PAILEX_DEMO_LABEL,
  PAILEX_FLEET_DRONES,
  PAILEX_FLEET_VEHICLES,
  PAILEX_FLIGHT_LOGS,
  PAILEX_MISSIONS,
  PAILEX_PATROL_LOGS,
  PAILEX_PROJECTS,
  PAILEX_SUPPORT_REQUESTS,
  PAILEX_TASKS,
  PAILEX_TRAINING_RECORDS,
  PAILEX_WEATHER_SNAPSHOT,
} from "@/lib/pailex/pailex-demo-data";
import type { PailexOperationalView } from "@/lib/pailex/pailex-views";

export type PailexModulePageConfig = {
  title: string;
  eyebrow: string;
  description: string;
  records?: PailexDemoRecord[];
  metrics?: { label: string; value: string }[];
  note?: string;
};

export const PAILEX_MODULE_PAGES: Record<PailexOperationalView, PailexModulePageConfig> = {
  "pailex-dashboard": {
    title: "Dashboard",
    eyebrow: "PAILEX",
    description: "Reserve operations overview.",
  },
  "pailex-animals-registry": {
    title: "Animal Registry",
    eyebrow: "Animals",
    description: "Registered animal groups and tracking status for the PAILEX demo reserve.",
    records: PAILEX_ANIMAL_REGISTRY,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-animals-monitoring": {
    title: "Monitoring",
    eyebrow: "Animals",
    description: "Live detection and monitoring summary from reserve sensors and patrols.",
    metrics: [
      { label: "Detections (24h)", value: "47" },
      { label: "Active collars", value: "12" },
      { label: "Camera traps", value: "8" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-animals-census": {
    title: "Census",
    eyebrow: "Animals",
    description: "Census programme status for the demo reserve.",
    metrics: [
      { label: "Census status", value: "Completed" },
      { label: "Last census", value: "Aug 2026" },
      { label: "Species tracked", value: "14" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-animals-health": {
    title: "Health / Incidents",
    eyebrow: "Animals",
    description: "Animal health events and incident log.",
    records: [
      {
        id: "hlth-001",
        title: "Rhino visual check — Waterhole 7",
        status: "open",
        detail: "Scheduled ranger assessment",
        updatedAt: "2026-08-27T11:05:00Z",
      },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-containment-perimeter": {
    title: "Perimeter",
    eyebrow: "Containment",
    description: "Perimeter fence and gate status across the reserve boundary.",
    metrics: [
      { label: "Fence sectors", value: "18" },
      { label: "Gates monitored", value: "6" },
      { label: "Status", value: "1 anomaly" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-containment-patrols": {
    title: "Patrols",
    eyebrow: "Containment",
    description: "Patrol schedule and completion log.",
    records: PAILEX_PATROL_LOGS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-containment-incidents": {
    title: "Incidents",
    eyebrow: "Containment",
    description: "Containment incidents requiring follow-up.",
    records: PAILEX_CONTAINMENT_INCIDENTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-containment-alerts": {
    title: "Alerts",
    eyebrow: "Containment",
    description: "Active containment and perimeter alerts.",
    records: PAILEX_ALERTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-environment-weather": {
    title: "Weather",
    eyebrow: "Environment",
    description: "Current weather conditions at the reserve.",
    metrics: [
      { label: "Temperature", value: `${PAILEX_WEATHER_SNAPSHOT.temperatureC}°C` },
      { label: "Humidity", value: `${PAILEX_WEATHER_SNAPSHOT.humidityPct}%` },
      { label: "Wind", value: `${PAILEX_WEATHER_SNAPSHOT.windKph} km/h` },
      { label: "Conditions", value: PAILEX_WEATHER_SNAPSHOT.conditions },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-environment-fire": {
    title: "Fire",
    eyebrow: "Environment",
    description: "Fire risk monitoring and status.",
    metrics: [
      { label: "Fire risk", value: PAILEX_WEATHER_SNAPSHOT.fireRisk },
      { label: "Last assessment", value: "Today 06:00" },
      { label: "Status", value: "Normal" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-environment-flood": {
    title: "Flood",
    eyebrow: "Environment",
    description: "Flood and water level monitoring.",
    metrics: [
      { label: "Flood risk", value: PAILEX_WEATHER_SNAPSHOT.floodRisk },
      { label: "River levels", value: "Within range" },
      { label: "Status", value: "Normal" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-environment-monitoring": {
    title: "Environmental Monitoring",
    eyebrow: "Environment",
    description: "Environmental sensor network summary.",
    metrics: [
      { label: "Active sensors", value: "24" },
      { label: "Alerts (7d)", value: "0" },
      { label: "Status", value: "Normal" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-fleet-vehicles": {
    title: "Vehicles",
    eyebrow: "Fleet",
    description: "Ground fleet status for reserve operations.",
    records: PAILEX_FLEET_VEHICLES,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-fleet-drones": {
    title: "Drones",
    eyebrow: "Fleet",
    description: "WOLF drone fleet assigned to PAILEX.",
    records: PAILEX_FLEET_DRONES,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-fleet-equipment": {
    title: "Equipment",
    eyebrow: "Fleet",
    description: "Operational equipment and dock assets.",
    metrics: [
      { label: "Docks", value: "2" },
      { label: "Batteries", value: "8" },
      { label: "Operational", value: "4/4 aircraft" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-drone-operations": {
    title: "Operations",
    eyebrow: "Drone Operations",
    description: "Drone operations control summary.",
    metrics: [
      { label: "Active missions", value: "1" },
      { label: "Completed (week)", value: "11" },
      { label: "Status", value: "1 attention" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-drone-missions": {
    title: "Missions",
    eyebrow: "Drone Operations",
    description: "Scheduled and active drone missions.",
    records: PAILEX_MISSIONS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-drone-flight-logs": {
    title: "Flight Logs",
    eyebrow: "Drone Operations",
    description: "Recent flight activity log.",
    records: PAILEX_FLIGHT_LOGS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-support-requests": {
    title: "Support Requests",
    eyebrow: "Support",
    description: "Open support and service requests.",
    records: PAILEX_SUPPORT_REQUESTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-support-maintenance": {
    title: "Maintenance / Service",
    eyebrow: "Support",
    description: "Scheduled maintenance and service work orders.",
    records: PAILEX_SUPPORT_REQUESTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-training": {
    title: "Training",
    eyebrow: "Training",
    description: "Staff training programmes and completion status.",
    records: PAILEX_TRAINING_RECORDS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-training-certifications": {
    title: "Certifications",
    eyebrow: "Training",
    description: "Staff certifications and renewal tracking.",
    records: PAILEX_CERTIFICATIONS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-training-competency": {
    title: "Staff Competency",
    eyebrow: "Training",
    description: "Competency matrix for reserve operations staff.",
    metrics: [
      { label: "Drone operators", value: "4 certified" },
      { label: "Rangers", value: "12 active" },
      { label: "Recert due (90d)", value: "2" },
    ],
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-projects-active": {
    title: "Active Projects",
    eyebrow: "Projects",
    description: "Reserve improvement and operations projects.",
    records: PAILEX_PROJECTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-projects-tasks": {
    title: "Tasks",
    eyebrow: "Projects",
    description: "Open tasks across active projects.",
    records: PAILEX_TASKS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-documents": {
    title: "Documents",
    eyebrow: "Documents",
    description: "Reserve document library.",
    records: PAILEX_DOCUMENTS,
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-documents-procedures": {
    title: "Procedures",
    eyebrow: "Documents",
    description: "Standard operating procedures for reserve operations.",
    records: PAILEX_DOCUMENTS.filter((row) => row.title.toLowerCase().includes("procedure") || row.title.toLowerCase().includes("sop")),
    note: PAILEX_DEMO_LABEL,
  },
  "pailex-documents-reports": {
    title: "Reports",
    eyebrow: "Documents",
    description: "Operational and compliance reports.",
    records: [
      {
        id: "rpt-001",
        title: "Weekly operations summary",
        status: "normal",
        detail: "Week 34 · Generated 25 Aug 2026",
        updatedAt: "2026-08-25T17:00:00Z",
      },
      {
        id: "rpt-002",
        title: "Census completion report",
        status: "normal",
        detail: "Aug 2026 census programme",
        updatedAt: "2026-08-20T12:00:00Z",
      },
    ],
    note: PAILEX_DEMO_LABEL,
  },
};

export function resolvePailexModulePage(view: InternalOperationsView): PailexModulePageConfig | null {
  if (view in PAILEX_MODULE_PAGES) {
    return PAILEX_MODULE_PAGES[view as PailexOperationalView];
  }
  return null;
}
