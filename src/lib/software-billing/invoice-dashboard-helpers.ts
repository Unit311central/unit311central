/**
 * Derive dashboard accounting metrics from confirmed provider invoices.
 * Paid invoices drive Spend to Date; upcoming invoices drive Upcoming Spend.
 * Never mixes usage projections.
 */

import {
  buildSpendToDateFromActualCharges,
  emptyActualSpend,
  emptyProjectedSpend,
  emptySpendToDate,
  roundMoney,
  type ActualSpendBreakdown,
  type ProjectedSpendBreakdown,
  type SoftwareSaasActualChargeRecord,
  type SoftwareSaasProviderSlug,
  type SpendToDateState,
} from "@/lib/software-billing/dashboard-model";
import type { ProviderBillingInvoice } from "@/lib/software-billing/billing-invoice-model";
import {
  isPaidInvoice,
  isUpcomingInvoice,
  sumPaidInvoiceAmounts,
  sumUpcomingInvoiceAmounts,
  hasConfirmedFinalInvoiceAmount,
  hasValidProviderInvoiceIdentity,
} from "@/lib/software-billing/billing-invoice-model";

function isoMonth(iso: string | null | undefined) {
  return iso ? iso.slice(0, 7) : null;
}

function previousCalendarMonth(reference = new Date()) {
  const year = reference.getUTCFullYear();
  const month = reference.getUTCMonth();
  const prev = new Date(Date.UTC(month === 0 ? year - 1 : year, month === 0 ? 11 : month - 1, 1));
  return prev.toISOString().slice(0, 7);
}

export function invoicesToActualCharges(
  invoices: readonly ProviderBillingInvoice[],
): SoftwareSaasActualChargeRecord[] {
  return invoices
    .filter(isPaidInvoice)
    .filter(hasConfirmedFinalInvoiceAmount)
    .filter(hasValidProviderInvoiceIdentity)
    .map((invoice) => ({
      id: invoice.id,
      provider: invoice.providerSlug,
      source: "historical_invoice" as const,
      invoiceDate: invoice.paymentDate ?? invoice.invoiceDate ?? invoice.billingPeriodEnd?.slice(0, 10) ?? "",
      billingPeriod:
        invoice.billingPeriodStart && invoice.billingPeriodEnd
          ? { start: invoice.billingPeriodStart, end: invoice.billingPeriodEnd }
          : null,
      description: invoice.description,
      amount: invoice.amount,
      currency: invoice.currency,
      taxAmount: invoice.taxAmount,
      invoiceReceiptReference: invoice.invoiceNumber,
      providerTransactionId: invoice.providerTransactionId,
      sourceDocumentRef: invoice.sourceDocumentRef,
    }));
}

export function buildProviderAccountingFromInvoices(input: {
  providerSlug: SoftwareSaasProviderSlug;
  currency: string;
  invoices: readonly ProviderBillingInvoice[];
  referenceMonth?: string;
}): {
  lastMonth: ActualSpendBreakdown;
  upcoming: ProjectedSpendBreakdown;
  spendToDate: SpendToDateState;
} {
  const { providerSlug, currency } = input;
  const providerInvoices = input.invoices.filter((row) => row.providerSlug === providerSlug);
  const paid = providerInvoices.filter(
    (row) =>
      isPaidInvoice(row) &&
      hasConfirmedFinalInvoiceAmount(row) &&
      hasValidProviderInvoiceIdentity(row),
  );
  const upcoming = providerInvoices.filter(
    (row) =>
      isUpcomingInvoice(row) &&
      hasConfirmedFinalInvoiceAmount(row) &&
      hasValidProviderInvoiceIdentity(row),
  );
  const refMonth = input.referenceMonth ?? previousCalendarMonth();

  const lastMonthPaid = paid.filter(
    (row) => isoMonth(row.billingPeriodEnd ?? row.paymentDate) === refMonth,
  );
  const lastMonthTotal = roundMoney(sumPaidInvoiceAmounts(lastMonthPaid));

  const lastMonth =
    lastMonthPaid.length > 0
      ? {
          kind: "actual" as const,
          total: lastMonthTotal,
          subscription: 0,
          additionalUsageOrCredits: lastMonthTotal,
          currency,
          note: `Confirmed paid invoices for ${refMonth}`,
        }
      : emptyActualSpend(currency, "No confirmed paid invoices for last completed month.");

  const upcomingTotal = roundMoney(sumUpcomingInvoiceAmounts(upcoming));
  const upcomingSpend =
    upcomingTotal > 0
      ? {
          kind: "projected" as const,
          expectedTotal: upcomingTotal,
          subscription: 0,
          projectedAdditionalUsageOrCredits: upcomingTotal,
          currency,
          isEstimate: true as const,
          note: "Unpaid/upcoming provider invoices — not spend to date until paid",
        }
      : emptyProjectedSpend(currency, "No upcoming invoices recorded.");

  const charges = invoicesToActualCharges(paid);
  const spendToDate =
    charges.length > 0
      ? buildSpendToDateFromActualCharges({
          currency,
          charges,
          historicalImportComplete: paid.length > 0,
          statusLabelWhenComplete: "Spend to date from confirmed paid provider invoices.",
        })
      : emptySpendToDate(
          currency,
          "No confirmed paid invoices imported yet.",
          "awaiting_historical_import",
        );

  return { lastMonth, upcoming: upcomingSpend, spendToDate };
}

export function buildTotalSoftwareAccountingFromInvoices(input: {
  currency: string;
  invoices: readonly ProviderBillingInvoice[];
  referenceMonth?: string;
}) {
  const paid = input.invoices.filter(
    (row) =>
      isPaidInvoice(row) &&
      hasConfirmedFinalInvoiceAmount(row) &&
      hasValidProviderInvoiceIdentity(row),
  );
  const upcoming = input.invoices.filter(
    (row) =>
      isUpcomingInvoice(row) &&
      hasConfirmedFinalInvoiceAmount(row) &&
      hasValidProviderInvoiceIdentity(row),
  );
  const refMonth = input.referenceMonth ?? previousCalendarMonth();
  const lastMonthTotal = roundMoney(
    sumPaidInvoiceAmounts(
      paid.filter((row) => isoMonth(row.billingPeriodEnd ?? row.paymentDate) === refMonth),
    ),
  );
  const upcomingTotal = roundMoney(sumUpcomingInvoiceAmounts(upcoming));
  const charges = invoicesToActualCharges(paid);

  return {
    lastMonth: {
      kind: "actual" as const,
      total: lastMonthTotal,
      subscription: 0,
      additionalUsageOrCredits: lastMonthTotal,
      currency: input.currency,
      note: "Confirmed paid software invoices (all providers)",
    },
    upcoming: {
      kind: "projected" as const,
      expectedTotal: upcomingTotal,
      subscription: 0,
      projectedAdditionalUsageOrCredits: upcomingTotal,
      currency: input.currency,
      isEstimate: true as const,
      note: "Upcoming/unpaid software invoices (all providers)",
    },
    spendToDate:
      charges.length > 0
        ? buildSpendToDateFromActualCharges({
            currency: input.currency,
            charges,
            historicalImportComplete: true,
            statusLabelWhenComplete:
              "Total software spend to date from confirmed paid invoices across all providers.",
          })
        : emptySpendToDate(input.currency, "No confirmed paid software invoices yet."),
  };
}
