/**
 * CorpCentre-only: seed random paid invoices for 2025 totaling exactly AU$2,000,000,
 * with matching posted GL revenue journals (Dr AR 1030 / Cr Professional Services 4010)
 * so Home / Financials / ledgers reflect the revenue.
 *
 * Usage: node scripts/seed-corpcentre-2025-revenue.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const WS = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const YEAR = 2025;
const TARGET_AUD = 2_000_000;
const SOURCE_TYPE = "corpcentre_revenue_seed";
const INVOICE_PREFIX = "CC25";
const PAY_REF_PREFIX = "INV-CC25";

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

function deterministicUuid(key) {
  const hex = createHash("sha256").update(key).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

async function accountByCode(code) {
  const { data, error } = await admin
    .from("accounts")
    .select("id, code, name")
    .eq("workspace_id", WS)
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function ensureAccount(code, name, type) {
  let row = await accountByCode(code);
  if (row) return row;
  const { data, error } = await admin
    .from("accounts")
    .insert({
      code,
      name,
      type,
      currency: "AUD",
      is_active: true,
      workspace_id: WS,
    })
    .select("id, code, name")
    .single();
  if (error) throw new Error(`ensure ${code}: ${error.message}`);
  return data;
}

function buildInvoicePlan(clients, rng) {
  // ~4–6 invoices per client across 2025 → ~80–120 invoices.
  const plan = [];
  for (const client of clients) {
    const count = 4 + Math.floor(rng() * 3); // 4–6
    for (let i = 0; i < count; i++) {
      const month = 1 + Math.floor(rng() * 12);
      const day = 1 + Math.floor(rng() * 27);
      const weight = 0.45 + rng() * 1.1; // relative size
      plan.push({
        client,
        month,
        day,
        weight,
        seq: plan.length + 1,
      });
    }
  }

  const totalWeight = plan.reduce((s, p) => s + p.weight, 0);
  let allocated = 0;
  for (let i = 0; i < plan.length; i++) {
    const isLast = i === plan.length - 1;
    const amount = isLast
      ? round2(TARGET_AUD - allocated)
      : round2((plan[i].weight / totalWeight) * TARGET_AUD);
    plan[i].amount = Math.max(amount, 50);
    allocated = round2(allocated + plan[i].amount);
  }

  // Fix float drift so total is exact.
  const drift = round2(TARGET_AUD - plan.reduce((s, p) => s + p.amount, 0));
  if (drift !== 0) {
    plan[plan.length - 1].amount = round2(plan[plan.length - 1].amount + drift);
  }

  return plan.sort((a, b) => a.month - b.month || a.day - b.day || a.seq - b.seq);
}

async function wipePriorSeed() {
  // Delete prior seeded invoices by payment_reference prefix.
  const { data: oldInvoices } = await admin
    .from("invoices")
    .select("id")
    .eq("workspace_id", WS)
    .like("payment_reference", `${PAY_REF_PREFIX}%`);
  if (oldInvoices?.length) {
    await admin
      .from("invoices")
      .delete()
      .in(
        "id",
        oldInvoices.map((r) => r.id),
      );
  }

  // Delete prior seed journals + lines by source_type.
  const { data: oldEntries } = await admin
    .from("journal_entries")
    .select("id")
    .eq("workspace_id", WS)
    .eq("source_type", SOURCE_TYPE);
  if (oldEntries?.length) {
    const ids = oldEntries.map((r) => r.id);
    await admin.from("journal_lines").delete().in("journal_entry_id", ids);
    await admin.from("journal_entries").delete().in("id", ids);
  }
}

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WS).maybeSingle();
  if (!ws || !["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing non-corpcentre workspace: ${ws?.slug}`);
  }

  const { data: clients, error: clientErr } = await admin
    .from("internal_clients")
    .select("id, company_name")
    .eq("workspace_id", WS)
    .order("company_name");
  if (clientErr) throw new Error(clientErr.message);
  if (!clients?.length) throw new Error("No CorpCentre clients found — run seed-corpcentre-au-business first");

  const ar = await ensureAccount("1030", "Accounts Receivable", "asset");
  const revenue = await ensureAccount("4010", "Professional Services", "income");

  await wipePriorSeed();

  const rng = mulberry32(2025_02_000);
  const plan = buildInvoicePlan(clients, rng);
  const total = round2(plan.reduce((s, p) => s + p.amount, 0));
  if (total !== TARGET_AUD) {
    throw new Error(`Plan total ${total} != ${TARGET_AUD}`);
  }

  // Group by month for one revenue recognition journal per month (cleaner GL).
  const byMonth = new Map();
  for (const item of plan) {
    const key = `${YEAR}-${String(item.month).padStart(2, "0")}`;
    const bucket = byMonth.get(key) ?? { month: key, amount: 0, invoices: [] };
    bucket.amount = round2(bucket.amount + item.amount);
    bucket.invoices.push(item);
    byMonth.set(key, bucket);
  }

  const monthJournalIds = new Map();
  for (const [monthKey, bucket] of [...byMonth.entries()].sort()) {
    const entryId = deterministicUuid(`${SOURCE_TYPE}:${monthKey}`);
    const journalDate = `${monthKey}-28`;
    const { error: entryErr } = await admin.from("journal_entries").insert({
      id: entryId,
      reference: `CC-REV-${monthKey.replace("-", "")}`,
      description: `CorpCentre ${YEAR} revenue recognition · ${monthKey}`,
      status: "posted",
      journal_date: journalDate,
      posted_at: `${journalDate}T12:00:00.000Z`,
      workspace_id: WS,
      source_type: SOURCE_TYPE,
      source_id: monthKey,
    });
    if (entryErr) throw new Error(`journal ${monthKey}: ${entryErr.message}`);

    const { error: linesErr } = await admin.from("journal_lines").insert([
      {
        id: randomUUID(),
        journal_entry_id: entryId,
        account_id: ar.id,
        debit: bucket.amount,
        credit: 0,
        description: `AR · ${monthKey} client billings`,
        workspace_id: WS,
      },
      {
        id: randomUUID(),
        journal_entry_id: entryId,
        account_id: revenue.id,
        debit: 0,
        credit: bucket.amount,
        description: `Professional services revenue · ${monthKey}`,
        workspace_id: WS,
      },
    ]);
    if (linesErr) throw new Error(`lines ${monthKey}: ${linesErr.message}`);
    monthJournalIds.set(monthKey, entryId);
  }

  // Insert invoices (mostly paid) linked to month journals.
  const invoiceRows = plan.map((item, index) => {
    const monthKey = `${YEAR}-${String(item.month).padStart(2, "0")}`;
    const issueDate = `${monthKey}-${String(item.day).padStart(2, "0")}`;
    const dueDay = Math.min(item.day + 14, 28);
    const dueDate = `${monthKey}-${String(dueDay).padStart(2, "0")}`;
    const num = `${INVOICE_PREFIX}${String(index + 1).padStart(4, "0")}`;
    const paid = index % 11 !== 0; // ~9% issued/outstanding for AR realism
    return {
      id: deterministicUuid(`invoice:${num}`),
      invoice_number: num,
      client_id: item.client.id,
      workspace_id: WS,
      issue_date: issueDate,
      due_date: dueDate,
      currency: "AUD",
      amount: item.amount,
      status: paid ? "paid" : "issued",
      payment_reference: `${PAY_REF_PREFIX}-${num}`,
      journal_entry_id: monthJournalIds.get(monthKey),
      payment_journal_entry_id: paid ? monthJournalIds.get(monthKey) : null,
      created_at: `${issueDate}T10:00:00.000Z`,
      updated_at: paid ? `${dueDate}T16:00:00.000Z` : `${issueDate}T10:00:00.000Z`,
    };
  });

  // Insert in chunks.
  for (let i = 0; i < invoiceRows.length; i += 40) {
    const chunk = invoiceRows.slice(i, i + 40);
    const { error } = await admin.from("invoices").insert(chunk);
    if (error) throw new Error(`invoices chunk ${i}: ${error.message}`);
  }

  const outstanding = round2(
    invoiceRows.filter((r) => r.status !== "paid").reduce((s, r) => s + Number(r.amount), 0),
  );
  const paidTotal = round2(
    invoiceRows.filter((r) => r.status === "paid").reduce((s, r) => s + Number(r.amount), 0),
  );

  console.log(
    JSON.stringify(
      {
        ok: true,
        clients: clients.length,
        invoices: invoiceRows.length,
        months: byMonth.size,
        totalAud: total,
        paidAud: paidTotal,
        outstandingAud: outstanding,
        sample: invoiceRows.slice(0, 3).map((r) => ({
          number: r.invoice_number,
          amount: r.amount,
          status: r.status,
          issue: r.issue_date,
        })),
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
