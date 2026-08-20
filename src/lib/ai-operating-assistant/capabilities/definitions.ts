/**
 * Central read capability definitions — module-oriented, not question-oriented.
 */

import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { isLiveFinancialBalanceQuestion } from "@/lib/ai-operating-assistant/knowledge-domains";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";

import type { EaFormattedCapabilityAnswer, EaReadCapabilityDefinition } from "./types";

function toolMessage(result: AssistantToolResult): string | null {
  const summary = (result as { summary?: Record<string, unknown> }).summary;
  if (summary && typeof summary.message === "string" && summary.message.trim()) {
    return summary.message.trim();
  }
  return null;
}

function formatCurrencyGbp(amount: number): string {
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

export const CENTRAL_READ_CAPABILITIES: EaReadCapabilityDefinition[] = [
  {
    id: "financials.cashPosition.read",
    module: "financials",
    submodule: "banking",
    entity: "cash_balance",
    description: "Current workspace bank / cash balance",
    aliases: [
      /\b(bank\s+balance|cash\s+balance|cash\s+position|how\s+much\s+cash|cash\s+do\s+we\s+have)\b/i,
      /\b(money\s+in\s+(the\s+)?bank|our\s+bank|treasury\s+balance|wise\s+balance)\b/i,
      /\bwhat(?:'s|\s+is)\s+(?:our\s+)?(?:bank|cash)\b/i,
      /\bwhat(?:'s|\s+is)\s+in\s+the\s+bank\b/i,
    ],
    exclude: [/\b(bank\s+account\s+details?|list\s+bank\s+accounts?|open\s+bank)\b/i],
    permissions: ["canAccessFinancials"],
    workspaces: "*",
    tool: "getCashPosition",
    buildArgs: () => ({}),
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = toolMessage(result);
      if (msg) {
        const display = msg.replace(
          /^Current bank \/ cash balance is /i,
          "Your current bank balance is ",
        );
        const valueMatch = /is (.+)\.$/.exec(msg);
        return {
          text: display,
          blocks: valueMatch
            ? [
                { type: "kpi", label: "Bank balance", value: valueMatch[1] },
                { type: "text", content: display },
              ]
            : [{ type: "text", content: display }],
        };
      }
      const summary = (result as { summary?: { cashPosition?: number; message?: string } }).summary;
      const cash = summary?.cashPosition;
      if (typeof cash === "number") {
        return {
          text: `Your current bank balance is ${formatCurrencyGbp(cash)}.`,
          blocks: [
            { type: "kpi", label: "Bank balance", value: formatCurrencyGbp(cash) },
            { type: "text", content: `Your current bank balance is ${formatCurrencyGbp(cash)}.` },
          ],
        };
      }
      return null;
    },
  },
  {
    id: "hr.employees.count.read",
    module: "human-resources",
    submodule: "employees",
    entity: "headcount",
    description: "Current employee headcount for the workspace",
    aliases: [
      /\bhow\s+many\s+(employees?|staff|people|fte|headcount)\b/i,
      /\b(employee|staff|headcount)\s+count\b/i,
      /\bnumber\s+of\s+(employees?|staff|people)\b/i,
      /\bwho\s+works\s+here\b/i,
      /^\s*headcount\s*\??\s*$/i,
      /\bheadcount\b/i,
    ],
    exclude: [/\b(growth|graph|chart|trend|pdf|export|list|show|find)\b/i],
    permissions: ["canAccessHr"],
    workspaces: "*",
    tool: "searchEmployees",
    buildArgs: () => ({ query: "", headcount: true }),
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const summary = (result as { summary?: { headcount?: number; message?: string } }).summary;
      const count =
        typeof summary?.headcount === "number"
          ? summary.headcount
          : Array.isArray((result as { items?: unknown[] }).items)
            ? (result as { items: unknown[] }).items.length
            : null;
      if (count != null) {
        const noun = count === 1 ? "employee" : "employees";
        return {
          text: `You currently have ${count} ${noun}.`,
          blocks: [
            { type: "kpi", label: "Headcount", value: count },
            { type: "text", content: `You currently have ${count} ${noun}.` },
          ],
        };
      }
      const msg = toolMessage(result);
      return msg ? { text: msg } : null;
    },
  },
  {
    id: "hr.employees.search.read",
    module: "human-resources",
    submodule: "employees",
    entity: "employee_directory",
    description: "Search employees by name, department, or location",
    aliases: [
      /\b(list|show|find|give\s+me)\b[\s\S]{0,40}\b(employees?|staff|people)\b/i,
      /\bemployees?\s+(at|in)\s+\w+/i,
      /\bevery\s+employee\b/i,
    ],
    exclude: [/\b(on\s+leave|leave\s+request|pdf|export|download)\b/i],
    permissions: ["canAccessHr"],
    workspaces: "*",
    tool: "searchEmployees",
    buildArgs: ({ message, normalized }) => ({ query: message, question: normalized }),
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const items = (result as { items?: Array<Record<string, unknown>> }).items ?? [];
      if (!items.length) {
        return { text: "No employees matched that search in your workspace." };
      }
      const rows = items.slice(0, 25).map((row) => [
        String(row.name ?? row.displayName ?? "—"),
        String(row.department ?? "—"),
        String(row.jobTitle ?? row.title ?? "—"),
      ]);
      return {
        text: `Found ${items.length} employee${items.length === 1 ? "" : "s"}.`,
        blocks: [
          {
            type: "table",
            title: "Employees",
            columns: ["Name", "Department", "Role"],
            rows,
          },
        ],
      };
    },
  },
  {
    id: "finance.invoices.overdue.read",
    module: "financials",
    submodule: "accounts-receivable",
    entity: "overdue_invoices",
    description: "Outstanding overdue invoices",
    aliases: [
      /\b(overdue|past\s+due)\s+invoices?\b/i,
      /\binvoices?\s+(overdue|past\s+due)\b/i,
      /\bwhich\s+invoices?\s+are\s+overdue\b/i,
    ],
    permissions: ["canAccessFinancials"],
    workspaces: "*",
    tool: "searchInvoices",
    buildArgs: () => ({ overdueOnly: true, outstandingOnly: true }),
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = toolMessage(result);
      if (msg) return { text: msg };
      const items = (result as { items?: unknown[] }).items ?? [];
      return {
        text:
          items.length > 0
            ? `There are ${items.length} overdue invoice${items.length === 1 ? "" : "s"}.`
            : "There are no overdue invoices in your workspace.",
      };
    },
  },
  {
    id: "crm.pipeline.summary.read",
    module: "business-central",
    submodule: "crm",
    entity: "pipeline",
    description: "CRM pipeline summary",
    aliases: [
      /\b(pipeline|opportunities?|hot\s+leads?|deals?)\b/i,
      /\bshow\s+(me\s+)?(the\s+)?pipeline\b/i,
    ],
    exclude: [/\b(pdf|export|create|add)\b/i],
    permissions: ["authenticated"],
    workspaces: "*",
    tool: "searchCRM",
    buildArgs: ({ message }) => ({ question: message }),
    deterministic: false,
    skipSynthesis: false,
    formatAnswer(result) {
      const msg = toolMessage(result);
      return msg ? { text: msg } : null;
    },
    crossModule: true,
  },
  {
    id: "reports.scopedPdf.generate",
    module: "financials",
    submodule: "reporting",
    entity: "scoped_pdf",
    description: "Generate a scoped business PDF report",
    aliases: [],
    permissions: ["canAccessFinancials"],
    workspaces: "*",
    tool: "generateScopedBusinessPdf",
    buildArgs: ({ message }) => {
      const scoped = parseScopedPdfRequest(message);
      return { prompt: message, metrics: scoped.metrics };
    },
    deterministic: true,
    skipSynthesis: true,
    supportsReporting: true,
    formatAnswer(result) {
      const msg = toolMessage(result);
      return msg ? { text: msg } : { text: "Your PDF report is ready." };
    },
  },
];

/** Dynamic alias for cash — reuse knowledge-domains helper */
export function matchesCashCapability(message: string): boolean {
  return isLiveFinancialBalanceQuestion(message);
}

/** Headcount / employee count — not employee directory search */
export function matchesHeadcountCapability(message: string): boolean {
  const lower = message.trim().toLowerCase();
  if (!lower) return false;
  if (
    /\b(list|show|find|search|every|directory)\b/.test(lower) &&
    /\b(employees?|staff|people)\b/.test(lower)
  ) {
    return false;
  }
  if (/^\s*headcount\s*\??\s*$/i.test(message.trim())) return true;
  return (
    /\b(headcount|employee\s+count|staff\s+count|how\s+many\s+(employees?|staff|people|fte))\b/i.test(
      lower,
    ) || /\bnumber\s+of\s+(employees?|staff|people)\b/i.test(lower)
  );
}

export function matchesScopedPdfCapability(message: string): boolean {
  if (
    /\bboard\s+(pack|packs|deck|decks|papers?|presentation|materials)\b/i.test(message) ||
    /\bboard\s+meeting\s+(pack|papers?|materials|deck|presentation)\b/i.test(message)
  ) {
    return false;
  }
  const scoped = parseScopedPdfRequest(message);
  if (
    scoped.wantsDocument &&
    (scoped.metrics.length > 0 || scoped.unknownTopics.length > 0 || /\bpdf\b/i.test(message))
  ) {
    return true;
  }
  return (
    /\b(create|make|generate|export|produce|build|prepare)\b[\s\S]{0,40}\b(executive\s+financial\s+summary|financial\s+summary|financial\s+report|ar\s+report)\b/i.test(
      message,
    ) && scoped.metrics.length > 0
  );
}
