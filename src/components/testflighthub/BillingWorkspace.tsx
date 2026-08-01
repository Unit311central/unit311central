"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ABHI_MEMBERSHIP_FEE_GBP,
  ABHI_WEBSITE_LISTING_FEE_GBP,
  buildAbhiMemberBillingRows,
  buildAbhiWebsiteListingRow,
  formatAbhiBillingDate,
  formatAbhiGbp,
  type AbhiBillingRow,
  type AbhiBillingRowStatus,
} from "@/lib/abhi-billing";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import {
  BILLING_INVOICES,
  BILLING_PAYMENT_METHOD,
  BILLING_PLAN,
  invoiceStatusLabel,
  type InvoiceStatus,
} from "@/lib/billing-data";
import type { ManagedClient } from "@/lib/client-management-data";
import { cn } from "@/lib/utils";
import { Building2, Download, Globe, Loader2, Receipt, Users, Wallet } from "lucide-react";

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#0b1524]/50 px-4 py-3">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function invoiceStatusClass(status: InvoiceStatus) {
  switch (status) {
    case "paid":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "awaiting":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
  }
}

function billingStatusClass(status: AbhiBillingRowStatus) {
  switch (status) {
    case "Current":
      return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
    case "Due soon":
      return "border-amber-400/30 bg-amber-500/10 text-amber-200";
    case "Outstanding":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
  }
}

function BillingTable({
  rows,
  emptyLabel,
}: {
  rows: AbhiBillingRow[];
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return <p className="px-5 py-8 text-sm text-white/45 sm:px-6">{emptyLabel}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[44rem] border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-white/[0.08] text-[10px] font-medium uppercase tracking-[0.12em] text-white/35">
            <th className="px-5 pb-2 pt-1 font-medium sm:px-6">Name</th>
            <th className="pb-2 pr-3 font-medium">Last payment</th>
            <th className="pb-2 pr-3 font-medium">Amount</th>
            <th className="pb-2 pr-3 font-medium">Next payment</th>
            <th className="pb-2 pr-3 font-medium">Amount due</th>
            <th className="pb-2 pr-3 font-medium">Outstanding</th>
            <th className="pb-2 pr-5 font-medium sm:pr-6">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-white/[0.05] last:border-0">
              <td className="px-5 py-3 align-top sm:px-6">
                <p className="font-medium text-white">{row.name}</p>
                <p className="mt-0.5 text-[11px] text-white/40">{row.billingCycle}</p>
              </td>
              <td className="py-3 pr-3 align-top tabular-nums text-white/75">
                {formatAbhiBillingDate(row.lastPaymentDate)}
              </td>
              <td className="py-3 pr-3 align-top tabular-nums text-white">
                {formatAbhiGbp(row.lastPaymentAmountGbp)}
              </td>
              <td className="py-3 pr-3 align-top tabular-nums text-white/75">
                {formatAbhiBillingDate(row.nextPaymentDate)}
              </td>
              <td className="py-3 pr-3 align-top tabular-nums text-white">
                {formatAbhiGbp(row.amountDueGbp)}
              </td>
              <td
                className={cn(
                  "py-3 pr-3 align-top tabular-nums",
                  row.outstandingGbp > 0 ? "font-semibold text-rose-300" : "text-white/60",
                )}
              >
                {formatAbhiGbp(row.outstandingGbp)}
              </td>
              <td className="py-3 pr-5 align-top sm:pr-6">
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                    billingStatusClass(row.status),
                  )}
                >
                  {row.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AbhiBillingWorkspace() {
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch("/api/clients", { cache: "no-store" });
        const data = (await response.json()) as { clients?: ManagedClient[]; error?: string };
        if (!response.ok || !data.clients) {
          throw new Error(data.error ?? "Failed to load members");
        }
        if (!cancelled) setClients(data.clients);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load members");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const memberRows = useMemo(() => buildAbhiMemberBillingRows(clients), [clients]);
  const websiteRow = useMemo(() => buildAbhiWebsiteListingRow(), []);

  const memberOutstanding = useMemo(
    () => memberRows.reduce((sum, row) => sum + row.outstandingGbp, 0),
    [memberRows],
  );
  const memberDue = useMemo(
    () => memberRows.reduce((sum, row) => sum + row.amountDueGbp, 0),
    [memberRows],
  );

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
                ABHI Billing
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-white">Membership & listings</h2>
              <p className="mt-1 text-sm text-white/50">
                Annual membership at {formatAbhiGbp(ABHI_MEMBERSHIP_FEE_GBP)} · website listing at{" "}
                {formatAbhiGbp(ABHI_WEBSITE_LISTING_FEE_GBP)} / year
              </p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <DetailRow label="Members" value={String(memberRows.length)} />
          <DetailRow label="Membership fee" value={`${formatAbhiGbp(ABHI_MEMBERSHIP_FEE_GBP)} / year`} />
          <DetailRow label="Amount due" value={formatAbhiGbp(memberDue + websiteRow.amountDueGbp)} />
          <DetailRow
            label="Outstanding"
            value={formatAbhiGbp(memberOutstanding + websiteRow.outstandingGbp)}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sky-300">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-white">Members</h3>
                <p className="text-xs text-white/45">
                  All member companies · {formatAbhiGbp(ABHI_MEMBERSHIP_FEE_GBP)} annually
                </p>
              </div>
            </div>
            {loading ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </span>
            ) : (
              <span className="text-xs tabular-nums text-white/45">{memberRows.length} members</span>
            )}
          </div>
          <div className="max-h-[min(70vh,40rem)] overflow-y-auto">
            {loading ? (
              <div className="flex items-center gap-2 px-5 py-10 text-sm text-white/45 sm:px-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading members…
              </div>
            ) : (
              <BillingTable rows={memberRows} emptyLabel="No members found." />
            )}
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-amber-300">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">ABHI Website listing</h3>
              <p className="text-xs text-white/45">
                {formatAbhiGbp(ABHI_WEBSITE_LISTING_FEE_GBP)} per year · billable annually
              </p>
            </div>
          </div>
          <BillingTable rows={[websiteRow]} emptyLabel="No website listings." />
        </section>
      </div>
    </div>
  );
}

function DefaultBillingWorkspace() {
  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl border border-violet-400/25 bg-gradient-to-br from-violet-500/[0.14] via-white/[0.04] to-sky-500/[0.08] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
        <div className="border-b border-white/10 px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
                  Current subscription
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-white">{BILLING_PLAN.name}</h2>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-emerald-200">
              {BILLING_PLAN.status}
            </span>
          </div>
        </div>

        <div className="grid gap-3 p-5 sm:grid-cols-2 lg:grid-cols-5 sm:px-6 sm:pb-6">
          <DetailRow label="Status" value={BILLING_PLAN.status} />
          <DetailRow label="Plan" value={BILLING_PLAN.name} />
          <DetailRow label="Price" value={BILLING_PLAN.priceLabel} />
          <DetailRow label="Billing" value={BILLING_PLAN.billingCycle} />
          <DetailRow label="Next invoice" value={BILLING_PLAN.nextInvoiceDate} />
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-sky-300">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Payment method</h3>
              <p className="text-xs text-white/45">Bank transfer for quarterly invoices</p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-white/10 bg-gradient-to-br from-[#0b1524] to-[#0d1a2c] p-4">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
              {BILLING_PAYMENT_METHOD.type}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/90">
              {BILLING_PAYMENT_METHOD.masked}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-amber-300">
              <Receipt className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Invoices</h3>
              <p className="text-xs text-white/45">Download PDF copies for your records</p>
            </div>
          </div>

          <ul className="divide-y divide-white/[0.06]">
            {BILLING_INVOICES.map((invoice) => (
              <li
                key={invoice.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-white">{invoice.number}</p>
                  <span
                    className={cn(
                      "mt-1.5 inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.06em]",
                      invoiceStatusClass(invoice.status),
                    )}
                  >
                    {invoiceStatusLabel(invoice.status)}
                  </span>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download PDF
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function BillingWorkspace() {
  if (isBrowserAbhiSurface()) return <AbhiBillingWorkspace />;
  return <DefaultBillingWorkspace />;
}
