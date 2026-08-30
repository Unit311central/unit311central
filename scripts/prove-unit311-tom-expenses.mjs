/**
 * Production verification for unit311 Tom expense import + legacy BCN Tools nav.
 *
 * Usage: npm run prove:unit311-tom-expenses
 */
import assert from "node:assert/strict";

const INTERNAL_ORIGIN = "https://internal.unit311central.com";
const USERNAME = process.env.UNIT311_ADMIN_USERNAME ?? "admin@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const REF_PREFIX = "UNIT311-TOM-2026-";
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
  const res = await fetch(`${INTERNAL_ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: INTERNAL_ORIGIN,
      next: "/internaldashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Internal login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Internal login succeeded but no session cookie");
  return cookie;
}

async function fetchJson(path, cookie) {
  const res = await fetch(`${INTERNAL_ORIGIN}${path}`, {
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
  const slug = String(whoami.json?.workspace?.slug ?? "").toLowerCase();
  assert.equal(slug, "unit311", `expected unit311 workspace, got ${slug || "(missing)"}`);

  const navRes = await fetch(`${INTERNAL_ORIGIN}/api/internal/command-centre`, {
    headers: { Cookie: cookie },
  });
  assert.equal(navRes.status, 200, "command-centre should load");
  const navText = await navRes.text();
  assert.ok(!navText.includes('"view":"testing"'), "Tools must not expose testing view in payload");
  assert.ok(!navText.includes('"view":"telemetry"'), "Tools must not expose telemetry view in payload");

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

  const nonVat = tomRows.find((row) => String(row.reference).endsWith("03"));
  assert.ok(nonVat, "expense 03 should exist");
  assert.match(
    String(nonVat.description ?? nonVat.purposeDescription ?? ""),
    /non-vat reclaimable/i,
    "expense 03 must retain Non-VAT reclaimable note",
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
