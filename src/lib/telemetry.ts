export const DRONE_ID = "DC-TEST-001";

export type FlightStatus = "IN FLIGHT" | "STOPPED";

export type Telemetry = {
  droneId: string;
  status: FlightStatus;
  latitude: number;
  longitude: number;
  altitudeFt: number;
  speedMph: number;
  batteryPct: number;
  lastUpdated: Date;
};

export type TelemetryRow = {
  id: string;
  created_at: string;
  drone_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number | null;
  battery: number | null;
  status: string | null;
};

export type TelemetryInsert = {
  drone_id: string;
  timestamp: string;
  latitude: number;
  longitude: number;
  altitude: number;
  speed: number;
  battery: number;
  status: FlightStatus;
};

export function telemetryToInsert(telemetry: Telemetry): TelemetryInsert {
  return {
    drone_id: telemetry.droneId,
    timestamp: telemetry.lastUpdated.toISOString(),
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    altitude: telemetry.altitudeFt,
    speed: telemetry.speedMph,
    battery: telemetry.batteryPct,
    status: telemetry.status,
  };
}

export function rowToTelemetry(row: TelemetryRow): Telemetry {
  return {
    droneId: row.drone_id,
    status: row.status === "IN FLIGHT" ? "IN FLIGHT" : "STOPPED",
    latitude: row.latitude,
    longitude: row.longitude,
    altitudeFt: row.altitude ?? 0,
    speedMph: row.speed ?? 0,
    batteryPct: row.battery ?? 0,
    lastUpdated: new Date(row.timestamp),
  };
}
