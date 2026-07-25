"use client";

import { useEffect, useState } from "react";
import { ChartTooltip } from "@/components/dashboard/ChartTooltip";
import DashboardTopTilesBar from "@/components/testflighthub/DashboardTopTilesBar";
import {
  DEBTORS_ACCOUNTS,
  DEBTORS_AGING_DATA,
  DEBTORS_KPIS,
  DEBTORS_MONTHLY_TREND,
  formatLedgerCurrency,
  formatLedgerDate,
  ledgerStatusClass,
  ledgerStatusLabel,
  type LedgerAccountRow,
  type LedgerAgingBucket,
  type LedgerKpi,
  type LedgerMonthlyPoint,
} from "@/lib/financials-ledger-mock-data";
import { buildDebtorsLedger } from "@/lib/live-ledger-dashboard";
import {
  DEBTORS_DASHBOARD_TILES,
  DEFAULT_DEBTORS_TILE_LAYOUT,
} from "@/lib/view-dashboard-tile-catalogs";
import { cn } from "@/lib/utils";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function panelClassName() {
  return "rounded-2xl border border-white/10 bg-[#0a1422]/80 p-4 shadow-[0_12px_40px_rgba(0,0,0,0.35)] sm:p-5";
}

function KpiCard({ kpi }: { kpi: LedgerKpi }) {
  return (
    <article className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">{kpi.label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{kpi.value}</p>
      <p className="mt-2 text-xs text-white/45">{kpi.hint}</p>
    </article>
  );
}

export default function DebtorsWorkspace() {
  const [kpis, setKpis] = useState<LedgerKpi[]>(DEBTORS_KPIS);
  const [aging, setAging] = useState<LedgerAgingBucket[]>(DEBTORS_AGING_DATA);
  const [accounts, setAccounts] = useState<LedgerAccountRow[]>(DEBTORS_ACCOUNTS);
  const [monthly, setMonthly] = useState<LedgerMonthlyPoint[]>(DEBTORS_MONTHLY_TREND);
  const [tiles, setTiles] = useState(DEBTORS_DASHBOARD_TILES);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const response = await fetch("/api/financials/invoices", { cache: "no-store" });
        if (!response.ok) return;
        const payload = (await response.json()) as {
          invoices?: Array<{
            id: string;
            clientId?: string | null;
            clientName?: string | null;
            invoiceNumber?: string | null;
            amount: number;
            currency?: string | null;
            status: string;
            dueDate?: string | null;
            issueDate?: string | null;
          }>;
        };
        const ledger = buildDebtorsLedger(payload.invoices ?? []);
        if (cancelled) return;
        setKpis(ledger.kpis);
        setAging(ledger.aging);
        setAccounts(ledger.accounts);
        setMonthly(ledger.monthly.length ? ledger.monthly : DEBTORS_MONTHLY_TREND);
        setTiles(ledger.tiles);
      } catch {
        // Keep fallback mock if API unavailable.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <DashboardTopTilesBar
        storageKey="unit311-debtors-dashboard-tiles"
        catalog={tiles}
        defaultLayout={DEFAULT_DEBTORS_TILE_LAYOUT}
        title="Debtors key details"
        showCustomizeHint={false}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className={panelClassName()}>
          <h3 className="text-sm font-semibold text-white">Outstanding by ageing</h3>
          <p className="mt-1 text-xs text-white/45">Receivables grouped by days outstanding (€k)</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={aging} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  tickFormatter={(value: number) => `€${value}k`}
                />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      label={String(label ?? "")}
                      suffix="k"
                      payload={payload?.map((entry) => ({
                        name: String(entry.name ?? "Outstanding"),
                        value: entry.value as number,
                        color: String(entry.color ?? "#38bdf8"),
                      }))}
                    />
                  )}
                />
                <Bar dataKey="amount" name="Outstanding" radius={[6, 6, 0, 0]}>
                  {aging.map((entry) => (
                    <Cell key={entry.bucket} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className={panelClassName()}>
          <h3 className="text-sm font-semibold text-white">Collections trend</h3>
          <p className="mt-1 text-xs text-white/45">Outstanding vs settled (000s)</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload, label }) => (
                    <ChartTooltip
                      active={active}
                      label={String(label ?? "")}
                      payload={payload?.map((entry) => ({
                        name: String(entry.name ?? ""),
                        value: entry.value as number,
                        color: String(entry.color ?? "#38bdf8"),
                      }))}
                    />
                  )}
                />
                <Legend />
                <Line type="monotone" dataKey="outstanding" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="settled" stroke="#34d399" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className={panelClassName()}>
        <h3 className="text-sm font-semibold text-white">Open receivable accounts</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                <th className="pb-2 pr-4 font-medium">Client</th>
                <th className="pb-2 pr-4 font-medium">Reference</th>
                <th className="pb-2 pr-4 font-medium">Outstanding</th>
                <th className="pb-2 pr-4 font-medium">Due</th>
                <th className="pb-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((row) => (
                <tr key={row.id} className="border-t border-white/5">
                  <td className="py-3 pr-4 text-white">{row.name}</td>
                  <td className="py-3 pr-4 text-white/70">{row.reference}</td>
                  <td className="py-3 pr-4 text-white">{formatLedgerCurrency(row.outstanding)}</td>
                  <td className="py-3 pr-4 text-white/70">{formatLedgerDate(row.dueDate)}</td>
                  <td className="py-3">
                    <span className={cn("rounded-full px-2 py-0.5 text-xs", ledgerStatusClass(row.status))}>
                      {ledgerStatusLabel(row.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
