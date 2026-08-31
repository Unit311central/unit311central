"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { isBrowserCustomerWorkspaceSurface } from "@/lib/customer-workspace-surface";
import {
  deleteCustomerFinanceBudgetTarget,
  deleteCustomerFinanceForecastTarget,
  deleteCustomerFinanceKpi,
  getCustomerFinancePlanningSnapshot,
  subscribeCustomerFinancePlanning,
  upsertCustomerFinanceBudgetTarget,
  upsertCustomerFinanceForecastTarget,
  upsertCustomerFinanceKpi,
  type CustomerFinanceBudgetTarget,
  type CustomerFinanceForecastTarget,
  type CustomerFinanceKpi,
} from "@/lib/customer-finance-planning-store";
import { formatReportingMoney } from "@/lib/financial-reporting-currency";
import { useWorkspaceReportingCurrency } from "@/lib/workspace-reporting-currency";

type Mode = "budget" | "forecast" | "kpis";

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/40";
}

export function CustomerFinancePlanningPanel({ mode }: { mode: Mode }) {
  const isCustomer = isBrowserCustomerWorkspaceSurface();
  const currency = useWorkspaceReportingCurrency();
  const [snapshot, setSnapshot] = useState(() => getCustomerFinancePlanningSnapshot());
  const [editor, setEditor] = useState<
    | { kind: "kpi"; row: Partial<CustomerFinanceKpi> & { id?: string } }
    | { kind: "budget"; row: Partial<CustomerFinanceBudgetTarget> & { id?: string } }
    | { kind: "forecast"; row: Partial<CustomerFinanceForecastTarget> & { id?: string } }
    | null
  >(null);

  useEffect(() => {
    return subscribeCustomerFinancePlanning(() => setSnapshot(getCustomerFinancePlanningSnapshot()));
  }, []);

  const money = (amount: number) => formatReportingMoney(amount, currency);

  const title = useMemo(() => {
    if (mode === "budget") return "Budget targets";
    if (mode === "forecast") return "Forecast targets";
    return "Custom KPIs";
  }, [mode]);

  if (!isCustomer) return null;

  function openAdd() {
    if (mode === "kpis") {
      setEditor({ kind: "kpi", row: { label: "", value: 0, currency, notes: "" } });
      return;
    }
    if (mode === "budget") {
      setEditor({
        kind: "budget",
        row: { month: new Date().toISOString().slice(0, 7), amount: 0, currency, notes: "" },
      });
      return;
    }
    setEditor({
      kind: "forecast",
      row: { label: "Operating burn", monthlyBurn: 0, currency, notes: "" },
    });
  }

  function saveEditor() {
    if (!editor) return;
    if (editor.kind === "kpi") {
      upsertCustomerFinanceKpi({
        id: editor.row.id,
        label: String(editor.row.label ?? ""),
        value: Number(editor.row.value) || 0,
        currency: editor.row.currency ?? currency,
        notes: String(editor.row.notes ?? ""),
      });
    } else if (editor.kind === "budget") {
      upsertCustomerFinanceBudgetTarget({
        id: editor.row.id,
        month: String(editor.row.month ?? ""),
        amount: Number(editor.row.amount) || 0,
        currency: editor.row.currency ?? currency,
        notes: String(editor.row.notes ?? ""),
      });
    } else {
      upsertCustomerFinanceForecastTarget({
        id: editor.row.id,
        label: String(editor.row.label ?? ""),
        monthlyBurn: Number(editor.row.monthlyBurn) || 0,
        currency: editor.row.currency ?? currency,
        notes: String(editor.row.notes ?? ""),
      });
    }
    setEditor(null);
  }

  const rows =
    mode === "kpis"
      ? snapshot.kpis.map((row) => ({
          id: row.id,
          primary: row.label,
          secondary: money(row.value),
          onEdit: () => setEditor({ kind: "kpi", row }),
          onDelete: () => deleteCustomerFinanceKpi(row.id),
        }))
      : mode === "budget"
        ? snapshot.budgetTargets.map((row) => ({
            id: row.id,
            primary: row.month,
            secondary: money(row.amount),
            onEdit: () => setEditor({ kind: "budget", row }),
            onDelete: () => deleteCustomerFinanceBudgetTarget(row.id),
          }))
        : snapshot.forecastTargets.map((row) => ({
            id: row.id,
            primary: row.label,
            secondary: `${money(row.monthlyBurn)} / month`,
            onEdit: () => setEditor({ kind: "forecast", row }),
            onDelete: () => deleteCustomerFinanceForecastTarget(row.id),
          }));

  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center gap-1 rounded-lg border border-sky-400/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-100"
        >
          <Plus className="h-3.5 w-3.5" />
          Add
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">No {title.toLowerCase()} yet.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {rows.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-[#0b1524]/70 px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-white">{row.primary}</p>
                <p className="text-xs text-white/50">{row.secondary}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={row.onEdit}
                  className="rounded border border-white/15 px-2 py-1 text-xs text-white/75"
                >
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={row.onDelete}
                  className="rounded border border-rose-400/25 bg-rose-500/10 px-2 py-1 text-xs text-rose-200"
                >
                  <Trash2 className="mr-1 inline h-3 w-3" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editor ? (
        <div className="mt-4 rounded-xl border border-sky-400/25 bg-sky-500/5 p-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {editor.kind === "kpi" ? (
              <>
                <label className="block text-xs text-white/55">
                  Label
                  <input
                    value={String(editor.row.label ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "kpi"
                          ? { ...current, row: { ...current.row, label: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Value ({currency})
                  <input
                    value={String(editor.row.value ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "kpi"
                          ? {
                              ...current,
                              row: { ...current.row, value: Number(event.target.value) || 0 },
                            }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
            {editor.kind === "budget" ? (
              <>
                <label className="block text-xs text-white/55">
                  Month (YYYY-MM)
                  <input
                    value={String(editor.row.month ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "budget"
                          ? { ...current, row: { ...current.row, month: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Amount ({currency})
                  <input
                    value={String(editor.row.amount ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "budget"
                          ? {
                              ...current,
                              row: { ...current.row, amount: Number(event.target.value) || 0 },
                            }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
            {editor.kind === "forecast" ? (
              <>
                <label className="block text-xs text-white/55">
                  Label
                  <input
                    value={String(editor.row.label ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "forecast"
                          ? { ...current, row: { ...current.row, label: event.target.value } }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
                <label className="block text-xs text-white/55">
                  Monthly burn ({currency})
                  <input
                    value={String(editor.row.monthlyBurn ?? "")}
                    onChange={(event) =>
                      setEditor((current) =>
                        current?.kind === "forecast"
                          ? {
                              ...current,
                              row: {
                                ...current.row,
                                monthlyBurn: Number(event.target.value) || 0,
                              },
                            }
                          : current,
                      )
                    }
                    className={inputClass()}
                  />
                </label>
              </>
            ) : null}
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={saveEditor}
              className="rounded-xl bg-sky-600 px-3 py-2 text-xs font-semibold text-white"
            >
              Save
            </button>
            <button
              type="button"
              onClick={() => setEditor(null)}
              className="rounded-xl border border-white/15 px-3 py-2 text-xs font-semibold text-white/75"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function useCustomerBudgetForecastBaseline() {
  const [snapshot, setSnapshot] = useState(() => getCustomerFinancePlanningSnapshot());
  useEffect(() => {
    return subscribeCustomerFinancePlanning(() => setSnapshot(getCustomerFinancePlanningSnapshot()));
  }, []);
  const month = new Date().toISOString().slice(0, 7);
  const budgetTarget =
    snapshot.budgetTargets.find((row) => row.month === month)?.amount ??
    snapshot.budgetTargets[0]?.amount ??
    null;
  const forecastTarget =
    snapshot.forecastTargets[0]?.monthlyBurn ??
    (snapshot.forecastTargets.reduce((sum, row) => sum + row.monthlyBurn, 0) || null);
  return { budgetTarget, forecastTarget };
}
