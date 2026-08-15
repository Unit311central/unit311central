import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { internalViewTitles, isInternalOperationsView } from "@/lib/internal-operations-data";
import type { SurveyOperationsView } from "@/lib/survey-operations-mock-data";
import { surveyViewTitles } from "@/lib/survey-operations-mock-data";
import {
  resolveEaExecutiveAssistantContext,
  resolveEaPackForBrowser,
} from "@/lib/ai-operating-assistant/workspace-packs/client-pack-ui";

export type ExecutiveAssistantVariant = "home" | "drawer" | "page";

export type ExecutiveAssistantPageContext = {
  /** Short module name shown as “You are viewing: …” */
  label: string;
  suggestedPrompts: string[];
};

const DEFAULT_PROMPTS = [
  "Summarise this page",
  "What needs attention?",
  "Draft an executive update",
  "Find related records",
] as const;

const CONTEXT_BY_VIEW: Partial<Record<string, ExecutiveAssistantPageContext>> = {
  home: {
    label: "Home",
    suggestedPrompts: [
      "Review today's priorities",
      "Summarise CRM",
      "Create Board Pack",
      "Analyse cashflow",
      "Find client",
      "Draft proposal",
      "Generate project report",
    ],
  },
  "portfolio-intelligence-briefing": {
    label: "Portfolio Intelligence",
    suggestedPrompts: [
      "What requires attention across the portfolio?",
      "Summarise companies requiring follow-up",
      "Draft recommended actions for Harry Turner",
      "Highlight compliance and reporting risks",
    ],
  },
  "portfolio-intelligence-company": {
    label: "Company Intelligence",
    suggestedPrompts: [
      "Summarise this portfolio company",
      "What risks require attention?",
      "Draft recommended actions for Talanton staff",
      "Assess compliance and reporting status",
    ],
  },
  "impact-intelligence-dashboard": {
    label: "Impact Intelligence",
    suggestedPrompts: [
      "Summarise portfolio impact across jobs and communities",
      "Which holdings drive the most mission impact?",
      "Draft an impact briefing for the board",
      "Highlight gaps in impact reporting",
    ],
  },
  "impact-intelligence-company": {
    label: "Company Impact",
    suggestedPrompts: [
      "Summarise this company's social and economic impact",
      "Assess jobs created and communities served",
      "Draft company impact commentary",
      "What impact data is still missing?",
    ],
  },
  "annual-impact-report": {
    label: "Annual Impact Report",
    suggestedPrompts: [
      "Draft an executive summary for the latest annual impact report",
      "Which portfolio highlights belong in the board pack?",
      "Summarise country and sector impact for investors",
      "What should Looking Forward emphasise for next year?",
    ],
  },
  "quarterly-portfolio-update": {
    label: "Quarterly Portfolio Update",
    suggestedPrompts: [
      "Summarise this quarter's portfolio performance",
      "What impact metrics should leadership focus on?",
      "Draft looking-ahead priorities for next quarter",
      "Highlight journey stories for the portfolio update",
    ],
  },
  "opportunity-intelligence": {
    label: "Opportunity Intelligence",
    suggestedPrompts: [
      "What opportunities fit Talanton's mission?",
      "Summarise sector and SSA market signals",
      "Highlight funding or partnership openings",
      "Draft an opportunity assessment",
    ],
  },
  "portfolio-stories": {
    label: "Portfolio Stories",
    suggestedPrompts: [
      "Which stories are ready to publish?",
      "Summarise recent portfolio company submissions",
      "List stories by impact category",
      "What needs editorial review this week?",
    ],
  },
  "journey-stories": {
    label: "Journey Stories",
    suggestedPrompts: [
      "Summarise the latest Kenya founder visit",
      "Which journey stories are ready for the board?",
      "Draft investor update from the Ghana growth visit",
      "What should we pray for from recent journeys?",
    ],
  },
  "stories-newsletter": {
    label: "Digital Newsletter",
    suggestedPrompts: [
      "Draft an investor update from approved stories",
      "Which stories should go in the next newsletter?",
      "Summarise newsletter send history",
      "Suggest a subject line for LPs",
    ],
  },
  "stories-media-library": {
    label: "Media Library",
    suggestedPrompts: [
      "What media is available from Kenya holdings?",
      "List recent video uploads",
      "Which stories contributed media this quarter?",
      "Find documents cleared for LP packs",
    ],
  },
  "stories-mailing-list": {
    label: "Mailing List Management",
    suggestedPrompts: [
      "Summarise the investor mailing list",
      "Draft a supporter campaign",
      "Who should receive the next LP brief?",
      "List contacts by segment",
    ],
  },
  clients: {
    label: "Clients",
    suggestedPrompts: [
      "Show clients at risk",
      "Summarise this client",
      "Create client report",
      "Generate proposal",
    ],
  },
  "clients-dashboard": {
    label: "Clients",
    suggestedPrompts: [
      "Show clients at risk",
      "Summarise active clients",
      "Create client report",
      "Generate proposal",
    ],
  },
  crm: {
    label: "CRM",
    suggestedPrompts: [
      "Pipeline summary",
      "Likely wins",
      "Next actions",
      "Executive summary",
    ],
  },
  "crm-meetings": {
    label: "CRM",
    suggestedPrompts: ["Upcoming meetings", "Prepare briefing", "Follow-up actions", "Executive summary"],
  },
  financials: {
    label: "Financials",
    suggestedPrompts: [
      "Explain cashflow",
      "Summarise expenses",
      "Outstanding invoices",
      "Generate finance report",
    ],
  },
  "general-ledger": {
    label: "Financials",
    suggestedPrompts: ["Explain cashflow", "Summarise ledger", "Outstanding invoices", "Generate finance report"],
  },
  "accounts-receivable": {
    label: "Financials",
    suggestedPrompts: ["Outstanding invoices", "Explain cashflow", "Ageing summary", "Generate finance report"],
  },
  "accounts-payable": {
    label: "Financials",
    suggestedPrompts: ["Bills due soon", "Summarise expenses", "Supplier spend", "Generate finance report"],
  },
  expenses: {
    label: "Financials",
    suggestedPrompts: ["Summarise expenses", "Explain cashflow", "Outstanding invoices", "Generate finance report"],
  },
  "financial-reports": {
    label: "Financials",
    suggestedPrompts: ["Explain cashflow", "Executive summary", "Board pack numbers", "Generate finance report"],
  },
  projects: {
    label: "Projects",
    suggestedPrompts: ["Project health", "Risks", "Upcoming deadlines", "Create weekly report"],
  },
  hr: {
    label: "HR",
    suggestedPrompts: ["Headcount summary", "Leave overview", "Open roles", "People report"],
  },
  "hr-dashboard": {
    label: "HR",
    suggestedPrompts: ["Headcount summary", "Leave overview", "Open roles", "People report"],
  },
  calendar: {
    label: "Calendar",
    suggestedPrompts: ["Today's meetings", "Prepare briefing", "Find free time", "Schedule follow-up"],
  },
  messaging: {
    label: "Communications",
    suggestedPrompts: ["Unread summary", "Draft reply", "Find conversation", "Action items"],
  },
  "files-internal": {
    label: "Files",
    suggestedPrompts: ["Find a document", "Recent files", "Summarise folder", "Prepare attachment pack"],
  },
  "unit311-details": {
    label: "Unit311 Details",
    suggestedPrompts: ["Explain this system", "Open architecture", "Related documentation", "Operational risks"],
  },
  "corporate-software": {
    label: "Software",
    suggestedPrompts: [
      "Renewals due soon",
      "Unused licences",
      "Monthly software spend",
      "Generate software report",
    ],
  },
  "technology-software": {
    label: "Software",
    suggestedPrompts: [
      "Renewals due soon",
      "Unused licences",
      "Monthly software spend",
      "Generate software report",
    ],
  },
  "technology-software-dashboard": {
    label: "Software & SaaS Dashboard",
    suggestedPrompts: [
      "Last month software spend",
      "Spend to date",
      "Biggest spend increase",
      "Monthly spend trend",
    ],
  },
  "technology-dashboard": {
    label: "Technology Management",
    suggestedPrompts: [
      "Summarise technology estate",
      "Renewals this month",
      "Infrastructure health",
      "Open software licences",
    ],
  },
  "technology-devices": {
    label: "Devices",
    suggestedPrompts: ["Device inventory", "Unassigned devices", "Warranty expirations", "Assign a laptop"],
  },
  "technology-telecommunications": {
    label: "Telecommunications",
    suggestedPrompts: ["Active mobile lines", "SIM inventory", "Telecom spend", "Carrier contracts"],
  },
  "technology-infrastructure": {
    label: "Infrastructure",
    suggestedPrompts: ["Cloud platforms", "SSL certificates", "Backup status", "Identity & SSO"],
  },
  "executive-assistant": {
    label: "Executive Assistant",
    suggestedPrompts: [
      "Review today's priorities",
      "Summarise CRM",
      "Analyse cashflow",
      "Create Board Pack",
    ],
  },
  support: {
    label: "Support",
    suggestedPrompts: ["Open tickets", "Urgent issues", "Draft response", "Support summary"],
  },
  strategy: {
    label: "Strategy",
    suggestedPrompts: ["Strategic priorities", "Competitor risks", "Board pack outline", "Executive summary"],
  },
  "board-pack": {
    label: "Board deck",
    suggestedPrompts: ["Create Board Pack", "Executive summary", "Weekly summary", "Highlight risks"],
  },
};

export const HOME_BRIEFING_PRIORITIES = [
  "3 overdue tasks",
  "2 meetings",
  "1 invoice awaiting approval",
  "Revenue forecast available",
] as const;

export const HOME_SUGGESTED_ACTIONS = [
  "Review today's priorities",
  "Summarise CRM",
  "Create Board Pack",
  "Analyse cashflow",
  "Find client",
  "Draft proposal",
  "Generate project report",
] as const;

const TALANTON_HOME_PROMPTS = [
  "Give me an executive briefing",
  "What requires attention across the portfolio?",
  "Summarise fund capital deployment",
  "Summarise portfolio impact",
  "Create Board Pack",
  "What board actions are overdue?",
  "Explain cash position in USD",
] as const;

export function getHomeSuggestedActions(): readonly string[] {
  const pack = resolveEaPackForBrowser();
  if (pack?.defaultSuggestedPrompts?.length) {
    return pack.defaultSuggestedPrompts;
  }
  return HOME_SUGGESTED_ACTIONS;
}

export const GENERATE_ACTIONS = [
  "PowerPoint Report",
  "PDF Report",
  "Board Pack",
  "Executive Summary",
  "Weekly Summary",
] as const;

export const FUTURE_ACTIONS = [
  "Create task",
  "Create meeting",
  "Create client",
  "Create invoice",
  "Create project",
  "Schedule follow-up",
] as const;

export function resolveExecutiveAssistantContext(
  activeView: string | null | undefined,
  mode: "survey" | "internal" = "internal",
): ExecutiveAssistantPageContext {
  const pack = resolveEaPackForBrowser();
  const defaultPrompts = pack?.defaultSuggestedPrompts ?? DEFAULT_PROMPTS;

  if (!activeView) {
    return resolveEaExecutiveAssistantContext(null, {
      label: "Workspace",
      suggestedPrompts: [...defaultPrompts],
    });
  }

  const mapped = CONTEXT_BY_VIEW[activeView];
  if (mapped) return resolveEaExecutiveAssistantContext(activeView, mapped);

  if (mode === "internal" && isInternalOperationsView(activeView)) {
    const meta = internalViewTitles[activeView as InternalOperationsView];
    return resolveEaExecutiveAssistantContext(activeView, {
      label: meta.subtitle || meta.title,
      suggestedPrompts: [...defaultPrompts],
    });
  }

  const surveyMeta = surveyViewTitles[activeView as SurveyOperationsView];
  if (surveyMeta) {
    return resolveEaExecutiveAssistantContext(activeView, {
      label: surveyMeta.subtitle || surveyMeta.title,
      suggestedPrompts: [...DEFAULT_PROMPTS],
    });
  }

  return resolveEaExecutiveAssistantContext(activeView, {
    label: "Workspace",
    suggestedPrompts: [...DEFAULT_PROMPTS],
  });
}

export function greetingForNow(name: string) {
  const hour = new Date().getHours();
  const hello =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  return `${hello} ${name}.`;
}
