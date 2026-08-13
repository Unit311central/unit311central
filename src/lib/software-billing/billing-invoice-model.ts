/**

 * Generic provider billing invoice model.

 *

 * Lifecycle:

 *   Provider adapter → ProviderBillingInvoiceDraft → software_provider_invoices

 *   When paid + final confirmed amount + valid identity → financial_expenses (idempotent)

 *

 * Provider adapters are responsible for setting `invoiceAmountKind: "final"` only when

 * `amount` is layer-4 (final invoice total). Generic lifecycle code never branches on

 * provider-specific source strings.

 *

 * Accounting layers (informational, stored in rawSummary.accountingLayers):

 *   1. rawUsageAmount

 *   2. creditsAndAllowancesAmount

 *   3. subscriptionAmount / netOnDemandAmount

 *   4. final invoice amount → maps to invoice.amount when invoiceAmountKind === "final"

 */



import type { SoftwareSaasProviderSlug } from "@/lib/software-billing/dashboard-model";



export type ProviderInvoiceStatus =

  | "upcoming"

  | "paid"

  | "void"

  | "refunded"

  | "partially_paid";



export type ProviderSourceDocumentStatus = "available" | "unavailable" | "pending";



/** Whether invoice.amount is a final invoice total or a non-accounting reference value. */

export type ProviderInvoiceAmountKind = "final" | "projected" | "raw_usage_reference";



export type ProviderInvoiceAccountingLayers = {

  rawUsageAmount?: number | null;

  creditsAndAllowancesAmount?: number | null;

  subscriptionAmount?: number | null;

  netOnDemandAmount?: number | null;

  upcomingInvoiceAmount?: number | null;

  confirmedPaidAmount?: number | null;

  subscriptionLineItems?: Array<{ key?: string; name: string; amount: number; quantity?: number }>;

};



export type ProviderBillingInvoice = {

  id: string;

  workspaceId: string;

  providerSlug: SoftwareSaasProviderSlug;

  softwareAssetId: string | null;

  providerInvoiceKey: string;

  providerTransactionId: string | null;

  invoiceNumber: string | null;

  invoiceStatus: ProviderInvoiceStatus;

  invoiceDate: string | null;

  billingPeriodStart: string | null;

  billingPeriodEnd: string | null;

  paymentDate: string | null;

  scheduledPaymentDate: string | null;

  amount: number;

  currency: string;

  taxAmount: number | null;

  description: string;

  category: string;

  paymentMethod: string;

  sourceDocumentRef: string | null;

  sourceDocumentStatus: ProviderSourceDocumentStatus;

  financialExpenseId: string | null;

  rawSummary: Record<string, unknown>;

  /** Audit trail only — generic lifecycle does not branch on this value. */

  source: string;

  createdAt: string;

  updatedAt: string;

};



export type ProviderBillingInvoiceDraft = Omit<

  ProviderBillingInvoice,

  "id" | "financialExpenseId" | "createdAt" | "updatedAt"

> & {

  id?: string;

  financialExpenseId?: string | null;

};



export function buildProviderInvoiceKey(

  providerSlug: string,

  parts: readonly string[],

): string {

  return `${providerSlug}:${parts.join(":")}`;

}



export function isPaidInvoice(invoice: Pick<ProviderBillingInvoice, "invoiceStatus">) {

  return invoice.invoiceStatus === "paid";

}



export function isUpcomingInvoice(invoice: Pick<ProviderBillingInvoice, "invoiceStatus">) {

  return invoice.invoiceStatus === "upcoming";

}



export function getInvoiceAmountKind(

  invoice: Pick<ProviderBillingInvoice, "amount" | "rawSummary">,

): ProviderInvoiceAmountKind {

  const explicit = invoice.rawSummary?.invoiceAmountKind;

  if (

    explicit === "final" ||

    explicit === "projected" ||

    explicit === "raw_usage_reference"

  ) {

    return explicit;

  }



  const layers = invoice.rawSummary?.accountingLayers as

    | ProviderInvoiceAccountingLayers

    | undefined;

  const amount = Number(invoice.amount);

  if (layers?.upcomingInvoiceAmount != null && Number(layers.upcomingInvoiceAmount) === amount) {

    return "final";

  }

  if (layers?.confirmedPaidAmount != null && Number(layers.confirmedPaidAmount) === amount) {

    return "final";

  }



  return "projected";

}



/** Layer-4 final invoice amount confirmed by the provider adapter. */

export function hasConfirmedFinalInvoiceAmount(

  invoice: Pick<ProviderBillingInvoice, "amount" | "rawSummary">,

) {

  return getInvoiceAmountKind(invoice) === "final" && Number(invoice.amount) > 0;

}



export function hasValidProviderInvoiceIdentity(

  invoice: Pick<ProviderBillingInvoice, "providerInvoiceKey" | "providerTransactionId" | "invoiceNumber">,

) {

  if (String(invoice.providerInvoiceKey ?? "").trim()) return true;

  if (String(invoice.providerTransactionId ?? "").trim()) return true;

  if (String(invoice.invoiceNumber ?? "").trim()) return true;

  return false;

}



/**

 * Generic expense eligibility:

 *   PAID + final confirmed invoice amount + valid provider invoice identity

 */

export function isExpenseEligibleInvoice(

  invoice: Pick<

    ProviderBillingInvoice,

    | "invoiceStatus"

    | "amount"

    | "rawSummary"

    | "providerInvoiceKey"

    | "providerTransactionId"

    | "invoiceNumber"

  >,

) {

  return (

    isPaidInvoice(invoice) &&

    hasConfirmedFinalInvoiceAmount(invoice) &&

    hasValidProviderInvoiceIdentity(invoice)

  );

}



/** Paid invoices with final confirmed amounts — Spend to Date only. */

export function sumPaidInvoiceAmounts(

  invoices: readonly Pick<

    ProviderBillingInvoice,

    | "invoiceStatus"

    | "amount"

    | "rawSummary"

    | "providerInvoiceKey"

    | "providerTransactionId"

    | "invoiceNumber"

  >[],

) {

  return invoices
    .filter(
      (row) =>
        isPaidInvoice(row) &&
        hasConfirmedFinalInvoiceAmount(row) &&
        hasValidProviderInvoiceIdentity(row),
    )
    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

}



/** Upcoming invoices with final confirmed amounts — Upcoming Spend only. */

export function sumUpcomingInvoiceAmounts(

  invoices: readonly Pick<

    ProviderBillingInvoice,

    | "invoiceStatus"

    | "amount"

    | "rawSummary"

    | "providerInvoiceKey"

    | "providerTransactionId"

    | "invoiceNumber"

  >[],

) {

  return invoices

    .filter(

      (row) =>

        isUpcomingInvoice(row) &&

        hasConfirmedFinalInvoiceAmount(row) &&

        hasValidProviderInvoiceIdentity(row),

    )

    .reduce((sum, row) => sum + Number(row.amount || 0), 0);

}



/** Provider adapters call this when persisting a layer-4 final invoice amount. */

export function withFinalInvoiceAmount<T extends { rawSummary?: Record<string, unknown> }>(

  draft: T,

  layers?: ProviderInvoiceAccountingLayers,

): T & { rawSummary: Record<string, unknown> } {

  return {

    ...draft,

    rawSummary: {

      ...(draft.rawSummary ?? {}),

      invoiceAmountKind: "final" as const,

      accountingLayers: layers ?? (draft.rawSummary?.accountingLayers as object | undefined),

    },

  };

}


