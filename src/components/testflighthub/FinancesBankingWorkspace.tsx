"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

import type { FinancesShellView } from "@/lib/finances-nav";

import WiseWorkspace from "./WiseWorkspace";

type Props = {
  view: FinancesShellView;
};

export default function FinancesBankingWorkspace({ view }: Props) {
  const isReconciliation = view === "finances-banking-reconciliation";
  const title = isReconciliation ? "Reconciliation" : "Cash Position";
  const description = isReconciliation
    ? "Match bank receipts to ledger invoices and review treasury activity."
    : "Consolidated workspace cash position from treasury balances and ledger cash.";

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/90">
          Finances · Banking & Cash
        </p>
        <h2 className="mt-2 text-lg font-semibold text-white">{title}</h2>
        <p className="mt-1 text-sm text-white/55">{description}</p>
        {isReconciliation ? (
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="?view=accounts-receivable"
              className="inline-flex items-center gap-2 rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100"
            >
              Sync Wise payments in AR
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="?view=wise"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm font-semibold text-white/80"
            >
              Open Bank
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : null}
      </section>
      <WiseWorkspace
        treasuryView="dashboard"
        areaTitle={title}
        areaDescription={description}
      />
    </div>
  );
}
