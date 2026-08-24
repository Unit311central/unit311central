/**
 * Authenticated Demo production browser acceptance sweep.
 * Visits every enabled submodule view in a real browser (Playwright).
 *
 * Usage: npm run prove:demo-browser-sweep
 *        node scripts/prove-demo-browser-sweep.mjs [origin]
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ORIGIN = (process.argv[2] ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts/demo-browser-sweep";
const REPORT_PATH = path.join(ARTIFACT_DIR, "DEMO_ACCEPTANCE_SWEEP.md");

const PLACEHOLDER_PATTERNS = [
  /coming soon/i,
  /under construction/i,
  /not yet available/i,
  /placeholder module/i,
  /module not enabled/i,
];

const FOREIGN_TENANT_PATTERNS = [
  /TALANTON INTELLIGENCE/i,
  /OnwardAir · Fundraising/i,
  /Nakama/i,
  /ABHI Home/i,
];

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  return list
    .map((raw) => raw.split(";")[0])
    .filter(Boolean)
    .join("; ");
}

async function loginFetch() {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Login succeeded but no session cookie");
  return cookie;
}

async function fetchWhoami(cookie) {
  const res = await fetch(`${ORIGIN}/api/auth/whoami`, { headers: { Cookie: cookie } });
  const json = await res.json();
  if (!res.ok) throw new Error(`whoami failed ${res.status}`);
  return json;
}

/** Build sweep rows from whoami enabled sub-modules + central catalogue (tsx manifest). */
async function loadSweepManifest() {
  const manifestPath = path.join(ARTIFACT_DIR, "sweep-manifest.json");
  if (fs.existsSync(manifestPath)) {
    return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  }
  // Fallback: derive view ids from submodule keys (works for most central views).
  const whoami = await fetchWhoami(await loginFetch());
  const subs = whoami.enabledSubModules ?? [];
  return subs
    .map((key) => {
      const idx = key.indexOf(":");
      if (idx <= 0) return null;
      const moduleId = key.slice(0, idx);
      const subId = key.slice(idx + 1);
      const view = subId.includes("-") ? subId : subId;
      const intelligenceViews = {
        "company-intelligence": "demo-company-intelligence",
        "client-intelligence": "demo-client-intelligence",
        "market-intelligence": "demo-market-intelligence",
      };
      const resolvedView = intelligenceViews[subId] ?? subId;
      return {
        module: moduleId,
        subModule: subId,
        view: resolvedView,
        url: `${ORIGIN}/dashboard?view=${encodeURIComponent(resolvedView)}`,
      };
    })
    .filter(Boolean);
}

function detectCurrency(text) {
  const hasGbp = /£|\bGBP\b/.test(text);
  const hasUsd = /\$|\bUSD\b/.test(text);
  if (hasGbp && hasUsd) return "Mixed GBP+USD";
  if (hasGbp) return "GBP";
  if (hasUsd) return "USD";
  return "—";
}

function evaluatePage({ module, subModule, view, text, title }) {
  const issues = [];
  if (/Authentication required/i.test(text)) issues.push("Auth wall");
  if (/Sign in to continue/i.test(text)) issues.push("Login prompt");
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(`Placeholder: ${pattern.source}`);
      break;
    }
  }
  for (const pattern of FOREIGN_TENANT_PATTERNS) {
    if (pattern.test(text)) {
      issues.push(`Foreign tenant leak: ${pattern.source}`);
      break;
    }
  }
  if (module === "fundraising" && /£|\bGBP\b/.test(text)) {
    issues.push("Fundraising shows GBP (expected USD)");
  }
  if (module === "financials" && subModule === "expenses" && /£|\bGBP\b/.test(text)) {
    issues.push("Expenses surface shows GBP (expected USD)");
  }
  const pass = issues.length === 0;
  return {
    pass,
    issues,
    title: title?.slice(0, 120) ?? "",
    dataShown: text.replace(/\s+/g, " ").slice(0, 180),
    currency: detectCurrency(text),
  };
}

function markdownRow(row) {
  return `| ${row.module} | ${row.subModule} | \`${row.view}\` | ${row.url} | ${row.browserResult} | ${row.dataShown.replace(/\|/g, "\\|")} | ${row.currency} | — | — | demo session | demo | ${row.pass ? "**PASS**" : "**FAIL**"} | \`8e405760\` |`;
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const cookie = await loginFetch();
  const whoami = await fetchWhoami(cookie);
  console.log(`Demo browser sweep — ${ORIGIN}`);
  console.log(`  workspace: ${whoami.workspaceSlug}, submodules: ${whoami.enabledSubModules?.length ?? 0}`);

  const rows = await loadSweepManifest();
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const cookies = cookie.split("; ").map((pair) => {
    const eq = pair.indexOf("=");
    const name = pair.slice(0, eq);
    const value = pair.slice(eq + 1);
    return { name, value, domain: ".unit311central.com", path: "/" };
  });
  await context.addCookies(cookies);
  const page = await context.newPage();

  const results = [];
  for (const row of rows) {
    const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(row.view)}`;
    process.stdout.write(`  ${row.module}/${row.subModule} … `);
    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
      await page.waitForTimeout(800);
      const text = await page.locator("body").innerText();
      const title = await page.title();
      const status = response?.status() ?? 0;
      const evalResult = evaluatePage({ ...row, text, title });
      if (status !== 200) evalResult.issues.push(`HTTP ${status}`);
      if (status !== 200) evalResult.pass = false;

      const shotName = `${row.module}-${row.subModule}.png`.replace(/[^a-z0-9.-]+/gi, "_");
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, shotName),
        fullPage: false,
      });

      const result = {
        ...row,
        url,
        pass: evalResult.pass,
        browserResult: evalResult.pass
          ? "Page loaded, no auth/placeholder/leak"
          : evalResult.issues.join("; "),
        dataShown: evalResult.dataShown,
        currency: evalResult.currency,
      };
      results.push(result);
      console.log(result.pass ? "PASS" : `FAIL — ${result.browserResult}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      results.push({
        ...row,
        url,
        pass: false,
        browserResult: `Browser error: ${message}`,
        dataShown: "—",
        currency: "—",
      });
      console.log(`FAIL — ${message}`);
    }
  }

  await browser.close();

  const passCount = results.filter((r) => r.pass).length;
  const failCount = results.length - passCount;

  const header = `# Demo production browser acceptance sweep

- **Origin:** ${ORIGIN}
- **Commit:** \`8e405760\`
- **Date:** ${new Date().toISOString()}
- **Result:** ${passCount}/${results.length} PASS, ${failCount} FAIL

| MODULE | SUBMODULE | VIEW | URL/VIEW | ACTUAL BROWSER RESULT | DATA SHOWN | CURRENCY | CRUD | AUTH | ISOLATION | PASS/FAIL | COMMIT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;

  const body = results.map(markdownRow).join("\n");
  fs.writeFileSync(REPORT_PATH, header + body + "\n");
  fs.writeFileSync(path.join(ARTIFACT_DIR, "results.json"), JSON.stringify(results, null, 2));

  console.log(`\nReport: ${REPORT_PATH}`);
  console.log(`PASS ${passCount}/${results.length}`);

  if (failCount > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
