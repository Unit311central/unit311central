/**
 * Scoped NL business PDF — routing, period, gaps.
 * Run: node --import tsx src/lib/ai-operating-assistant/__tests__/scoped-pdf.check.ts
 */
import assert from "node:assert/strict";
import { resolveDirectIntent } from "../intent-router";
import { parseReportPeriod, lastNMonthKeys } from "../report-period";
import { parseScopedPdfRequest } from "../scoped-pdf-metrics";
import {
  renderScopedBusinessPdf,
  type ScopedPdfLiveBundle,
} from "../scoped-business-pdf-service";

const DEMO =
  "create me a pdf for the profit and loss for last 6 months, burn rate, payroll total, value of crm pipeline";

async function main() {
  {
    const period = parseReportPeriod(DEMO);
    assert.equal(period.kind, "last_n_months");
    if (period.kind === "last_n_months") assert.equal(period.n, 6);
    assert.equal(lastNMonthKeys(6).length, 6);
  }

  {
    const scoped = parseScopedPdfRequest(DEMO);
    assert.equal(scoped.useScopedPath, true);
    assert.deepEqual(scoped.metrics, [
      "pnl",
      "burn_rate",
      "payroll_total",
      "crm_pipeline_value",
    ]);
    assert.deepEqual(scoped.unknownTopics, []);
    const intent = resolveDirectIntent(DEMO, []);
    assert.equal(intent?.tool, "generateScopedBusinessPdf");
    assert.deepEqual(intent?.args.metrics, scoped.metrics);
  }

  // Regression: "create me a pdf…" must never become Create client location.
  {
    const { classifyKnowledgeDomain } = await import("../knowledge-domains");
    const { hasExplicitWriteIntent } = await import("../intent-action-resolver");
    const { resolveOrchestrationRoute } = await import("../action-orchestration");
    const { registerAllActionModules } = await import("../actions/register-all-modules");
    registerAllActionModules();
    assert.equal(hasExplicitWriteIntent(DEMO), false);
    assert.equal(classifyKnowledgeDomain(DEMO).domain, "business");
    const business = {
      user: { id: "u", username: "u", displayName: "U", userType: "internal" as const },
      organisation: { id: null, name: null },
      workspace: { id: null, name: "W", slug: "w" },
      page: { activeView: "clients-dashboard", label: "Clients", pathname: null },
      selection: {
        clientId: null,
        clientName: null,
        projectId: null,
        projectName: null,
        employeeId: null,
        employeeName: null,
        contractId: null,
        contractName: null,
        fileId: null,
        fileName: null,
      },
      permissions: {
        roleView: "c-suite" as const,
        canAccessFinancials: true,
        canAccessUsers: true,
        canAccessStrategy: true,
        canAccessHr: true,
      },
      generatedAt: new Date().toISOString(),
    };
    const route = await resolveOrchestrationRoute(DEMO, [], business);
    assert.equal(route.kind, "tool");
    if (route.kind === "tool") {
      assert.equal(route.intent.tool, "generateScopedBusinessPdf");
    }
  }

  {
    const intent = resolveDirectIntent("Create a financial report PDF", []);
    assert.equal(intent?.tool, "generateFinancialReportPdf");
  }

  {
    const intent = resolveDirectIntent("Create a payroll PDF", []);
    assert.equal(intent?.tool, "generatePayrollPdf");
  }

  {
    const intent = resolveDirectIntent("Export all employees to PDF", []);
    assert.equal(intent?.tool, "generateEmployeeListPdf");
  }

  {
    const typo =
      "create me a pdf for the profit and loss for last 6 months, burn rate, payroll total, value of crm pipelin";
    const scoped = parseScopedPdfRequest(typo);
    assert.ok(scoped.metrics.includes("crm_pipeline_value"), "pipelin typo should map to CRM pipeline");
    assert.equal(scoped.unknownTopics.length, 0, `unexpected unknowns: ${scoped.unknownTopics.join(", ")}`);
  }

  {
    // General typo tolerance across metrics
    const typos = parseScopedPdfRequest(
      "create a pdf for payrol total, burnrte, headcont, active clienst, hot leeds",
    );
    assert.ok(typos.metrics.includes("payroll_total"), `got ${typos.metrics.join(",")}`);
    assert.ok(typos.metrics.includes("burn_rate"), `got ${typos.metrics.join(",")}`);
    assert.ok(typos.metrics.includes("headcount"), `got ${typos.metrics.join(",")}`);
    assert.ok(typos.metrics.includes("active_clients"), `got ${typos.metrics.join(",")}`);
    assert.ok(typos.metrics.includes("hot_leads"), `got ${typos.metrics.join(",")}`);
  }

  {
    const cross = parseScopedPdfRequest(
      "create a pdf with cash position, overdue projects, open vacancies, ar outstanding",
    );
    assert.ok(cross.metrics.includes("cash"));
    assert.ok(cross.metrics.includes("overdue_projects"));
    assert.ok(cross.metrics.includes("open_vacancies"));
    assert.ok(cross.metrics.includes("ar_outstanding"));
  }

  {
    const scoped = parseScopedPdfRequest("create a pdf for P&L and marketing CAC");
    assert.equal(scoped.useScopedPath, true);
    assert.ok(scoped.metrics.includes("pnl"));
    assert.ok(scoped.unknownTopics.some((t) => /marketing\s+cac/i.test(t)));
  }

  {
    const bundle: ScopedPdfLiveBundle = {
      sections: [
        {
          metricId: "pnl",
          heading: "Profit & Loss",
          rows: [
            { label: "Revenue (sum)", value: "£10" },
            { label: "Expenses (sum)", value: "£4" },
            { label: "Net profit / (loss)", value: "£6" },
          ],
        },
        {
          metricId: "burn_rate",
          heading: "Burn rate",
          rows: [{ label: "Monthly burn", value: "£2" }],
        },
        {
          metricId: "payroll_total",
          heading: "Payroll total",
          rows: [{ label: "Monthly payroll total", value: "£1" }],
        },
        {
          metricId: "crm_pipeline_value",
          heading: "CRM pipeline value",
          rows: [{ label: "Open pipeline value", value: "£50" }],
        },
      ],
      unknownTopics: ["marketing cac"],
      periodLabel: "Last 6 months",
      sources: ["assistant:scoped-pdf"],
      blocked: [],
    };

    const artifact = await renderScopedBusinessPdf({
      bundle,
      userId: "test-user",
      organisationName: "Unit311",
      title: "Custom Business Report",
      requestPreview: DEMO,
    });

    assert.equal(artifact.bytes.slice(0, 4).toString(), "%PDF");
    assert.ok(
      artifact.filename.toLowerCase().includes("custom") || artifact.filename.endsWith(".pdf"),
    );
    assert.deepEqual(artifact.meta?.unknownTopics, ["marketing cac"]);
  }

  console.log(JSON.stringify({ ok: true }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
