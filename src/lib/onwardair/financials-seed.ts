/**
 * OnwardAir Financials seed — USD COA, opening cash, grant AR, supplier AP, staff expenses.
 * OA workspace only. Idempotent via marker journal source_id.
 *
 * Core (COA + $1M cash) is fast. Transactional detail is heavier and must not
 * block the Financials overview API (client aborts at ~20s).
 */

import "server-only";

import { randomUUID } from "node:crypto";

import { ACCOUNT_CODES, CHART_OF_ACCOUNTS_SEED } from "@/lib/accounting/chart-of-accounts";
import { createAndPostJournal } from "@/lib/accounting/journal-service";
import { postInvoiceIssueJournal } from "@/lib/accounting/posting-rules";
import {
  ONWARDAIR_CASH_BALANCE_USD,
  ONWARDAIR_CAPITAL_RAISED_USD,
} from "@/lib/onwardair-financials";
import { isOnwardAirSlug } from "@/lib/onwardair-surface";
import {
  createSupabaseServerClient,
  createSupabaseServiceRoleClient,
  isSupabaseConfigured,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";

export const OA_FINANCIALS_SEED_VERSION = "oa-fin-v4";
const CORE_SOURCE_TYPE = "manual";
const CORE_SOURCE_ID = `${OA_FINANCIALS_SEED_VERSION}-core`;
const DETAILS_SOURCE_ID = `${OA_FINANCIALS_SEED_VERSION}-details`;

const OA_COA_NAMES: Record<string, { name: string; currency: string | null }> = {
  "1000": { name: "Operating Cash USD", currency: "USD" },
  "1010": { name: "Payroll Cash USD", currency: "USD" },
  "1020": { name: "Reserves USD", currency: "USD" },
  "1030": { name: "Accounts Receivable", currency: "USD" },
  "1040": { name: "Prepaid Expenses", currency: "USD" },
  "2000": { name: "Accounts Payable", currency: "USD" },
  "2010": { name: "Deferred Grant Income", currency: "USD" },
  "2020": { name: "Payroll Clearing", currency: "USD" },
  "2030": { name: "Employer Payroll Tax Payable", currency: "USD" },
  "3000": { name: "Paid-in Capital", currency: "USD" },
  "3010": { name: "Retained Earnings", currency: "USD" },
  "4000": { name: "Product Revenue", currency: "USD" },
  "4010": { name: "Grant & Contract Income", currency: "USD" },
  "5000": { name: "Payment Processing Fees", currency: "USD" },
  "5010": { name: "Software & Cloud", currency: "USD" },
  "5020": { name: "Payroll", currency: "USD" },
  "5021": { name: "Employer Payroll Tax", currency: "USD" },
  "5030": { name: "Contractors & Consultants", currency: "USD" },
  "5040": { name: "Marketing", currency: "USD" },
  "5050": { name: "Travel", currency: "USD" },
  "5060": { name: "Office & Facilities", currency: "USD" },
  "5070": { name: "Accounting", currency: "USD" },
  "5080": { name: "Legal", currency: "USD" },
  "5090": { name: "Equipment & Lab Supplies", currency: "USD" },
};

type GrantArSeed = {
  reference: string;
  funder: string;
  title: string;
  amount: number;
  issueDate: string;
  dueDate: string;
  status: "issued" | "overdue";
};

const OA_GRANT_AR: GrantArSeed[] = [
  {
    reference: "OA-AR-001",
    funder: "NASA",
    title: "AAM National Campaign — telemetry milestone receivable",
    amount: 120_000,
    issueDate: "2026-05-15",
    dueDate: "2026-08-15",
    status: "issued",
  },
  {
    reference: "OA-AR-002",
    funder: "U.S. Department of Defense",
    title: "STTR Phase I — remaining disbursement",
    amount: 87_500,
    issueDate: "2026-04-01",
    dueDate: "2026-07-01",
    status: "overdue",
  },
  {
    reference: "OA-AR-003",
    funder: "Federal Aviation Administration",
    title: "BEYOND UTM integration — progress billing",
    amount: 65_000,
    issueDate: "2026-06-20",
    dueDate: "2026-09-20",
    status: "issued",
  },
  {
    reference: "OA-AR-004",
    funder: "U.S. Department of Transportation",
    title: "SMART Grants — vertiport toolkit tranche",
    amount: 45_000,
    issueDate: "2026-07-10",
    dueDate: "2026-10-10",
    status: "issued",
  },
];

type SupplierSeed = {
  supplier: string;
  purpose: string;
  amount: number;
  code: string;
  monthsAgo: number;
};

const OA_SUPPLIERS: SupplierSeed[] = [
  { supplier: "AWS", purpose: "Cloud hosting — flight-test telemetry", amount: 4820, code: "5010", monthsAgo: 1 },
  { supplier: "Microsoft 365", purpose: "M365 Business Premium — Houston team", amount: 1680, code: "5010", monthsAgo: 1 },
  { supplier: "Slack Technologies", purpose: "Enterprise Grid seats", amount: 920, code: "5010", monthsAgo: 2 },
  { supplier: "Atlassian", purpose: "Jira / Confluence Cloud", amount: 1450, code: "5010", monthsAgo: 2 },
  { supplier: "GitHub", purpose: "Organization seats + Actions", amount: 780, code: "5010", monthsAgo: 3 },
  { supplier: "SolidWorks", purpose: "CAD licenses — mechanical design", amount: 12400, code: "5010", monthsAgo: 3 },
  { supplier: "ANSYS", purpose: "CFD solver subscription", amount: 18600, code: "5010", monthsAgo: 4 },
  { supplier: "McMaster-Carr", purpose: "Lab fasteners and fixtures", amount: 3250, code: "5090", monthsAgo: 1 },
  { supplier: "Digi-Key Electronics", purpose: "Avionics proto PCBs / parts", amount: 8740, code: "5090", monthsAgo: 2 },
  { supplier: "Mouser Electronics", purpose: "Sensor and power modules", amount: 6120, code: "5090", monthsAgo: 3 },
  { supplier: "Grainger", purpose: "Shop tools and PPE", amount: 2890, code: "5090", monthsAgo: 4 },
  { supplier: "United Airlines", purpose: "Staff travel — DC / LAX liaison", amount: 5420, code: "5050", monthsAgo: 1 },
  { supplier: "Southwest Airlines", purpose: "Domestic flight-test support travel", amount: 3180, code: "5050", monthsAgo: 2 },
  { supplier: "Hilton Houston", purpose: "Visitor lodging — partner demos", amount: 4680, code: "5050", monthsAgo: 1 },
  { supplier: "Marriott Houston", purpose: "Conference lodging — AAM summit", amount: 3920, code: "5050", monthsAgo: 5 },
  { supplier: "Enterprise Rent-A-Car", purpose: "Ground transport — range visits", amount: 1640, code: "5050", monthsAgo: 3 },
  { supplier: "WeWork Houston", purpose: "Overflow desks — Q2", amount: 7200, code: "5060", monthsAgo: 2 },
  { supplier: "CenterPoint Energy", purpose: "Utilities — Houston facility", amount: 2140, code: "5060", monthsAgo: 1 },
  { supplier: "Comcast Business", purpose: "Fiber uplink — HQ", amount: 980, code: "5060", monthsAgo: 1 },
  { supplier: "Staples Business", purpose: "Office supplies", amount: 640, code: "5060", monthsAgo: 2 },
  { supplier: "FedEx", purpose: "Parts courier — vendor shipments", amount: 1120, code: "5090", monthsAgo: 2 },
  { supplier: "UPS", purpose: "Inbound freight — test articles", amount: 1860, code: "5090", monthsAgo: 4 },
  { supplier: "Wilson Sonsini", purpose: "IP counsel retainer", amount: 15000, code: "5080", monthsAgo: 3 },
  { supplier: "Cooley LLP", purpose: "Corporate counsel — financing docs", amount: 18500, code: "5080", monthsAgo: 6 },
  { supplier: "Deloitte", purpose: "Audit prep / tax advisory", amount: 9800, code: "5070", monthsAgo: 5 },
  { supplier: "Pinnacle Insurance", purpose: "D&O / product liability instalment", amount: 22400, code: "5080", monthsAgo: 4 },
  { supplier: "Space Foundation", purpose: "Industry membership dues", amount: 4500, code: "5040", monthsAgo: 7 },
  { supplier: "Canva for Teams", purpose: "Marketing design seats", amount: 720, code: "5040", monthsAgo: 2 },
  { supplier: "Zoom Communications", purpose: "Enterprise video", amount: 1680, code: "5010", monthsAgo: 1 },
  { supplier: "Figma", purpose: "Product design seats", amount: 960, code: "5010", monthsAgo: 3 },
];

type StaffExpenseSeed = {
  name: string;
  userId: string;
  categories: Array<{ label: string; code: string; base: number }>;
};

const OA_STAFF_EXPENSE_OWNERS: StaffExpenseSeed[] = [
  {
    name: "Scott Parazynski, MD",
    userId: "oa-exp-scott",
    categories: [
      { label: "Executive travel — DC stakeholder meetings", code: "5050", base: 1850 },
      { label: "Hotel — Washington DC", code: "5050", base: 920 },
    ],
  },
  {
    name: "Brian Whiteside",
    userId: "oa-exp-brian",
    categories: [
      { label: "COO travel — partner site visit", code: "5050", base: 1420 },
      { label: "Lodging — partner site", code: "5050", base: 780 },
    ],
  },
  {
    name: "Monte Mann",
    userId: "oa-exp-monte",
    categories: [
      { label: "Finance conference — travel", code: "5050", base: 980 },
      { label: "Accounting software training", code: "5070", base: 450 },
    ],
  },
  {
    name: "Carolyn Scott",
    userId: "oa-exp-carolyn",
    categories: [
      { label: "Trade-show travel — AUVSI", code: "5050", base: 1640 },
      { label: "Hotel — AUVSI Expo", code: "5050", base: 1100 },
      { label: "Booth collateral / print", code: "5040", base: 680 },
    ],
  },
  {
    name: "Dan Wax",
    userId: "oa-exp-dan",
    categories: [
      { label: "Supplier visit — travel", code: "5050", base: 1200 },
      { label: "Freight sample shipping", code: "5090", base: 540 },
    ],
  },
  {
    name: "Mike Teeter",
    userId: "oa-exp-mike",
    categories: [
      { label: "Flight-test lodging", code: "5050", base: 860 },
      { label: "Mechanical tooling / fixtures", code: "5090", base: 2100 },
    ],
  },
  {
    name: "Keven Coates",
    userId: "oa-exp-keven",
    categories: [
      { label: "Electrical lab equipment", code: "5090", base: 3450 },
      { label: "Travel — range instrumentation", code: "5050", base: 720 },
    ],
  },
  {
    name: "Jon Fenner",
    userId: "oa-exp-jon",
    categories: [
      { label: "R&D prototype materials", code: "5090", base: 2780 },
      { label: "Conference lodging", code: "5050", base: 640 },
    ],
  },
  {
    name: "David Colling",
    userId: "oa-exp-david",
    categories: [
      { label: "Aerospace structures tooling", code: "5090", base: 4120 },
      { label: "Travel — composites vendor", code: "5050", base: 980 },
    ],
  },
  {
    name: "Justin Dodrill",
    userId: "oa-exp-justin",
    categories: [
      { label: "Dev workstation peripherals", code: "5090", base: 890 },
      { label: "Cloud GPU burst credits", code: "5010", base: 1250 },
    ],
  },
];

const seedLocks = new Map<string, Promise<void>>();

function adminClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return isSupabaseServiceRoleConfigured()
    ? createSupabaseServiceRoleClient()
    : createSupabaseServerClient();
}

function isoMonthsAgo(months: number, day = 15): string {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - months);
  d.setUTCDate(Math.min(day, 28));
  return d.toISOString().slice(0, 10);
}

async function resolveSlug(workspaceId: string): Promise<string> {
  const supabase = adminClient();
  const { data } = await supabase
    .from("workspaces")
    .select("slug")
    .eq("id", workspaceId)
    .maybeSingle();
  return String(data?.slug ?? "")
    .trim()
    .toLowerCase();
}

async function hasJournalMarker(workspaceId: string, sourceId: string): Promise<boolean> {
  const supabase = adminClient();
  const { data } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("source_type", CORE_SOURCE_TYPE)
    .eq("source_id", sourceId)
    .maybeSingle();
  return Boolean(data?.id);
}

async function wipeWorkspaceFinancials(workspaceId: string): Promise<void> {
  const supabase = adminClient();

  await supabase.from("financial_expenses").delete().eq("workspace_id", workspaceId);
  await supabase.from("invoices").delete().eq("workspace_id", workspaceId);

  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id")
    .eq("workspace_id", workspaceId);
  const entryIds = (entries ?? []).map((row) => String(row.id));
  if (entryIds.length > 0) {
    for (let i = 0; i < entryIds.length; i += 100) {
      const chunk = entryIds.slice(i, i + 100);
      await supabase.from("journal_lines").delete().in("journal_entry_id", chunk);
    }
  }
  await supabase.from("journal_lines").delete().eq("workspace_id", workspaceId);
  await supabase.from("journal_entries").delete().eq("workspace_id", workspaceId);
  await supabase.from("accounts").delete().eq("workspace_id", workspaceId);
}

async function seedChartOfAccounts(workspaceId: string): Promise<void> {
  const supabase = adminClient();
  const rows = CHART_OF_ACCOUNTS_SEED.map((account) => {
    const override = OA_COA_NAMES[account.code];
    return {
      code: account.code,
      name: override?.name ?? account.name,
      type: account.type,
      currency: override?.currency ?? "USD",
      is_active: true,
      workspace_id: workspaceId,
    };
  });
  const { error } = await supabase.from("accounts").insert(rows);
  if (error && !/duplicate/i.test(error.message)) {
    throw new Error(`OA COA seed: ${error.message}`);
  }

  try {
    await supabase.from("workspace_settings").upsert(
      {
        workspace_id: workspaceId,
        currency: "USD",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );
  } catch {
    /* settings table / columns may vary */
  }
}

async function seedOpeningCash(workspaceId: string): Promise<void> {
  const spent = ONWARDAIR_CAPITAL_RAISED_USD - ONWARDAIR_CASH_BALANCE_USD;
  await createAndPostJournal(
    {
      reference: "OA-OPEN-CASH",
      description: `OnwardAir opening treasury — $${ONWARDAIR_CASH_BALANCE_USD.toLocaleString("en-US")} remaining of $${ONWARDAIR_CAPITAL_RAISED_USD.toLocaleString("en-US")} raised (founded 2023, pre-revenue)`,
      workspaceId,
      sourceType: CORE_SOURCE_TYPE,
      sourceId: CORE_SOURCE_ID,
      journalDate: "2025-08-01",
      lines: [
        {
          accountCode: ACCOUNT_CODES.wiseUsd,
          debit: ONWARDAIR_CASH_BALANCE_USD,
          description: "Operating cash USD",
        },
        {
          accountCode: ACCOUNT_CODES.retainedEarnings,
          debit: spent,
          description: "Cumulative operating burn since raise",
        },
        {
          accountCode: ACCOUNT_CODES.ownerEquity,
          credit: ONWARDAIR_CAPITAL_RAISED_USD,
          description: "Paid-in capital from raise (~$1.7M)",
        },
      ],
    },
    { workspaceId },
  );
}

async function ensureGrantClients(
  workspaceId: string,
): Promise<Map<string, string>> {
  const supabase = adminClient();
  const funders = [...new Set(OA_GRANT_AR.map((g) => g.funder))];
  const idByFunder = new Map<string, string>();

  for (const funder of funders) {
    const id = `oa-grant-${funder
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40)}`;
    idByFunder.set(funder, id);

    const { data: existing } = await supabase
      .from("internal_clients")
      .select("id")
      .eq("id", id)
      .maybeSingle();
    if (existing?.id) continue;

    const row = {
      id,
      workspace_id: workspaceId,
      company_name: funder,
      industry: "Government / Aerospace",
      primary_contact: "Grants Office",
      email: "grants@onwardair.tech",
      phone: "",
      region: "USA",
      account_status: "Active",
      contract_type: "Grant",
      tax_id: "",
      billing_address: "United States",
      active_projects: 0,
      notes: "OnwardAir grant funder (AR seed)",
      platform_url: null,
    };
    const { error } = await supabase.from("internal_clients").insert(row);
    if (error && !/duplicate/i.test(error.message)) {
      const { error: retry } = await supabase.from("internal_clients").insert({
        id: row.id,
        company_name: row.company_name,
        industry: row.industry,
        primary_contact: row.primary_contact,
        email: row.email,
        phone: row.phone,
        region: row.region,
        account_status: row.account_status,
        contract_type: row.contract_type,
        tax_id: row.tax_id,
        billing_address: row.billing_address,
        active_projects: 0,
        notes: row.notes,
        platform_url: null,
      });
      if (retry && !/duplicate/i.test(retry.message)) {
        throw new Error(`OA grant client ${funder}: ${retry.message}`);
      }
    }
  }

  return idByFunder;
}

async function seedGrantReceivables(workspaceId: string): Promise<void> {
  const supabase = adminClient();
  const clients = await ensureGrantClients(workspaceId);

  for (let index = 0; index < OA_GRANT_AR.length; index += 1) {
    const grant = OA_GRANT_AR[index]!;
    const clientId = clients.get(grant.funder);
    if (!clientId) throw new Error(`Missing grant client for ${grant.funder}`);

    const invoiceId = randomUUID();
    const invoiceNumber = `OA26${String(index + 1).padStart(4, "0")}`;
    const insertRow: Record<string, string | number | null> = {
      id: invoiceId,
      invoice_number: invoiceNumber,
      client_id: clientId,
      organisation_id: null,
      issue_date: grant.issueDate,
      due_date: grant.dueDate,
      currency: "USD",
      amount: grant.amount,
      status: grant.status,
      payment_reference: grant.reference,
      pdf_path: null,
      workspace_id: workspaceId,
    };

    const { error } = await supabase.from("invoices").insert(insertRow);
    if (error && !/duplicate/i.test(error.message)) {
      throw new Error(`OA AR seed ${grant.reference}: ${error.message}`);
    }
    if (error) continue;

    await postInvoiceIssueJournal({
      invoiceId,
      invoiceNumber,
      clientId,
      amount: grant.amount,
      currency: "USD",
      journalDate: grant.issueDate,
      workspaceId,
    });
  }
}

async function seedSupplierPayables(workspaceId: string): Promise<void> {
  const supabase = adminClient();
  const rows = OA_SUPPLIERS.map((item, index) => {
    const expenseDate = isoMonthsAgo(item.monthsAgo, 8 + (index % 18));
    const unpaid = index % 3 !== 0;
    return {
      id: randomUUID(),
      workspace_id: workspaceId,
      submitter_user_id: "oa-ap-seed",
      submitter_name: "OnwardAir Finance",
      purpose_description: `${item.purpose} · OA AP seed`,
      amount: item.amount,
      currency: "USD",
      date_submitted: expenseDate,
      expense_date: expenseDate,
      paid: !unpaid,
      supplier: item.supplier,
      category_account_code: item.code,
      reference: `OA-AP-${String(index + 1).padStart(3, "0")}`,
      payment_method: unpaid ? null : "wise",
    };
  });

  const { error } = await supabase.from("financial_expenses").insert(rows);
  if (error) throw new Error(`OA AP seed: ${error.message}`);

  // Monthly GL journals for unpaid AP (avoids dumping all spend into the current month).
  const unpaidByMonth = new Map<string, number>();
  for (const row of rows) {
    if (row.paid) continue;
    const monthKey = String(row.expense_date).slice(0, 7);
    unpaidByMonth.set(monthKey, (unpaidByMonth.get(monthKey) ?? 0) + row.amount);
  }
  let apMonthIndex = 0;
  for (const [monthKey, unpaidTotal] of unpaidByMonth) {
    if (unpaidTotal <= 0) continue;
    await createAndPostJournal(
      {
        reference: `OA-AP-SUMMARY-${monthKey}`,
        description: `OnwardAir supplier AP summary ${monthKey} (seed)`,
        workspaceId,
        sourceType: CORE_SOURCE_TYPE,
        sourceId: `${OA_FINANCIALS_SEED_VERSION}-ap-summary-${monthKey}`,
        journalDate: `${monthKey}-01`,
        lines: [
          {
            accountCode: ACCOUNT_CODES.miscExpenses,
            debit: unpaidTotal,
            description: `Supplier operating spend ${monthKey} (seed summary)`,
          },
          {
            accountCode: ACCOUNT_CODES.accountsPayable,
            credit: unpaidTotal,
            description: `Accounts payable ${monthKey} (seed summary)`,
          },
        ],
      },
      { workspaceId },
    );
    apMonthIndex += 1;
  }
  void apMonthIndex;
}

async function seedStaffExpenses(workspaceId: string): Promise<void> {
  const supabase = adminClient();
  const rows: Array<Record<string, string | number | boolean | null>> = [];
  let seq = 1;

  for (const staff of OA_STAFF_EXPENSE_OWNERS) {
    // Include month 0 (current) so Expenses "Spend MTD" is populated.
    for (let month = 0; month < 12; month += 1) {
      const category = staff.categories[month % staff.categories.length]!;
      const jitter = ((month * 17 + seq * 3) % 40) - 20;
      const amount = Math.max(120, Math.round(category.base * (0.85 + (month % 5) * 0.06) + jitter));
      const expenseDate = isoMonthsAgo(month, 5 + (seq % 20));
      const paid = month >= 9;
      rows.push({
        id: randomUUID(),
        workspace_id: workspaceId,
        submitter_user_id: staff.userId,
        submitter_name: staff.name,
        purpose_description: `${category.label} — ${staff.name.split(",")[0]} · OA EXP seed`,
        amount,
        currency: "USD",
        date_submitted: expenseDate,
        expense_date: expenseDate,
        paid,
        supplier: null,
        category_account_code: category.code,
        reference: `OA-EXP-${String(seq).padStart(3, "0")}`,
        payment_method: paid ? "wise" : null,
      });
      seq += 1;
    }
  }

  for (let i = 0; i < rows.length; i += 40) {
    const chunk = rows.slice(i, i + 40);
    const { error } = await supabase.from("financial_expenses").insert(chunk);
    if (error) throw new Error(`OA EXP seed batch: ${error.message}`);
  }

  // Monthly staff-expense summary journals — not one current-month lump.
  const unpaidByMonth = new Map<string, Map<string, number>>();
  for (const row of rows) {
    if (row.paid) continue;
    const monthKey = String(row.expense_date).slice(0, 7);
    const code = String(row.category_account_code);
    const byCode = unpaidByMonth.get(monthKey) ?? new Map<string, number>();
    byCode.set(code, (byCode.get(code) ?? 0) + Number(row.amount));
    unpaidByMonth.set(monthKey, byCode);
  }
  for (const [monthKey, byCode] of unpaidByMonth) {
    const totalUnpaid = [...byCode.values()].reduce((sum, value) => sum + value, 0);
    if (totalUnpaid <= 0) continue;
    const journalLines = [
      ...[...byCode.entries()].map(([code, amount]) => ({
        accountCode: code,
        debit: Math.round(amount * 100) / 100,
        description: `Staff expenses ${code} ${monthKey} (seed summary)`,
      })),
      {
        accountCode: ACCOUNT_CODES.accountsPayable,
        credit: Math.round(totalUnpaid * 100) / 100,
        description: `Staff expense payables ${monthKey} (seed summary)`,
      },
    ];
    await createAndPostJournal(
      {
        reference: `OA-EXP-SUMMARY-${monthKey}`,
        description: `OnwardAir staff expense summary ${monthKey} (seed)`,
        workspaceId,
        sourceType: CORE_SOURCE_TYPE,
        sourceId: `${OA_FINANCIALS_SEED_VERSION}-exp-summary-${monthKey}`,
        journalDate: `${monthKey}-02`,
        lines: journalLines,
      },
      { workspaceId },
    );
  }
}

async function seedDetailsMarker(workspaceId: string): Promise<void> {
  await createAndPostJournal(
    {
      reference: "OA-FIN-DETAILS",
      description: "OnwardAir financials detail seed marker",
      workspaceId,
      sourceType: CORE_SOURCE_TYPE,
      sourceId: DETAILS_SOURCE_ID,
      journalDate: isoMonthsAgo(0, 3),
      lines: [
        {
          accountCode: ACCOUNT_CODES.prepaidExpenses,
          debit: 0.01,
          description: "Seed marker",
        },
        {
          accountCode: ACCOUNT_CODES.miscExpenses,
          credit: 0.01,
          description: "Seed marker",
        },
      ],
    },
    { workspaceId },
  );
}

async function runCoreSeed(workspaceId: string): Promise<void> {
  if (await hasJournalMarker(workspaceId, CORE_SOURCE_ID)) return;

  await wipeWorkspaceFinancials(workspaceId);
  await seedChartOfAccounts(workspaceId);
  await seedOpeningCash(workspaceId);
}

async function runDetailsSeed(workspaceId: string): Promise<void> {
  if (await hasJournalMarker(workspaceId, DETAILS_SOURCE_ID)) return;

  // Need core first (current version marker).
  if (!(await hasJournalMarker(workspaceId, CORE_SOURCE_ID))) {
    await runCoreSeed(workspaceId);
  }

  // Skip if this version already planted AP rows (partial retry).
  const supabase = adminClient();
  const { count } = await supabase
    .from("financial_expenses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .like("reference", "OA-AP-%");
  if ((count ?? 0) === 0) {
    await seedGrantReceivables(workspaceId);
    await seedSupplierPayables(workspaceId);
    await seedStaffExpenses(workspaceId);
  }
  if (!(await hasJournalMarker(workspaceId, DETAILS_SOURCE_ID))) {
    await seedDetailsMarker(workspaceId);
  }
}

async function runSeed(workspaceId: string): Promise<void> {
  const slug = await resolveSlug(workspaceId);
  if (!isOnwardAirSlug(slug)) return;
  await runCoreSeed(workspaceId);
  await runDetailsSeed(workspaceId);
}

/**
 * Fast path for Financials overview — COA + $1M cash only.
 * Never runs the heavy AR/AP/expense insert on the request critical path.
 */
export async function ensureOnwardAirFinancialsCore(workspaceId: string): Promise<void> {
  const existing = seedLocks.get(`core:${workspaceId}`);
  if (existing) {
    await existing;
    return;
  }
  const run = (async () => {
    const slug = await resolveSlug(workspaceId);
    if (!isOnwardAirSlug(slug)) return;
    await runCoreSeed(workspaceId);
  })()
    .catch((error) => {
      console.error(
        "[oa-financials] core seed failed:",
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      seedLocks.delete(`core:${workspaceId}`);
    });
  seedLocks.set(`core:${workspaceId}`, run);
  await run;
}

/**
 * Full idempotent OA financials seed (core + AR/AP/expenses).
 * Prefer {@link ensureOnwardAirFinancialsCore} on overview; call this from
 * ledger / invoices / expenses routes (or fire-and-forget after core).
 */
export async function ensureOnwardAirFinancialsSeeded(workspaceId: string): Promise<void> {
  const existing = seedLocks.get(workspaceId);
  if (existing) {
    await existing;
    return;
  }
  const run = runSeed(workspaceId)
    .catch((error) => {
      console.error(
        "[oa-financials] seed failed:",
        error instanceof Error ? error.message : error,
      );
    })
    .finally(() => {
      seedLocks.delete(workspaceId);
    });
  seedLocks.set(workspaceId, run);
  await run;
}

/** Kick off detail seed without blocking the caller. */
export function kickOnwardAirFinancialsDetails(workspaceId: string): void {
  void ensureOnwardAirFinancialsSeeded(workspaceId);
}

const expensesReadyCache = new Set<string>();

/**
 * Fast path for Expenses API — if staff expense rows already exist, return
 * immediately. Only runs the full seed when the workspace has never been planted.
 */
export async function ensureOnwardAirExpensesReady(workspaceId: string): Promise<void> {
  if (expensesReadyCache.has(workspaceId)) return;

  try {
    const supabase = adminClient();
    const { count } = await supabase
      .from("financial_expenses")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspaceId)
      .like("reference", "OA-EXP-%");
    if ((count ?? 0) > 0) {
      expensesReadyCache.add(workspaceId);
      return;
    }
  } catch {
    /* fall through to full seed */
  }
  await ensureOnwardAirFinancialsSeeded(workspaceId);
  expensesReadyCache.add(workspaceId);
}
