/**
 * OnwardAir Engineering fixtures — Houston HQ · Vertex VTOL™ · FLEX Pod™.
 * Surface-gated demo data only; do not wipe shared DB rows.
 */

export type OaEngRag = "green" | "amber" | "red";

export type OaEngProgram = {
  id: string;
  name: string;
  code: string;
  owner: string;
  site: string;
  phase: string;
  progressPct: number;
  rag: OaEngRag;
  budgetUsd: number;
  spentUsd: number;
  nextGate: string;
  nextGateDate: string;
  summary: string;
};

export type OaEngMilestone = {
  id: string;
  programId: string;
  programName: string;
  name: string;
  dueDate: string;
  status: "done" | "in_progress" | "upcoming" | "at_risk";
  owner: string;
};

export type OaEngTeamMember = {
  id: string;
  name: string;
  role: string;
  discipline: string;
  allocationPct: number;
  primaryProgram: string;
  capacityHrsWeek: number;
  bookedHrsWeek: number;
  location: string;
};

export type OaEngSupplyItem = {
  id: string;
  item: string;
  supplier: string;
  program: string;
  leadWeeks: number;
  status: "ordered" | "in_transit" | "at_risk" | "received" | "quoting";
  needBy: string;
  valueUsd: number;
  dependency: string;
};

export type OaEngAssuranceItem = {
  id: string;
  domain: string;
  artifact: string;
  standard: string;
  owner: string;
  status: "complete" | "in_progress" | "not_started" | "blocked";
  dueDate: string;
  evidencePct: number;
};

export type OaEngRisk = {
  id: string;
  title: string;
  program: string;
  severity: "critical" | "high" | "medium" | "low";
  likelihood: "likely" | "possible" | "unlikely";
  owner: string;
  status: "open" | "mitigating" | "accepted" | "closed";
  dueDate: string;
  mitigation: string;
};

export type OaEngIntegration = {
  id: string;
  name: string;
  system: string;
  purpose: string;
  status: "connected" | "syncing" | "degraded" | "planned";
  lastSync: string;
  owner: string;
};

export type OaEngineeringOverviewSummary = {
  programsActive: number;
  programsAmberOrRed: number;
  milestonesDue30d: number;
  milestonesAtRisk: number;
  teamHeadcount: number;
  avgUtilizationPct: number;
  supplyAtRisk: number;
  longLeadOpen: number;
  assuranceEvidenceAvgPct: number;
  certArtifactsOpen: number;
  risksOpen: number;
  risksCriticalOrHigh: number;
  integrationsConnected: number;
  integrationsDegraded: number;
  nextHoverGateLabel: string;
  nextHoverGateDate: string;
};

export const OA_ENG_PROGRAMS: OaEngProgram[] = [
  {
    id: "prog-vertex-hover",
    name: "Vertex VTOL First Hover Demo",
    code: "VTOL-HOV-01",
    owner: "Brian Whiteside",
    site: "Houston HQ · Flight Test",
    phase: "Integration & ground test",
    progressPct: 58,
    rag: "amber",
    budgetUsd: 1_250_000,
    spentUsd: 712_400,
    nextGate: "Ground taxi complete",
    nextGateDate: "2026-09-15",
    summary:
      "Path to first powered hover — flight controls, airframe, and HIL gates on the critical path.",
  },
  {
    id: "prog-flex-pod",
    name: "FLEX Pod™ Integration Prototype",
    code: "FLEX-INT-02",
    owner: "Mike Teeter",
    site: "Houston HQ · Mechanical Lab",
    phase: "Prototype build",
    progressPct: 64,
    rag: "green",
    budgetUsd: 420_000,
    spentUsd: 268_900,
    nextGate: "Pod swap ≤15 min demo",
    nextGateDate: "2026-09-30",
    summary: "Mechanical ICD, quick-release interfaces, and first modular pod swap fixture.",
  },
  {
    id: "prog-avionics-hil",
    name: "Avionics HIL Rig Expansion",
    code: "AVI-HIL-03",
    owner: "David Colling",
    site: "Houston HQ · Avionics Bay",
    phase: "Commissioning",
    progressPct: 71,
    rag: "green",
    budgetUsd: 185_000,
    spentUsd: 142_200,
    nextGate: "Dual-channel failover test",
    nextGateDate: "2026-08-22",
    summary: "Second HIL channel for redundant flight-control law regression.",
  },
  {
    id: "prog-battery-pack",
    name: "Propulsion Battery Pack v2",
    code: "PWR-BAT-04",
    owner: "Jon Fenner",
    site: "Houston HQ · Power Lab",
    phase: "Cell characterization",
    progressPct: 41,
    rag: "amber",
    budgetUsd: 310_000,
    spentUsd: 128_500,
    nextGate: "Thermal runaway containment review",
    nextGateDate: "2026-08-28",
    summary: "Pack architecture and BMS integration ahead of hover power budget freeze.",
  },
  {
    id: "prog-ground-support",
    name: "Ground Support Equipment Kit",
    code: "GSE-KIT-05",
    owner: "Dan Wax",
    site: "Houston HQ · Hangar",
    phase: "Procurement",
    progressPct: 33,
    rag: "green",
    budgetUsd: 95_000,
    spentUsd: 31_200,
    nextGate: "Tow cart FAT",
    nextGateDate: "2026-10-10",
    summary: "Tow, charge, and pad tooling for first hover campaign.",
  },
];

export const OA_ENG_MILESTONES: OaEngMilestone[] = [
  {
    id: "ms-1",
    programId: "prog-vertex-hover",
    programName: "Vertex VTOL First Hover Demo",
    name: "HIL rig commissioned",
    dueDate: "2026-03-31",
    status: "done",
    owner: "David Colling",
  },
  {
    id: "ms-2",
    programId: "prog-vertex-hover",
    programName: "Vertex VTOL First Hover Demo",
    name: "Control laws freeze v1",
    dueDate: "2026-06-30",
    status: "done",
    owner: "Brian Whiteside",
  },
  {
    id: "ms-3",
    programId: "prog-vertex-hover",
    programName: "Vertex VTOL First Hover Demo",
    name: "Ground taxi complete",
    dueDate: "2026-09-15",
    status: "in_progress",
    owner: "Brian Whiteside",
  },
  {
    id: "ms-4",
    programId: "prog-vertex-hover",
    programName: "Vertex VTOL First Hover Demo",
    name: "Hover demo",
    dueDate: "2026-11-30",
    status: "upcoming",
    owner: "Scott Parazynski",
  },
  {
    id: "ms-5",
    programId: "prog-flex-pod",
    programName: "FLEX Pod™ Integration Prototype",
    name: "ICD draft",
    dueDate: "2026-04-15",
    status: "done",
    owner: "Mike Teeter",
  },
  {
    id: "ms-6",
    programId: "prog-flex-pod",
    programName: "FLEX Pod™ Integration Prototype",
    name: "Fixture sign-off",
    dueDate: "2026-07-01",
    status: "done",
    owner: "Mike Teeter",
  },
  {
    id: "ms-7",
    programId: "prog-flex-pod",
    programName: "FLEX Pod™ Integration Prototype",
    name: "Pod swap ≤15 min demo",
    dueDate: "2026-09-30",
    status: "in_progress",
    owner: "Dan Wax",
  },
  {
    id: "ms-8",
    programId: "prog-avionics-hil",
    programName: "Avionics HIL Rig Expansion",
    name: "Dual-channel failover test",
    dueDate: "2026-08-22",
    status: "at_risk",
    owner: "David Colling",
  },
  {
    id: "ms-9",
    programId: "prog-battery-pack",
    programName: "Propulsion Battery Pack v2",
    name: "Thermal runaway containment review",
    dueDate: "2026-08-28",
    status: "at_risk",
    owner: "Jon Fenner",
  },
  {
    id: "ms-10",
    programId: "prog-ground-support",
    programName: "Ground Support Equipment Kit",
    name: "Tow cart FAT",
    dueDate: "2026-10-10",
    status: "upcoming",
    owner: "Dan Wax",
  },
];

export const OA_ENG_TEAM: OaEngTeamMember[] = [
  {
    id: "tm-1",
    name: "Brian Whiteside",
    role: "VP Engineering",
    discipline: "Flight controls",
    allocationPct: 90,
    primaryProgram: "Vertex VTOL First Hover Demo",
    capacityHrsWeek: 40,
    bookedHrsWeek: 38,
    location: "Houston HQ",
  },
  {
    id: "tm-2",
    name: "Mike Teeter",
    role: "Chief Mechanical Engineer",
    discipline: "Structures / pods",
    allocationPct: 85,
    primaryProgram: "FLEX Pod™ Integration Prototype",
    capacityHrsWeek: 40,
    bookedHrsWeek: 34,
    location: "Houston HQ",
  },
  {
    id: "tm-3",
    name: "David Colling",
    role: "Avionics Lead",
    discipline: "Avionics / HIL",
    allocationPct: 95,
    primaryProgram: "Avionics HIL Rig Expansion",
    capacityHrsWeek: 40,
    bookedHrsWeek: 40,
    location: "Houston HQ",
  },
  {
    id: "tm-4",
    name: "Jon Fenner",
    role: "Power Systems Lead",
    discipline: "Propulsion / battery",
    allocationPct: 80,
    primaryProgram: "Propulsion Battery Pack v2",
    capacityHrsWeek: 40,
    bookedHrsWeek: 36,
    location: "Houston HQ",
  },
  {
    id: "tm-5",
    name: "Dan Wax",
    role: "Integration Engineer",
    discipline: "GSE / assembly",
    allocationPct: 75,
    primaryProgram: "Ground Support Equipment Kit",
    capacityHrsWeek: 40,
    bookedHrsWeek: 28,
    location: "Houston HQ",
  },
  {
    id: "tm-6",
    name: "Priya Nair",
    role: "Systems Engineer",
    discipline: "Systems / MBSE",
    allocationPct: 100,
    primaryProgram: "Vertex VTOL First Hover Demo",
    capacityHrsWeek: 40,
    bookedHrsWeek: 42,
    location: "Houston HQ",
  },
  {
    id: "tm-7",
    name: "Luis Ortega",
    role: "Flight Test Engineer",
    discipline: "Flight test",
    allocationPct: 70,
    primaryProgram: "Vertex VTOL First Hover Demo",
    capacityHrsWeek: 40,
    bookedHrsWeek: 26,
    location: "Houston Flight Test",
  },
  {
    id: "tm-8",
    name: "Hannah Cho",
    role: "Software Engineer",
    discipline: "Flight software",
    allocationPct: 100,
    primaryProgram: "Vertex VTOL First Hover Demo",
    capacityHrsWeek: 40,
    bookedHrsWeek: 39,
    location: "Houston HQ",
  },
  {
    id: "tm-9",
    name: "Marcus Bell",
    role: "Quality / Assurance",
    discipline: "Certification evidence",
    allocationPct: 60,
    primaryProgram: "Vertex VTOL First Hover Demo",
    capacityHrsWeek: 40,
    bookedHrsWeek: 24,
    location: "Houston HQ",
  },
  {
    id: "tm-10",
    name: "Elena Rossi",
    role: "Supplier Quality",
    discipline: "Supply assurance",
    allocationPct: 55,
    primaryProgram: "Propulsion Battery Pack v2",
    capacityHrsWeek: 40,
    bookedHrsWeek: 22,
    location: "Houston HQ",
  },
];

export const OA_ENG_SUPPLY: OaEngSupplyItem[] = [
  {
    id: "sup-1",
    item: "Composite spar blanks (set of 4)",
    supplier: "TexComposites LLC",
    program: "Vertex VTOL First Hover Demo",
    leadWeeks: 14,
    status: "in_transit",
    needBy: "2026-09-01",
    valueUsd: 48_500,
    dependency: "Ground taxi airframe close-out",
  },
  {
    id: "sup-2",
    item: "Flight-control IMUs (triple-redundant)",
    supplier: "AeroSense Dynamics",
    program: "Avionics HIL Rig Expansion",
    leadWeeks: 10,
    status: "at_risk",
    needBy: "2026-08-18",
    valueUsd: 62_000,
    dependency: "Dual-channel failover test",
  },
  {
    id: "sup-3",
    item: "High-discharge pouch cells (lot B)",
    supplier: "Gulf Power Cells",
    program: "Propulsion Battery Pack v2",
    leadWeeks: 12,
    status: "ordered",
    needBy: "2026-08-25",
    valueUsd: 91_200,
    dependency: "Thermal containment build",
  },
  {
    id: "sup-4",
    item: "Quick-release pod latches",
    supplier: "Bayou Precision",
    program: "FLEX Pod™ Integration Prototype",
    leadWeeks: 6,
    status: "received",
    needBy: "2026-07-20",
    valueUsd: 12_400,
    dependency: "Pod swap demo",
  },
  {
    id: "sup-5",
    item: "Electric tow cart chassis",
    supplier: "HangarWorks TX",
    program: "Ground Support Equipment Kit",
    leadWeeks: 8,
    status: "quoting",
    needBy: "2026-09-30",
    valueUsd: 27_800,
    dependency: "Tow cart FAT",
  },
  {
    id: "sup-6",
    item: "HIL I/O expansion boards",
    supplier: "Realtime Labs",
    program: "Avionics HIL Rig Expansion",
    leadWeeks: 5,
    status: "in_transit",
    needBy: "2026-08-12",
    valueUsd: 18_900,
    dependency: "Second HIL channel",
  },
  {
    id: "sup-7",
    item: "Propulsion harness kit",
    supplier: "WireForm Aviation",
    program: "Vertex VTOL First Hover Demo",
    leadWeeks: 7,
    status: "ordered",
    needBy: "2026-09-08",
    valueUsd: 15_600,
    dependency: "Ground taxi power-up",
  },
];

export const OA_ENG_ASSURANCE: OaEngAssuranceItem[] = [
  {
    id: "as-1",
    domain: "Flight controls",
    artifact: "Control laws V&V plan",
    standard: "DO-178C (adapted)",
    owner: "Brian Whiteside",
    status: "in_progress",
    dueDate: "2026-09-01",
    evidencePct: 62,
  },
  {
    id: "as-2",
    domain: "Avionics",
    artifact: "HIL regression evidence pack",
    standard: "Internal gate G3",
    owner: "David Colling",
    status: "in_progress",
    dueDate: "2026-08-22",
    evidencePct: 74,
  },
  {
    id: "as-3",
    domain: "Structures",
    artifact: "Spar load test report",
    standard: "Company design std OA-STR-02",
    owner: "Mike Teeter",
    status: "complete",
    dueDate: "2026-07-15",
    evidencePct: 100,
  },
  {
    id: "as-4",
    domain: "Power",
    artifact: "Battery thermal hazard analysis",
    standard: "UL 2580 (reference)",
    owner: "Jon Fenner",
    status: "blocked",
    dueDate: "2026-08-28",
    evidencePct: 38,
  },
  {
    id: "as-5",
    domain: "Systems",
    artifact: "Hazard analysis (FHA) update",
    standard: "ARP4761 (adapted)",
    owner: "Priya Nair",
    status: "in_progress",
    dueDate: "2026-09-20",
    evidencePct: 55,
  },
  {
    id: "as-6",
    domain: "Flight test",
    artifact: "Hover demo test card set",
    standard: "OA Flight Test Manual v0.4",
    owner: "Luis Ortega",
    status: "not_started",
    dueDate: "2026-10-31",
    evidencePct: 12,
  },
  {
    id: "as-7",
    domain: "Quality",
    artifact: "Configuration baseline freeze",
    standard: "OA CM Plan",
    owner: "Marcus Bell",
    status: "in_progress",
    dueDate: "2026-09-15",
    evidencePct: 48,
  },
];

export const OA_ENG_RISKS: OaEngRisk[] = [
  {
    id: "rk-1",
    title: "IMU long-lead slip threatens dual-channel failover gate",
    program: "Avionics HIL Rig Expansion",
    severity: "high",
    likelihood: "likely",
    owner: "David Colling",
    status: "mitigating",
    dueDate: "2026-08-18",
    mitigation: "Expedite AeroSense lot · qualify alternate IMU for lab-only channel",
  },
  {
    id: "rk-2",
    title: "Battery thermal evidence blocked on cell lot B arrival",
    program: "Propulsion Battery Pack v2",
    severity: "critical",
    likelihood: "possible",
    owner: "Jon Fenner",
    status: "open",
    dueDate: "2026-08-28",
    mitigation: "Partial analysis on lot A · contingency pack from Gulf Power Cells",
  },
  {
    id: "rk-3",
    title: "Flight-controls hire lag slowing software velocity",
    program: "Vertex VTOL First Hover Demo",
    severity: "medium",
    likelihood: "possible",
    owner: "Brian Whiteside",
    status: "mitigating",
    dueDate: "2026-09-30",
    mitigation: "Contract support through Q3 · Hannah Cho owning autopilot regression",
  },
  {
    id: "rk-4",
    title: "Pod latch tolerance stack-up on swap-time demo",
    program: "FLEX Pod™ Integration Prototype",
    severity: "low",
    likelihood: "unlikely",
    owner: "Mike Teeter",
    status: "accepted",
    dueDate: "2026-09-30",
    mitigation: "Fixture shim kit ready · accept ±30s margin on demo",
  },
  {
    id: "rk-5",
    title: "Ground taxi schedule compression after spar delay",
    program: "Vertex VTOL First Hover Demo",
    severity: "high",
    likelihood: "possible",
    owner: "Brian Whiteside",
    status: "mitigating",
    dueDate: "2026-09-15",
    mitigation: "Weekend hangar shifts · parallel harness install",
  },
  {
    id: "rk-6",
    title: "Configuration baseline drift between HIL and airframe",
    program: "Vertex VTOL First Hover Demo",
    severity: "medium",
    likelihood: "likely",
    owner: "Marcus Bell",
    status: "open",
    dueDate: "2026-09-15",
    mitigation: "Weekly CM audit · freeze before taxi",
  },
];

export const OA_ENG_INTEGRATIONS: OaEngIntegration[] = [
  {
    id: "int-1",
    name: "Jira Engineering",
    system: "Atlassian Jira",
    purpose: "Program issues, sprint boards, and gate checklist links",
    status: "connected",
    lastSync: "2026-08-04T18:12:00.000Z",
    owner: "Hannah Cho",
  },
  {
    id: "int-2",
    name: "Azure DevOps Pipelines",
    system: "Microsoft Azure DevOps",
    purpose: "Flight software CI and HIL build artifacts",
    status: "connected",
    lastSync: "2026-08-04T17:40:00.000Z",
    owner: "Hannah Cho",
  },
  {
    id: "int-3",
    name: "Teamcenter PLM",
    system: "Siemens Teamcenter",
    purpose: "Part revisions, BOMs, and ICD baselines",
    status: "syncing",
    lastSync: "2026-08-04T16:05:00.000Z",
    owner: "Mike Teeter",
  },
  {
    id: "int-4",
    name: "Excel Gate Tracker",
    system: "SharePoint / Excel Online",
    purpose: "Legacy milestone RAG import for Board packs",
    status: "degraded",
    lastSync: "2026-08-03T09:20:00.000Z",
    owner: "Priya Nair",
  },
  {
    id: "int-5",
    name: "Polarion ALM",
    system: "Siemens Polarion",
    purpose: "Requirements and assurance evidence traceability",
    status: "planned",
    lastSync: "—",
    owner: "Marcus Bell",
  },
  {
    id: "int-6",
    name: "Supplier portal feed",
    system: "OnwardAir Ops Procurement",
    purpose: "Long-lead PO status into Supply & Dependencies",
    status: "connected",
    lastSync: "2026-08-04T15:55:00.000Z",
    owner: "Elena Rossi",
  },
];

function withinDays(isoDate: string, days: number) {
  const target = new Date(`${isoDate}T12:00:00.000Z`).getTime();
  const now = Date.now();
  const horizon = now + days * 24 * 60 * 60 * 1000;
  return target >= now - 2 * 24 * 60 * 60 * 1000 && target <= horizon;
}

export function getOaEngineeringOverviewSummary(): OaEngineeringOverviewSummary {
  const milestonesDue30d = OA_ENG_MILESTONES.filter(
    (m) => m.status !== "done" && withinDays(m.dueDate, 30),
  ).length;
  const milestonesAtRisk = OA_ENG_MILESTONES.filter((m) => m.status === "at_risk").length;
  const booked = OA_ENG_TEAM.reduce((sum, m) => sum + m.bookedHrsWeek, 0);
  const capacity = OA_ENG_TEAM.reduce((sum, m) => sum + m.capacityHrsWeek, 0);
  const supplyAtRisk = OA_ENG_SUPPLY.filter((s) => s.status === "at_risk").length;
  const longLeadOpen = OA_ENG_SUPPLY.filter(
    (s) => s.status !== "received" && s.leadWeeks >= 8,
  ).length;
  const assuranceEvidenceAvgPct = Math.round(
    OA_ENG_ASSURANCE.reduce((sum, a) => sum + a.evidencePct, 0) / OA_ENG_ASSURANCE.length,
  );
  const certArtifactsOpen = OA_ENG_ASSURANCE.filter((a) => a.status !== "complete").length;
  const risksOpen = OA_ENG_RISKS.filter((r) => r.status === "open" || r.status === "mitigating").length;
  const risksCriticalOrHigh = OA_ENG_RISKS.filter(
    (r) =>
      (r.status === "open" || r.status === "mitigating") &&
      (r.severity === "critical" || r.severity === "high"),
  ).length;
  const integrationsConnected = OA_ENG_INTEGRATIONS.filter((i) => i.status === "connected").length;
  const integrationsDegraded = OA_ENG_INTEGRATIONS.filter(
    (i) => i.status === "degraded" || i.status === "syncing",
  ).length;
  const hover = OA_ENG_PROGRAMS.find((p) => p.id === "prog-vertex-hover")!;

  return {
    programsActive: OA_ENG_PROGRAMS.length,
    programsAmberOrRed: OA_ENG_PROGRAMS.filter((p) => p.rag !== "green").length,
    milestonesDue30d,
    milestonesAtRisk,
    teamHeadcount: OA_ENG_TEAM.length,
    avgUtilizationPct: Math.round((booked / capacity) * 100),
    supplyAtRisk,
    longLeadOpen,
    assuranceEvidenceAvgPct,
    certArtifactsOpen,
    risksOpen,
    risksCriticalOrHigh,
    integrationsConnected,
    integrationsDegraded,
    nextHoverGateLabel: hover.nextGate,
    nextHoverGateDate: hover.nextGateDate,
  };
}

export function formatOaEngUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}
