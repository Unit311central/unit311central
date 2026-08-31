/**
 * Production verification for SAEC Discovery login.
 *
 * Usage: npm run prove:saec-discovery-login
 *
 * Env:
 *   SAEC_DISCOVERY_PASSWORD — defaults to baked-in discovery password
 */
import assert from "node:assert/strict";

const ORIGIN = process.env.SAEC_DISCOVERY_ORIGIN ?? "https://unit311central.com";
const USERNAME = "discovery@unit311central.com";
const PASSWORD = process.env.SAEC_DISCOVERY_PASSWORD ?? "SaecDiscovery2026$";

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

async function fetchAccess(origin, cookie) {
  const headers = cookie ? { Cookie: cookie } : {};
  const res = await fetch(`${origin}/api/saec-discovery/access`, { headers });
  return { status: res.status, json: await res.json().catch(() => ({})) };
}

async function main() {
  const access = await fetchAccess(ORIGIN);
  assert.equal(access.status, 200, "access API should succeed");
  assert.equal(access.json.allowed, false, "anonymous access must be denied in production");
  assert.equal(access.json.authRequired, true, "production must require auth");

  const loginRes = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      next: "/saec-discovery",
    }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  assert.equal(loginRes.status, 200, `login failed: ${JSON.stringify(loginBody).slice(0, 300)}`);
  const cookie = cookieHeader(loginRes.headers.getSetCookie?.() ?? []);
  assert.ok(cookie, "login succeeded but no session cookie");

  const whoamiRes = await fetch(`${ORIGIN}/api/auth/whoami`, {
    headers: { Cookie: cookie },
  });
  const whoami = await whoamiRes.json().catch(() => ({}));
  assert.equal(whoamiRes.status, 200, `whoami failed: ${JSON.stringify(whoami).slice(0, 300)}`);
  assert.equal(
    String(whoami.username ?? "").toLowerCase(),
    USERNAME,
    `expected ${USERNAME}, got ${whoami.username ?? "(missing)"}`,
  );
  assert.ok(whoami.userId, "whoami must include userId");

  const authedAccess = await fetchAccess(ORIGIN, cookie);
  assert.equal(authedAccess.json.allowed, true, "authenticated SAEC user must be allowed");
  assert.equal(authedAccess.json.authRequired, true, "auth remains required after login");

  const pageRes = await fetch(`${ORIGIN}/saec-discovery`, {
    headers: { Cookie: cookie },
  });
  assert.equal(pageRes.status, 200, "saec-discovery page should load for authed user");
  const html = await pageRes.text();
  assert.match(html, /Current Systems Discovery/i, "page should render discovery shell");

  console.log(
    JSON.stringify(
      {
        ok: true,
        origin: ORIGIN,
        username: USERNAME,
        userId: whoami.userId,
        redirectPath: loginBody.redirectPath ?? null,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
