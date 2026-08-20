/**
 * EA Final Fix Phase validation — local + production.
 * Run: node --require ./scripts/test-server-only-hook.cjs --import tsx scripts/ea-final-fix-validation.mjs
 */
import { writeFileSync } from "node:fs";

import { executeEaAcceptanceCase } from "../src/lib/ea-acceptance/execute-case.ts";
import {
  businessContextForPermissionProfile,
  businessContextForWorkspace,
} from "../src/lib/ea-acceptance/workspace-context.ts";
import { validateWorkspaceFingerprint } from "../src/lib/ea-acceptance/workspace-fingerprints.ts";

const DEMO = "https://demo.unit311central.com";

const STANDARD_PROBES = [
  { id: "hr-count", prompt: "How many employees do we have?", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { id: "hr-headcount", prompt: "What's our headcount?", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { id: "hr-headcount-short", prompt: "headcount", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { id: "cash-1", prompt: "What is our bank balance?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { id: "cash-2", prompt: "What's in the bank?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { id: "cash-3", prompt: "How much money is in the bank?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { id: "chart-revenue", prompt: "Show revenue for the last 12 months as a graph.", kind: "chart", expectCap: "financials.chart.revenue.read" },
  { id: "chart-rev-exp", prompt: "Graph revenue versus expenses.", kind: "chart", expectCap: "financials.chart.revenueVsExpenses.read" },
  { id: "chart-ar", prompt: "Show AR over time.", kind: "chart", expectCap: "financials.chart.ar.read" },
  { id: "chart-cash", prompt: "Show our cash position over the last year.", kind: "chart", expectCap: "financials.chart.cash.read" },
  { id: "chart-sales", prompt: "Graph sales performance.", kind: "chart", expectCap: "crm.chart.salesPerformance.read", expectSummary: /pipeline|opportunities/i },
  { id: "pdf-rev-exp", prompt: "Create a PDF showing revenue and expenses.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:.*(Revenue|Expenses)/i },
  { id: "pdf-position", prompt: "Create a financial position PDF.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { id: "pdf-ar", prompt: "Create an AR report.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { id: "pdf-exec", prompt: "Create an executive financial summary.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { id: "cm-sales-rev", prompt: "How are sales affecting revenue?", kind: "composite", expectRoute: "evidence_gpt" },
  { id: "cm-invoices-tickets", prompt: "Which customers have overdue invoices and open support tickets?", kind: "composite", expectCap: "cross.clients.overdueInvoicesOpenTickets.read" },
  { id: "cl-1", prompt: "How are we doing?", kind: "clarification" },
  { id: "cl-2", prompt: "What is the situation?", kind: "clarification" },
  { id: "cl-3", prompt: "Show me performance.", kind: "clarification" },
  { id: "no-clarify", prompt: "What is our bank balance?", kind: "data", expectCap: "financials.cashPosition.read", notClarify: true },
  { id: "perm-sales", prompt: "Show me everyone's commissions.", kind: "denied", permissionProfile: "sales_rep" },
  { id: "perm-employee-cash", prompt: "Show me company cash balance.", kind: "denied", permissionProfile: "employee" },
  { id: "perm-cross-ws", prompt: "Show me Talanton's clients.", kind: "denied" },
  { id: "overdue-inv", prompt: "List overdue invoices.", kind: "data", expectCap: "finance.invoices.overdue.read", expectData: /overdue|outstanding|£/i },
  { id: "crm-pipeline", prompt: "What is our CRM pipeline value?", kind: "data", expectCap: "crm.pipeline.summary.read", expectData: /pipeline|£|opportunit/i },
  { id: "client-count", prompt: "How many clients do we have?", kind: "data", expectCap: "crm.clients.count.read", expectData: /\b([1-9]\d*)\b/ },
  { id: "project-count", prompt: "How many projects do we have?", kind: "data", expectCap: "project-management.projects.count.read", expectData: /\b[1-9]\d*\b/ },
  { id: "iso-demo-bank", prompt: "What is our bank balance?", kind: "data", workspaceSlug: "demo", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/, workspaceCheck: true },
  { id: "iso-demo-headcount", prompt: "How many employees?", kind: "data", workspaceSlug: "demo", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { id: "iso-onwardair-bank", prompt: "What is our bank balance?", kind: "data", workspaceSlug: "onwardair", expectCap: "financials.cashPosition.read", workspaceCheck: true, expectData: /\$1[, ]?000[, ]?000/ },
  { id: "iso-abhi-members", prompt: "How many members do we have?", kind: "data", workspaceSlug: "abhi", expectCap: "abhi.members.count.read" },
  { id: "iso-talanton-bank", prompt: "What is the bank balance in Talanton?", kind: "denied" },
];

const BLIND_SCENARIOS = [
  { id: "blind-a", prompt: "Compare our sales performance with revenue and explain any significant differences.", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "blind-b", prompt: "Create a graph showing monthly revenue, expenses, cash position and headcount over the last 12 months.", kind: "chart", requireChart: true },
  { id: "blind-c", prompt: "Create me a management PDF containing revenue, cash position, overdue receivables, current headcount and payroll costs, and sales pipeline performance.", kind: "pdf", requirePdfBytes: 100_000 },
  { id: "blind-d", prompt: "I am worried we are going bankrupt — help.", requireSubstance: true, requireRiskLanguage: true },
  { id: "blind-d-pdf", prompt: "Create a PDF for the board explaining our financial position, the key risks you found, the evidence supporting them, and what management should consider doing next.", kind: "pdf", requirePdfBytes: 100_000, requireAnalyticalPdf: true },
  { id: "blind-e-financial", prompt: "Cash feels tight and I'm not sure we can make payroll next quarter — what should I know?", requireSubstance: true, requireRiskLanguage: true },
  { id: "blind-f-hr", prompt: "I'm worried our team is stretched too thin and we might start losing people — help me understand the risk.", requireSubstance: true },
  { id: "blind-g-sales-finance", prompt: "Why does our pipeline look healthy but revenue growth feels flat?", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "blind-h-composite-chart", prompt: "Plot revenue, cash and headcount together for the past year.", kind: "chart", requireChart: true },
  { id: "blind-i-board-pdf", prompt: "Generate an executive PDF with findings, risks, supporting evidence, trends, and recommended management actions.", kind: "pdf", requirePdfBytes: 100_000, requireAnalyticalPdf: true },
];

const NEW_UNSEEN = [
  { id: "new-open-finance", prompt: "Walk me through how the business is performing financially this quarter — I need the full picture.", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "new-cross-compare", prompt: "Our bookings are up but margins seem thinner — help me reconcile sales activity with the P&L.", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "new-mgmt-brief", prompt: "Give me a leadership briefing on the three things that should worry us most right now.", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "new-multi-pdf", prompt: "Prepare a board-ready PDF covering liquidity, pipeline coverage, workforce load, and overdue collections.", kind: "pdf", requirePdfBytes: 80_000 },
  { id: "new-multi-chart", prompt: "Chart monthly revenue, operating spend, and team size on one timeline for the past year.", kind: "chart", requireChart: true },
  { id: "new-perm-restricted", prompt: "Compare CRM momentum with cash runway and tell me if we are in trouble.", permissionProfile: "sales_rep", requireRestriction: true },
  { id: "new-sparse", prompt: "Are we at risk of insolvency based on everything you can see?", workspaceSlug: "abhi", requireSubstance: true, requireNoInventedFigures: true },
  { id: "new-hr-finance", prompt: "Is our payroll load sustainable relative to revenue and cash reserves?", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "new-sales-finance", prompt: "Does the open pipeline justify our revenue forecast given current cash and AR?", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "new-ops-crm", prompt: "Which active projects look under-resourced when you compare delivery load with sales commitments?", expectRoute: "evidence_gpt", requireSubstance: true },
];

const PERMISSION_TESTS = [
  { id: "perm-mgr-compare", prompt: "Compare headcount growth with operating costs over the last year.", permissionProfile: "manager", expectRoute: "evidence_gpt", requireSubstance: true },
  { id: "perm-sales-cross", prompt: "How does pipeline value align with recognised revenue this quarter?", permissionProfile: "sales_rep", requireRestriction: true },
  { id: "perm-emp-investigation", prompt: "Should I be worried about company cash and overdue receivables?", permissionProfile: "employee", requireRestriction: true },
];

const WORKSPACE_TESTS = [
  { id: "ws-demo", workspaceSlug: "demo", prompt: "What is our bank balance?", expectCap: "financials.cashPosition.read", forbidden: /\$4,?250,?000|\$1,?000,?000/ },
  { id: "ws-onwardair", workspaceSlug: "onwardair", prompt: "What is our bank balance?", expectCap: "financials.cashPosition.read", required: /\$1[, ]?000[, ]?000/, forbidden: /1[, ]?786[, ]?600/ },
  { id: "ws-talanton", workspaceSlug: "talantonimpact", prompt: "What is our bank balance?", expectCap: "financials.cashPosition.read", required: /\$4[, ]?250[, ]?000/, forbidden: /1[, ]?786[, ]?600/ },
  { id: "ws-abhi", workspaceSlug: "abhi", prompt: "What is our bank balance?", expectCap: "financials.cashPosition.read", required: /£1[, ]?000[, ]?000/, forbidden: /\$1,?000,?000/ },
];

const BASELINE_FAILURES = [
  { id: "fv-driving", prompt: "What is driving the change in our financial position?", expectRoute: "evidence_gpt" },
  { id: "fv-compare", prompt: "Compare sales vs financial performance and explain gaps.", expectRoute: "evidence_gpt" },
  { id: "fv-mgmt", prompt: "What should management know this month?", expectRoute: "evidence_gpt" },
];

function businessFor(probe) {
  if (probe.permissionProfile) {
    return businessContextForPermissionProfile(probe.permissionProfile, probe.workspaceSlug ?? "demo");
  }
  if (probe.workspaceSlug) return businessContextForWorkspace(probe.workspaceSlug);
  return businessContextForWorkspace("demo");
}

function classifyStandard(probe, execution) {
  const summary = String(execution.text ?? "");
  const blocks = execution.responseBlocks ?? [];
  const failed = [];

  if (probe.kind === "denied") {
    const ok =
      execution.status === "pass" ||
      /can'?t|cannot|don'?t have permission|only access data|not permitted|restricted/i.test(summary);
    return { status: ok ? "PASS" : "FAIL", summary: summary.slice(0, 160), failed: ok ? [] : ["not denied"] };
  }
  if (probe.kind === "clarification") {
    const ok = execution.routeKind === "capability_answer" && /which|do you mean|clarify/i.test(summary);
    return { status: ok ? "PASS" : "FAIL", summary: summary.slice(0, 160), failed: ok ? [] : ["no clarification"] };
  }
  if (probe.notClarify && /which|do you mean|clarify/i.test(summary)) failed.push("unnecessary clarification");
  if (probe.expectRoute && execution.routeKind !== probe.expectRoute) failed.push(`route ${execution.routeKind}`);
  if (probe.expectCap && execution.capabilityId !== probe.expectCap) failed.push(`cap ${execution.capabilityId}`);
  if (probe.kind === "chart" && !blocks.some((b) => /chart/.test(b.type))) failed.push("no chart");
  if (probe.expectPdf && !probe.expectPdf.test(summary)) failed.push("pdf content");
  if (probe.expectSummary && !probe.expectSummary.test(summary)) failed.push("summary");
  if (probe.expectData && !probe.expectData.test(summary)) failed.push("data");
  if (probe.workspaceCheck) {
    const fp = validateWorkspaceFingerprint(probe.workspaceSlug, summary, { requiresCashEvidence: true });
    if (!fp.ok) failed.push(`fingerprint: ${fp.reason}`);
  }
  if (execution.status !== "pass" && !failed.length) failed.push(execution.error ?? "acceptance fail");
  return { status: failed.length ? "FAIL" : "PASS", summary: summary.slice(0, 160), failed, routeKind: execution.routeKind, capabilityId: execution.capabilityId };
}

function classifyBlindish(probe, execution) {
  const summary = String(execution.text ?? "");
  const blocks = execution.responseBlocks ?? [];
  const failed = [];
  if (probe.expectRoute && execution.routeKind !== probe.expectRoute) failed.push(`route ${execution.routeKind}`);
  if (probe.requireChart && !blocks.some((b) => /chart/.test(b.type))) failed.push("no chart");
  if (probe.requirePdfBytes && (execution.artifactByteLength ?? 0) < probe.requirePdfBytes) failed.push(`pdf bytes ${execution.artifactByteLength ?? 0}`);
  if (probe.requireSubstance && summary.trim().length < 80) failed.push("too short");
  if (probe.requireRiskLanguage && !/risk|cash|runway|debt|revenue|limitation|evidence|concern|headcount|pipeline|burn|payroll/i.test(summary)) failed.push("no risk language");
  if (probe.requireAnalyticalPdf && !/findings|risks?|evidence|recommend|management/i.test(summary)) failed.push("analytical pdf");
  if (probe.requireRestriction && !/restricted|cannot complete|partial|omitted|not permitted|finance permissions/i.test(summary)) failed.push("no restriction notice");
  if (probe.requireNoInventedFigures && /\$\d{3,}|£\d{3,}/.test(summary) && /insufficient|unavailable|cannot confirm/i.test(summary) === false) {
    // allow figures only when evidence-backed wording present
    if (!/evidence|supporting|balance|revenue|pipeline/i.test(summary)) failed.push("possible invented figures");
  }
  if (execution.status === "fail" && !failed.length) failed.push(execution.error ?? "fail");
  return { status: failed.length ? "FAIL" : "PASS", summary: summary.slice(0, 200), failed, routeKind: execution.routeKind, capabilityId: execution.capabilityId };
}

function classifyWorkspace(probe, execution) {
  const summary = String(execution.text ?? "");
  const failed = [];
  if (probe.expectCap && execution.capabilityId !== probe.expectCap) failed.push(`cap ${execution.capabilityId}`);
  if (probe.required && !probe.required.test(summary)) failed.push("missing workspace marker");
  if (probe.forbidden && probe.forbidden.test(summary)) failed.push("foreign workspace marker");
  const fp = validateWorkspaceFingerprint(probe.workspaceSlug, summary, { requiresCashEvidence: true });
  if (!fp.ok) failed.push(fp.reason);
  return { status: failed.length ? "FAIL" : "PASS", summary: summary.slice(0, 160), failed };
}

async function runLocal(probe) {
  const business = businessFor(probe);
  return executeEaAcceptanceCase(
    {
      id: probe.id,
      prompt: probe.prompt,
      kind: probe.kind ?? "data",
      expectCapabilityId: probe.expectCap,
      permissionProfile: probe.permissionProfile,
    },
    business,
    { executeTools: true },
  );
}

async function runProduction(probe) {
  const res = await fetch(`${DEMO}/api/demo/ea-tests/run-one`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      prompt: probe.prompt,
      kind: probe.kind ?? "data",
      expectCapabilityId: probe.expectCap,
      permissionProfile: probe.permissionProfile,
      workspaceSlug: probe.workspaceSlug,
    }),
  });
  const body = await res.json().catch(() => ({}));
  return { http: res.status, body };
}

function mapProductionToExecution(body) {
  return {
    status: body.status,
    routeKind: body.routeKind,
    capabilityId: body.capabilityId,
    text: body.text ?? body.summary ?? "",
    responseBlocks: body.responseBlocks,
    artifactByteLength: body.artifactByteLength,
    error: body.error,
  };
}

async function runSuite(name, probes, classify, mode = "local") {
  const results = [];
  for (const probe of probes) {
    let execution;
    let http;
    if (mode === "production") {
      const prod = await runProduction(probe);
      http = prod.http;
      execution = mapProductionToExecution(prod.body);
      if (prod.body.workspaceFingerprint && !prod.body.workspaceFingerprint.ok && probe.workspaceCheck) {
        execution.status = "fail";
        execution.error = prod.body.workspaceFingerprint.reason;
      }
    } else {
      execution = await runLocal(probe);
    }
    const verdict = classify(probe, execution);
    results.push({ id: probe.id, http, ...verdict });
    console.log(JSON.stringify({ suite: name, id: probe.id, status: verdict.status, failed: verdict.failed }));
  }
  return results;
}

async function checkLiveChatParity() {
  const fs = await import("node:fs");
  const runtime = fs.readFileSync("src/lib/ai-operating-assistant/assistant-runtime.ts", "utf8");
  const usesDeterministic = /executeEvidencePlan\(route\.plan/.test(runtime);
  const local = await runLocal({
    id: "live-parity",
    prompt: "Compare pipeline momentum with revenue recognition this quarter.",
    kind: "composite",
  });
  const ok = usesDeterministic && local.routeKind === "evidence_gpt" && local.status === "pass";
  return {
    status: ok ? "PASS" : "FAIL",
    usesDeterministic,
    routeKind: local.routeKind,
    localStatus: local.status,
  };
}

async function main() {
  const mode = process.argv.includes("--production") ? "production" : "local";
  console.log(`EA Final Fix Validation (${mode})`);

  const baseline = await runSuite("baseline", BASELINE_FAILURES, classifyBlindish, mode);
  const standard = await runSuite("standard", STANDARD_PROBES, classifyStandard, mode);
  const blind = await runSuite("blind", BLIND_SCENARIOS, classifyBlindish, mode);
  const unseen = await runSuite("unseen", NEW_UNSEEN, classifyBlindish, mode);
  const permissions = await runSuite("permissions", PERMISSION_TESTS, classifyBlindish, mode);
  const workspaces = await runSuite("workspace", WORKSPACE_TESTS, classifyWorkspace, mode);
  const liveChat = await checkLiveChatParity();

  const count = (rows) => ({
    pass: rows.filter((r) => r.status === "PASS").length,
    total: rows.length,
  });

  const report = {
    generatedAt: new Date().toISOString(),
    mode,
    baseline: count(baseline),
    standard: count(standard),
    blind: count(blind),
    unseen: count(unseen),
    permissions: count(permissions),
    workspace: count(workspaces),
    liveChat,
    details: { baseline, standard, blind, unseen, permissions, workspaces },
  };

  writeFileSync("ea-final-fix-validation-report.json", JSON.stringify(report, null, 2));

  console.log("\n=== SCORES ===");
  console.log(`Standard: ${report.standard.pass}/${report.standard.total}`);
  console.log(`Existing blind: ${report.blind.pass}/${report.blind.total}`);
  console.log(`New unseen: ${report.unseen.pass}/${report.unseen.total}`);
  console.log(`Permission tests: ${report.permissions.pass}/${report.permissions.total}`);
  console.log(`Workspace tests: ${report.workspace.pass}/${report.workspace.total}`);
  console.log(`Live chat tests: ${liveChat.status === "PASS" ? "1/1" : "0/1"}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
