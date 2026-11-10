import { castMember } from "@/lib/attendance/cast";
import { clockFromMinutesAfterEight } from "@/lib/attendance/time";

export type SimulationEventType = "IN" | "OUT";

export type SimulationBeat = {
  employeeNumber: string;
  eventType: SimulationEventType;
  /** Minutes after 08:00. The working-day timeline runs 08:00–18:00. */
  minute: number;
  scenario: string;
};

/** One compressed working day at 1× speed. Five days complete in a few minutes. */
export const SIMULATION_DAY_MS = 40_000;
export const SIMULATION_DAY_MINUTES = 10 * 60;

const WEEKDAY_BEATS: Record<1 | 2 | 3 | 4 | 5, readonly SimulationBeat[]> = {
  1: [
    { employeeNumber: "EMP002", eventType: "IN", minute: 2, scenario: "Normal clock-in" },
    { employeeNumber: "EMP003", eventType: "IN", minute: 5, scenario: "Normal clock-in" },
    { employeeNumber: "EMP005", eventType: "IN", minute: 16, scenario: "Normal clock-in" },
    { employeeNumber: "EMP004", eventType: "IN", minute: 61, scenario: "Normal clock-in" },
    { employeeNumber: "EMP001", eventType: "IN", minute: 72, scenario: "Late arrival" },
    { employeeNumber: "EMP002", eventType: "OUT", minute: 508, scenario: "Normal clock-out" },
    { employeeNumber: "EMP001", eventType: "OUT", minute: 542, scenario: "Normal clock-out" },
    { employeeNumber: "EMP003", eventType: "OUT", minute: 545, scenario: "Normal clock-out" },
    { employeeNumber: "EMP005", eventType: "OUT", minute: 552, scenario: "Normal clock-out" },
    { employeeNumber: "EMP004", eventType: "OUT", minute: 571, scenario: "Normal clock-out" },
  ],
  2: [
    { employeeNumber: "EMP002", eventType: "IN", minute: 3, scenario: "Normal clock-in" },
    { employeeNumber: "EMP003", eventType: "IN", minute: 8, scenario: "Normal clock-in" },
    { employeeNumber: "EMP001", eventType: "IN", minute: 32, scenario: "Normal clock-in" },
    { employeeNumber: "EMP004", eventType: "IN", minute: 58, scenario: "Normal clock-in" },
    { employeeNumber: "EMP005", eventType: "IN", minute: 70, scenario: "Late arrival" },
    { employeeNumber: "EMP002", eventType: "OUT", minute: 510, scenario: "Normal clock-out" },
    { employeeNumber: "EMP003", eventType: "OUT", minute: 540, scenario: "Normal clock-out" },
    { employeeNumber: "EMP001", eventType: "OUT", minute: 544, scenario: "Normal clock-out" },
    { employeeNumber: "EMP005", eventType: "OUT", minute: 556, scenario: "Normal clock-out" },
    { employeeNumber: "EMP004", eventType: "OUT", minute: 568, scenario: "Normal clock-out" },
  ],
  3: [
    { employeeNumber: "EMP002", eventType: "IN", minute: 4, scenario: "Normal clock-in" },
    { employeeNumber: "EMP003", eventType: "IN", minute: 7, scenario: "Normal clock-in" },
    { employeeNumber: "EMP005", eventType: "IN", minute: 18, scenario: "Normal clock-in" },
    { employeeNumber: "EMP001", eventType: "IN", minute: 33, scenario: "Normal clock-in" },
    { employeeNumber: "EMP004", eventType: "IN", minute: 63, scenario: "Normal clock-in" },
    { employeeNumber: "EMP002", eventType: "OUT", minute: 420, scenario: "Early departure" },
    { employeeNumber: "EMP003", eventType: "OUT", minute: 538, scenario: "Normal clock-out" },
    { employeeNumber: "EMP001", eventType: "OUT", minute: 546, scenario: "Normal clock-out" },
    { employeeNumber: "EMP005", eventType: "OUT", minute: 554, scenario: "Normal clock-out" },
    { employeeNumber: "EMP004", eventType: "OUT", minute: 572, scenario: "Normal clock-out" },
  ],
  4: [
    { employeeNumber: "EMP003", eventType: "IN", minute: 6, scenario: "Normal clock-in" },
    { employeeNumber: "EMP002", eventType: "IN", minute: 9, scenario: "Normal clock-in" },
    { employeeNumber: "EMP005", eventType: "IN", minute: 17, scenario: "Normal clock-in" },
    { employeeNumber: "EMP001", eventType: "IN", minute: 31, scenario: "Normal clock-in" },
    { employeeNumber: "EMP002", eventType: "OUT", minute: 509, scenario: "Normal clock-out" },
    { employeeNumber: "EMP003", eventType: "OUT", minute: 541, scenario: "Normal clock-out" },
    { employeeNumber: "EMP001", eventType: "OUT", minute: 548, scenario: "Normal clock-out" },
    { employeeNumber: "EMP005", eventType: "OUT", minute: 555, scenario: "Normal clock-out" },
  ],
  5: [
    { employeeNumber: "EMP002", eventType: "IN", minute: 1, scenario: "Normal clock-in" },
    { employeeNumber: "EMP003", eventType: "IN", minute: 6, scenario: "Missing clock-out" },
    { employeeNumber: "EMP005", eventType: "IN", minute: 14, scenario: "Normal clock-in" },
    { employeeNumber: "EMP001", eventType: "IN", minute: 34, scenario: "Normal clock-in" },
    { employeeNumber: "EMP004", eventType: "IN", minute: 64, scenario: "Normal clock-in" },
    { employeeNumber: "EMP005", eventType: "OUT", minute: 480, scenario: "Early departure" },
    { employeeNumber: "EMP002", eventType: "OUT", minute: 511, scenario: "Normal clock-out" },
    { employeeNumber: "EMP001", eventType: "OUT", minute: 543, scenario: "Normal clock-out" },
    { employeeNumber: "EMP004", eventType: "OUT", minute: 570, scenario: "Normal clock-out" },
  ],
};

export function simulationBeatsForWeekday(weekday: number): readonly SimulationBeat[] {
  if (weekday < 1 || weekday > 5) return [];
  return WEEKDAY_BEATS[weekday as 1 | 2 | 3 | 4 | 5];
}

export function simulationBeatKey(beat: SimulationBeat, isoDate: string): string {
  return `${isoDate}|${beat.employeeNumber}|${beat.eventType}|${beat.minute}`;
}

export function simulationBeatClock(beat: SimulationBeat): string {
  return clockFromMinutesAfterEight(beat.minute);
}

export function simulationBeatLabel(beat: SimulationBeat): string {
  const member = castMember(beat.employeeNumber);
  const name = member ? `${member.firstName} ${member.lastName}` : beat.employeeNumber;
  const action = beat.eventType === "IN" ? "clocks in" : "clocks out";
  return `${name} ${action}`;
}

export const SIMULATION_SCENARIOS = [
  "Normal clock-in and clock-out",
  "Late arrival",
  "Early departure",
  "Missing clock-out",
  "Absence",
] as const;
