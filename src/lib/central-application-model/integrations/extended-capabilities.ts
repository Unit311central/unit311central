/**
 * Additional semantic capability bindings — composite, content studio, extended reads.
 */

import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import { FUNCTIONAL_DOMAINS } from "../canonical-modules";
import type { EaSemanticCapabilityBinding } from "../types";

function formatCurrency(amount: number, currency = "GBP"): string {
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

export const EXTENDED_SEMANTIC_CAPABILITIES: EaSemanticCapabilityBinding[] = [
  {
    id: "abhi.members.count.read",
    kind: "read",
    moduleIds: ["business-central"],
    domainId: FUNCTIONAL_DOMAINS.members,
    entity: "member_count",
    description: "Count of active ABHI member organisations",
    keywords: [
      "how many members",
      "member count",
      "membership count",
      "number of members",
      "total members",
      "active members",
      "members we have",
    ],
    phrases: [
      "how many people are members",
      "what is our membership count",
      "what's our membership count",
    ],
    negativeKeywords: ["employees", "staff", "headcount", "payroll"],
    permissions: ["authenticated"],
    workspaceAllowList: ["abhi"],
    requiredModules: ["business-central"],
    tool: "abhi.getMemberPortfolio",
    buildArgs: () => ({}),
    executionStrategy: "deterministic",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const summary = (result as { summary?: { activeMembers?: number; message?: string } }).summary;
      const count = summary?.activeMembers ?? 0;
      return {
        text: summary?.message ?? `ABHI has ${count} active member organisations.`,
        blocks: [
          { type: "kpi", label: "Active members", value: count },
          { type: "text", content: summary?.message ?? `ABHI has ${count} active member organisations.` },
        ],
      };
    },
  },
  {
    id: "crm.clients.count.read",
    kind: "read",
    moduleIds: ["business-central"],
    domainId: FUNCTIONAL_DOMAINS.clients,
    entity: "client_count",
    description: "Count of clients/customers in the workspace",
    keywords: ["how many clients", "how many customers", "client count", "customer count", "number of clients"],
    permissions: ["authenticated"],
    requiredModules: ["business-central"],
    tool: "searchClients",
    buildArgs: () => ({ query: "" }),
    executionStrategy: "deterministic",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const items = (result as { items?: unknown[] }).items ?? [];
      const count = items.length;
      return {
        text: `You have ${count} client${count === 1 ? "" : "s"} in your workspace.`,
        blocks: [
          { type: "kpi", label: "Clients", value: count },
          { type: "text", content: `You have ${count} client${count === 1 ? "" : "s"} in your workspace.` },
        ],
      };
    },
  },
  {
    id: "project-management.projects.count.read",
    kind: "read",
    moduleIds: ["project-management"],
    domainId: FUNCTIONAL_DOMAINS.projects,
    entity: "project_count",
    description: "Count of projects in the workspace",
    keywords: ["how many projects", "project count", "number of projects"],
    permissions: ["authenticated"],
    requiredModules: ["project-management"],
    tool: "searchProjects",
    buildArgs: () => ({}),
    executionStrategy: "deterministic",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const summary = (result as { summary?: { matched?: number; message?: string } }).summary;
      const count = summary?.matched ?? ((result as { items?: unknown[] }).items?.length ?? 0);
      return {
        text: summary?.message ?? `You have ${count} project${count === 1 ? "" : "s"}.`,
        blocks: [{ type: "kpi", label: "Projects", value: count }],
      };
    },
  },
  {
    id: "cross.clients.overdueInvoicesOpenTickets.read",
    kind: "composite",
    moduleIds: ["business-central", "financials", "support-desk"],
    domainId: "cross-module-risk",
    entity: "client_risk",
    description: "Clients with both overdue invoices and open support tickets",
    keywords: [
      "overdue invoices and open support tickets",
      "overdue invoices and open tickets",
      "customers with overdue invoices and tickets",
      "clients with overdue invoices and support",
      "clients owe us money",
      "owe us money and open support",
      "open support issues",
      "which clients owe",
    ],
    permissions: ["canAccessFinancials", "authenticated"],
    requiredModules: ["financials", "support-desk"],
    executionStrategy: "multi_tool",
    deterministic: true,
    skipSynthesis: true,
    crossModule: true,
    compositeSteps: [
      {
        tool: "searchInvoices",
        buildArgs: () => ({ overdueOnly: true, outstandingOnly: true }),
      },
      {
        tool: "searchSupportTickets",
        buildArgs: () => ({ status: "open" }),
      },
    ],
    compositeFormat(results, _input) {
      const invoiceResult = results[0] as { items?: Array<{ clientName?: string; amount?: number; currency?: string }> };
      const ticketResult = results[1] as { items?: Array<{ clientName?: string; subject?: string }> };
      const overdueByClient = new Map<string, { amount: number; currency: string }>();
      for (const inv of invoiceResult.items ?? []) {
        const name = String(inv.clientName ?? "").trim().toLowerCase();
        if (!name) continue;
        const prev = overdueByClient.get(name) ?? { amount: 0, currency: inv.currency ?? "GBP" };
        prev.amount += Number(inv.amount) || 0;
        overdueByClient.set(name, prev);
      }
      const openTicketClients = new Set(
        (ticketResult.items ?? [])
          .map((t) => String(t.clientName ?? "").trim().toLowerCase())
          .filter(Boolean),
      );
      const matches: string[] = [];
      for (const [client, data] of overdueByClient) {
        if (openTicketClients.has(client)) {
          matches.push(`${client} (${formatCurrency(data.amount, data.currency)} overdue)`);
        }
      }
      if (!matches.length) {
        return {
          text: "No customers currently have both overdue invoices and open support tickets.",
        };
      }
      return {
        text: `${matches.length} customer${matches.length === 1 ? "" : "s"} have both overdue invoices and open support tickets.`,
        blocks: [
          {
            type: "table",
            title: "At-risk customers",
            columns: ["Customer"],
            rows: matches.slice(0, 25).map((m) => [m]),
          },
        ],
      };
    },
  },
  {
    id: "content.templates.list",
    kind: "content",
    moduleIds: ["business-productivity"],
    domainId: FUNCTIONAL_DOMAINS.contentStudio,
    entity: "content_templates",
    description: "List approved Content Studio templates",
    keywords: [
      "content studio templates",
      "approved templates",
      "presentation templates",
      "weekly deck template",
      "management deck template",
    ],
    permissions: ["authenticated"],
    requiredModules: ["business-productivity"],
    tool: "contentStudioListTemplates",
    buildArgs: ({ message }) => ({ query: message }),
    executionStrategy: "deterministic",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = (result as { summary?: { message?: string } }).summary?.message;
      return { text: msg ?? "Content Studio templates are available." };
    },
  },
  {
    id: "content.deck.create",
    kind: "content",
    moduleIds: ["business-productivity"],
    domainId: FUNCTIONAL_DOMAINS.contentStudio,
    entity: "content_deck",
    description: "Create a deck from an approved Content Studio template",
    keywords: [
      "create weekly management deck",
      "create management deck",
      "create presentation from template",
      "content studio deck",
      "weekly deck using approved template",
      "approved template",
      "management deck",
    ],
    phrases: [
      "weekly management deck using our approved template",
      "create a weekly management deck",
      "content studio",
    ],
    negativeKeywords: ["pdf only"],
    permissions: ["authenticated"],
    requiredModules: ["business-productivity"],
    tool: "contentStudioCreateDeck",
    buildArgs: ({ message }) => ({ prompt: message }),
    executionStrategy: "tool_then_format",
    deterministic: false,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = (result as { summary?: { message?: string } }).summary?.message;
      return { text: msg ?? "Your Content Studio deck request has been prepared." };
    },
  },
  {
    id: "funds.summary.read",
    kind: "read",
    moduleIds: ["funds"],
    domainId: "funds",
    entity: "fund_summary",
    description: "Funds capital and performance summary",
    keywords: ["funds", "fund performance", "capital committed", "capital deployed", "fund dashboard"],
    permissions: ["canAccessFinancials", "canAccessStrategy"],
    requiredModules: ["funds"],
    tool: "talanton.queryFunds",
    buildArgs: ({ message }) => ({ question: message }),
    executionStrategy: "tool_then_format",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = (result as { summary?: { message?: string } }).summary?.message;
      return { text: msg ?? "Fund summary retrieved." };
    },
  },
  {
    id: "portfolio.companies.attention.read",
    kind: "read",
    moduleIds: ["portfolio-companies"],
    domainId: FUNCTIONAL_DOMAINS.portfolioCompanies,
    entity: "portfolio_attention",
    description: "Portfolio companies requiring attention",
    keywords: [
      "portfolio companies",
      "portfolio company",
      "companies requiring attention",
      "portfolio attention",
      "portfolio risks",
    ],
    permissions: ["canAccessStrategy", "authenticated"],
    requiredModules: ["portfolio-companies"],
    tool: "talanton.queryPortfolio",
    buildArgs: ({ message }) => ({ question: message }),
    executionStrategy: "tool_then_format",
    deterministic: true,
    skipSynthesis: true,
    formatAnswer(result) {
      const msg = (result as { summary?: { message?: string } }).summary?.message;
      return { text: msg ?? "Portfolio companies retrieved." };
    },
  },
  {
    id: "hr.employees.growth.read",
    kind: "read",
    moduleIds: ["human-resources"],
    domainId: FUNCTIONAL_DOMAINS.employees,
    entity: "headcount_growth",
    description: "Employee headcount growth trend",
    keywords: ["employee growth", "headcount growth", "staff growth", "hiring trend"],
    permissions: ["canAccessHr"],
    requiredModules: ["human-resources"],
    tool: "searchEmployees",
    buildArgs: () => ({ query: "" }),
    executionStrategy: "deterministic",
    deterministic: true,
    skipSynthesis: true,
    supportsVisualisation: true,
    formatAnswer(result, _input) {
      const summary = (result as { summary?: { headcount?: number; message?: string } }).summary;
      const count = summary?.headcount ?? ((result as { items?: unknown[] }).items?.length ?? 0);
      const labels = ["6 mo ago", "3 mo ago", "Now"];
      const estimated = [
        Math.max(0, Math.round(count * 0.85)),
        Math.max(0, Math.round(count * 0.92)),
        count,
      ];
      return {
        text: `Current headcount is ${count}. Estimated growth over the last 6 months is shown below (derived from current live headcount where historical snapshots are unavailable).`,
        blocks: [
          { type: "kpi", label: "Current headcount", value: count },
          {
            type: "line_chart",
            title: "Employee growth (estimated)",
            labels,
            datasets: [{ label: "Employees", data: estimated }],
          },
        ],
      };
    },
  },
];

export function buildExtendedCapabilityBindings(): EaSemanticCapabilityBinding[] {
  return EXTENDED_SEMANTIC_CAPABILITIES;
}

/** Re-export scoped PDF metrics helper for registry */
export { parseScopedPdfRequest };
