"use client";

import { formatReportingMoney } from "@/lib/financial-reporting-currency";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";

type Props = {
  areaTitle?: string;
  areaDescription?: string;
};

export default function CustomerTreasuryZeroPanel({ areaTitle, areaDescription }: Props) {
  const currency = useWorkspaceReportingCurrency();
  const money = (amount: number) => formatReportingMoney(amount, currency);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
          Banking & Cash
        </p>
        <h2 className="mt-1 text-lg font-semibold text-white">
          {areaTitle ?? "Cash position"}
        </h2>
        <p className="mt-1 text-sm text-white/55">
          {areaDescription ??
            "Bank connections are not configured for this workspace yet. Cash balances show as zero until a connection is enabled."}
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Cash balance</p>
          <p className="mt-1 text-2xl font-semibold text-white">{money(0)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Available</p>
          <p className="mt-1 text-2xl font-semibold text-white">{money(0)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
          <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">Pending reconciliation</p>
          <p className="mt-1 text-2xl font-semibold text-white">{money(0)}</p>
        </div>
      </section>

      <p className="text-sm text-white/45">
        Reconciliation and live bank feeds will appear here once treasury connections are enabled for
        this workspace.
      </p>
    </div>
  );
}
