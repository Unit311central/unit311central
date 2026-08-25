import type { DashboardKpiItem } from "@/lib/dashboard-framework";
import { normalizeKpiRow } from "@/lib/dashboard-framework";

/** SAEC demonstration portfolio — aligned with Installations seed (400 + 400). */
export const SAEC_DEMO_UNITS_TOTAL = 800;
export const SAEC_DEMO_ELEVATORS = 400;
export const SAEC_DEMO_ESCALATORS = 400;

export function buildSaecExecutiveHomeKpis(): DashboardKpiItem[] {
  return normalizeKpiRow([
    {
      id: "units-managed",
      label: "Units Under Management",
      value: `${SAEC_DEMO_UNITS_TOTAL}+`,
      delta: "National footprint",
      tone: "positive",
      hint: "Demonstration portfolio across South Africa",
    },
    {
      id: "elevators",
      label: "Elevators",
      value: String(SAEC_DEMO_ELEVATORS),
      delta: "Installed base",
      tone: "neutral",
      hint: "Elevator installations under SAEC management",
    },
    {
      id: "escalators",
      label: "Escalators / Moving Walks",
      value: String(SAEC_DEMO_ESCALATORS),
      delta: "Installed base",
      tone: "neutral",
      hint: "Escalator and moving walk portfolio",
    },
    {
      id: "engineers-road",
      label: "Engineers on Road",
      value: "46",
      delta: "Field service today",
      tone: "positive",
      hint: "Active field engineers (demonstration)",
    },
    {
      id: "maintenance-due",
      label: "Maintenance Due",
      value: "71",
      delta: "Across portfolio",
      tone: "warning",
      hint: "Scheduled and due maintenance visits",
    },
    {
      id: "service-assignments",
      label: "Open Service Assignments",
      value: "68",
      delta: "Active workload",
      tone: "warning",
      hint: "Open service and fault assignments",
    },
    {
      id: "active-clients",
      label: "Active Clients",
      value: "12",
      delta: "Commercial portfolio",
      tone: "positive",
      hint: "Property, retail, healthcare and public sector clients",
    },
  ]);
}
