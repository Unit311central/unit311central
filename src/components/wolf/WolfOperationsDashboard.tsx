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
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { WOLF_EMPTY_OPERATIONS_TILES } from "@/lib/wolf/wolf-empty-dashboards";
import { WOLF_REPORTING_CURRENCY } from "@/lib/wolf/wolf-surface";
import { resolveBrowserWorkspaceDisplayName } from "@/lib/workspace-brand";

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Package;
};

const TILE_ICONS = [Wrench, Boxes, ShoppingCart, PackageSearch, Truck, Package] as const;

export default function WolfOperationsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const currency = WOLF_REPORTING_CURRENCY;
  const money = (amount: number) => formatMoney(amount, currency);
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);
  const workspaceName = resolveBrowserWorkspaceDisplayName();

  const tiles: Tile[] = WOLF_EMPTY_OPERATIONS_TILES.map((tile, index) => {
    const viewMap: Record<string, InternalOperationsView> = {
      assets: "assets",
      inventory: "inventory-management",
      "open-pos": "procurement",
      "procurement-spend": "procurement",
      shipments: "logistics",
      international: "logistics",
    };
    return {
      label: tile.label,
      value: tile.value,
      hint: tile.hint,
      href: href(viewMap[tile.id] ?? "operations-dashboard"),
      icon: TILE_ICONS[index] ?? Package,
    };
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-300/70">
          Operations dashboard
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
          {workspaceName} operations
        </h1>
        <p className="mt-1 text-sm text-white/50">
          Asset, inventory, procurement, and logistics snapshot ({currency}).
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile) => (
          <Link
            key={tile.label}
            href={tile.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  {tile.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
                <p className="mt-1 text-xs text-white/45">{tile.hint}</p>
              </div>
              <tile.icon className="h-5 w-5 text-emerald-300/60 transition group-hover:text-emerald-200" />
            </div>
          </Link>
        ))}
      </section>

      <p className="text-sm text-white/45">
        Procurement spend and budgets are reported in {currency}. Add assets, inventory, and
        purchase orders to populate this dashboard.
      </p>
    </div>
  );
}
