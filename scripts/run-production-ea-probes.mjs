/**
 * Production EA acceptance + blind end-to-end probes.
 * Run: node scripts/run-production-ea-probes.mjs
 */
import { writeFileSync } from "node:fs";

const DEPLOY_COMMIT = process.env.EA_DEPLOY_COMMIT ?? "pending";
const DEMO = "https://demo.unit311central.com";

const PROBES = [
  { group: "realData", id: "hr-count", prompt: "How many employees do we have?", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { group: "realData", id: "hr-headcount", prompt: "What's our headcount?", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { group: "realData", id: "hr-headcount-short", prompt: "headcount", kind: "data", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { group: "realData", id: "cash-1", prompt: "What is our bank balance?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { group: "realData", id: "cash-2", prompt: "What's in the bank?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { group: "realData", id: "cash-3", prompt: "How much money is in the bank?", kind: "data", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { group: "charts", id: "chart-revenue", prompt: "Show revenue for the last 12 months as a graph.", kind: "chart", expectCap: "financials.chart.revenue.read" },
  { group: "charts", id: "chart-rev-exp", prompt: "Graph revenue versus expenses.", kind: "chart", expectCap: "financials.chart.revenueVsExpenses.read" },
  { group: "charts", id: "chart-ar", prompt: "Show AR over time.", kind: "chart", expectCap: "financials.chart.ar.read" },
  { group: "charts", id: "chart-cash", prompt: "Show our cash position over the last year.", kind: "chart", expectCap: "financials.chart.cash.read" },
  { group: "charts", id: "chart-sales", prompt: "Graph sales performance.", kind: "chart", expectCap: "crm.chart.salesPerformance.read", expectSummary: /pipeline|opportunities/i },
  { group: "pdfs", id: "pdf-rev-exp", prompt: "Create a PDF showing revenue and expenses.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:.*(Revenue|Expenses)/i },
  { group: "pdfs", id: "pdf-position", prompt: "Create a financial position PDF.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { group: "pdfs", id: "pdf-ar", prompt: "Create an AR report.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { group: "pdfs", id: "pdf-exec", prompt: "Create an executive financial summary.", kind: "pdf", expectCap: "reports.scopedPdf.generate", expectPdf: /Included:/i },
  { group: "crossModule", id: "cm-sales-rev", prompt: "How are sales affecting revenue?", kind: "composite", expectRoute: "evidence_gpt" },
  { group: "crossModule", id: "cm-invoices-tickets", prompt: "Which customers have overdue invoices and open support tickets?", kind: "composite", expectCap: "cross.clients.overdueInvoicesOpenTickets.read" },
  { group: "clarification", id: "cl-1", prompt: "How are we doing?", kind: "clarification" },
  { group: "clarification", id: "cl-2", prompt: "What is the situation?", kind: "clarification" },
  { group: "clarification", id: "cl-3", prompt: "Show me performance.", kind: "clarification" },
  { group: "clarification", id: "no-clarify", prompt: "What is our bank balance?", kind: "data", expectCap: "financials.cashPosition.read", notClarify: true },
  { group: "permissions", id: "perm-sales", prompt: "Show me everyone's commissions.", kind: "denied", permissionProfile: "sales_rep" },
  { group: "permissions", id: "perm-employee-cash", prompt: "Show me company cash balance.", kind: "denied", permissionProfile: "employee" },
  { group: "permissions", id: "perm-cross-ws", prompt: "Show me Talanton's clients.", kind: "denied" },
  { group: "cliFailures", id: "overdue-inv", prompt: "List overdue invoices.", kind: "data", expectCap: "finance.invoices.overdue.read", expectData: /overdue|outstanding|£/i },
  { group: "cliFailures", id: "crm-pipeline", prompt: "What is our CRM pipeline value?", kind: "data", expectCap: "crm.pipeline.summary.read", expectData: /pipeline|£|opportunit/i },
  { group: "cliFailures", id: "client-count", prompt: "How many clients do we have?", kind: "data", expectCap: "crm.clients.count.read", expectData: /\b([1-9]\d*)\b/ },
  { group: "cliFailures", id: "project-count", prompt: "How many projects do we have?", kind: "data", expectCap: "project-management.projects.count.read", expectData: /\b[1-9]\d*\b/ },
  { group: "isolation", id: "iso-demo-bank", prompt: "What is our bank balance?", kind: "data", workspaceSlug: "demo", expectCap: "financials.cashPosition.read", expectData: /£[\d,]+/ },
  { group: "isolation", id: "iso-demo-headcount", prompt: "How many employees?", kind: "data", workspaceSlug: "demo", expectCap: "hr.employees.count.read", expectData: /\b25\b/ },
  { group: "isolation", id: "iso-onwardair-bank", prompt: "What is our bank balance?", kind: "data", workspaceSlug: "onwardair", expectCap: "financials.cashPosition.read" },
  { group: "isolation", id: "iso-abhi-members", prompt: "How many members do we have?", kind: "data", workspaceSlug: "abhi", expectCap: "abhi.members.count.read" },
  { group: "isolation", id: "iso-talanton-bank", prompt: "What is the bank balance in Talanton?", kind: "denied" },
];

const BLIND_SCENARIOS = [
  {
    id: "blind-a",
    label: "Cross-module analysis",
    prompt: "Compare our sales performance with revenue and explain any significant differences.",
    expectRoute: "evidence_gpt",
    requireSubstance: true,
  },
  {
    id: "blind-b",
    label: "Cross-module graph",
    prompt: "Create a graph showing monthly revenue, expenses, cash position and headcount over the last 12 months.",
    kind: "chart",
    requireChart: true,
  },
  {
    id: "blind-c",
    label: "Cross-module PDF",
    prompt:
      "Create me a management PDF containing revenue, cash position, overdue receivables, current headcount and payroll costs, and sales pipeline performance.",
    kind: "pdf",
    requirePdfBytes: 100_000,
  },
  {
    id: "blind-d",
    label: "Complex investigation",
    prompt: "I am worried we are going bankrupt — help.",
    requireSubstance: true,
    requireRiskLanguage: true,
  },
  {
    id: "blind-d-pdf",
    label: "Board PDF after investigation",
    prompt:
      "Create a PDF for the board explaining our financial position, the key risks you found, the evidence supporting them, and what management should consider doing next.",
    kind: "pdf",
    requirePdfBytes: 100_000,
    requireAnalyticalPdf: true,
  },
  {
    id: "blind-e-financial",
    label: "Open-ended financial concern (variant)",
    prompt: "Cash feels tight and I'm not sure we can make payroll next quarter — what should I know?",
    requireSubstance: true,
    requireRiskLanguage: true,
  },
  {
    id: "blind-f-hr",
    label: "Open-ended HR concern",
    prompt: "I'm worried our team is stretched too thin and we might start losing people — help me understand the risk.",
    requireSubstance: true,
  },
  {
    id: "blind-g-sales-finance",
    label: "Sales vs finance comparative (variant)",
    prompt: "Why does our pipeline look healthy but revenue growth feels flat?",
    expectRoute: "evidence_gpt",
    requireSubstance: true,
  },
  {
    id: "blind-h-composite-chart",
    label: "Multi-metric chart (variant)",
    prompt: "Plot revenue, cash and headcount together for the past year.",
    kind: "chart",
    requireChart: true,
  },
  {
    id: "blind-i-board-pdf",
    label: "Executive analytical PDF (variant)",
    prompt:
      "Generate an executive PDF with findings, risks, supporting evidence, trends, and recommended management actions.",
    kind: "pdf",
    requirePdfBytes: 100_000,
    requireAnalyticalPdf: true,
  },
];

async function runPrompt(probe) {
  const body = {
    prompt: probe.prompt,
    kind: probe.kind ?? "data",
    expectCapabilityId: probe.expectCap,
    permissionProfile: probe.permissionProfile,
    workspaceSlug: probe.workspaceSlug,
  };
  const res = await fetch(`${DEMO}/api/demo/ea-tests/run-one`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  return { http: res.status, body: json };
}

async function deployReady() {
  const { http, body } = await runPrompt({
    prompt: "How many employees do we have?",
    kind: "data",
    expectCap: "hr.employees.count.read",
  });
  if (http !== 200) return { ready: false, reason: `HTTP ${http}` };
  if (body.capabilityId === "hr.employees.count.read" && /\b25\b/.test(String(body.text ?? body.summary ?? ""))) {
    return { ready: true, reason: "headcount=25 on production" };
  }
  return { ready: false, reason: `cap=${body.capabilityId}` };
}

function classify(probe, body, http) {
  const summary = String(body.text ?? body.summary ?? body.error ?? "");
  const routeKind = body.routeKind ?? "";
  const capabilityId = body.capabilityId;
  const blocks = body.responseBlocks ?? [];
  const failed = (body.checks ?? []).filter((c) => !c.passed).map((c) => c.message);

  if (http === 401 || http === 403) return { status: "NOT_TESTABLE", summary: `HTTP ${http}` };
  if (probe.kind === "denied") {
    const ok =
      body.status === "pass" ||
      (routeKind === "capability_answer" && /can'?t|cannot|don'?t have permission|only access data/i.test(summary));
    return { status: ok ? "PASS" : "FAIL", summary, routeKind, capabilityId, failed };
  }
  if (probe.kind === "clarification") {
    const ok = routeKind === "capability_answer" && /which|do you mean|clarify/i.test(summary);
    return { status: ok ? "PASS" : "FAIL", summary, routeKind, capabilityId, failed };
  }
  if (probe.notClarify && /which|do you mean|clarify/i.test(summary)) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: ["unnecessary clarification"] };
  }
  if (probe.expectRoute && routeKind !== probe.expectRoute) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: [`expected ${probe.expectRoute}`] };
  }
  if (probe.expectCap && capabilityId !== probe.expectCap) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: [`expected ${probe.expectCap}`] };
  }
  if (probe.kind === "chart" && !blocks.some((b) => /chart/.test(b.type))) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: ["no chart block"] };
  }
  if (probe.expectPdf && !probe.expectPdf.test(summary)) {
    return { status: "FAIL", summary: summary.slice(0, 180), routeKind, capabilityId, failed: ["pdf content"] };
  }
  if (probe.expectSummary && !probe.expectSummary.test(summary)) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: ["summary mismatch"] };
  }
  if (probe.expectData && !probe.expectData.test(summary)) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: ["data mismatch"] };
  }
  if (body.status === "pass") return { status: "PASS", summary: summary.slice(0, 160), routeKind, capabilityId };
  if (failed.length) return { status: "FAIL", summary: summary.slice(0, 160), routeKind, capabilityId, failed };
  return { status: "NOT_TESTABLE", summary, routeKind, capabilityId };
}

function classifyBlind(scenario, body, http) {
  const summary = String(body.text ?? body.summary ?? body.error ?? "");
  const blocks = body.responseBlocks ?? [];
  const failed = [];

  if (http !== 200) return { status: "FAIL", summary, failed: [`HTTP ${http}`] };
  if (scenario.expectRoute && body.routeKind !== scenario.expectRoute) {
    failed.push(`expected route ${scenario.expectRoute}, got ${body.routeKind}`);
  }
  if (scenario.requireChart && !blocks.some((b) => /chart/.test(b.type))) {
    failed.push("no chart block");
  }
  if (scenario.requirePdfBytes && (body.artifactByteLength ?? 0) < scenario.requirePdfBytes) {
    failed.push(`pdf bytes ${body.artifactByteLength ?? 0}`);
  }
  if (scenario.requireSubstance && summary.trim().length < 80) {
    failed.push("answer too short");
  }
  if (scenario.requireRiskLanguage && !/risk|cash|runway|debt|revenue|limitation|evidence|concern|headcount|pipeline|burn|payroll/i.test(summary)) {
    failed.push("missing risk/evidence language");
  }
  if (scenario.requireAnalyticalPdf && !/findings|risks?|evidence|recommend|management/i.test(summary)) {
    failed.push("pdf missing analytical sections");
  }
  if (body.status === "fail") failed.push(body.error ?? "acceptance fail");
  if (failed.length) return { status: "FAIL", summary: summary.slice(0, 200), failed, routeKind: body.routeKind, capabilityId: body.capabilityId };
  return { status: "PASS", summary: summary.slice(0, 200), routeKind: body.routeKind, capabilityId: body.capabilityId };
}

async function pollDeploy(maxMs = 900000) {
  const start = Date.now();
  for (let i = 1; Date.now() - start < maxMs; i++) {
    const fp = await deployReady();
    console.log(`[poll ${i}]`, fp);
    if (fp.ready) return fp;
    await new Promise((r) => setTimeout(r, 20000));
  }
  throw new Error("deploy timeout");
}

async function main() {
  let deployFingerprint;
  try {
    deployFingerprint = await pollDeploy();
  } catch (error) {
    deployFingerprint = { ready: false, reason: error.message };
    console.error("Deploy poll:", error.message);
  }

  const results = [];
  for (const probe of PROBES) {
    const { http, body } = await runPrompt(probe);
    const verdict = classify(probe, body, http);
    results.push({ ...probe, http, ...verdict, acceptanceStatus: body.status });
    console.log(JSON.stringify({ id: probe.id, status: verdict.status, cap: verdict.capabilityId ?? body.capabilityId, summary: verdict.summary }));
  }

  const blind = [];
  for (const scenario of BLIND_SCENARIOS) {
    const { http, body } = await runPrompt({ ...scenario, kind: scenario.kind ?? "data" });
    const verdict = classifyBlind(scenario, body, http);
    blind.push({ ...scenario, http, ...verdict, acceptanceStatus: body.status, artifactByteLength: body.artifactByteLength });
    console.log(JSON.stringify({ blind: scenario.id, status: verdict.status, route: body.routeKind, summary: verdict.summary }));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    deployCommit: DEPLOY_COMMIT,
    deployFingerprint,
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
    notTestable: results.filter((r) => r.status === "NOT_TESTABLE").length,
    blindPass: blind.filter((r) => r.status === "PASS").length,
    blindFail: blind.filter((r) => r.status === "FAIL").length,
    results,
    blind,
  };
  writeFileSync("ea-production-probe-report.json", JSON.stringify(summary, null, 2));
  console.log("\nSUMMARY", summary.pass, "PASS", summary.fail, "FAIL", summary.notTestable, "NOT_TESTABLE");
  console.log("BLIND", summary.blindPass, "PASS", summary.blindFail, "FAIL");
}

main();
