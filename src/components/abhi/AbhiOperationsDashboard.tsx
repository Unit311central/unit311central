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

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import { getAbhiOperationsDashboardSummary } from "@/lib/abhi/operations-data";
import { ABHI_REPORTING_CURRENCY } from "@/lib/abhi-surface";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Package;
};

export default function AbhiOperationsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const summary = getAbhiOperationsDashboardSummary();
  const currency = ABHI_REPORTING_CURRENCY;
  const money = (amount: number) => formatMoney(amount, currency);
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
      value: money(summary.procurementSpendMtdGbp),
      hint: `Budget ${money(summary.procurementBudgetGbp)} · ${currency}`,
      href: href("procurement"),
      icon: PackageSearch,
    },
    {
      label: "Active shipments",
      value: String(summary.activeShipments),
      hint: `${summary.inboundShipments} in · ${summary.outboundShipments} out`,
      href: href("logistics"),
      icon: Truck,
    },
    {
      label: "International",
      value: "2",
      hint: "EU pavilion freight · US accelerator kits",
      href: href("logistics"),
      icon: Package,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="ABHI Operations dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">ABHI · Operations</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Asset, inventory, procurement, and logistics snapshot for membership programmes and events — all figures in{" "}
          {currency}.
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
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{tile.label}</p>
                <Icon className="h-4 w-4 text-sky-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
