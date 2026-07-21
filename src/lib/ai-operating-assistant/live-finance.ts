import { listInvoices } from "@/lib/accounting/invoices-service";
import type { LedgerInvoice } from "@/lib/accounting/types";

/**
 * Live AR helpers for the Executive AI layer.
 * Never fall back to mock debtors / fabricated revenue.
 */

export function isLiveInvoiceOverdue(invoice: LedgerInvoice, now = new Date()) {
  if (invoice.status === "cancelled" || invoice.status === "draft" || invoice.status === "paid") {
    return false;
  }
  if (invoice.status === "overdue") return true;
  const due = new Date(`${invoice.dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) return false;
  return due.getTime() < now.getTime();
}

export function daysOverdue(invoice: LedgerInvoice, now = new Date()) {
  const due = new Date(`${invoice.dueDate}T12:00:00`);
  if (Number.isNaN(due.getTime())) return 0;
  const ms = now.getTime() - due.getTime();
  return ms <= 0 ? 0 : Math.floor(ms / (1000 * 60 * 60 * 24));
}

export type LiveInvoiceLoad =
  | { ok: true; invoices: LedgerInvoice[]; overdue: LedgerInvoice[] }
  | { ok: false; invoices: []; overdue: []; error: string };

export async function loadLiveInvoices(): Promise<LiveInvoiceLoad> {
  try {
    const invoices = await listInvoices();
    const overdue = invoices.filter((invoice) => isLiveInvoiceOverdue(invoice));
    return { ok: true, invoices, overdue };
  } catch (error) {
    return {
      ok: false,
      invoices: [],
      overdue: [],
      error: error instanceof Error ? error.message : "Live invoice ledger unavailable",
    };
  }
}
