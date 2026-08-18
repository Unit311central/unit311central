"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { FileText, Loader2, Plus, RefreshCw } from "lucide-react";

import type { SalesQuote } from "@/lib/accounting/types";
import { cn } from "@/lib/utils";

function statusClass(status: SalesQuote["status"]) {
  switch (status) {
    case "accepted":
      return "border-emerald-400/35 bg-emerald-500/15 text-emerald-200";
    case "sent":
      return "border-sky-400/35 bg-sky-500/15 text-sky-200";
    case "declined":
    case "expired":
      return "border-rose-400/35 bg-rose-500/15 text-rose-200";
    default:
      return "border-amber-400/35 bg-amber-500/15 text-amber-200";
  }
}

function money(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function SalesQuotesWorkspace() {
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/financials/quotes", { cache: "no-store" });
      const body = (await response.json()) as { quotes?: SalesQuote[]; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Failed to load quotes");
      setQuotes(body.quotes ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quotes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totals = useMemo(() => {
    const open = quotes.filter((quote) => quote.status === "draft" || quote.status === "sent");
    const accepted = quotes.filter((quote) => quote.status === "accepted");
    return {
      openCount: open.length,
      openValue: open.reduce((sum, quote) => sum + quote.totalAmount, 0),
      acceptedCount: accepted.length,
    };
  }, [quotes]);

  async function runAction(id: string, action: "send" | "accept" | "pdf") {
    setBusyId(id);
    setError(null);
    try {
      if (action === "pdf") {
        const response = await fetch(`/api/financials/quotes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "pdf" }),
        });
        if (!response.ok) {
          const body = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? "PDF generation failed");
        }
        const blob = await response.blob();
        const quote = quotes.find((row) => row.id === id);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `${quote?.quoteNumber ?? "quote"}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      const response = await fetch(`/api/financials/quotes/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const body = (await response.json()) as { quote?: SalesQuote; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Action failed");
      if (body.quote) {
        setQuotes((rows) => rows.map((row) => (row.id === id ? body.quote! : row)));
      } else {
        await load();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createSampleQuote() {
    setBusyId("create");
    setError(null);
    try {
      const response = await fetch("/api/financials/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Peak District Breweries",
          contactName: "Marcus Reed",
          contactEmail: "m.reed@peakbrew.demo",
          title: "Condition monitoring rollout — Phase 1",
          currency: "GBP",
          lineItems: [
            { description: "Sensor kit (48 units)", quantity: 1, unitPrice: 24_000 },
            { description: "Installation services", quantity: 1, unitPrice: 6_500 },
          ],
        }),
      });
      const body = (await response.json()) as { quote?: SalesQuote; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Create failed");
      if (body.quote) setQuotes((rows) => [body.quote!, ...rows]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-white">Sales Quotes</h1>
          <p className="mt-1 text-sm text-white/60">
            CRM opportunity → quote PDF → accept → client invoice (Track C).
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            disabled={busyId === "create"}
            onClick={() => void createSampleQuote()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {busyId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            New quote
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">Open quotes</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totals.openCount}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">Open pipeline value</p>
          <p className="mt-2 text-2xl font-semibold text-white">{money(totals.openValue, "GBP")}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-xs uppercase tracking-wider text-white/40">Accepted</p>
          <p className="mt-2 text-2xl font-semibold text-white">{totals.acceptedCount}</p>
        </div>
      </div>

      {error ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-[#0b1220] text-xs uppercase tracking-wider text-white/40">
            <tr>
              <th className="px-4 py-3">Quote</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Valid until</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  No quotes yet.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{quote.quoteNumber}</div>
                    <div className="text-xs text-white/45">{quote.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{quote.companyName}</div>
                    <div className="text-xs text-white/45">{quote.contactName}</div>
                  </td>
                  <td className="px-4 py-3">{money(quote.totalAmount, quote.currency)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusClass(quote.status),
                      )}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">{quote.validUntil ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === quote.id}
                        onClick={() => void runAction(quote.id, "pdf")}
                        className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        PDF
                      </button>
                      {quote.status === "draft" ? (
                        <button
                          type="button"
                          disabled={busyId === quote.id}
                          onClick={() => void runAction(quote.id, "send")}
                          className="rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        >
                          Mark sent
                        </button>
                      ) : null}
                      {quote.status !== "accepted" ? (
                        <button
                          type="button"
                          disabled={busyId === quote.id}
                          onClick={() => void runAction(quote.id, "accept")}
                          className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200 hover:bg-emerald-500/20"
                        >
                          Accept → invoice
                        </button>
                      ) : (
                        <span className="text-xs text-emerald-300">Invoiced</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
