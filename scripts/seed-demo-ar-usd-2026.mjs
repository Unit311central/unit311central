/**
 * Demo-only: seed 20 USD AR invoices (Jan–Jul 2026) + GL journals + Wise matches,
 * and a matching set of USD AP expenses so Home / Financials / AR / AP populate.
 *
 * 15 paid invoices totaling exactly $500,000
 * 5 outstanding invoices totaling exactly $300,000
 * Linked 1:1 to 20 Demo clients
 *
 * Usage: node scripts/seed-demo-ar-usd-2026.mjs
 */
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DEMO_SLUG = "demo";
const SOURCE_TYPE = "demo_ar_usd_2026";
const INV_PREFIX = "DME26";
const PAY_REF_PREFIX = "INV-DME26";
const AP_REF_PREFIX = "AP-DME26";
const PAID_TOTAL = 500_000;
const OPEN_TOTAL = 300_000;
const AP_TOTAL = 120_000;

function round2(n) {
  return Math.round(n * 100) / 100;
}

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
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

function sqlStr(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function allocateAmounts(count, target, rng) {
  const weights = Array.from({ length: count }, () => 0.55 + rng() * 1.35);
  const totalWeight = weights.reduce((s, w) => s + w, 0);
  const amounts = [];
  let allocated = 0;
  for (let i = 0; i < count; i += 1) {
    const isLast = i === count - 1;
    const amount = isLast
      ? round2(target - allocated)
      : round2((weights[i] / totalWeight) * target);
    amounts.push(Math.max(amount, 100));
    allocated = round2(allocated + amounts[i]);
  }
  const drift = round2(target - amounts.reduce((s, a) => s + a, 0));
  if (drift !== 0) amounts[amounts.length - 1] = round2(amounts[amounts.length - 1] + drift);
  return amounts;
}

function queryLinked(sql) {
  const tmp = join(ROOT, ".tmp-demo-ar-query.sql");
  writeFileSync(tmp, sql, "utf8");
  const result = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", tmp],
    { cwd: ROOT, encoding: "utf8", shell: true },
  );
  try {
    unlinkSync(tmp);
  } catch {
    /* ignore */
  }
  const out = `${result.stdout || ""}\n${result.stderr || ""}`;
  if (result.status !== 0) {
    throw new Error(`supabase query failed: ${out.slice(0, 1200)}`);
  }
  const start = out.indexOf("{");
  if (start < 0) throw new Error(`No JSON in query output: ${out.slice(0, 400)}`);
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < out.length; i += 1) {
    const ch = out[i];
    if (inString) {
      if (escape) escape = false;
      else if (ch === "\\") escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      continue;
    }
    if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return JSON.parse(out.slice(start, i + 1));
    }
  }
  throw new Error("Failed to parse supabase JSON");
}

function daysInMonth(year, month) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function main() {
  const wsRows = queryLinked(
    `select id::text as id, slug from public.workspaces where slug = ${sqlStr(DEMO_SLUG)} limit 1`,
  ).rows;
  const ws = wsRows?.[0];
  if (!ws?.id || ws.slug !== DEMO_SLUG) {
    throw new Error("Demo workspace not found — refusing to seed");
  }
  const unit311 = queryLinked(
    `select id::text as id from public.workspaces where slug = 'unit311' limit 1`,
  ).rows?.[0];
  if (unit311?.id && unit311.id === ws.id) {
    throw new Error("Resolved workspace is unit311 — abort");
  }

  const clients = queryLinked(
    `select c.id, c.company_name
     from public.internal_clients c
     where c.workspace_id = '${ws.id}'::uuid
     order by c.company_name
     limit 20`,
  ).rows;
  if (!clients || clients.length < 20) {
    throw new Error(`Need 20 Demo clients, found ${clients?.length ?? 0}`);
  }

  const accounts = queryLinked(
    `select a.id::text as id, a.code
     from public.accounts a
     where a.workspace_id = '${ws.id}'::uuid
       and a.code in ('1000','1030','2000','4010','5010','5050','5090')`,
  ).rows;
  const byCode = Object.fromEntries((accounts || []).map((a) => [a.code, a.id]));
  for (const code of ["1000", "1030", "2000", "4010", "5010", "5050", "5090"]) {
    if (!byCode[code]) throw new Error(`Missing Demo account ${code}`);
  }

  const rng = mulberry32(2026_07_31);
  const paidAmounts = allocateAmounts(15, PAID_TOTAL, rng);
  const openAmounts = allocateAmounts(5, OPEN_TOTAL, rng);
  const apAmounts = allocateAmounts(8, AP_TOTAL, rng);

  /** @type {Array<{client: any, amount: number, paid: boolean, month: number, day: number, seq: number}>} */
  const plan = [];
  for (let i = 0; i < 20; i += 1) {
    const paid = i < 15;
    const amount = paid ? paidAmounts[i] : openAmounts[i - 15];
    const month = 1 + (i % 7); // Jan–Jul
    const maxDay = daysInMonth(2026, month);
    const day = 1 + Math.floor(rng() * Math.min(27, maxDay));
    plan.push({ client: clients[i], amount, paid, month, day, seq: i + 1 });
  }
  plan.sort((a, b) => a.month - b.month || a.day - b.day || a.seq - b.seq);

  const paidSum = round2(plan.filter((p) => p.paid).reduce((s, p) => s + p.amount, 0));
  const openSum = round2(plan.filter((p) => !p.paid).reduce((s, p) => s + p.amount, 0));
  if (paidSum !== PAID_TOTAL || openSum !== OPEN_TOTAL) {
    throw new Error(`Amount drift paid=${paidSum} open=${openSum}`);
  }

  const sql = [];
  sql.push("-- Demo AR/AP USD seed Jan–Jul 2026");
  sql.push("begin;");
  sql.push(`
update public.workspace_settings
set currency = 'USD'
where workspace_id = '${ws.id}'::uuid;
`);

  // Wipe prior seed (matches + invoices + journals + AP expenses with our prefixes).
  sql.push(`
delete from public.wise_payment_matches
where workspace_id = '${ws.id}'::uuid
  and invoice_id in (
    select id from public.invoices
    where workspace_id = '${ws.id}'::uuid
      and payment_reference like '${PAY_REF_PREFIX}%'
  );

delete from public.invoices
where workspace_id = '${ws.id}'::uuid
  and payment_reference like '${PAY_REF_PREFIX}%';

delete from public.financial_expenses
where workspace_id = '${ws.id}'::uuid
  and reference like '${AP_REF_PREFIX}%';

delete from public.journal_lines
where workspace_id = '${ws.id}'::uuid
  and journal_entry_id in (
    select id from public.journal_entries
    where workspace_id = '${ws.id}'::uuid
      and source_type = ${sqlStr(SOURCE_TYPE)}
  );

delete from public.journal_entries
where workspace_id = '${ws.id}'::uuid
  and source_type = ${sqlStr(SOURCE_TYPE)};
`);

  for (const item of plan) {
    const issueDate = `2026-${String(item.month).padStart(2, "0")}-${String(item.day).padStart(2, "0")}`;
    const dueDay = Math.min(item.day + 21, daysInMonth(2026, item.month));
    const dueDate = `2026-${String(item.month).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`;
    const num = `${INV_PREFIX}${String(item.seq).padStart(3, "0")}`;
    const invoiceId = deterministicUuid(`${SOURCE_TYPE}:invoice:${num}`);
    const issueJournalId = deterministicUuid(`${SOURCE_TYPE}:issue:${num}`);
    const payJournalId = deterministicUuid(`${SOURCE_TYPE}:pay:${num}`);
    const matchId = deterministicUuid(`${SOURCE_TYPE}:match:${num}`);

    sql.push(`
insert into public.journal_entries (
  id, reference, description, client_id, source_type, source_id, status, journal_date, posted_at, workspace_id
) values (
  '${issueJournalId}'::uuid,
  ${sqlStr(`DME-AR-${num}`)},
  ${sqlStr(`Invoice ${num} · ${item.client.company_name}`)},
  ${sqlStr(item.client.id)},
  ${sqlStr(SOURCE_TYPE)},
  ${sqlStr(`issue:${num}`)},
  'posted',
  ${sqlStr(issueDate)},
  ${sqlStr(`${issueDate}T12:00:00.000Z`)}::timestamptz,
  '${ws.id}'::uuid
);

insert into public.journal_lines (id, journal_entry_id, account_id, debit, credit, description, workspace_id) values
  ('${randomUUID()}'::uuid, '${issueJournalId}'::uuid, '${byCode["1030"]}'::uuid, ${item.amount}, 0, ${sqlStr(`AR · ${num}`)}, '${ws.id}'::uuid),
  ('${randomUUID()}'::uuid, '${issueJournalId}'::uuid, '${byCode["4010"]}'::uuid, 0, ${item.amount}, ${sqlStr(`Revenue · ${num}`)}, '${ws.id}'::uuid);
`);

    let paymentJournalSql = "null";
    if (item.paid) {
      const payDay = Math.min(dueDay + 3, daysInMonth(2026, item.month));
      const payDate = `2026-${String(item.month).padStart(2, "0")}-${String(payDay).padStart(2, "0")}`;
      sql.push(`
insert into public.journal_entries (
  id, reference, description, client_id, source_type, source_id, status, journal_date, posted_at, workspace_id
) values (
  '${payJournalId}'::uuid,
  ${sqlStr(`DME-PAY-${num}`)},
  ${sqlStr(`Payment ${num} · ${item.client.company_name}`)},
  ${sqlStr(item.client.id)},
  ${sqlStr(SOURCE_TYPE)},
  ${sqlStr(`pay:${num}`)},
  'posted',
  ${sqlStr(payDate)},
  ${sqlStr(`${payDate}T15:00:00.000Z`)}::timestamptz,
  '${ws.id}'::uuid
);

insert into public.journal_lines (id, journal_entry_id, account_id, debit, credit, description, workspace_id) values
  ('${randomUUID()}'::uuid, '${payJournalId}'::uuid, '${byCode["1000"]}'::uuid, ${item.amount}, 0, ${sqlStr(`Wise USD receipt · ${num}`)}, '${ws.id}'::uuid),
  ('${randomUUID()}'::uuid, '${payJournalId}'::uuid, '${byCode["1030"]}'::uuid, 0, ${item.amount}, ${sqlStr(`Clear AR · ${num}`)}, '${ws.id}'::uuid);
`);
      paymentJournalSql = `'${payJournalId}'::uuid`;
    }

    sql.push(`
insert into public.invoices (
  id, invoice_number, client_id, workspace_id, issue_date, due_date, currency, amount, status,
  payment_reference, journal_entry_id, payment_journal_entry_id, created_at, updated_at
) values (
  '${invoiceId}'::uuid,
  ${sqlStr(num)},
  ${sqlStr(item.client.id)},
  '${ws.id}'::uuid,
  ${sqlStr(issueDate)},
  ${sqlStr(dueDate)},
  'USD',
  ${item.amount},
  ${sqlStr(item.paid ? "paid" : "issued")},
  ${sqlStr(`${PAY_REF_PREFIX}-${num}`)},
  '${issueJournalId}'::uuid,
  ${paymentJournalSql},
  ${sqlStr(`${issueDate}T10:00:00.000Z`)}::timestamptz,
  ${sqlStr(`${issueDate}T10:00:00.000Z`)}::timestamptz
);
`);

    if (item.paid) {
      const payDay = Math.min(dueDay + 3, daysInMonth(2026, item.month));
      const payDate = `2026-${String(item.month).padStart(2, "0")}-${String(payDay).padStart(2, "0")}`;
      sql.push(`
insert into public.wise_payment_matches (
  id, wise_transaction_id, invoice_id, journal_entry_id, amount, currency, matched_at, workspace_id
) values (
  '${matchId}'::uuid,
  ${sqlStr(`wise-demo-${num}`)},
  '${invoiceId}'::uuid,
  '${payJournalId}'::uuid,
  ${item.amount},
  'USD',
  ${sqlStr(`${payDate}T15:05:00.000Z`)}::timestamptz,
  '${ws.id}'::uuid
);
`);
    }
  }

  // AP expenses (USD) so Accounts Payable / expense burn populate.
  const apCategories = ["5010", "5050", "5090", "5010", "5050", "5090", "5010", "5050"];
  const apSuppliers = [
    "AWS",
    "Stripe Atlas Counsel",
    "Notion",
    "Google Workspace",
    "Deloitte Advisory",
    "Figma",
    "Cloudflare",
    "Wilson Sonsini",
  ];
  for (let i = 0; i < apAmounts.length; i += 1) {
    const amount = apAmounts[i];
    const month = 1 + (i % 7);
    const day = 5 + i * 2;
    const maxDay = daysInMonth(2026, month);
    const expenseDate = `2026-${String(month).padStart(2, "0")}-${String(Math.min(day, maxDay)).padStart(2, "0")}`;
    const ref = `${AP_REF_PREFIX}-${String(i + 1).padStart(3, "0")}`;
    const expenseId = deterministicUuid(`${SOURCE_TYPE}:ap:${ref}`);
    const journalId = deterministicUuid(`${SOURCE_TYPE}:apj:${ref}`);
    const code = apCategories[i];
    const paid = i < 5;
    sql.push(`
insert into public.journal_entries (
  id, reference, description, source_type, source_id, status, journal_date, posted_at, workspace_id
) values (
  '${journalId}'::uuid,
  ${sqlStr(ref)},
  ${sqlStr(`AP ${apSuppliers[i]} · ${ref}`)},
  ${sqlStr(SOURCE_TYPE)},
  ${sqlStr(`ap:${ref}`)},
  'posted',
  ${sqlStr(expenseDate)},
  ${sqlStr(`${expenseDate}T11:00:00.000Z`)}::timestamptz,
  '${ws.id}'::uuid
);

insert into public.journal_lines (id, journal_entry_id, account_id, debit, credit, description, workspace_id) values
  ('${randomUUID()}'::uuid, '${journalId}'::uuid, '${byCode[code]}'::uuid, ${amount}, 0, ${sqlStr(apSuppliers[i])}, '${ws.id}'::uuid),
  ('${randomUUID()}'::uuid, '${journalId}'::uuid, '${byCode[paid ? "1000" : "2000"]}'::uuid, 0, ${amount}, ${sqlStr(paid ? "Paid from Wise USD" : "AP accrual")}, '${ws.id}'::uuid);

insert into public.financial_expenses (
  id, submitter_user_id, submitter_name, purpose_description, amount, currency, date_submitted, paid,
  supplier, category_account_code, expense_date, reference, journal_entry_id, payment_journal_entry_id, workspace_id
) values (
  '${expenseId}'::uuid,
  'user-admin',
  'Admin',
  ${sqlStr(`${apSuppliers[i]} operating expense`)},
  ${amount},
  'USD',
  ${sqlStr(expenseDate)},
  ${paid},
  ${sqlStr(apSuppliers[i])},
  ${sqlStr(code)},
  ${sqlStr(expenseDate)},
  ${sqlStr(ref)},
  '${journalId}'::uuid,
  ${paid ? `'${journalId}'::uuid` : "null"},
  '${ws.id}'::uuid
);
`);
  }

  sql.push("commit;");

  const outDir = join(ROOT, "scripts");
  const sqlPath = join(outDir, "_demo-ar-usd-2026.sql");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(sqlPath, sql.join("\n"), "utf8");

  const apply = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", sqlPath],
    { cwd: ROOT, encoding: "utf8", shell: true },
  );
  if (apply.status !== 0) {
    throw new Error(`Apply failed: ${(apply.stdout || "") + (apply.stderr || "")}`.slice(0, 2000));
  }

  const verify = queryLinked(`
select
  count(*)::int as invoices,
  count(*) filter (where status = 'paid')::int as paid_count,
  count(*) filter (where status in ('issued','overdue'))::int as open_count,
  coalesce(sum(amount) filter (where status = 'paid'), 0)::numeric as paid_total,
  coalesce(sum(amount) filter (where status in ('issued','overdue')), 0)::numeric as open_total
from public.invoices
where workspace_id = '${ws.id}'::uuid
  and payment_reference like '${PAY_REF_PREFIX}%';
`);

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: ws.id,
        sqlPath,
        invoices: verify.rows?.[0],
        apExpenses: apAmounts.length,
        apTotalUsd: AP_TOTAL,
        sample: plan.slice(0, 3).map((p) => ({
          client: p.client.company_name,
          amount: p.amount,
          paid: p.paid,
          month: p.month,
        })),
      },
      null,
      2,
    ),
  );
}

main();
