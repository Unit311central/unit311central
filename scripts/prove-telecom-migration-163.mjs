/**
 * Verify migration 163 (technology_telecom_services) is applied on production Supabase
 * and the Demo authenticated Telecom UI reads workspace-scoped rows from the central API.
 *
 * Usage: npm run prove:telecom-migration-163
 */
import assert from "node:assert/strict";

const DEMO = {
  origin: "https://demo.unit311central.com",
  username: "demo@unit311central.com",
  password: process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$",
};

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

async function login() {
  const res = await fetch(`${DEMO.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: DEMO.username,
      password: DEMO.password,
      returnTo: DEMO.origin,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Demo login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Demo login succeeded but no session cookie");
  return cookie;
}

async function fetchJson(path, cookie, init = {}) {
  const res = await fetch(`${DEMO.origin}${path}`, {
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

async function main() {
  console.log("prove:telecom-migration-163 — Demo production\n");
  const cookie = await login();
  console.log("  PASS Demo login");

  const telecom = await fetchJson("/api/technology/telecom", cookie);
  assert.equal(
    telecom.status,
    200,
    `GET /api/technology/telecom expected 200 (migration 163 applied), got ${telecom.status}: ${telecom.text.slice(0, 240)}`,
  );
  assert.ok(Array.isArray(telecom.json?.services), "services array required");
  assert.ok(
    telecom.json.services.length > 0,
    "expected starter telecom catalogue rows after migration 163",
  );
  assert.equal(
    String(telecom.json.services[0]?.currency ?? "").toUpperCase(),
    "USD",
    "Demo telecom rows must use workspace reporting currency USD",
  );
  console.log(
    `  PASS migration 163 live: ${telecom.json.services.length} telecom services (currency USD)`,
  );

  const page = await fetch(`${DEMO.origin}/dashboard?view=technology-telecommunications`, {
    headers: { Cookie: cookie, Accept: "text/html" },
    redirect: "manual",
  });
  const html = await page.text();
  assert.equal(page.status, 200, `Telecom UI HTTP ${page.status}`);
  assert.equal(/Authentication required/i.test(html), false, "Telecom UI auth wall");
  assert.match(html, /Telecommunications|Office fibre|Mobile plan/i, "Telecom UI content missing");
  console.log("  PASS Demo Telecom UI page loads");

  console.log("\nok  prove:telecom-migration-163 passed\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
