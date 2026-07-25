/**
 * Demo-only simulated Wise bank backend.
 * Never calls external Wise APIs. Data from Demo enterprise fixtures.
 */

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import type { TreasuryTransaction } from "@/lib/treasury/treasury-types";
import type { WiseBalance, WiseConnectionStatus } from "@/lib/wise-service";

export function getDemoWiseConnectionStatus(): WiseConnectionStatus {
  const wise = getDemoEnterpriseFixtures().wise;
  return {
    configured: true,
    profileId: wise.profileId,
    connected: true,
    profileName: wise.profileName,
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

export function listDemoWiseBalances(): WiseBalance[] {
  return getDemoEnterpriseFixtures().wise.balances.map((row) => ({
    id: row.id,
    currency: row.currency,
    type: row.type as "STANDARD" | "SAVINGS",
    name: row.name,
    amount: row.amount,
    reservedAmount: row.reservedAmount,
    regionLabel: row.regionLabel,
    accountRef: row.accountRef,
    modificationTime: row.modificationTime,
  }));
}

export function getDemoWiseBalanceTransactions(input: {
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
  const txs = getDemoEnterpriseFixtures()
    .wise.transactions.filter((tx) => {
      const matchesBalance =
        tx.balanceId === input.balanceId || tx.currency === input.currency;
      if (!matchesBalance) return false;
      const t = new Date(tx.date).getTime();
      return t >= start && t <= end;
    })
    .map(
      (tx): TreasuryTransaction => ({
        id: tx.id,
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
        status:
          tx.status === "pending"
            ? "pending"
            : tx.status === "failed"
              ? "failed"
              : "completed",
        raw: { ...tx, simulated: true },
      }),
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return {
    source: "statement",
    statementWarning: null,
    transactions: txs,
    statement: null,
  };
}
