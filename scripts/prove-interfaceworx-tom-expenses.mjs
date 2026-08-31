/**
 * Production verification for InterfaceWorx Tom expense import.
 *
 * Usage: npm run prove:interfaceworx-tom-expenses
 */
import assert from "node:assert/strict";

const ORIGIN = "https://interfaceworx.unit311central.com";
const USERNAME = process.env.UNIT311_ADMIN_USERNAME ?? "admin@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const REF_PREFIX = "IW-TOM-2026-";
const EXPECTED_TOTAL = 2996.06;

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
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/dashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`InterfaceWorx login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Login succeeded but no session cookie");
  return cookie;
}

async function fetchJson(path, cookie) {
  const res = await fetch(`${ORIGIN}${path}`, {
    headers: { Cookie: cookie },
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    json = null;
  }
  return { status: res.status, json, text };
}

async function main() {
  const cookie = await login();

  const whoami = await fetchJson("/api/auth/whoami", cookie);
  assert.equal(whoami.status, 200, "whoami should succeed");
  const slug = String(whoami.json?.workspaceSlug ?? whoami.json?.workspace?.slug ?? "").toLowerCase();
  assert.equal(slug, "interfaceworx", `expected interfaceworx workspace, got ${slug || "(missing)"}`);

  const expensesRes = await fetchJson("/api/financials/expenses", cookie);
  assert.equal(expensesRes.status, 200, "expenses API should succeed");
  const expenses = expensesRes.json?.expenses ?? [];
  const tomRows = expenses.filter((row) =>
    String(row.reference ?? "").startsWith(REF_PREFIX),
  );
  assert.equal(tomRows.length, 12, `expected 12 Tom expense rows, found ${tomRows.length}`);
  const total = tomRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  assert.ok(
    Math.abs(total - EXPECTED_TOTAL) < 0.02,
    `Tom expense total should be ${EXPECTED_TOTAL}, got ${total.toFixed(2)}`,
  );
  assert.ok(
    tomRows.every((row) => String(row.currency).toUpperCase() === "GBP"),
    "Tom expenses must be GBP",
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: slug,
        tomExpenseCount: tomRows.length,
        tomExpenseTotal: total,
        currency: expensesRes.json?.currency ?? null,
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
