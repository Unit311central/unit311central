import { DRONE_ID, type Telemetry } from "@/lib/telemetry";

export type FlightProfileId = "random" | "spain" | "austin" | "france" | "oxford";

export type ProfileMapStyle = "satellite" | "urban";

type GeoPoint = {
  latitude: number;
  longitude: number;
  label: string;
};

type BaseFlightProfile = {
  id: FlightProfileId;
  buttonLabel: string;
  description: string;
  cruiseSpeedMph: number;
  startPosition: GeoPoint;
  /** Defaults to urban for orbit profiles and satellite for random. */
  mapStyle?: ProfileMapStyle;
};

export type OrbitFlightProfile = BaseFlightProfile & {
  mode: "orbit";
  orbitCenter: GeoPoint;
  orbitRadiusM: number;
};

export type RandomFlightProfile = BaseFlightProfile & {
  mode: "random";
};

export type FlightProfile = OrbitFlightProfile | RandomFlightProfile;

export const SIMULATION_TICK_SECONDS = 3;

const METERS_PER_DEGREE_LAT = 111_320;

/** Original demo — random walk near Perth, Australia. */
export const RANDOM_FLIGHT_PROFILE: RandomFlightProfile = {
  id: "random",
  buttonLabel: "Start Random Drone",
  description: "Random telemetry jitter near Perth, Australia (original demo behaviour).",
  mode: "random",
  cruiseSpeedMph: 24.6,
  startPosition: {
    latitude: 31.9523,
    longitude: 115.8613,
    label: "Perth Demo Site",
  },
};

/** 2 km orbit around survey home; takeoff at Carrer Pau Casals 17. */
export const SPAIN_FLIGHT_PROFILE: OrbitFlightProfile = {
  id: "spain",
  buttonLabel: "Start Spain Drone",
  description:
    "2 km orbit around Riells del Fai survey home. Takeoff at 17 Carrer Pau Casals, Barcelona province.",
  mode: "orbit",
  cruiseSpeedMph: 28,
  orbitCenter: {
    latitude: 41.693728664180846,
    longitude: 2.202948853438009,
    label: "Survey Home",
  },
  startPosition: {
    latitude: 41.6932577,
    longitude: 2.2018296,
    label: "17 Carrer Pau Casals, Riells del Fai",
  },
  orbitRadiusM: 2000,
};

/** 2 km orbit around Austin survey point; takeoff at Avalon Tech Ridge. */
export const AUSTIN_FLIGHT_PROFILE: OrbitFlightProfile = {
  id: "austin",
  buttonLabel: "Start Austin Drone",
  description:
    "2 km orbit around Austin survey point. Takeoff at Avalon Tech Ridge, Pflugerville.",
  mode: "orbit",
  cruiseSpeedMph: 28,
  orbitCenter: {
    latitude: 30.426462028009638,
    longitude: -97.65306271456492,
    label: "Austin Survey Point",
  },
  startPosition: {
    latitude: 30.457038,
    longitude: -97.647892,
    label: "Avalon Tech Ridge, 14100 John Henry Faulk Dr",
  },
  orbitRadiusM: 2000,
};

/** 2 km orbit at 45°33′N 41°07′59″E; satellite FPV like Oxford. */
export const FRANCE_FLIGHT_PROFILE: OrbitFlightProfile = {
  id: "france",
  buttonLabel: "Start France Drone",
  description:
    "2 km orbit around the France survey point. Uses the original satellite live video feed.",
  mode: "orbit",
  mapStyle: "satellite",
  cruiseSpeedMph: 28,
  orbitCenter: {
    latitude: 45.55,
    longitude: 41.13305555555556,
    label: "France Survey Point",
  },
  startPosition: {
    latitude: 45.552246,
    longitude: 41.1318,
    label: "France Survey Takeoff",
  },
  orbitRadiusM: 2000,
};

/** 2 km orbit around Oxford survey point; satellite FPV like the original random demo. */
export const OXFORD_FLIGHT_PROFILE: OrbitFlightProfile = {
  id: "oxford",
  buttonLabel: "Start Oxford Drone",
  description:
    "2 km orbit around Oxford, UK. Uses the original satellite live video feed.",
  mode: "orbit",
  mapStyle: "satellite",
  cruiseSpeedMph: 28,
  orbitCenter: {
    latitude: 51.978875174947305,
    longitude: -1.5308494323398467,
    label: "Oxford Survey Point",
  },
  startPosition: {
    latitude: 51.981121,
    longitude: -1.5308494323398467,
    label: "Oxford Survey Takeoff",
  },
  orbitRadiusM: 2000,
};

export const FLIGHT_PROFILES: FlightProfile[] = [
  RANDOM_FLIGHT_PROFILE,
  SPAIN_FLIGHT_PROFILE,
  AUSTIN_FLIGHT_PROFILE,
  FRANCE_FLIGHT_PROFILE,
  OXFORD_FLIGHT_PROFILE,
];

export function getFlightProfile(id: FlightProfileId): FlightProfile {
  const profile = FLIGHT_PROFILES.find((entry) => entry.id === id);
  if (!profile) {
    throw new Error(`Unknown flight profile: ${id}`);
  }
  return profile;
}

function metersPerDegreeLng(latitude: number) {
  return METERS_PER_DEGREE_LAT * Math.cos((latitude * Math.PI) / 180);
}

function isOrbitProfile(profile: FlightProfile): profile is OrbitFlightProfile {
  return profile.mode === "orbit";
}

function positionOnOrbit(profile: OrbitFlightProfile, angleRadians: number) {
  const latOffset =
    (profile.orbitRadiusM / METERS_PER_DEGREE_LAT) * Math.cos(angleRadians);
  const lngOffset =
    (profile.orbitRadiusM / metersPerDegreeLng(profile.orbitCenter.latitude)) *
    Math.sin(angleRadians);

  return {
    latitude: profile.orbitCenter.latitude + latOffset,
    longitude: profile.orbitCenter.longitude + lngOffset,
  };
}

export function angleFromPosition(
  profile: OrbitFlightProfile,
  latitude: number,
  longitude: number,
) {
  const deltaLatM = (latitude - profile.orbitCenter.latitude) * METERS_PER_DEGREE_LAT;
  const deltaLngM =
    (longitude - profile.orbitCenter.longitude) *
    metersPerDegreeLng(profile.orbitCenter.latitude);

  return Math.atan2(deltaLngM, deltaLatM);
}

function distanceBetweenM(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) {
  const midLat = (fromLat + toLat) / 2;
  const deltaLatM = (toLat - fromLat) * METERS_PER_DEGREE_LAT;
  const deltaLngM = (toLng - fromLng) * metersPerDegreeLng(midLat);
  return Math.hypot(deltaLatM, deltaLngM);
}

function moveTowardPoint(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
  stepM: number,
) {
  const remainingM = distanceBetweenM(fromLat, fromLng, toLat, toLng);
  if (remainingM <= stepM) {
    return { latitude: toLat, longitude: toLng };
  }

  const progress = stepM / remainingM;
  return {
    latitude: fromLat + (toLat - fromLat) * progress,
    longitude: fromLng + (toLng - fromLng) * progress,
  };
}

function approachSpeedMultiplier(
  profile: OrbitFlightProfile,
  latitude: number,
  longitude: number,
) {
  const distToEdge = distanceFromOrbitEdge(profile, latitude, longitude);
  if (distToEdge > 1500) return 1.5;
  if (distToEdge > 800) return 1.25;
  return 1.05;
}

function orbitEntryPoint(profile: OrbitFlightProfile, latitude: number, longitude: number) {
  const angle = angleFromPosition(profile, latitude, longitude);
  return {
    angle,
    ...positionOnOrbit(profile, angle),
  };
}

const ORBIT_ENTRY_TOLERANCE_M = 45;

function distanceFromOrbitEdge(
  profile: OrbitFlightProfile,
  latitude: number,
  longitude: number,
) {
  const distToCenter = distanceBetweenM(
    latitude,
    longitude,
    profile.orbitCenter.latitude,
    profile.orbitCenter.longitude,
  );
  return Math.abs(distToCenter - profile.orbitRadiusM);
}

function isOnOrbit(profile: OrbitFlightProfile, latitude: number, longitude: number) {
  return distanceFromOrbitEdge(profile, latitude, longitude) <= ORBIT_ENTRY_TOLERANCE_M;
}

function orbitAngleStep(profile: OrbitFlightProfile, speedMph: number) {
  const distanceM = speedMph * 0.44704 * SIMULATION_TICK_SECONDS;
  const circumference = 2 * Math.PI * profile.orbitRadiusM;
  return (distanceM / circumference) * 2 * Math.PI;
}

function jitterTelemetry(previous: Telemetry, profile: RandomFlightProfile): Telemetry {
  const latDelta = (Math.random() - 0.5) * 0.0004;
  const lngDelta = (Math.random() - 0.5) * 0.0004;
  const altDelta = (Math.random() - 0.5) * 8;
  const speedDelta = (Math.random() - 0.5) * 4;

  return {
    ...previous,
    status: "IN FLIGHT",
    latitude: previous.latitude + latDelta,
    longitude: previous.longitude + lngDelta,
    altitudeFt: Math.max(120, Math.min(400, previous.altitudeFt + altDelta)),
    speedMph: Math.max(8, Math.min(42, previous.speedMph + speedDelta)),
    batteryPct: Math.max(0, previous.batteryPct - 0.15 - Math.random() * 0.2),
    lastUpdated: new Date(),
  };
}

export function createInitialTelemetry(profile: FlightProfile): Telemetry {
  return {
    droneId: DRONE_ID,
    status: "STOPPED",
    latitude: profile.startPosition.latitude,
    longitude: profile.startPosition.longitude,
    altitudeFt: profile.mode === "orbit" ? 280 : 285,
    speedMph: profile.cruiseSpeedMph,
    batteryPct: 94.2,
    lastUpdated: new Date(),
  };
}

export function getInitialOrbitAngle(profile: FlightProfile) {
  if (!isOrbitProfile(profile)) return 0;
  return angleFromPosition(
    profile,
    profile.startPosition.latitude,
    profile.startPosition.longitude,
  );
}

export function advanceTelemetry(
  profile: FlightProfile,
  previous: Telemetry,
  angleRadians: number,
) {
  if (profile.mode === "random") {
    return {
      nextAngle: 0,
      telemetry: jitterTelemetry(previous, profile),
    };
  }

  if (!isOnOrbit(profile, previous.latitude, previous.longitude)) {
    const entry = orbitEntryPoint(profile, previous.latitude, previous.longitude);
    const approachSpeedMph =
      profile.cruiseSpeedMph *
      approachSpeedMultiplier(profile, previous.latitude, previous.longitude);
    const stepM = approachSpeedMph * 0.44704 * SIMULATION_TICK_SECONDS;
    const nextPosition = moveTowardPoint(
      previous.latitude,
      previous.longitude,
      entry.latitude,
      entry.longitude,
      stepM,
    );
    const altitudeDelta = (Math.random() - 0.5) * 4;

    return {
      nextAngle: entry.angle,
      telemetry: {
        ...previous,
        status: "IN FLIGHT" as const,
        latitude: nextPosition.latitude,
        longitude: nextPosition.longitude,
        altitudeFt: Math.max(220, Math.min(340, previous.altitudeFt + altitudeDelta)),
        speedMph: approachSpeedMph + (Math.random() - 0.5) * 2,
        batteryPct: Math.max(0, previous.batteryPct - 0.15 - Math.random() * 0.2),
        lastUpdated: new Date(),
      },
    };
  }

  const nextAngle = angleRadians + orbitAngleStep(profile, previous.speedMph);
  const position = positionOnOrbit(profile, nextAngle);
  const altitudeDelta = (Math.random() - 0.5) * 6;

  return {
    nextAngle,
    telemetry: {
      ...previous,
      status: "IN FLIGHT" as const,
      latitude: position.latitude,
      longitude: position.longitude,
      altitudeFt: Math.max(220, Math.min(340, previous.altitudeFt + altitudeDelta)),
      speedMph: profile.cruiseSpeedMph + (Math.random() - 0.5) * 2,
      batteryPct: Math.max(0, previous.batteryPct - 0.15 - Math.random() * 0.2),
      lastUpdated: new Date(),
    },
  };
}

export function getOrbitPathSamples(profile: FlightProfile, steps = 72): [number, number][] {
  if (!isOrbitProfile(profile)) return [];

  return Array.from({ length: steps }, (_, index) => {
    const angle = (index / steps) * 2 * Math.PI;
    const point = positionOnOrbit(profile, angle);
    return [point.latitude, point.longitude] as [number, number];
  });
}

export function getMapHomePosition(profile: FlightProfile): [number, number] | null {
  if (!isOrbitProfile(profile)) return null;
  return [profile.orbitCenter.latitude, profile.orbitCenter.longitude];
}

export function inferFlightProfile(latitude: number, longitude: number): FlightProfile {
  let closest: FlightProfile = RANDOM_FLIGHT_PROFILE;
  let closestDistanceM = Number.POSITIVE_INFINITY;

  for (const profile of FLIGHT_PROFILES) {
    const anchor =
      profile.mode === "orbit" ? profile.orbitCenter : profile.startPosition;
    const distanceM = distanceBetweenM(
      latitude,
      longitude,
      anchor.latitude,
      anchor.longitude,
    );
    const maxDistanceM = profile.mode === "orbit" ? profile.orbitRadiusM + 6000 : 5000;

    if (distanceM <= maxDistanceM && distanceM < closestDistanceM) {
      closest = profile;
      closestDistanceM = distanceM;
    }
  }

  return closest;
}

export function getProfileStartPosition(profile: FlightProfile): [number, number] {
  return [profile.startPosition.latitude, profile.startPosition.longitude];
}

export function getProfileMapStyle(profile: FlightProfile): ProfileMapStyle {
  if (profile.mapStyle) return profile.mapStyle;
  return profile.mode === "orbit" ? "urban" : "satellite";
}

export function getProfileWeatherLocation(profile: FlightProfile) {
  const anchor = profile.mode === "orbit" ? profile.orbitCenter : profile.startPosition;
  return {
    profileId: profile.id,
    latitude: anchor.latitude,
    longitude: anchor.longitude,
    label: anchor.label,
  };
}

export const TESTING_FLIGHT_PROFILE_IDS: FlightProfileId[] = ["random", "spain", "oxford"];
