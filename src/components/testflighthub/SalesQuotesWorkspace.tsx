"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Copy, FileText, Link2, Loader2, Mail, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";

import { SalesQuoteComposeForm } from "@/components/testflighthub/sales-management/SalesQuoteComposeForm";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import { resolveBrowserReportingCurrency, type ReportingCurrency } from "@/lib/financial-reporting-currency";
import { isInternalOpportunitiesArchitectureEnabled } from "@/lib/internal-sales-opportunities-architecture";
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

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    throw new Error(`Request failed (${response.status})`);
  }
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    throw new Error(`Request failed (${response.status})`);
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`Request failed (${response.status})`);
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
  opportunityListOnly?: boolean;
  title?: string;
  opportunityContext?: SalesQuotesOpportunityContext;
}) {
  const listOnly = opportunityListOnly || (embedded && isInternalOpportunitiesArchitectureEnabled());

  const [quotes, setQuotes] = useState<SalesQuote[]>([]);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [seller, setSeller] = useState<SalesQuoteSellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState<SalesQuote | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    setNotice(null);
    try {
      const [quotesRes, clientsRes, contextRes] = await Promise.all([
        fetch("/api/financials/sales-quotes", { cache: "no-store" }),
        fetch("/api/clients", { cache: "no-store" }),
        fetch("/api/financials/sales-quotes/compose-context", { cache: "no-store" }),
      ]);
      const quotesBody = await readApiJson<{ quotes?: SalesQuote[]; error?: string }>(quotesRes);
      const clientsBody = await readApiJson<{ clients?: ManagedClient[]; error?: string }>(clientsRes);
      const contextBody = await readApiJson<{ seller?: SalesQuoteSellerProfile; error?: string }>(
        contextRes,
      );
      if (!quotesRes.ok) throw new Error(quotesBody.error ?? "Failed to load quotes");
      if (!clientsRes.ok) throw new Error(clientsBody.error ?? "Failed to load clients");
      if (!contextRes.ok) throw new Error(contextBody.error ?? "Failed to load quote context");
      setQuotes(quotesBody.quotes ?? []);
      setClients(clientsBody.clients ?? []);
      setSeller(contextBody.seller ?? null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : "Failed to load quotes");
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

  async function runAction(
    id: string,
    action: "send" | "accept" | "pdf" | "send-invoice" | "payment-link" | "invoice-pdf" | "delete",
  ) {
    setBusyId(id);
    setActionError(null);
    setNotice(null);
    try {
      if (action === "delete") {
        if (!window.confirm("Delete this quote? This cannot be undone.")) return;
        const response = await fetch(`/api/financials/quotes/${id}`, { method: "DELETE" });
        const body = await readApiJson<{ error?: string }>(response);
        if (!response.ok) throw new Error(body.error ?? "Delete failed");
        setQuotes((rows) => rows.filter((row) => row.id !== id));
        setNotice("Quote deleted.");
        return;
      }

      if (action === "pdf" || action === "invoice-pdf") {
        const response = await fetch(`/api/financials/quotes/${id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        if (!response.ok) {
          const body = await readApiJson<{ error?: string }>(response);
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
        const body = await readApiJson<{
          quote?: SalesQuote;
          simulated?: boolean;
          messageId?: string | null;
          error?: string;
        }>(response);
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
      const body = await readApiJson<{ quote?: SalesQuote; error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? "Action failed");
      if (body.quote) {
        setQuotes((rows) => rows.map((row) => (row.id === id ? body.quote! : row)));
      } else {
        await load();
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  function openComposeForm() {
    setActionError(null);
    setNotice(null);
    setEditingQuote(null);
    setComposeOpen(true);
  }

  function openEditForm(quote: SalesQuote) {
    if (quote.status === "accepted") return;
    setActionError(null);
    setNotice(null);
    setEditingQuote(quote);
    setComposeOpen(true);
  }

  function closeComposeForm() {
    setComposeOpen(false);
    setEditingQuote(null);
  }

  async function saveComposedQuote(payload: Record<string, unknown>) {
    const editingId = editingQuote?.id;
    setBusyId(editingId ?? "create");
    setActionError(null);
    setNotice(null);
    try {
      const response = await fetch(
        editingId ? `/api/financials/quotes/${editingId}` : "/api/financials/sales-quotes",
        {
          method: editingId ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = await readApiJson<{ quote?: SalesQuote; error?: string }>(response);
      if (!response.ok) throw new Error(body.error ?? (editingId ? "Update failed" : "Create failed"));
      if (body.quote) {
        setQuotes((rows) =>
          editingId ? rows.map((row) => (row.id === editingId ? body.quote! : row)) : [body.quote!, ...rows],
        );
        if (!editingId) {
          setEditingQuote(body.quote);
          setComposeOpen(true);
        } else {
          closeComposeForm();
        }
      } else {
        closeComposeForm();
      }
      setNotice(editingId ? "Quote updated." : "Quote saved.");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : editingId ? "Update failed" : "Create failed");
    } finally {
      setBusyId(null);
    }
  }

  function canEditQuote(quote: SalesQuote) {
    return quote.status === "draft" || quote.status === "sent";
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", embedded ? "gap-3" : "gap-4 p-4 md:p-6")}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1
            className={cn(
              "font-semibold uppercase tracking-[0.06em] text-white",
              embedded || listOnly ? "text-base" : "text-xl",
            )}
          >
            {title}
          </h1>
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
            onClick={openComposeForm}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-3 py-2 text-sm font-medium text-white hover:bg-sky-500 disabled:opacity-60"
          >
            {busyId === "create" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            CREATE NEW QUOTE
          </button>
        </div>
      </div>

      {notice ? (
        <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      {loadError ? (
        <div className="rounded-lg border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          {loadError}
        </div>
      ) : null}

      {actionError ? (
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          {actionError}
        </div>
      ) : null}

      {composeOpen ? (
        <SalesQuoteComposeForm
          opportunityContext={opportunityContext}
          clients={clients}
          seller={seller}
          editingQuote={editingQuote}
          busy={busyId === "create" || Boolean(editingQuote && busyId === editingQuote.id)}
          onCancel={closeComposeForm}
          onSave={(payload) => void saveComposedQuote(payload)}
        />
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-white/10 bg-[#07111f]/50">
        <table className="w-full table-fixed text-left text-sm">
          <thead className="sticky top-0 bg-[#0b1220] text-[11px] uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="w-[12%] px-3 py-3 font-semibold">Quote number</th>
              <th className="w-[18%] px-3 py-3 font-semibold">Customer</th>
              <th className="w-[22%] px-3 py-3 font-semibold">Quote title</th>
              <th className="w-[10%] px-3 py-3 font-semibold">Total</th>
              <th className="w-[10%] px-3 py-3 font-semibold">Status</th>
              <th className="w-[10%] px-3 py-3 font-semibold">Valid until</th>
              <th className="w-[18%] px-3 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                  <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                </td>
              </tr>
            ) : visibleQuotes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                  {opportunityContext ? "No quotes linked to this opportunity yet." : "No quotes yet."}
                </td>
              </tr>
            ) : (
              visibleQuotes.map((quote) => (
                <tr key={quote.id} className="border-t border-white/5 text-white/80">
                  <td className="truncate px-3 py-3 font-medium text-white">{quote.quoteNumber}</td>
                  <td className="px-3 py-3">
                    <div className="truncate">{quote.companyName}</div>
                    {quote.contactName ? (
                      <div className="truncate text-xs text-white/45">{quote.contactName}</div>
                    ) : null}
                  </td>
                  <td className="truncate px-3 py-3">{quote.title}</td>
                  <td className="truncate px-3 py-3">
                    {money(quote.totalAmount, resolveSalesQuoteCurrency(quote.currency))}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={cn(
                        "inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusClass(quote.status),
                      )}
                    >
                      {quote.status}
                    </span>
                  </td>
                  <td className="truncate px-3 py-3">{quote.validUntil ?? "—"}</td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {canEditQuote(quote) ? (
                        <button
                          type="button"
                          disabled={busyId === quote.id}
                          onClick={() => openEditForm(quote)}
                          className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs hover:bg-white/5"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                          Edit
                        </button>
                      ) : null}
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
                      {quote.status !== "accepted" ? (
                        <button
                          type="button"
                          disabled={busyId === quote.id}
                          onClick={() => void runAction(quote.id, "delete")}
                          className="inline-flex items-center gap-1 rounded border border-rose-400/30 bg-rose-500/10 px-2 py-1 text-xs text-rose-200 hover:bg-rose-500/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      ) : null}
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
