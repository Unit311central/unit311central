/**
 * ABHI simulated Wise treasury (GBP demo — not a live bank feed).
 */

import { ABHI_CASH_BALANCE_GBP } from "@/lib/abhi-financials";
import { ABHI_REPORTING_CURRENCY } from "@/lib/abhi-surface";
import type { TreasuryTransaction } from "@/lib/treasury/treasury-types";
import type { WiseBalance, WiseConnectionStatus } from "@/lib/wise-service";

const ABHI_PROFILE_ID = 3112027;
const NOW = "2026-08-01T12:00:00.000Z";

/** Split of {@link ABHI_CASH_BALANCE_GBP} across operating accounts. */
export const ABHI_BANK_BALANCES_GBP = {
  operating: 620_000,
  payroll: 280_000,
  reserves: 100_000,
} as const;

function assertAbhiBankBalancesTotal() {
  const total =
    ABHI_BANK_BALANCES_GBP.operating +
    ABHI_BANK_BALANCES_GBP.payroll +
    ABHI_BANK_BALANCES_GBP.reserves;
  if (Math.round(total) !== ABHI_CASH_BALANCE_GBP) {
    throw new Error(
      `ABHI bank simulator balances must sum to ${ABHI_CASH_BALANCE_GBP} GBP (got ${total}).`,
    );
  }
}

assertAbhiBankBalancesTotal();

export function getAbhiBankConnectionStatus(): WiseConnectionStatus {
  return {
    configured: true,
    profileId: ABHI_PROFILE_ID,
    connected: true,
    profileName: "ABHI — Wise Business Treasury (demo)",
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

export function listAbhiBankBalances(): WiseBalance[] {
  return [
    {
      id: 3112701,
      currency: ABHI_REPORTING_CURRENCY,
      type: "STANDARD",
      name: "Operating — Wise GBP",
      amount: ABHI_BANK_BALANCES_GBP.operating,
      reservedAmount: 0,
      regionLabel: "United Kingdom",
      accountRef: "ABHI-OP-GBP",
      modificationTime: NOW,
    },
    {
      id: 3112702,
      currency: ABHI_REPORTING_CURRENCY,
      type: "STANDARD",
      name: "Payroll — Wise GBP",
      amount: ABHI_BANK_BALANCES_GBP.payroll,
      reservedAmount: 0,
      regionLabel: "United Kingdom",
      accountRef: "ABHI-PR-GBP",
      modificationTime: NOW,
    },
    {
      id: 3112703,
      currency: ABHI_REPORTING_CURRENCY,
      type: "SAVINGS",
      name: "Reserves — Wise GBP",
      amount: ABHI_BANK_BALANCES_GBP.reserves,
      reservedAmount: 0,
      regionLabel: "United Kingdom",
      accountRef: "ABHI-RSV-GBP",
      modificationTime: NOW,
    },
  ];
}

export function getAbhiTreasuryCashGbp(): number {
  return listAbhiBankBalances().reduce(
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
    balanceId: 3112701,
    currency: "GBP",
    date: "2026-07-28",
    direction: "CREDIT",
    description: "Corporate membership renewals — batch",
    reference: "ABHI-TX-REN-0728",
    amount: 42_500,
  },
  {
    balanceId: 3112701,
    currency: "GBP",
    date: "2026-07-22",
    direction: "DEBIT",
    description: "MedTech Expo — venue deposit",
    reference: "ABHI-TX-EVT-0722",
    amount: 18_400,
  },
  {
    balanceId: 3112702,
    currency: "GBP",
    date: "2026-07-15",
    direction: "DEBIT",
    description: "Payroll run — July",
    reference: "ABHI-TX-PAY-0715",
    amount: 276_000,
  },
  {
    balanceId: 3112703,
    currency: "GBP",
    date: "2026-07-05",
    direction: "CREDIT",
    description: "Reserve transfer from operating",
    reference: "ABHI-TX-XFER-0705",
    amount: 25_000,
  },
];

export function getAbhiBankBalanceTransactions(input: {
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
      id: `abhi-${tx.reference}`,
      balanceId: tx.balanceId,
      currency: tx.currency,
      date: tx.date,
      direction: tx.direction === "CREDIT" ? "incoming" : "outgoing",
      description: tx.description,
      reference: tx.reference,
      counterparty: "ABHI Treasury (demo)",
      amount: tx.amount,
      fee: null,
      runningBalance: null,
      status: "completed",
      raw: { ...tx, simulated: true },
    }),
  );

  return {
    source: "statement",
    statementWarning: null,
    transactions,
    statement: null,
  };
}
