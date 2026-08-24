/**
 * Authenticated Demo production browser acceptance sweep.
 * Visits every enabled submodule view in a real browser (Playwright).
 *
 * Usage: npm run prove:demo-browser-sweep
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";

const ORIGIN = (process.argv[2] ?? "https://demo.unit311central.com").replace(/\/$/, "");
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const ARTIFACT_DIR = "/opt/cursor/artifacts/demo-browser-sweep";
const REPORT_PATH = path.join(ARTIFACT_DIR, "DEMO_ACCEPTANCE_SWEEP.md");
const COMMIT = process.env.DEMO_SWEEP_COMMIT ?? "bc9c59cf";

const LOGIN_PAGE_PATTERNS = [
  /Secure access to Northstar/i,
  /Username\s+Password\s+Sign In/i,
  /Authentication required/i,
  /Sign in to continue/i,
];

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

async function loadSweepManifest() {
  const manifestPath = path.join(ARTIFACT_DIR, "sweep-manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(`Missing ${manifestPath} — run build-demo-sweep-manifest first`);
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function detectCurrency(text) {
  const hasGbp = /£|\bGBP\b/.test(text);
  const hasUsd = /\$|\bUSD\b/.test(text);
  if (hasGbp && hasUsd) return "Mixed GBP+USD";
  if (hasGbp) return "GBP";
  if (hasUsd) return "USD";
  return "—";
}

function isLoginPage(text) {
  return LOGIN_PAGE_PATTERNS.some((pattern) => pattern.test(text));
}

function evaluatePage({ module, subModule, text, title }) {
  const issues = [];
  if (isLoginPage(text)) issues.push("Login page (session lost or view blocked)");
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
  if (module === "FINANCES" && subModule === "My Expenses" && /£|\bGBP\b/.test(text)) {
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
  return `| ${row.module} | ${row.subModule} | \`${row.view}\` | ${row.url} | ${row.browserResult} | ${row.dataShown.replace(/\|/g, "\\|")} | ${row.currency} | — | demo session | demo | ${row.pass ? "**PASS**" : "**FAIL**"} | \`${COMMIT}\` |`;
}

function parseSetCookies(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : setCookieHeaders
      ? [setCookieHeaders]
      : [];
  return list.map((raw) => {
    const parts = raw.split(";").map((part) => part.trim());
    const [nameValue, ...attrs] = parts;
    const eq = nameValue.indexOf("=");
    const name = nameValue.slice(0, eq);
    const value = nameValue.slice(eq + 1);
    const cookie = {
      name,
      value,
      domain: ".unit311central.com",
      path: "/",
      secure: true,
      httpOnly: true,
      sameSite: "Lax",
    };
    for (const attr of attrs) {
      const [k, v = ""] = attr.split("=");
      const key = k.toLowerCase();
      if (key === "path") cookie.path = v || "/";
      if (key === "samesite") {
        cookie.sameSite = v.charAt(0).toUpperCase() + v.slice(1).toLowerCase();
      }
    }
    return cookie;
  });
}

async function loginBrowserContext(context) {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard?view=home",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookies = parseSetCookies(res.headers.getSetCookie?.() ?? []);
  if (!cookies.length) throw new Error("Login succeeded but no session cookie");
  await context.addCookies(cookies);
}

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
  const rows = await loadSweepManifest();
  console.log(`Demo browser sweep — ${ORIGIN} (${rows.length} views)`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await loginBrowserContext(context);
  console.log("  PASS browser login");

  const results = [];
  for (const row of rows) {
    const url = `${ORIGIN}/dashboard?view=${encodeURIComponent(row.view)}`;
    process.stdout.write(`  ${row.module}/${row.subModule} … `);
    try {
      const response = await page.goto(url, { waitUntil: "networkidle", timeout: 90000 });
      await page.waitForTimeout(500);
      const text = await page.locator("body").innerText();
      const title = await page.title();
      const status = response?.status() ?? 0;
      const evalResult = evaluatePage({ ...row, text, title });
      if (status !== 200) {
        evalResult.issues.push(`HTTP ${status}`);
        evalResult.pass = false;
      }

      const shotName = `${row.moduleId ?? row.module}-${row.subModuleId ?? row.subModule}.png`.replace(
        /[^a-z0-9.-]+/gi,
        "_",
      );
      await page.screenshot({
        path: path.join(ARTIFACT_DIR, shotName),
        fullPage: false,
      });

      const result = {
        ...row,
        url,
        pass: evalResult.pass,
        browserResult: evalResult.pass
          ? "Authenticated UI loaded"
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
  const fails = results.filter((r) => !r.pass);

  const header = `# Demo production browser acceptance sweep

- **Origin:** ${ORIGIN}
- **Commit:** \`${COMMIT}\`
- **Date:** ${new Date().toISOString()}
- **Result:** ${passCount}/${results.length} PASS, ${failCount} FAIL

| MODULE | SUBMODULE | VIEW | URL/VIEW | ACTUAL BROWSER RESULT | DATA SHOWN | CURRENCY | CRUD | AUTH | ISOLATION | PASS/FAIL | COMMIT |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
`;

  fs.writeFileSync(REPORT_PATH, header + results.map(markdownRow).join("\n") + "\n");
  fs.writeFileSync(path.join(ARTIFACT_DIR, "results.json"), JSON.stringify(results, null, 2));

  console.log(`\nReport: ${REPORT_PATH}`);
  console.log(`PASS ${passCount}/${results.length}`);
  if (fails.length) {
    console.log("\nFailures:");
    for (const fail of fails) {
      console.log(`  - ${fail.module}/${fail.subModule}: ${fail.browserResult}`);
    }
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
