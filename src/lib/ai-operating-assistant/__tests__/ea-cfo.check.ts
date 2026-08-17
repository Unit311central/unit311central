/**
 * CFO-grade EA routing — open questions, composite PDFs, client shock, crisis planning.
 * Run: npm run prove:ea-cfo
 */
import assert from "node:assert/strict";

import { extractClientNameFromScenario } from "@/lib/ai-operating-assistant/client-scenario-tools";
import { classifyKnowledgeDomain } from "@/lib/ai-operating-assistant/knowledge-domains";
import { resolveDirectIntent } from "@/lib/ai-operating-assistant/intent-router";
import { parseScopedPdfRequest } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";

type CfoRouteCase = {
  id: string;
  prompt: string;
  tool: string;
  domain?: "business" | "write";
  metricsIncludes?: string[];
};

const CFO_ROUTE_CASES: CfoRouteCase[] = [
  {
    id: "pdf-6m-pl-balance-cash",
    prompt:
      "Make me a PDF report for the last 6 months with P&L, balance sheet, and cash position",
    tool: "generateScopedBusinessPdf",
    domain: "business",
    metricsIncludes: ["pnl", "balance_sheet", "cash"],
  },
  {
    id: "pdf-pl-burn-payroll",
    prompt:
      "create me a pdf for the profit and loss for last 6 months, burn rate, payroll total, value of crm pipeline",
    tool: "generateScopedBusinessPdf",
    metricsIncludes: ["pnl", "burn_rate", "payroll_total", "crm_pipeline_value"],
  },
  {
    id: "client-bankrupt",
    prompt: "Client Meridian Packaging has just gone bankrupt — what are the ramifications?",
    tool: "analyzeClientScenario",
    domain: "business",
  },
  {
    id: "customer-insolvency",
    prompt: "Our customer Acme Industries filed for insolvency yesterday. What is our exposure?",
    tool: "analyzeClientScenario",
  },
  {
    id: "going-out-of-business",
    prompt: "I'm worried we are going out of business — what should I do?",
    tool: "planBusinessGoal",
  },
  {
    id: "cash-runway-crisis",
    prompt: "We might run out of cash in 90 days. What actions should we take?",
    tool: "planBusinessGoal",
  },
  {
    id: "summarise-business",
    prompt: "Summarise the business — cash, pipeline, and risks",
    tool: "queryBusiness",
  },
  {
    id: "cash-position",
    prompt: "How much cash do we have in the bank?",
    tool: "getCashPosition",
    domain: "business",
  },
  {
    id: "overdue-ar",
    prompt: "Which customers owe us the most overdue money?",
    tool: "searchInvoices",
    domain: "business",
  },
  {
    id: "burn-question",
    prompt: "What is our monthly burn and runway?",
    tool: "queryBusiness",
  },
  {
    id: "financial-report-pdf",
    prompt: "Create a financial report PDF for the board",
    tool: "generateFinancialReportPdf",
    domain: "business",
  },
  {
    id: "scoped-ytd-revenue",
    prompt: "Generate a PDF with revenue YTD and net profit",
    tool: "generateScopedBusinessPdf",
    metricsIncludes: ["revenue_ytd", "net_profit"],
  },
];

export function runEaCfoRouteSuite() {
  const failures: string[] = [];

  for (const testCase of CFO_ROUTE_CASES) {
    const intent = resolveDirectIntent(testCase.prompt, []);
    if (!intent || intent.tool !== testCase.tool) {
      failures.push(
        `${testCase.id}: expected tool ${testCase.tool}, got ${intent?.tool ?? "null"}`,
      );
      continue;
    }

    if (testCase.domain) {
      const classified = classifyKnowledgeDomain(testCase.prompt);
      if (classified.domain !== testCase.domain) {
        failures.push(
          `${testCase.id}: expected domain ${testCase.domain}, got ${classified.domain}`,
        );
      }
    }

    if (testCase.metricsIncludes?.length && intent.tool === "generateScopedBusinessPdf") {
      const metrics = (intent.args.metrics as string[]) ?? [];
      for (const metric of testCase.metricsIncludes) {
        if (!metrics.includes(metric)) {
          failures.push(`${testCase.id}: scoped PDF missing metric ${metric}`);
        }
      }
    }
  }

  const scoped = parseScopedPdfRequest(
    "Make me a PDF report for the last 6 months with P&L, balance sheet, and cash position",
  );
  assert.ok(scoped.metrics.includes("balance_sheet"), "balance_sheet metric registered");
  assert.ok(scoped.metrics.includes("pnl"));
  assert.ok(scoped.metrics.includes("cash"));

  assert.equal(
    extractClientNameFromScenario("Client Meridian Packaging has just gone bankrupt"),
    "Meridian Packaging",
  );

  if (failures.length > 0) {
    console.error("prove:ea-cfo route failures:\n", failures.join("\n"));
    process.exit(1);
  }

  console.log(`prove:ea-cfo: OK (${CFO_ROUTE_CASES.length} CFO route cases + balance sheet + client extract)\n`);
}

runEaCfoRouteSuite();
