"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Loader2, Pencil, RefreshCw, Receipt, Trash2 } from "lucide-react";

import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import { isBrowserDemoSurface } from "@/lib/demo-enterprise";
import { isSupplierAccountsPayableExpense } from "@/lib/expenses-data";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";
import type { SupplierInvoiceDraft } from "@/lib/accounting/types";
import type { NorthstarPayableCategory } from "@/lib/demo/northstar-ap-ar-fixtures";
import { cn } from "@/lib/utils";

type PayableRow = {
  id: string;
  supplier: string;
  description: string;
  amount: number;
  currency: string;
  dueDate: string;
  paid: boolean;
  category: NorthstarPayableCategory;
  journalEntryId: string | null;
  paymentJournalEntryId: string | null;
  reference: string | null;
};

const CATEGORY_LABELS: Record<NorthstarPayableCategory, string> = {
  payroll: "Payroll",
  opex: "Opex",
  expense: "Operating expenses",
};

type ApSection = "invoices" | "approvals" | "outstanding" | "due-dates" | "payments";

function resolveApSection(value: string | null, forced?: ApSection): ApSection {
  if (forced) return forced;
  if (
    value === "approvals" ||
    value === "outstanding" ||
    value === "due-dates" ||
    value === "invoices" ||
    value === "payments"
  ) {
    return value;
  }
  return "invoices";
}

const SECTION_COPY: Record<ApSection, { title: string; description: string }> = {
  invoices: {
    title: "Supplier invoices",
    description: "Ingest supplier bills, approve drafts, and review open payables.",
  },
  approvals: {
    title: "Supplier invoice approvals",
    description: "Review draft supplier invoices before posting them to the ledger.",
  },
  outstanding: {
    title: "Outstanding payables",
    description: "Open supplier liabilities awaiting settlement.",
  },
  "due-dates": {
    title: "Due dates",
    description: "Open payables ordered by due date, including overdue items.",
  },
  payments: {
    title: "Supplier payments",
    description: "Recorded supplier settlements and payment references.",
  },
};

type DraftEditorForm = {
  supplier: string;
  reference: string;
  amount: string;
  currency: string;
  invoiceDate: string;
  dueDate: string;
  description: string;
};

const EMPTY_DRAFT_FORM: DraftEditorForm = {
  supplier: "",
  reference: "",
  amount: "",
  currency: "GBP",
  invoiceDate: "",
  dueDate: "",
  description: "",
};

function draftToForm(draft: SupplierInvoiceDraft): DraftEditorForm {
  return {
    supplier: draft.supplier,
    reference: draft.reference ?? "",
    amount: String(draft.amount),
    currency: draft.currency,
    invoiceDate: draft.invoiceDate,
    dueDate: draft.dueDate ?? "",
    description: draft.description,
  };
}

export default function AccountsPayableWorkspace({
  forcedSection,
}: {
  forcedSection?: ApSection;
}) {
  const searchParams = useSearchParams();
  const section = resolveApSection(searchParams.get("section"), forcedSection);
  const [rows, setRows] = useState<PayableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<NorthstarPayableCategory | "all">("all");
  const [drafts, setDrafts] = useState<SupplierInvoiceDraft[]>([]);
  const [ingestText, setIngestText] = useState("");
  const [ingestBusy, setIngestBusy] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [draftForm, setDraftForm] = useState<DraftEditorForm>(EMPTY_DRAFT_FORM);
  const isDemo = isBrowserDemoSurface();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const endpoint = isDemo ? "/api/financials/payables" : "/api/financials/expenses";
      const response = await fetch(endpoint, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load payables");

      if (isDemo) {
        const payables = (data.payables ?? []) as Array<Record<string, unknown>>;
        setRows(
          payables.map((row) => ({
            id: String(row.id),
            supplier: String(row.supplier ?? "Supplier"),
            description: String(row.description ?? ""),
            amount: Number(row.amount) || 0,
            currency: String(row.currency ?? "GBP"),
            dueDate: String(row.dueDate ?? ""),
            paid: Boolean(row.paid),
            category: (row.category as NorthstarPayableCategory) ?? "expense",
            journalEntryId: row.journalEntryId ? String(row.journalEntryId) : null,
            paymentJournalEntryId: row.paymentJournalEntryId
              ? String(row.paymentJournalEntryId)
              : null,
            reference: row.reference ? String(row.reference) : null,
          })),
        );
        return;
      }

      const expenses = (data.expenses ?? []) as Array<Record<string, unknown>>;
      const supplierPayables = expenses.filter((expense) =>
        isSupplierAccountsPayableExpense({
          reimbursable: Boolean(expense.reimbursable),
          claimantEmployeeId: expense.claimantEmployeeId
            ? String(expense.claimantEmployeeId)
            : null,
          expenseCategoryId: expense.expenseCategoryId
            ? String(expense.expenseCategoryId)
            : null,
          paymentMethod: expense.paymentMethod ? String(expense.paymentMethod) : null,
          reference: expense.reference ? String(expense.reference) : null,
          purposeDescription: expense.purposeDescription
            ? String(expense.purposeDescription)
            : null,
        }),
      );
      setRows(
        supplierPayables.map((expense) => ({
          id: String(expense.id),
          supplier: String(expense.supplier ?? expense.submitterName ?? "Supplier"),
          description: String(expense.purposeDescription ?? ""),
          amount: Number(expense.amount) || 0,
          currency: String(expense.currency ?? "GBP"),
          dueDate: String(expense.expenseDate ?? expense.dateSubmitted ?? ""),
          paid: Boolean(expense.paid),
          category: "expense" as const,
          journalEntryId: expense.journalEntryId ? String(expense.journalEntryId) : null,
          paymentJournalEntryId: expense.paymentJournalEntryId
            ? String(expense.paymentJournalEntryId)
            : null,
          reference: expense.reference ? String(expense.reference) : null,
        })),
      );
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load payables");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  const loadDrafts = useCallback(async () => {
    try {
      const response = await fetch("/api/financials/supplier-invoices", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Failed to load supplier invoice drafts");
      setDrafts((data.drafts ?? []) as SupplierInvoiceDraft[]);
    } catch {
      setDrafts([]);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void loadDrafts();
    });
  }, [loadDrafts]);

  async function handleIngestSupplierInvoice() {
    setIngestBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/financials/supplier-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ingestText }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Ingest failed");
      setIngestText("");
      await loadDrafts();
    } catch (ingestError) {
      setError(ingestError instanceof Error ? ingestError.message : "Ingest failed");
    } finally {
      setIngestBusy(false);
    }
  }

  async function handleApproveDraft(id: string) {
    setIngestBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/financials/supplier-invoices/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Approve failed");
      await loadDrafts();
      await load();
    } catch (approveError) {
      setError(approveError instanceof Error ? approveError.message : "Approve failed");
    } finally {
      setIngestBusy(false);
    }
  }

  function openDraftEditor(draft: SupplierInvoiceDraft) {
    setEditingDraftId(draft.id);
    setDraftForm(draftToForm(draft));
    setEditorOpen(true);
  }

  function closeDraftEditor() {
    setEditorOpen(false);
    setEditingDraftId(null);
    setDraftForm(EMPTY_DRAFT_FORM);
  }

  async function handleSaveDraft() {
    if (!editingDraftId) return;
    setIngestBusy(true);
    setError(null);
    try {
      const amount = Number(draftForm.amount);
      const response = await fetch(`/api/financials/supplier-invoices/${editingDraftId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier: draftForm.supplier.trim(),
          reference: draftForm.reference.trim() || null,
          amount,
          currency: draftForm.currency.trim() || currency,
          invoiceDate: draftForm.invoiceDate || null,
          dueDate: draftForm.dueDate || null,
          description: draftForm.description.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      closeDraftEditor();
      await loadDrafts();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Update failed");
    } finally {
      setIngestBusy(false);
    }
  }

  async function handleDeleteDraft(id: string) {
    const draft = drafts.find((row) => row.id === id);
    if (!draft) return;
    const label = draft.reference ? `${draft.supplier} (${draft.reference})` : draft.supplier;
    if (!window.confirm(`Delete draft supplier invoice for ${label}?`)) return;

    setIngestBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/financials/supplier-invoices/${id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Delete failed");
      if (editingDraftId === id) closeDraftEditor();
      await loadDrafts();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Delete failed");
    } finally {
      setIngestBusy(false);
    }
  }

  useEffect(() => {
    startTransition(() => {
      void load();
    });
  }, [load]);

  const todayIso = "2026-08-16";
  const monthEnd = "2026-08-31";

  const kpis = useMemo(() => {
    const unpaid = rows.filter((row) => !row.paid);
    const outstanding = unpaid.reduce((sum, row) => sum + row.amount, 0);
    const dueNow = unpaid
      .filter((row) => row.dueDate && row.dueDate <= monthEnd)
      .reduce((sum, row) => sum + row.amount, 0);
    const withinMonth = unpaid
      .filter((row) => row.dueDate && row.dueDate > monthEnd)
      .reduce((sum, row) => sum + row.amount, 0);
    const payroll = unpaid
      .filter((row) => row.category === "payroll")
      .reduce((sum, row) => sum + row.amount, 0);
    const opex = unpaid
      .filter((row) => row.category === "opex")
      .reduce((sum, row) => sum + row.amount, 0);
    const expenses = unpaid
      .filter((row) => row.category === "expense")
      .reduce((sum, row) => sum + row.amount, 0);

    return {
      outstanding: isDemo ? 186_000 : outstanding,
      dueNow: isDemo ? 64_000 : dueNow,
      withinMonth: isDemo ? 122_000 : withinMonth,
      overdue: unpaid
        .filter((row) => row.dueDate && row.dueDate < todayIso)
        .reduce((sum, row) => sum + row.amount, 0),
      payroll,
      opex,
      expenses,
      openCount: unpaid.length,
    };
  }, [isDemo, monthEnd, rows, todayIso]);

  const filteredRows = useMemo(() => {
    let next = categoryFilter === "all" ? rows : rows.filter((row) => row.category === categoryFilter);
    if (section === "payments") {
      next = next.filter((row) => row.paid);
    } else if (section === "outstanding" || section === "due-dates") {
      next = next.filter((row) => !row.paid);
    }
    if (section === "due-dates") {
      next = [...next].sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
    }
    if (section === "payments") {
      next = [...next].sort((a, b) => String(b.dueDate).localeCompare(String(a.dueDate)));
    }
    return next;
  }, [categoryFilter, rows, section]);

  const pendingDrafts = useMemo(() => drafts.filter((draft) => draft.status === "draft"), [drafts]);
  const visibleDrafts = section === "approvals" ? pendingDrafts : drafts;
  const showIngest = section === "invoices" || section === "approvals";
  const showPayablesTable = section !== "approvals";
  const sectionCopy = SECTION_COPY[section];

  const currency = useWorkspaceReportingCurrency();
  const money = (amount: number) => formatMoney(amount, currency);

  const cards = isDemo
    ? [
        { label: "Outstanding", value: money(kpis.outstanding) },
        { label: "Due now", value: money(kpis.dueNow) },
        { label: "Within 30 days", value: money(kpis.withinMonth) },
        { label: "Payroll", value: money(kpis.payroll) },
        { label: "Opex", value: money(kpis.opex) },
        { label: "Operating expenses", value: money(kpis.expenses) },
      ]
    : [
        { label: "Outstanding", value: money(kpis.outstanding) },
        { label: "Due This Month", value: money(kpis.dueNow) },
        { label: "Overdue", value: money(kpis.overdue) },
        { label: "Within 30 days", value: money(kpis.withinMonth) },
        { label: "Open items", value: String(kpis.openCount) },
      ];

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">{sectionCopy.title}</h2>
            <p className="mt-1 text-sm text-white/55">{sectionCopy.description}</p>
          </div>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 px-3 text-xs font-semibold text-white/80"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>
        <div
          className={cn(
            "mt-4 grid gap-3 sm:grid-cols-2",
            isDemo ? "xl:grid-cols-6" : "xl:grid-cols-5",
          )}
        >
          {cards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{card.label}</p>
              <p className="mt-1 text-xl font-semibold tabular-nums text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}

      {showIngest ? (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <p className="text-sm font-medium text-white/80">
          {section === "approvals" ? "Draft supplier invoices" : "Ingest supplier invoice"}
        </p>
        <p className="mt-1 text-xs text-white/45">
          {section === "approvals"
            ? "Approve extracted supplier bills to post them to the general ledger."
            : "Paste invoice text (or email body) to create a draft AP bill, then approve to post to the ledger."}
        </p>
        {section === "invoices" ? (
        <textarea
          value={ingestText}
          onChange={(event) => setIngestText(event.target.value)}
          rows={4}
          placeholder="Paste supplier invoice text or email body…"
          className="mt-3 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-sky-400/40"
        />
        ) : null}
        {section === "invoices" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={ingestBusy || !ingestText.trim()}
            onClick={() => void handleIngestSupplierInvoice()}
            className="inline-flex h-9 items-center rounded-xl bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
          >
            {ingestBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Extract & draft bill"}
          </button>
        </div>
        ) : null}
        {visibleDrafts.length > 0 ? (
          <div className="mt-4 overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/40">
                <tr>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-3 py-2">Reference</th>
                  <th className="px-3 py-2 text-right">Amount</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {visibleDrafts.map((draft) => (
                  <tr key={draft.id} className="border-b border-white/[0.05]">
                    <td className="px-3 py-2 text-white/80">{draft.supplier}</td>
                    <td className="px-3 py-2 text-white/55">{draft.reference ?? "—"}</td>
                    <td className="px-3 py-2 text-right tabular-nums text-white/80">
                      {formatMoney(draft.amount, draft.currency)}
                    </td>
                    <td className="px-3 py-2 capitalize text-white/55">{draft.status}</td>
                    <td className="px-3 py-2">
                      {draft.status === "draft" ? (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            disabled={ingestBusy}
                            onClick={() => void handleApproveDraft(draft.id)}
                            className="rounded border border-emerald-400/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-200"
                          >
                            Approve → GL
                          </button>
                          <button
                            type="button"
                            disabled={ingestBusy}
                            onClick={() => openDraftEditor(draft)}
                            className="inline-flex items-center gap-1 rounded border border-white/15 px-2 py-1 text-xs text-white/75 hover:text-white"
                          >
                            <Pencil className="h-3 w-3" />
                            Edit
                          </button>
                          <button
                            type="button"
                            disabled={ingestBusy}
                            onClick={() => void handleDeleteDraft(draft.id)}
                            className="inline-flex items-center gap-1 rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-emerald-300">Posted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : section === "approvals" ? (
          <div className="mt-4 rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/50">
            No supplier invoice drafts awaiting approval.
          </div>
        ) : null}
        {editorOpen ? (
          <div className="mt-4 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4">
            <p className="text-sm font-medium text-white">Edit draft supplier invoice</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs text-white/55">
                Supplier
                <input
                  value={draftForm.supplier}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, supplier: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55">
                Reference
                <input
                  value={draftForm.reference}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, reference: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55">
                Amount
                <input
                  value={draftForm.amount}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, amount: event.target.value }))
                  }
                  inputMode="decimal"
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55">
                Currency
                <input
                  value={draftForm.currency}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, currency: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55">
                Invoice date
                <input
                  type="date"
                  value={draftForm.invoiceDate}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, invoiceDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55">
                Due date
                <input
                  type="date"
                  value={draftForm.dueDate}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, dueDate: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
              <label className="block text-xs text-white/55 sm:col-span-2">
                Description
                <input
                  value={draftForm.description}
                  onChange={(event) =>
                    setDraftForm((current) => ({ ...current, description: event.target.value }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40"
                />
              </label>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={ingestBusy || !draftForm.supplier.trim() || !Number(draftForm.amount)}
                onClick={() => void handleSaveDraft()}
                className="inline-flex h-9 items-center rounded-xl bg-sky-600 px-3 text-xs font-semibold text-white hover:bg-sky-500 disabled:opacity-50"
              >
                {ingestBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save changes"}
              </button>
              <button
                type="button"
                disabled={ingestBusy}
                onClick={closeDraftEditor}
                className="inline-flex h-9 items-center rounded-xl border border-white/15 px-3 text-xs font-semibold text-white/75"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null}
      </section>
      ) : null}

      {showPayablesTable ? (
      <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <p className="text-sm font-medium text-white/70">
            {section === "due-dates"
              ? `${filteredRows.length} open items by due date`
              : `${filteredRows.length} ${section === "outstanding" ? "outstanding" : "open"} payables`}
          </p>
          {isDemo ? (
            <div className="flex flex-wrap gap-1.5">
              {(["all", "payroll", "opex", "expense"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setCategoryFilter(option)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-[11px] font-medium",
                    categoryFilter === option
                      ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                      : "border-white/10 text-white/50 hover:text-white/75",
                  )}
                >
                  {option === "all" ? "All" : CATEGORY_LABELS[option]}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {loading ? (
          <div className="flex items-center gap-2 px-5 py-10 text-sm text-white/55">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading payables…
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Receipt className="mx-auto h-8 w-8 text-white/25" />
            <p className="mt-3 text-sm text-white/50">No supplier payables in this view.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[52rem] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/40">
                <tr>
                  {isDemo ? <th className="px-4 py-2">Type</th> : null}
                  <th className="px-4 py-2">Supplier</th>
                  <th className="px-4 py-2">Description</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2">Due</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">View Journal</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const journalId = row.paymentJournalEntryId ?? row.journalEntryId;
                  return (
                    <tr key={row.id} className="border-b border-white/[0.05]">
                      {isDemo ? (
                        <td className="px-4 py-2 text-xs text-white/55">
                          {CATEGORY_LABELS[row.category]}
                        </td>
                      ) : null}
                      <td className="px-4 py-2 text-white">{row.supplier}</td>
                      <td className="px-4 py-2 text-white/70">{row.description || "—"}</td>
                      <td className="px-4 py-2 text-right font-mono text-white/85">
                        {money(row.amount)}
                      </td>
                      <td className="px-4 py-2 text-white/55">{row.dueDate || "—"}</td>
                      <td className="px-4 py-2 text-white/75">{row.paid ? "Paid" : "Open"}</td>
                      <td className="px-4 py-2">
                        {journalId ? (
                          <Link
                            href={`?view=general-ledger&journal=${encodeURIComponent(journalId)}`}
                            className="text-xs font-medium text-sky-300 hover:text-sky-200"
                          >
                            View journal
                          </Link>
                        ) : (
                          <span className="text-xs text-white/35">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      ) : null}
    </div>
  );
}
