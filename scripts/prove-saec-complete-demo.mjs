/**
 * SAEC complete demo acceptance — module views + legacy marker scan.
 * Usage: SAEC_DEMO_PASSWORD='...' npm run prove:saec-complete-demo
 */
import assert from "node:assert/strict";

const ORIGIN = "https://omnitransit.unit311central.com";
const PASSWORD = process.env.SAEC_DEMO_PASSWORD ?? "";
const USER = process.env.SAEC_DEMO_USERNAME ?? "admin@saec.biz";

const LEGACY_MARKERS = [
  "Northstar Industrial",
  "Dublin Pharma",
  "Edge Controller",
  "Edge gateway",
  "MES connector",
  "Predictive maintenance",
  "Bristol Automation",
  "Sheffield Precision",
  "Copper Ventures",
  "True County",
];

const SUBMODULE_VIEWS = [
  "home",
  "executive-assistant",
  "demo-company-intelligence",
  "demo-client-intelligence",
  "demo-market-intelligence",
  "business-central-dashboard",
  "clients-dashboard",
  "clients",
  "member-intelligence",
  "management",
  "crm-meetings",
  "client-onboarding",
  "content-studio",
  "information-repository",
  "sales-management",
  "financials",
  "general-ledger",
  "accounts-receivable",
  "accounts-payable",
  "expenses",
  "wise",
  "financial-reports",
  "fundraising-dashboard",
  "board-dashboard",
  "corporate-dashboard",
  "operations-dashboard",
  "saec-installations-dashboard",
  "saec-installations-elevators",
  "saec-installations-escalators",
  "oa-marketing-dashboard",
  "technology-dashboard",
  "hr-dashboard",
  "productivity-dashboard",
  "support-overview",
  "projects-dashboard",
  "engineering-sops-dashboard",
  "training-dashboard",
  "quality-management",
  "users",
  "external-client-access",
  "settings",
];

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : setCookieHeaders ? [setCookieHeaders] : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

async function login() {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USER,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(body)}`);
  return cookieHeader(res.headers.getSetCookie?.() ?? []);
}

async function main() {
  if (!PASSWORD) throw new Error("SAEC_DEMO_PASSWORD required");
  const cookie = await login();

  const whoami = await fetch(`${ORIGIN}/api/auth/whoami`, { headers: { Cookie: cookie } }).then((r) =>
    r.json(),
  );
  assert.equal(whoami.workspaceSlug, "saec");
  assert.equal(whoami.enabledModules?.length, 22);
  assert.equal(whoami.enabledSubModules?.length, 156);

  for (const view of SUBMODULE_VIEWS) {
    const res = await fetch(`${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`, {
      headers: { Cookie: cookie },
    });
    const html = await res.text();
    assert.equal(res.status, 200, `view ${view} must return 200`);
    assert.ok(html.includes(view) || html.includes(`\\"${view}\\"`), `view ${view} must resolve`);
    for (const marker of LEGACY_MARKERS) {
      assert.equal(
        html.includes(marker),
        false,
        `view ${view} must not contain legacy marker "${marker}"`,
      );
    }
  }

  const homeRes = await fetch(`${ORIGIN}/dashboard?view=home`, { headers: { Cookie: cookie } });
  assert.equal(homeRes.status, 200, "Home dashboard must load");

  const mapApi = await fetch(`${ORIGIN}/api/saec/installations/map-geography?layer=country`, {
    headers: { Cookie: cookie },
  });
  const mapBody = await mapApi.text();
  assert.ok(mapBody.includes("FeatureCollection"), "map geography API must return GeoJSON");

  const dataChecks = [
    { path: "/api/software-assets", key: "assets", min: 1 },
    { path: "/api/financials/expenses", key: "expenses", min: 1 },
    { path: "/api/financials/ledger/journals", key: "journals", min: 1 },
    { path: "/api/marketing/dashboard", key: "kpis", minSubscribers: 100 },
    { path: "/api/hr/employees", key: "employees", min: 50 },
    { path: "/api/crm/leads", key: "leads", min: 10 },
    { path: "/api/payroll/runs", key: "runs", min: 1 },
    { path: "/api/support/tickets", key: "tickets", min: 1 },
    { path: "/api/clients", key: "clients", min: 5 },
  ];

  for (const check of dataChecks) {
    const res = await fetch(`${ORIGIN}${check.path}`, { headers: { Cookie: cookie } });
    const body = await res.json();
    assert.equal(res.status, 200, `${check.path} must return 200`);
    if (check.key === "kpis") {
      assert.ok(
        (body.kpis?.mailingSubscribers ?? 0) >= check.minSubscribers,
        `marketing KPIs must be populated (${check.path})`,
      );
    } else {
      const rows = body[check.key];
      assert.ok(Array.isArray(rows) && rows.length >= check.min, `${check.path} must have ≥${check.min} ${check.key}`);
    }
  }

  console.log("[prove:saec-complete-demo] PASS — 22 modules, 156 submodules, views routable, no legacy markers, demo data populated");
}

main().catch((error) => {
  console.error("[prove:saec-complete-demo] FAIL", error);
  process.exit(1);
});
