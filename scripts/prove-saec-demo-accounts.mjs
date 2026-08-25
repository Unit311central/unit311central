/**
 * SAEC full-access demo account acceptance (production).
 * Usage: SAEC_DEMO_PASSWORD='...' npm run prove:saec-demo-accounts
 */
import assert from "node:assert/strict";

const ORIGIN = "https://saec.unit311central.com";
const DEMO_ORIGIN = "https://demo.unit311central.com";
const IFW_ORIGIN = "https://interfaceworx.unit311central.com";
const PASSWORD = process.env.SAEC_DEMO_PASSWORD ?? "";

const ACCOUNTS = [
  { email: "admin@saec.biz", label: "admin@saec.biz" },
  { email: "demo@saec.biz", label: "demo@saec.biz" },
];

const MODULE_VIEWS = [
  { label: "Home", view: "home" },
  { label: "Executive Assistant", view: "executive-assistant" },
  { label: "Intelligence", view: "demo-company-intelligence" },
  { label: "Business Central", view: "business-central-dashboard" },
  { label: "Sales Management", view: "sales-management" },
  { label: "Finances", view: "financials" },
  { label: "Fundraising", view: "fundraising-dashboard" },
  { label: "Board", view: "board-dashboard" },
  { label: "Corporate Information", view: "corporate-dashboard" },
  { label: "Operations", view: "operations-dashboard" },
  { label: "Installations Dashboard", view: "saec-installations-dashboard" },
  { label: "Installations Elevators", view: "saec-installations-elevators" },
  { label: "Installations Escalators", view: "saec-installations-escalators" },
  { label: "Marketing & Events", view: "oa-marketing-dashboard" },
  { label: "Technology Management", view: "technology-dashboard" },
  { label: "Human Resources", view: "hr-dashboard" },
  { label: "Business Productivity", view: "productivity-dashboard" },
  { label: "Support Desk", view: "support-overview" },
  { label: "Project Management", view: "projects-dashboard" },
  { label: "Engineering", view: "engineering-sops-dashboard" },
  { label: "Training", view: "training-dashboard" },
  { label: "QMS", view: "quality-management" },
  { label: "Tools", view: "users" },
  { label: "External Client Access", view: "external-client-access" },
  { label: "Settings", view: "settings" },
];

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : setCookieHeaders ? [setCookieHeaders] : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

async function login(email) {
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: email,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${email} login failed: ${JSON.stringify(body)}`);
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error(`${email} login succeeded but no cookie`);
  assert.equal(body.workspace?.slug, "saec", `${email} must land in SAEC workspace`);
  return cookie;
}

async function whoami(cookie) {
  const res = await fetch(`${ORIGIN}/api/auth/whoami`, { headers: { Cookie: cookie } });
  const body = await res.json();
  assert.equal(res.status, 200);
  return body;
}

async function openView(cookie, view) {
  const res = await fetch(`${ORIGIN}/dashboard?view=${encodeURIComponent(view)}`, {
    headers: { Cookie: cookie },
  });
  const html = await res.text();
  assert.equal(res.status, 200, `view ${view} must return HTTP 200`);
  assert.ok(
    html.includes(view) || html.includes(`\\"${view}\\"`),
    `view ${view} must resolve in dashboard route`,
  );
}

async function assertWorkspaceIsolation(cookie, email) {
  const demoApi = await fetch(`${DEMO_ORIGIN}/api/saec/installations/dashboard?assetType=elevator`, {
    headers: { Cookie: cookie },
  });
  const demoBody = await demoApi.json().catch(() => ({}));
  assert.notEqual(demoApi.status, 200, `${email} must not access SAEC API on Demo host`);
  assert.ok(
    demoBody.error,
    `${email} Demo host SAEC API must return an error`,
  );

  const demoDash = await fetch(`${DEMO_ORIGIN}/dashboard`, { headers: { Cookie: cookie } });
  assert.notEqual(demoDash.status, 200, `${email} must not load Demo dashboard with SAEC session`);

  const ifwDash = await fetch(`${IFW_ORIGIN}/dashboard`, { headers: { Cookie: cookie } });
  assert.notEqual(ifwDash.status, 200, `${email} must not load InterfaceWorx dashboard with SAEC session`);
}

async function testAccount(account) {
  console.log(`[prove:saec-demo-accounts] testing ${account.label}`);
  const cookie = await login(account.email);
  const profile = await whoami(cookie);

  assert.equal(profile.workspaceSlug, "saec");
  assert.equal(profile.role, "Admin", `${account.label} whoami.role`);
  assert.ok(profile.roles?.includes("Admin"), `${account.label} whoami.roles`);
  assert.equal(profile.allowedViews, null, `${account.label} allowedViews must be unrestricted (null)`);

  for (const entry of MODULE_VIEWS) {
    await openView(cookie, entry.view);
  }

  const elevatorApi = await fetch(`${ORIGIN}/api/saec/installations/dashboard?assetType=elevator`, {
    headers: { Cookie: cookie },
  });
  const elevatorBody = await elevatorApi.json();
  assert.equal(elevatorApi.status, 200);
  assert.equal(elevatorBody.dashboard?.kpis?.total, 400);

  await assertWorkspaceIsolation(cookie, account.label);

  return {
    email: account.email,
    userId: profile.userId ?? profile.sub,
    role: profile.role,
    roles: profile.roles,
    department: profile.department,
    departments: profile.departments,
    allowedViews: profile.allowedViews,
    workspaceSlug: profile.workspaceSlug,
    enabledModules: profile.enabledModules?.length ?? null,
    enabledSubModules: profile.enabledSubModules?.length ?? null,
  };
}

async function main() {
  if (!PASSWORD) throw new Error("SAEC_DEMO_PASSWORD is required.");
  console.log(`[prove:saec-demo-accounts] ${ORIGIN}`);

  const results = [];
  for (const account of ACCOUNTS) {
    results.push(await testAccount(account));
  }

  console.log("[prove:saec-demo-accounts] permission snapshot:");
  console.log(JSON.stringify(results, null, 2));
  console.log("[prove:saec-demo-accounts] PASS");
}

main().catch((error) => {
  console.error("[prove:saec-demo-accounts] FAIL", error);
  process.exit(1);
});
