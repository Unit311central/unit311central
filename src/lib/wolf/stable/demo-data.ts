/**
 * Fictional UK stable used by the WOLF Stable Management demonstration.
 * Static module data only — it is not written into customer workspaces.
 * Veterinary, feeding, medication, ownership, and health slots are reserved
 * so those records can be attached later without reshaping the page.
 */

import { WOLF_GROUND_WEBRTC_PATH } from "@/lib/wolf/webrtc-playback";

export type StableFacilityStatus = "operational" | "attention" | "closed";

export type StableHorseStatus = "in-stable" | "turned-out" | "attention";

export type StableRecordSlot = {
  label: string;
  /** Null until a real record source is connected. */
  entries: null;
};

export type StableHorse = {
  id: string;
  name: string;
  breed: string;
  ageYears: number;
  sex: string;
  colour: string;
  status: StableHorseStatus;
  areaId: string;
  photo: string;
  summary: string;
  veterinary: StableRecordSlot;
  feeding: StableRecordSlot;
  medication: StableRecordSlot;
  ownership: StableRecordSlot;
  healthMonitoring: StableRecordSlot;
};

export type StableArea = {
  id: string;
  name: string;
  horseId: string;
};

export type SimulatedStableCamera = {
  id: string;
  name: string;
  areaId: string;
  horseId: string;
  mode: "simulated";
  image: string;
};

export type WebRtcStableCamera = {
  id: string;
  name: string;
  areaId: string;
  horseId: string;
  mode: "webrtc";
  /** Same-origin signalling route already used by WOLF Test Ground WebRTC. */
  signallingPath: string;
};

export type StableCamera = SimulatedStableCamera | WebRtcStableCamera;

export type StableEnvironmentReading = {
  id: "temperature" | "humidity" | "air-quality" | "ventilation";
  label: string;
  value: string;
  detail: string;
};

export type StableEnvironment = {
  /** Simulated until a yard sensor feed is connected. */
  source: "simulated";
  sensorId: null;
  readings: StableEnvironmentReading[];
};

export type StableAlertCategory =
  | "camera-offline"
  | "unusual-movement"
  | "temperature-threshold"
  | "horse-absent";

export type StableAlert = {
  id: string;
  category: StableAlertCategory;
  title: string;
  detail: string;
  /** Active incidents count toward the facility metric. Scenarios do not. */
  active: boolean;
  /** Demonstration copy only. This module does not run detection. */
  demonstration: true;
  detectedBy: "demonstration-scenario";
};

export type StableFacility = {
  id: string;
  name: string;
  location: string;
  status: StableFacilityStatus;
  demonstration: true;
  photo: string;
  photoCredit: string;
  horses: StableHorse[];
  areas: StableArea[];
  cameras: StableCamera[];
  environment: StableEnvironment;
  alerts: StableAlert[];
};

/** Directory row. Example rows are listings only and are not live facilities. */
export type StableDirectoryRow = {
  id: string;
  name: string;
  location: string;
  live: boolean;
  horses: number | null;
  areas: number | null;
  cameras: number | null;
  alerts: number | null;
};

const emptyRecords = {
  veterinary: { label: "Veterinary records", entries: null },
  feeding: { label: "Feeding schedule", entries: null },
  medication: { label: "Medication", entries: null },
  ownership: { label: "Ownership", entries: null },
  healthMonitoring: { label: "Health monitoring", entries: null },
} as const;

function horse(
  input: Omit<StableHorse, keyof typeof emptyRecords>,
): StableHorse {
  return { ...input, ...emptyRecords };
}

export const WOLF_STABLE_FACILITIES: readonly StableFacility[] = [
  {
    id: "windsor-estate-stables",
    name: "Windsor Estate Stables",
    location: "Windsor, Berkshire, United Kingdom",
    status: "operational",
    demonstration: true,
    photo: "/wolf/stable/facility.jpg",
    photoCredit: "Wikimedia Commons — Avelengo, Giovanni Ussi. Demonstration photograph, not the Windsor site.",
    horses: [
      horse({
        id: "windsor-star",
        name: "Windsor Star",
        breed: "Coloured Cob",
        ageYears: 9,
        sex: "Gelding",
        colour: "Chestnut and white",
        status: "in-stable",
        areaId: "area-01",
        photo: "/wolf/stable/camera-01.jpg",
        summary: "Quiet yard horse. Assigned to Stable Area 01 for the demonstration.",
      }),
      horse({
        id: "castle-night",
        name: "Castle Night",
        breed: "Irish Draught",
        ageYears: 14,
        sex: "Gelding",
        colour: "Black, broad blaze",
        status: "in-stable",
        areaId: "area-02",
        photo: "/wolf/stable/camera-02.jpg",
        summary: "Senior horse on a light workload. Assigned to Stable Area 02.",
      }),
      horse({
        id: "royal-oak",
        name: "Royal Oak",
        breed: "Thoroughbred",
        ageYears: 7,
        sex: "Mare",
        colour: "Bay, small star",
        status: "in-stable",
        areaId: "area-03",
        photo: "/wolf/stable/camera-03.jpg",
        summary: "Competition horse kept in during the day. Assigned to Stable Area 03.",
      }),
      horse({
        id: "berkshire-belle",
        name: "Berkshire Belle",
        breed: "Welsh Cob",
        ageYears: 12,
        sex: "Mare",
        colour: "Bay roan, broad blaze",
        status: "in-stable",
        areaId: "area-04",
        photo: "/wolf/stable/camera-04.jpg",
        summary: "Reliable riding cob. Assigned to Stable Area 04.",
      }),
      horse({
        id: "thames-mist",
        name: "Thames Mist",
        breed: "Connemara",
        ageYears: 11,
        sex: "Mare",
        colour: "Dark bay, narrow star",
        status: "in-stable",
        areaId: "area-05",
        photo: "/wolf/stable/horse-05.jpg",
        summary: "Assigned to Stable Area 05, the yard position wired to the existing WOLF Ground camera path.",
      }),
    ],
    areas: [
      { id: "area-01", name: "Stable Area 01", horseId: "windsor-star" },
      { id: "area-02", name: "Stable Area 02", horseId: "castle-night" },
      { id: "area-03", name: "Stable Area 03", horseId: "royal-oak" },
      { id: "area-04", name: "Stable Area 04", horseId: "berkshire-belle" },
      { id: "area-05", name: "Stable Area 05", horseId: "thames-mist" },
    ],
    cameras: [
      {
        id: "camera-01",
        name: "Camera 01",
        areaId: "area-01",
        horseId: "windsor-star",
        mode: "simulated",
        image: "/wolf/stable/camera-01.jpg",
      },
      {
        id: "camera-02",
        name: "Camera 02",
        areaId: "area-02",
        horseId: "castle-night",
        mode: "simulated",
        image: "/wolf/stable/camera-02.jpg",
      },
      {
        id: "camera-03",
        name: "Camera 03",
        areaId: "area-03",
        horseId: "royal-oak",
        mode: "simulated",
        image: "/wolf/stable/camera-03.jpg",
      },
      {
        id: "camera-04",
        name: "Camera 04",
        areaId: "area-04",
        horseId: "berkshire-belle",
        mode: "simulated",
        image: "/wolf/stable/camera-04.jpg",
      },
      {
        id: "camera-05",
        name: "Camera 05",
        areaId: "area-05",
        horseId: "thames-mist",
        mode: "webrtc",
        signallingPath: WOLF_GROUND_WEBRTC_PATH,
      },
    ],
    environment: {
      source: "simulated",
      sensorId: null,
      readings: [
        {
          id: "temperature",
          label: "Temperature",
          value: "14.6°C",
          detail: "Yard aisle, afternoon",
        },
        {
          id: "humidity",
          label: "Humidity",
          value: "62%",
          detail: "Within the usual stable range",
        },
        {
          id: "air-quality",
          label: "Air quality",
          value: "Good",
          detail: "Index 28 — demonstration reading",
        },
        {
          id: "ventilation",
          label: "Ventilation",
          value: "Running",
          detail: "Ridge vents open, fans on low",
        },
      ],
    },
    alerts: [
      {
        id: "scenario-camera-offline",
        category: "camera-offline",
        title: "Camera offline",
        detail: "A monitored camera stops publishing. WOLF would open an incident against that stable area.",
        active: false,
        demonstration: true,
        detectedBy: "demonstration-scenario",
      },
      {
        id: "scenario-unusual-movement",
        category: "unusual-movement",
        title: "Unusual movement",
        detail: "Activity outside the normal night pattern in an assigned stable. Not an automated detection.",
        active: false,
        demonstration: true,
        detectedBy: "demonstration-scenario",
      },
      {
        id: "scenario-temperature",
        category: "temperature-threshold",
        title: "Temperature threshold exceeded",
        detail: "Aisle temperature above the yard limit. The reading on this page is simulated.",
        active: false,
        demonstration: true,
        detectedBy: "demonstration-scenario",
      },
      {
        id: "scenario-horse-absent",
        category: "horse-absent",
        title: "Horse absent from assigned stable",
        detail: "The horse is not in the stable area on the schedule. Staff would confirm turnout before escalating.",
        active: false,
        demonstration: true,
        detectedBy: "demonstration-scenario",
      },
    ],
  },
];

export function stableFacilityById(id: string): StableFacility | null {
  return WOLF_STABLE_FACILITIES.find((facility) => facility.id === id) ?? null;
}

export function stableHorse(facility: StableFacility, horseId: string): StableHorse | null {
  return facility.horses.find((entry) => entry.id === horseId) ?? null;
}

export function stableArea(facility: StableFacility, areaId: string): StableArea | null {
  return facility.areas.find((entry) => entry.id === areaId) ?? null;
}

export function activeStableAlerts(facility: StableFacility): StableAlert[] {
  return facility.alerts.filter((alert) => alert.active);
}

const EXAMPLE_STABLE_DIRECTORY: readonly StableDirectoryRow[] = [
  {
    id: "lambourn-downs-stables",
    name: "Lambourn Downs Stables",
    location: "Lambourn, Berkshire, United Kingdom",
    live: false,
    horses: null,
    areas: null,
    cameras: null,
    alerts: null,
  },
  {
    id: "highclere-park-stables",
    name: "Highclere Park Stables",
    location: "Highclere, Hampshire, United Kingdom",
    live: false,
    horses: null,
    areas: null,
    cameras: null,
    alerts: null,
  },
];

/** Windsor is the only live facility. The other rows are example listings. */
export const WOLF_STABLE_DIRECTORY: readonly StableDirectoryRow[] = [
  ...WOLF_STABLE_FACILITIES.map((facility) => ({
    id: facility.id,
    name: facility.name,
    location: facility.location,
    live: true,
    horses: facility.horses.length,
    areas: facility.areas.length,
    cameras: facility.cameras.length,
    alerts: activeStableAlerts(facility).length,
  })),
  ...EXAMPLE_STABLE_DIRECTORY,
];

/** Camera 05, the real WebRTC tile, is always first. Simulated cameras follow. */
export function stableCamerasInMonitorOrder(facility: StableFacility): StableCamera[] {
  return [...facility.cameras].sort((left, right) => {
    if (left.mode === "webrtc" && right.mode !== "webrtc") return -1;
    if (right.mode === "webrtc" && left.mode !== "webrtc") return 1;
    return left.name.localeCompare(right.name);
  });
}
