import { createExpense } from "@/lib/financial-expenses-service";
import { resolveFinancialsWorkspaceId } from "@/lib/financials-workspace";
import {
  EXPENSE_CURRENCY_OPTIONS,
  type ExpenseCurrency,
} from "@/lib/expenses-data";
import { getPartnerById } from "@/lib/partners/service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { generateInvoiceNumber } from "@/lib/subscription-invoice-pdf";

function asExpenseCurrency(value: string | undefined): ExpenseCurrency {
  const raw = (value || "USD").toUpperCase();
  if (EXPENSE_CURRENCY_OPTIONS.includes(raw as ExpenseCurrency)) {
    return raw as ExpenseCurrency;
  }
  return "USD";
}

export type PartnerCommissionRate = {
  id: string;
  partnerId: string;
  label: string;
  ratePct: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PartnerJob = {
  id: string;
  workspaceId: string | null;
  partnerId: string;
  jobDate: string;
  description: string;
  location: string | null;
  clientId: string | null;
  clientName: string | null;
  invoiceId: string | null;
  invoiceNumber: string | null;
  baseAmount: number;
  currency: string;
  commissionRateId: string | null;
  commissionRatePct: number;
  commissionAmount: number;
  paymentDueDate: string | null;
  expenseId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

function requireSb() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function mapRate(row: Record<string, unknown>): PartnerCommissionRate {
  return {
    id: String(row.id),
    partnerId: String(row.partner_id),
    label: String(row.label),
    ratePct: Number(row.rate_pct) || 0,
    isDefault: Boolean(row.is_default),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function mapJob(row: Record<string, unknown>): PartnerJob {
  return {
    id: String(row.id),
    workspaceId: row.workspace_id ? String(row.workspace_id) : null,
    partnerId: String(row.partner_id),
    jobDate: String(row.job_date),
    description: String(row.description),
    location: row.location ? String(row.location) : null,
    clientId: row.client_id ? String(row.client_id) : null,
    clientName: row.client_name ? String(row.client_name) : null,
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    invoiceNumber: row.invoice_number ? String(row.invoice_number) : null,
    baseAmount: Number(row.base_amount) || 0,
    currency: String(row.currency || "USD"),
    commissionRateId: row.commission_rate_id ? String(row.commission_rate_id) : null,
    commissionRatePct: Number(row.commission_rate_pct) || 0,
    commissionAmount: Number(row.commission_amount) || 0,
    paymentDueDate: row.payment_due_date ? String(row.payment_due_date) : null,
    expenseId: row.expense_id ? String(row.expense_id) : null,
    status: String(row.status || "open"),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

export function computeCommissionAmount(baseAmount: number, ratePct: number) {
  const base = Number(baseAmount) || 0;
  const rate = Number(ratePct) || 0;
  return Math.round(base * rate) / 100;
}

export async function listPartnerCommissionRates(partnerId: string) {
  const supabase = requireSb();
  const { data, error } = await supabase
    .from("partner_commission_rates")
    .select("*")
    .eq("partner_id", partnerId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapRate(row as Record<string, unknown>));
}

export async function createPartnerCommissionRate(input: {
  partnerId: string;
  label: string;
  ratePct: number;
  isDefault?: boolean;
}) {
  const supabase = requireSb();
  if (input.isDefault) {
    await supabase
      .from("partner_commission_rates")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("partner_id", input.partnerId);
  }
  const { data, error } = await supabase
    .from("partner_commission_rates")
    .insert({
      partner_id: input.partnerId,
      label: input.label.trim() || "Commission",
      rate_pct: input.ratePct,
      is_default: Boolean(input.isDefault),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapRate(data as Record<string, unknown>);
}

export async function listPartnerJobs(partnerId: string) {
  const supabase = requireSb();
  const { data, error } = await supabase
    .from("partner_jobs")
    .select("*")
    .eq("partner_id", partnerId)
    .order("job_date", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map((row) => mapJob(row as Record<string, unknown>));
}

async function createClientInvoiceForJob(input: {
  workspaceId: string;
  clientId: string;
  amount: number;
  currency: string;
  description: string;
  issueDate: string;
  dueDate: string;
}) {
  const supabase = requireSb();
  const invoiceNumber = generateInvoiceNumber();
  const paymentReference = `PARTNER-JOB-${invoiceNumber}`;
  const { data, error } = await supabase
    .from("invoices")
    .insert({
      workspace_id: input.workspaceId,
      client_id: input.clientId,
      invoice_number: invoiceNumber,
      issue_date: input.issueDate,
      due_date: input.dueDate,
      currency: input.currency,
      amount: input.amount,
      status: "issued",
      payment_reference: paymentReference,
    })
    .select("id,invoice_number")
    .single();
  if (error) throw new Error(error.message);
  return {
    id: String(data.id),
    invoiceNumber: String(data.invoice_number),
  };
}

export async function createPartnerJob(input: {
  partnerId: string;
  workspaceId?: string | null;
  jobDate: string;
  description: string;
  location?: string | null;
  clientId?: string | null;
  clientName?: string | null;
  baseAmount: number;
  currency?: string;
  commissionRateId?: string | null;
  commissionRatePct?: number | null;
  paymentDueDate?: string | null;
  createClientInvoice?: boolean;
  createApPayable?: boolean;
  submitterUserId?: string;
}) {
  const supabase = requireSb();
  const partner = await getPartnerById(input.partnerId);
  if (!partner) throw new Error("Partner not found.");

  const workspaceId =
    input.workspaceId ||
    partner.workspaceId ||
    (await resolveFinancialsWorkspaceId().catch(() => null));

  const rates = await listPartnerCommissionRates(input.partnerId);
  const selectedRate =
    (input.commissionRateId && rates.find((rate) => rate.id === input.commissionRateId)) ||
    rates.find((rate) => rate.isDefault) ||
    rates[0] ||
    null;

  const ratePct =
    input.commissionRatePct != null && Number.isFinite(input.commissionRatePct)
      ? Number(input.commissionRatePct)
      : selectedRate?.ratePct || 0;
  const baseAmount = Number(input.baseAmount) || 0;
  const commissionAmount = computeCommissionAmount(baseAmount, ratePct);
  const currency = asExpenseCurrency(input.currency);
  const paymentDueDate =
    input.paymentDueDate?.trim() ||
    input.jobDate ||
    new Date().toISOString().slice(0, 10);

  let invoiceId: string | null = null;
  let invoiceNumber: string | null = null;
  if (input.createClientInvoice && input.clientId && baseAmount > 0 && workspaceId) {
    const invoice = await createClientInvoiceForJob({
      workspaceId,
      clientId: input.clientId,
      amount: baseAmount,
      currency,
      description: input.description,
      issueDate: input.jobDate,
      dueDate: paymentDueDate,
    });
    invoiceId = invoice.id;
    invoiceNumber = invoice.invoiceNumber;
  }

  let expenseId: string | null = null;
  if (input.createApPayable !== false && commissionAmount > 0) {
    const expense = await createExpense(
      {
        submitterUserId: input.submitterUserId || "user-admin",
        purposeDescription: `Partner commission: ${input.description} (${partner.companyName})`,
        amount: commissionAmount,
        currency,
        expenseDate: paymentDueDate,
        dateSubmitted: paymentDueDate,
        supplier: partner.companyName,
        categoryAccountCode: "5090",
        reference: `partner-commission:${input.partnerId}`,
        paid: false,
        workspaceId: workspaceId || undefined,
      },
      workspaceId ? { workspaceId } : undefined,
    );
    expenseId = expense.id;
  }

  const { data, error } = await supabase
    .from("partner_jobs")
    .insert({
      workspace_id: workspaceId,
      partner_id: input.partnerId,
      job_date: input.jobDate,
      description: input.description.trim(),
      location: input.location?.trim() || null,
      client_id: input.clientId || null,
      client_name: input.clientName?.trim() || null,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      base_amount: baseAmount,
      currency,
      commission_rate_id: selectedRate?.id || input.commissionRateId || null,
      commission_rate_pct: ratePct,
      commission_amount: commissionAmount,
      payment_due_date: paymentDueDate,
      expense_id: expenseId,
      status: expenseId ? "commission_due" : "open",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapJob(data as Record<string, unknown>);
}
