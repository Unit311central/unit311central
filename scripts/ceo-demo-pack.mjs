/**
 * CEO demo confidence pack — 18 fixed prompts for production EA smoke.
 *
 * Usage:
 *   npm run test:ceo-demo
 *   npm run test:ceo-demo -- https://unit311.vercel.app
 *   npm run test:ceo-demo -- --concurrency=2
 *
 * Requires: .tmp-qa-creds.json
 */
import fs from "node:fs";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const args = process.argv.slice(2);
const baseUrl =
  args.find((a) => a.startsWith("http")) || "https://unit311.vercel.app";
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const outArg = args.find((a) => a.startsWith("--out="));
const concurrency = Math.max(1, Number(concurrencyArg?.split("=")[1] || 2));

const credsPath = path.join(root, ".tmp-qa-creds.json");
const reportPath = outArg
  ? path.isAbsolute(outArg.split("=")[1])
    ? outArg.split("=")[1]
    : path.join(root, outArg.split("=")[1])
  : path.join(root, ".tmp-ceo-demo-pack-report.json");

if (!fs.existsSync(credsPath)) {
  console.error(`Missing ${credsPath}`);
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));

/** @typedef {"business"|"write"|"capability"|"document"} DemoDomain */

/**
 * @type {{ id: string, prompt: string, domain: DemoDomain, expect?: RegExp[], forbid?: RegExp[], maxChars?: number }[]}
 */
const SCENARIOS = [
  {
    id: "brief",
    prompt: "Give me today's executive brief — what needs attention?",
    domain: "business",
    expect: [/brief|attention|priority|today|urgent|summary/i],
  },
  {
    id: "cash",
    prompt: "What is our cash position right now?",
    domain: "business",
    expect: [/cash|balance|treasury|bank|£|\$|€|position/i],
  },
  {
    id: "clients-at-risk",
    prompt: "Which clients are at risk or need attention?",
    domain: "business",
    expect: [/client|risk|attention|dormant|overdue|at risk/i],
  },
  {
    id: "pipeline",
    prompt: "Summarise CRM pipeline value and open leads.",
    domain: "business",
    expect: [/pipeline|lead|crm|deal|stage|prospect/i],
  },
  {
    id: "ar-ap",
    prompt: "What do we owe and what's overdue from clients?",
    domain: "business",
    expect: [/overdue|receivable|payable|invoice|owed|AR|AP|creditor|debtor/i],
  },
  {
    id: "live-projects",
    prompt: "List live projects and progress.",
    domain: "business",
    expect: [/project|live|progress|phase/i],
  },
  {
    id: "scoped-pdf",
    prompt:
      "Create me a PDF with cash, payroll burn, CRM pipeline, and clients at risk for this month.",
    domain: "document",
    expect: [/pdf|report|download|generated|artifact|document/i],
  },
  {
    id: "typo-pdf",
    prompt: "Make a PDF of cash and pipelin value please",
    domain: "document",
    expect: [/pdf|pipeline|report|download|generated|artifact/i],
  },
  {
    id: "capabilities",
    prompt: "What write actions can you take for CRM, calendar, clients, and projects?",
    domain: "capability",
    expect: [/crm|calendar|client|project|action|schedule|convert|close|activate/i],
  },
  {
    id: "create-client",
    prompt: "Create a new client called Demo Coastal Survey Ltd in Catalonia, Spain.",
    domain: "write",
    expect: [/client|create|confirm|approve|preview|Demo Coastal/i],
  },
  {
    id: "create-project",
    prompt: "Create a project called Harbour LiDAR Phase 2 for Peak Infrastructure.",
    domain: "write",
    expect: [/project|create|confirm|approve|preview|Harbour|LiDAR/i],
  },
  {
    id: "crm-stage",
    prompt: "Move the Peak Infrastructure CRM lead to Qualified.",
    domain: "write",
    expect: [/lead|crm|qualified|status|confirm|approve|preview|stage/i],
  },
  {
    id: "convert-lead",
    prompt: "Convert the Harbour Mapping CRM lead into a client.",
    domain: "write",
    expect: [/convert|lead|client|confirm|approve|preview|promote/i],
  },
  {
    id: "activate-client",
    prompt: "Activate Peak Infrastructure as an active client.",
    domain: "write",
    expect: [/activate|active|client|confirm|approve|preview/i],
  },
  {
    id: "schedule-meeting",
    prompt:
      "Schedule a discovery meeting titled Peak Demo for Peak Infrastructure next Tuesday at 10:00.",
    domain: "write",
    expect: [/schedule|meeting|calendar|confirm|approve|preview|demo/i],
  },
  {
    id: "close-project",
    prompt: "Close the completed intranet redesign project.",
    domain: "write",
    expect: [/close|project|complete|confirm|approve|preview|not found|no project/i],
  },
  {
    id: "unsupported-write",
    prompt: "Wire £50,000 from our main account to a supplier in Dubai tonight.",
    domain: "write",
    expect: [/don't have a registered|no registered|not registered|unable|can't|cannot/i],
    forbid: [/wired|transfer complete|payment sent/i],
  },
  {
    id: "find-overdue-invoices",
    prompt: "Find overdue invoices over £5,000.",
    domain: "business",
    expect: [/invoice|overdue|£|no overdue|none|found/i],
  },
];

function request(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          ...headers,
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () =>
          resolve({
            status: res.statusCode,
            body: data,
            setCookie: res.headers["set-cookie"] || [],
          }),
        );
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function parseSse(text) {
  const events = [];
  for (const chunk of text.split("\n\n")) {
    const line = chunk
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l.startsWith("data:"));
    if (!line) continue;
    const payload = line.slice(5).trim();
    if (!payload || payload === "[DONE]") continue;
    try {
      events.push(JSON.parse(payload));
    } catch {
      // ignore
    }
  }
  return events;
}

async function login() {
  const res = await request(`${baseUrl}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({
      username: creds.username,
      password: creds.password,
    }),
  });
  if (res.status !== 200) {
    throw new Error(`login ${res.status}: ${res.body.slice(0, 300)}`);
  }
  const cookie = (res.setCookie || [])
    .map((c) => c.split(";")[0])
    .filter(Boolean)
    .join("; ");
  if (!cookie) throw new Error("login missing Set-Cookie");
  return cookie;
}

async function chat(cookie, message, attempt = 1) {
  const res = await request(`${baseUrl}/api/executive-assistant/chat`, {
    method: "POST",
    headers: { Cookie: cookie, Accept: "text/event-stream" },
    body: JSON.stringify({
      message,
      messages: [],
      activeView: "executive-assistant",
      stream: true,
    }),
  });
  const looksHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(res.body || "");
  if ((res.status !== 200 || looksHtml) && attempt < 3) {
    await new Promise((r) => setTimeout(r, 800 * attempt));
    return chat(cookie, message, attempt + 1);
  }
  if (res.status !== 200) {
    throw new Error(`chat ${res.status}: ${res.body.slice(0, 400)}`);
  }
  if (looksHtml) {
    throw new Error(`chat returned HTML instead of SSE: ${res.body.slice(0, 120)}`);
  }
  const events = parseSse(res.body);
  const done = events.find((e) => e.type === "done");
  const tools = events.filter((e) => e.type === "tool_call").map((e) => e.name);
  const error = events.find((e) => e.type === "error");
  if (error) throw new Error(error.error || "stream error");
  if (!done) throw new Error("missing done event");
  return {
    content: done.message?.content || "",
    tools,
    executionCards: done.message?.executionCards || [],
  };
}

function observedDomain(result) {
  const content = String(result.content || "");
  if (
    result.tools.includes("proposeBusinessActionPlan") ||
    result.tools.includes("planBusinessGoal") ||
    result.executionCards.some((c) =>
      ["creation_form", "workflow", "approval", "confirmation"].includes(c.kind),
    )
  ) {
    return "write";
  }
  if (
    result.tools.some((t) =>
      ["generateScopedBusinessPdf", "generateBusinessPdf", "createDocument"].includes(t),
    ) ||
    /pdf|download|artifact|\.pdf/i.test(content)
  ) {
    return "document";
  }
  if (
    /Action Registry|executable business capabilities|registered (write )?action|I can create|I don't have a registered/i.test(
      content,
    )
  ) {
    return "capability";
  }
  return "business";
}

function evaluate(scenario, result) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const checks = [];
  const content = String(result.content || "");

  if (!content.trim()) failures.push("empty_response");
  if (/^Done\.?\s*$/i.test(content.trim())) failures.push("bare_done");
  if (content.length > (scenario.maxChars || 4500)) {
    failures.push(`too_long:${content.length}`);
  }

  for (const re of scenario.forbid || []) {
    if (re.test(content)) failures.push(`forbidden:${re}`);
  }

  const domain = observedDomain(result);
  checks.push(`domain:${domain}`);

  const honestUnsupported =
    /don't have a registered|no registered|not registered|unable to proceed|I can't|I cannot/i.test(
      content,
    );

  if (scenario.domain === "write") {
    if (domain === "write") checks.push("write_plan");
    else if (honestUnsupported || domain === "capability") {
      checks.push("unsupported_write_honest");
    } else {
      failures.push(`domain_expected_write_got_${domain}`);
    }
  } else if (scenario.domain === "document") {
    if (domain === "document" || /pdf|report|download|artifact/i.test(content)) {
      checks.push("document_ok");
    } else if (domain === "write") {
      failures.push("document_stolen_by_write");
    } else {
      failures.push(`domain_expected_document_got_${domain}`);
    }
  } else if (scenario.domain === "capability") {
    if (domain === "write") failures.push("capability_became_write");
    else checks.push("capability_ok");
  } else if (scenario.domain === "business") {
    if (domain === "write") failures.push("business_became_write");
    else if (domain === "document") checks.push("business_via_document");
    else checks.push("business_ok");
  }

  const expect = scenario.expect || [];
  if (expect.length > 0 && !expect.some((re) => re.test(content))) {
    // For write plans, tools/cards can satisfy without matching text.
    if (
      scenario.domain === "write" &&
      (result.tools.length > 0 || result.executionCards.length > 0)
    ) {
      checks.push("write_signal_without_expect_text");
    } else {
      failures.push("expect_mismatch");
    }
  } else if (expect.length > 0) {
    checks.push("expect_ok");
  }

  return { ok: failures.length === 0, failures, checks, domain };
}

async function mapPool(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => worker()));
  return results;
}

async function main() {
  console.log(`CEO demo pack → ${baseUrl}`);
  console.log(`Scenarios: ${SCENARIOS.length} (concurrency=${concurrency})`);
  const cookie = await login();
  console.log("Logged in.");

  const rows = await mapPool(SCENARIOS, concurrency, async (scenario) => {
    const started = Date.now();
    try {
      const result = await chat(cookie, scenario.prompt);
      const verdict = evaluate(scenario, result);
      const row = {
        id: scenario.id,
        prompt: scenario.prompt,
        expectedDomain: scenario.domain,
        ok: verdict.ok,
        failures: verdict.failures,
        checks: verdict.checks,
        domain: verdict.domain,
        tools: result.tools,
        cards: result.executionCards.map((c) => c.kind),
        ms: Date.now() - started,
        contentPreview: String(result.content || "").slice(0, 280),
      };
      const mark = verdict.ok ? "PASS" : "FAIL";
      console.log(`${mark}  ${scenario.id.padEnd(22)} ${verdict.failures.join(", ") || verdict.checks.join("|")}`);
      return row;
    } catch (err) {
      const row = {
        id: scenario.id,
        prompt: scenario.prompt,
        expectedDomain: scenario.domain,
        ok: false,
        failures: [`error:${err instanceof Error ? err.message : String(err)}`],
        checks: [],
        domain: "error",
        tools: [],
        cards: [],
        ms: Date.now() - started,
        contentPreview: "",
      };
      console.log(`FAIL  ${scenario.id.padEnd(22)} ${row.failures[0]}`);
      return row;
    }
  });

  const passed = rows.filter((r) => r.ok).length;
  const failed = rows.length - passed;
  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    total: rows.length,
    passed,
    failed,
    passRate: `${((passed / rows.length) * 100).toFixed(1)}%`,
    rows,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n${passed}/${rows.length} passed (${report.passRate})`);
  console.log(`Report: ${reportPath}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
