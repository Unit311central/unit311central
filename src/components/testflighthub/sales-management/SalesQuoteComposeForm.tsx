"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

import {
  computeSalesQuoteTotals,
  resolveSalesQuoteFinancials,
} from "@/lib/accounting/sales-quote-calculations";
import {
  DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  isScopeStyleQuote,
  normalizeBankDetails,
  type SalesQuoteBankDetails,
  type SalesQuoteLineColumnVisibility,
} from "@/lib/accounting/sales-quote-display";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import type { ManagedClient } from "@/lib/client-management-data";
import { resolveBrowserReportingCurrency, type ReportingCurrency } from "@/lib/financial-reporting-currency";
import { cn } from "@/lib/utils";

import type { SalesQuotesOpportunityContext } from "../SalesQuotesWorkspace";

const UNIT_OPTIONS = ["Hour", "Day", "Week", "Month", "Unit", "Project", "Fixed fee"] as const;

export type SalesQuoteComposeLineDraft = {
  key: string;
  description: string;
  detailText: string;
  quantity: string;
  unit: string;
  rate: string;
  discount: string;
  taxRate: string;
};

function emptyLine(): SalesQuoteComposeLineDraft {
  return {
    key: `line-${Math.random().toString(36).slice(2, 9)}`,
    description: "",
    detailText: "",
    quantity: "",
    unit: "",
    rate: "",
    discount: "",
    taxRate: "",
  };
}

function lineFromSaved(line: SalesQuote["lineItems"][number]): SalesQuoteComposeLineDraft {
  return {
    key: `line-${line.id}`,
    description: line.description,
    detailText: line.detailText ?? "",
    quantity: String(line.quantity),
    unit: line.unit ?? "",
    rate: String(line.unitPrice),
    discount: String(line.discountAmount ?? 0),
    taxRate: line.taxRate != null ? String(line.taxRate) : "",
  };
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function money(amount: number, currency: ReportingCurrency) {
  try {
    const locale = currency === "USD" ? "en-US" : currency === "AUD" ? "en-AU" : "en-GB";
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function clientBillTo(client: ManagedClient | null) {
  if (!client) return null;
  const contact =
    client.primaryContact?.trim() ||
    [client.primaryContactFirstName, client.primaryContactSurname].filter(Boolean).join(" ");
  return {
    companyName: client.companyName,
    contactName: contact || null,
    email: client.email?.trim() || null,
    phone: client.phone?.trim() || null,
    address: client.companyAddress?.trim() || null,
    city: client.companyCity?.trim() || null,
    region: client.region?.trim() || null,
    country: client.companyCountry?.trim() || null,
  };
}

export function SalesQuoteComposeForm({
  opportunityContext,
  clients,
  seller,
  busy,
  editingQuote,
  onCancel,
  onSave,
}: {
  opportunityContext?: SalesQuotesOpportunityContext;
  clients: ManagedClient[];
  seller: SalesQuoteSellerProfile | null;
  busy: boolean;
  editingQuote?: SalesQuote | null;
  onCancel: () => void;
  onSave: (payload: Record<string, unknown>) => void;
}) {
  const isEdit = Boolean(editingQuote?.id);

  const linkedClient = useMemo(() => {
    if (opportunityContext?.clientId) {
      return clients.find((c) => c.id === opportunityContext.clientId) ?? null;
    }
    if (editingQuote?.clientId) {
      return clients.find((c) => c.id === editingQuote.clientId) ?? null;
    }
    return null;
  }, [clients, opportunityContext?.clientId, editingQuote?.clientId]);

  const [selectedClientId, setSelectedClientId] = useState(
    opportunityContext?.clientId ?? editingQuote?.clientId ?? "",
  );
  const [quoteDate, setQuoteDate] = useState(editingQuote?.issueDate ?? todayIsoDate());
  const [validUntil, setValidUntil] = useState(editingQuote?.validUntil ?? "");
  const [title, setTitle] = useState(editingQuote?.title ?? "");
  const [reference, setReference] = useState(editingQuote?.reference ?? "");
  const [currency, setCurrency] = useState<ReportingCurrency>(
    (editingQuote?.currency?.trim().toUpperCase() as ReportingCurrency) ||
      resolveBrowserReportingCurrency(),
  );
  const [lines, setLines] = useState<SalesQuoteComposeLineDraft[]>(() =>
    editingQuote?.lineItems?.length
      ? editingQuote.lineItems.map(lineFromSaved)
      : [emptyLine()],
  );
  const [quoteDiscount, setQuoteDiscount] = useState(
    editingQuote ? String(editingQuote.discountAmount ?? 0) : "",
  );
  const [paymentTerms, setPaymentTerms] = useState(editingQuote?.paymentTerms ?? "");
  const [notes, setNotes] = useState(editingQuote?.notes ?? "");
  const [terms, setTerms] = useState(editingQuote?.termsAndConditions ?? "");
  const [manualCompanyName, setManualCompanyName] = useState(
    !editingQuote?.clientId && editingQuote?.companyName ? editingQuote.companyName : "",
  );
  const [columnVisibility, setColumnVisibility] = useState<SalesQuoteLineColumnVisibility>(
    editingQuote?.lineColumnVisibility ?? DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  );
  const [commercialTotal, setCommercialTotal] = useState(
    editingQuote?.pricingStyle === "scope_total" ? String(editingQuote.totalAmount) : "",
  );
  const [bankDetails, setBankDetails] = useState<SalesQuoteBankDetails>(
    editingQuote?.bankDetails ?? {},
  );
  const [termsPdfFilename, setTermsPdfFilename] = useState(editingQuote?.termsPdfFilename ?? "");
  const [termsPdfBusy, setTermsPdfBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scopeStyle = useMemo(
    () => isScopeStyleQuote("detailed", columnVisibility),
    [columnVisibility],
  );

  useEffect(() => {
    if (opportunityContext?.clientId) setSelectedClientId(opportunityContext.clientId);
  }, [opportunityContext?.clientId]);

  const activeClient = useMemo(() => {
    if (linkedClient) return linkedClient;
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) ?? null;
  }, [linkedClient, selectedClientId, clients]);

  const billTo = useMemo(() => {
    if (activeClient) return clientBillTo(activeClient);
    if (manualCompanyName.trim()) {
      return {
        companyName: manualCompanyName.trim(),
        contactName: editingQuote?.contactName ?? null,
        email: editingQuote?.contactEmail ?? null,
        phone: null,
        address: null,
        city: null,
        region: null,
        country: null,
      };
    }
    if (opportunityContext?.prefill?.companyName) {
      return {
        companyName: opportunityContext.prefill.companyName,
        contactName: opportunityContext.prefill.contactName ?? null,
        email: opportunityContext.prefill.contactEmail ?? null,
        phone: null,
        address: null,
        city: null,
        region: null,
        country: null,
      };
    }
    if (editingQuote?.companyName) {
      return {
        companyName: editingQuote.companyName,
        contactName: editingQuote.contactName,
        email: editingQuote.contactEmail,
        phone: null,
        address: null,
        city: null,
        region: null,
        country: null,
      };
    }
    return null;
  }, [activeClient, opportunityContext?.prefill, manualCompanyName, editingQuote]);

  const parsedLines = useMemo(() => {
    return lines.map((line) => ({
      description: line.description.trim(),
      detailText: line.detailText.trim() || null,
      quantity: scopeStyle ? 1 : Number(line.quantity),
      unit: line.unit.trim() || null,
      unitPrice: scopeStyle ? 0 : Number(line.rate),
      discountAmount: scopeStyle ? 0 : Number(line.discount || 0),
      taxRate: scopeStyle ? 0 : Number(line.taxRate || 0),
    }));
  }, [lines, scopeStyle]);

  const totals = useMemo(() => {
    try {
      return resolveSalesQuoteFinancials({
        pricingStyle: scopeStyle ? "scope_total" : "detailed",
        lineColumnVisibility: columnVisibility,
        commercialTotal: scopeStyle ? Number(commercialTotal || 0) : null,
        quoteDiscountAmount: Number(quoteDiscount || 0),
        lineItems: parsedLines,
      });
    } catch {
      return computeSalesQuoteTotals(parsedLines, Number(quoteDiscount || 0));
    }
  }, [parsedLines, quoteDiscount, columnVisibility, commercialTotal, scopeStyle]);

  async function uploadTermsPdf(file: File) {
    if (!editingQuote?.id) {
      setError("Save the quote first, then attach a Terms & Conditions PDF.");
      return;
    }
    setTermsPdfBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch(`/api/financials/quotes/${editingQuote.id}/terms-pdf`, {
        method: "POST",
        body: formData,
      });
      const body = (await response.json()) as { quote?: SalesQuote; error?: string };
      if (!response.ok) throw new Error(body.error ?? "Upload failed");
      setTermsPdfFilename(body.quote?.termsPdfFilename ?? file.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setTermsPdfBusy(false);
    }
  }

  async function removeTermsPdf() {
    if (!editingQuote?.id) return;
    setTermsPdfBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/financials/quotes/${editingQuote.id}/terms-pdf`, {
        method: "DELETE",
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Remove failed");
      setTermsPdfFilename("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Remove failed");
    } finally {
      setTermsPdfBusy(false);
    }
  }

  function handleSave() {
    setError(null);
    if (!title.trim()) {
      setError("Quote title is required.");
      return;
    }
    if (!billTo?.companyName?.trim()) {
      setError("Select a client or enter a customer for this quote.");
      return;
    }
    if (!parsedLines.length || parsedLines.some((l) => !l.description)) {
      setError("Each line item needs a description.");
      return;
    }
    if (!scopeStyle) {
      if (parsedLines.some((l) => !Number.isFinite(l.quantity) || l.quantity <= 0)) {
        setError("Each line item needs a quantity greater than zero.");
        return;
      }
      if (parsedLines.some((l) => !Number.isFinite(l.unitPrice) || l.unitPrice < 0)) {
        setError("Each line item needs a valid rate.");
        return;
      }
    } else if (!Number.isFinite(Number(commercialTotal)) || Number(commercialTotal) < 0) {
      setError("Enter the quote-level commercial total.");
      return;
    }

    onSave({
      crmLeadId: opportunityContext?.crmLeadId ?? editingQuote?.crmLeadId ?? null,
      clientId: activeClient?.id ?? opportunityContext?.clientId ?? editingQuote?.clientId ?? null,
      companyName: billTo.companyName.trim(),
      contactName: billTo.contactName,
      contactEmail: billTo.email,
      title: title.trim(),
      currency,
      issueDate: quoteDate,
      validUntil: validUntil.trim() || null,
      reference: reference.trim() || null,
      paymentTerms: paymentTerms.trim() || null,
      termsAndConditions: terms.trim() || null,
      notes: notes.trim() || null,
      discountAmount: Number(quoteDiscount || 0),
      commercialTotal: scopeStyle ? Number(commercialTotal || 0) : null,
      pricingStyle: scopeStyle ? "scope_total" : "detailed",
      lineColumnVisibility: columnVisibility,
      bankDetails: normalizeBankDetails(bankDetails),
      termsPdfStoragePath: editingQuote?.termsPdfStoragePath ?? null,
      termsPdfFilename: termsPdfFilename || editingQuote?.termsPdfFilename || null,
      lineItems: parsedLines,
    });
  }

  const fieldLabel = "text-[10px] font-medium uppercase tracking-[0.12em] text-white/45";
  const fieldInput =
    "mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white";

  return (
    <div className="min-w-0 space-y-4 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-white">
            {isEdit ? "Edit quote" : "Create new quote"}
          </h2>
          <p className="mt-1 text-xs text-white/50">
            {isEdit ? "Update fields and click SAVE QUOTE." : "Nothing is saved until you click SAVE QUOTE."}
          </p>
        </div>
        <button type="button" onClick={onCancel} className="text-xs text-white/45 hover:text-white/70">
          Cancel
        </button>
      </div>

      {error ? <p className="text-sm text-red-300">{error}</p> : null}

      <section className="rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
        <h3 className={fieldLabel}>Quote details</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className={fieldLabel}>
            Quote number
            <input
              readOnly
              className={cn(fieldInput, "text-white/50")}
              value={editingQuote?.quoteNumber ?? "Assigned on save"}
            />
          </label>
          <label className={fieldLabel}>
            Quote date
            <input type="date" className={fieldInput} value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} />
          </label>
          <label className={fieldLabel}>
            Valid until
            <input type="date" className={fieldInput} value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
          </label>
          <label className={fieldLabel}>
            Currency
            <select className={fieldInput} value={currency} onChange={(e) => setCurrency(e.target.value as ReportingCurrency)}>
              {(["GBP", "USD", "AUD", "ZAR"] as const).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </label>
          <label className={cn(fieldLabel, "sm:col-span-2")}>
            Quote title
            <input className={fieldInput} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className={cn(fieldLabel, "sm:col-span-2")}>
            Reference / project
            <input className={fieldInput} value={reference} onChange={(e) => setReference(e.target.value)} />
          </label>
        </div>
      </section>

      {seller ? (
        <section className="rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
          <h3 className={fieldLabel}>Seller / company</h3>
          <dl className="mt-2 grid gap-2 text-sm text-white/75 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-white/40">Brand</dt>
              <dd>{seller.brandName ?? seller.companyName}</dd>
            </div>
            {seller.legalCompanyName ? (
              <div>
                <dt className="text-xs text-white/40">Legal entity</dt>
                <dd>{seller.legalCompanyName}</dd>
              </div>
            ) : null}
            {seller.email ? (
              <div>
                <dt className="text-xs text-white/40">Email</dt>
                <dd>{seller.email}</dd>
              </div>
            ) : null}
            {seller.phone ? (
              <div>
                <dt className="text-xs text-white/40">Phone</dt>
                <dd>{seller.phone}</dd>
              </div>
            ) : null}
            {seller.country ? (
              <div>
                <dt className="text-xs text-white/40">Country</dt>
                <dd>{seller.country}</dd>
              </div>
            ) : null}
            {seller.address ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-white/40">Address</dt>
                <dd className="whitespace-pre-wrap">{seller.address}</dd>
              </div>
            ) : null}
            {seller.website ? (
              <div>
                <dt className="text-xs text-white/40">Website</dt>
                <dd>{seller.website}</dd>
              </div>
            ) : null}
          </dl>
        </section>
      ) : null}

      <section className="rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
        <h3 className={fieldLabel}>Customer</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {opportunityContext?.crmLeadId ? (
            <label className={cn(fieldLabel, "sm:col-span-2")}>
              Opportunity
              <input
                readOnly
                className={cn(fieldInput, "text-white/60")}
                value={opportunityContext.prefill?.companyName ?? "Linked opportunity"}
              />
            </label>
          ) : null}
          {opportunityContext?.crmLeadId && linkedClient ? (
            <label className={cn(fieldLabel, "sm:col-span-2")}>
              Client
              <input readOnly className={cn(fieldInput, "text-white/60")} value={linkedClient.companyName} />
            </label>
          ) : (
            <>
              <label className={cn(fieldLabel, "sm:col-span-2")}>
                Client
                <select
                  className={fieldInput}
                  value={selectedClientId}
                  disabled={isEdit && Boolean(opportunityContext?.crmLeadId)}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value);
                    if (e.target.value) setManualCompanyName("");
                  }}
                >
                  <option value="">Select client (optional)</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.companyName}
                    </option>
                  ))}
                </select>
              </label>
              {!selectedClientId && !opportunityContext?.crmLeadId ? (
                <label className={cn(fieldLabel, "sm:col-span-2")}>
                  Customer name (when no client selected)
                  <input
                    className={fieldInput}
                    value={manualCompanyName}
                    onChange={(e) => setManualCompanyName(e.target.value)}
                  />
                </label>
              ) : null}
            </>
          )}
        </div>
        {billTo ? (
          <dl className="mt-3 grid gap-2 border-t border-white/10 pt-3 text-sm text-white/75 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-white/40">Company</dt>
              <dd>{billTo.companyName}</dd>
            </div>
            {billTo.contactName ? (
              <div>
                <dt className="text-xs text-white/40">Contact</dt>
                <dd>{billTo.contactName}</dd>
              </div>
            ) : null}
            {billTo.email ? (
              <div>
                <dt className="text-xs text-white/40">Email</dt>
                <dd>{billTo.email}</dd>
              </div>
            ) : null}
            {billTo.phone ? (
              <div>
                <dt className="text-xs text-white/40">Phone</dt>
                <dd>{billTo.phone}</dd>
              </div>
            ) : null}
            {billTo.address ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-white/40">Address</dt>
                <dd>{billTo.address}</dd>
              </div>
            ) : null}
            {[billTo.city, billTo.region, billTo.country].filter(Boolean).length ? (
              <div className="sm:col-span-2">
                <dt className="text-xs text-white/40">Location</dt>
                <dd>{[billTo.city, billTo.region, billTo.country].filter(Boolean).join(", ")}</dd>
              </div>
            ) : null}
          </dl>
        ) : (
          <p className="mt-2 text-xs text-white/45">Select a client or enter a customer name for this quote.</p>
        )}
      </section>

      <section className="rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
        <h3 className={fieldLabel}>Visible columns on quote / PDF</h3>
        <div className="mt-2 flex flex-wrap gap-3 text-xs text-white/75">
          {(
            [
              ["showQuantity", "Qty"],
              ["showUnit", "Unit"],
              ["showRate", "Rate"],
              ["showDiscount", "Discount"],
              ["showTax", "Tax %"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={columnVisibility[key]}
                onChange={(e) =>
                  setColumnVisibility((current) => ({ ...current, [key]: e.target.checked }))
                }
              />
              {label}
            </label>
          ))}
        </div>
        {scopeStyle ? (
          <p className="mt-2 text-xs text-sky-200/80">
            Scope-style quote: descriptive lines with a single commercial total (pricing columns hidden on the PDF).
          </p>
        ) : null}
      </section>

      <section className="min-w-0 rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className={fieldLabel}>Line items</h3>
          <button
            type="button"
            onClick={() => setLines((rows) => [...rows, emptyLine()])}
            className="inline-flex items-center gap-1 text-xs font-semibold text-sky-300"
          >
            <Plus className="h-3.5 w-3.5" /> Add line item
          </button>
        </div>
        <div className="mt-3 space-y-3">
          {lines.map((line, index) => (
            <div key={line.key} className="grid gap-2 rounded-lg border border-white/10 p-3 lg:grid-cols-12">
              <label className={cn(fieldLabel, "lg:col-span-12")}>
                Description
                <input
                  className={fieldInput}
                  value={line.description}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, description: e.target.value } : row)))
                  }
                />
              </label>
              <label className={cn(fieldLabel, "lg:col-span-12")}>
                Supporting text (optional)
                <textarea
                  rows={2}
                  className={fieldInput}
                  value={line.detailText}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, detailText: e.target.value } : row)))
                  }
                />
              </label>
              {!scopeStyle ? (
              <>
              <label className={cn(fieldLabel, "lg:col-span-2")}>
                Qty
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldInput}
                  value={line.quantity}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, quantity: e.target.value } : row)))
                  }
                />
              </label>
              <label className={cn(fieldLabel, "lg:col-span-2")}>
                Unit
                <select
                  className={fieldInput}
                  value={line.unit || ""}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, unit: e.target.value } : row)))
                  }
                >
                  <option value="">—</option>
                  {UNIT_OPTIONS.map((unit) => (
                    <option key={unit} value={unit}>
                      {unit}
                    </option>
                  ))}
                </select>
              </label>
              <label className={cn(fieldLabel, "lg:col-span-2")}>
                Rate
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldInput}
                  value={line.rate}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, rate: e.target.value } : row)))
                  }
                />
              </label>
              <label className={cn(fieldLabel, "lg:col-span-2")}>
                Discount
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldInput}
                  value={line.discount}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, discount: e.target.value } : row)))
                  }
                />
              </label>
              <label className={cn(fieldLabel, "lg:col-span-2")}>
                Tax %
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  className={fieldInput}
                  value={line.taxRate}
                  onChange={(e) =>
                    setLines((rows) => rows.map((row, i) => (i === index ? { ...row, taxRate: e.target.value } : row)))
                  }
                />
              </label>
              </>
              ) : null}
              <div className="flex items-end justify-between lg:col-span-12">
                {!scopeStyle ? (
                <p className="text-xs text-white/55">
                  Line total: {money(totals.lines[index]?.amount ?? 0, currency)}
                </p>
                ) : (
                  <span className="text-xs text-white/45">Descriptive scope line</span>
                )}
                {lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => setLines((rows) => rows.filter((_, i) => i !== index))}
                    className="inline-flex items-center gap-1 text-xs text-rose-300"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:max-w-md lg:ml-auto">
          {scopeStyle ? (
            <label className={cn(fieldLabel, "sm:col-span-2")}>
              Quote-level commercial total
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldInput}
                value={commercialTotal}
                onChange={(e) => setCommercialTotal(e.target.value)}
              />
            </label>
          ) : (
            <label className={fieldLabel}>
              Quote-level discount
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldInput}
                value={quoteDiscount}
                onChange={(e) => setQuoteDiscount(e.target.value)}
              />
            </label>
          )}
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-white/80">
            {scopeStyle ? (
              <p className="font-semibold text-white">Total: {money(totals.totalAmount, currency)}</p>
            ) : (
              <>
                <p>Subtotal: {money(totals.subtotal, currency)}</p>
                <p className="mt-1">Tax: {money(totals.taxAmount, currency)}</p>
                <p className="mt-1 font-semibold text-white">Total: {money(totals.totalAmount, currency)}</p>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/10 bg-[#0b1524]/40 p-3">
        <h3 className={fieldLabel}>Bank details (optional, shown on PDF)</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {(
            [
              ["accountName", "Account name"],
              ["bankName", "Bank name"],
              ["accountNumber", "Account number"],
              ["sortCode", "Sort code"],
              ["iban", "IBAN"],
              ["swiftBic", "SWIFT/BIC"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className={fieldLabel}>
              {label}
              <input
                className={fieldInput}
                value={bankDetails[key] ?? ""}
                onChange={(e) => setBankDetails((current) => ({ ...current, [key]: e.target.value }))}
              />
            </label>
          ))}
          <label className={cn(fieldLabel, "sm:col-span-2")}>
            Other banking information
            <input
              className={fieldInput}
              value={bankDetails.other ?? ""}
              onChange={(e) => setBankDetails((current) => ({ ...current, other: e.target.value }))}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <label className={fieldLabel}>
          Payment terms
          <textarea rows={3} className={fieldInput} value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
        </label>
        <label className={fieldLabel}>
          Notes
          <textarea rows={3} className={fieldInput} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <label className={cn(fieldLabel, "lg:col-span-2")}>
          Terms & conditions (text)
          <textarea rows={4} className={fieldInput} value={terms} onChange={(e) => setTerms(e.target.value)} />
        </label>
        <div className={cn(fieldLabel, "lg:col-span-2")}>
          Terms & conditions PDF
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="application/pdf,.pdf"
              disabled={termsPdfBusy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadTermsPdf(file);
                e.target.value = "";
              }}
              className="text-xs text-white/70"
            />
            {termsPdfFilename ? (
              <>
                <span className="text-xs text-white/60">{termsPdfFilename}</span>
                <button
                  type="button"
                  disabled={termsPdfBusy}
                  onClick={() => void removeTermsPdf()}
                  className="text-xs text-rose-300"
                >
                  Remove
                </button>
              </>
            ) : (
              <span className="text-xs text-white/45">
                {editingQuote?.id ? "No PDF attached" : "Save quote first to attach a PDF"}
              </span>
            )}
          </div>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => handleSave()}
          className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-500 disabled:opacity-60"
        >
          {busy ? <Loader2 className="inline h-4 w-4 animate-spin" /> : null} SAVE QUOTE
        </button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/70">
          Cancel
        </button>
      </div>
    </div>
  );
}
