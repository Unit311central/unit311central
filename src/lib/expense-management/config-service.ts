import type {
  ExpenseBillingCode,
  ExpenseCategory,
  ExpenseMileageRate,
  ExpensePaymentSchedule,
} from "@/lib/expense-management/types";
import {
  defaultExpensePaymentSchedule,
} from "@/lib/expense-management/payment-schedule";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

const DEFAULT_CATEGORIES: Array<{ name: string; code: string; glAccountCode: string }> = [
  { name: "Travel", code: "TRAVEL", glAccountCode: "5050" },
  { name: "Office", code: "OFFICE", glAccountCode: "5060" },
  { name: "Meals & entertainment", code: "MEALS", glAccountCode: "5090" },
  { name: "Software", code: "SOFTWARE", glAccountCode: "5010" },
  { name: "General", code: "GENERAL", glAccountCode: "5090" },
];

const DEFAULT_BILLING_CODES: Array<{ code: string; name: string }> = [
  { code: "OPS-100", name: "Operations" },
  { code: "SALES-200", name: "Sales & marketing" },
  { code: "ADMIN-300", name: "Administration" },
];

export async function ensureExpenseConfigSeeded(workspaceId: string) {
  const supabase = requireSupabase();
  const { count: catCount } = await supabase
    .from("expense_categories")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (!catCount) {
    await supabase.from("expense_categories").insert(
      DEFAULT_CATEGORIES.map((row, index) => ({
        workspace_id: workspaceId,
        name: row.name,
        code: row.code,
        gl_account_code: row.glAccountCode,
        sort_order: index,
      })),
    );
  }

  const { count: codeCount } = await supabase
    .from("expense_billing_codes")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (!codeCount) {
    await supabase.from("expense_billing_codes").insert(
      DEFAULT_BILLING_CODES.map((row, index) => ({
        workspace_id: workspaceId,
        code: row.code,
        name: row.name,
        sort_order: index,
      })),
    );
  }

  const { data: schedule } = await supabase
    .from("expense_payment_schedules")
    .select("workspace_id")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (!schedule) {
    const defaults = defaultExpensePaymentSchedule(workspaceId);
    await supabase.from("expense_payment_schedules").insert({
      workspace_id: workspaceId,
      frequency: defaults.frequency,
      cutoff_day: defaults.cutoffDay,
      approval_deadline_day: defaults.approvalDeadlineDay,
      payment_day: defaults.paymentDay,
    });
  }

  const { count: rateCount } = await supabase
    .from("expense_mileage_rates")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId);
  if (!rateCount) {
    await supabase.from("expense_mileage_rates").insert([
      {
        workspace_id: workspaceId,
        country_code: "GB",
        vehicle_type: "car",
        rate_per_unit: 0.45,
        distance_unit: "miles",
      },
      {
        workspace_id: workspaceId,
        country_code: "US",
        vehicle_type: "car",
        rate_per_unit: 0.67,
        distance_unit: "miles",
      },
    ]);
  }
}

export async function listExpenseCategories(workspaceId: string): Promise<ExpenseCategory[]> {
  await ensureExpenseConfigSeeded(workspaceId);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_categories")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCategory);
}

export async function listExpenseBillingCodes(workspaceId: string): Promise<ExpenseBillingCode[]> {
  await ensureExpenseConfigSeeded(workspaceId);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_billing_codes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapBillingCode);
}

export async function listExpenseMileageRates(workspaceId: string): Promise<ExpenseMileageRate[]> {
  await ensureExpenseConfigSeeded(workspaceId);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_mileage_rates")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("active", true);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapMileageRate);
}

export async function getExpensePaymentSchedule(workspaceId: string): Promise<ExpensePaymentSchedule> {
  await ensureExpenseConfigSeeded(workspaceId);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_payment_schedules")
    .select("*")
    .eq("workspace_id", workspaceId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return defaultExpensePaymentSchedule(workspaceId);
  return mapSchedule(data);
}

export async function upsertExpensePaymentSchedule(
  workspaceId: string,
  patch: Partial<Omit<ExpensePaymentSchedule, "workspaceId">>,
): Promise<ExpensePaymentSchedule> {
  const supabase = requireSupabase();
  const existing = await getExpensePaymentSchedule(workspaceId);
  const payload = {
    workspace_id: workspaceId,
    frequency: patch.frequency ?? existing.frequency,
    cutoff_day: patch.cutoffDay ?? existing.cutoffDay,
    approval_deadline_day: patch.approvalDeadlineDay ?? existing.approvalDeadlineDay,
    payment_day: patch.paymentDay ?? existing.paymentDay,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from("expense_payment_schedules")
    .upsert(payload)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapSchedule(data);
}

export async function createExpenseCategory(
  workspaceId: string,
  input: { name: string; code: string; glAccountCode?: string },
): Promise<ExpenseCategory> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_categories")
    .insert({
      workspace_id: workspaceId,
      name: input.name.trim(),
      code: input.code.trim().toUpperCase(),
      gl_account_code: input.glAccountCode?.trim() || "5090",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapCategory(data);
}

export async function createExpenseBillingCode(
  workspaceId: string,
  input: { code: string; name: string },
): Promise<ExpenseBillingCode> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("expense_billing_codes")
    .insert({
      workspace_id: workspaceId,
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapBillingCode(data);
}

export async function archiveExpenseCategory(workspaceId: string, id: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("expense_categories")
    .update({ archived_at: new Date().toISOString(), active: false })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export async function archiveExpenseBillingCode(workspaceId: string, id: string) {
  const supabase = requireSupabase();
  const { error } = await supabase
    .from("expense_billing_codes")
    .update({ archived_at: new Date().toISOString(), active: false })
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (error) throw new Error(error.message);
}

function mapCategory(row: Record<string, unknown>): ExpenseCategory {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    name: String(row.name),
    code: String(row.code),
    glAccountCode: String(row.gl_account_code ?? "5090"),
    active: Boolean(row.active),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapBillingCode(row: Record<string, unknown>): ExpenseBillingCode {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    code: String(row.code),
    name: String(row.name),
    active: Boolean(row.active),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    sortOrder: Number(row.sort_order ?? 0),
  };
}

function mapMileageRate(row: Record<string, unknown>): ExpenseMileageRate {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    countryCode: String(row.country_code ?? "GB"),
    vehicleType: String(row.vehicle_type ?? "car"),
    ratePerUnit: Number(row.rate_per_unit ?? 0),
    distanceUnit: (row.distance_unit as "miles" | "kilometres") ?? "miles",
    active: Boolean(row.active),
  };
}

function mapSchedule(row: Record<string, unknown>): ExpensePaymentSchedule {
  return {
    workspaceId: String(row.workspace_id),
    frequency: (row.frequency as ExpensePaymentSchedule["frequency"]) ?? "monthly",
    cutoffDay: Number(row.cutoff_day ?? 25),
    approvalDeadlineDay: Number(row.approval_deadline_day ?? 27),
    paymentDay: Number(row.payment_day ?? 31),
  };
}
