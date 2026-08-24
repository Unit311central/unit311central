/**
 * Authenticated Demo/Northstar production acceptance sweep.
 *
 * Usage:
 *   npm run prove:demo-acceptance
 *   node scripts/prove-demo-acceptance.mjs https://demo.unit311central.com
 */
import assert from "node:assert/strict";
import { performance } from "node:perf_hooks";

const DEFAULT_ORIGIN = "https://demo.unit311central.com";
const DEMO_USERNAME = "demo@unit311central.com";
const DEMO_PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

const VIEW_CHECKS = [
  { module: "Fundraising", sub: "Dashboard", view: "fundraising-dashboard" },
  { module: "Fundraising", sub: "Investors", view: "fundraising-investors" },
  { module: "Fundraising", sub: "Cap Table", view: "fundraising-cap-table" },
  { module: "Fundraising", sub: "Pipeline", view: "fundraising-pipeline" },
  { module: "Fundraising", sub: "Meetings", view: "fundraising-meetings" },
  { module: "Fundraising", sub: "Pitch Decks", view: "fundraising-pitch-decks" },
  { module: "Fundraising", sub: "Data Rooms", view: "fundraising-data-rooms" },
  { module: "Sales Management", sub: "Overview", view: "sales-management" },
  { module: "Corporate Information", sub: "Company Details", view: "corporate-company-details" },
  { module: "Content Studio", sub: "Studio", view: "content-studio" },
  { module: "Engineering", sub: "Dashboard", view: "engineering-dashboard" },
  { module: "Engineering", sub: "Technical Files", view: "engineering-technical-files" },
  { module: "Engineering", sub: "SOP Dashboard", view: "engineering-sops-dashboard" },
  { module: "Business Productivity", sub: "Internal Work Packages", view: "internal-work-packages" },
  { module: "Procurement", sub: "Dashboard", view: "procurement-dashboard" },
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

async function login(origin) {
  const started = performance.now();
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: DEMO_USERNAME,
      password: DEMO_PASSWORD,
      returnTo: origin,
      next: "/dashboard",
    }),
  });
  const ms = Math.round(performance.now() - started);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Login succeeded but no session cookie returned.");
  return { cookie, ms, body };
}

async function fetchJson(origin, path, cookie, init = {}) {
  const res = await fetch(`${origin}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Cookie: cookie,
      ...(init.body ? { "Content-Type": "application/json" } : {}),
    },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    /* html or empty */
  }
  return { status: res.status, json, text };
}

async function checkMigration159(origin, cookie) {
  const res = await fetchJson(origin, "/api/internal-work-packages", cookie);
  assert.equal(res.status, 200, "GET internal-work-packages should succeed after migration 159");
  assert.ok(Array.isArray(res.json?.packages), "packages array expected");
}

async function checkWorkPackageCrud(origin, cookie) {
  const whoami = await fetchJson(origin, "/api/auth/whoami", cookie);
  const ownerUserId = whoami.json?.userId ?? null;

  const create = await fetchJson(origin, "/api/internal-work-packages", cookie, {
    method: "POST",
    body: JSON.stringify({
      name: `Acceptance WP ${Date.now()}`,
      description: "Demo acceptance sweep",
      status: "active",
    }),
  });
  assert.notEqual(
    create.status,
    403,
    `Work package create should not be read-only blocked: ${JSON.stringify(create.json).slice(0, 200)}`,
  );
  assert.equal(create.status, 201, `Work package create expected 201, got ${create.status}`);
  const pkg = create.json?.workPackage ?? create.json?.package;
  assert.ok(pkg?.id, "created workPackage id required");

  const addMember = await fetchJson(
    origin,
    `/api/internal-work-packages/${pkg.id}/members`,
    cookie,
    {
      method: "PUT",
      body: JSON.stringify({
        members: [{ userId: ownerUserId, displayName: "Demo Owner" }],
      }),
    },
  );
  assert.ok([200, 201].includes(addMember.status), `add member failed: ${addMember.status}`);

  const addTask = await fetchJson(
    origin,
    `/api/internal-work-packages/${pkg.id}/tasks`,
    cookie,
    {
      method: "POST",
      body: JSON.stringify({
        description: "Verify task IDs",
        category: "delivery",
        assignedToName: "Demo Owner",
      }),
    },
  );
  assert.equal(addTask.status, 201, `task create expected 201, got ${addTask.status}`);
  assert.ok(addTask.json?.task?.id, "task id required");

  const delTask = await fetchJson(
    origin,
    `/api/internal-work-packages/${pkg.id}/tasks/${addTask.json.task.id}`,
    cookie,
    { method: "DELETE" },
  );
  assert.equal(delTask.status, 200, `task delete expected 200, got ${delTask.status}`);

  const delPkg = await fetchJson(origin, `/api/internal-work-packages/${pkg.id}`, cookie, {
    method: "DELETE",
  });
  assert.equal(delPkg.status, 200, `package delete expected 200, got ${delPkg.status}`);
}

async function checkViews(origin, cookie) {
  for (const row of VIEW_CHECKS) {
    const url = `${origin}/dashboard?view=${row.view}`;
    const res = await fetch(url, {
      headers: { Cookie: cookie, Accept: "text/html" },
      redirect: "manual",
    });
    const text = await res.text();
    const authRequired = /Authentication required/i.test(text);
    const redirectedHome =
      res.status >= 300 && res.status < 400 && /view=home|\/login/.test(res.headers.get("location") ?? "");
    assert.equal(res.status, 200, `${row.module}/${row.sub} HTTP ${res.status}`);
    assert.equal(authRequired, false, `${row.module}/${row.sub} shows auth error`);
    assert.equal(redirectedHome, false, `${row.module}/${row.sub} redirected away`);

    if (row.module === "Fundraising") {
      assert.match(text, /Northstar|Fundraising/i, `${row.sub} should show Fundraising/Northstar content`);
      assert.doesNotMatch(text, /TALANTON INTELLIGENCE|OnwardAir Fundraising|Nakama/i, `${row.sub} leaked foreign tenant content`);
      assert.doesNotMatch(text, /£|\bGBP\b/i, `${row.sub} must not show non-USD currency markers`);
    }
    if (row.module === "Content Studio") {
      assert.match(
        text,
        /Content Studio|Approved templates|Create content|New content/i,
        `${row.sub} should expose create workflow`,
      );
    }

    console.log(`  PASS ${row.module} → ${row.sub} (?view=${row.view})`);
  }
}

async function checkCommissionRules(origin, cookie) {
  const create = await fetchJson(origin, "/api/sales-management/commission-rules", cookie, {
    method: "POST",
    body: JSON.stringify({
      name: `Acceptance rule ${Date.now()}`,
      ratePct: 7.5,
      appliesTo: "won_deal",
    }),
  });
  assert.equal(create.status, 201, `commission rule create expected 201, got ${create.status}`);
  const ruleId = create.json?.rule?.id;
  assert.ok(ruleId, "commission rule id required");
  const del = await fetchJson(
    origin,
    `/api/sales-management/commission-rules?id=${encodeURIComponent(ruleId)}`,
    cookie,
    { method: "DELETE" },
  );
  assert.equal(del.status, 200, `commission rule delete expected 200, got ${del.status}`);
}

async function checkApis(origin, cookie) {
  const tf = await fetchJson(origin, "/api/engineering/technical-files", cookie);
  assert.equal(tf.status, 200, "Technical Files API");
  const sop = await fetchJson(origin, "/api/engineering/sops/dashboard", cookie);
  assert.equal(sop.status, 200, "SOP dashboard API");
  const sales = await fetchJson(origin, "/api/sales-management/workspace", cookie);
  assert.equal(sales.status, 200, "Sales management workspace API");
}

async function checkWhoami(origin, cookie) {
  const t0 = performance.now();
  const res = await fetchJson(origin, "/api/auth/whoami", cookie);
  const ms = Math.round(performance.now() - t0);
  assert.equal(res.status, 200);
  assert.equal(res.json?.workspaceSlug, "demo");
  assert.ok(
    res.json?.allowedViews == null || Array.isArray(res.json.allowedViews),
    "allowedViews shape",
  );
  console.log(`  whoami ${ms}ms — enabledModules: ${(res.json?.enabledModules ?? []).length || "null"}`);
  return ms;
}

async function main() {
  const origin = (process.argv[2] ?? DEFAULT_ORIGIN).replace(/\/$/, "");
  console.log(`prove:demo-acceptance against ${origin}`);

  const { cookie, ms: loginMs } = await login(origin);
  console.log(`  login ${loginMs}ms`);

  await checkWhoami(origin, cookie);
  await checkMigration159(origin, cookie);
  await checkWorkPackageCrud(origin, cookie);
  await checkApis(origin, cookie);
  await checkCommissionRules(origin, cookie);
  await checkViews(origin, cookie);

  console.log("prove:demo-acceptance: OK");
}

main().catch((error) => {
  console.error("prove:demo-acceptance: FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
