/**
 * Authenticated Finances acceptance for Demo (USD) — nav, views, currency, no Coming Soon.
 *
 * Usage: npm run prove:finances-acceptance
 */
import assert from "node:assert/strict";

const DEMO = {
  label: "Demo/Northstar",
  origin: "https://demo.unit311central.com",
  username: "demo@unit311central.com",
  password: process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$",
  expectedCurrency: "USD",
};

const REQUIRED_NAV = [
  "Dashboard",
  "General Ledger",
  "Chart of Accounts",
  "Trial Balance",
  "Journals",
  "Accounts Receivable",
  "Invoices",
  "Outstanding",
  "Overdue",
  "Collections",
  "AR Reporting",
  "Accounts Payable",
  "Supplier Invoices",
  "Approvals",
  "Due Dates",
  "Payments",
  "Expenses",
  "My Expenses",
  "Add Expense",
  "All Expenses",
  "Expense Runs",
  "Configuration",
  "Bank",
  "Cash Position",
  "Reconciliation",
  "Budget",
  "Actual vs Budget",
  "Cash Flow",
  "Forecast",
  "KPIs",
  "Management Accounts",
  "Financial Reports",
];

const VIEW_CHECKS = [
  { view: "financials", mustInclude: ["Finances"] },
  { view: "general-ledger", mustInclude: ["Chart of Accounts", "Trial Balance"] },
  { view: "accounts-receivable", mustInclude: ["Accounts receivable", "Invoices"] },
  {
    view: "accounts-receivable",
    query: "filter=outstanding",
    mustInclude: ["Outstanding"],
  },
  { view: "finances-ar-collections", mustInclude: ["Collections"] },
  { view: "finances-ar-reporting", mustInclude: ["AR Reporting"] },
  {
    view: "accounts-payable",
    query: "section=approvals",
    mustInclude: ["Approvals"],
  },
  {
    view: "accounts-payable",
    query: "section=outstanding",
    mustInclude: ["Outstanding"],
  },
  { view: "finances-ap-payments", mustInclude: ["Payments"] },
  { view: "expenses", mustInclude: ["My expenses", "Expenses"] },
  {
    view: "expenses",
    query: "section=runs",
    mustInclude: ["Expense runs"],
  },
  { view: "wise", mustInclude: ["Bank"] },
  { view: "finances-banking-cash-position", mustInclude: ["Cash Position"] },
  { view: "finances-banking-reconciliation", mustInclude: ["Reconciliation"] },
  { view: "finances-planning-budget", mustInclude: ["Budget"] },
  { view: "finances-planning-kpis", mustInclude: ["KPIs"] },
  { view: "financial-reports", mustInclude: ["Financial Reports"] },
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

async function login(workspace) {
  const res = await fetch(`${workspace.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: workspace.username,
      password: workspace.password,
      returnTo: workspace.origin,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `${workspace.label} login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`,
    );
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error(`${workspace.label}: login succeeded but no session cookie`);
  return cookie;
}

async function fetchPage(origin, path, cookie) {
  const res = await fetch(`${origin}${path}`, { headers: { Cookie: cookie } });
  const text = await res.text();
  return { status: res.status, text };
}

async function main() {
  console.log(`[prove:finances-acceptance] ${DEMO.label} @ ${DEMO.origin}`);
  const cookie = await login(DEMO);

  const dash = await fetchPage(DEMO.origin, "/dashboard?view=financials", cookie);
  assert.equal(dash.status, 200, "dashboard must load");
  for (const label of REQUIRED_NAV) {
    assert.ok(dash.text.includes(label), `nav label missing: ${label}`);
  }
  assert.ok(!/coming soon/i.test(dash.text), "dashboard must not show Coming Soon");

  for (const check of VIEW_CHECKS) {
    const qs = check.query ? `&${check.query}` : "";
    const path = `/dashboard?view=${check.view}${qs}`;
    const page = await fetchPage(DEMO.origin, path, cookie);
    assert.equal(page.status, 200, `${path} must load`);
    assert.ok(!/coming soon/i.test(page.text), `${path} must not show Coming Soon`);
    for (const snippet of check.mustInclude) {
      assert.ok(
        page.text.toLowerCase().includes(snippet.toLowerCase()),
        `${path} must include "${snippet}"`,
      );
    }
  }

  const overviewRes = await fetch(`${DEMO.origin}/api/financials/ledger/overview`, {
    headers: { Cookie: cookie },
  });
  const overviewBody = await overviewRes.json();
  assert.equal(overviewRes.status, 200, "overview API must succeed");
  const burnCurrency = overviewBody?.overview?.burnRate?.currency;
  assert.equal(
    burnCurrency,
    DEMO.expectedCurrency,
    `overview burnRate.currency must be ${DEMO.expectedCurrency}, got ${burnCurrency}`,
  );

  const invoicesRes = await fetch(`${DEMO.origin}/api/financials/invoices`, {
    headers: { Cookie: cookie },
  });
  const invoicesBody = await invoicesRes.json();
  assert.equal(invoicesRes.status, 200);
  const invoiceCurrencies = (invoicesBody.invoices ?? []).map((row) => row.currency);
  assert.ok(
    invoiceCurrencies.every((code) => code === DEMO.expectedCurrency),
    `all demo invoices must use ${DEMO.expectedCurrency}`,
  );

  console.log("[prove:finances-acceptance] PASS");
}

main().catch((error) => {
  console.error("[prove:finances-acceptance] FAIL", error);
  process.exit(1);
});
