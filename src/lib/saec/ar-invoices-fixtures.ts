import type { LedgerInvoice } from "@/lib/accounting/types";
import { SAEC_ACCOUNTS_RECEIVABLE_ZAR } from "@/lib/saec/saec-financials";
import { SAEC_REPORTING_CURRENCY as CURRENCY } from "@/lib/saec-surface";

const WS = "saec-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

const OPEN_CLIENTS = [
  { id: "saec-cli-hyprop", name: "Hyprop Investments", amount: 3_200_000 },
  { id: "saec-cli-growthpoint", name: "Growthpoint Properties", amount: 2_800_000 },
  { id: "saec-cli-va-waterfront", name: "V&A Waterfront", amount: 2_400_000 },
  { id: "saec-cli-brooklyn", name: "Brooklyn Mall", amount: 2_000_000 },
  { id: "saec-cli-redefine", name: "Redefine Properties", amount: 2_000_000 },
  { id: "saec-cli-killarney", name: "Killarney Mall", amount: 2_000_000 },
];

function normalizeOpenTotal(amounts: number[]) {
  const total = amounts.reduce((sum, value) => sum + value, 0);
  if (total !== SAEC_ACCOUNTS_RECEIVABLE_ZAR) {
    amounts[amounts.length - 1]! += SAEC_ACCOUNTS_RECEIVABLE_ZAR - total;
  }
}

export function listSaecFixtureInvoices(): LedgerInvoice[] {
  const openAmounts = OPEN_CLIENTS.map((row) => row.amount);
  normalizeOpenTotal(openAmounts);

  const open: LedgerInvoice[] = OPEN_CLIENTS.map((client, index) => {
    const amount = openAmounts[index]!;
    const overdue = index < 2;
    return {
      id: `saec-inv-open-${index + 1}`,
      invoiceNumber: `SAEC-2026-${String(880 - index).padStart(4, "0")}`,
      clientId: client.id,
      clientName: client.name,
      organisationId: null,
      workspaceId: WS,
      issueDate: overdue ? "2026-07-01" : "2026-08-01",
      dueDate: overdue ? "2026-07-31" : "2026-08-31",
      currency: CURRENCY,
      amount,
      status: overdue ? "overdue" : "issued",
      paymentReference: "",
      pdfPath: null,
      journalEntryId: "saec-je-rev-2026-08",
      paymentJournalEntryId: null,
      paymentMethod: null,
      wiseMatched: false,
      wiseMatchedAt: null,
      wiseTransactionId: null,
      paidAt: null,
      createdAt: NOW,
      updatedAt: NOW,
    };
  });

  const paid: LedgerInvoice[] = [
    {
      id: "saec-inv-paid-1",
      invoiceNumber: "SAEC-2026-0860",
      clientId: "saec-cli-emperors",
      clientName: "Emperors Palace",
      organisationId: null,
      workspaceId: WS,
      issueDate: "2026-06-15",
      dueDate: "2026-07-15",
      currency: CURRENCY,
      amount: 1_850_000,
      status: "paid",
      paymentReference: "SAEC-0860",
      pdfPath: null,
      journalEntryId: "saec-je-rev-2026-06",
      paymentJournalEntryId: "saec-je-pay-0860",
      paymentMethod: "EFT",
      wiseMatched: false,
      wiseMatchedAt: null,
      wiseTransactionId: null,
      paidAt: "2026-07-10T09:00:00.000Z",
      createdAt: NOW,
      updatedAt: NOW,
    },
  ];

  return [...open, ...paid];
}
