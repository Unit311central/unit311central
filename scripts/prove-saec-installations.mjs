/**
 * SAEC Installations acceptance (authenticated SAEC workspace).
 * Usage: npm run prove:saec-installations
 * Override: SAEC_DEMO_USERNAME / SAEC_DEMO_PASSWORD
 */
import assert from "node:assert/strict";

const SAEC = {
  origin: "https://saec.unit311central.com",
  username: process.env.SAEC_DEMO_USERNAME ?? "admin@saec.co.za",
  password:
    process.env.SAEC_DEMO_PASSWORD ??
    process.env.SAEC_INITIAL_ADMIN_PASSWORD ??
    "SaecDemo2026$",
};

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : setCookieHeaders ? [setCookieHeaders] : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

async function login() {
  const res = await fetch(`${SAEC.origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: SAEC.username,
      password: SAEC.password,
      returnTo: SAEC.origin,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login failed: ${JSON.stringify(body)}`);
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("login succeeded but no cookie");
  return cookie;
}

async function main() {
  console.log(`[prove:saec-installations] ${SAEC.origin}`);
  const cookie = await login();

  const dashPage = await fetch(`${SAEC.origin}/dashboard?view=saec-installations-dashboard`, {
    headers: { Cookie: cookie },
  });
  const dashHtml = await dashPage.text();
  assert.equal(dashPage.status, 200);
  assert.ok(dashHtml.includes("Installations"));
  assert.ok(
    dashHtml.includes("saec-installations-dashboard"),
    "dashboard route must resolve the SAEC installations view",
  );

  const elevatorApi = await fetch(`${SAEC.origin}/api/saec/installations/dashboard?assetType=elevator`, {
    headers: { Cookie: cookie },
  });
  const elevatorBody = await elevatorApi.json();
  assert.equal(elevatorApi.status, 200);
  assert.equal(elevatorBody.dashboard.kpis.total, 400);

  const escalatorApi = await fetch(`${SAEC.origin}/api/saec/installations/dashboard?assetType=escalator`, {
    headers: { Cookie: cookie },
  });
  const escalatorBody = await escalatorApi.json();
  assert.equal(escalatorApi.status, 200);
  assert.equal(escalatorBody.dashboard.kpis.total, 400);

  const assetsRes = await fetch(`${SAEC.origin}/api/saec/installations/assets?assetType=elevator`, {
    headers: { Cookie: cookie },
  });
  const assetsBody = await assetsRes.json();
  assert.equal(assetsRes.status, 200);
  assert.equal(assetsBody.assets.length, 400);

  console.log("[prove:saec-installations] PASS");
}

main().catch((error) => {
  console.error("[prove:saec-installations] FAIL", error);
  process.exit(1);
});
