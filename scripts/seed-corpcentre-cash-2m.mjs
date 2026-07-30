/**
 * Seed CorpCentre GL cash = AU$2,000,000 (opening equity journal).
 * Idempotent via source_type + source_id uniqueness.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const WORKSPACE_ID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const CASH_AUD = 2_000_000;
const SOURCE_TYPE = "corpcentre_opening_cash";
const SOURCE_ID = "corpcentre-aud-cash-2m";

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function accountByCode(code) {
  const { data, error } = await admin
    .from("accounts")
    .select("id, code, name, currency")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("id", WORKSPACE_ID)
    .maybeSingle();
  if (wsErr || !ws) throw new Error(`workspace missing: ${wsErr?.message || WORKSPACE_ID}`);
  if (!["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing non-corpcentre workspace slug=${ws.slug}`);
  }

  // Ensure cash + equity accounts exist (cloned COA may already have them).
  let cash = await accountByCode("1010");
  let equity = await accountByCode("3000");
  if (!cash) {
    const { data, error } = await admin
      .from("accounts")
      .insert({
        code: "1010",
        name: "Bank Cash AUD",
        type: "asset",
        currency: "AUD",
        is_active: true,
        workspace_id: WORKSPACE_ID,
      })
      .select("id, code, name, currency")
      .single();
    if (error) throw new Error(`cash account: ${error.message}`);
    cash = data;
  } else {
    await admin
      .from("accounts")
      .update({ name: "Bank Cash AUD", currency: "AUD", is_active: true })
      .eq("id", cash.id);
  }
  if (!equity) {
    const { data, error } = await admin
      .from("accounts")
      .insert({
        code: "3000",
        name: "Owner Equity",
        type: "equity",
        currency: "AUD",
        is_active: true,
        workspace_id: WORKSPACE_ID,
      })
      .select("id, code, name, currency")
      .single();
    if (error) throw new Error(`equity account: ${error.message}`);
    equity = data;
  }

  // Remove prior opening entry (and lines) if present.
  const { data: existing } = await admin
    .from("journal_entries")
    .select("id")
    .eq("workspace_id", WORKSPACE_ID)
    .eq("source_type", SOURCE_TYPE)
    .eq("source_id", SOURCE_ID)
    .maybeSingle();
  if (existing?.id) {
    await admin.from("journal_lines").delete().eq("journal_entry_id", existing.id);
    await admin.from("journal_entries").delete().eq("id", existing.id);
  }

  const entryId = randomUUID();
  const today = new Date().toISOString().slice(0, 10);
  const { error: entryErr } = await admin.from("journal_entries").insert({
    id: entryId,
    reference: "CC-OPEN-CASH-2M",
    description: "CorpCentre opening cash balance AU$2,000,000",
    status: "posted",
    journal_date: today,
    posted_at: new Date().toISOString(),
    workspace_id: WORKSPACE_ID,
    source_type: SOURCE_TYPE,
    source_id: SOURCE_ID,
  });
  if (entryErr) throw new Error(`journal entry: ${entryErr.message}`);

  const { error: linesErr } = await admin.from("journal_lines").insert([
    {
      id: randomUUID(),
      journal_entry_id: entryId,
      account_id: cash.id,
      debit: CASH_AUD,
      credit: 0,
      description: "Opening bank cash AUD",
      workspace_id: WORKSPACE_ID,
    },
    {
      id: randomUUID(),
      journal_entry_id: entryId,
      account_id: equity.id,
      debit: 0,
      credit: CASH_AUD,
      description: "Opening equity for cash",
      workspace_id: WORKSPACE_ID,
    },
  ]);
  if (linesErr) throw new Error(`journal lines: ${linesErr.message}`);

  // Zero other Wise cash codes so GL cash total aligns with the AU$2M fixture.
  for (const code of ["1000", "1020"]) {
    const other = await accountByCode(code);
    if (!other) continue;
    const { data: otherLines } = await admin
      .from("journal_lines")
      .select("id, journal_entry_id")
      .eq("workspace_id", WORKSPACE_ID)
      .eq("account_id", other.id);
    // Leave historical lines; overview/balances override cash for CorpCentre anyway.
    await admin
      .from("accounts")
      .update({ is_active: false })
      .eq("id", other.id);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: WORKSPACE_ID,
        cashAccountId: cash.id,
        equityAccountId: equity.id,
        cashAud: CASH_AUD,
        entryId,
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
