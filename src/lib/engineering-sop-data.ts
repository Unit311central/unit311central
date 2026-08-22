/** Engineering Standard Operating Procedures — domain types and seed data. */

export const ENG_SOP_STATUSES = ["Draft", "In Review", "Approved", "Retired", "Obsolete"] as const;
export type EngSopStatus = (typeof ENG_SOP_STATUSES)[number];

export const ENG_SOP_AUDIENCES = ["internal", "client", "both"] as const;
export type EngSopAudience = (typeof ENG_SOP_AUDIENCES)[number];

export const ENG_SOP_RUN_STATUSES = ["in_progress", "paused", "completed", "failed", "abandoned"] as const;
export type EngSopRunStatus = (typeof ENG_SOP_RUN_STATUSES)[number];

export const ENG_SOP_STEP_OUTCOMES = ["pass", "fail", "na"] as const;
export type EngSopStepOutcome = (typeof ENG_SOP_STEP_OUTCOMES)[number];

export type EngSopStep = {
  id: string;
  order: number;
  title: string;
  body: string;
  required?: boolean;
  /** When true, an evidence reference is required before completing the step. */
  requiresEvidence?: boolean;
};

export type EngSopSection = {
  id: string;
  order: number;
  title: string;
  purpose?: string;
  steps: EngSopStep[];
};

export type EngSopWorkflowState = {
  pendingApprovals: string[];
  lastReviewedBy: string | null;
  aiAssistEnabled: boolean;
};

export type EngSop = {
  id: string;
  workspaceId?: string;
  number: string;
  title: string;
  version: string;
  status: EngSopStatus;
  category?: string | null;
  owner: string;
  approver: string;
  audience: EngSopAudience;
  effectiveDate: string | null;
  reviewDate: string;
  summary: string;
  tags: string[];
  sections: EngSopSection[];
  workflow: EngSopWorkflowState;
  isTemplate?: boolean;
  templateSourceId?: string | null;
  /** When this row is a draft revision of an approved SOP. */
  supersedesId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type EngSopStepRunState = {
  stepId: string;
  completedAt: string | null;
  completedBy: string | null;
  outcome: EngSopStepOutcome | null;
  notes: string;
  evidenceRefs: string[];
};

export type EngSopRunSignOff = {
  signedBy: string;
  signedAt: string;
  comment: string;
};

export type EngSopRun = {
  runId: string;
  id?: string;
  sopId: string;
  sopVersion: string;
  startedBy: string;
  startedAt: string;
  status: EngSopRunStatus;
  stepStates: EngSopStepRunState[];
  signOff: EngSopRunSignOff | null;
  completedAt: string | null;
  pausedAt?: string | null;
  lastActivityAt?: string;
};

export type FlatEngSopStep = {
  stepId: string;
  sectionId: string;
  globalOrder: number;
  step: EngSopStep;
  section: EngSopSection;
};

export function engSopStatusClass(status: EngSopStatus | string): string {
  switch (status) {
    case "Approved":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "In Review":
      return "border-sky-400/30 bg-sky-500/10 text-sky-100";
    case "Draft":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "Obsolete":
    case "Retired":
      return "border-white/15 bg-white/[0.04] text-white/50";
    default:
      return "border-white/15 bg-white/[0.04] text-white/70";
  }
}

export function engSopRunStatusClass(status: EngSopRunStatus | string): string {
  switch (status) {
    case "completed":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
    case "failed":
      return "border-rose-400/30 bg-rose-500/10 text-rose-100";
    case "in_progress":
      return "border-sky-400/30 bg-sky-500/10 text-sky-100";
    case "paused":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    case "abandoned":
      return "border-white/15 bg-white/[0.04] text-white/50";
    default:
      return "border-white/15 bg-white/[0.04] text-white/70";
  }
}

export function flattenSopSteps(sop: EngSop): FlatEngSopStep[] {
  const rows: FlatEngSopStep[] = [];
  let n = 0;
  for (const sec of sop.sections) {
    for (const stepRow of sec.steps) {
      n += 1;
      rows.push({
        stepId: stepRow.id,
        sectionId: sec.id,
        globalOrder: n,
        step: stepRow,
        section: sec,
      });
    }
  }
  return rows;
}

export function countSopSteps(sop: EngSop): number {
  return flattenSopSteps(sop).length;
}

export function bumpSopVersion(version: string): string {
  const match = version.match(/^(\d+)\.(\d+)(.*)$/);
  if (!match) return `${version}-draft`;
  const minor = Number(match[2]) + 1;
  return `${match[1]}.${minor}`;
}

function step(
  id: string,
  order: number,
  title: string,
  body: string,
  opts?: { required?: boolean; requiresEvidence?: boolean },
): EngSopStep {
  return {
    id,
    order,
    title,
    body,
    required: opts?.required ?? true,
    requiresEvidence: opts?.requiresEvidence,
  };
}

function section(
  id: string,
  order: number,
  title: string,
  purpose: string,
  steps: EngSopStep[],
): EngSopSection {
  return { id, order, title, purpose, steps };
}

export function createSeedEngineeringSops(): EngSop[] {
  const now = "2026-08-21T10:00:00.000Z";

  return [
    {
      id: "eng-sop-001",
      number: "SOP-ENG-001",
      title: "Production Release Checklist",
      version: "2.1",
      status: "Approved",
      owner: "Elena Ruiz",
      approver: "Paul Fotheringham",
      audience: "internal",
      effectiveDate: "2026-06-01",
      reviewDate: "2027-06-01",
      summary:
        "Gate engineering releases through build verification, staging sign-off, and rollback readiness before production deploy.",
      tags: ["release", "deployment", "platform"],
      sections: [
        section("sec-001-a", 1, "Pre-release verification", "Confirm code and artefacts are ready.", [
          step("step-001-a1", 1, "Verify CI green", "All required GitHub checks pass on the release branch or tagged commit."),
          step("step-001-a2", 2, "Confirm migration status", "Database migrations are applied or scheduled per runbook; no blocking pending migrations."),
          step("step-001-a3", 3, "Update release notes", "Summarise user-visible changes and known limitations for support and CS."),
        ]),
        section("sec-001-b", 2, "Staging sign-off", "Validate on staging before production.", [
          step("step-001-b1", 1, "Smoke test critical paths", "Login, navigation, and module-specific happy paths exercised on staging."),
          step("step-001-b2", 2, "Obtain engineering lead approval", "Release owner confirms staging behaviour matches acceptance criteria.", {
            requiresEvidence: true,
          }),
        ]),
        section("sec-001-c", 3, "Production deploy", "Execute deploy with rollback plan.", [
          step("step-001-c1", 1, "Deploy during agreed window", "Follow change calendar; notify stakeholders if outside standard window."),
          step("step-001-c2", 2, "Monitor for 30 minutes", "Watch error rates, latency, and key business metrics post-deploy."),
        ]),
      ],
      workflow: { pendingApprovals: [], lastReviewedBy: "Paul Fotheringham", aiAssistEnabled: true },
      supersedesId: null,
      createdAt: "2026-03-10T09:00:00.000Z",
      updatedAt: now,
    },
    {
      id: "eng-sop-002",
      number: "SOP-ENG-014",
      title: "Incident Triage and Escalation",
      version: "1.0",
      status: "In Review",
      owner: "Marcus Chen",
      approver: "Elena Ruiz",
      audience: "both",
      effectiveDate: null,
      reviewDate: "2026-12-15",
      summary:
        "Standardise severity classification, initial response, and escalation for engineering incidents.",
      tags: ["incident", "on-call", "operations"],
      sections: [
        section("sec-002-a", 1, "Classify severity", "Assign SEV level within five minutes of alert.", [
          step("step-002-a1", 1, "Identify customer impact", "Determine whether external users, internal operators, or a single tenant is affected."),
          step("step-002-a2", 2, "Assign SEV1–SEV3", "SEV1: widespread outage. SEV2: degraded core function. SEV3: limited or workaround available."),
        ]),
        section("sec-002-b", 2, "Respond and communicate", "Coordinate response and status updates.", [
          step("step-002-b1", 1, "Open incident channel", "Create or join the incident thread with on-call engineer and product owner."),
          step("step-002-b2", 2, "Post initial status", "Within 15 minutes for SEV1/SEV2, summarise impact, owner, and next update time."),
        ]),
      ],
      workflow: { pendingApprovals: ["Elena Ruiz"], lastReviewedBy: null, aiAssistEnabled: true },
      supersedesId: null,
      createdAt: "2026-07-02T14:30:00.000Z",
      updatedAt: "2026-08-18T11:20:00.000Z",
    },
    {
      id: "eng-sop-003",
      number: "SOP-ENG-022",
      title: "Secure Code Review",
      version: "0.9",
      status: "Draft",
      owner: "Priya Nair",
      approver: "Elena Ruiz",
      audience: "internal",
      effectiveDate: null,
      reviewDate: "2026-10-01",
      summary: "Minimum security checks before merging changes to protected branches.",
      tags: ["security", "code-review"],
      sections: [
        section("sec-003-a", 1, "Review checklist", "Apply before approving pull requests.", [
          step("step-003-a1", 1, "Authentication and authorisation", "Confirm new routes enforce session or API auth and role checks where required."),
          step("step-003-a2", 2, "Secrets and PII", "No credentials in source; personal data handled per data-classification policy."),
        ]),
      ],
      workflow: { pendingApprovals: [], lastReviewedBy: null, aiAssistEnabled: false },
      supersedesId: null,
      createdAt: "2026-08-05T08:00:00.000Z",
      updatedAt: "2026-08-19T16:45:00.000Z",
    },
  ];
}

export function createEmptyEngSopSection(order: number): EngSopSection {
  const id = `sec-${Date.now()}-${order}`;
  return {
    id,
    order,
    title: "",
    purpose: "",
    steps: [createEmptyEngSopStep(1)],
  };
}

export function createEmptyEngSopStep(order: number): EngSopStep {
  return {
    id: `step-${Date.now()}-${order}`,
    order,
    title: "",
    body: "",
    required: true,
  };
}

export function normalizeEngSopSections(sections: EngSopSection[]): EngSopSection[] {
  return sections.map((sec, secIdx) => ({
    ...sec,
    order: secIdx + 1,
    steps: sec.steps.map((stepRow, stepIdx) => ({ ...stepRow, order: stepIdx + 1 })),
  }));
}

export function canRunEngSop(sop: EngSop): boolean {
  return sop.status === "Approved";
}

export function isEngSopDefinitionEditable(sop: EngSop): boolean {
  return sop.status !== "Approved";
}
