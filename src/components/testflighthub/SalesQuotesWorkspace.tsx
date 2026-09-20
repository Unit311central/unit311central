"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, FileText, Link2, Loader2, Mail, Plus, RefreshCw } from "lucide-react";

import type { SalesQuote } from "@/lib/accounting/types";
import { resolveBrowserReportingCurrency, type ReportingCurrency } from "@/lib/financial-reporting-currency";
import { isBrowserGreenDesertSurface } from "@/lib/greendesert-surface";
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

function resolveSalesQuoteCurrency(currency: string): ReportingCurrency {
  const normalized = currency.trim().toUpperCase();
  if (normalized === "USD" || normalized === "GBP" || normalized === "AUD" || normalized === "ZAR") {
    return normalized;
  }
  return resolveBrowserReportingCurrency();
}

function money(amount: number, currency?: ReportingCurrency) {
  const code = currency ?? resolveBrowserReportingCurrency();
  try {
    const locale = code === "USD" ? "en-US" : code === "AUD" ? "en-AU" : "en-GB";
    return new Intl.NumberFormat(locale, { style: "currency", currency: code }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export type SalesQuotesOpportunityContext = {
  crmLeadId: string;
  clientId?: string | null;
  prefill?: {
    companyName: string;
    contactName?: string;
    contactEmail?: string | null;
  };
};

export default function SalesQuotesWorkspace({
  embedded = false,
  opportunityListOnly = false,
  title = "Sales quotes",
  opportunityContext,
}: {
  embedded?: boolean;
  /** Opportunity record tab: table-first list without pipeline KPI cards. */
  opportunityListOnly?: boolean;
  title?: string;
  /** When set, list is scoped to this CRM lead and new quotes link opportunity (+ client when provided). */
  opportunityContext?: SalesQuotesOpportunityContext;
}) {
  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDescription, setComposeDescription] = useState("");
  const [composeUnitPrice, setComposeUnitPrice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
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

  const visibleQuotes = useMemo(() => {
    if (!opportunityContext?.crmLeadId) return quotes;
    return quotes.filter((quote) => quote.crmLeadId === opportunityContext.crmLeadId);
  }, [quotes, opportunityContext?.crmLeadId]);

  const totals = useMemo(() => {
    const open = visibleQuotes.filter((quote) => quote.status === "draft" || quote.status === "sent");
    const accepted = visibleQuotes.filter((quote) => quote.status === "accepted");
    return {
      openCount: open.length,
      openValue: open.reduce((sum, quote) => sum + quote.totalAmount, 0),
      acceptedCount: accepted.length,
    };
  }, [visibleQuotes]);

  async function runAction(
    id: string,
    action: "send" | "accept" | "pdf" | "send-invoice" | "payment-link" | "invoice-pdf",
  ) {
    setBusyId(id);
    setError(null);
    setNotice(null);
    try {
      if (action === "pdf" || action === "invoice-pdf") {
        const response = await fetch(`/api/financials/quotes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
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
        anchor.download =
          action === "invoice-pdf"
            ? `${quote?.quoteNumber ?? "invoice"}-invoice.pdf`
            : `${quote?.quoteNumber ?? "quote"}.pdf`;
        anchor.click();
        URL.revokeObjectURL(url);
        return;
      }

      if (action === "send-invoice" || action === "payment-link") {
        const response = await fetch(`/api/financials/quotes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        const body = (await response.json()) as {
          quote?: SalesQuote;
          simulated?: boolean;
          messageId?: string | null;
          error?: string;
        };
        if (!response.ok) throw new Error(body.error ?? "Action failed");
        if (body.quote) {
          setQuotes((rows) => rows.map((row) => (row.id === id ? body.quote! : row)));
        }
        if (action === "send-invoice") {
          setNotice(
            body.simulated
              ? `Invoice email simulated (${body.messageId ?? "demo"}).`
              : `Invoice sent (${body.messageId ?? "ok"}).`,
          );
        }
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

  function openComposeForm() {
    setError(null);
    setNotice(null);
    setComposeTitle("");
    setComposeDescription("");
    setComposeUnitPrice("");
    setComposeOpen(true);
  }

  async function saveComposedQuote() {
    const companyName =
      opportunityContext?.prefill?.companyName?.trim() ||
      opportunityContext?.prefill?.companyName ||
      "";
    if (!companyName) {
      setError("Company name is required to create a quote.");
      return;
    }
    const unitPrice = Number(composeUnitPrice);
    if (!composeTitle.trim()) {
      setError("Enter a quote title.");
      return;
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError("Enter a valid line item amount.");
      return;
    }

    setBusyId("create");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/financials/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          crmLeadId: opportunityContext?.crmLeadId ?? null,
          clientId: opportunityContext?.clientId ?? null,
          companyName,
          contactName: opportunityContext?.prefill?.contactName ?? null,
          contactEmail: opportunityContext?.prefill?.contactEmail ?? null,
          title: composeTitle.trim(),
          currency: isBrowserGreenDesertSurface() ? "USD" : resolveBrowserReportingCurrency(),
          lineItems: [
            {
              description: composeDescription.trim() || "Services",
              quantity: 1,
              unitPrice,
            },
          ],
        }),
      });
      const body = (await response.json()) as { quote?: SalesQuote; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Create failed");
      if (body.quote) setQuotes((rows) => [body.quote!, ...rows]);
      setComposeOpen(false);
      setNotice("Quote saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  async function createNewQuote() {
    if (opportunityContext?.crmLeadId) {
      openComposeForm();
      return;
    }

    setBusyId("create");
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/financials/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: "Peak District Breweries",
          contactName: "Marcus Reed",
          contactEmail: "m.reed@peakbrew.demo",
          title: "Condition monitoring rollout — Phase 1",
          currency: isBrowserGreenDesertSurface() ? "USD" : resolveBrowserReportingCurrency(),
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
    <div className={cn("flex h-full min-h-0 flex-col", embedded ? "gap-3" : "gap-4 p-4 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className={cn("font-semibold text-white", embedded ? "text-lg" : "text-xl")}>{title}</h1>
          <p className={cn("mt-1 text-white/60", embedded ? "text-sm" : "text-sm")}>
            {opportunityContext
              ? "Quotes for this opportunity use the shared Sales Quotes system — opportunity and client stay linked."
              : embedded
                ? "Shared sales quote register linked to CRM opportunities and Financials invoicing."
                : "CRM opportunity → quote PDF → accept → client invoice (Track C)."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3.5 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            type="button"
            disabled={busyId === "create"}
            onClick={() => void createNewQuote()}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {busyId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            CREATE NEW QUOTE
          </button>
        </div>
      </div>

      {!opportunityListOnly ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Open quotes</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{totals.openCount}</p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Open pipeline value</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {money(totals.openValue, resolveBrowserReportingCurrency())}
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">Accepted</p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">{totals.acceptedCount}</p>
          </div>
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {composeOpen && opportunityContext ? (
        <div className="rounded-xl border border-sky-400/25 bg-sky-500/5 p-4">
          <h2 className="text-sm font-semibold text-white">Create new quote</h2>
          <p className="mt-1 text-xs text-white/50">
            Linked to {opportunityContext.prefill?.companyName ?? "this opportunity"}. Save when ready —
            nothing is created until you confirm.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-[10px] uppercase text-white/45 sm:col-span-2">
              Customer
              <input
                readOnly
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white/80"
                value={opportunityContext.prefill?.companyName ?? ""}
              />
            </label>
            <label className="text-[10px] uppercase text-white/45 sm:col-span-2">
              Quote title
              <input
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
                value={composeTitle}
                onChange={(e) => setComposeTitle(e.target.value)}
              />
            </label>
            <label className="text-[10px] uppercase text-white/45 sm:col-span-2">
              Line description
              <input
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
                value={composeDescription}
                onChange={(e) => setComposeDescription(e.target.value)}
              />
            </label>
            <label className="text-[10px] uppercase text-white/45">
              Amount
              <input
                type="number"
                min={0}
                className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
                value={composeUnitPrice}
                onChange={(e) => setComposeUnitPrice(e.target.value)}
              />
            </label>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busyId === "create"}
              onClick={() => void saveComposedQuote()}
              className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
            >
              {busyId === "create" ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null}
              SAVE QUOTE
            </button>
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto rounded-xl border border-white/10 bg-[#07111f]/50">
        <table className="w-full min-w-0 text-left text-sm">
          <thead className="sticky top-0 bg-[#0b1220] text-[11px] uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-4 py-3 font-semibold">Quote</th>
              <th className="px-4 py-3 font-semibold">Customer</th>
              <th className="px-4 py-3 font-semibold">Total</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Valid until</th>
              <th className="px-4 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : visibleQuotes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/50">
                  {opportunityContext ? "No quotes linked to this opportunity yet." : "No quotes yet."}
                </td>
              </tr>
            ) : (
              visibleQuotes.map((quote) => (
                <tr key={quote.id} className="border-t border-white/5 text-white/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{quote.quoteNumber}</div>
                    <div className="text-xs text-white/45">{quote.title}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div>{quote.companyName}</div>
                    <div className="text-xs text-white/45">{quote.contactName}</div>
                  </td>
                  <td className="px-4 py-3">{money(quote.totalAmount, resolveSalesQuoteCurrency(quote.currency))}</td>
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
                        <>
                          <button
                            type="button"
                            disabled={busyId === quote.id}
                            onClick={() => void runAction(quote.id, "invoice-pdf")}
                            className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                          >
                            <FileText className="h-3.5 w-3.5" />
                            Invoice PDF
                          </button>
                          <button
                            type="button"
                            disabled={busyId === quote.id}
                            onClick={() => void runAction(quote.id, "send-invoice")}
                            className="inline-flex items-center gap-1 rounded border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-xs text-sky-200 hover:bg-sky-500/20"
                          >
                            <Mail className="h-3.5 w-3.5" />
                            {quote.invoiceSentAt ? "Resend" : "Send invoice"}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === quote.id}
                            onClick={() => void runAction(quote.id, "payment-link")}
                            className="inline-flex items-center gap-1 rounded border border-violet-400/30 bg-violet-500/10 px-2 py-1 text-xs text-violet-200 hover:bg-violet-500/20"
                          >
                            <Link2 className="h-3.5 w-3.5" />
                            Payment link
                          </button>
                          {quote.stripePaymentLinkUrl ? (
                            <button
                              type="button"
                              onClick={() => void navigator.clipboard.writeText(quote.stripePaymentLinkUrl!)}
                              className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                              title={quote.stripePaymentLinkUrl}
                            >
                              <Copy className="h-3.5 w-3.5" />
                              Copy link
                            </button>
                          ) : null}
                          <span className="text-xs text-emerald-300">Invoiced</span>
                        </>
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
