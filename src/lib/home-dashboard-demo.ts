import {
  advanceTelemetry,
  createInitialTelemetry,
  getOrbitPathSamples,
  OXFORD_FLIGHT_PROFILE,
} from "@/lib/flight-simulation";
import type { Telemetry } from "@/lib/telemetry";

export const HOME_DASHBOARD_PROFILE = OXFORD_FLIGHT_PROFILE;

export function createHomeDashboardTelemetry(): Telemetry {
  return createInitialTelemetry(HOME_DASHBOARD_PROFILE);
}

export function advanceHomeDashboardTelemetry(
  previous: Telemetry,
  orbitAngle: number,
): { telemetry: Telemetry; nextAngle: number } {
  return advanceTelemetry(HOME_DASHBOARD_PROFILE, previous, orbitAngle);
}

export function getHomeDashboardOrbitPath(): [number, number][] {
  return getOrbitPathSamples(HOME_DASHBOARD_PROFILE);
}
