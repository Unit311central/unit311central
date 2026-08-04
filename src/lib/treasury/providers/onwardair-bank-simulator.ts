/**
 * OnwardAir simulated Bank backend (non-connected, read-only demo).
 * Mirrors Demo Wise simulator UX without live API credentials.
 */

import {
  ONWARDAIR_BANK_BALANCES_USD,
  ONWARDAIR_CASH_BALANCE_USD,
  assertOnwardAirBankBalancesTotal,
} from "@/lib/onwardair-financials";
import type { TreasuryTransaction } from "@/lib/treasury/treasury-types";
import type { WiseBalance, WiseConnectionStatus } from "@/lib/wise-service";

assertOnwardAirBankBalancesTotal();

const OA_PROFILE_ID = 3112023;
const NOW = "2026-08-01T12:00:00.000Z";

export function getOnwardAirBankConnectionStatus(): WiseConnectionStatus {
  return {
    configured: true,
    profileId: OA_PROFILE_ID,
    connected: true,
    profileName: "OnwardAir — Operating Treasury (demo)",
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

export function listOnwardAirBankBalances(): WiseBalance[] {
  return [
    {
      id: 3111001,
      currency: "USD",
      type: "STANDARD",
      name: "Operating — Chase Business",
      amount: ONWARDAIR_BANK_BALANCES_USD.operating,
      reservedAmount: 0,
      regionLabel: "United States",
      accountRef: "OA-OP-USD",
      modificationTime: NOW,
    },
    {
      id: 3111002,
      currency: "USD",
      type: "STANDARD",
      name: "Payroll — Chase Business",
      amount: ONWARDAIR_BANK_BALANCES_USD.payroll,
      reservedAmount: 0,
      regionLabel: "United States",
      accountRef: "OA-PR-USD",
      modificationTime: NOW,
    },
    {
      id: 3111003,
      currency: "USD",
      type: "SAVINGS",
      name: "Reserves — Treasury USD",
      amount: ONWARDAIR_BANK_BALANCES_USD.reserves,
      reservedAmount: 0,
      regionLabel: "United States",
      accountRef: "OA-RSV-USD",
      modificationTime: NOW,
    },
  ];
}

/** Total simulated treasury in USD (same unit as OA reporting). */
export function getOnwardAirTreasuryCashUsd(): number {
  const total = listOnwardAirBankBalances().reduce(
    (sum, balance) => sum + (Number(balance.amount) || 0),
    0,
  );
  return total > 0 ? Math.round(total * 100) / 100 : ONWARDAIR_CASH_BALANCE_USD;
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
    balanceId: 3111001,
    currency: "USD",
    date: "2026-07-28",
    direction: "DEBIT",
    description: "AWS — cloud hosting (Houston R&D)",
    reference: "OA-TX-AWS-0728",
    amount: 4_820,
  },
  {
    balanceId: 3111001,
    currency: "USD",
    date: "2026-07-22",
    direction: "DEBIT",
    description: "United Airlines — staff travel",
    reference: "OA-TX-UA-0722",
    amount: 2_140,
  },
  {
    balanceId: 3111002,
    currency: "USD",
    date: "2026-07-15",
    direction: "DEBIT",
    description: "Payroll run — July mid-month",
    reference: "OA-TX-PAY-0715",
    amount: 50_000,
  },
  {
    balanceId: 3111001,
    currency: "USD",
    date: "2026-07-08",
    direction: "DEBIT",
    description: "Hilton Houston — flight-test lodging",
    reference: "OA-TX-HIL-0708",
    amount: 3_680,
  },
  {
    balanceId: 3111003,
    currency: "USD",
    date: "2026-06-30",
    direction: "CREDIT",
    description: "Interest — USD reserves",
    reference: "OA-TX-INT-0630",
    amount: 420,
  },
  {
    balanceId: 3111001,
    currency: "USD",
    date: "2026-06-18",
    direction: "DEBIT",
    description: "McMaster-Carr — lab equipment",
    reference: "OA-TX-MC-0618",
    amount: 6_250,
  },
  {
    balanceId: 3111002,
    currency: "USD",
    date: "2026-06-15",
    direction: "DEBIT",
    description: "Payroll run — June mid-month",
    reference: "OA-TX-PAY-0615",
    amount: 50_000,
  },
  {
    balanceId: 3111001,
    currency: "USD",
    date: "2026-05-20",
    direction: "CREDIT",
    description: "DoD STTR Phase I — grant disbursement",
    reference: "OA-TX-GRANT-0520",
    amount: 87_500,
  },
];

export function getOnwardAirBankBalanceTransactions(input: {
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
      id: `oa-${tx.reference}`,
      balanceId: tx.balanceId,
      currency: tx.currency,
      date: tx.date,
      direction: tx.direction === "CREDIT" ? "incoming" : "outgoing",
      description: tx.description,
      reference: tx.reference,
      counterparty: tx.description,
      amount: tx.amount,
      fee: 0,
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
