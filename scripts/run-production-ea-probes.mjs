/**
 * Production EA acceptance probes via demo run-one API (prompt mode).
 * Run: node scripts/run-production-ea-probes.mjs
 */
import { writeFileSync } from "node:fs";

const DEPLOY_COMMIT = "4e80a66";
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
  { group: "charts", id: "chart-sales", prompt: "Graph sales performance.", kind: "chart", expectCap: "crm.chart.salesPerformance.read" },
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
  { group: "permissions", id: "perm-sales", prompt: "Show me everyone's commissions.", kind: "denied" },
  { group: "permissions", id: "perm-employee-cash", prompt: "Show me company cash balance.", kind: "denied" },
  { group: "permissions", id: "perm-cross-ws", prompt: "Show me Talanton's clients.", kind: "denied" },
  { group: "cliFailures", id: "overdue-inv", prompt: "List overdue invoices.", kind: "data", expectCap: "finance.invoices.overdue.read" },
  { group: "cliFailures", id: "crm-pipeline", prompt: "What is our CRM pipeline value?", kind: "data", expectCap: "crm.pipeline.summary.read" },
  { group: "cliFailures", id: "client-count", prompt: "How many clients do we have?", kind: "data", expectCap: "crm.clients.count.read" },
  { group: "cliFailures", id: "project-count", prompt: "How many projects do we have?", kind: "data", expectCap: "project-management.projects.count.read" },
  { group: "isolation", id: "iso-talanton-bank", prompt: "What is the bank balance in Talanton?", kind: "denied" },
];

async function runPrompt(prompt, kind, expectCapabilityId) {
  const res = await fetch(`${DEMO}/api/demo/ea-tests/run-one`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ prompt, kind, expectCapabilityId }),
  });
  const body = await res.json().catch(() => ({}));
  return { http: res.status, body };
}

async function deployReady() {
  const { http, body } = await runPrompt("How many employees do we have?", "data", "hr.employees.count.read");
  if (http === 400 && String(body.error ?? "").includes("questionId")) {
    return { ready: false, reason: "prompt mode not deployed yet" };
  }
  if (http !== 200) return { ready: false, reason: `HTTP ${http}` };
  if (body.capabilityId === "hr.employees.count.read" && /\b25\b/.test(String(body.text ?? ""))) {
    return { ready: true, reason: "headcount=25 on production" };
  }
  if (body.capabilityId === "financials.chart.revenue.read") {
    return { ready: true, reason: "chart capability present" };
  }
  return {
    ready: false,
    reason: `cap=${body.capabilityId} text=${String(body.text ?? "").slice(0, 60)}`,
  };
}

function classify(probe, body, http) {
  const summary = String(body.text ?? body.summary ?? body.error ?? "");
  const routeKind = body.routeKind ?? "";
  const capabilityId = body.capabilityId;
  const blocks = body.responseBlocks ?? [];
  const failed = (body.checks ?? []).filter((c) => !c.passed).map((c) => c.message);

  if (http === 401 || http === 403) return { status: "NOT_TESTABLE", summary: `HTTP ${http}` };
  if (http === 400 && summary.includes("questionId")) return { status: "NOT_TESTABLE", summary };

  if (probe.kind === "denied") {
    const ok =
      body.status === "pass" ||
      (routeKind === "capability_answer" &&
        /can'?t|cannot|don'?t have permission|only access data/i.test(summary));
    return { status: ok ? "PASS" : "FAIL", summary, routeKind, capabilityId, failed };
  }
  if (probe.kind === "clarification") {
    const ok =
      routeKind === "capability_answer" && /which|do you mean|clarify/i.test(summary);
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
  if (probe.expectData && !probe.expectData.test(summary)) {
    return { status: "FAIL", summary, routeKind, capabilityId, failed: ["data mismatch"] };
  }
  if (body.status === "pass") return { status: "PASS", summary: summary.slice(0, 160), routeKind, capabilityId };
  if (failed.length) return { status: "FAIL", summary: summary.slice(0, 160), routeKind, capabilityId, failed };
  return { status: "NOT_TESTABLE", summary, routeKind, capabilityId };
}

async function pollDeploy(maxMs = 600000) {
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
    const { http, body } = await runPrompt(probe.prompt, probe.kind, probe.expectCap);
    const verdict = classify(probe, body, http);
    results.push({ ...probe, http, ...verdict, acceptanceStatus: body.status });
    console.log(JSON.stringify({ id: probe.id, status: verdict.status, cap: verdict.capabilityId ?? body.capabilityId, summary: verdict.summary }));
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    deployCommit: DEPLOY_COMMIT,
    deployFingerprint,
    pass: results.filter((r) => r.status === "PASS").length,
    fail: results.filter((r) => r.status === "FAIL").length,
    notTestable: results.filter((r) => r.status === "NOT_TESTABLE").length,
    results,
  };
  writeFileSync("ea-production-probe-report.json", JSON.stringify(summary, null, 2));
  console.log("\nSUMMARY", summary.pass, "PASS", summary.fail, "FAIL", summary.notTestable, "NOT_TESTABLE");
}

main();
