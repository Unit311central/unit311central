"use client";

import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  deleteGreenDesertSalesForecast,
  deleteGreenDesertSalesReport,
  getGreenDesertSalesRecordsSnapshot,
  subscribeGreenDesertSalesRecords,
  upsertGreenDesertSalesForecast,
  upsertGreenDesertSalesReport,
  type GreenDesertSalesForecastEntry,
  type GreenDesertSalesReportEntry,
} from "@/lib/greendesert/greendesert-sales-records-store";
import { GREENDESERT_REPORTING_CURRENCY } from "@/lib/greendesert-surface";
import { formatSalesMoney } from "@/lib/sales-management-insights";
import { WsPrimaryButtonClass, WsSecondaryButtonClass, WsSection } from "../domain-workspace-ui";

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white outline-none focus:border-violet-400/40";
}

export function GreenDesertSalesForecastPanel() {
  const currency = GREENDESERT_REPORTING_CURRENCY;
  const money = (value: number) => formatSalesMoney(value, currency);
  const [snapshot, setSnapshot] = useState(() => getGreenDesertSalesRecordsSnapshot());
  const [editor, setEditor] = useState<Partial<GreenDesertSalesForecastEntry> & { id?: string } | null>(
    null,
  );

  useEffect(() => subscribeGreenDesertSalesRecords(() => setSnapshot(getGreenDesertSalesRecordsSnapshot())), []);

  function saveEditor() {
    if (!editor) return;
    upsertGreenDesertSalesForecast({
      id: editor.id,
      label: String(editor.label ?? "").trim(),
      periodStart: String(editor.periodStart ?? ""),
      periodEnd: String(editor.periodEnd ?? ""),
      amount: Number(editor.amount) || 0,
      currency,
      notes: String(editor.notes ?? ""),
    });
    setEditor(null);
  }

  return (
    <WsSection title="Manual forecast entries" subtitle="Add forecast scenarios for Green Desert" className="p-4 sm:p-5">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className={WsPrimaryButtonClass()}
          onClick={() =>
            setEditor({
              label: "",
              periodStart: "",
              periodEnd: "",
              amount: 0,
              currency,
              notes: "",
            })
          }
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Add forecast
        </button>
      </div>
      {snapshot.forecasts.length === 0 ? (
        <p className="text-sm text-white/50">No manual forecast entries yet.</p>
      ) : (
        <div className="space-y-2">
          {snapshot.forecasts.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-white">{row.label}</p>
                <p className="text-xs text-white/50">
                  {row.periodStart || "—"} to {row.periodEnd || "—"} · {money(row.amount)}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditor(row)}>
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  className={WsSecondaryButtonClass()}
                  onClick={() => {
                    if (window.confirm(`Delete forecast ${row.label}?`)) deleteGreenDesertSalesForecast(row.id);
                  }}
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
        <div className="mt-4 grid gap-3 rounded-xl border border-violet-400/25 bg-violet-500/5 p-4 md:grid-cols-2">
          <label className="text-xs text-white/55 md:col-span-2">
            Label
            <input value={String(editor.label ?? "")} onChange={(e) => setEditor({ ...editor, label: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55">
            Period start
            <input type="date" value={String(editor.periodStart ?? "")} onChange={(e) => setEditor({ ...editor, periodStart: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55">
            Period end
            <input type="date" value={String(editor.periodEnd ?? "")} onChange={(e) => setEditor({ ...editor, periodEnd: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55">
            Amount ({currency})
            <input value={String(editor.amount ?? "")} onChange={(e) => setEditor({ ...editor, amount: Number(e.target.value) || 0 })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55 md:col-span-2">
            Notes
            <input value={String(editor.notes ?? "")} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} className={inputClass()} />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button type="button" className={WsPrimaryButtonClass()} onClick={saveEditor}>
              Save forecast
            </button>
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditor(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </WsSection>
  );
}

export function GreenDesertSalesReportsPanel() {
  const [snapshot, setSnapshot] = useState(() => getGreenDesertSalesRecordsSnapshot());
  const [editor, setEditor] = useState<Partial<GreenDesertSalesReportEntry> & { id?: string } | null>(null);

  useEffect(() => subscribeGreenDesertSalesRecords(() => setSnapshot(getGreenDesertSalesRecordsSnapshot())), []);

  function saveEditor() {
    if (!editor) return;
    upsertGreenDesertSalesReport({
      id: editor.id,
      title: String(editor.title ?? "").trim(),
      description: String(editor.description ?? "").trim(),
      reportType: String(editor.reportType ?? "Custom").trim(),
      notes: String(editor.notes ?? ""),
    });
    setEditor(null);
  }

  return (
    <WsSection title="Saved reports" subtitle="Create, edit, and delete custom sales reports" className="p-4 sm:p-5">
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          className={WsPrimaryButtonClass()}
          onClick={() => setEditor({ title: "", description: "", reportType: "Custom", notes: "" })}
        >
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Add report
        </button>
      </div>
      {snapshot.reports.length === 0 ? (
        <p className="text-sm text-white/50">No saved reports yet.</p>
      ) : (
        <div className="space-y-2">
          {snapshot.reports.map((row) => (
            <div
              key={row.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-white">{row.title}</p>
                <p className="text-xs text-white/50">
                  {row.reportType} · {row.description || "No description"}
                </p>
              </div>
              <div className="flex gap-1">
                <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditor(row)}>
                  <Pencil className="mr-1 inline h-3 w-3" />
                  Edit
                </button>
                <button
                  type="button"
                  className={WsSecondaryButtonClass()}
                  onClick={() => {
                    if (window.confirm(`Delete report ${row.title}?`)) deleteGreenDesertSalesReport(row.id);
                  }}
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
        <div className="mt-4 grid gap-3 rounded-xl border border-violet-400/25 bg-violet-500/5 p-4 md:grid-cols-2">
          <label className="text-xs text-white/55 md:col-span-2">
            Title
            <input value={String(editor.title ?? "")} onChange={(e) => setEditor({ ...editor, title: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55">
            Report type
            <input value={String(editor.reportType ?? "")} onChange={(e) => setEditor({ ...editor, reportType: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55 md:col-span-2">
            Description
            <input value={String(editor.description ?? "")} onChange={(e) => setEditor({ ...editor, description: e.target.value })} className={inputClass()} />
          </label>
          <label className="text-xs text-white/55 md:col-span-2">
            Notes
            <input value={String(editor.notes ?? "")} onChange={(e) => setEditor({ ...editor, notes: e.target.value })} className={inputClass()} />
          </label>
          <div className="flex gap-2 md:col-span-2">
            <button type="button" className={WsPrimaryButtonClass()} onClick={saveEditor}>
              Save report
            </button>
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditor(null)}>
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </WsSection>
  );
}
