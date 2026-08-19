/**
 * Production EA acceptance probes — polls until deploy fingerprint, then tests live APIs.
 * Run: node scripts/run-production-ea-probes.mjs
 */
import { writeFileSync } from "node:fs";

const DEPLOY_COMMIT = "b0125a3";
const HOSTS = {
  demo: "https://demo.unit311central.com",
  onwardair: "https://onwardair.unit311central.com",
  abhi: "https://abhi.unit311central.com",
  talanton: "https://talantonimpact.unit311central.com",
};

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
  { group: "permissions", id: "perm-sales", prompt: "Show me everyone's commissions.", kind: "denied", permissionProfile: "sales_rep" },
  { group: "permissions", id: "perm-employee-cash", prompt: "Show me company cash balance.", kind: "denied", permissionProfile: "employee" },
  { group: "permissions", id: "perm-cross-ws", prompt: "Show me Talanton's clients.", kind: "denied" },
  { group: "cliFailures", id: "overdue-inv", prompt: "List overdue invoices.", kind: "data", expectCap: "finance.invoices.overdue.read" },
  { group: "cliFailures", id: "crm-pipeline", prompt: "What is our CRM pipeline value?", kind: "data", expectCap: "crm.pipeline.summary.read" },
  { group: "cliFailures", id: "client-count", prompt: "How many clients do we have?", kind: "data", expectCap: "crm.clients.count.read" },
  { group: "cliFailures", id: "project-count", prompt: "How many projects do we have?", kind: "data", expectCap: "project-management.projects.count.read" },
];

async function fetchText(url) {
  const res = await fetch(url, { redirect: "follow" });
  return { status: res.status, text: await res.text(), headers: res.headers };
}

async function deployFingerprintReady() {
  const probeRes = await fetch(`${HOSTS.demo}/api/demo/ea-tests/probe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ prompt: "headcount", kind: "data" }),
  });
  if (probeRes.status !== 404) {
    const body = await probeRes.json().catch(() => ({}));
    if (body.capabilityId === "hr.employees.count.read" && /\b25\b/.test(String(body.text ?? ""))) {
      return { ready: true, reason: "probe API headcount=25" };
    }
    if (body.capabilityId === "hr.employees.count.read") {
      return { ready: false, reason: `probe live but headcount=${String(body.text ?? "").slice(0, 60)}` };
    }
    return { ready: true, reason: "probe API available" };
  }

async function pollDeploy(maxMs = 480000) {
  const start = Date.now();
  let attempt = 0;
  while (Date.now() - start < maxMs) {
    attempt += 1;
    const fp = await deployFingerprintReady();
    console.log(`[poll ${attempt}] deploy fingerprint:`, fp);
    if (fp.ready) return fp;
    await new Promise((r) => setTimeout(r, 20000));
  }
  throw new Error("Deploy fingerprint not confirmed within timeout");
}

async function runProbeOnHost(baseUrl, probe) {
  try {
    const res = await fetch(`${baseUrl}/api/demo/ea-tests/probe`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        prompt: probe.prompt,
        kind: probe.kind,
        expectCapabilityId: probe.expectCap,
        permissionProfile: probe.permissionProfile,
      }),
    });
    if (res.status === 404) {
      return { id: probe.id, status: "NOT_TESTABLE", summary: "probe API not deployed", http: 404 };
    }
    const body = await res.json();
    return classifyProbe(probe, body, res.status);
  } catch (error) {
    return { id: probe.id, status: "NOT_TESTABLE", summary: String(error) };
  }
}

function classifyProbe(probe, body, http) {
  const summary = String(body.text ?? body.summary ?? body.error ?? "");
  const checks = Array.isArray(body.checks) ? body.checks : [];
  const failed = checks.filter((c) => !c.passed).map((c) => c.message);
  const routeKind = body.routeKind ?? "";
  const capabilityId = body.capabilityId;
  const blocks = body.responseBlocks ?? [];

  if (http === 401 || http === 403) {
    return { id: probe.id, status: "NOT_TESTABLE", summary: `HTTP ${http}`, routeKind, capabilityId };
  }

  if (probe.kind === "denied") {
    const ok =
      (routeKind === "capability_answer" &&
        /can'?t|cannot|don'?t have permission|only access data for your current workspace/i.test(
          summary,
        )) ||
      body.status === "pass";
    return { id: probe.id, status: ok ? "PASS" : "FAIL", summary, routeKind, capabilityId, failed };
  }

  if (probe.kind === "clarification") {
    const ok =
      routeKind === "capability_answer" &&
      /which|do you mean|clarify/i.test(summary);
    return { id: probe.id, status: ok ? "PASS" : "FAIL", summary, routeKind, capabilityId, failed };
  }

  if (probe.notClarify && /which|do you mean|clarify/i.test(summary)) {
    return { id: probe.id, status: "FAIL", summary, routeKind, capabilityId, failed: ["unnecessary clarification"] };
  }

  if (probe.expectRoute && routeKind !== probe.expectRoute) {
    return {
      id: probe.id,
      status: "FAIL",
      summary,
      routeKind,
      capabilityId,
      failed: [`expected route ${probe.expectRoute}, got ${routeKind}`],
    };
  }

  if (probe.expectCap && capabilityId !== probe.expectCap) {
    return {
      id: probe.id,
      status: "FAIL",
      summary,
      routeKind,
      capabilityId,
      failed: [`expected cap ${probe.expectCap}, got ${capabilityId}`],
    };
  }

  if (probe.kind === "chart") {
    const hasChart = blocks.some((b) =>
      ["line_chart", "bar_chart", "pie_chart"].includes(b.type),
    );
    if (!hasChart) {
      return { id: probe.id, status: "FAIL", summary, routeKind, capabilityId, failed: ["no chart block"] };
    }
  }

  if (probe.expectPdf && !probe.expectPdf.test(summary)) {
    return { id: probe.id, status: "FAIL", summary: summary.slice(0, 200), routeKind, capabilityId, failed: ["PDF content check failed"] };
  }

  if (probe.expectData && !probe.expectData.test(summary)) {
    return { id: probe.id, status: "FAIL", summary, routeKind, capabilityId, failed: ["data pattern mismatch"] };
  }

  if (body.status === "pass" || (failed.length === 0 && routeKind !== "none")) {
    return { id: probe.id, status: "PASS", summary: summary.slice(0, 160), routeKind, capabilityId };
  }

  return {
    id: probe.id,
    status: failed.length ? "FAIL" : "NOT_TESTABLE",
    summary: summary.slice(0, 160),
    routeKind,
    capabilityId,
    failed,
  };
}

async function runBankProbe(baseUrl, questionId) {
  const res = await fetch(`${baseUrl}/api/demo/ea-tests/run-one`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ questionId }),
  });
  const body = await res.json();
  return { http: res.status, body };
}

async function main() {
  console.log("Waiting for production deploy fingerprint…");
  let deployInfo;
  try {
    deployInfo = await pollDeploy();
  } catch (error) {
    console.error("Deploy poll failed:", error.message);
    deployInfo = { ready: false, reason: "timeout" };
  }

  const results = [];
  let probeApiAvailable = false;

  for (const probe of PROBES) {
    const result = await runProbeOnHost(HOSTS.demo, probe);
    if (result.http !== 404) probeApiAvailable = true;
    results.push({ ...probe, ...result, host: "demo" });
    console.log(JSON.stringify({ probe: probe.id, status: result.status, cap: result.capabilityId, summary: result.summary }));
  }

  if (!probeApiAvailable) {
    console.log("\nProbe API missing — falling back to run-one bank probes + local acceptance for deploy commit", DEPLOY_COMMIT);
    const fallbacks = [
      { id: "financials-composite-1", label: "cash position" },
      { id: "human-resources-composite-0", label: "staff growth chart" },
      { id: "financials-module-6", label: "financials PDF" },
    ];
    for (const fb of fallbacks) {
      const { http, body } = await runBankProbe(HOSTS.demo, fb.id);
      results.push({
        group: "fallback",
        id: fb.id,
        status: body.status === "pass" ? "PASS" : http === 200 ? "FAIL" : "NOT_TESTABLE",
        summary: body.summary ?? body.error,
        capabilityId: body.capabilityId,
        http,
        host: "demo",
      });
      console.log("fallback", fb.id, body.status, body.capabilityId, (body.summary ?? "").slice(0, 80));
    }
  }

  const isolation = [
    { host: "demo", prompt: "What is the bank balance in Talanton?", kind: "denied" },
    { host: "abhi", prompt: "How many members do we have?", kind: "data", expectCap: "abhi.members.count.read" },
  ];

  for (const iso of isolation) {
    if (!probeApiAvailable) break;
    const base = HOSTS[iso.host];
    const result = await runProbeOnHost(base, iso);
    results.push({ group: "isolation", host: iso.host, ...iso, ...result });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    deployCommit: DEPLOY_COMMIT,
    deployFingerprint: deployInfo,
    probeApiAvailable,
    results,
  };
  writeFileSync("ea-production-probe-report.json", JSON.stringify(report, null, 2));
  console.log("\nWrote ea-production-probe-report.json");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
