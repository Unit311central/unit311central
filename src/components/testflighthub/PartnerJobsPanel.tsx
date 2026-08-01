"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

type PartnerCommissionRate = {
  id: string;
  partnerId: string;
  label: string;
  ratePct: number;
  isDefault: boolean;
};

type PartnerJob = {
  id: string;
  jobDate: string;
  description: string;
  location: string | null;
  clientName: string | null;
  invoiceNumber: string | null;
  baseAmount: number;
  currency: string;
  commissionRatePct: number;
  commissionAmount: number;
  paymentDueDate: string | null;
  expenseId: string | null;
};

function computeCommissionAmount(baseAmount: number, ratePct: number) {
  return Math.round((Number(baseAmount) || 0) * (Number(ratePct) || 0)) / 100;
}

type ClientOption = { id: string; companyName: string };

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function money(amount: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount || 0);
}

export default function PartnerJobsPanel({ partnerId }: { partnerId: string }) {
  const [jobs, setJobs] = useState<PartnerJob[]>([]);
  const [rates, setRates] = useState<PartnerCommissionRate[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rateLabel, setRateLabel] = useState("Standard");
  const [ratePct, setRatePct] = useState("10");
  const [form, setForm] = useState({
    jobDate: new Date().toISOString().slice(0, 10),
    description: "",
    location: "",
    clientId: "",
    baseAmount: "",
    currency: "USD",
    commissionRateId: "",
    commissionRatePct: "",
    paymentDueDate: "",
    createClientInvoice: true,
    createApPayable: true,
  });

  const selectedClientName = useMemo(
    () => clients.find((client) => client.id === form.clientId)?.companyName || "",
    [clients, form.clientId],
  );

  const previewRate = useMemo(() => {
    if (form.commissionRatePct.trim()) return Number(form.commissionRatePct) || 0;
    const selected = rates.find((rate) => rate.id === form.commissionRateId);
    if (selected) return selected.ratePct;
    return rates.find((rate) => rate.isDefault)?.ratePct || rates[0]?.ratePct || 0;
  }, [form.commissionRateId, form.commissionRatePct, rates]);

  const previewCommission = computeCommissionAmount(Number(form.baseAmount) || 0, previewRate);

  async function reload() {
    setLoading(true);
    try {
      const [jobsRes, ratesRes, clientsRes] = await Promise.all([
        fetch(`/api/partners/${encodeURIComponent(partnerId)}/jobs`, { cache: "no-store" }),
        fetch(`/api/partners/${encodeURIComponent(partnerId)}/commission-rates`, {
          cache: "no-store",
        }),
        fetch("/api/clients", { cache: "no-store" }),
      ]);
      const jobsData = await readJson<{ jobs?: PartnerJob[]; error?: string }>(jobsRes);
      const ratesData = await readJson<{ rates?: PartnerCommissionRate[]; error?: string }>(
        ratesRes,
      );
      const clientsData = await readJson<{
        clients?: Array<{ id: string; companyName: string }>;
      }>(clientsRes);
      if (!jobsRes.ok) throw new Error(jobsData.error || "Failed to load jobs");
      if (!ratesRes.ok) throw new Error(ratesData.error || "Failed to load rates");
      setJobs(jobsData.jobs || []);
      setRates(ratesData.rates || []);
      setClients(
        (clientsData.clients || []).map((client) => ({
          id: client.id,
          companyName: client.companyName,
        })),
      );
      if (!form.commissionRateId && ratesData.rates?.[0]) {
        setForm((prev) => ({
          ...prev,
          commissionRateId:
            ratesData.rates?.find((rate) => rate.isDefault)?.id || ratesData.rates?.[0]?.id || "",
        }));
      }
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to load partner jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerId]);

  async function addRate() {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/commission-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: rateLabel,
          ratePct: Number(ratePct),
          isDefault: rates.length === 0,
        }),
      });
      const data = await readJson<{ rate?: PartnerCommissionRate; error?: string }>(res);
      if (!res.ok || !data.rate) throw new Error(data.error || "Failed to add rate");
      setRates((prev) => [...prev, data.rate!]);
      setForm((prev) => ({ ...prev, commissionRateId: data.rate!.id }));
      setFeedback(`Added ${data.rate.label} at ${data.rate.ratePct}%`);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to add rate");
    } finally {
      setBusy(false);
    }
  }

  async function addJob() {
    if (!form.description.trim() || !form.jobDate) {
      setFeedback("Job date and description are required.");
      return;
    }
    setBusy(true);
    setFeedback(null);
    try {
      const res = await fetch(`/api/partners/${encodeURIComponent(partnerId)}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobDate: form.jobDate,
          description: form.description,
          location: form.location,
          clientId: form.clientId || null,
          clientName: selectedClientName || null,
          baseAmount: Number(form.baseAmount) || 0,
          currency: form.currency,
          commissionRateId: form.commissionRateId || null,
          commissionRatePct: form.commissionRatePct
            ? Number(form.commissionRatePct)
            : previewRate,
          paymentDueDate: form.paymentDueDate || null,
          createClientInvoice: form.createClientInvoice && Boolean(form.clientId),
          createApPayable: form.createApPayable,
        }),
      });
      const data = await readJson<{ job?: PartnerJob; error?: string }>(res);
      if (!res.ok || !data.job) throw new Error(data.error || "Failed to create job");
      setJobs((prev) => [data.job!, ...prev]);
      setForm((prev) => ({
        ...prev,
        description: "",
        location: "",
        baseAmount: "",
        paymentDueDate: "",
      }));
      setFeedback(
        [
          "Job created.",
          data.job.invoiceNumber ? `Client invoice ${data.job.invoiceNumber}.` : null,
          data.job.expenseId ? "AP payable created for commission." : null,
          `Commission due ${money(data.job.commissionAmount, data.job.currency)}.`,
        ]
          .filter(Boolean)
          .join(" "),
      );
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Failed to create job");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 sm:p-6">
        <p className="inline-flex items-center gap-2 text-sm text-white/45">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading jobs…
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">Jobs</p>
        <h3 className="mt-1 text-base font-semibold text-white">Partner jobs & commissions</h3>
        <p className="mt-1 text-xs text-white/45">
          Add a job (date, what, location), link a client invoice, set commission %, auto-calculate
          amount due, and create an Accounts Payable entry for the payment due date.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-3">
        <p className="text-xs font-semibold text-white/70">Commission percentages</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {rates.length === 0 ? (
            <p className="text-xs text-white/40">No rates yet — add at least one.</p>
          ) : (
            rates.map((rate) => (
              <span
                key={rate.id}
                className={cn(
                  "rounded-full border px-2 py-1 text-[11px] font-semibold",
                  rate.isDefault
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                    : "border-white/10 bg-white/[0.03] text-white/70",
                )}
              >
                {rate.label}: {rate.ratePct}%
                {rate.isDefault ? " · default" : ""}
              </span>
            ))
          )}
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_120px_auto]">
          <input
            value={rateLabel}
            onChange={(event) => setRateLabel(event.target.value)}
            placeholder="Label (e.g. Referral)"
            className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
          <input
            value={ratePct}
            onChange={(event) => setRatePct(event.target.value)}
            placeholder="%"
            className="rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => void addRate()}
            className="inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 text-xs font-semibold text-sky-100 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add rate
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs text-white/45">
          Date
          <input
            type="date"
            value={form.jobDate}
            onChange={(event) => setForm((prev) => ({ ...prev, jobDate: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-white/45">
          Location
          <input
            value={form.location}
            onChange={(event) => setForm((prev) => ({ ...prev, location: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-white/45 sm:col-span-2">
          What / description
          <input
            value={form.description}
            onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-white/45">
          Client (for invoice)
          <select
            value={form.clientId}
            onChange={(event) => setForm((prev) => ({ ...prev, clientId: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          >
            <option value="">No client invoice</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.companyName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/45">
          Invoice / job amount
          <input
            value={form.baseAmount}
            onChange={(event) => setForm((prev) => ({ ...prev, baseAmount: event.target.value }))}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-white/45">
          Commission rate
          <select
            value={form.commissionRateId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, commissionRateId: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          >
            <option value="">Select rate…</option>
            {rates.map((rate) => (
              <option key={rate.id} value={rate.id}>
                {rate.label} ({rate.ratePct}%)
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-white/45">
          Override % (optional)
          <input
            value={form.commissionRatePct}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, commissionRatePct: event.target.value }))
            }
            placeholder={String(previewRate || "")}
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <label className="text-xs text-white/45">
          Payment date due (AP)
          <input
            type="date"
            value={form.paymentDueDate}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, paymentDueDate: event.target.value }))
            }
            className="mt-1 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white"
          />
        </label>
        <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-50">
          Commission due (auto):{" "}
          <span className="font-semibold">{money(previewCommission, form.currency)}</span>
          <span className="ml-1 text-xs text-emerald-100/70">
            ({previewRate}% of {money(Number(form.baseAmount) || 0, form.currency)})
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-4 text-xs text-white/55">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.createClientInvoice}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, createClientInvoice: event.target.checked }))
            }
          />
          Create client invoice (AR)
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.createApPayable}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, createApPayable: event.target.checked }))
            }
          />
          Create AP payable for commission
        </label>
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={() => void addJob()}
        className="mt-3 inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 text-sm font-semibold text-emerald-100 disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Add job
      </button>

      {feedback ? <p className="mt-3 text-xs text-white/55">{feedback}</p> : null}

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-[#0b1524]/60 text-[10px] uppercase tracking-[0.12em] text-white/45">
              <th className="px-3 py-2.5">Date</th>
              <th className="px-3 py-2.5">What</th>
              <th className="px-3 py-2.5">Location</th>
              <th className="px-3 py-2.5">Client / invoice</th>
              <th className="px-3 py-2.5">Rate</th>
              <th className="px-3 py-2.5">Commission due</th>
              <th className="px-3 py-2.5">Payment due</th>
              <th className="px-3 py-2.5">AP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-3 py-6 text-center text-white/45">
                  No jobs yet for this partner.
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="text-white/75">
                  <td className="px-3 py-2.5">{job.jobDate}</td>
                  <td className="px-3 py-2.5 text-white">{job.description}</td>
                  <td className="px-3 py-2.5">{job.location || "—"}</td>
                  <td className="px-3 py-2.5">
                    {job.clientName || "—"}
                    {job.invoiceNumber ? (
                      <span className="mt-0.5 block text-[11px] text-sky-300">
                        {job.invoiceNumber}
                      </span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2.5">{job.commissionRatePct}%</td>
                  <td className="px-3 py-2.5 font-medium text-white">
                    {money(job.commissionAmount, job.currency)}
                  </td>
                  <td className="px-3 py-2.5">{job.paymentDueDate || "—"}</td>
                  <td className="px-3 py-2.5">
                    {job.expenseId ? (
                      <a
                        href={`/?view=accounts-payable`}
                        className="text-xs text-sky-300 hover:underline"
                      >
                        Payable
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
