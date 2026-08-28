import type { InternalOperationsView } from "@/lib/internal-operations-data";

/** PAILEX operational views — isolated from WOLF Central estate views. */
export const PAILEX_OPERATIONAL_VIEWS = [
  "pailex-dashboard",
  "pailex-animals-registry",
  "pailex-animals-monitoring",
  "pailex-animals-census",
  "pailex-animals-health",
  "pailex-containment-perimeter",
  "pailex-containment-patrols",
  "pailex-containment-incidents",
  "pailex-containment-alerts",
  "pailex-environment-weather",
  "pailex-environment-fire",
  "pailex-environment-flood",
  "pailex-environment-monitoring",
  "pailex-fleet-vehicles",
  "pailex-fleet-drones",
  "pailex-fleet-equipment",
  "pailex-drone-operations",
  "pailex-drone-missions",
  "pailex-drone-flight-logs",
  "pailex-support-requests",
  "pailex-support-maintenance",
  "pailex-training",
  "pailex-training-certifications",
  "pailex-training-competency",
  "pailex-projects-active",
  "pailex-projects-tasks",
  "pailex-documents",
  "pailex-documents-procedures",
  "pailex-documents-reports",
] as const satisfies readonly InternalOperationsView[];

export type PailexOperationalView = (typeof PAILEX_OPERATIONAL_VIEWS)[number];

export const PAILEX_SETTINGS_VIEWS = ["settings", "appearance", "users"] as const satisfies readonly InternalOperationsView[];

export function isPailexOperationalView(
  view: string | null | undefined,
): view is PailexOperationalView {
  return PAILEX_OPERATIONAL_VIEWS.includes(view as PailexOperationalView);
}

export function isPailexWorkspaceView(view: string | null | undefined): boolean {
  if (!view) return false;
  return (
    isPailexOperationalView(view) ||
    (PAILEX_SETTINGS_VIEWS as readonly string[]).includes(view)
  );
}
