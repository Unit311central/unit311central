/**
 * READ-ONLY Demo vs SAEC module/submodule parity audit (production).
 * Usage: SAEC_DEMO_PASSWORD='...' node scripts/audit-demo-saec-parity.mjs
 */
import assert from "node:assert/strict";

const DEMO = "https://demo.unit311central.com";
const SAEC = "https://saec.unit311central.com";

const DEMO_CREDS = {
  username: process.env.DEMO_USERNAME ?? "admin@demo.unit311central.com",
  password: process.env.DEMO_PASSWORD ?? process.env.SAEC_INITIAL_ADMIN_PASSWORD ?? "SaecDemo2026$",
};

const SAEC_CREDS = {
  username: process.env.SAEC_DEMO_USERNAME ?? "admin@saec.biz",
  password: process.env.SAEC_DEMO_PASSWORD ?? "",
};

function cookieHeader(setCookieHeaders) {
  const list = Array.isArray(setCookieHeaders) ? setCookieHeaders : setCookieHeaders ? [setCookieHeaders] : [];
  return list.map((raw) => raw.split(";")[0]).filter(Boolean).join("; ");
}

async function login(origin, creds) {
  const res = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: creds.username,
      password: creds.password,
      returnTo: origin,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`login failed ${origin}: ${JSON.stringify(body)}`);
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  return cookie;
}

async function whoami(origin, cookie) {
  const res = await fetch(`${origin}/api/auth/whoami`, { headers: { Cookie: cookie } });
  const body = await res.json();
  assert.equal(res.status, 200);
  return body;
}

async function main() {
  if (!SAEC_CREDS.password) throw new Error("SAEC_DEMO_PASSWORD required");

  const demoCookie = await login(DEMO, DEMO_CREDS);
  const saecCookie = await login(SAEC, SAEC_CREDS);

  const demo = await whoami(DEMO, demoCookie);
  const saec = await whoami(SAEC, saecCookie);

  const demoMods = demo.enabledModules?.length ?? 0;
  const demoSubs = demo.enabledSubModules?.length ?? 0;
  const saecMods = saec.enabledModules?.length ?? 0;
  const saecSubs = saec.enabledSubModules?.length ?? 0;

  console.log("[audit] Demo modules:", demoMods, "submodules:", demoSubs);
  console.log("[audit] SAEC modules:", saecMods, "submodules:", saecSubs);

  assert.equal(demoMods, 22, "Demo must have 22 modules");
  assert.equal(demoSubs, 157, "Demo must have 157 submodules");
  assert.equal(saecMods, 22, "SAEC must have 22 modules");
  assert.equal(saecSubs, 156, "SAEC must have 156 submodules");

  const demoSubsSet = new Set(demo.enabledSubModules ?? []);
  const saecSubsSet = new Set(saec.enabledSubModules ?? []);

  assert.ok(demoSubsSet.has("business-central:grants"), "Demo must include Grants");
  assert.equal(saecSubsSet.has("business-central:grants"), false, "SAEC must exclude Grants");

  const saecOnlyDiff = [...demoSubsSet].filter((k) => !saecSubsSet.has(k));
  const unexpected = saecOnlyDiff.filter((k) => k !== "business-central:grants");
  assert.equal(unexpected.length, 0, `Unexpected SAEC submodule gaps: ${unexpected.join(", ")}`);

  console.log("[audit] Expected gap only: business-central:grants");
  console.log("[audit] PASS — Demo unchanged structurally; SAEC = Demo minus Grants");
}

main().catch((error) => {
  console.error("[audit] FAIL", error);
  process.exit(1);
});
