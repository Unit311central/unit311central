import type { WorkflowDefinition } from "./executive-types";

/**
 * Workflow Registry — AI recommends workflows (outcomes), not just pages.
 * Parallel to Page Registry; does not modify it.
 */

const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: "onboard_client",
    name: "Onboard Client",
    purpose: "Create a client account, capture details, and link files.",
    businessOutcome: "New client ready for projects and CRM follow-up.",
    estimatedDurationMinutes: 12,
    requiredPermissions: ["any"],
    relatedModules: ["clients", "files-internal", "crm", "client-onboarding"],
    roles: ["ceo", "operator", "any"],
    intentPhrases: [
      "onboard a client",
      "onboard client",
      "add a new client",
      "create a client",
      "new client account",
      "set up a client",
    ],
    steps: [
      {
        id: "open_clients",
        title: "Open Clients",
        instruction: "Go to the Client Directory to create the account.",
        viewId: "clients",
        href: "/internaldashboard?view=clients",
        targetId: "clients-add",
        estimatedMinutes: 1,
      },
      {
        id: "add_client",
        title: "Add client record",
        instruction: "Use Add Client and fill company, contact, and contract type.",
        viewId: "clients",
        targetId: "clients-add",
        estimatedMinutes: 5,
      },
      {
        id: "upload_contract",
        title: "Upload contract",
        instruction: "Open Files and upload the signed contract into the client folder.",
        viewId: "files-internal",
        href: "/internaldashboard?view=files-internal",
        targetId: "files-upload",
        estimatedMinutes: 4,
      },
      {
        id: "link_crm",
        title: "Update CRM if prospect",
        instruction: "If this came from a lead, update CRM status to Won / Client.",
        viewId: "crm",
        href: "/internaldashboard?view=crm",
        targetId: "crm-table",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    id: "recruit_employee",
    name: "Recruit Employee",
    purpose: "Move from opening to hire through Careers and HR.",
    businessOutcome: "Candidate progressed and employee record ready.",
    estimatedDurationMinutes: 20,
    requiredPermissions: ["hr"],
    relatedModules: ["careers", "hr", "files-internal"],
    roles: ["hr", "ceo", "any"],
    intentPhrases: [
      "recruit an employee",
      "hire someone",
      "recruit employee",
      "add a new hire",
      "open a role",
      "review applicants",
    ],
    steps: [
      {
        id: "open_careers",
        title: "Review openings",
        instruction: "Open Careers to check active roles and applicants.",
        viewId: "careers",
        href: "/internaldashboard?view=careers",
        estimatedMinutes: 5,
      },
      {
        id: "add_employee",
        title: "Create employee in HR",
        instruction: "When hired, add the person in HR and set leave balances.",
        viewId: "hr",
        href: "/internaldashboard?view=hr",
        targetId: "hr-table",
        estimatedMinutes: 10,
      },
      {
        id: "store_docs",
        title: "Store employment docs",
        instruction: "Upload contract and resume into Files.",
        viewId: "files-internal",
        href: "/internaldashboard?view=files-internal",
        targetId: "files-upload",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    id: "approve_leave",
    name: "Approve Leave",
    purpose: "Review leave balances and record approved time off.",
    businessOutcome: "Leave recorded with accurate remaining balances.",
    estimatedDurationMinutes: 5,
    requiredPermissions: ["hr"],
    relatedModules: ["hr"],
    roles: ["hr", "ceo", "project_manager"],
    intentPhrases: [
      "approve leave",
      "approve vacation",
      "who is on leave",
      "check leave",
      "time off request",
    ],
    steps: [
      {
        id: "open_hr",
        title: "Open HR",
        instruction: "Open the employee directory and select the person.",
        viewId: "hr",
        href: "/internaldashboard?view=hr",
        targetId: "hr-table",
        estimatedMinutes: 2,
      },
      {
        id: "update_balance",
        title: "Update leave balance",
        instruction: "Adjust vacation taken / remaining and save. Writes need confirmation.",
        viewId: "hr",
        targetId: "hr-table",
        estimatedMinutes: 3,
      },
    ],
  },
  {
    id: "create_project",
    name: "Create Project",
    purpose: "Stand up a live or upcoming project linked to a client.",
    businessOutcome: "Project tracked with dates, progress, and owner.",
    estimatedDurationMinutes: 8,
    requiredPermissions: ["any"],
    relatedModules: ["projects", "clients", "logistics"],
    roles: ["project_manager", "ceo", "operator", "any"],
    intentPhrases: [
      "create a project",
      "new project",
      "start a project",
      "set up a project",
      "add project",
    ],
    steps: [
      {
        id: "open_projects",
        title: "Open Projects",
        instruction: "Go to Projects to create the record.",
        viewId: "projects",
        href: "/internaldashboard?view=projects",
        targetId: "projects-add",
        estimatedMinutes: 1,
      },
      {
        id: "create",
        title: "Create project",
        instruction: "Use New project — set client, dates, phase, and operator.",
        viewId: "projects",
        targetId: "projects-add",
        estimatedMinutes: 5,
      },
      {
        id: "link_files",
        title: "Attach kickoff docs",
        instruction: "Upload SOW or kickoff files in Files.",
        viewId: "files-internal",
        href: "/internaldashboard?view=files-internal",
        targetId: "files-upload",
        estimatedMinutes: 2,
      },
    ],
  },
  {
    id: "close_project",
    name: "Close Project",
    purpose: "Complete delivery, archive files, and clear risks.",
    businessOutcome: "Project closed with records retained.",
    estimatedDurationMinutes: 15,
    requiredPermissions: ["any"],
    relatedModules: ["projects", "files-internal", "financials"],
    roles: ["project_manager", "ceo", "finance"],
    intentPhrases: [
      "close a project",
      "close project",
      "complete a project",
      "finish project",
      "archive project",
    ],
    steps: [
      {
        id: "review_project",
        title: "Review project status",
        instruction: "Open Projects and confirm deliverables and end date.",
        viewId: "projects",
        href: "/internaldashboard?view=projects",
        targetId: "projects-table",
        estimatedMinutes: 5,
      },
      {
        id: "archive_files",
        title: "Archive delivery files",
        instruction: "Ensure final reports and contracts are in Files.",
        viewId: "files-internal",
        href: "/internaldashboard?view=files-internal",
        targetId: "files-browser",
        estimatedMinutes: 5,
      },
      {
        id: "finance_check",
        title: "Check receivables",
        instruction: "Confirm invoices are settled or scheduled in Finance.",
        viewId: "financials",
        href: "/internaldashboard?view=financials",
        targetId: "finance-kpis",
        estimatedMinutes: 5,
      },
    ],
  },
  {
    id: "prepare_board_report",
    name: "Prepare Board Report",
    purpose: "Assemble an executive board pack from live signals.",
    businessOutcome: "Board-ready summary with risks and recommendations.",
    estimatedDurationMinutes: 18,
    requiredPermissions: ["strategy"],
    relatedModules: ["board-pack", "financials", "projects", "executive-assistant"],
    roles: ["ceo", "finance"],
    intentPhrases: [
      "prepare board report",
      "board pack",
      "board report",
      "executive summary for the board",
      "prepare board pack",
    ],
    steps: [
      {
        id: "health",
        title: "Review business health",
        instruction: "Ask the Operating Assistant for the Business Health Score.",
        viewId: "executive-assistant",
        href: "/internaldashboard?view=executive-assistant",
        targetId: "ea-chat",
        estimatedMinutes: 3,
      },
      {
        id: "finance",
        title: "Check financial highlights",
        instruction: "Scan Finance KPIs for overdue and cash signals.",
        viewId: "financials",
        href: "/internaldashboard?view=financials",
        targetId: "finance-kpis",
        estimatedMinutes: 5,
      },
      {
        id: "board_pack",
        title: "Open Board Pack",
        instruction: "Customise and generate the board pack sections.",
        viewId: "board-pack",
        href: "/internaldashboard?view=board-pack",
        estimatedMinutes: 10,
      },
    ],
  },
  {
    id: "chase_overdue_invoice",
    name: "Chase Overdue Invoice",
    purpose: "Identify overdue receivables and follow up.",
    businessOutcome: "Overdue invoice escalated with clear next action.",
    estimatedDurationMinutes: 8,
    requiredPermissions: ["financials"],
    relatedModules: ["debtors", "financials", "clients"],
    roles: ["finance", "ceo"],
    intentPhrases: [
      "chase overdue invoice",
      "overdue invoices",
      "collect payment",
      "who owes us money",
    ],
    steps: [
      {
        id: "open_finance",
        title: "Open Finance",
        instruction: "Review Finance KPIs for overdue outstanding.",
        viewId: "financials",
        href: "/internaldashboard?view=financials",
        targetId: "finance-kpis",
        estimatedMinutes: 2,
      },
      {
        id: "debtors",
        title: "Open Debtors",
        instruction: "Drill into Debtors for the overdue account.",
        viewId: "debtors",
        href: "/internaldashboard?view=debtors",
        estimatedMinutes: 4,
      },
      {
        id: "contact_client",
        title: "Contact client",
        instruction: "Open the client record and email the finance contact.",
        viewId: "clients",
        href: "/internaldashboard?view=clients",
        targetId: "clients-table",
        estimatedMinutes: 2,
      },
    ],
  },
];

export function listWorkflows(): WorkflowDefinition[] {
  return WORKFLOWS;
}

export function getWorkflow(id: string): WorkflowDefinition | null {
  return WORKFLOWS.find((workflow) => workflow.id === id) ?? null;
}

export function workflowsForPermissions(permissions: {
  canAccessFinancials: boolean;
  canAccessHr: boolean;
  canAccessUsers: boolean;
  canAccessStrategy: boolean;
}): WorkflowDefinition[] {
  return WORKFLOWS.filter((workflow) =>
    workflow.requiredPermissions.every((permission) => {
      if (permission === "any") return true;
      if (permission === "financials") return permissions.canAccessFinancials;
      if (permission === "hr") return permissions.canAccessHr;
      if (permission === "users") return permissions.canAccessUsers;
      if (permission === "strategy") return permissions.canAccessStrategy;
      return true;
    }),
  );
}
