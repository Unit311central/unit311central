/**
 * ABHI-only ops seed: salaries, clients Active, projects, AR/AP/cash.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-ops-data.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
  : fs.existsSync(path.join(root, ".env.unit311central.prod"))
    ? fs.readFileSync(path.join(root, ".env.unit311central.prod"), "utf8")
    : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

const SALARY = 100_000;
const BONUS = 5_000;
const EFFECTIVE = "2026-01-01";
const CASH = 4_242_957;
const DEBTORS = 3_988_245;
const CREDITORS = 7_605_083;
const FIXED_ASSETS = 2_449; // so net assets = 628,568
const REVENUE_YTD = 2_000_000;
const EXTERNAL_PROJECT_VALUE = 500_000;

/** Effective UK 2025/26 rates for ~£100k salary (flat-% payroll engine). */
const UK_PAYE_PCT = 27.4; // federal_tax_pct → PAYE
const UK_EMPLOYEE_NI_PCT = 4.0; // social_security_pct → Employee NI
const UK_EMPLOYER_NI_PCT = 14.25; // employer_payroll_pct → Employer NI

const CASH_SOURCE = "abhi_ops_opening_cash";
const FA_SOURCE = "abhi_ops_opening_fa";
const AR_SOURCE = "abhi_ops_ar";
const REVENUE_SOURCE = "abhi_ops_revenue";
const AP_TAG = "ABHI AP seed";
const INV_PREFIX = "ABHI-AR";
const AP_REF_PREFIX = "ABHI-AP-";
const PROJECT_PREFIX = "abhi-proj-";

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

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function accountByCode(workspaceId, code) {
  const { data, error } = await admin
    .from("accounts")
    .select("id, code, name, currency")
    .eq("workspace_id", workspaceId)
    .eq("code", code)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function ensureAccount(workspaceId, code, name, type) {
  let row = await accountByCode(workspaceId, code);
  if (row) {
    await admin
      .from("accounts")
      .update({ name, currency: "GBP", is_active: true })
      .eq("id", row.id)
      .eq("workspace_id", workspaceId);
    return row;
  }
  const { data, error } = await admin
    .from("accounts")
    .insert({
      code,
      name,
      type,
      currency: "GBP",
      is_active: true,
      workspace_id: workspaceId,
    })
    .select("id, code, name, currency")
    .single();
  if (error) throw new Error(`ensure ${code}: ${error.message}`);
  return data;
}

async function wipeJournalSource(workspaceId, sourceType) {
  const { data: old } = await admin
    .from("journal_entries")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("source_type", sourceType);
  if (!old?.length) return;
  const ids = old.map((r) => r.id);
  await admin.from("journal_lines").delete().in("journal_entry_id", ids);
  await admin.from("journal_entries").delete().in("id", ids);
}

async function postSimpleJournal({
  workspaceId,
  sourceType,
  sourceId,
  reference,
  description,
  journalDate,
  debitAccountId,
  creditAccountId,
  amount,
  debitDesc,
  creditDesc,
  wipeSource = true,
}) {
  if (wipeSource) await wipeJournalSource(workspaceId, sourceType);
  const entryId = randomUUID();
  const { error: entryErr } = await admin.from("journal_entries").insert({
    id: entryId,
    reference,
    description,
    status: "posted",
    journal_date: journalDate,
    posted_at: new Date().toISOString(),
    workspace_id: workspaceId,
    source_type: sourceType,
    source_id: sourceId,
  });
  if (entryErr) throw new Error(`journal ${reference}: ${entryErr.message}`);
  const { error: linesErr } = await admin.from("journal_lines").insert([
    {
      id: randomUUID(),
      journal_entry_id: entryId,
      account_id: debitAccountId,
      debit: amount,
      credit: 0,
      description: debitDesc,
      workspace_id: workspaceId,
    },
    {
      id: randomUUID(),
      journal_entry_id: entryId,
      account_id: creditAccountId,
      debit: 0,
      credit: amount,
      description: creditDesc,
      workspace_id: workspaceId,
    },
  ]);
  if (linesErr) throw new Error(`journal lines ${reference}: ${linesErr.message}`);
  return entryId;
}

/** Canonical Jan–Aug 2026 membership income split (£2m) — revenue in every month through July plus open August. */
const MONTHLY_REVENUE = [
  { month: "2026-01", day: "31", amount: 240_000 },
  { month: "2026-02", day: "28", amount: 250_000 },
  { month: "2026-03", day: "31", amount: 270_000 },
  { month: "2026-04", day: "30", amount: 265_000 },
  { month: "2026-05", day: "31", amount: 280_000 },
  { month: "2026-06", day: "30", amount: 275_000 },
  { month: "2026-07", day: "31", amount: 280_000 },
  { month: "2026-08", day: "01", amount: 140_000 },
];

async function main() {
  if (FORBIDDEN.has(SLUG)) throw new Error(`Refusing forbidden slug ${SLUG}`);

  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws?.id) throw new Error(`ABHI workspace missing: ${wsErr?.message || "not found"}`);
  if (FORBIDDEN.has(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing protected workspace ${ws.slug}`);
  }
  const WS = ws.id;
  console.log("ABHI workspace", WS);

  // ——— 1) HR salaries ———
  console.log("Updating employee salaries…");
  const { data: employees, error: empErr } = await admin
    .from("hr_employees")
    .select("id, full_name, email, employee_number, department, manager, date_joined, end_date")
    .eq("workspace_id", WS);
  if (empErr) throw new Error(empErr.message);
  if (!employees?.length) throw new Error("No ABHI employees");

  await admin.from("payroll_settings").upsert(
    {
      workspace_id: WS,
      default_currency: "GBP",
      payroll_frequency: "monthly",
      pay_day: 28,
      bonus_pay_month: 12,
      bonus_pay_day: 31,
      country_code: "GB",
      default_tax_state: "ENG",
      // UK mapping on US-shaped columns: PAYE / Employee NI / Employer NI.
      federal_tax_pct: UK_PAYE_PCT,
      state_tax_pct: 0,
      social_security_pct: UK_EMPLOYEE_NI_PCT,
      medicare_pct: 0,
      employer_payroll_pct: UK_EMPLOYER_NI_PCT,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );

  await admin.from("hr_employee_compensation_history").delete().eq("workspace_id", WS);

  const monthly = round2(SALARY / 12);
  // Dashboard AP payroll liability = gross + employer NI (net + PAYE/NI + employer NI).
  const employerNiMonthly = round2(monthly * (UK_EMPLOYER_NI_PCT / 100));
  const employeeTaxMonthly = round2(
    monthly * ((UK_PAYE_PCT + UK_EMPLOYEE_NI_PCT) / 100),
  );
  const netMonthly = round2(monthly - employeeTaxMonthly);
  const payrollLiability = round2((monthly + employerNiMonthly) * employees.length);

  for (const employee of employees) {
    const { error } = await admin
      .from("hr_employees")
      .update({
        currency: "GBP",
        salary_current: SALARY,
        bonus: BONUS,
        pay_frequency: "monthly",
        salary_previous: 0,
        salary_increase_amount: 0,
        salary_increase_date: EFFECTIVE,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employee.id)
      .eq("workspace_id", WS);
    if (error) throw new Error(`salary ${employee.full_name}: ${error.message}`);

    const { error: histErr } = await admin.from("hr_employee_compensation_history").insert([
      {
        id: randomUUID(),
        workspace_id: WS,
        employee_id: employee.id,
        category: "salary",
        amount: SALARY,
        currency: "GBP",
        effective_date: EFFECTIVE,
        reason: `Annual salary · paid monthly (£${monthly.toLocaleString("en-GB")}/mo) · UK PAYE/NI applied`,
        created_at: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        workspace_id: WS,
        employee_id: employee.id,
        category: "bonus",
        amount: BONUS,
        currency: "GBP",
        effective_date: EFFECTIVE,
        reason: "Annual bonus · paid end of year (December) · subject to UK PAYE/NI",
        created_at: new Date().toISOString(),
      },
    ]);
    if (histErr) throw new Error(`comp history ${employee.full_name}: ${histErr.message}`);

    const { data: existingProfile } = await admin
      .from("payroll_employee_profiles")
      .select("id")
      .eq("workspace_id", WS)
      .eq("employee_id", employee.id)
      .maybeSingle();

    const { error: profileErr } = await admin.from("payroll_employee_profiles").upsert(
      {
        id: existingProfile?.id || randomUUID(),
        workspace_id: WS,
        employee_id: employee.id,
        annual_salary: SALARY,
        monthly_salary: monthly,
        bonus: BONUS,
        commission: 0,
        payroll_frequency: "monthly",
        currency: "GBP",
        tax_state: "ENG",
        // Inherit workspace UK rates (null = use payroll_settings).
        federal_tax_pct: null,
        state_tax_pct: null,
        social_security_pct: null,
        medicare_pct: null,
        employer_payroll_pct: null,
        payroll_status: "active",
        bank_account: "",
        routing_number: "",
        payroll_employee_id: employee.employee_number || employee.id,
        tax_id: "",
        hire_date: employee.date_joined || EFFECTIVE,
        termination_date: employee.end_date || null,
        manager: employee.manager || "",
        department: employee.department || "ABHI",
        cost_centre: employee.department || "ABHI",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id,employee_id" },
    );
    if (profileErr) throw new Error(`payroll profile ${employee.full_name}: ${profileErr.message}`);
  }
  console.log(
    `Salaries set for ${employees.length} employees (monthly gross £${monthly}; PAYE+NI £${employeeTaxMonthly}; employer NI £${employerNiMonthly}; net £${netMonthly}; payroll liability ~£${payrollLiability})`,
  );

  // ——— 2) Clients → Active ———
  console.log("Setting clients Active…");
  const { error: clientStatusErr } = await admin
    .from("internal_clients")
    .update({ account_status: "Active" })
    .eq("workspace_id", WS)
    .neq("account_status", "Archived");
  if (clientStatusErr) throw new Error(clientStatusErr.message);

  const { data: clients } = await admin
    .from("internal_clients")
    .select("id, company_name, region")
    .eq("workspace_id", WS)
    .eq("account_status", "Active")
    .order("company_name")
    .limit(20);
  if (!clients?.length) throw new Error("No active ABHI clients after update");

  // ——— 3) Projects ———
  console.log("Seeding projects…");
  await admin.from("internal_projects").delete().eq("workspace_id", WS);

  const externalValues = [120_000, 110_000, 95_000, 90_000, 85_000]; // = 500,000
  if (externalValues.reduce((s, n) => s + n, 0) !== EXTERNAL_PROJECT_VALUE) {
    throw new Error("External project values must sum to 500000");
  }

  const projectRows = [
    {
      id: deterministicUuid("abhi-proj-int-membership-ops"),
      workspace_id: WS,
      name: "Membership Operations Hub",
      client_id: null,
      client_name: "ABHI Internal",
      site: "London",
      region: "United Kingdom",
      operator: "Jane Lewis",
      phase: "live",
      start_date: "2026-01-15",
      end_date: "2026-09-30",
      progress_pct: 62,
      notes: "Internal · Active membership ops programme",
    },
    {
      id: deterministicUuid("abhi-proj-int-policy-insight"),
      workspace_id: WS,
      name: "Policy & Market Access Insight",
      client_id: null,
      client_name: "ABHI Internal",
      site: "London",
      region: "United Kingdom",
      operator: "Richard Phillips",
      phase: "live",
      start_date: "2026-03-01",
      end_date: "2026-10-31",
      progress_pct: 48,
      notes: "Internal · Active policy insight programme",
    },
    {
      id: deterministicUuid("abhi-proj-ext-overdue"),
      workspace_id: WS,
      name: `${clients[0].company_name} — Market Access Programme`,
      client_id: clients[0].id,
      client_name: clients[0].company_name,
      site: "United Kingdom",
      region: "United Kingdom",
      operator: "Paul Benton",
      phase: "live",
      start_date: "2025-11-01",
      end_date: "2026-07-15",
      progress_pct: 88,
      notes: `External · Active · Contract value £${externalValues[0].toLocaleString("en-GB")} · OVERDUE`,
    },
    {
      id: deterministicUuid("abhi-proj-ext-aug"),
      workspace_id: WS,
      name: `${clients[1].company_name} — Regulatory Readiness`,
      client_id: clients[1].id,
      client_name: clients[1].company_name,
      site: "United Kingdom",
      region: "United Kingdom",
      operator: "Phil Brown",
      phase: "live",
      start_date: "2026-02-01",
      end_date: "2026-08-22",
      progress_pct: 71,
      notes: `External · Active · Contract value £${externalValues[1].toLocaleString("en-GB")} · Due August`,
    },
    {
      id: deterministicUuid("abhi-proj-ext-sep-1"),
      workspace_id: WS,
      name: `${clients[2].company_name} — International Accelerator`,
      client_id: clients[2].id,
      client_name: clients[2].company_name,
      site: "United Kingdom",
      region: "United Kingdom",
      operator: "Bayode Adisa",
      phase: "live",
      start_date: "2026-04-01",
      end_date: "2026-09-12",
      progress_pct: 55,
      notes: `External · Active · Contract value £${externalValues[2].toLocaleString("en-GB")} · Due September`,
    },
    {
      id: deterministicUuid("abhi-proj-ext-sep-2"),
      workspace_id: WS,
      name: `${clients[3].company_name} — Digital Health Adoption`,
      client_id: clients[3].id,
      client_name: clients[3].company_name,
      site: "United Kingdom",
      region: "United Kingdom",
      operator: "Andrew Davies",
      phase: "live",
      start_date: "2026-05-01",
      end_date: "2026-09-18",
      progress_pct: 40,
      notes: `External · Active · Contract value £${externalValues[3].toLocaleString("en-GB")} · Due September`,
    },
    {
      id: deterministicUuid("abhi-proj-ext-sep-3"),
      workspace_id: WS,
      name: `${clients[4].company_name} — Value & Access Partnership`,
      client_id: clients[4].id,
      client_name: clients[4].company_name,
      site: "United Kingdom",
      region: "United Kingdom",
      operator: "Luella Trickett",
      phase: "live",
      start_date: "2026-06-01",
      end_date: "2026-09-28",
      progress_pct: 33,
      notes: `External · Active · Contract value £${externalValues[4].toLocaleString("en-GB")} · Due September`,
    },
  ];

  const { error: projErr } = await admin.from("internal_projects").insert(projectRows);
  if (projErr) throw new Error(`projects: ${projErr.message}`);

  // Sync active_projects counts on linked clients
  const countsByClient = new Map();
  for (const p of projectRows) {
    if (!p.client_id) continue;
    countsByClient.set(p.client_id, (countsByClient.get(p.client_id) || 0) + 1);
  }
  for (const [clientId, count] of countsByClient) {
    await admin
      .from("internal_clients")
      .update({ active_projects: count })
      .eq("id", clientId)
      .eq("workspace_id", WS);
  }

  // ——— 4) Cash + fixed assets (for net assets) ———
  console.log("Seeding cash / balance sheet opening…");
  const cash = await ensureAccount(WS, "1010", "Bank Cash GBP", "asset");
  const equity = await ensureAccount(WS, "3000", "Reserves / Equity", "equity");
  const fa = await ensureAccount(WS, "1500", "Fixed Assets", "asset");
  const arAcct = await ensureAccount(WS, "1030", "Accounts Receivable", "asset");
  const revenue = await ensureAccount(WS, "4010", "Membership & Services Income", "income");
  const apAcct = await ensureAccount(WS, "2000", "Accounts Payable", "liability");
  const opex = await ensureAccount(WS, "5080", "Operating Expenses", "expense");

  await postSimpleJournal({
    workspaceId: WS,
    sourceType: CASH_SOURCE,
    sourceId: "abhi-cash-4242957",
    reference: "ABHI-OPEN-CASH",
    description: "ABHI opening cash at bank £4,242,957",
    journalDate: "2026-01-01",
    debitAccountId: cash.id,
    creditAccountId: equity.id,
    amount: CASH,
    debitDesc: "Opening bank cash GBP",
    creditDesc: "Opening equity for cash",
  });

  await postSimpleJournal({
    workspaceId: WS,
    sourceType: FA_SOURCE,
    sourceId: "abhi-fa-2449",
    reference: "ABHI-OPEN-FA",
    description: "ABHI opening fixed assets £2,449",
    journalDate: "2026-01-01",
    debitAccountId: fa.id,
    creditAccountId: equity.id,
    amount: FIXED_ASSETS,
    debitDesc: "Opening fixed assets",
    creditDesc: "Opening equity for fixed assets",
  });

  // ——— 5) Debtors (AR invoices unpaid = 3,988,245) ———
  console.log("Seeding debtors (AR)…");
  {
    const { data: oldInvoices } = await admin
      .from("invoices")
      .select("id")
      .eq("workspace_id", WS)
      .like("payment_reference", `${INV_PREFIX}%`);
    if (oldInvoices?.length) {
      await admin.from("invoices").delete().in(
        "id",
        oldInvoices.map((r) => r.id),
      );
    }
    await wipeJournalSource(WS, AR_SOURCE);
  }

  // Nine AR invoices — ~£1m overdue (first 3), remainder current / due soon.
  const OVERDUE_TARGET = 1_000_000;
  const arPlanSpec = [
    { amount: 420_000, issueDate: "2026-05-10", dueDate: "2026-06-09", overdue: true },
    { amount: 330_000, issueDate: "2026-05-22", dueDate: "2026-06-21", overdue: true },
    { amount: 250_000, issueDate: "2026-06-05", dueDate: "2026-07-05", overdue: true },
    { amount: 480_000, issueDate: "2026-07-08", dueDate: "2026-08-22", overdue: false },
    { amount: 450_000, issueDate: "2026-07-12", dueDate: "2026-08-26", overdue: false },
    { amount: 420_000, issueDate: "2026-07-15", dueDate: "2026-09-01", overdue: false },
    { amount: 380_000, issueDate: "2026-07-18", dueDate: "2026-09-05", overdue: false },
    { amount: 350_000, issueDate: "2026-07-22", dueDate: "2026-09-12", overdue: false },
    // Remainder so debtors still total DEBTORS.
    { amount: 0, issueDate: "2026-07-28", dueDate: "2026-09-20", overdue: false },
  ];
  const fixedSum = arPlanSpec.slice(0, -1).reduce((s, row) => s + row.amount, 0);
  arPlanSpec[arPlanSpec.length - 1].amount = round2(DEBTORS - fixedSum);
  const overdueSum = arPlanSpec.filter((row) => row.overdue).reduce((s, row) => s + row.amount, 0);
  if (Math.abs(overdueSum - OVERDUE_TARGET) > 0.01) {
    throw new Error(`ABHI overdue invoices sum £${overdueSum}, expected £${OVERDUE_TARGET}`);
  }
  const arPlan = arPlanSpec.map((item, i) => ({
    ...item,
    client: clients[i % clients.length],
  }));

  const arJournalId = await postSimpleJournal({
    workspaceId: WS,
    sourceType: AR_SOURCE,
    sourceId: "abhi-ar-3988245",
    reference: "ABHI-AR-OPEN",
    description: "ABHI debtors opening balance £3,988,245 (BS only — not income)",
    journalDate: "2026-01-31",
    debitAccountId: arAcct.id,
    creditAccountId: equity.id,
    amount: DEBTORS,
    debitDesc: "Accounts receivable opening",
    creditDesc: "Opening equity for debtors",
  });

  // YTD revenue £2m split across Jan–Jul (does not inflate cash or debtors).
  const revTotal = MONTHLY_REVENUE.reduce((s, row) => s + row.amount, 0);
  if (revTotal !== REVENUE_YTD) {
    throw new Error(`MONTHLY_REVENUE sums to ${revTotal}, expected ${REVENUE_YTD}`);
  }
  await wipeJournalSource(WS, REVENUE_SOURCE);
  for (const row of MONTHLY_REVENUE) {
    const journalDate = `${row.month}-${row.day}`;
    await postSimpleJournal({
      workspaceId: WS,
      sourceType: REVENUE_SOURCE,
      sourceId: `abhi-revenue-${row.month}`,
      reference: `ABHI-REV-${row.month.replace("-", "")}`,
      description: `ABHI ${row.month} membership & services income £${row.amount.toLocaleString("en-GB")}`,
      journalDate,
      debitAccountId: equity.id,
      creditAccountId: revenue.id,
      amount: row.amount,
      debitDesc: "Equity reclass for monthly revenue fixture",
      creditDesc: `Membership & services income ${row.month}`,
      wipeSource: false,
    });
  }
  console.log(`Posted ${MONTHLY_REVENUE.length} monthly revenue journals totalling £${REVENUE_YTD}`);

  const invoiceRows = arPlan.map((item, index) => {
    const num = `${INV_PREFIX}-${String(index + 1).padStart(3, "0")}`;
    return {
      id: deterministicUuid(`abhi-invoice:${num}`),
      invoice_number: num,
      client_id: item.client.id,
      workspace_id: WS,
      issue_date: item.issueDate,
      due_date: item.dueDate,
      currency: "GBP",
      amount: item.amount,
      status: item.overdue ? "overdue" : "issued",
      payment_reference: `${INV_PREFIX}-${num}`,
      journal_entry_id: arJournalId,
      payment_journal_entry_id: null,
      created_at: `${item.issueDate}T10:00:00.000Z`,
      updated_at: `${item.issueDate}T10:00:00.000Z`,
    };
  });
  const { error: invErr } = await admin.from("invoices").insert(invoiceRows);
  if (invErr) throw new Error(`invoices: ${invErr.message}`);

  // ——— 6) Creditors (AP expenses) ———
  // Dashboard AP = unpaid expenses + next payroll liability.
  // Target creditors figure includes payroll, so expenses = CREDITORS - payrollLiability.
  const expenseTarget = round2(CREDITORS - payrollLiability);
  console.log(`Seeding creditors (AP expenses £${expenseTarget}; payroll £${payrollLiability})…`);

  await admin.from("financial_expenses").delete().eq("workspace_id", WS).like("reference", `${AP_REF_PREFIX}%`);
  await admin.from("financial_expenses").delete().eq("workspace_id", WS).ilike("purpose_description", `%${AP_TAG}%`);

  const suppliers = [
    { supplier: "DAC Beachcroft LLP", purpose: "Legal counsel retainer", code: "5080", w: 0.14 },
    { supplier: "ExCeL London", purpose: "Conference venue deposit", code: "5090", w: 0.12 },
    { supplier: "Microsoft UK", purpose: "M365 / Azure licences", code: "5010", w: 0.1 },
    { supplier: "AWS UK", purpose: "Cloud hosting — membership portal", code: "5010", w: 0.09 },
    { supplier: "CBRE UK", purpose: "London office facilities", code: "5080", w: 0.1 },
    { supplier: "KPMG UK", purpose: "Audit & assurance instalment", code: "5080", w: 0.11 },
    { supplier: "BT Business", purpose: "Connectivity & telephony", code: "5020", w: 0.06 },
    { supplier: "Hiscox Insurance", purpose: "PI / cyber insurance", code: "5080", w: 0.08 },
    { supplier: "Eventbrite UK", purpose: "Member event platform fees", code: "5090", w: 0.05 },
    { supplier: "Transport for London", purpose: "Staff travel / Oyster fleet", code: "5090", w: 0.04 },
    { supplier: "Softcat plc", purpose: "Endpoint security licences", code: "5010", w: 0.06 },
    { supplier: "Design Agency Co", purpose: "Brand & campaign creative", code: "5090", w: 0.05 },
  ];
  const today = new Date();
  function isoOffset(days) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
  }

  let expAlloc = 0;
  const expenseRows = suppliers.map((item, index) => {
    const isLast = index === suppliers.length - 1;
    const amount = isLast ? round2(expenseTarget - expAlloc) : round2(expenseTarget * item.w);
    expAlloc = round2(expAlloc + amount);
    const overdue = index % 4 === 0;
    const expenseDate = overdue ? isoOffset(-(20 + index)) : isoOffset(-(3 + index));
    return {
      id: randomUUID(),
      workspace_id: WS,
      submitter_user_id: "abhi-ap-seed",
      submitter_name: "ABHI Finance",
      purpose_description: `${item.purpose} · ${AP_TAG}`,
      amount,
      currency: "GBP",
      date_submitted: expenseDate,
      expense_date: expenseDate,
      paid: false,
      supplier: item.supplier,
      category_account_code: item.code,
      reference: `${AP_REF_PREFIX}${String(index + 1).padStart(3, "0")}`,
    };
  });
  const expDrift = round2(expenseTarget - expenseRows.reduce((s, r) => s + r.amount, 0));
  if (expDrift !== 0) expenseRows[expenseRows.length - 1].amount = round2(expenseRows[expenseRows.length - 1].amount + expDrift);

  for (const batch of chunk(expenseRows, 40)) {
    const { error } = await admin.from("financial_expenses").insert(batch);
    if (error) throw new Error(`AP expenses: ${error.message}`);
  }

  // Do not post a P&L expense accrual for AP — unpaid financial_expenses drive creditors,
  // and a one-shot opex journal was incorrectly inflating monthly burn to ~£8m.
  await wipeJournalSource(WS, "abhi_ops_ap");

  // ——— Verify ———
  const { count: clientActive } = await admin
    .from("internal_clients")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", WS)
    .eq("account_status", "Active");
  const { count: projects } = await admin
    .from("internal_projects")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", WS);
  const { data: unpaidInv } = await admin
    .from("invoices")
    .select("amount, status")
    .eq("workspace_id", WS)
    .in("status", ["issued", "overdue"]);
  const arSum = round2((unpaidInv || []).reduce((s, r) => s + Number(r.amount || 0), 0));
  const { data: unpaidExp } = await admin
    .from("financial_expenses")
    .select("amount")
    .eq("workspace_id", WS)
    .eq("paid", false);
  const apExpSum = round2((unpaidExp || []).reduce((s, r) => s + Number(r.amount || 0), 0));

  // Isolation leak check
  for (const slug of ["demo", "corpcentre", "talantonimpact"]) {
    const { data: other } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!other?.id) continue;
    const { count: leak } = await admin
      .from("financial_expenses")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", other.id)
      .like("reference", `${AP_REF_PREFIX}%`);
    if (leak) throw new Error(`AP leak into ${slug}: ${leak}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        employees: employees.length,
        salary: SALARY,
        bonus: BONUS,
        monthly,
        ukTaxes: {
          payePct: UK_PAYE_PCT,
          employeeNiPct: UK_EMPLOYEE_NI_PCT,
          employerNiPct: UK_EMPLOYER_NI_PCT,
          employeeTaxMonthly,
          employerNiMonthly,
          netMonthly,
        },
        payrollLiability,
        clientsActive: clientActive,
        projects,
        arOutstanding: arSum,
        apExpenses: apExpSum,
        apWithPayroll: round2(apExpSum + payrollLiability),
        cash: CASH,
        targets: { DEBTORS, CREDITORS, CASH },
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
