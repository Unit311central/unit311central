/**
 * ABHI-only: replace bulk AP seed expenses with realistic trade-association costs.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-realistic-expenses.mjs
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SLUG = "abhi";
const TAG = "ABHI realistic expense seed";
const LEGACY_AP_TAG = "ABHI AP seed";
const REF_PREFIX = "ABHI-EXP-";
const LEGACY_REF_PREFIX = "ABHI-AP-";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const weak =
      !value ||
      value === "[]" ||
      value.includes("SENSITIVE") ||
      value.startsWith("env_");
    if (!process.env[key] || (!weak && process.env[key]?.includes("SENSITIVE"))) {
      if (!weak) process.env[key] = value;
    }
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));
loadEnv(resolve(process.cwd(), ".env.corporatecentre.runtime"));

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Reference date: 2026-08-02 — expenses within last 60 days. */
const TODAY = new Date(Date.UTC(2026, 7, 2));

function isoDaysFromToday(days) {
  const d = new Date(TODAY);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const EXPENSES = [
  {
    supplier: "ExCeL London",
    purpose: "WHX 2026 stand deposit (50% holding fee)",
    amount: 2850,
    code: "5090",
    daysAgo: 12,
    paid: false,
  },
  {
    supplier: "Microsoft UK",
    purpose: "Microsoft 365 Business Premium — 18 seats",
    amount: 432,
    code: "5010",
    daysAgo: 5,
    paid: true,
  },
  {
    supplier: "EE Business",
    purpose: "Mobile fleet — executive team SIMs",
    amount: 186,
    code: "5020",
    daysAgo: 8,
    paid: true,
  },
  {
    supplier: "Levy Restaurants UK",
    purpose: "Spring policy roundtable venue catering",
    amount: 1240,
    code: "5090",
    daysAgo: 21,
    paid: false,
  },
  {
    supplier: "Printforce London",
    purpose: "WHX member pack print run (500 units)",
    amount: 675,
    code: "5090",
    daysAgo: 18,
    paid: false,
  },
  {
    supplier: "Great Western Railway",
    purpose: "Member engagement travel — Bristol & Cardiff",
    amount: 312,
    code: "5090",
    daysAgo: 34,
    paid: true,
  },
  {
    supplier: "DAC Beachcroft LLP",
    purpose: "Trade association legal retainer — Q3",
    amount: 8500,
    code: "5080",
    daysAgo: 28,
    paid: false,
  },
  {
    supplier: "Hiscox Insurance",
    purpose: "Directors & officers insurance instalment",
    amount: 1890,
    code: "5080",
    daysAgo: 42,
    paid: true,
  },
  {
    supplier: "Studio North Design",
    purpose: "New member welcome pack creative",
    amount: 1450,
    code: "5090",
    daysAgo: 15,
    paid: false,
  },
  {
    supplier: "Royal Mail Business",
    purpose: "Member correspondence postage",
    amount: 45,
    code: "5090",
    daysAgo: 3,
    paid: true,
  },
];

async function main() {
  if (FORBIDDEN.has(SLUG)) throw new Error(`Refusing forbidden slug ${SLUG}`);

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) throw new Error(`ABHI workspace missing: ${wsErr?.message || "not found"}`);
  if (FORBIDDEN.has(ws.slug)) throw new Error(`Refusing protected workspace ${ws.slug}`);

  const workspaceId = ws.id;

  await admin
    .from("financial_expenses")
    .delete()
    .eq("workspace_id", workspaceId)
    .ilike("purpose_description", `%${TAG}%`);
  await admin
    .from("financial_expenses")
    .delete()
    .eq("workspace_id", workspaceId)
    .ilike("purpose_description", `%${LEGACY_AP_TAG}%`);
  await admin
    .from("financial_expenses")
    .delete()
    .eq("workspace_id", workspaceId)
    .like("reference", `${REF_PREFIX}%`);
  await admin
    .from("financial_expenses")
    .delete()
    .eq("workspace_id", workspaceId)
    .like("reference", `${LEGACY_REF_PREFIX}%`);

  const rows = EXPENSES.map((item, index) => {
    const expenseDate = isoDaysFromToday(-item.daysAgo);
    return {
      id: randomUUID(),
      workspace_id: workspaceId,
      submitter_user_id: "abhi-expense-seed",
      submitter_name: "ABHI Finance",
      purpose_description: `${item.purpose} · ${TAG}`,
      amount: item.amount,
      currency: "GBP",
      date_submitted: expenseDate,
      expense_date: expenseDate,
      paid: item.paid,
      supplier: item.supplier,
      category_account_code: item.code,
      reference: `${REF_PREFIX}${String(index + 1).padStart(3, "0")}`,
    };
  });

  const { error } = await admin.from("financial_expenses").insert(rows);
  if (error) throw new Error(error.message);

  const { count: total } = await admin
    .from("financial_expenses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  const { count: unpaidCount } = await admin
    .from("financial_expenses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .eq("paid", false);
  const { data: unpaidRows } = await admin
    .from("financial_expenses")
    .select("amount")
    .eq("workspace_id", workspaceId)
    .eq("paid", false);
  const outstanding = (unpaidRows || []).reduce((sum, row) => sum + Number(row.amount || 0), 0);
  const { data: seededRows } = await admin
    .from("financial_expenses")
    .select("supplier, amount, paid, reference")
    .eq("workspace_id", workspaceId)
    .like("reference", `${REF_PREFIX}%`)
    .order("reference");

  for (const foreignSlug of ["unit311", "demo", "corpcentre"]) {
    const { data: foreignWs } = await admin
      .from("workspaces")
      .select("id")
      .eq("slug", foreignSlug)
      .maybeSingle();
    if (!foreignWs) continue;
    const { count: leak } = await admin
      .from("financial_expenses")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", foreignWs.id)
      .like("reference", `${REF_PREFIX}%`);
    if (leak) throw new Error(`Seed leak into ${foreignSlug}: ${leak}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        inserted: rows.length,
        expenses: total,
        unpaid: unpaidCount,
        outstandingGbp: Math.round(outstanding * 100) / 100,
        seeded: seededRows,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
