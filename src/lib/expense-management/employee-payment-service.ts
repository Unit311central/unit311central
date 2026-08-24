import type { EmployeePaymentDetails } from "@/lib/expense-management/types";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { isSupabaseConfigured } from "@/lib/supabase/server";

function requireSupabase() {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  return createTenancyServerClient();
}

function mapPaymentDetails(row: Record<string, unknown>): EmployeePaymentDetails {
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    employeeId: String(row.employee_id),
    countryCode: String(row.country_code ?? "GB"),
    accountHolderName: String(row.account_holder_name ?? ""),
    bankName: String(row.bank_name ?? ""),
    bankAddress: String(row.bank_address ?? ""),
    sortCode: row.sort_code ? String(row.sort_code) : null,
    accountNumber: row.account_number ? String(row.account_number) : null,
    routingNumber: row.routing_number ? String(row.routing_number) : null,
    iban: row.iban ? String(row.iban) : null,
    swiftBic: row.swift_bic ? String(row.swift_bic) : null,
  };
}

export async function getEmployeePaymentDetails(
  workspaceId: string,
  employeeId: string,
): Promise<EmployeePaymentDetails | null> {
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("hr_employee_payment_details")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapPaymentDetails(data) : null;
}

export async function upsertEmployeePaymentDetails(
  workspaceId: string,
  employeeId: string,
  patch: Partial<Omit<EmployeePaymentDetails, "id" | "workspaceId" | "employeeId">>,
): Promise<EmployeePaymentDetails> {
  const supabase = requireSupabase();
  const existing = await getEmployeePaymentDetails(workspaceId, employeeId);
  const payload = {
    workspace_id: workspaceId,
    employee_id: employeeId,
    country_code: patch.countryCode ?? existing?.countryCode ?? "GB",
    account_holder_name: patch.accountHolderName ?? existing?.accountHolderName ?? "",
    bank_name: patch.bankName ?? existing?.bankName ?? "",
    bank_address: patch.bankAddress ?? existing?.bankAddress ?? "",
    sort_code: patch.sortCode ?? existing?.sortCode ?? null,
    account_number: patch.accountNumber ?? existing?.accountNumber ?? null,
    routing_number: patch.routingNumber ?? existing?.routingNumber ?? null,
    iban: patch.iban ?? existing?.iban ?? null,
    swift_bic: patch.swiftBic ?? existing?.swiftBic ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("hr_employee_payment_details")
    .upsert(payload, { onConflict: "workspace_id,employee_id" })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return mapPaymentDetails(data);
}
