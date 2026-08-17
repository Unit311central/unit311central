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
  budgetGbp: number;
  spentGbp: number;
  nextGate: string;
  nextGateDate: string;
};

export type DemoEngineeringMilestone = {
  id: string;
  programId: string;
  programName: string;
  title: string;
  dueDate: string;
  status: "done" | "in_progress" | "blocked" | "upcoming" | "at_risk";
  owner: string;
};

export type DemoEngineeringTeamMember = {
  id: string;
  name: string;
  role: string;
  discipline: string;
  location: string;
  primaryProgram: string;
  allocationPct: number;
  capacityHrsWeek: number;
  bookedHrsWeek: number;
};

export type DemoEngineeringRisk = {
  id: string;
  title: string;
  program: string;
  owner: string;
  severity: "critical" | "high" | "medium" | "low";
  likelihood: "high" | "medium" | "low";
  status: "open" | "mitigating" | "accepted" | "closed";
  dueDate: string;
  mitigation: string;
  impact: string;
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
    budgetGbp: 420_000,
    spentGbp: 328_000,
    nextGate: "UAT sign-off",
    nextGateDate: "2026-03-15",
  },
  {
    id: "prog-edge-v3",
    name: "Edge Controller v3",
    status: "on_track",
    owner: "Sophie Barker",
    progressPct: 62,
    notes: "Bristol R&D; certification testing Q2.",
    budgetGbp: 680_000,
    spentGbp: 412_000,
    nextGate: "CE marking submission",
    nextGateDate: "2026-04-30",
  },
  {
    id: "prog-us-pilot",
    name: "US Pilot Deployment Kit",
    status: "at_risk",
    owner: "Tom Clarke",
    progressPct: 45,
    client: "Austin Industrial Partners",
    notes: "Austin team capacity constrained.",
    budgetGbp: 290_000,
    spentGbp: 118_000,
    nextGate: "Austin field install",
    nextGateDate: "2026-05-15",
  },
  {
    id: "prog-mes",
    name: "MES Connector Framework",
    status: "on_track",
    owner: "Elena Hart",
    progressPct: 74,
    notes: "OPC-UA adapters shipping to two anchor clients.",
    budgetGbp: 185_000,
    spentGbp: 132_000,
    nextGate: "Production release",
    nextGateDate: "2026-06-20",
  },
  {
    id: "prog-pdm",
    name: "Predictive Maintenance ML",
    status: "on_track",
    owner: "Marcus Reed",
    progressPct: 48,
    notes: "Bristol Composites pilot scoped.",
    budgetGbp: 240_000,
    spentGbp: 96_000,
    nextGate: "Model validation",
    nextGateDate: "2026-07-10",
  },
];

export const NORTHSTAR_ENGINEERING_MILESTONES: readonly DemoEngineeringMilestone[] = [
  {
    id: "ms-1",
    programId: "prog-atlas",
    programName: "Atlas Monitoring Platform",
    title: "UAT sign-off",
    dueDate: "2026-03-15",
    status: "in_progress",
    owner: "Marcus Reed",
  },
  {
    id: "ms-2",
    programId: "prog-atlas",
    programName: "Atlas Monitoring Platform",
    title: "Production firmware release",
    dueDate: "2026-03-01",
    status: "blocked",
    owner: "Sophie Barker",
  },
  {
    id: "ms-3",
    programId: "prog-edge-v3",
    programName: "Edge Controller v3",
    title: "CE marking submission",
    dueDate: "2026-04-30",
    status: "upcoming",
    owner: "Sophie Barker",
  },
  {
    id: "ms-4",
    programId: "prog-us-pilot",
    programName: "US Pilot Deployment Kit",
    title: "Austin install",
    dueDate: "2026-05-15",
    status: "at_risk",
    owner: "Tom Clarke",
  },
  {
    id: "ms-5",
    programId: "prog-mes",
    programName: "MES Connector Framework",
    title: "Rockwell adapter GA",
    dueDate: "2026-05-30",
    status: "in_progress",
    owner: "James Okonkwo",
  },
  {
    id: "ms-6",
    programId: "prog-pdm",
    programName: "Predictive Maintenance ML",
    title: "Edge inference benchmark",
    dueDate: "2026-06-01",
    status: "upcoming",
    owner: "Elena Hart",
  },
];

export const NORTHSTAR_ENGINEERING_TEAM: readonly DemoEngineeringTeamMember[] = [
  {
    id: "eng-ns-01",
    name: "James Okonkwo",
    role: "Principal Engineer",
    discipline: "Embedded",
    location: "Manchester",
    primaryProgram: "Atlas Monitoring Platform",
    allocationPct: 95,
    capacityHrsWeek: 40,
    bookedHrsWeek: 42,
  },
  {
    id: "eng-ns-02",
    name: "Sophie Barker",
    role: "Engineering Lead",
    discipline: "Firmware",
    location: "Bristol",
    primaryProgram: "Edge Controller v3",
    allocationPct: 100,
    capacityHrsWeek: 40,
    bookedHrsWeek: 44,
  },
  {
    id: "eng-ns-03",
    name: "Tom Clarke",
    role: "Field Systems Engineer",
    discipline: "Deployment",
    location: "Manchester",
    primaryProgram: "US Pilot Deployment Kit",
    allocationPct: 88,
    capacityHrsWeek: 40,
    bookedHrsWeek: 38,
  },
  {
    id: "eng-ns-04",
    name: "Elena Hart",
    role: "Data Platform Lead",
    discipline: "Software",
    location: "Bristol",
    primaryProgram: "Predictive Maintenance ML",
    allocationPct: 72,
    capacityHrsWeek: 40,
    bookedHrsWeek: 34,
  },
  {
    id: "eng-ns-05",
    name: "Marcus Reed",
    role: "Programme Manager",
    discipline: "Delivery",
    location: "Sheffield",
    primaryProgram: "Atlas Monitoring Platform",
    allocationPct: 65,
    capacityHrsWeek: 40,
    bookedHrsWeek: 28,
  },
  {
    id: "eng-ns-06",
    name: "Priya Shah",
    role: "Integration Engineer",
    discipline: "OT/IT",
    location: "Manchester",
    primaryProgram: "MES Connector Framework",
    allocationPct: 80,
    capacityHrsWeek: 40,
    bookedHrsWeek: 36,
  },
  {
    id: "eng-ns-07",
    name: "Alex Morgan",
    role: "QA Engineer",
    discipline: "Quality",
    location: "Bristol",
    primaryProgram: "Edge Controller v3",
    allocationPct: 55,
    capacityHrsWeek: 40,
    bookedHrsWeek: 24,
  },
  {
    id: "eng-ns-08",
    name: "Rachel Green",
    role: "DevOps Engineer",
    discipline: "Platform",
    location: "Manchester",
    primaryProgram: "Atlas Monitoring Platform",
    allocationPct: 60,
    capacityHrsWeek: 40,
    bookedHrsWeek: 26,
  },
];

export const NORTHSTAR_ENGINEERING_RISKS: readonly DemoEngineeringRisk[] = [
  {
    id: "eng-r1",
    title: "Voltex firmware compatibility blocks Atlas UAT",
    program: "Atlas Monitoring Platform",
    owner: "Sophie Barker",
    severity: "high",
    likelihood: "high",
    status: "mitigating",
    dueDate: "2026-03-01",
    mitigation: "Parallel firmware branch with Sheffield test bench; weekly vendor sync.",
    impact: "2–3 week slip on Sheffield go-live if unresolved.",
  },
  {
    id: "eng-r2",
    title: "US field engineer availability for Austin pilot",
    program: "US Pilot Deployment Kit",
    owner: "Tom Clarke",
    severity: "medium",
    likelihood: "high",
    status: "open",
    dueDate: "2026-04-15",
    mitigation: "Contract two US contractors; shift UK install window to May.",
    impact: "Pilot revenue recognition may move to Q3.",
  },
  {
    id: "eng-r3",
    title: "CE marking timeline slip on Edge Controller v3",
    program: "Edge Controller v3",
    owner: "Sophie Barker",
    severity: "medium",
    likelihood: "medium",
    status: "mitigating",
    dueDate: "2026-04-30",
    mitigation: "Pre-submission review with notified body; buffer 2 weeks in plan.",
    impact: "Delays EU customer shipments for H2 pipeline.",
  },
  {
    id: "eng-r4",
    title: "Key-person dependency on OPC-UA lead",
    program: "MES Connector Framework",
    owner: "Priya Shah",
    severity: "high",
    likelihood: "low",
    status: "open",
    dueDate: "2026-05-01",
    mitigation: "Cross-train second engineer; document adapter patterns.",
    impact: "Single point of failure for MES release train.",
  },
  {
    id: "eng-r5",
    title: "ML training data quality from Bristol Composites",
    program: "Predictive Maintenance ML",
    owner: "Elena Hart",
    severity: "medium",
    likelihood: "medium",
    status: "open",
    dueDate: "2026-06-10",
    mitigation: "Data cleansing sprint; install additional vibration sensors.",
    impact: "Model accuracy below 85% target for pilot sign-off.",
  },
  {
    id: "eng-r6",
    title: "Sheffield client OT network access delays",
    program: "Atlas Monitoring Platform",
    owner: "Marcus Reed",
    severity: "high",
    likelihood: "medium",
    status: "mitigating",
    dueDate: "2026-02-28",
    mitigation: "Escalated via client CIO; temporary VPN bridge approved.",
    impact: "Integration testing blocked on production line 2.",
  },
];

export function getNorthstarEngineeringSummary() {
  const active = NORTHSTAR_ENGINEERING_PROGRAMS.filter((p) => p.status !== "complete");
  const atRisk = active.filter((p) => p.status === "at_risk" || p.status === "delayed");
  const milestonesDue30d = NORTHSTAR_ENGINEERING_MILESTONES.filter(
    (m) => m.status !== "done" && m.dueDate <= "2026-09-17",
  );
  const milestonesAtRisk = NORTHSTAR_ENGINEERING_MILESTONES.filter(
    (m) => m.status === "blocked" || m.status === "at_risk",
  );
  const avgUtil = Math.round(
    (NORTHSTAR_ENGINEERING_TEAM.reduce((s, m) => s + m.bookedHrsWeek, 0) /
      NORTHSTAR_ENGINEERING_TEAM.reduce((s, m) => s + m.capacityHrsWeek, 0)) *
      100,
  );
  const risksOpen = NORTHSTAR_ENGINEERING_RISKS.filter(
    (r) => r.status === "open" || r.status === "mitigating",
  );
  return {
    programsActive: active.length,
    programsAtRisk: atRisk.length,
    milestonesDue30d: milestonesDue30d.length,
    milestonesAtRisk: milestonesAtRisk.length,
    teamHeadcount: NORTHSTAR_ENGINEERING_TEAM.length,
    avgUtilizationPct: avgUtil,
    risksOpen: risksOpen.length,
    risksCriticalOrHigh: risksOpen.filter((r) => r.severity === "critical" || r.severity === "high")
      .length,
    nextGateLabel: "Atlas UAT sign-off",
    nextGateDate: "15 Mar 2026",
  };
}

export function formatNorthstarEngGbp(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}
