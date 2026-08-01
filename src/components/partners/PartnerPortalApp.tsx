"use client";

import { useEffect, useState } from "react";
import { Loader2, Upload } from "lucide-react";

import Logo from "@/components/layout/Logo";
import type { PartnerInvoice, PartnerRecord } from "@/lib/partners/types";
import { PARTNER_COUNTRY_NAMES } from "@/lib/partners/countries";
import { cn } from "@/lib/utils";

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function statusLabel(status: string) {
  if (status === "job_not_started") return "Job not started";
  if (status === "pending") return "Pending";
  if (status === "paid") return "Paid";
  return status;
}

export default function PartnerPortalApp({ token }: { token: string }) {
  const [tab, setTab] = useState<"details" | "invoices" | "chat">("details");
  const [partner, setPartner] = useState<PartnerRecord | null>(null);
  const [invoices, setInvoices] = useState<PartnerInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatLog, setChatLog] = useState<Array<{ role: "assistant" | "user"; content: string }>>([
    {
      role: "assistant",
      content:
        "Hello. I can help with your partner profile, invoice submission, or payment questions. How can I help?",
    },
  ]);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    district: "",
    country: "",
    postcode: "",
    phoneCountryCode: "",
    phoneNumber: "",
    accountHolder: "",
    bankName: "",
    bankAddress: "",
    accountNumber: "",
    sortCode: "",
    swift: "",
    iban: "",
    bic: "",
    routing: "",
  });

  const [invoiceForm, setInvoiceForm] = useState({
    jobReference: "",
    description: "",
    amount: "",
    file: null as File | null,
  });

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/partners/portal/${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = await readJson<{
        partner?: PartnerRecord;
        invoices?: PartnerInvoice[];
        error?: string;
      }>(res);
      if (!res.ok || !data.partner) throw new Error(data.error || "Portal not found");
      setPartner(data.partner);
      setInvoices(data.invoices || []);
      setForm({
        firstName: data.partner.firstName || "",
        lastName: data.partner.lastName || "",
        companyName: data.partner.companyName || "",
        email: data.partner.email || "",
        addressLine1: data.partner.addressLine1 || "",
        addressLine2: data.partner.addressLine2 || "",
        city: data.partner.city || "",
        district: data.partner.district || "",
        country: data.partner.country || "",
        postcode: data.partner.postcode || "",
        phoneCountryCode: data.partner.phoneCountryCode || "",
        phoneNumber: data.partner.phoneNumber || "",
        accountHolder: data.partner.accountHolder || "",
        bankName: data.partner.bankName || "",
        bankAddress: data.partner.bankAddress || "",
        accountNumber: data.partner.accountNumber || "",
        sortCode: data.partner.sortCode || "",
        swift: data.partner.swift || "",
        iban: data.partner.iban || "",
        bic: data.partner.bic || "",
        routing: data.partner.routing || "",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load portal");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [token]);

  async function saveDetails() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/partners/portal/${encodeURIComponent(token)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await readJson<{ partner?: PartnerRecord; error?: string }>(res);
      if (!res.ok || !data.partner) throw new Error(data.error || "Failed to save");
      setPartner(data.partner);
      setFeedback("Details saved.");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function submitInvoice() {
    if (!invoiceForm.jobReference.trim()) {
      setFeedback("Enter the job reference number.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const body = new FormData();
      body.set("jobReference", invoiceForm.jobReference.trim());
      body.set("description", invoiceForm.description.trim());
      if (invoiceForm.amount.trim()) body.set("amount", invoiceForm.amount.trim());
      if (invoiceForm.file) body.set("file", invoiceForm.file);
      const res = await fetch(`/api/partners/portal/${encodeURIComponent(token)}/invoices`, {
        method: "POST",
        body,
      });
      const data = await readJson<{ invoice?: PartnerInvoice; error?: string }>(res);
      if (!res.ok || !data.invoice) throw new Error(data.error || "Failed to submit invoice");
      setInvoices((prev) => [data.invoice!, ...prev]);
      setInvoiceForm({ jobReference: "", description: "", amount: "", file: null });
      setFeedback("Invoice submitted.");
      setTab("invoices");
    } catch (err) {
      setFeedback(err instanceof Error ? err.message : "Failed to submit invoice");
    } finally {
      setBusy(false);
    }
  }

  function sendChat() {
    const text = chatDraft.trim();
    if (!text) return;
    setChatLog((prev) => [
      ...prev,
      { role: "user", content: text },
      {
        role: "assistant",
        content:
          "Thanks — for profile edits use the Details tab, and for payments use Upload invoice with your job reference. A Unit311 partner manager will follow up if needed.",
      },
    ]);
    setChatDraft("");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] text-white/60">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (error || !partner) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#050816] px-4 text-center text-red-200">
        {error || "Portal not found"}
      </div>
    );
  }

  const field = (key: keyof typeof form, label: string, opts?: { type?: string }) => (
    <label key={key} className="block text-xs text-white/50">
      {label}
      <input
        value={form[key]}
        type={opts?.type || "text"}
        onChange={(event) => setForm((prev) => ({ ...prev, [key]: event.target.value }))}
        className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
      />
    </label>
  );

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-4 px-4 py-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <Logo height={48} href="/" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
              Partner portal
            </p>
            <h1 className="mt-1 text-xl font-semibold">{partner.companyName}</h1>
            <p className="text-sm text-white/50">
              {partner.firstName} {partner.lastName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setTab("details")}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold",
              tab === "details"
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.03] text-white/70",
            )}
          >
            Details
          </button>

          <div className="rounded-xl border border-white/10 bg-black/20 p-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">
              Upload invoice
            </p>
            <label className="mt-2 block text-[11px] text-white/45">
              Job reference
              <input
                value={invoiceForm.jobReference}
                onChange={(event) =>
                  setInvoiceForm((prev) => ({ ...prev, jobReference: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="mt-2 block text-[11px] text-white/45">
              Description
              <input
                value={invoiceForm.description}
                onChange={(event) =>
                  setInvoiceForm((prev) => ({ ...prev, description: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="mt-2 block text-[11px] text-white/45">
              Amount
              <input
                value={invoiceForm.amount}
                onChange={(event) =>
                  setInvoiceForm((prev) => ({ ...prev, amount: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-sm text-white"
              />
            </label>
            <label className="mt-2 block text-[11px] text-white/45">
              Invoice file
              <input
                type="file"
                onChange={(event) =>
                  setInvoiceForm((prev) => ({
                    ...prev,
                    file: event.target.files?.[0] || null,
                  }))
                }
                className="mt-1 block w-full text-[11px] text-white/70"
              />
            </label>
            <button
              type="button"
              disabled={busy}
              onClick={() => void submitInvoice()}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-100 disabled:opacity-50"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Submit invoice
            </button>
          </div>

          <button
            type="button"
            onClick={() => setTab("chat")}
            className={cn(
              "w-full rounded-xl border px-3 py-2 text-left text-sm font-semibold",
              tab === "chat"
                ? "border-violet-400/40 bg-violet-500/15 text-violet-100"
                : "border-white/10 bg-white/[0.03] text-white/70",
            )}
          >
            AI assistant
          </button>
        </aside>

        <main className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("details")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                tab === "details"
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 text-white/60",
              )}
            >
              Details
            </button>
            <button
              type="button"
              onClick={() => setTab("invoices")}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold",
                tab === "invoices"
                  ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                  : "border-white/10 text-white/60",
              )}
            >
              Invoices
            </button>
          </div>

          {feedback ? <p className="mb-3 text-xs text-white/55">{feedback}</p> : null}

          {tab === "details" ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                {field("firstName", "First name")}
                {field("lastName", "Last name")}
                {field("companyName", "Company name")}
                {field("email", "Email", { type: "email" })}
                {field("addressLine1", "Address line 1")}
                {field("addressLine2", "Address line 2")}
                {field("city", "City")}
                {field("district", "District / suburb")}
                <label className="block text-xs text-white/50">
                  Country
                  <select
                    value={form.country}
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, country: event.target.value }))
                    }
                    className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
                  >
                    <option value="">Select…</option>
                    {PARTNER_COUNTRY_NAMES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
                {field("postcode", "Postcode / ZIP")}
                {field("phoneCountryCode", "Phone country code")}
                {field("phoneNumber", "Phone number")}
                {field("accountHolder", "Account holder / company")}
                {field("bankName", "Bank name")}
                {field("bankAddress", "Bank address")}
                {field("accountNumber", "Account number")}
                {field("sortCode", "Sort code")}
                {field("swift", "SWIFT")}
                {field("iban", "IBAN")}
                {field("bic", "BIC")}
                {field("routing", "Routing")}
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={() => void saveDetails()}
                className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-100 disabled:opacity-50"
              >
                Save details
              </button>
            </div>
          ) : null}

          {tab === "invoices" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[11px] uppercase tracking-wide text-white/45">
                  <tr>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Reference</th>
                    <th className="px-2 py-2">Description</th>
                    <th className="px-2 py-2">Status</th>
                    <th className="px-2 py-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-2 py-8 text-center text-white/45">
                        No invoices submitted yet.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((invoice) => (
                      <tr key={invoice.id} className="border-b border-white/5">
                        <td className="px-2 py-3 text-white/60">
                          {new Date(invoice.submittedAt).toLocaleDateString()}
                        </td>
                        <td className="px-2 py-3 text-white/80">{invoice.jobReference}</td>
                        <td className="px-2 py-3 text-white/60">{invoice.description || "—"}</td>
                        <td className="px-2 py-3 text-white/80">{statusLabel(invoice.status)}</td>
                        <td className="px-2 py-3 text-white/80">
                          {invoice.amount == null
                            ? "—"
                            : `${invoice.currency} ${invoice.amount.toLocaleString()}`}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === "chat" ? (
            <div className="space-y-3">
              <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                {chatLog.map((message, index) => (
                  <div
                    key={`${message.role}-${index}`}
                    className={cn(
                      "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm",
                      message.role === "user"
                        ? "ml-auto bg-sky-500/20 text-sky-50"
                        : "border border-white/10 bg-white/[0.04] text-white/85",
                    )}
                  >
                    {message.content}
                  </div>
                ))}
              </div>
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  sendChat();
                }}
              >
                <input
                  value={chatDraft}
                  onChange={(event) => setChatDraft(event.target.value)}
                  placeholder="Ask the assistant…"
                  className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
                />
                <button
                  type="submit"
                  className="rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-sm font-semibold text-sky-100"
                >
                  Send
                </button>
              </form>
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
