import {
  PROFESSIONAL_MONTHLY_LABEL,
  PROFESSIONAL_QUARTERLY_USD,
} from "@/lib/platform-pricing";

export type InvoiceStatus = "paid" | "awaiting";

export type BillingInvoice = {
  id: string;
  number: string;
  status: InvoiceStatus;
  issuedAt: string;
  amountUsd: number;
};

export const BILLING_PLAN = {
  name: "Professional",
  status: "Active" as const,
  priceLabel: `${PROFESSIONAL_MONTHLY_LABEL}/month`,
  billingCycle: "Quarterly",
  nextInvoiceDate: "1 October 2026",
};

export const BILLING_PAYMENT_METHOD = {
  type: "Bank transfer" as const,
  last4: "",
  masked: "Wise · invoice reference matching",
};

export const BILLING_INVOICES: BillingInvoice[] = [
  {
    id: "inv-1001",
    number: "INV-1001",
    status: "paid",
    issuedAt: "2026-04-01",
    amountUsd: PROFESSIONAL_QUARTERLY_USD,
  },
  {
    id: "inv-1002",
    number: "INV-1002",
    status: "paid",
    issuedAt: "2026-01-01",
    amountUsd: PROFESSIONAL_QUARTERLY_USD,
  },
  {
    id: "inv-1003",
    number: "INV-1003",
    status: "awaiting",
    issuedAt: "2026-07-01",
    amountUsd: PROFESSIONAL_QUARTERLY_USD,
  },
];

export function invoiceStatusLabel(status: InvoiceStatus) {
  return status === "paid" ? "Paid" : "Awaiting payment";
}
