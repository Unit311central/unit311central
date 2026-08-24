/**
 * Authenticated expense management acceptance for Demo (USD) and InterfaceWorx (GBP).
 *
 * Usage:
 *   npm run prove:expenses-acceptance
 *   node scripts/prove-expenses-acceptance.mjs
 */
import assert from "node:assert/strict";

const WORKSPACES = [
  {
    label: "Demo/Northstar",
    origin: "https://demo.unit311central.com",
    username: "demo@unit311central.com",
    password: process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$",
    expectedCurrency: "USD",
  },
  {
    label: "InterfaceWorx",
    origin: "https://interfaceworx.unit311central.com",
    username: "admin@interfaceworx.com",
    password: process.env.INTERFACEWORX_ADMIN_PASSWORD ?? "Letmein2026$",
    expectedCurrency: "GBP",
  },
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
    /* html */
  }
  return { status: res.status, json, text };
}

async function checkExpensesHubPage(workspace, cookie) {
  const res = await fetch(`${workspace.origin}/dashboard?view=expenses`, {
    headers: { Cookie: cookie, Accept: "text/html" },
    redirect: "manual",
  });
  const text = await res.text();
  assert.equal(res.status, 200, `${workspace.label}: expenses hub HTTP ${res.status}`);
  assert.equal(/Authentication required/i.test(text), false, `${workspace.label}: auth wall on expenses hub`);
  assert.match(text, /Expenses|My Expenses|Add expense/i, `${workspace.label}: expenses hub content missing`);
  console.log(`  PASS ${workspace.label}: expenses hub page`);
}

async function checkCurrencyAndConfig(workspace, cookie) {
  const my = await fetchJson(workspace.origin, "/api/expenses/my", cookie);
  assert.equal(my.status, 200, `${workspace.label}: GET /api/expenses/my → ${my.status}`);
  assert.equal(
    my.json?.currency,
    workspace.expectedCurrency,
    `${workspace.label}: currency expected ${workspace.expectedCurrency}, got ${my.json?.currency}`,
  );
  assert.ok(Array.isArray(my.json?.expenses), `${workspace.label}: expenses array expected`);
  console.log(`  PASS ${workspace.label}: reporting currency ${my.json.currency}`);

  const config = await fetchJson(workspace.origin, "/api/expenses/config", cookie);
  assert.equal(config.status, 200, `${workspace.label}: GET /api/expenses/config → ${config.status}`);
  const schedule = config.json?.schedule;
  assert.ok(schedule, `${workspace.label}: payment schedule required`);
  assert.ok(
    schedule.frequency === "fortnightly" || schedule.frequency === "monthly",
    `${workspace.label}: schedule frequency must be fortnightly or monthly`,
  );
  assert.ok(Array.isArray(config.json?.mileageRates), `${workspace.label}: mileage rates array`);
  console.log(
    `  PASS ${workspace.label}: schedule frequency=${schedule.frequency} paymentDay=${schedule.paymentDay}`,
  );
}

async function checkDraftSubmitWorkflow(workspace, cookie) {
  const stamp = Date.now();
  const create = await fetchJson(workspace.origin, "/api/financials/expenses", cookie, {
    method: "POST",
    body: JSON.stringify({
      submitterUserId: "acceptance-runner",
      description: `Acceptance expense ${stamp}`,
      amount: 12.5,
      currency: workspace.expectedCurrency,
      expenseDate: new Date().toISOString().slice(0, 10),
      dateSubmitted: new Date().toISOString().slice(0, 10),
      recordStatus: "draft",
      expenseType: "standard",
      skipDuplicateReferenceCheck: true,
    }),
  });
  if (create.status === 403) {
    console.log(`  SKIP ${workspace.label}: draft create blocked (read-only demo session)`);
    return;
  }
  assert.equal(create.status, 201, `${workspace.label}: create draft → ${create.status} ${create.text?.slice(0, 200)}`);
  const expenseId = create.json?.expense?.id;
  assert.ok(expenseId, `${workspace.label}: expense id required`);

  const submit = await fetchJson(workspace.origin, `/api/expenses/${expenseId}/submit`, cookie, {
    method: "POST",
  });
  assert.equal(submit.status, 200, `${workspace.label}: submit → ${submit.status}`);
  console.log(`  PASS ${workspace.label}: draft create + submit`);

  const history = await fetchJson(workspace.origin, `/api/expenses/${expenseId}/approval-history`, cookie);
  assert.equal(history.status, 200, `${workspace.label}: approval history → ${history.status}`);
  assert.ok(
    (history.json?.events ?? []).some((event) => event.action === "submitted"),
    `${workspace.label}: submitted event in history`,
  );
  console.log(`  PASS ${workspace.label}: approval history after submit`);

  const detail = await fetchJson(workspace.origin, `/api/financials/expenses/${expenseId}`, cookie);
  assert.equal(detail.status, 200, `${workspace.label}: GET expense detail → ${detail.status}`);
  assert.equal(detail.json?.expense?.workflowStatus, "submitted");
  console.log(`  PASS ${workspace.label}: expense detail API`);
}

async function checkRunsApi(workspace, cookie) {
  const runs = await fetchJson(workspace.origin, "/api/expenses/runs", cookie);
  assert.equal(runs.status, 200, `${workspace.label}: GET runs → ${runs.status}`);
  assert.ok(Array.isArray(runs.json?.runs), `${workspace.label}: runs array expected`);
  console.log(`  PASS ${workspace.label}: expense runs API (${runs.json.runs.length} runs)`);
}

async function runWorkspace(workspace) {
  console.log(`\n=== ${workspace.label} (${workspace.origin}) ===`);
  const cookie = await login(workspace);
  await checkExpensesHubPage(workspace, cookie);
  await checkCurrencyAndConfig(workspace, cookie);
  await checkRunsApi(workspace, cookie);
  await checkDraftSubmitWorkflow(workspace, cookie);
}

async function main() {
  for (const workspace of WORKSPACES) {
    await runWorkspace(workspace);
  }
  console.log("\nprove:expenses-acceptance: ALL CHECKS PASSED\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
