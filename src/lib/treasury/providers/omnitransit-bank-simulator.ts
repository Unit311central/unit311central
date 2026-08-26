/**
 * OmniTransit simulated bank connection (ZAR demo — not a live bank feed).
 */

import { SAEC_CASH_BALANCE_ZAR } from "@/lib/saec/saec-financials";
import { SAEC_REPORTING_CURRENCY } from "@/lib/saec-surface";
import type { TreasuryTransaction } from "@/lib/treasury/treasury-types";
import type { WiseBalance, WiseConnectionStatus } from "@/lib/wise-service";

const OMT_PROFILE_ID = 3112026;
const NOW = "2026-08-16T10:00:00.000Z";

export const OMNITRANSIT_BANK_BALANCES_ZAR = {
  operating: 14_200_000,
  payroll: 5_400_000,
  reserves: 4_800_000,
} as const;

export function getOmniTransitBankConnectionStatus(): WiseConnectionStatus {
  return {
    configured: true,
    profileId: OMT_PROFILE_ID,
    connected: true,
    profileName: "OmniTransit — Standard Bank Treasury (demo)",
    profileType: "BUSINESS",
    error: null,
    scaPrivateKeyConfigured: false,
    scaKey: {
      configured: false,
      parseable: false,
      keyFormat: null,
      publicKeyFingerprint: null,
      error: null,
    },
  };
}

export function listOmniTransitBankBalances(): WiseBalance[] {
  return [
    {
      id: 3112601,
      currency: SAEC_REPORTING_CURRENCY,
      type: "STANDARD",
      name: "Operating — Standard Bank Business",
      amount: OMNITRANSIT_BANK_BALANCES_ZAR.operating,
      reservedAmount: 0,
      regionLabel: "South Africa",
      accountRef: "OMT-OP-ZAR",
      modificationTime: NOW,
    },
    {
      id: 3112602,
      currency: SAEC_REPORTING_CURRENCY,
      type: "STANDARD",
      name: "Payroll — Standard Bank Business",
      amount: OMNITRANSIT_BANK_BALANCES_ZAR.payroll,
      reservedAmount: 0,
      regionLabel: "South Africa",
      accountRef: "OMT-PR-ZAR",
      modificationTime: NOW,
    },
    {
      id: 3112603,
      currency: SAEC_REPORTING_CURRENCY,
      type: "SAVINGS",
      name: "Reserves — Treasury ZAR",
      amount: OMNITRANSIT_BANK_BALANCES_ZAR.reserves,
      reservedAmount: 0,
      regionLabel: "South Africa",
      accountRef: "OMT-RSV-ZAR",
      modificationTime: NOW,
    },
  ];
}

export function getOmniTransitTreasuryCashZar(): number {
  return listOmniTransitBankBalances().reduce(
    (sum, balance) => sum + (Number(balance.amount) || 0),
    0,
  );
}

const SAMPLE_TXS: Array<{
  balanceId: number;
  currency: string;
  date: string;
  direction: "CREDIT" | "DEBIT";
  description: string;
  reference: string;
  amount: number;
}> = [
  {
    balanceId: 3112601,
    currency: SAEC_REPORTING_CURRENCY,
    date: "2026-08-14",
    direction: "CREDIT",
    description: "Hyprop Centurion — progress invoice receipt",
    reference: "INV-OMT-2026-088",
    amount: 2_400_000,
  },
  {
    balanceId: 3112601,
    currency: SAEC_REPORTING_CURRENCY,
    date: "2026-08-12",
    direction: "DEBIT",
    description: "CANNY escalator spares — supplier payment",
    reference: "PO-OMT-4521",
    amount: 890_000,
  },
  {
    balanceId: 3112602,
    currency: SAEC_REPORTING_CURRENCY,
    date: "2026-08-10",
    direction: "DEBIT",
    description: "National payroll run — August",
    reference: "PAY-AUG-2026",
    amount: 4_200_000,
  },
  {
    balanceId: 3112601,
    currency: SAEC_REPORTING_CURRENCY,
    date: "2026-08-08",
    direction: "CREDIT",
    description: "Growthpoint Ponte — maintenance contract",
    reference: "INV-OMT-2026-082",
    amount: 1_150_000,
  },
];

export function getOmniTransitBankBalanceTransactions(input: {
  balanceId: number;
  currency: string;
  intervalStart: string;
  intervalEnd: string;
}): {
  source: "statement";
  statementWarning: null;
  transactions: TreasuryTransaction[];
  statement: null;
} {
  const start = new Date(input.intervalStart).getTime();
  const end = new Date(input.intervalEnd).getTime();
  const transactions = SAMPLE_TXS.filter((tx) => {
    const matchesBalance =
      tx.balanceId === input.balanceId || tx.currency === input.currency;
    if (!matchesBalance) return false;
    const t = new Date(tx.date).getTime();
    return t >= start && t <= end;
  }).map(
    (tx): TreasuryTransaction => ({
      id: `omt-${tx.reference}`,
      balanceId: tx.balanceId,
      currency: tx.currency,
      date: tx.date,
      direction: tx.direction === "CREDIT" ? "incoming" : "outgoing",
      description: tx.description,
      reference: tx.reference,
      counterparty: "OmniTransit Treasury (demo)",
      amount: tx.amount,
      fee: null,
      runningBalance: null,
      status: "completed",
      raw: {},
    }),
  );

  return {
    source: "statement",
    statementWarning: null,
    transactions,
    statement: null,
  };
}
