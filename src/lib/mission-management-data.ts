export type MissionWorkflowStatus = "READY" | "IN PROGRESS" | "COMPLETED";

export type MissionEventType =
  | "Mission Created"
  | "Mission Started"
  | "Waypoint Reached"
  | "Low Battery Warning"
  | "Mission Completed";

export type MissionEvent = {
  id: string;
  type: MissionEventType;
  timestamp: Date;
  detail?: string;
};

export type ManagedMission = {
  id: string;
  name: string;
  client: string;
  site: string;
  operator: string;
  droneId: string;
  status: MissionWorkflowStatus;
  startTime: Date | null;
  endTime: Date | null;
  progressPct: number;
  paused: boolean;
  events: MissionEvent[];
};

let eventCounter = 0;

export function createMissionEvent(
  type: MissionEventType,
  timestamp: Date = new Date(),
  detail?: string,
): MissionEvent {
  eventCounter += 1;
  return {
    id: `evt-${eventCounter}`,
    type,
    timestamp,
    detail,
  };
}

function missionCreatedAt(hoursAgo: number) {
  const date = new Date();
  date.setHours(date.getHours() - hoursAgo);
  return date;
}

export function createInitialMissions(): ManagedMission[] {
  const mission1Created = missionCreatedAt(48);
  const mission2Created = missionCreatedAt(24);
  const mission2Started = missionCreatedAt(2);
  const mission3Created = missionCreatedAt(72);
  const mission3Started = missionCreatedAt(26);
  const mission3Completed = missionCreatedAt(22);

  return [
    {
      id: "mission-1",
      name: "Warehouse Roof Survey",
      client: "ABC Construction",
      site: "Perth Warehouse",
      operator: "Paul",
      droneId: "DC-TEST-001",
      status: "READY",
      startTime: null,
      endTime: null,
      progressPct: 0,
      paused: false,
      events: [createMissionEvent("Mission Created", mission1Created)],
    },
    {
      id: "mission-2",
      name: "Solar Farm Inspection",
      client: "Western Solar",
      site: "North Perth Solar Farm",
      operator: "Paul",
      droneId: "DC-TEST-002",
      status: "IN PROGRESS",
      startTime: mission2Started,
      endTime: null,
      progressPct: 45,
      paused: true,
      events: [
        createMissionEvent("Mission Created", mission2Created),
        createMissionEvent("Mission Started", mission2Started),
        createMissionEvent("Waypoint Reached", missionCreatedAt(1.5), "Grid sector B2"),
      ],
    },
    {
      id: "mission-3",
      name: "Cell Tower Inspection",
      client: "Telco WA",
      site: "Midland Tower",
      operator: "Paul",
      droneId: "DC-TEST-003",
      status: "COMPLETED",
      startTime: mission3Started,
      endTime: mission3Completed,
      progressPct: 100,
      paused: false,
      events: [
        createMissionEvent("Mission Created", mission3Created),
        createMissionEvent("Mission Started", mission3Started),
        createMissionEvent("Waypoint Reached", missionCreatedAt(25), "Tower base"),
        createMissionEvent("Waypoint Reached", missionCreatedAt(24), "Mid-span"),
        createMissionEvent("Low Battery Warning", missionCreatedAt(23.5), "Battery at 28%"),
        createMissionEvent("Mission Completed", mission3Completed),
      ],
    },
  ];
}

export function missionStatusClass(status: MissionWorkflowStatus) {
  switch (status) {
    case "READY":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "IN PROGRESS":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "COMPLETED":
      return "border-white/20 bg-white/10 text-white/60";
  }
}

export function formatMissionDateTime(date: Date | null) {
  if (!date) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatEventTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}
