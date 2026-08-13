/**
 * Generic SaaS expense / reimbursement model.
 *
 * Interface layer only — no automatic invoice retrieval and no changes to the
 * existing financial_expenses accounting ledger.
 *
 * Future flow:
 *   Provider adapter / invoice import
 *     → SoftwareSaasExpenseDraft
 *     → Software & SaaS expense ledger
 *     → reimbursement workflow (when paid personally)
 */

import type { SoftwareSaasProviderSlug } from "@/lib/software-billing/dashboard-model";

/** Who paid the charge at the merchant. */
export type SoftwareSaasPaidBy =
  | "personally_paid"
  | "company_paid"
  | "corporate_card"
  | "other";

/** Whether the merchant invoice/charge has been paid. */
export type SoftwareSaasPaymentStatus =
  | "unpaid"
  | "paid"
  | "partially_paid"
  | "refunded"
  | "void"
  | "unknown";

/**
 * Reimbursement lifecycle (relevant when paid_by = personally_paid).
 * PERSONAL_PAID ≈ unclaimed personal outlay waiting to enter the claim flow.
 */
export type SoftwareSaasReimbursementStatus =
  | "NOT_APPLICABLE"
  | "PERSONAL_PAID"
  | "UNCLAIMED"
  | "CLAIM_READY"
  | "REIMBURSED"
  | "NEEDS_REVIEW";

/** How the expense record was created. */
export type SoftwareSaasExpenseSource =
  | "provider_sync"
  | "invoice_import"
  | "receipt_upload"
  | "manual_entry"
  | "unknown";

/**
 * Canonical Software & SaaS expense shape.
 * Intentionally separate from FinancialExpense so accounting data stays untouched.
 */
export type SoftwareSaasExpense = {
  id: string;
  provider: SoftwareSaasProviderSlug;
  /** Human-facing invoice / receipt reference. */
  invoiceReceiptReference: string | null;
  /** Invoice / receipt date (ISO). */
  invoiceDate: string;
  amount: number;
  currency: string;
  /** Tax / VAT amount when available. */
  taxAmount: number | null;
  taxCurrency: string | null;
  paymentStatus: SoftwareSaasPaymentStatus;
  paidBy: SoftwareSaasPaidBy;
  reimbursementStatus: SoftwareSaasReimbursementStatus;
  reimbursementDate: string | null;
  reimbursementReference: string | null;
  /** Provider-native transaction or invoice id (idempotent import key). */
  providerTransactionId: string | null;
  /** Storage key / URL / file id for the source invoice or receipt document. */
  sourceDocumentRef: string | null;
  description: string;
  businessPurpose: string;
  /** Inclusive billing period when known. */
  billingPeriod: {
    start: string;
    end: string;
  } | null;
  source: SoftwareSaasExpenseSource;
  createdAt: string;
  updatedAt: string;
};

/** Draft used when a future adapter proposes an expense from billing/invoice data. */
export type SoftwareSaasExpenseDraft = Omit<
  SoftwareSaasExpense,
  "id" | "createdAt" | "updatedAt" | "reimbursementDate" | "reimbursementReference"
> & {
  id?: string;
  reimbursementDate?: string | null;
  reimbursementReference?: string | null;
};

export const SOFTWARE_SAAS_PAID_BY_LABELS: Record<SoftwareSaasPaidBy, string> = {
  personally_paid: "Personally paid",
  company_paid: "Company paid",
  corporate_card: "Corporate card",
  other: "Other",
};

export const SOFTWARE_SAAS_PAYMENT_STATUS_LABELS: Record<SoftwareSaasPaymentStatus, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_paid: "Partially paid",
  refunded: "Refunded",
  void: "Void",
  unknown: "Unknown",
};

export const SOFTWARE_SAAS_REIMBURSEMENT_STATUS_LABELS: Record<
  SoftwareSaasReimbursementStatus,
  string
> = {
  NOT_APPLICABLE: "Not applicable",
  PERSONAL_PAID: "Personally paid",
  UNCLAIMED: "Unclaimed",
  CLAIM_READY: "Claim ready",
  REIMBURSED: "Reimbursed",
  NEEDS_REVIEW: "Needs review",
};

export function defaultReimbursementStatusForPaidBy(
  paidBy: SoftwareSaasPaidBy,
): SoftwareSaasReimbursementStatus {
  return paidBy === "personally_paid" ? "PERSONAL_PAID" : "NOT_APPLICABLE";
}

export function isUnclaimedReimbursementStatus(
  status: SoftwareSaasReimbursementStatus,
): boolean {
  return status === "PERSONAL_PAID" || status === "UNCLAIMED" || status === "CLAIM_READY";
}

export function createSoftwareSaasExpenseDraft(
  partial: Partial<
    Pick<
      SoftwareSaasExpenseDraft,
      | "id"
      | "taxAmount"
      | "taxCurrency"
      | "invoiceReceiptReference"
      | "billingPeriod"
      | "providerTransactionId"
      | "sourceDocumentRef"
      | "reimbursementDate"
      | "reimbursementReference"
      | "paidBy"
      | "paymentStatus"
      | "source"
      | "reimbursementStatus"
      | "description"
      | "businessPurpose"
    >
  > &
    Pick<SoftwareSaasExpenseDraft, "provider" | "invoiceDate" | "amount" | "currency">,
): SoftwareSaasExpenseDraft {
  const paidBy = partial.paidBy ?? "personally_paid";
  return {
    provider: partial.provider,
    invoiceDate: partial.invoiceDate,
    amount: partial.amount,
    currency: partial.currency,
    description: partial.description ?? "",
    businessPurpose: partial.businessPurpose ?? "",
    id: partial.id,
    paidBy,
    paymentStatus: partial.paymentStatus ?? "paid",
    reimbursementStatus:
      partial.reimbursementStatus ?? defaultReimbursementStatusForPaidBy(paidBy),
    taxAmount: partial.taxAmount ?? null,
    taxCurrency: partial.taxCurrency ?? null,
    invoiceReceiptReference: partial.invoiceReceiptReference ?? null,
    sourceDocumentRef: partial.sourceDocumentRef ?? null,
    billingPeriod: partial.billingPeriod ?? null,
    providerTransactionId: partial.providerTransactionId ?? null,
    source: partial.source ?? "unknown",
    reimbursementDate: partial.reimbursementDate ?? null,
    reimbursementReference: partial.reimbursementReference ?? null,
  };
}
