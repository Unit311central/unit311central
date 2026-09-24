/**
 * Demo EA final production verification harness.
 * Run: node scripts/demo-ea-production-verification.mjs [baseUrl]
 */
import fs from "node:fs";
import https from "node:https";
import { URL } from "node:url";

const BASE = (process.argv[2] ?? process.env.DEMO_EA_VERIFY_ORIGIN ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const OUT = "/opt/cursor/artifacts/demo-ea-production-verification-report.json";

function request(url, { method = "GET", headers = {}, body, timeoutMs = 180000 } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          Accept: "application/json",
          ...headers,
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
        timeout: timeoutMs,
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: data,
            headers: res.headers,
            setCookie: res.headers["set-cookie"] || [],
          }),
        );
      },
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error(`timeout ${url}`)));
    if (body) req.write(body);
    req.end();
  });
}

function parseJson(res) {
  try {
    return JSON.parse(res.body);
  } catch {
    return { raw: res.body.slice(0, 500) };
  }
}

async function login() {
  const res = await request(`${BASE}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ username: USERNAME, password: PASSWORD }),
  });
  if (res.status !== 200) {
    throw new Error(`Login failed HTTP ${res.status}: ${res.body.slice(0, 200)}`);
  }
  const cookie = res.setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!cookie) throw new Error("Login succeeded but no session cookie");
  return cookie;
}

async function runOne(prompt, kind = "data", extra = {}) {
  const res = await request(`${BASE}/api/demo/ea-tests/run-one`, {
    method: "POST",
    headers: extra.cookie ? { Cookie: extra.cookie } : {},
    body: JSON.stringify({ prompt, kind, executeTools: true, ...extra.body }),
  });
  return { http: res.status, body: parseJson(res) };
}

async function eaChat(message, cookie, messages = []) {
  const res = await request(`${BASE}/api/executive-assistant/chat`, {
    method: "POST",
    headers: { Cookie: cookie },
    body: JSON.stringify({ message, messages, stream: false, activeView: "executive-assistant" }),
    timeoutMs: 300000,
  });
  return { http: res.status, body: parseJson(res) };
}

async function listClients(cookie) {
  const res = await request(`${BASE}/api/clients`, { headers: { Cookie: cookie } });
  return { http: res.status, body: parseJson(res) };
}

async function deleteClient(cookie, id) {
  const res = await request(`${BASE}/api/clients/${id}`, { method: "DELETE", headers: { Cookie: cookie } });
  return { http: res.status, body: res.body.slice(0, 200) };
}

function summarize(body) {
  return String(body.text ?? body.summary ?? body.reply ?? body.error ?? "").slice(0, 1200);
}

function hasChart(blocks) {
  return (blocks ?? []).some((b) => /chart/i.test(String(b.type ?? "")));
}

function scoreExecutive(text) {
  const t = String(text ?? "");
  const issues = [];
  if (t.length < 120) issues.push("too thin");
  if (!/[£$€]|\b\d/.test(t)) issues.push("no numbers");
  if (!/recommend|should|prioriti[sz]|concern|attention|worried|focus/i.test(t)) issues.push("no recommendation language");
  if (/intelligence posture|searchApplications/i.test(t)) issues.push("wrong route copy");
  return { ok: issues.length === 0, issues };
}

async function verifyActions(cookie) {
  const steps = [
    { prompt: "Create a new client called Acme Corp.", expect: /created|added|Acme Corp/i },
    { prompt: "Change Acme Corp's account manager to Chris Okafor.", expect: /account manager|Chris|updated|assigned/i },
    { prompt: "Archive Acme Corp.", expect: /archiv/i },
    { prompt: "Restore Acme Corp.", expect: /restor|dormant/i },
  ];
  const results = [];
  for (const step of steps) {
    const chat = await eaChat(step.prompt, cookie);
    const text = summarize(chat.body);
    const clients = await listClients(cookie);
    const clientList = clients.body.clients ?? clients.body.items ?? [];
    const acme = clientList.find((c) => /acme corp/i.test(String(c.companyName ?? c.company_name ?? "")));
    results.push({
      prompt: step.prompt,
      http: chat.http,
      text,
      acmeFound: Boolean(acme),
      acmeStatus: acme?.accountStatus ?? acme?.account_status ?? null,
      acmeManager: acme?.accountManager ?? acme?.account_manager ?? null,
      pass: chat.http === 200 && step.expect.test(text),
    });
  }
  return results;
}

async function cleanupAcme(cookie) {
  const clients = await listClients(cookie);
  const clientList = clients.body.clients ?? clients.body.items ?? [];
  const targets = clientList.filter((c) => /acme corp/i.test(String(c.companyName ?? c.company_name ?? "")));
  const deleted = [];
  for (const c of targets) {
    deleted.push({ id: c.id, ...(await deleteClient(cookie, c.id)) });
  }
  return deleted;
}

async function verifyBoardPdf(cookie) {
  const chat = await eaChat("Create a board deck for tomorrow as a PDF.", cookie);
  const text = summarize(chat.body);
  const artifactUrl =
    chat.body.artifacts?.[0]?.openUrl ??
    chat.body.artifacts?.[0]?.downloadUrl ??
    (text.match(/\/api\/executive-assistant\/artifacts\/[^\s"']+/) ?? [])[0];
  let pdf = { fetched: false, bytes: 0, checks: [] };
  if (artifactUrl) {
    const url = artifactUrl.startsWith("http") ? artifactUrl : `${BASE}${artifactUrl}`;
    const res = await request(url, { headers: { Cookie: cookie } });
    const buf = Buffer.from(res.body, "binary");
    pdf = {
      fetched: res.status === 200,
      bytes: buf.length,
      http: res.status,
      checks: {
        opens: res.status === 200 && buf.length > 1000,
        hasPdfHeader: buf.slice(0, 5).toString("latin1").startsWith("%PDF"),
        hasExecutiveSummary: /Executive Summary/i.test(buf.toString("latin1")),
        hasRiskRegister: /Risk Register/i.test(buf.toString("latin1")),
        hasFinancials: /revenue|cash|£/i.test(buf.toString("latin1")),
        notEmpty: buf.length > 50000,
      },
    };
    if (pdf.checks.opens && pdf.checks.hasPdfHeader) {
      fs.writeFileSync("/opt/cursor/artifacts/demo-ea-board-deck-production.pdf", buf);
    }
  }
  return { chat: { http: chat.http, text }, artifactUrl, pdf };
}

async function verifyConversation(cookie) {
  const turns = [
    "How are sales doing?",
    "Who is behind target?",
    "What about their pipeline?",
    "Which one should I be most concerned about?",
    "Tell me more about that one.",
    "What should we do?",
  ];
  const messages = [];
  const results = [];
  for (const prompt of turns) {
    const chat = await eaChat(prompt, cookie, messages);
    const reply = summarize(chat.body);
    messages.push({ role: "user", content: prompt, id: `u${messages.length}`, createdAt: new Date().toISOString() });
    messages.push({
      role: "assistant",
      content: reply,
      id: `a${messages.length}`,
      createdAt: new Date().toISOString(),
    });
    const contextual =
      results.length === 0 ||
      /\b(them|their|that one|pipeline|behind|concern|recommend|should|alex|priya|chris|morgan|shah|okafor|target)\b/i.test(
        reply,
      );
    results.push({ prompt, http: chat.http, reply: reply.slice(0, 600), contextual });
  }
  return results;
}

async function main() {
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    username: USERNAME,
    sections: {},
  };

  let cookie = null;
  try {
    cookie = await login();
    report.login = { pass: true };
  } catch (error) {
    report.login = { pass: false, error: error.message };
  }

  const unauthProbe = await runOne("How are sales doing?", "data");
  report.deployProbe = {
    http: unauthProbe.http,
    routeKind: unauthProbe.body.routeKind,
    tool: unauthProbe.body.tool,
    capabilityId: unauthProbe.body.capabilityId,
    text: summarize(unauthProbe.body).slice(0, 300),
    phase3SalesFixLive: unauthProbe.body.tool === "northstar.queryModule" && !/searchApplications/i.test(summarize(unauthProbe.body)),
  };

  if (cookie) {
    report.sections.actions = await verifyActions(cookie);
    report.sections.cleanup = await cleanupAcme(cookie);

    const gptPrompts = [
      "Given our recent financial and sales performance, what should management be most concerned about?",
      "Explain the likely business implications of our current sales position.",
      "Based on the available evidence, what should management prioritise?",
    ];
    report.sections.gptTerra = [];
    for (const prompt of gptPrompts) {
      const chat = await eaChat(prompt, cookie);
      const text = summarize(chat.body);
      report.sections.gptTerra.push({
        prompt,
        http: chat.http,
        text: text.slice(0, 1200),
        grounded: /£|pipeline|cash|revenue|headcount|target|risk|demo|northstar/i.test(text),
        pass: chat.http === 200 && text.length > 120,
      });
    }

    report.sections.boardPdf = await verifyBoardPdf(cookie);
    report.sections.conversation = await verifyConversation(cookie);

    const executivePrompts = [
      "Review our financial performance over the last six months and tell me what has changed and what management should be concerned about.",
      "Give me an executive sales review.",
      "What has materially changed in the business?",
      "What should I prioritise?",
      "What should I be worried about?",
      "Give me a management summary of anything that needs my attention.",
    ];
    report.sections.executive = [];
    for (const prompt of executivePrompts) {
      const chat = await eaChat(prompt, cookie);
      const text = summarize(chat.body);
      report.sections.executive.push({ prompt, http: chat.http, text: text.slice(0, 1200), ...scoreExecutive(text) });
    }

    const crossPrompts = [
      "Which sales opportunities are important enough to affect our forecast?",
      "Which clients have significant commercial value and unresolved issues?",
      "Which projects are most at risk and what is their financial impact?",
      "Which employees are working on projects that are behind schedule?",
      "Which risks should management prioritise?",
    ];
    report.sections.crossModule = [];
    for (const prompt of crossPrompts) {
      const chat = await eaChat(prompt, cookie);
      const text = summarize(chat.body);
      report.sections.crossModule.push({
        prompt,
        http: chat.http,
        text: text.slice(0, 1200),
        multiSource: /client|project|employee|risk|pipeline|invoice|ticket|£/i.test(text),
        pass: chat.http === 200 && text.length > 100,
      });
    }

    const chartPrompts = [
      ["Graph revenue for the last six months.", "chart"],
      ["Show revenue versus expenses.", "chart"],
      ["Give me a pie chart of expenses.", "chart"],
      ["Show actual versus target.", "chart"],
      ["Graph sales performance.", "chart"],
    ];
    report.sections.charts = [];
    for (const [prompt, kind] of chartPrompts) {
      const probe = await runOne(prompt, kind, { cookie });
      report.sections.charts.push({
        prompt,
        http: probe.http,
        routeKind: probe.body.routeKind,
        tool: probe.body.tool,
        capabilityId: probe.body.capabilityId,
        text: summarize(probe.body).slice(0, 400),
        hasChart: hasChart(probe.body.responseBlocks),
        pass: probe.http === 200 && hasChart(probe.body.responseBlocks),
      });
    }

    const missingPrompts = [
      "What is our revenue from the Antarctica division last quarter?",
      "Who is our CEO in Tokyo?",
    ];
    report.sections.hallucination = [];
    for (const prompt of missingPrompts) {
      const probe = await runOne(prompt, "data", { cookie });
      const text = summarize(probe.body);
      report.sections.hallucination.push({
        prompt,
        http: probe.http,
        routeKind: probe.body.routeKind,
        tool: probe.body.tool,
        text: text.slice(0, 400),
        honest:
          /cannot find|couldn't find|don'?t have|not available|no record|unable to find|insufficient|no .+ in the demo|no data for/i.test(
            text,
          ),
      });
    }
  }

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ out: OUT, login: report.login, deployProbe: report.deployProbe }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
