/**
 * SAEC complete demo acceptance — module views + legacy marker scan.
 * Usage: SAEC_DEMO_PASSWORD='...' npm run prove:saec-complete-demo
 */
import assert from "node:assert/strict";

const ORIGIN = "https://saec.unit311central.com";
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

  const homeHtml = await fetch(`${ORIGIN}/dashboard?view=home`, { headers: { Cookie: cookie } }).then(
    (r) => r.text(),
  );
  assert.ok(homeHtml.includes("800") || homeHtml.includes("Units Under Management"), "Home should show SAEC portfolio KPIs");

  const mapApi = await fetch(`${ORIGIN}/api/saec/installations/map-geography?layer=country`, {
    headers: { Cookie: cookie },
  });
  const mapBody = await mapApi.text();
  assert.ok(mapBody.includes("FeatureCollection"), "map geography API must return GeoJSON");

  console.log("[prove:saec-complete-demo] PASS — 22 modules, 156 submodules, views routable, no legacy markers on key pages");
}

main().catch((error) => {
  console.error("[prove:saec-complete-demo] FAIL", error);
  process.exit(1);
});
