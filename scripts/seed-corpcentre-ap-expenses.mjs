/**
 * CorpCentre-only: seed Accounts Payable supplier expenses in AUD.
 * Does NOT touch Internal or Demo.
 *
 * Usage: node scripts/seed-corpcentre-ap-expenses.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : process.env[k] || "";
}

const SUPABASE_URL = env("SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
const WID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const SLUG = "corpcentre";
const TAG = "CorpCentre AP seed";

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isoDaysFromNow(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const SUPPLIERS = [
  { supplier: "Telstra Business", purpose: "Managed WAN circuits — Sydney HQ", amount: 18420, code: "5020" },
  { supplier: "Optus Enterprise", purpose: "Mobile fleet plans — field techs", amount: 9650, code: "5020" },
  { supplier: "Dell Technologies AU", purpose: "Laptop refresh batch — Q3", amount: 42800, code: "5010" },
  { supplier: "Microsoft AU", purpose: "M365 E5 licences — 48 seats", amount: 31200, code: "5010" },
  { supplier: "AWS Australia", purpose: "Cloud hosting — production AU", amount: 18750, code: "5010" },
  { supplier: "CBRE Facilities", purpose: "Sydney office facilities July", amount: 22400, code: "5080" },
  { supplier: "SecureCorp Guards", purpose: "After-hours security — Docklands NOC", amount: 8600, code: "5080" },
  { supplier: "Officeworks Business", purpose: "Stationery and consumables", amount: 1840, code: "5090" },
  { supplier: "Qantas Business", purpose: "Staff travel — Melb / Bris / Adel", amount: 7420, code: "5090" },
  { supplier: "Allens Linklaters", purpose: "Commercial counsel retainer", amount: 15000, code: "5080" },
  { supplier: "Pinnacle Insurance Brokers", purpose: "PI / cyber insurance instalment", amount: 27600, code: "5080" },
  { supplier: "Datacom AU", purpose: "SOC monitoring pass-through", amount: 19800, code: "5020" },
  { supplier: "Fujitsu Australia", purpose: "Storage array maintenance", amount: 13450, code: "5010" },
  { supplier: "City of Sydney", purpose: "Council rates — HQ premises", amount: 11200, code: "5080" },
  { supplier: "EnergyAustralia", purpose: "Electricity — Sydney HQ", amount: 6850, code: "5090" },
  { supplier: "Canva for Teams", purpose: "Design seats — marketing", amount: 2160, code: "5010" },
  { supplier: "Zoom Communications", purpose: "Enterprise video licences", amount: 3480, code: "5010" },
  { supplier: "Atlassian AU", purpose: "Jira / Confluence Cloud", amount: 5920, code: "5010" },
  { supplier: "CourierPlease", purpose: "Parts courier — national", amount: 2740, code: "5090" },
  { supplier: "Harvey Norman Commercial", purpose: "NOC display hardware", amount: 9800, code: "5010" },
];

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("slug", SLUG).maybeSingle();
  if (!ws || ws.id !== WID) throw new Error("corpcentre workspace mismatch");

  // Remove prior CorpCentre AP seed only.
  await admin.from("financial_expenses").delete().eq("workspace_id", WID).ilike("purpose_description", `%${TAG}%`);
  await admin.from("financial_expenses").delete().eq("workspace_id", WID).like("reference", "CC-AP-%");

  const rows = SUPPLIERS.map((item, index) => {
    const unpaid = index % 3 !== 0; // ~2/3 unpaid
    const overdue = unpaid && index % 5 === 1;
    const expenseDate = overdue
      ? isoDaysFromNow(-25 - (index % 10))
      : unpaid
        ? isoDaysFromNow(-3 - (index % 12))
        : isoDaysFromNow(-40 - (index % 20));
    return {
      id: randomUUID(),
      workspace_id: WID,
      submitter_user_id: "corpcentre-ap-seed",
      submitter_name: "CorpCentre Finance",
      purpose_description: `${item.purpose} · ${TAG}`,
      amount: item.amount,
      currency: "AUD",
      date_submitted: expenseDate,
      expense_date: expenseDate,
      paid: !unpaid,
      supplier: item.supplier,
      category_account_code: item.code,
      reference: `CC-AP-${String(index + 1).padStart(3, "0")}`,
    };
  });

  const { error } = await admin.from("financial_expenses").insert(rows);
  if (error) throw new Error(error.message);

  const { count } = await admin
    .from("financial_expenses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID);
  const { count: unpaid } = await admin
    .from("financial_expenses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WID)
    .eq("paid", false);
  const { data: unpaidRows } = await admin
    .from("financial_expenses")
    .select("amount")
    .eq("workspace_id", WID)
    .eq("paid", false);
  const outstanding = (unpaidRows || []).reduce((s, r) => s + Number(r.amount || 0), 0);

  // Safety: other workspaces untouched
  for (const slug of ["unit311", "demo"]) {
    const { data } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!data) continue;
    const { count: foreign } = await admin
      .from("financial_expenses")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", data.id)
      .like("reference", "CC-AP-%");
    if (foreign) throw new Error(`Leak into ${slug}: ${foreign}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        expenses: count,
        unpaid,
        outstandingAud: outstanding,
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
