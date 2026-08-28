/**
 * PAILEX demonstration records — clearly labelled sample data for the demo reserve.
 * Not real customer operational data.
 */

export type PailexDemoRecord = {
  id: string;
  title: string;
  status: "normal" | "attention" | "open" | "closed" | "scheduled";
  detail: string;
  updatedAt: string;
  category?: string;
};

export const PAILEX_DEMO_LABEL = "Demo / sample data";

export const PAILEX_ANIMAL_REGISTRY: PailexDemoRecord[] = [
  {
    id: "ani-001",
    title: "Lion pride — Sector 4",
    status: "normal",
    detail: "12 individuals · GPS collar active",
    updatedAt: "2026-08-27T14:20:00Z",
    category: "Predator",
  },
  {
    id: "ani-002",
    title: "White rhino group — Waterhole 7",
    status: "attention",
    detail: "3 individuals · Ranger visual check due",
    updatedAt: "2026-08-27T11:05:00Z",
    category: "Herbivore",
  },
  {
    id: "ani-003",
    title: "Elephant herd — Northern corridor",
    status: "normal",
    detail: "18 individuals · Last census matched",
    updatedAt: "2026-08-26T18:40:00Z",
    category: "Herbivore",
  },
  {
    id: "ani-004",
    title: "Leopard — Ridge camera trap",
    status: "normal",
    detail: "2 detections overnight",
    updatedAt: "2026-08-27T05:12:00Z",
    category: "Predator",
  },
];

export const PAILEX_PATROL_LOGS: PailexDemoRecord[] = [
  {
    id: "pat-001",
    title: "North perimeter — Dawn patrol",
    status: "normal",
    detail: "Completed · 06:00–08:15 · No breaches",
    updatedAt: "2026-08-27T08:15:00Z",
  },
  {
    id: "pat-002",
    title: "East fence line — Midday patrol",
    status: "attention",
    detail: "Completed · 1 anomaly logged near gate 3",
    updatedAt: "2026-08-27T13:42:00Z",
  },
  {
    id: "pat-003",
    title: "South boundary — Evening patrol",
    status: "scheduled",
    detail: "Scheduled · 17:30 start",
    updatedAt: "2026-08-27T12:00:00Z",
  },
];

export const PAILEX_CONTAINMENT_INCIDENTS: PailexDemoRecord[] = [
  {
    id: "inc-001",
    title: "Fence sensor spike — Gate 3",
    status: "attention",
    detail: "Under investigation · Ranger team dispatched",
    updatedAt: "2026-08-27T13:45:00Z",
  },
];

export const PAILEX_ALERTS: PailexDemoRecord[] = [
  {
    id: "alr-001",
    title: "Drone 02 battery health",
    status: "attention",
    detail: "Battery health declining — schedule maintenance",
    updatedAt: "2026-08-27T09:30:00Z",
  },
  {
    id: "alr-002",
    title: "Containment anomaly — Gate 3",
    status: "attention",
    detail: "Fence sensor spike during midday patrol",
    updatedAt: "2026-08-27T13:45:00Z",
  },
];

export const PAILEX_FLEET_VEHICLES: PailexDemoRecord[] = [
  {
    id: "veh-001",
    title: "Land Cruiser — Patrol 1",
    status: "normal",
    detail: "Operational · 42,180 km",
    updatedAt: "2026-08-27T07:00:00Z",
  },
  {
    id: "veh-002",
    title: "Ranger bakkie — South sector",
    status: "normal",
    detail: "Operational · Fuel 68%",
    updatedAt: "2026-08-27T10:15:00Z",
  },
];

export const PAILEX_FLEET_DRONES: PailexDemoRecord[] = [
  {
    id: "dron-001",
    title: "WOLF Large Drone 01",
    status: "normal",
    detail: "Docked · Mission-ready",
    updatedAt: "2026-08-27T12:00:00Z",
  },
  {
    id: "dron-002",
    title: "WOLF Large Drone 02",
    status: "attention",
    detail: "Battery health declining",
    updatedAt: "2026-08-27T09:30:00Z",
  },
  {
    id: "dron-003",
    title: "WOLF Small Drone 01",
    status: "normal",
    detail: "In field · Perimeter sweep",
    updatedAt: "2026-08-27T14:00:00Z",
  },
  {
    id: "dron-004",
    title: "WOLF Small Drone 02",
    status: "normal",
    detail: "Docked · Charged",
    updatedAt: "2026-08-27T11:30:00Z",
  },
];

export const PAILEX_MISSIONS: PailexDemoRecord[] = [
  {
    id: "mis-001",
    title: "Perimeter sweep — North sector",
    status: "normal",
    detail: "Completed · 11 missions this week",
    updatedAt: "2026-08-27T08:30:00Z",
  },
  {
    id: "mis-002",
    title: "Waterhole census flyover",
    status: "attention",
    detail: "Active · 1 mission requires operator review",
    updatedAt: "2026-08-27T14:10:00Z",
  },
];

export const PAILEX_FLIGHT_LOGS: PailexDemoRecord[] = [
  {
    id: "flt-001",
    title: "FL-2026-0847 — North perimeter",
    status: "normal",
    detail: "42 min · Drone 01 · Pilot: J. Nkosi",
    updatedAt: "2026-08-27T08:30:00Z",
  },
  {
    id: "flt-002",
    title: "FL-2026-0846 — Census corridor",
    status: "normal",
    detail: "28 min · Drone 03 · Pilot: S. Mbeki",
    updatedAt: "2026-08-26T16:45:00Z",
  },
];

export const PAILEX_SUPPORT_REQUESTS: PailexDemoRecord[] = [
  {
    id: "sup-001",
    title: "Drone 02 battery replacement",
    status: "open",
    detail: "Maintenance request · Priority medium",
    updatedAt: "2026-08-27T09:35:00Z",
  },
  {
    id: "sup-002",
    title: "Fence sensor calibration — Gate 3",
    status: "open",
    detail: "Field service · Scheduled 28 Aug",
    updatedAt: "2026-08-27T14:00:00Z",
  },
];

export const PAILEX_TRAINING_RECORDS: PailexDemoRecord[] = [
  {
    id: "trn-001",
    title: "Drone operator recertification",
    status: "scheduled",
    detail: "Due 15 Sep 2026 · 2 staff enrolled",
    updatedAt: "2026-08-20T10:00:00Z",
  },
  {
    id: "trn-002",
    title: "Wildlife incident response",
    status: "normal",
    detail: "Completed · 8 Aug 2026",
    updatedAt: "2026-08-08T15:00:00Z",
  },
];

export const PAILEX_CERTIFICATIONS: PailexDemoRecord[] = [
  {
    id: "cert-001",
    title: "SACAA Remote Pilot Licence",
    status: "normal",
    detail: "3 active · 1 renewal due Q4",
    updatedAt: "2026-08-01T09:00:00Z",
  },
];

export const PAILEX_PROJECTS: PailexDemoRecord[] = [
  {
    id: "prj-001",
    title: "Perimeter sensor upgrade — Phase 2",
    status: "normal",
    detail: "Active · 65% complete",
    updatedAt: "2026-08-26T17:00:00Z",
  },
  {
    id: "prj-002",
    title: "Annual census programme",
    status: "normal",
    detail: "Active · Census completed",
    updatedAt: "2026-08-25T12:00:00Z",
  },
];

export const PAILEX_TASKS: PailexDemoRecord[] = [
  {
    id: "tsk-001",
    title: "Review Gate 3 sensor logs",
    status: "open",
    detail: "Assigned · Ranger team lead",
    updatedAt: "2026-08-27T14:00:00Z",
  },
  {
    id: "tsk-002",
    title: "Schedule Drone 02 maintenance",
    status: "open",
    detail: "Assigned · Fleet coordinator",
    updatedAt: "2026-08-27T09:40:00Z",
  },
];

export const PAILEX_DOCUMENTS: PailexDemoRecord[] = [
  {
    id: "doc-001",
    title: "Reserve operating procedures",
    status: "normal",
    detail: "Version 2.4 · Updated Jun 2026",
    updatedAt: "2026-06-15T10:00:00Z",
  },
  {
    id: "doc-002",
    title: "Drone flight SOP",
    status: "normal",
    detail: "Version 1.8 · SACAA aligned",
    updatedAt: "2026-05-20T14:00:00Z",
  },
];

export const PAILEX_WEATHER_SNAPSHOT = {
  temperatureC: 24,
  humidityPct: 42,
  windKph: 12,
  conditions: "Partly cloudy",
  fireRisk: "Low",
  floodRisk: "Normal",
  updatedAt: "2026-08-27T14:00:00Z",
};
