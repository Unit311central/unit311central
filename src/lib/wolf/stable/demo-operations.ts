/**
 * Sample yard routines for the Stable Management demonstration.
 * Every record names its facility. None of these are live operational events,
 * clinical files, or connected sensor readings.
 */

export type StableDemoRecord = {
  demonstration: true;
};

export type StableStaffRole =
  | "Stable manager"
  | "Groom"
  | "Trainer"
  | "Veterinary contact"
  | "Farrier";

export type StableStaffMember = StableDemoRecord & {
  id: string;
  facilityId: string;
  name: string;
  role: StableStaffRole;
  /** Null when the demonstration has no contact detail. */
  contact: string | null;
  responsibilities: string[];
  horseIds: string[];
};

export type StableCareGroup = "feeding" | "grooming" | "exercise" | "task";

export type StableCareTask = StableDemoRecord & {
  id: string;
  facilityId: string;
  horseId: string | null;
  staffId: string | null;
  group: StableCareGroup;
  title: string;
  detail: string;
  scheduleLabel: string;
  status: "outstanding" | "complete";
};

export type StableAppointmentKind =
  | "veterinary"
  | "farrier"
  | "dental"
  | "vaccination"
  | "exercise"
  | "feeding"
  | "maintenance";

export type StableAppointment = StableDemoRecord & {
  id: string;
  facilityId: string;
  horseId: string | null;
  kind: StableAppointmentKind;
  title: string;
  whenLabel: string;
};

export type StableActivityKind =
  | "movement"
  | "care"
  | "health"
  | "camera"
  | "incident"
  | "staff";

export type StableActivity = StableDemoRecord & {
  id: string;
  facilityId: string;
  horseId: string | null;
  staffId: string | null;
  kind: StableActivityKind;
  title: string;
  detail: string;
  whenLabel: string;
  order: number;
};

export type StableInfrastructure = StableDemoRecord & {
  id: string;
  facilityId: string;
  name: string;
  type: string;
  status: string;
  horseIds: string[];
  cameraIds: string[];
};

export type StableMaintenance = StableDemoRecord & {
  id: string;
  facilityId: string;
  areaId: string | null;
  title: string;
  detail: string;
  status: "outstanding" | "recorded";
};

const FACILITY = "windsor-estate-stables";

export const STABLE_STAFF: readonly StableStaffMember[] = [
  {
    id: "staff-manager",
    facilityId: FACILITY,
    name: "Jordan Hale",
    role: "Stable manager",
    contact: null,
    responsibilities: ["Yard routine", "Task allocation"],
    horseIds: [],
    demonstration: true,
  },
  {
    id: "staff-groom-priya",
    facilityId: FACILITY,
    name: "Priya Shah",
    role: "Groom",
    contact: null,
    responsibilities: ["Morning feed", "Grooming"],
    horseIds: ["windsor-star", "castle-night", "thames-mist"],
    demonstration: true,
  },
  {
    id: "staff-groom-owen",
    facilityId: FACILITY,
    name: "Owen Blake",
    role: "Groom",
    contact: null,
    responsibilities: ["Afternoon feed", "Turnout"],
    horseIds: ["royal-oak", "berkshire-belle"],
    demonstration: true,
  },
  {
    id: "staff-trainer",
    facilityId: FACILITY,
    name: "Not assigned",
    role: "Trainer",
    contact: null,
    responsibilities: ["No trainer is assigned in this demonstration"],
    horseIds: [],
    demonstration: true,
  },
  {
    id: "staff-vet",
    facilityId: FACILITY,
    name: "Helen Croft",
    role: "Veterinary contact",
    contact: null,
    responsibilities: ["Sample veterinary contact"],
    horseIds: [],
    demonstration: true,
  },
  {
    id: "staff-farrier",
    facilityId: FACILITY,
    name: "Sam Reid",
    role: "Farrier",
    contact: null,
    responsibilities: ["Sample farrier contact"],
    horseIds: [],
    demonstration: true,
  },
];

export const STABLE_CARE_TASKS: readonly StableCareTask[] = [
  {
    id: "feed-morning",
    facilityId: FACILITY,
    horseId: null,
    staffId: "staff-groom-priya",
    group: "feeding",
    title: "Morning feed",
    detail: "Hay and hard feed as listed on each horse card. Quantities are not stored.",
    scheduleLabel: "07:00 sample routine",
    status: "complete",
    demonstration: true,
  },
  {
    id: "feed-evening",
    facilityId: FACILITY,
    horseId: null,
    staffId: "staff-groom-owen",
    group: "feeding",
    title: "Evening feed",
    detail: "Sample evening hay round. Not tracked from a live feed room.",
    scheduleLabel: "17:00 sample routine",
    status: "outstanding",
    demonstration: true,
  },
  {
    id: "groom-yard",
    facilityId: FACILITY,
    horseId: "windsor-star",
    staffId: "staff-groom-priya",
    group: "grooming",
    title: "Groom Windsor Star",
    detail: "Sample grooming task. No completion was recorded by staff.",
    scheduleLabel: "After morning feed",
    status: "outstanding",
    demonstration: true,
  },
  {
    id: "exercise-royal-oak",
    facilityId: FACILITY,
    horseId: "royal-oak",
    staffId: "staff-groom-owen",
    group: "exercise",
    title: "Arena session — Royal Oak",
    detail: "Sample exercise slot. No training session is on file.",
    scheduleLabel: "10:30 sample slot",
    status: "outstanding",
    demonstration: true,
  },
  {
    id: "turnout-belle",
    facilityId: FACILITY,
    horseId: "berkshire-belle",
    staffId: "staff-groom-owen",
    group: "exercise",
    title: "Paddock turnout — Berkshire Belle",
    detail: "Sample turnout. Paddock allocation is not a live gate record.",
    scheduleLabel: "Afternoon sample",
    status: "outstanding",
    demonstration: true,
  },
  {
    id: "task-water",
    facilityId: FACILITY,
    horseId: null,
    staffId: "staff-manager",
    group: "task",
    title: "Check water buckets",
    detail: "Sample yard task across the five stable areas.",
    scheduleLabel: "Midday sample",
    status: "outstanding",
    demonstration: true,
  },
];

export const STABLE_APPOINTMENTS: readonly StableAppointment[] = [
  {
    id: "appt-farrier",
    facilityId: FACILITY,
    horseId: null,
    kind: "farrier",
    title: "Farrier round",
    whenLabel: "Sample week — not booked",
    demonstration: true,
  },
  {
    id: "appt-dental",
    facilityId: FACILITY,
    horseId: "castle-night",
    kind: "dental",
    title: "Dental check — Castle Night",
    whenLabel: "Sample month — not a clinical due date",
    demonstration: true,
  },
  {
    id: "appt-vaccination",
    facilityId: FACILITY,
    horseId: null,
    kind: "vaccination",
    title: "Vaccination window",
    whenLabel: "Sample schedule — no vaccine record is stored",
    demonstration: true,
  },
  {
    id: "appt-vet",
    facilityId: FACILITY,
    horseId: "royal-oak",
    kind: "veterinary",
    title: "Veterinary visit — Royal Oak",
    whenLabel: "Sample slot — not a booked appointment",
    demonstration: true,
  },
  {
    id: "appt-exercise",
    facilityId: FACILITY,
    horseId: "windsor-star",
    kind: "exercise",
    title: "Light exercise — Windsor Star",
    whenLabel: "Sample morning",
    demonstration: true,
  },
  {
    id: "appt-feed",
    facilityId: FACILITY,
    horseId: null,
    kind: "feeding",
    title: "Evening feed round",
    whenLabel: "17:00 sample routine",
    demonstration: true,
  },
  {
    id: "appt-maintenance",
    facilityId: FACILITY,
    horseId: null,
    kind: "maintenance",
    title: "Ridge vent inspection",
    whenLabel: "Sample maintenance slot",
    demonstration: true,
  },
];

export const STABLE_ACTIVITIES: readonly StableActivity[] = [
  {
    id: "activity-assign",
    facilityId: FACILITY,
    horseId: "thames-mist",
    staffId: null,
    kind: "movement",
    title: "Horse assigned to an area",
    detail: "Sample entry. Thames Mist is assigned to Stable Area 05 for this demonstration. No earlier move is stored.",
    whenLabel: "Demonstration sequence 1",
    order: 1,
    demonstration: true,
  },
  {
    id: "activity-feed",
    facilityId: FACILITY,
    horseId: null,
    staffId: "staff-groom-priya",
    kind: "care",
    title: "Feeding task marked in the sample routine",
    detail: "The morning feed is a sample completed item. It was not confirmed by a live yard system.",
    whenLabel: "Demonstration sequence 2",
    order: 2,
    demonstration: true,
  },
  {
    id: "activity-health",
    facilityId: FACILITY,
    horseId: null,
    staffId: "staff-vet",
    kind: "health",
    title: "Health record placeholder",
    detail: "No veterinary record was updated. This entry shows where a real update would appear.",
    whenLabel: "Demonstration sequence 3",
    order: 3,
    demonstration: true,
  },
  {
    id: "activity-camera",
    facilityId: FACILITY,
    horseId: "thames-mist",
    staffId: null,
    kind: "camera",
    title: "Camera path noted",
    detail: "Sample entry for a camera status change. Camera 05 reports its own connection on the camera panel. This feed item is not a disconnect event.",
    whenLabel: "Demonstration sequence 4",
    order: 4,
    demonstration: true,
  },
  {
    id: "activity-staff",
    facilityId: FACILITY,
    horseId: "windsor-star",
    staffId: "staff-groom-priya",
    kind: "staff",
    title: "Staff task still outstanding",
    detail: "Sample entry. Grooming Windsor Star is outstanding in the demonstration routine.",
    whenLabel: "Demonstration sequence 5",
    order: 5,
    demonstration: true,
  },
];

export const STABLE_INFRASTRUCTURE: readonly StableInfrastructure[] = [
  {
    id: "infra-paddock",
    facilityId: FACILITY,
    name: "Paddock",
    type: "Paddock",
    status: "Demonstration area",
    horseIds: ["berkshire-belle"],
    cameraIds: [],
    demonstration: true,
  },
  {
    id: "infra-arena",
    facilityId: FACILITY,
    name: "Arena",
    type: "Arena",
    status: "Demonstration area",
    horseIds: ["royal-oak"],
    cameraIds: [],
    demonstration: true,
  },
  {
    id: "infra-walker",
    facilityId: FACILITY,
    name: "Horse walker",
    type: "Exercise area",
    status: "Demonstration area",
    horseIds: [],
    cameraIds: [],
    demonstration: true,
  },
  {
    id: "infra-feed",
    facilityId: FACILITY,
    name: "Feed room",
    type: "Feed room",
    status: "Demonstration area",
    horseIds: [],
    cameraIds: [],
    demonstration: true,
  },
  {
    id: "infra-wash",
    facilityId: FACILITY,
    name: "Wash bay",
    type: "Wash bay",
    status: "Demonstration area",
    horseIds: [],
    cameraIds: [],
    demonstration: true,
  },
  {
    id: "infra-store",
    facilityId: FACILITY,
    name: "Storage",
    type: "Storage",
    status: "Demonstration area",
    horseIds: [],
    cameraIds: [],
    demonstration: true,
  },
];

export const STABLE_MAINTENANCE: readonly StableMaintenance[] = [
  {
    id: "maint-vents",
    facilityId: FACILITY,
    areaId: null,
    title: "Ridge vent inspection",
    detail: "Sample outstanding repair. No inspection has been recorded.",
    status: "outstanding",
    demonstration: true,
  },
  {
    id: "maint-camera-note",
    facilityId: FACILITY,
    areaId: "area-05",
    title: "Camera 05 path",
    detail: "Uses the existing WOLF Ground WebRTC path. This is not a maintenance fault.",
    status: "recorded",
    demonstration: true,
  },
];

export function staffForFacility(facilityId: string): StableStaffMember[] {
  return STABLE_STAFF.filter((member) => member.facilityId === facilityId);
}

export function careTasksForFacility(facilityId: string): StableCareTask[] {
  return STABLE_CARE_TASKS.filter((task) => task.facilityId === facilityId);
}

export function appointmentsForFacility(facilityId: string): StableAppointment[] {
  return STABLE_APPOINTMENTS.filter((item) => item.facilityId === facilityId);
}

export function activitiesForFacility(facilityId: string): StableActivity[] {
  return STABLE_ACTIVITIES.filter((item) => item.facilityId === facilityId).sort(
    (left, right) => left.order - right.order,
  );
}

export function infrastructureForFacility(facilityId: string): StableInfrastructure[] {
  return STABLE_INFRASTRUCTURE.filter((item) => item.facilityId === facilityId);
}

export function maintenanceForFacility(facilityId: string): StableMaintenance[] {
  return STABLE_MAINTENANCE.filter((item) => item.facilityId === facilityId);
}

export function outstandingCareTasks(facilityId: string): StableCareTask[] {
  return careTasksForFacility(facilityId).filter((task) => task.status === "outstanding");
}
