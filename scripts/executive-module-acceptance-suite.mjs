/**
 * Full-module Executive Acceptance Suite
 *
 * Runs every catalog prompt (10 per nav subsection) against production EA chat.
 *
 * Usage:
 *   node scripts/executive-module-acceptance-suite.mjs
 *   node scripts/executive-module-acceptance-suite.mjs --limit=40
 *   node scripts/executive-module-acceptance-suite.mjs --module=Financials
 *   node scripts/executive-module-acceptance-suite.mjs --concurrency=3
 *   node scripts/executive-module-acceptance-suite.mjs --ids-file=.tmp-rerun-ids.json
 *   node scripts/executive-module-acceptance-suite.mjs https://unit311.vercel.app
 *
 * Requires: .tmp-qa-creds.json + docs/executive-module-prompt-catalog.json
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
const limitArg = args.find((a) => a.startsWith("--limit="));
const moduleArg = args.find((a) => a.startsWith("--module="));
const idsFileArg = args.find((a) => a.startsWith("--ids-file="));
const outArg = args.find((a) => a.startsWith("--out="));
const concurrencyArg = args.find((a) => a.startsWith("--concurrency="));
const limit = limitArg ? Number(limitArg.split("=")[1]) : Infinity;
const moduleFilter = moduleArg ? moduleArg.split("=")[1] : null;
const idsFile = idsFileArg ? idsFileArg.split("=")[1] : null;
const concurrency = Math.max(1, Number(concurrencyArg?.split("=")[1] || 2));

const credsPath = path.join(root, ".tmp-qa-creds.json");
const catalogPath = path.join(root, "docs", "executive-module-prompt-catalog.json");
const reportPath = outArg
  ? path.isAbsolute(outArg.split("=")[1])
    ? outArg.split("=")[1]
    : path.join(root, outArg.split("=")[1])
  : path.join(root, ".tmp-executive-module-acceptance-report.json");

if (!fs.existsSync(credsPath)) {
  console.error(`Missing ${credsPath}`);
  process.exit(1);
}
if (!fs.existsSync(catalogPath)) {
  console.error(`Missing ${catalogPath}. Run: node scripts/generate-executive-module-prompt-catalog.mjs`);
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(credsPath, "utf8"));
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));

/** @type {any[]} */
let scenarios = catalog.scenarios || [];
if (idsFile) {
  const idsPath = path.isAbsolute(idsFile) ? idsFile : path.join(root, idsFile);
  const raw = JSON.parse(fs.readFileSync(idsPath, "utf8"));
  const idList = Array.isArray(raw) ? raw : raw.ids || [];
  const want = new Set(idList.map(String));
  scenarios = scenarios.filter((s) => want.has(String(s.id)));
}
if (moduleFilter) {
  const needle = moduleFilter.toLowerCase();
  scenarios = scenarios.filter(
    (s) =>
      String(s.module).toLowerCase().includes(needle) ||
      String(s.category).toLowerCase().includes(needle) ||
      String(s.id).toLowerCase().includes(needle),
  );
}
if (Number.isFinite(limit)) scenarios = scenarios.slice(0, limit);

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

async function chat(cookie, message, activeView, attempt = 1) {
  const res = await request(`${baseUrl}/api/executive-assistant/chat`, {
    method: "POST",
    headers: { Cookie: cookie, Accept: "text/event-stream" },
    body: JSON.stringify({
      message,
      messages: [],
      activeView: activeView || "executive-assistant",
      stream: true,
    }),
  });
  const looksHtml = /^\s*<!DOCTYPE|^\s*<html/i.test(res.body || "");
  if ((res.status !== 200 || looksHtml) && attempt < 3) {
    await new Promise((r) => setTimeout(r, 800 * attempt));
    return chat(cookie, message, activeView, attempt + 1);
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
    followUpActions: done.message?.followUpActions || [],
  };
}

function observedDomain(result, scenario) {
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
    result.tools.some((t) => ["listPlatformModules", "searchApplications"].includes(t)) ||
    /Unit311 Central platform modules:|From the Application Catalogue \(platform structure/i.test(
      content,
    )
  ) {
    return "platform";
  }
  if (
    result.tools.some((t) => ["listBusinessActions", "searchCapabilities"].includes(t)) ||
    /Action Registry|executable business capabilities|registered (write )?action|registered capability|I can create|Registered business objects|Registered executable writes/i.test(
      content,
    )
  ) {
    return "capability";
  }
  if (result.tools.length > 0) return "business";
  if (scenario.domain === "write" && result.executionCards.length) return "write";
  if (scenario.domain === "platform" && /open|go to|navigate|view=/i.test(content)) {
    return "platform";
  }
  if (
    scenario.domain === "capability" &&
    /i can|you can ask|help you|capabilities|registered/i.test(content)
  ) {
    return "capability";
  }
  return "unknown";
}

function isTopical(scenario, result) {
  const content = String(result.content || "");
  if (!content.trim()) return false;
  if (result.tools.length > 0 || result.executionCards.length > 0) return true;

  // Capability catalogue answers are topical even when they omit the module noun.
  if (
    /Action Registry|executable business capabilities|registered (write )?action|Registered business objects|I can create|I don't have a registered/i.test(
      content,
    )
  ) {
    return true;
  }

  const hay = `${scenario.subsection} ${scenario.module} ${scenario.prompt}`.toLowerCase();
  const stop = new Set([
    "about",
    "there",
    "their",
    "which",
    "where",
    "what",
    "with",
    "from",
    "have",
    "this",
    "that",
    "your",
    "ours",
    "show",
    "list",
    "give",
    "tell",
    "help",
    "please",
    "would",
    "could",
    "should",
    "management",
    "central",
    "business",
    "information",
  ]);
  const tokens = hay
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 3 && !stop.has(t))
    .slice(0, 12);
  const lower = content.toLowerCase();
  if (tokens.some((t) => lower.includes(t))) return true;

  // Substantive non-empty answers for sparse modules still count.
  return content.trim().length >= 80;
}

function evaluate(scenario, result) {
  /** @type {string[]} */
  const failures = [];
  /** @type {string[]} */
  const checks = [];

  const content = String(result.content || "");
  if (!content.trim()) failures.push("empty_response");
  if (/^Done\.?\s*$/i.test(content.trim())) failures.push("bare_done");
  if (content.length > (scenario.maxChars || 3500)) {
    failures.push(`too_long:${content.length}`);
  }

  for (const forbidden of scenario.contentNone || []) {
    const re = typeof forbidden === "string" ? new RegExp(forbidden, "i") : forbidden;
    if (re.test(content)) failures.push(`content_forbidden:${re}`);
  }

  const domain = observedDomain(result, scenario);
  checks.push(`domain:${domain}`);

  const honestUnsupportedWrite =
    /don't have a registered write action|do not currently have a registered capability|No registered Action Registry capabilities/i.test(
      content,
    );

  if (scenario.domain === "write") {
    if (domain === "write") {
      checks.push("write_plan");
    } else if (honestUnsupportedWrite || domain === "capability") {
      // Correct CEO behaviour when no write action is registered yet.
      checks.push("unsupported_write_honest");
    } else {
      failures.push(`domain_expected_write_got_${domain}`);
    }
  } else if (scenario.domain === "business") {
    if (domain === "platform") {
      failures.push(`domain_expected_business_got_${domain}`);
    } else if (domain === "capability" && !honestUnsupportedWrite) {
      // Allow capability only when clearly a "what can you" style bleed; otherwise fail.
      if (!/what can you|capabilities|action registry/i.test(scenario.prompt)) {
        failures.push(`domain_expected_business_got_${domain}`);
      } else {
        checks.push("capability_bleed_ok");
      }
    } else if (domain === "write") {
      failures.push("domain_expected_business_got_write");
    } else if (domain === "unknown") {
      checks.push("business_model_only");
    }
  } else if (scenario.domain === "platform") {
    if (domain === "write") failures.push("domain_expected_platform_got_write");
  } else if (scenario.domain === "capability") {
    if (domain === "write") failures.push("domain_expected_capability_got_write");
    else if (domain === "unknown" && /registered|action registry|i can|capabilities/i.test(content)) {
      checks.push("capability_content");
    }
  }

  if (!isTopical(scenario, result)) failures.push("off_topic_or_empty_signal");
  else checks.push("topical");

  return {
    ok: failures.length === 0,
    domain,
    failures,
    checks,
  };
}

async function mapPool(items, size, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, () => run()));
  return results;
}

async function main() {
  console.log(`Base: ${baseUrl}`);
  console.log(
    `Scenarios: ${scenarios.length} / ${catalog.promptCount} (concurrency=${concurrency}${
      moduleFilter ? `, module=${moduleFilter}` : ""
    })`,
  );

  const cookie = await login();
  console.log("Authenticated.");

  const started = Date.now();
  let passed = 0;
  let failed = 0;

  const rows = await mapPool(scenarios, concurrency, async (scenario, index) => {
    const label = `[${index + 1}/${scenarios.length}] ${scenario.id}`;
    try {
      const result = await chat(cookie, scenario.prompt, scenario.view);
      const verdict = evaluate(scenario, result);
      if (verdict.ok) {
        passed += 1;
        console.log(`PASS ${label}`);
      } else {
        failed += 1;
        console.log(`FAIL ${label} :: ${verdict.failures.join("; ")}`);
      }
      return {
        id: scenario.id,
        category: scenario.category,
        module: scenario.module,
        subsection: scenario.subsection,
        view: scenario.view,
        prompt: scenario.prompt,
        expectedDomain: scenario.domain,
        observedDomain: verdict.domain,
        ok: verdict.ok,
        failures: verdict.failures,
        checks: verdict.checks,
        tools: result.tools,
        contentPreview: String(result.content || "").slice(0, 280),
        contentChars: String(result.content || "").length,
        cards: (result.executionCards || []).map((c) => c.kind),
      };
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`FAIL ${label} :: error:${message.slice(0, 180)}`);
      return {
        id: scenario.id,
        category: scenario.category,
        module: scenario.module,
        subsection: scenario.subsection,
        view: scenario.view,
        prompt: scenario.prompt,
        expectedDomain: scenario.domain,
        observedDomain: "error",
        ok: false,
        failures: [`error:${message}`],
        checks: [],
        tools: [],
        contentPreview: "",
        contentChars: 0,
        cards: [],
      };
    }
  });

  /** @type {Record<string, { total: number, passed: number, failed: number }>} */
  const byCategory = {};
  for (const row of rows) {
    const key = row.category;
    if (!byCategory[key]) byCategory[key] = { total: 0, passed: 0, failed: 0 };
    byCategory[key].total += 1;
    if (row.ok) byCategory[key].passed += 1;
    else byCategory[key].failed += 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    baseUrl,
    elapsedMs: Date.now() - started,
    concurrency,
    moduleFilter,
    totals: {
      scenarios: scenarios.length,
      passed,
      failed,
      passRate: scenarios.length ? Number((passed / scenarios.length).toFixed(4)) : 0,
    },
    byCategory,
    results: rows,
  };

  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log("\n=== SUMMARY ===");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Pass rate: ${(report.totals.passRate * 100).toFixed(1)}%`);
  console.log(`Report: ${reportPath}`);

  try {
    const { spawnSync } = await import("node:child_process");
    const pdfScript = path.join(__dirname, "export-executive-module-acceptance-pdf.mjs");
    const pdfOut = path.join(root, "docs", "executive-module-acceptance-report.pdf");
    const pdfRun = spawnSync(process.execPath, [pdfScript, reportPath, pdfOut], {
      encoding: "utf8",
    });
    if (pdfRun.status === 0) {
      console.log(`PDF: ${pdfOut}`);
      if (pdfRun.stdout) console.log(pdfRun.stdout.trim());
    } else {
      console.error("PDF export failed:", pdfRun.stderr || pdfRun.stdout || "unknown error");
    }
  } catch (pdfError) {
    console.error(
      "PDF export error:",
      pdfError instanceof Error ? pdfError.message : String(pdfError),
    );
  }

  const weak = Object.entries(byCategory)
    .filter(([, v]) => v.failed > 0)
    .sort((a, b) => b[1].failed - a[1].failed)
    .slice(0, 20);
  if (weak.length) {
    console.log("\nWeakest categories:");
    for (const [name, stats] of weak) {
      console.log(`- ${name}: ${stats.passed}/${stats.total}`);
    }
  }

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
