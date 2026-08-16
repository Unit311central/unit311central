"use client";

import Link from "next/link";
import { Boxes, ShoppingCart, Truck, Wrench } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import {
  formatNorthstarGbp,
  getNorthstarInventoryCharts,
  getNorthstarOperationsDashboardSummary,
} from "@/lib/demo/northstar-operations-data";
import { getLogisticsMockShipments } from "@/lib/logistics-data";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const MIX_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6"];

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Wrench;
};

export default function NorthstarOperationsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);
  const summary = getNorthstarOperationsDashboardSummary(getLogisticsMockShipments());
  const inventoryCharts = getNorthstarInventoryCharts();

  const tiles: Tile[] = [
    {
      label: "Assets",
      value: formatNorthstarGbp(summary.assetsTotalValueGbp),
      hint: `${summary.assetsTotalCount} registered · ${formatNorthstarGbp(summary.assetsDepreciationGbp)} depreciation YTD`,
      href: href("assets"),
      icon: Wrench,
    },
    {
      label: "Inventory",
      value: String(summary.inventorySkuCount),
      hint: `${formatNorthstarGbp(summary.inventoryOnHandValueGbp)} on hand`,
      href: href("inventory-management"),
      icon: Boxes,
    },
    {
      label: "Procurement",
      value: formatNorthstarGbp(summary.procurementSpendMtdGbp),
      hint: `${summary.procurementOpenPos} open POs · MTD spend`,
      href: href("procurement"),
      icon: ShoppingCart,
    },
    {
      label: "Logistics",
      value: `${summary.logisticsInboundInTransit} in · ${summary.logisticsOutboundInTransit} out`,
      hint: `${summary.logisticsLatePct3Mo}% late (3 mo) · ${formatNorthstarGbp(summary.logisticsAvgCourierSpendGbp, 2)}/pkg avg`,
      href: href("logistics"),
      icon: Truck,
    },
  ];

  const procurementSpendPreview = [
    { month: "Mar", spend: 118_000 },
    { month: "Apr", spend: 132_000 },
    { month: "May", spend: 128_500 },
    { month: "Jun", spend: 145_200 },
    { month: "Jul", spend: 138_800 },
    { month: "Aug", spend: summary.procurementSpendMtdGbp },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="Operations dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          Northstar · Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          COO snapshot across assets, inventory, procurement, and logistics for global plant and
          delivery operations — GBP.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {tile.label}
                </p>
                <Icon className="h-4 w-4 text-sky-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Inventory · status mix</h2>
          <p className="mt-1 text-xs text-white/45">Registered stock and assigned assets</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={inventoryCharts.statusMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {inventoryCharts.statusMix.map((_, index) => (
                    <Cell key={index} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Inventory · value by location</h2>
          <p className="mt-1 text-xs text-white/45">On-hand value (GBP)</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart
                data={inventoryCharts.valueByLocation}
                layout="vertical"
                margin={{ top: 8, right: 12, left: 8, bottom: 0 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="location"
                  width={88}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => formatNorthstarGbp(value)}
                />
                <Bar dataKey="value" name="Value" fill="#34d399" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Procurement · monthly spend</h2>
          <p className="mt-1 text-xs text-white/45">Trailing six months (GBP)</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={procurementSpendPreview} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value: number) => formatNorthstarGbp(value)}
                />
                <Bar dataKey="spend" name="Spend" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Inventory · stock movement</h2>
          <p className="mt-1 text-xs text-white/45">Inbound vs outbound transfers (6 mo)</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={inventoryCharts.stockMovement} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }} />
                <Bar dataKey="inbound" name="Inbound" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outbound" name="Outbound" fill="#fbbf24" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Logistics snapshot</h2>
            <p className="mt-1 text-xs text-white/45">Packages in transit and courier performance</p>
          </div>
          <Link
            href={href("logistics")}
            className="text-xs font-semibold text-sky-300/90 hover:text-sky-200"
          >
            Open logistics →
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-emerald-200/80">Inbound in transit</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {summary.logisticsInboundInTransit}
            </p>
          </div>
          <div className="rounded-xl border border-sky-400/20 bg-sky-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-sky-200/80">Outbound in transit</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {summary.logisticsOutboundInTransit}
            </p>
          </div>
          <div className="rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-amber-200/80">Late delivery (3 mo)</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {summary.logisticsLatePct3Mo}%
            </p>
          </div>
          <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 px-4 py-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-violet-200/80">Avg courier / package</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
              {formatNorthstarGbp(summary.logisticsAvgCourierSpendGbp, 2)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
