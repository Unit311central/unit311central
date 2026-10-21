import type { FinancialOverviewSnapshot } from "@/lib/accounting/types";

export type FinanceDashboardMotionAudit = {
  cashPosition: number;
  revenueYtd: number;
  accountsReceivable: number;
  accountsPayable: number;
  netProfit: number;
  marginPct: number;
  liquidity: Array<{ name: string; value: number }>;
  arAgeing: Array<{ bucket: string; amount: number }>;
};

export function buildFinanceDashboardMotionAudit(
  overview: FinancialOverviewSnapshot,
): FinanceDashboardMotionAudit {
  const marginPct =
    overview.monthlyRevenue > 0
      ? Math.round(
          ((overview.monthlyRevenue - Math.round(overview.monthlyRevenue * 0.46)) /
            overview.monthlyRevenue) *
            100,
        )
      : 0;

  const liquidity = [
    { name: "Cash", value: Math.max(0, overview.cashPosition) },
    { name: "Receivable", value: Math.max(0, overview.accountsReceivable) },
    { name: "Payable", value: Math.max(0, overview.accountsPayable) },
  ].filter((row) => row.value > 0);

  return {
    cashPosition: overview.cashPosition,
    revenueYtd: overview.revenueYtd,
    accountsReceivable: overview.accountsReceivable,
    accountsPayable: overview.accountsPayable,
    netProfit: overview.netProfit,
    marginPct,
    liquidity,
    arAgeing: overview.ar.ageing.map((row) => ({
      bucket: row.bucket,
      amount: row.amount,
    })),
  };
}
