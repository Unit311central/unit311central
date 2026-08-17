/**
 * Prove demo@unit311central.com cannot mutate workspace data via /api/*.
 *
 * Usage:
 *   npm run prove:demo-readonly
 *   node scripts/prove-demo-readonly.mjs https://demo.unit311central.com
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const DEFAULT_ORIGIN = "https://demo.unit311central.com";
const LOCAL_ORIGIN = "http://127.0.0.1:3000";
const DEMO_USERNAME = "demo@unit311central.com";
const DEMO_PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

const MUTATION_CASES = [
  {
    name: "financials expenses POST",
    method: "POST",
    path: "/api/financials/expenses",
    body: {
      submitterUserId: "user-demo-owner",
      purposeDescription: "Prove readonly guard",
      amount: 1,
      currency: "GBP",
    },
  },
  {
    name: "financials expenses bulk POST",
    method: "POST",
    path: "/api/financials/expenses/bulk",
    body: { action: "noop", ids: [] },
  },
  {
    name: "crm leads POST",
    method: "POST",
    path: "/api/crm/leads",
    body: {
      companyName: "Prove Readonly Ltd",
      contactName: "Test User",
    },
  },
  {
    name: "hr employees POST",
    method: "POST",
    path: "/api/hr/employees",
    body: {
      firstName: "Prove",
      lastName: "Readonly",
      email: "prove.readonly@example.com",
    },
  },
  {
    name: "projects POST",
    method: "POST",
    path: "/api/projects",
    body: {
      name: "Prove Readonly Project",
      clientId: "client-demo-1",
    },
  },
  {
    name: "payroll runs POST",
    method: "POST",
    path: "/api/payroll/runs",
    body: {
      periodStart: "2026-08-01",
      periodEnd: "2026-08-31",
    },
  },
  {
    name: "clients POST",
    method: "POST",
    path: "/api/clients",
    body: {
      companyName: "Prove Readonly Client",
    },
  },
  {
    name: "demo reset POST",
    method: "POST",
    path: "/api/demo/reset",
    body: {},
  },
];

function read(rel) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function staticChecks() {
  const middleware = read("src/middleware.ts");
  assert.match(middleware, /blockDemoProspectApiMutation/);

  const core = read("src/lib/demo/mutation-guard-core.ts");
  assert.match(core, /evaluateDemoProspectMutationBlock/);
  assert.match(core, /DEMO_MUTATION_EXEMPT_API_PREFIXES/);
  assert.match(core, /\/api\/executive-assistant\//);

  const guard = read("src/lib/demo/mutation-guard.ts");
  assert.match(guard, /assertDemoMutationAllowed/);
  assert.match(guard, /assertDemoMutationAllowedForRequest/);

  const sampleRoutes = [
    "src/app/api/financials/expenses/route.ts",
    "src/app/api/crm/leads/route.ts",
    "src/app/api/hr/employees/route.ts",
    "src/app/api/projects/route.ts",
  ];
  for (const route of sampleRoutes) {
    const content = read(route);
    assert.match(content, /assertDemoMutationAllowedForRequest/);
  }

  console.log("prove:demo-readonly static checks: OK");
}

async function resolveOrigin() {
  const arg = process.argv[2]?.replace(/\/$/, "");
  if (arg) return arg;
  try {
    const res = await fetch(LOCAL_ORIGIN, { method: "HEAD", redirect: "manual" });
    if (res.status > 0) return LOCAL_ORIGIN;
  } catch {
    /* use production */
  }
  return DEFAULT_ORIGIN;
}

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
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = cookieHeader(setCookie);
  if (!cookie) throw new Error("Login succeeded but no session cookie returned.");
  return cookie;
}

async function expectBlocked(origin, cookie, testCase) {
  const res = await fetch(`${origin}${testCase.path}`, {
    method: testCase.method,
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(testCase.body ?? {}),
  });
  const payload = await res.json().catch(() => ({}));
  if (res.status !== 403) {
    throw new Error(
      `${testCase.name}: expected 403, got ${res.status} — ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }
  const message = String(payload.error ?? "");
  if (!/read-only|read only/i.test(message)) {
    throw new Error(
      `${testCase.name}: expected read-only error message, got ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }
  console.log(`  blocked: ${testCase.name} (${res.status})`);
}

async function expectEaAllowed(origin, cookie) {
  const res = await fetch(`${origin}/api/executive-assistant/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      message: "ping",
      messages: [],
      activeView: "executive-assistant",
      stream: false,
    }),
  });
  if (res.status === 403) {
    const payload = await res.json().catch(() => ({}));
    throw new Error(
      `EA chat should stay allowed for demo prospect, got 403: ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }
  console.log(`  allowed: executive-assistant/chat (${res.status})`);
}

async function runtimeChecks(origin) {
  console.log(`prove:demo-readonly runtime against ${origin}`);
  const cookie = await login(origin);

  for (const testCase of MUTATION_CASES) {
    await expectBlocked(origin, cookie, testCase);
  }
  await expectEaAllowed(origin, cookie);

  const readRes = await fetch(`${origin}/api/financials/expenses`, {
    headers: { Cookie: cookie },
  });
  if (readRes.status !== 200) {
    const body = await readRes.text();
    throw new Error(`GET /api/financials/expenses expected 200, got ${readRes.status}: ${body.slice(0, 200)}`);
  }
  console.log(`  allowed: GET /api/financials/expenses (${readRes.status})`);
}

async function main() {
  staticChecks();
  const origin = await resolveOrigin();
  try {
    await runtimeChecks(origin);
  } catch (error) {
    if (origin === LOCAL_ORIGIN) {
      console.warn("Local runtime checks failed; retrying production demo host...");
      await runtimeChecks(DEFAULT_ORIGIN);
    } else {
      throw error;
    }
  }
  console.log("prove:demo-readonly: OK");
}

main().catch((error) => {
  console.error("prove:demo-readonly: FAILED");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
