"use client";

import Link from "next/link";
import {
  Boxes,
  Package,
  PackageSearch,
  ShoppingCart,
  Truck,
  Wrench,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { getOaOperationsDashboardSummary } from "@/lib/onwardair/operations-data";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const MIX_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa"];

function usd(amount: number) {
  return formatMoney(amount, "USD");
}

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Package;
};

export default function OnwardAirOperationsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const summary = getOaOperationsDashboardSummary();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);

  const tiles: Tile[] = [
    {
      label: "Assets",
      value: String(summary.assetsTotal),
      hint: `${summary.assetsInService} in service · ${summary.assetsMaintenance} maintenance`,
      href: href("assets"),
      icon: Wrench,
    },
    {
      label: "Inventory",
      value: String(summary.inventoryTotal),
      hint: `${summary.inventoryOperational} operational · ${summary.inventoryLowStockHints} reorder watch`,
      href: href("inventory-management"),
      icon: Boxes,
    },
    {
      label: "Open POs",
      value: String(summary.openPurchaseOrders),
      hint: `${summary.pendingApprovals} awaiting approval · ${summary.suppliersActive} suppliers`,
      href: href("procurement"),
      icon: ShoppingCart,
    },
    {
      label: "Procurement spend",
      value: usd(summary.spendMtdUsd),
      hint: `Budget ${usd(summary.monthlyBudgetUsd)} · USD`,
      href: href("procurement"),
      icon: PackageSearch,
    },
    {
      label: "Active shipments",
      value: String(summary.shipmentsActive),
      hint: `${summary.shipmentsInbound} in · ${summary.shipmentsOutbound} out`,
      href: href("logistics"),
      icon: Truck,
    },
    {
      label: "International",
      value: String(summary.shipmentsInternational),
      hint: summary.featuredRouteLabel,
      href: href("logistics"),
      icon: Package,
    },
  ];

  const opsBars = [
    { area: "Assets", count: summary.assetsTotal },
    { area: "Inventory", count: summary.inventoryTotal },
    { area: "Open POs", count: summary.openPurchaseOrders },
    { area: "Shipments", count: summary.shipmentsActive },
  ];

  const shipmentMix = [
    { name: "Inbound US", value: summary.shipmentsInbound - 1 },
    { name: "Outbound US", value: summary.shipmentsOutbound - 1 },
    { name: "Intl in", value: 1 },
    { name: "Intl out", value: 1 },
  ].filter((row) => row.value > 0);

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="Operations dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          OnwardAir · Operations
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          COO snapshot across assets, inventory, procurement, and logistics for Houston HQ and
          FLEX Pod prototype operations — all money in USD.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
          <h2 className="text-sm font-semibold text-white">Operations footprint</h2>
          <p className="mt-1 text-xs text-white/45">Counts by area</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={opsBars} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="area"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
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
                <Bar dataKey="count" name="Count" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Shipment mix</h2>
          <p className="mt-1 text-xs text-white/45">
            5 US Houston lanes · 2 international
          </p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={shipmentMix}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {shipmentMix.map((_, index) => (
                    <Cell key={index} fill={MIX_COLORS[index % MIX_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
