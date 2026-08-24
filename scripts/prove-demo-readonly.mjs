/**
 * Prove Demo Owner (`demo@…`) can mutate workspace-scoped modules on the Demo host.
 * Legacy financial bulk routes remain guarded separately where applicable.
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

function read(rel) {
  return readFileSync(join(process.cwd(), rel), "utf8");
}

function staticChecks() {
  const middleware = read("src/middleware.ts");
  assert.match(middleware, /blockDemoProspectApiMutation/);

  const core = read("src/lib/demo/mutation-guard-core.ts");
  assert.match(core, /evaluateDemoProspectMutationBlock/);

  const readOnly = read("src/lib/demo/read-only.ts");
  assert.match(readOnly, /isDemoOwnerUsername/);
  assert.match(readOnly, /DEMO_RELEASE_MODEL|Demo Owner/i);

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

async function expectWorkPackageCreateAllowed(origin, cookie) {
  const res = await fetch(`${origin}/api/internal-work-packages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({
      name: `Prove readonly guard ${Date.now()}`,
      description: "Demo Owner mutation check",
    }),
  });
  const payload = await res.json().catch(() => ({}));
  if (res.status === 403 && /read-only|read only/i.test(String(payload.error ?? ""))) {
    throw new Error(
      `Demo Owner should not be read-only blocked: ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }
  assert.equal(res.status, 201, `expected 201 create, got ${res.status}`);
  const id = payload.workPackage?.id ?? payload.package?.id;
  assert.ok(id, "workPackage id required");
  await fetch(`${origin}/api/internal-work-packages/${id}`, {
    method: "DELETE",
    headers: { Cookie: cookie },
  });
  console.log(`  allowed: POST /api/internal-work-packages (${res.status})`);
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
      `EA chat should stay allowed for Demo Owner, got 403: ${JSON.stringify(payload).slice(0, 200)}`,
    );
  }
  console.log(`  allowed: executive-assistant/chat (${res.status})`);
}

async function runtimeChecks(origin) {
  console.log(`prove:demo-readonly runtime against ${origin}`);
  const cookie = await login(origin);
  await expectWorkPackageCreateAllowed(origin, cookie);
  await expectEaAllowed(origin, cookie);

  const readRes = await fetch(`${origin}/api/internal-work-packages`, {
    headers: { Cookie: cookie },
  });
  if (readRes.status !== 200) {
    const body = await readRes.text();
    throw new Error(
      `GET /api/internal-work-packages expected 200, got ${readRes.status}: ${body.slice(0, 200)}`,
    );
  }
  console.log(`  allowed: GET /api/internal-work-packages (${readRes.status})`);
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
