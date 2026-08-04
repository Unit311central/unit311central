import type { AssistantBusinessContext, AssistantToolDefinition, AssistantToolHandler } from "./types";
import type { AssistantToolExecutionContext } from "./tool-result";
import {
  generateReport,
  searchClients,
  searchContracts,
  searchCRM,
  searchEmployees,
  searchFiles,
  searchPlatformSubscriptions,
  searchProjects,
  searchTasks,
} from "./tool-implementations";
import {
  emailAssistantArtifact,
  generateEmployeeListPdf,
  generateFinancialReportPdf,
  generateReportPdf,
  generateScopedBusinessPdf,
} from "./artifact-tools";
import { generateBoardPackTool } from "./boardpack-tools";
import { generateLmsCourseFromDocumentTool } from "./lms-course-tools";
import {
  getPageGuideTool,
  highlightUiTarget,
  listPageGuidesTool,
  startGuidedTour,
} from "./guided-learning-tools";
import {
  detectWorkflowIntentTool,
  getBusinessHealthTool,
  getDailyBriefTool,
  getProactiveNotificationsTool,
  getReleaseIntelligenceTool,
  getRoleFocusTool,
  getSmartInsightsTool,
  guideWorkflowTool,
  listReleaseFeaturesTool,
  listWorkflowsTool,
  queryBusinessTool,
} from "./proactive-tools";
import {
  createPayrollRunTool,
  generatePayrollPdf,
  queryPayroll,
} from "./payroll-tools";
import {
  listBusinessActionsTool,
  listPlatformModulesTool,
  proposeBusinessActionPlanTool,
  searchApplicationsTool,
  searchCapabilitiesTool,
} from "./actions/discovery-tools";
import {
  executeGoalPlanTool,
  planBusinessGoalTool,
} from "./actions/planning/planning-tools";
// Ensure Clients Action Framework handlers are registered for discovery.
import "./actions/register-all-modules";
import {
  getCashPosition,
  getMonthlyPayrollObligation,
  platformSearch,
  searchExpenses,
  searchInventory,
  searchInvoices,
  searchLeave,
  searchPerformanceReviews,
} from "./platform-tools";

/**
 * Tool Service — register OpenAI function tools and handlers here.
 * Adding a tool = define schema + implement handler. Routes stay thin.
 */

export const ASSISTANT_TOOL_DEFINITIONS: AssistantToolDefinition[] = [
  {
    name: "queryBusiness",
    description:
      "Answer open business overview questions with a live snapshot (clients, projects, finance, HR, CRM). Do NOT use for subscription plan prices, signup amounts, quarterly-in-advance billing, MRR/ARR, or whether Billing details match an expected price — use searchPlatformSubscriptions instead.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The user question being answered",
        },
        domain: {
          type: "string",
          enum: ["all", "overview", "clients", "projects", "finance", "hr", "crm", "assets"],
          description:
            "Optional domain focus. Use assets for physical Assets register / fleet / equipment. Use finance for cash/Wise/bank. Default all/overview.",
        },
        topic: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchClients",
    description:
      "Search live client directory. Use for active clients, top clients (topN), country/region filters (e.g. Germany), contract type, and client details. Do NOT use for plan price / quarterly signup / MRR — use searchPlatformSubscriptions.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search text" },
        status: { type: "string", description: "Optional account status filter" },
        country: { type: "string", description: "Country or region filter, e.g. Germany" },
        topN: {
          type: "number",
          description: "Return the top N clients ranked by active projects (e.g. 10)",
        },
        clientId: { type: "string" },
        inactiveDays: {
          type: "number",
          description: "Approximate inactive filter when last-activity is unavailable",
        },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchPlatformSubscriptions",
    description:
      "Read live platform Billing subscriptions (plan, billing frequency, MRR, period charge). Use when the user asks whether clients pay a signup/quarterly amount (e.g. $1,300 × 3), if Billing details reflect expected pricing, or for subscription/MRR/ARR questions.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Original user question (used to parse expected amounts)",
        },
        status: {
          type: "string",
          description: "Subscription status filter: active (default), all, pending_payment, suspended, cancelled, inactive",
        },
        expectedMonthlyUsd: {
          type: "number",
          description: "Expected monthly price, e.g. 1300",
        },
        expectedQuarterlyUsd: {
          type: "number",
          description: "Expected quarterly advance charge, e.g. 3900",
        },
        expectedFrequency: {
          type: "string",
          enum: ["monthly", "quarterly", "annual"],
        },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchProjects",
    description:
      "Search live projects (internal/external). Use query for engineering/domain filters, overdue=true for projects past end date. Uses selected client/project from context when relevant.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        phase: { type: "string", enum: ["live", "upcoming", "all"] },
        overdue: { type: "boolean" },
        clientId: { type: "string" },
        projectId: { type: "string" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchEmployees",
    description:
      "Search live HR employees (directory / headcount). For who is currently on leave use searchLeave. For performance reviews use searchPerformanceReviews. Requires HR permission.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        employeeId: { type: "string" },
        onLeave: { type: "boolean" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchPerformanceReviews",
    description:
      "List or search live HR performance reviews. Use for “show all performance reviews”, ratings, review periods, or an employee’s reviews. Never say you lack access — query this tool.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string" },
        employeeId: { type: "string" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchLeave",
    description:
      "Query live HR leave requests. Use currentlyOnLeave=true for “who is on leave / currently on leave”. Also supports pending approvals.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string" },
        currentlyOnLeave: { type: "boolean" },
        onLeave: { type: "boolean" },
        pendingOnly: { type: "boolean" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchInvoices",
    description:
      "Query live accounts receivable / invoices. Use outstandingOnly for unpaid invoices, overdueOnly for overdue.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        outstandingOnly: { type: "boolean" },
        overdueOnly: { type: "boolean" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchExpenses",
    description:
      "Query live expenses. Use recentOnly for recent expenses, minAmount for thresholds (e.g. over $1000).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        minAmount: { type: "number" },
        recentOnly: { type: "boolean" },
        unpaidOnly: { type: "boolean" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getCashPosition",
    description:
      "Return live bank / cash / treasury balance plus AR, AP, burn, and payroll monthly from Finance.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getMonthlyPayrollObligation",
    description:
      "Return the live monthly payroll obligation (gross + employer tax) and headcount. Use for “how much is monthly payroll”.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "searchInventory",
    description: "Search live inventory / assets register.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "platformSearch",
    description:
      "Cross-module search across Employees, Performance, Leave, Clients, Projects, CRM, Recruitment, and Finance. Use when the user searches a person or company name (e.g. John Smith).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
      additionalProperties: false,
    },
  },
  {
    name: "searchFiles",
    description:
      "Search files or analyze a selected/document fileId for text excerpts (summaries, risks, ISO mentions, payment terms).",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        mention: { type: "string", description: "Phrase to find, e.g. ISO 13485" },
        fileId: { type: "string" },
        analyze: { type: "boolean" },
        scope: { type: "string", enum: ["internal", "external", "client"] },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchContracts",
    description:
      "Search commercial client contract types and employment contracts. Uses selected client when present.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        clientId: { type: "string" },
        contractId: { type: "string" },
        expireWithinDays: { type: "number" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchTasks",
    description:
      "Search open/overdue tasks from command-centre actions and CRM next actions. Use for workload and overdue questions.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string", enum: ["open", "overdue"] },
        overdue: { type: "boolean" },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchCRM",
    description: "Search CRM leads and pipeline opportunities from live Supabase data.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
        status: { type: "string", enum: ["Cold", "Warm", "Hot", "Won", "Lost"] },
        page: { type: "number" },
        pageSize: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "generateReport",
    description:
      "Generate a text executive/board/client/project/HR/finance/engineering summary from live tool data. Prefer generateScopedBusinessPdf for multi-metric natural-language PDF asks, generateReportPdf / generateFinancialReportPdf / generateEmployeeListPdf for single-template PDFs.",
    parameters: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          enum: [
            "board",
            "weekly",
            "client",
            "finance",
            "project",
            "hr",
            "executive",
            "engineering",
          ],
        },
        focus: { type: "string" },
        clientId: { type: "string" },
      },
      required: ["reportType"],
      additionalProperties: false,
    },
  },
  {
    name: "boardpack.generate",
    description:
      "ABHI and Talanton Impact only. Automatically generate a professional multi-slide Board Meeting Pack (PowerPoint + PDF preview) from organisational data — cover, executive summary, previous actions, risk register, KPIs, financials, P&L, balance sheet & cash, commercial/membership, team, and strategic discussion. Invoke whenever the user wants board meeting materials, board papers, a board pack, board deck, board presentation, or board report. Prefer this over generateReportPdf for any board pack/deck/papers request. Meeting date is resolved from the next scheduled Board Meeting; only pass meetingDate when the user gives an explicit YYYY-MM-DD. Never invent dates from tomorrow/next week. If no date can be resolved, the tool asks for one.",
    parameters: {
      type: "object",
      properties: {
        meetingDate: {
          type: "string",
          description:
            "Optional explicit meeting date as YYYY-MM-DD only. Do not invent relative dates (tomorrow, next week). Prefer leaving unset so the next scheduled Board Meeting is used.",
        },
        focus: {
          type: "string",
          description: "Optional focus note from the user request.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "lms.generateCourseFromDocument",
    description:
      "ABHI, Talanton Impact, and OnwardAir. Create a complete interactive training course from an uploaded PDF or Word policy/guidance document (Anti-Bribery, GDPR, handbook, SOPs, policies). Generates modules, lessons, scenarios, assessments, and certificate settings as a draft. Use when the user asks to create/generate/build a training course from a document or policy. Prefer a selected Files fileId when available.",
    parameters: {
      type: "object",
      properties: {
        fileId: {
          type: "string",
          description: "Internal Files id of the PDF/DOCX to convert.",
        },
        fileName: { type: "string" },
        documentText: {
          type: "string",
          description: "Optional pasted document text if no fileId.",
        },
        title: {
          type: "string",
          description: "Optional preferred course title.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "generateReportPdf",
    description:
      "Generate a real PDF from live workspace data for engineering, board summary report, project portfolio, or client reports. Use immediately when the user asks for those PDFs. Do NOT use for board packs, board decks, board papers, board presentations, or PowerPoint board materials — use boardpack.generate instead. Do not ask for confirmation. Do not use this for financial P&L (use generateFinancialReportPdf) or employee directory (use generateEmployeeListPdf).",
    parameters: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          enum: ["engineering", "board", "project", "client"],
        },
        title: { type: "string" },
        filename: { type: "string" },
      },
      required: ["reportType"],
      additionalProperties: false,
    },
  },
  {
    name: "generateFinancialReportPdf",
    description:
      "Generate a real financial/P&L PDF from live GL, invoices, expenses, and cash. Use for financial report, P&L, board financials. Do not use for engineering/project/client/employee PDFs.",
    parameters: {
      type: "object",
      properties: {
        period: {
          type: "string",
          description: "Optional period hint such as 'last month', 'YTD', or YYYY-MM",
        },
        title: { type: "string" },
        filename: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "generateScopedBusinessPdf",
    description:
      "Generate a custom PDF containing ONLY the live metrics the user asked for (e.g. P&L last 6 months + burn rate + payroll + CRM pipeline). Prefer this for multi-metric or natural-language composite PDF requests. Never invent figures; list unregistered topics as unavailable.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "Original user request (preferred).",
        },
        metrics: {
          type: "array",
          items: { type: "string" },
          description: "Optional metric ids if already parsed.",
        },
        unknownTopics: {
          type: "array",
          items: { type: "string" },
        },
        period: { type: "string" },
        title: { type: "string" },
        filename: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "generateEmployeeListPdf",
    description:
      "Generate a real employee directory PDF (name, department, job title, status only — never salary). Call ONLY when the user explicitly asks for a PDF/export/download of employees. Do NOT call this for a plain list/show employees request — use searchEmployees instead.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        filename: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "emailAssistantArtifact",
    description:
      "Email a previously generated assistant PDF/artifact (resolve pronouns like it/that PDF/the report to the latest artifactId). Use immediately when the user asks to email it. Default recipient is the Board distribution. artifactId is optional when a PDF already exists in conversation context.",
    parameters: {
      type: "object",
      properties: {
        artifactId: { type: "string" },
        to: { type: "string", description: "Optional recipient override" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getPageGuide",
    description:
      "Load AI Guided Learning metadata for the current (or specified) page: purpose, KPIs, buttons, tables, workflows, common questions, highlight targets.",
    parameters: {
      type: "object",
      properties: {
        viewId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "startGuidedTour",
    description:
      "Start an interactive Show Me Around walkthrough for the current page. Returns a clientAction the UI must dispatch.",
    parameters: {
      type: "object",
      properties: {
        viewId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "highlightUiTarget",
    description:
      "Highlight and scroll to a specific UI control while explaining it (KPI, button, table, form, filter).",
    parameters: {
      type: "object",
      properties: {
        targetId: { type: "string" },
        viewId: { type: "string" },
        explanation: { type: "string" },
      },
      required: ["targetId"],
      additionalProperties: false,
    },
  },
  {
    name: "listPageGuides",
    description: "List registered pages available for guided learning.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getDailyBrief",
    description:
      "Generate today's personalised Daily Executive Brief from live platform data (priorities, risks, deadlines, finance, HR, CRM).",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getSmartInsights",
    description:
      "Continuously analysed smart insights with recommended actions (stale projects, inactive clients, overdue invoices, leave, recruitment).",
    parameters: {
      type: "object",
      properties: {
        category: { type: "string" },
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getBusinessHealth",
    description:
      "AI Business Health Score across Projects, Finance, HR, Compliance, CRM, Operations — with strengths, risks, actions, confidence.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "getProactiveNotifications",
    description: "Meaningful proactive notifications only (critical/high severity events).",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "listWorkflows",
    description:
      "List Workflow Registry entries (Onboard Client, Create Project, etc.). Prefer recommending workflows over individual pages.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "detectWorkflowIntent",
    description:
      "Detect which workflow the user wants (e.g. “I need to onboard a client”) and return a guided session. Must guide via UI, not text-only.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string" },
        query: { type: "string" },
        intent: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "guideWorkflow",
    description:
      "Guide the user through a workflow step with navigate/highlight clientActions using existing guided learning.",
    parameters: {
      type: "object",
      properties: {
        workflowId: { type: "string" },
        id: { type: "string" },
        stepIndex: { type: "number" },
      },
      required: ["workflowId"],
      additionalProperties: false,
    },
  },
  {
    name: "getReleaseIntelligence",
    description:
      "Features added since last visit; offer a 90-second guided tour for returning users after updates.",
    parameters: {
      type: "object",
      properties: {
        lastSeenAt: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "getRoleFocus",
    description: "Role-aware focus profile (CEO, HR, Project Manager, Finance, Operator).",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "listReleaseFeatures",
    description: "List tracked product releases for release intelligence.",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "queryPayroll",
    description:
      "Live payroll questions: next payroll date, department cost, salary filters (e.g. who earns more than $100000), unpaid runs, and payroll trend.",
    parameters: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          enum: [
            "overview",
            "next_payroll",
            "trend",
            "department_cost",
            "unpaid",
            "salary_filter",
          ],
        },
        department: { type: "string" },
        minAnnualSalary: { type: "number" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "createPayrollRun",
    description: "Create this month's draft payroll run from live employee salaries.",
    parameters: {
      type: "object",
      properties: {
        payDate: { type: "string" },
        notes: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "generatePayrollPdf",
    description:
      "Generate payroll PDFs: summary, department, employee, cost, or board payroll report.",
    parameters: {
      type: "object",
      properties: {
        reportType: {
          type: "string",
          enum: ["summary", "department", "employee", "cost", "board"],
        },
        runId: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "listPlatformModules",
    description:
      "List PLATFORM modules from the Application Catalogue (Business Central, Financials, HR, …). Use for “What modules exist?” — NOT for “What can you do?” (that is listBusinessActions / Action Registry).",
    parameters: {
      type: "object",
      properties: {},
      additionalProperties: false,
    },
  },
  {
    name: "searchApplications",
    description:
      "Search the Application Catalogue for modules, applications, and pages (e.g. “What is under Financials?”, “Where do I manage suppliers?”, “Open Human Resources”). Platform structure only — never confuses with Action Registry capabilities.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language platform / navigation question",
        },
        question: { type: "string" },
        module: { type: "string", description: "Optional module name filter" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "listBusinessActions",
    description:
      "List every EXECUTABLE capability from the live Capability Graph / Action Registry (actionId, businessObject, statements like “I can create Clients”). Use for “What can you do?” — NOT for listing platform modules.",
    parameters: {
      type: "object",
      properties: {
        module: {
          type: "string",
          description: "Optional action-module filter (clients, projects, finance, hr, …) — this is Action Registry taxonomy, not sidebar modules",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "searchCapabilities",
    description:
      "Answer “What can you do?” / “Can you create a client?” by searching the Action Registry Capability Graph. Never invent capabilities — only report what is registered. Do not use this for platform module questions.",
    parameters: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Natural-language capability question or keywords",
        },
        question: { type: "string" },
      },
      additionalProperties: false,
    },
  },
  {
    name: "proposeBusinessActionPlan",
    description:
      "Build and immediately execute a multi-step Action Framework plan for a registered write. Returns a short completion message. Prefer registered actionIds from listBusinessActions / searchCapabilities.",
    parameters: {
      type: "object",
      properties: {
        request: { type: "string", description: "Original user request" },
        title: { type: "string" },
        conversationId: { type: "string" },
        steps: {
          type: "array",
          items: {
            type: "object",
            properties: {
              actionId: { type: "string" },
              input: { type: "object" },
              dependsOnStepIds: { type: "array", items: { type: "string" } },
            },
          },
        },
      },
      required: ["steps"],
      additionalProperties: false,
    },
  },
  {
    name: "planBusinessGoal",
    description:
      "Turn a natural-language business GOAL into registered Action Framework steps, then return a planId for the Plan Viewer. Does NOT execute. After Approve, the UI calls POST /api/executive-assistant/actions/plans/{id} → executeActionPlan only.",
    parameters: {
      type: "object",
      properties: {
        goal: { type: "string", description: "Natural language business objective" },
        request: { type: "string" },
        title: { type: "string" },
        conversationId: { type: "string" },
      },
      required: ["goal"],
      additionalProperties: false,
    },
  },
];

type ContextualToolHandler = (
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
) => Promise<unknown>;

const handlers: Record<string, ContextualToolHandler> = {
  queryBusiness: queryBusinessTool,
  searchClients,
  searchPlatformSubscriptions,
  searchProjects,
  searchEmployees,
  searchPerformanceReviews,
  searchLeave,
  searchInvoices,
  searchExpenses,
  getCashPosition,
  getMonthlyPayrollObligation,
  searchInventory,
  platformSearch,
  searchFiles,
  searchContracts,
  searchTasks,
  searchCRM,
  generateReport,
  "boardpack.generate": generateBoardPackTool,
  "lms.generateCourseFromDocument": generateLmsCourseFromDocumentTool,
  generateEmployeeListPdf,
  generateFinancialReportPdf,
  generateReportPdf,
  generateScopedBusinessPdf,
  emailAssistantArtifact,
  getPageGuide: getPageGuideTool,
  startGuidedTour,
  highlightUiTarget,
  listPageGuides: listPageGuidesTool,
  getDailyBrief: getDailyBriefTool,
  getSmartInsights: getSmartInsightsTool,
  getBusinessHealth: getBusinessHealthTool,
  getProactiveNotifications: getProactiveNotificationsTool,
  listWorkflows: listWorkflowsTool,
  detectWorkflowIntent: detectWorkflowIntentTool,
  guideWorkflow: guideWorkflowTool,
  getReleaseIntelligence: getReleaseIntelligenceTool,
  getRoleFocus: getRoleFocusTool,
  listReleaseFeatures: listReleaseFeaturesTool,
  queryPayroll,
  createPayrollRun: createPayrollRunTool,
  generatePayrollPdf,
  listPlatformModules: listPlatformModulesTool,
  searchApplications: searchApplicationsTool,
  listBusinessActions: listBusinessActionsTool,
  searchCapabilities: searchCapabilitiesTool,
  proposeBusinessActionPlan: proposeBusinessActionPlanTool,
  planBusinessGoal: planBusinessGoalTool,
  executeGoalPlan: executeGoalPlanTool,
};

/** @deprecated Prefer contextual handlers — kept for registerAssistantTool compatibility. */
export type { AssistantToolHandler };

export function registerAssistantTool(name: string, handler: ContextualToolHandler) {
  handlers[name] = handler;
}

export function getOpenAIToolSchemas() {
  return ASSISTANT_TOOL_DEFINITIONS.map((tool) => ({
    type: "function" as const,
    name: tool.name,
    description: tool.description,
    parameters: tool.parameters,
    strict: false,
  }));
}

export async function executeAssistantTool(
  name: string,
  rawArgs: unknown,
  businessContext?: AssistantBusinessContext,
) {
  const handler = handlers[name];
  if (!handler) {
    return {
      status: "error",
      tool: name,
      message: `Unknown tool: ${name}`,
    };
  }

  let args: Record<string, unknown> = {};
  if (typeof rawArgs === "string") {
    try {
      args = JSON.parse(rawArgs) as Record<string, unknown>;
    } catch {
      args = { raw: rawArgs };
    }
  } else if (rawArgs && typeof rawArgs === "object") {
    args = rawArgs as Record<string, unknown>;
  }

  if (!businessContext) {
    return {
      status: "error",
      tool: name,
      message: "Business context is required for tool execution.",
    };
  }

  return handler(args, { business: businessContext });
}

export function listAssistantToolNames() {
  return ASSISTANT_TOOL_DEFINITIONS.map((tool) => tool.name);
}
