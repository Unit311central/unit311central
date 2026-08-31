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
import { INTERFACE_WORX_REPORTING_CURRENCY } from "@/lib/interface-worx-surface";
import { resolveBrowserWorkspaceDisplayName } from "@/lib/workspace-brand";

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof Package;
};

export default function CustomerOperationsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const currency = INTERFACE_WORX_REPORTING_CURRENCY;
  const money = (amount: number) => formatMoney(amount, currency);
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);
  const workspaceName = resolveBrowserWorkspaceDisplayName();

  const tiles: Tile[] = [
    {
      label: "Assets",
      value: "0",
      hint: "0 in service · 0 maintenance",
      href: href("assets"),
      icon: Wrench,
    },
    {
      label: "Inventory",
      value: "0",
      hint: "0 operational · 0 reorder watch",
      href: href("inventory-management"),
      icon: Boxes,
    },
    {
      label: "Open POs",
      value: "0",
      hint: "0 awaiting approval · 0 suppliers",
      href: href("procurement"),
      icon: ShoppingCart,
    },
    {
      label: "Procurement spend",
      value: money(0),
      hint: `Budget ${money(0)} · ${currency}`,
      href: href("procurement"),
      icon: PackageSearch,
    },
    {
      label: "Active shipments",
      value: "0",
      hint: "0 in · 0 out",
      href: href("logistics"),
      icon: Truck,
    },
    {
      label: "International",
      value: "0",
      hint: "No active international lanes",
      href: href("logistics"),
      icon: Package,
    },
  ];

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
          {workspaceName} · Operations
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">Dashboard</h2>
        <p className="mt-2 max-w-3xl text-sm text-white/55">
          COO snapshot across assets, inventory, procurement, and logistics — all money in{" "}
          {currency}.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {tiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Link
                key={tile.label}
                href={tile.href}
                className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3 transition hover:border-sky-400/30"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                      {tile.label}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white">
                      {tile.value}
                    </p>
                    <p className="mt-1 text-xs text-white/50">{tile.hint}</p>
                  </div>
                  <Icon className="h-4 w-4 shrink-0 text-white/35" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
