/**
 * Northstar demo — supplier AP draft bills for Track C ingest workflow.
 */

import type { SupplierInvoiceDraft } from "@/lib/accounting/types";

const WS = "demo-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

const SEED: SupplierInvoiceDraft[] = [
  {
    id: "nst-ap-draft-001",
    workspaceId: WS,
    supplier: "Midlands Industrial Supplies Ltd",
    reference: "MIS-88421",
    amount: 4_280,
    currency: "GBP",
    invoiceDate: "2026-08-12",
    dueDate: "2026-09-11",
    description: "Sensor mounting hardware — Q3 replenishment",
    status: "draft",
    journalEntryId: null,
    sourceText: "Supplier: Midlands Industrial Supplies Ltd\nInvoice number: MIS-88421\nTotal due: GBP 4,280.00",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

let drafts = [...SEED];

export function getNorthstarSupplierInvoiceDrafts(): SupplierInvoiceDraft[] {
  return drafts.map((row) => ({ ...row }));
}

export function getNorthstarSupplierInvoiceDraftById(id: string): SupplierInvoiceDraft | null {
  return getNorthstarSupplierInvoiceDrafts().find((row) => row.id === id) ?? null;
}

export function upsertNorthstarSupplierInvoiceDraft(draft: SupplierInvoiceDraft) {
  const index = drafts.findIndex((row) => row.id === draft.id);
  if (index >= 0) drafts[index] = draft;
  else drafts.push(draft);
  return draft;
}

export function deleteNorthstarSupplierInvoiceDraft(id: string) {
  const index = drafts.findIndex((row) => row.id === id);
  if (index < 0) return false;
  drafts.splice(index, 1);
  return true;
}
