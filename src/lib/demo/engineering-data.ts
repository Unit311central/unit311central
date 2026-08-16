/**
 * Northstar Demo — engineering programme data.
 */

export type DemoEngineeringProgram = {
  id: string;
  name: string;
  status: "on_track" | "at_risk" | "delayed" | "complete";
  owner: string;
  progressPct: number;
  client?: string;
  notes: string;
};

export type DemoEngineeringMilestone = {
  id: string;
  programId: string;
  title: string;
  dueDate: string;
  status: "done" | "in_progress" | "blocked" | "upcoming";
};

export const NORTHSTAR_ENGINEERING_PROGRAMS: readonly DemoEngineeringProgram[] = [
  {
    id: "prog-atlas",
    name: "Atlas Monitoring Platform",
    status: "delayed",
    owner: "James Okonkwo",
    progressPct: 78,
    client: "Sheffield Precision Engineering",
    notes: "18% over budget; Voltex firmware delay; phased go-live Mar 2026.",
  },
  {
    id: "prog-edge-v3",
    name: "Edge Controller v3",
    status: "on_track",
    owner: "Sophie Barker",
    progressPct: 62,
    notes: "Bristol R&D; certification testing Q2.",
  },
  {
    id: "prog-us-pilot",
    name: "US Pilot Deployment Kit",
    status: "at_risk",
    owner: "Tom Clarke",
    progressPct: 45,
    client: "Austin Industrial Partners",
    notes: "Austin team capacity constrained.",
  },
];

export const NORTHSTAR_ENGINEERING_MILESTONES: readonly DemoEngineeringMilestone[] = [
  { id: "ms-1", programId: "prog-atlas", title: "UAT sign-off", dueDate: "2026-03-15", status: "in_progress" },
  { id: "ms-2", programId: "prog-atlas", title: "Production firmware release", dueDate: "2026-03-01", status: "blocked" },
  { id: "ms-3", programId: "prog-edge-v3", title: "CE marking submission", dueDate: "2026-04-30", status: "upcoming" },
  { id: "ms-4", programId: "prog-us-pilot", title: "Austin install", dueDate: "2026-05-15", status: "upcoming" },
];

export const NORTHSTAR_ENGINEERING_RISKS = [
  { id: "eng-r1", title: "Voltex firmware compatibility", severity: "High", programId: "prog-atlas" },
  { id: "eng-r2", title: "US field engineer availability", severity: "Medium", programId: "prog-us-pilot" },
  { id: "eng-r3", title: "Certification timeline slip", severity: "Medium", programId: "prog-edge-v3" },
];
