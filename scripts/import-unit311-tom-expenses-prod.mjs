/**
 * Import Tom expenses on production internal workspace via authenticated Finance APIs.
 * Uses the same canonical create → submit → approve path as the UI.
 *
 * Usage: node scripts/import-unit311-tom-expenses-prod.mjs
 */
import assert from "node:assert/strict";

const ORIGIN = "https://internal.unit311central.com";
const USERNAME = process.env.UNIT311_ADMIN_USERNAME ?? "admin@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";
const REF_PREFIX = "UNIT311-TOM-2026-";
const EXPECTED_TOTAL = 2996.06;

const ROWS = [
  {
    reference: `${REF_PREFIX}01`,
    item: "Bambu Lab H2S Printer",
    description: "FDM Printer for Prototyping Activities",
    amount: 1425.84,
    expenseDate: "2026-07-02",
    supplier: "Bambu Lab",
    categoryKey: "equipment",
  },
  {
    reference: `${REF_PREFIX}02`,
    item: "Anycubic Photon P1, Anycubic Wash and Cure 3",
    description: "SLA Printer for Prototyping Activities",
    amount: 927.05,
    expenseDate: "2026-08-10",
    supplier: "Anycubic",
    categoryKey: "equipment",
  },
  {
    reference: `${REF_PREFIX}03`,
    item: "3D Resyns",
    description: "SLA Resin · Non-VAT reclaimable",
    amount: 323.0,
    expenseDate: "2026-08-10",
    supplier: "3D Resyns",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}04`,
    item: "interfaceworx.com cloudfare domain registration",
    description: "domain registration 2026 · Recurring — annual",
    amount: 7.7,
    expenseDate: "2026-08-20",
    supplier: "Cloudflare",
    categoryKey: "software",
  },
  {
    reference: `${REF_PREFIX}05`,
    item: "Zoho Email",
    description: "interfaceworx.com email server (2 x users) · Recurring — annual",
    amount: 28.8,
    expenseDate: "2026-08-21",
    supplier: "Zoho",
    categoryKey: "software",
  },
  {
    reference: `${REF_PREFIX}06`,
    item: "Thermometer, Filament, 3D printer Adhesive Glue",
    description: "Consumable (Prototyping)",
    amount: 56.96,
    expenseDate: "2026-06-30",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}07`,
    item: "Silicone",
    description: "Consumable (Prototyping)",
    amount: 24.62,
    expenseDate: "2026-05-29",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}08`,
    item: "Isomalt",
    description: "Consumable (Prototyping)",
    amount: 9.99,
    expenseDate: "2026-05-29",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}09`,
    item: "IPA, Steel Tube",
    description: "Consumable (Prototyping)",
    amount: 32.95,
    expenseDate: "2026-08-19",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}10`,
    item: "IPA (5L)",
    description: "Consumable (Prototyping)",
    amount: 23.95,
    expenseDate: "2026-08-18",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}11`,
    item: "Paint Stirers, Mixing Cups",
    description: "Consumable (Prototyping)",
    amount: 34.98,
    expenseDate: "2026-07-07",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
  {
    reference: `${REF_PREFIX}12`,
    item: "Silicone, Mould Release Spray, Mixing Cups",
    description: "Consumable (Prototyping)",
    amount: 100.22,
    expenseDate: "2026-07-08",
    supplier: "Amazon",
    categoryKey: "consumable_prototyping",
  },
];

const CATEGORY_SPECS = {
  equipment: { name: "Equipment", code: "EQUIPMENT", gl: "5090" },
  consumable_prototyping: {
    name: "Consumables (Prototyping)",
    code: "CONSUMABLE_PROTO",
    gl: "5090",
  },
  software: { name: "Software", code: "SOFTWARE", gl: "5010" },
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
  const res = await fetch(`${ORIGIN}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: USERNAME,
      password: PASSWORD,
      returnTo: ORIGIN,
      next: "/internaldashboard",
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Login failed ${res.status}: ${JSON.stringify(body).slice(0, 300)}`);
  }
  const cookie = cookieHeader(res.headers.getSetCookie?.() ?? []);
  if (!cookie) throw new Error("Login succeeded but no session cookie");
  return cookie;
}

async function api(cookie, path, init = {}) {
  const res = await fetch(`${ORIGIN}${path}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      Cookie: cookie,
      ...(init.headers ?? {}),
    },
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

function purpose(row) {
  return `${row.item} — ${row.description}`;
}

async function ensureCategories(cookie, categories) {
  const map = {};
  for (const [key, spec] of Object.entries(CATEGORY_SPECS)) {
    let match =
      categories.find((cat) => cat.code === spec.code) ??
      categories.find((cat) => String(cat.name).toLowerCase() === spec.name.toLowerCase());
    if (!match) {
      const created = await api(cookie, "/api/expenses/config", {
        method: "POST",
        body: JSON.stringify({
          action: "create_category",
          name: spec.name,
          code: spec.code,
          glAccountCode: spec.gl,
        }),
      });
      if (created.status !== 200) {
        throw new Error(`Failed to create category ${spec.name}: ${created.text.slice(0, 300)}`);
      }
      match = created.json?.category;
    }
    map[key] = match;
  }
  return map;
}

async function main() {
  const cookie = await login();

  const whoami = await api(cookie, "/api/auth/whoami");
  assert.equal(whoami.status, 200);
  assert.equal(String(whoami.json?.workspace?.slug ?? "").toLowerCase(), "unit311");

  const employeesRes = await api(cookie, "/api/hr/employees");
  assert.equal(employeesRes.status, 200);
  const employees = employeesRes.json?.employees ?? [];
  const tom = employees.filter((row) => /^tom\b/i.test(String(row.fullName ?? "")));
  assert.equal(tom.length, 1, `Expected one Tom employee, found ${tom.length}`);
  const tomEmployee = tom[0];

  const configRes = await api(cookie, "/api/expenses/config");
  assert.equal(configRes.status, 200);
  const categoryMap = await ensureCategories(cookie, configRes.json?.categories ?? []);

  const existingRes = await api(cookie, "/api/financials/expenses");
  assert.equal(existingRes.status, 200);
  const existingRefs = new Set(
    (existingRes.json?.expenses ?? [])
      .map((row) => String(row.reference ?? ""))
      .filter((ref) => ref.startsWith(REF_PREFIX)),
  );

  let created = 0;
  let skipped = 0;

  for (const row of ROWS) {
    if (existingRefs.has(row.reference)) {
      skipped += 1;
      continue;
    }

    const category = categoryMap[row.categoryKey];
    const createRes = await api(cookie, "/api/financials/expenses", {
      method: "POST",
      body: JSON.stringify({
        description: purpose(row),
        amount: row.amount,
        currency: "GBP",
        expenseDate: row.expenseDate,
        dateSubmitted: row.expenseDate,
        supplier: row.supplier,
        reference: row.reference,
        categoryAccountCode: category.glAccountCode ?? CATEGORY_SPECS[row.categoryKey].gl,
        expenseCategoryId: category.id,
        claimantEmployeeId: tomEmployee.id,
        reimbursable: true,
        submit: true,
      }),
    });
    if (createRes.status !== 200) {
      throw new Error(`Create failed for ${row.reference}: ${createRes.text.slice(0, 400)}`);
    }

    const expenseId = createRes.json?.expense?.id;
    assert.ok(expenseId, "expense id required");

    const approveRes = await api(cookie, `/api/expenses/${expenseId}/approve`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (approveRes.status !== 200) {
      throw new Error(`Approve failed for ${row.reference}: ${approveRes.text.slice(0, 400)}`);
    }

    created += 1;
  }

  const verifyRes = await api(cookie, "/api/financials/expenses");
  const tomRows = (verifyRes.json?.expenses ?? []).filter((row) =>
    String(row.reference ?? "").startsWith(REF_PREFIX),
  );
  const total = tomRows.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
  assert.equal(tomRows.length, 12);
  assert.ok(Math.abs(total - EXPECTED_TOTAL) < 0.02);

  console.log(
    JSON.stringify(
      {
        ok: true,
        created,
        skipped,
        tomEmployee: tomEmployee.fullName,
        tomExpenseCount: tomRows.length,
        tomExpenseTotal: total,
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
