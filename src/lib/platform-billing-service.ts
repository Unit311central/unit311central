import {
  ensurePlatformCustomerSubscriptionsTable,
  withPlatformCustomerSubscriptionsTable,
} from "@/lib/internal-db-migrations";
import {
  PROFESSIONAL_ANNUAL_USD,
  PROFESSIONAL_MONTHLY_USD,
} from "@/lib/platform-pricing";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import type {
  PlatformBillingFrequency,
  PlatformCustomerSubscription,
  PlatformSubscriptionStatus,
} from "@/lib/platform-billing-data";

export type {
  PlatformBillingFrequency,
  PlatformCustomerSubscription,
  PlatformSubscriptionStatus,
} from "@/lib/platform-billing-data";

export {
  formatBillingFrequency,
  formatSubscriptionStatus,
  formatUsd,
} from "@/lib/platform-billing-data";

type PlatformCustomerSubscriptionRow = {
  id: string;
  client_id: string | null;
  workspace_id: string | null;
  company_name: string;
  plan_name: string;
  billing_frequency: string;
  subscription_status: string;
  outstanding_balance_usd: number | string | null;
  next_invoice_date: string | null;
  mrr_usd: number | string | null;
  arr_usd: number | string | null;
  currency: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.");
  }
  return createSupabaseServerClient();
}

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) return Number(value);
  return 0;
}

function mapRow(row: PlatformCustomerSubscriptionRow): PlatformCustomerSubscription {
  return {
    id: row.id,
    clientId: row.client_id,
    workspaceId: row.workspace_id,
    companyName: row.company_name,
    planName: row.plan_name,
    billingFrequency: row.billing_frequency as PlatformBillingFrequency,
    subscriptionStatus: row.subscription_status as PlatformSubscriptionStatus,
    outstandingBalanceUsd: toNumber(row.outstanding_balance_usd),
    nextInvoiceDate: row.next_invoice_date,
    mrrUsd: toNumber(row.mrr_usd),
    arrUsd: toNumber(row.arr_usd),
    currency: row.currency ?? "USD",
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPlatformCustomerSubscriptions(): Promise<
  PlatformCustomerSubscription[]
> {
  await ensurePlatformCustomerSubscriptionsTable();
  return withPlatformCustomerSubscriptionsTable(async () => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("platform_customer_subscriptions")
      .select("*")
      .order("company_name", { ascending: true });

    if (error) throw new Error(error.message);
    return ((data ?? []) as PlatformCustomerSubscriptionRow[]).map(mapRow);
  });
}

export async function getPlatformCustomerSubscription(
  id: string,
): Promise<PlatformCustomerSubscription | null> {
  await ensurePlatformCustomerSubscriptionsTable();
  return withPlatformCustomerSubscriptionsTable(async () => {
    const supabase = requireSupabase();
    const { data, error } = await supabase
      .from("platform_customer_subscriptions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapRow(data as PlatformCustomerSubscriptionRow) : null;
  });
}

/** Heal legacy Professional seed rows still on $999 MRR. */
export async function healProfessionalSubscriptionPricing(): Promise<number> {
  await ensurePlatformCustomerSubscriptionsTable();
  return (
    (await withPlatformCustomerSubscriptionsTable(async () => {
      const supabase = requireSupabase();
      const { data: rows, error: listError } = await supabase
        .from("platform_customer_subscriptions")
        .select("id, company_name, plan_name, mrr_usd");
      if (listError) throw new Error(listError.message);
      const targets = (rows ?? []).filter((row) => {
        const mrr = Number(row.mrr_usd);
        const company = String(row.company_name ?? "").toLowerCase();
        const plan = String(row.plan_name ?? "").toLowerCase();
        return mrr === 999 && (company.includes("fotheringham") || plan.includes("professional"));
      });
      for (const row of targets) {
        const { error } = await supabase
          .from("platform_customer_subscriptions")
          .update({
            mrr_usd: PROFESSIONAL_MONTHLY_USD,
            arr_usd: PROFESSIONAL_ANNUAL_USD,
            updated_at: new Date().toISOString(),
          })
          .eq("id", row.id);
        if (error) throw new Error(error.message);
      }
      return targets.length;
    })) ?? 0
  );
}

export async function updatePlatformCustomerSubscription(
  id: string,
  patch: Partial<{
    mrrUsd: number;
    arrUsd: number;
    planName: string;
    billingFrequency: PlatformBillingFrequency;
    subscriptionStatus: PlatformSubscriptionStatus;
    outstandingBalanceUsd: number;
    nextInvoiceDate: string | null;
    notes: string | null;
  }>,
): Promise<PlatformCustomerSubscription | null> {
  await ensurePlatformCustomerSubscriptionsTable();
  return withPlatformCustomerSubscriptionsTable(async () => {
    const supabase = requireSupabase();
    const payload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (patch.mrrUsd != null) payload.mrr_usd = patch.mrrUsd;
    if (patch.arrUsd != null) payload.arr_usd = patch.arrUsd;
    if (patch.planName != null) payload.plan_name = patch.planName;
    if (patch.billingFrequency != null) payload.billing_frequency = patch.billingFrequency;
    if (patch.subscriptionStatus != null) payload.subscription_status = patch.subscriptionStatus;
    if (patch.outstandingBalanceUsd != null) {
      payload.outstanding_balance_usd = patch.outstandingBalanceUsd;
    }
    if (patch.nextInvoiceDate !== undefined) payload.next_invoice_date = patch.nextInvoiceDate;
    if (patch.notes !== undefined) payload.notes = patch.notes;

    const { data, error } = await supabase
      .from("platform_customer_subscriptions")
      .update(payload)
      .eq("id", id)
      .select("*")
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data ? mapRow(data as PlatformCustomerSubscriptionRow) : null;
  });
}
