/**
 * CorpCentre-only: post GL journals for AP/expense rows missing journal_entry_id.
 * Unpaid: Dr expense / Cr AP 2000
 * Paid:   Dr expense / Cr Bank Cash AUD 1010
 *
 * Usage: node scripts/post-corpcentre-ap-expense-journals.mjs
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

const WID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const SOURCE_TYPE = "corpcentre_expense_seed";
const AP_CODE = "2000";
const CASH_CODE = "1010";

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

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
    .select("id, code, name, type")
    .eq("workspace_id", WID)
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
      workspace_id: WID,
    })
    .select("id, code, name, type")
    .single();
  if (error) throw new Error(`ensure ${code}: ${error.message}`);
  return data;
}

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WID).maybeSingle();
  if (!ws || !["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
    throw new Error("corpcentre workspace mismatch");
  }

  await ensureAccount(AP_CODE, "Accounts Payable", "liability");
  await ensureAccount(CASH_CODE, "Bank Cash AUD", "asset");

  const { data: expenses, error } = await admin
    .from("financial_expenses")
    .select(
      "id, amount, currency, paid, expense_date, date_submitted, purpose_description, category_account_code, reference, journal_entry_id",
    )
    .eq("workspace_id", WID)
    .order("expense_date", { ascending: true });
  if (error) throw new Error(error.message);

  const rows = expenses ?? [];
  let posted = 0;
  let skipped = 0;
  let expenseTotal = 0;

  for (const expense of rows) {
    const amount = Number(expense.amount) || 0;
    if (amount <= 0) {
      skipped += 1;
      continue;
    }
    expenseTotal += amount;

    const entryId = deterministicUuid(`${SOURCE_TYPE}:${expense.id}`);
    const journalDate = String(expense.expense_date || expense.date_submitted || "").slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(journalDate)) {
      skipped += 1;
      continue;
    }

    // Wipe prior seed journal for this expense (idempotent).
    await admin.from("journal_lines").delete().eq("journal_entry_id", entryId);
    await admin.from("journal_entries").delete().eq("id", entryId);
    if (expense.journal_entry_id && expense.journal_entry_id !== entryId) {
      await admin.from("journal_lines").delete().eq("journal_entry_id", expense.journal_entry_id);
      await admin.from("journal_entries").delete().eq("id", expense.journal_entry_id);
    }

    const expenseCode = String(expense.category_account_code || "5090");
    const expenseAccount = await ensureAccount(expenseCode, `Expense ${expenseCode}`, "expense");
    const creditAccount = expense.paid
      ? await accountByCode(CASH_CODE)
      : await accountByCode(AP_CODE);
    if (!creditAccount) throw new Error(`missing credit account for ${expense.id}`);

    const description =
      expense.purpose_description || expense.reference || `CorpCentre expense ${expense.id}`;

    const { error: entryErr } = await admin.from("journal_entries").insert({
      id: entryId,
      reference: expense.reference || `CC-EXP-${expense.id.slice(0, 8)}`,
      description: String(description).slice(0, 240),
      status: "posted",
      journal_date: journalDate,
      posted_at: `${journalDate}T12:00:00.000Z`,
      workspace_id: WID,
      source_type: SOURCE_TYPE,
      source_id: expense.id,
    });
    if (entryErr) throw new Error(`entry ${expense.id}: ${entryErr.message}`);

    const { error: linesErr } = await admin.from("journal_lines").insert([
      {
        id: randomUUID(),
        journal_entry_id: entryId,
        account_id: expenseAccount.id,
        debit: amount,
        credit: 0,
        description: String(description).slice(0, 240),
        workspace_id: WID,
      },
      {
        id: randomUUID(),
        journal_entry_id: entryId,
        account_id: creditAccount.id,
        debit: 0,
        credit: amount,
        description: expense.paid ? "Paid from Bank Cash AUD" : "Accounts payable",
        workspace_id: WID,
      },
    ]);
    if (linesErr) throw new Error(`lines ${expense.id}: ${linesErr.message}`);

    const { error: linkErr } = await admin
      .from("financial_expenses")
      .update({
        journal_entry_id: entryId,
        payment_journal_entry_id: expense.paid ? entryId : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", expense.id)
      .eq("workspace_id", WID);
    if (linkErr) throw new Error(`link ${expense.id}: ${linkErr.message}`);

    posted += 1;
  }

  // Recompute GL income/expense from lines for verification.
  const { data: accounts } = await admin
    .from("accounts")
    .select("id, type")
    .eq("workspace_id", WID);
  const acct = new Map((accounts ?? []).map((a) => [a.id, a.type]));
  const { data: lines } = await admin
    .from("journal_lines")
    .select("account_id, debit, credit")
    .eq("workspace_id", WID);

  let income = 0;
  let expensesGl = 0;
  for (const line of lines ?? []) {
    const type = acct.get(line.account_id);
    if (type === "income") income += Number(line.credit || 0) - Number(line.debit || 0);
    if (type === "expense") expensesGl += Number(line.debit || 0) - Number(line.credit || 0);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        posted,
        skipped,
        expenseRowsTotal: Math.round(expenseTotal * 100) / 100,
        glIncome: Math.round(income * 100) / 100,
        glExpenses: Math.round(expensesGl * 100) / 100,
        glNetProfit: Math.round((income - expensesGl) * 100) / 100,
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
