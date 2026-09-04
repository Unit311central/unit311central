/** Green Desert engineering programmes, milestones, risks, and utilisation seed data. */

export type GreenDesertEngProgram = {
  id: string;
  name: string;
  owner: string;
  status: "on_track" | "at_risk" | "delayed";
  budgetUsd: number;
  spentUsd: number;
  summary: string;
};

export type GreenDesertEngMilestone = {
  id: string;
  programId: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "planned" | "in_progress" | "complete" | "blocked";
};

export type GreenDesertEngRisk = {
  id: string;
  title: string;
  owner: string;
  severity: "low" | "medium" | "high" | "critical";
  likelihood: "low" | "medium" | "high";
  status: "open" | "mitigating" | "closed";
  mitigation: string;
};

export type GreenDesertUtilisationCell = {
  engineer: string;
  week: string;
  utilisationPct: number;
};

export const GREENDESERT_ENGINEERING_PROGRAMS: GreenDesertEngProgram[] = [
  {
    id: "gd-eng-p1",
    name: "Jeddah pilot cultivation platform",
    owner: "Ashley Pursglove",
    status: "on_track",
    budgetUsd: 1_200_000,
    spentUsd: 640_000,
    summary: "IoT-controlled photobioreactors and nutrient dosing for Jeddah Technologies deployment.",
  },
  {
    id: "gd-eng-p2",
    name: "Algae protein powder scale-up",
    owner: "Omar Hashem",
    status: "at_risk",
    budgetUsd: 850_000,
    spentUsd: 410_000,
    summary: "Harvest, drying, and QA workflow for nutrient-dense powder production in KSA.",
  },
  {
    id: "gd-eng-p3",
    name: "Water-efficiency instrumentation",
    owner: "Abdulmajeed Hashem",
    status: "on_track",
    budgetUsd: 420_000,
    spentUsd: 180_000,
    summary: "Closed-loop water monitoring — 10× less water than comparable protein sources.",
  },
];

export const GREENDESERT_ENGINEERING_MILESTONES: GreenDesertEngMilestone[] = [
  {
    id: "gd-ms-1",
    programId: "gd-eng-p1",
    title: "Pilot PBR commissioning",
    owner: "Ashley Pursglove",
    dueDate: "2026-10-15",
    status: "in_progress",
  },
  {
    id: "gd-ms-2",
    programId: "gd-eng-p1",
    title: "Client telemetry API handover",
    owner: "Omar Hashem",
    dueDate: "2026-11-01",
    status: "planned",
  },
  {
    id: "gd-ms-3",
    programId: "gd-eng-p2",
    title: "Powder QA release gate",
    owner: "Yusuf Hashem",
    dueDate: "2026-09-30",
    status: "blocked",
  },
  {
    id: "gd-ms-4",
    programId: "gd-eng-p3",
    title: "Field sensor calibration",
    owner: "Ashley Pursglove",
    dueDate: "2026-10-28",
    status: "planned",
  },
];

export const GREENDESERT_ENGINEERING_RISKS: GreenDesertEngRisk[] = [
  {
    id: "gd-risk-1",
    title: "Summer peak temperature excursions at Jeddah site",
    owner: "Omar Hashem",
    severity: "high",
    likelihood: "medium",
    status: "mitigating",
    mitigation: "Deploy redundant cooling loops and shift harvest windows to night cycles.",
  },
  {
    id: "gd-risk-2",
    title: "Imported sensor lead times",
    owner: "Ashley Pursglove",
    severity: "medium",
    likelihood: "high",
    status: "open",
    mitigation: "Dual-source IoT vendors and maintain 8-week buffer stock in Riyadh.",
  },
  {
    id: "gd-risk-3",
    title: "Regulatory sampling backlog for powder export",
    owner: "Yusuf Hashem",
    severity: "critical",
    likelihood: "low",
    status: "open",
    mitigation: "Pre-submit SFDA documentation pack with third-party lab validation.",
  },
];

export const GREENDESERT_UTILISATION_HEATMAP: GreenDesertUtilisationCell[] = [
  { engineer: "Ashley Pursglove", week: "W1", utilisationPct: 92 },
  { engineer: "Ashley Pursglove", week: "W2", utilisationPct: 88 },
  { engineer: "Ashley Pursglove", week: "W3", utilisationPct: 95 },
  { engineer: "Ashley Pursglove", week: "W4", utilisationPct: 78 },
  { engineer: "Process Eng A", week: "W1", utilisationPct: 74 },
  { engineer: "Process Eng A", week: "W2", utilisationPct: 81 },
  { engineer: "Process Eng A", week: "W3", utilisationPct: 86 },
  { engineer: "Process Eng A", week: "W4", utilisationPct: 90 },
  { engineer: "IoT Lead", week: "W1", utilisationPct: 68 },
  { engineer: "IoT Lead", week: "W2", utilisationPct: 72 },
  { engineer: "IoT Lead", week: "W3", utilisationPct: 79 },
  { engineer: "IoT Lead", week: "W4", utilisationPct: 84 },
  { engineer: "QA Specialist", week: "W1", utilisationPct: 55 },
  { engineer: "QA Specialist", week: "W2", utilisationPct: 62 },
  { engineer: "QA Specialist", week: "W3", utilisationPct: 70 },
  { engineer: "QA Specialist", week: "W4", utilisationPct: 66 },
];
