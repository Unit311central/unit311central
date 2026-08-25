import type { SupplierInvoiceDraft } from "@/lib/accounting/types";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";

const WS = "saec-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

const SEED: SupplierInvoiceDraft[] = [
  {
    id: "saec-sup-inv-1",
    workspaceId: WS,
    supplier: "Elevate Components SA (demo)",
    reference: "ECS-2026-4421",
    amount: 2_400_000,
    currency: SAEC_REPORTING_CURRENCY,
    invoiceDate: "2026-08-01",
    dueDate: "2026-08-31",
    description: "Door operator kits — Gauteng installs",
    status: "draft",
    journalEntryId: null,
    sourceText:
      "Supplier: Elevate Components SA\nInvoice number: ECS-2026-4421\nTotal due: ZAR 2,400,000.00",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "saec-sup-inv-2",
    workspaceId: WS,
    supplier: "WireCo Southern Africa (demo)",
    reference: "WCS-2026-1188",
    amount: 1_600_000,
    currency: SAEC_REPORTING_CURRENCY,
    invoiceDate: "2026-08-05",
    dueDate: "2026-09-05",
    description: "Lift ropes and rigging",
    status: "draft",
    journalEntryId: null,
    sourceText: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "saec-sup-inv-3",
    workspaceId: WS,
    supplier: "Highveld Fleet Services (demo)",
    reference: "HFS-2026-0902",
    amount: 1_200_000,
    currency: SAEC_REPORTING_CURRENCY,
    invoiceDate: "2026-07-20",
    dueDate: "2026-08-20",
    description: "Service vehicle maintenance programme",
    status: "approved",
    journalEntryId: "saec-je-ap-hfs",
    sourceText: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

let drafts = [...SEED];

export function getSaecSupplierInvoiceDrafts(): SupplierInvoiceDraft[] {
  return drafts.map((row) => ({ ...row }));
}

export function getSaecSupplierInvoiceDraftById(id: string): SupplierInvoiceDraft | null {
  return getSaecSupplierInvoiceDrafts().find((row) => row.id === id) ?? null;
}

export function upsertSaecSupplierInvoiceDraft(draft: SupplierInvoiceDraft): SupplierInvoiceDraft {
  const index = drafts.findIndex((row) => row.id === draft.id);
  if (index >= 0) drafts[index] = draft;
  else drafts.push(draft);
  return draft;
}
