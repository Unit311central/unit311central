"use client";

import { FileText, LifeBuoy, Milestone } from "lucide-react";
import Link from "next/link";

import type { DemoClientPortalConfig } from "@/lib/demo/demo-client-portal-routes";
import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";

const SHEFFIELD_PROJECT = {
  name: "Edge Controller Rollout — Sheffield Precision",
  phase: "Delivery",
  progressPct: 62,
  owner: "Marcus Reed",
  milestone: "Phase 2 gateway deployment in progress",
};

const SHEFFIELD_TICKETS = [
  { id: "t1", name: "Edge gateway offline at Line 3", priority: "high", closed: false },
  { id: "t2", name: "Firmware v2.4 deployment window", priority: "medium", closed: false },
  { id: "t3", name: "Monthly executive QBR pack", priority: "low", closed: true },
];

const SHEFFIELD_INVOICES = [
  { id: "inv1", invoiceNumber: "NST-2026-0841", amount: 18_500, status: "issued" },
  { id: "inv2", invoiceNumber: "NST-2026-0820", amount: 9_600, status: "paid" },
  { id: "inv3", invoiceNumber: "NST-2026-0795", amount: 24_000, status: "paid" },
];

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
}

type Props = {
  portal: DemoClientPortalConfig;
};

export default function DemoClientPortal({ portal }: Props) {
  const fixtures = getDemoEnterpriseFixtures();

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <header className="border-b border-white/10 bg-[#07111f]">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-white/45">Northstar client portal</p>
            <h1 className="text-xl font-semibold">{portal.companyName}</h1>
          </div>
          <Link href="/login" className="text-sm text-sky-300 hover:underline">
            Northstar staff login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 p-6">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-lg font-medium">Your account</h2>
          <p className="mt-2 text-sm text-white/65">
            {portal.contactFirst} {portal.contactLast} · {portal.contactEmail}
          </p>
          <p className="mt-1 text-sm text-white/55">
            {portal.companyName} · Active customer · {fixtures.company.tradingName} partner
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <Milestone className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-medium">Active projects</h2>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-medium">{SHEFFIELD_PROJECT.name}</h3>
            <p className="mt-1 text-sm text-white/55">
              Status: {SHEFFIELD_PROJECT.phase} · {SHEFFIELD_PROJECT.progressPct}% complete
            </p>
            <p className="mt-2 text-sm text-white/70">
              Delivery lead: {SHEFFIELD_PROJECT.owner}. Next: {SHEFFIELD_PROJECT.milestone}.
            </p>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <LifeBuoy className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-medium">Support</h2>
          </div>
          <ul className="space-y-2">
            {SHEFFIELD_TICKETS.map((t) => (
              <li key={t.id} className="rounded-xl border border-white/10 px-4 py-3 text-sm">
                <span className="font-medium">{t.name}</span>
                <span className="ml-2 text-white/45">· {t.priority}</span>
                <span className="ml-2 text-white/45">· {t.closed ? "Closed" : "Open"}</span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-center gap-2">
            <FileText className="h-5 w-5 text-sky-300" />
            <h2 className="text-lg font-medium">Invoices</h2>
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-white/50">
                <tr>
                  <th className="px-4 py-2">Invoice</th>
                  <th className="px-4 py-2">Amount</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {SHEFFIELD_INVOICES.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/10">
                    <td className="px-4 py-2">{inv.invoiceNumber}</td>
                    <td className="px-4 py-2">{formatGbp(inv.amount)}</td>
                    <td className="px-4 py-2 capitalize">{inv.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-xs text-white/40">
          Client portal for {portal.companyName} on Northstar Demo — project status, support, and billing only.
          Success stories submitted here feed Marketing → Client Stories.
        </p>
      </main>
    </div>
  );
}
