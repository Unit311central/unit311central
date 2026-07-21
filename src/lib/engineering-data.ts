/** Engineering domain (MOD-140 / MOD-141 — program wave MOD-600/601). */

export const ENG_STATUSES = ["Available", "Allocated", "On Leave", "Overloaded"] as const;
export type EngStatus = (typeof ENG_STATUSES)[number];

export type EngEngineer = {
  id: string;
  name: string;
  role: string;
  department: string;
  manager: string;
  skills: string[];
  currentProject: string;
  allocationPct: number;
  billablePct: number;
  availability: string;
  leave: string;
  location: string;
  status: EngStatus;
};

export type EngProject = {
  id: string;
  name: string;
  kind: "Internal" | "Client";
  client: string | null;
  owner: string;
  team: string[];
  sprint: string;
  progress: number;
  budget: string;
  hoursUsed: number;
  hoursTotal: number;
  health: "Green" | "Amber" | "Red";
  milestones: string[];
  dependencies: string[];
};

export type EngActivity = {
  id: string;
  at: string;
  label: string;
  detail: string;
};

export type EngIncident = {
  id: string;
  title: string;
  severity: "SEV1" | "SEV2" | "SEV3";
  status: "Open" | "Mitigated" | "Closed";
  owner: string;
};

export type EngDebtItem = {
  id: string;
  title: string;
  area: string;
  effort: string;
  priority: "Low" | "Medium" | "High";
};

export function engStatusClass(status: string): string {
  const key = status.toLowerCase();
  if (key.includes("available") || key.includes("green") || key.includes("closed") || key.includes("mitigated")) {
    return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  }
  if (key.includes("over") || key.includes("red") || key.includes("sev1")) {
    return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  }
  if (key.includes("leave") || key.includes("amber") || key.includes("sev2") || key.includes("allocated")) {
    return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  }
  return "border-white/15 bg-white/[0.04] text-white/70";
}

export function createSeedEngineers(): EngEngineer[] {
  return [
    {
      id: "eng-001",
      name: "Elena Ruiz",
      role: "Engineering Manager",
      department: "Platform",
      manager: "Paul Fotheringham",
      skills: ["TypeScript", "Next.js", "Architecture"],
      currentProject: "Unit311 Central Core",
      allocationPct: 90,
      billablePct: 40,
      availability: "10%",
      leave: "None",
      location: "Barcelona",
      status: "Allocated",
    },
    {
      id: "eng-002",
      name: "Marcus Chen",
      role: "Senior Software Engineer",
      department: "Platform",
      manager: "Elena Ruiz",
      skills: ["React", "Postgres", "Supabase"],
      currentProject: "Client Portal",
      allocationPct: 100,
      billablePct: 80,
      availability: "0%",
      leave: "None",
      location: "Remote EU",
      status: "Overloaded",
    },
    {
      id: "eng-003",
      name: "Priya Shah",
      role: "QA Engineer",
      department: "Quality",
      manager: "Elena Ruiz",
      skills: ["Playwright", "API Testing", "CI"],
      currentProject: "Release 2.4",
      allocationPct: 70,
      billablePct: 55,
      availability: "30%",
      leave: "None",
      location: "London",
      status: "Allocated",
    },
    {
      id: "eng-004",
      name: "Tomás Alvarez",
      role: "DevOps Engineer",
      department: "Infrastructure",
      manager: "Elena Ruiz",
      skills: ["Vercel", "Docker", "Observability"],
      currentProject: "Platform Reliability",
      allocationPct: 85,
      billablePct: 30,
      availability: "15%",
      leave: "Fri PM",
      location: "Barcelona",
      status: "Allocated",
    },
    {
      id: "eng-005",
      name: "Hannah Brooks",
      role: "Solution Architect",
      department: "Architecture",
      manager: "Paul Fotheringham",
      skills: ["Integrations", "Security", "Domain Design"],
      currentProject: "Website CMS Framework",
      allocationPct: 60,
      billablePct: 50,
      availability: "40%",
      leave: "None",
      location: "Remote UK",
      status: "Available",
    },
    {
      id: "eng-006",
      name: "Jonah Ike",
      role: "Software Engineer",
      department: "Delivery",
      manager: "Elena Ruiz",
      skills: ["TypeScript", "APIs", "UI"],
      currentProject: "AeroParts Client Delivery",
      allocationPct: 95,
      billablePct: 95,
      availability: "5%",
      leave: "None",
      location: "Barcelona",
      status: "Allocated",
    },
    {
      id: "eng-007",
      name: "Sofia Mendes",
      role: "QA Lead",
      department: "Quality",
      manager: "Elena Ruiz",
      skills: ["Test Strategy", "QMS", "Automation"],
      currentProject: "Release 2.4",
      allocationPct: 50,
      billablePct: 20,
      availability: "50%",
      leave: "Annual leave next week",
      location: "Barcelona",
      status: "On Leave",
    },
    {
      id: "eng-008",
      name: "Leo Hartmann",
      role: "Software Engineer",
      department: "Delivery",
      manager: "Elena Ruiz",
      skills: ["React", "Maps", "Realtime"],
      currentProject: "Unassigned",
      allocationPct: 20,
      billablePct: 0,
      availability: "80%",
      leave: "None",
      location: "Remote DE",
      status: "Available",
    },
  ];
}

export function createSeedEngProjects(): EngProject[] {
  return [
    {
      id: "ep-001",
      name: "Unit311 Central Core",
      kind: "Internal",
      client: null,
      owner: "Elena Ruiz",
      team: ["Elena Ruiz", "Marcus Chen", "Tomás Alvarez"],
      sprint: "Sprint 24",
      progress: 72,
      budget: "€186k",
      hoursUsed: 1420,
      hoursTotal: 1800,
      health: "Green",
      milestones: ["Auth hardening", "Workspace isolation", "Demo polish"],
      dependencies: ["Supabase", "Vercel"],
    },
    {
      id: "ep-002",
      name: "Client Portal",
      kind: "Internal",
      client: null,
      owner: "Marcus Chen",
      team: ["Marcus Chen", "Leo Hartmann"],
      sprint: "Sprint 24",
      progress: 48,
      budget: "€92k",
      hoursUsed: 610,
      hoursTotal: 1200,
      health: "Amber",
      milestones: ["Branding", "Module gates", "Invitations"],
      dependencies: ["External Users", "Files"],
    },
    {
      id: "ep-003",
      name: "AeroParts Client Delivery",
      kind: "Client",
      client: "AeroParts Iberia",
      owner: "Jonah Ike",
      team: ["Jonah Ike", "Priya Shah"],
      sprint: "Sprint 24",
      progress: 61,
      budget: "€64k",
      hoursUsed: 380,
      hoursTotal: 640,
      health: "Green",
      milestones: ["Portal go-live", "Training pack"],
      dependencies: ["Client Directory", "Support"],
    },
    {
      id: "ep-004",
      name: "Website CMS Framework",
      kind: "Internal",
      client: null,
      owner: "Hannah Brooks",
      team: ["Hannah Brooks"],
      sprint: "Sprint 24",
      progress: 35,
      budget: "€48k",
      hoursUsed: 210,
      hoursTotal: 600,
      health: "Amber",
      milestones: ["WordPress connector", "Integrations registry"],
      dependencies: ["Integration Framework"],
    },
    {
      id: "ep-005",
      name: "Platform Reliability",
      kind: "Internal",
      client: null,
      owner: "Tomás Alvarez",
      team: ["Tomás Alvarez"],
      sprint: "Sprint 24",
      progress: 55,
      budget: "€40k",
      hoursUsed: 260,
      hoursTotal: 480,
      health: "Green",
      milestones: ["Incident runbooks", "Deploy cadence"],
      dependencies: ["Vercel", "Support"],
    },
  ];
}

export function createSeedEngActivity(): EngActivity[] {
  return [
    { id: "ea-1", at: "2026-07-20T18:10:00Z", label: "Deployment", detail: "Production release 2.3.8 promoted" },
    { id: "ea-2", at: "2026-07-20T15:40:00Z", label: "Code review", detail: "Portal invitations PR approved" },
    { id: "ea-3", at: "2026-07-19T11:05:00Z", label: "Incident", detail: "SEV3 CDN cache miss mitigated" },
    { id: "ea-4", at: "2026-07-18T09:20:00Z", label: "Architecture review", detail: "Website CMS provider model approved" },
  ];
}

export function createSeedEngIncidents(): EngIncident[] {
  return [
    { id: "inc-1", title: "Elevated API latency on files browse", severity: "SEV2", status: "Open", owner: "Tomás Alvarez" },
    { id: "inc-2", title: "CDN cache miss spike", severity: "SEV3", status: "Mitigated", owner: "Marcus Chen" },
  ];
}

export function createSeedEngDebt(): EngDebtItem[] {
  return [
    { id: "td-1", title: "Replace remaining shared nav notices", area: "Platform", effort: "2d", priority: "Medium" },
    { id: "td-2", title: "Unify mock store patterns", area: "Frontend", effort: "3d", priority: "Low" },
    { id: "td-3", title: "Add website connector adapters", area: "Integrations", effort: "1w", priority: "High" },
  ];
}

export function computeEngKpis(engineers: EngEngineer[], projects: EngProject[], incidents: EngIncident[], debt: EngDebtItem[]) {
  const activeInternal = projects.filter((p) => p.kind === "Internal" && p.progress < 100).length;
  const activeClient = projects.filter((p) => p.kind === "Client" && p.progress < 100).length;
  const utilisation = Math.round(
    engineers.reduce((sum, e) => sum + e.allocationPct, 0) / Math.max(engineers.length, 1),
  );
  return {
    engineers: engineers.length,
    activeInternal,
    activeClient,
    sprintVelocity: 42,
    deploymentsThisWeek: 6,
    openBugs: 14,
    codeReviewsPending: 7,
    productionIncidents: incidents.filter((i) => i.status === "Open").length,
    averageLeadTime: "3.2d",
    utilisation: `${utilisation}%`,
    technicalDebtItems: debt.length,
    releaseReadiness: "78%",
  };
}
