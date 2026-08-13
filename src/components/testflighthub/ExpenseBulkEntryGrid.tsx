"use client";

import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { Copy, Loader2, Plus, Save, Trash2, Upload } from "lucide-react";

import {
  createBlankBulkExpenseRow,
  duplicateBulkExpenseRow,
  expenseToBulkRow,
  syncBillingCodeFromCategory,
  syncCategoryFromBillingCode,
  validateBulkExpenseRows,
  type BulkExpenseRowInput,
  type BulkExpenseSaveMode,
} from "@/lib/expenses-bulk-entry";
import {
  EXPENSE_BILLING_CATEGORY_OPTIONS,
  EXPENSE_CURRENCY_OPTIONS,
  EXPENSE_SEMANTIC_CATEGORIES,
  type ExpenseCurrency,
  type FinancialExpense,
} from "@/lib/expenses-data";
import { saveFileToFolderPath } from "@/lib/pdf-file-storage";
import { cn } from "@/lib/utils";

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

function createRowId() {
  return `row-${Math.random().toString(36).slice(2, 10)}`;
}

type GridRow = BulkExpenseRowInput & {
  localId: string;
  attachmentFile?: File | null;
  attachmentName?: string | null;
};

function toGridRow(row: BulkExpenseRowInput, localId?: string): GridRow {
  return {
    ...row,
    localId: localId ?? createRowId(),
    attachmentFile: null,
    attachmentName: row.attachmentPath ? "Attached" : null,
  };
}

function reindexRows(rows: GridRow[]): GridRow[] {
  return rows.map((row, index) => ({ ...row, rowIndex: index }));
}

function cellInputClass() {
  return "w-full min-w-0 rounded-lg border border-white/10 bg-[#0b1524] px-2 py-1.5 text-xs text-white outline-none transition-colors focus:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-60";
}

function sanitizeAmountInput(value: string) {
  return value.replace(/[^\d.]/g, "");
}

export type ExpenseBulkEntryGridHandle = {
  loadRows: (rows: BulkExpenseRowInput[]) => void;
};

type ExpenseBulkEntryGridProps = {
  busy?: boolean;
  draftExpenses?: FinancialExpense[];
  onSaved: (expenses: FinancialExpense[], message: string) => void;
  onError: (message: string) => void;
};

const ExpenseBulkEntryGrid = forwardRef<ExpenseBulkEntryGridHandle, ExpenseBulkEntryGridProps>(
  function ExpenseBulkEntryGrid(
    { busy: parentBusy = false, draftExpenses = [], onSaved, onError },
    ref,
  ) {
    const [rows, setRows] = useState<GridRow[]>(() => [
      toGridRow({ ...createBlankBulkExpenseRow(), rowIndex: 0 }),
    ]);
    const [saving, setSaving] = useState(false);
    const [rowErrors, setRowErrors] = useState<Map<number, string[]>>(new Map());
    const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const patchRow = useCallback((localId: string, patch: Partial<GridRow>) => {
      setRows((current) =>
        current.map((row) => (row.localId === localId ? { ...row, ...patch } : row)),
      );
    }, []);

    const loadRows = useCallback((inputRows: BulkExpenseRowInput[]) => {
      const loaded = inputRows.map((row, index) => toGridRow({ ...row, rowIndex: index }));
      setRows(loaded.length > 0 ? loaded : [toGridRow({ ...createBlankBulkExpenseRow(), rowIndex: 0 })]);
      setRowErrors(new Map());
    }, []);

    useImperativeHandle(ref, () => ({ loadRows }), [loadRows]);

    const addRow = useCallback(() => {
      setRows((current) => [
        ...reindexRows(current),
        toGridRow({ ...createBlankBulkExpenseRow(), rowIndex: current.length }),
      ]);
    }, []);

    const copyRowBelow = useCallback((localId: string) => {
      setRows((current) => {
        const index = current.findIndex((row) => row.localId === localId);
        if (index < 0) return current;
        const copied = toGridRow(duplicateBulkExpenseRow(current[index], index + 1));
        const next = [...current];
        next.splice(index + 1, 0, copied);
        return reindexRows(next);
      });
    }, []);

    const deleteRow = useCallback((localId: string) => {
      setRows((current) => {
        if (current.length <= 1) {
          return [toGridRow({ ...createBlankBulkExpenseRow(), rowIndex: 0 })];
        }
        return reindexRows(current.filter((row) => row.localId !== localId));
      });
    }, []);

    const loadDrafts = useCallback(() => {
      if (draftExpenses.length === 0) return;
      loadRows(draftExpenses.map((expense, index) => expenseToBulkRow(expense, index)));
    }, [draftExpenses, loadRows]);

    async function uploadAttachment(file: File): Promise<string> {
      const upload = await saveFileToFolderPath({
        blob: file,
        filename: file.name,
        folderSegments: ["Financials", "Expense Invoices"],
        mimeType: file.type || "application/octet-stream",
      });
      if (!upload.ok) {
        throw new Error(upload.error ?? "Failed to upload invoice.");
      }
      return upload.fileObjectId ?? file.name;
    }

    async function saveBatch(mode: BulkExpenseSaveMode) {
      setSaving(true);
      setRowErrors(new Map());

      try {
        const rowsWithAttachments = await Promise.all(
          rows.map(async (row) => {
            if (!row.attachmentFile) return row;
            const attachmentPath = await uploadAttachment(row.attachmentFile);
            return { ...row, attachmentPath, attachmentName: row.attachmentFile.name };
          }),
        );

        const payloadRows: BulkExpenseRowInput[] = reindexRows(rowsWithAttachments).map((row) => ({
          rowIndex: row.rowIndex,
          expenseId: row.expenseId,
          billingCategoryCode: row.billingCategoryCode,
          category: row.category,
          purpose: row.purpose,
          vendor: row.vendor,
          invoiceNumber: row.invoiceNumber,
          datePaid: row.datePaid,
          amount: row.amount,
          currency: row.currency,
          attachmentPath: row.attachmentPath ?? null,
        }));

        const validationErrors = validateBulkExpenseRows(payloadRows, mode);
        if (validationErrors.length > 0) {
          const nextErrors = new Map<number, string[]>();
          for (const entry of validationErrors) {
            nextErrors.set(entry.rowIndex, entry.errors);
          }
          setRowErrors(nextErrors);
          onError("Fix the highlighted rows before saving.");
          return;
        }

        const response = await fetch("/api/financials/expenses/bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, rows: payloadRows }),
        });

        const data = await readApiJson<{
          saved?: FinancialExpense[];
          rowErrors?: { rowIndex: number; errors: string[] }[];
          error?: string;
        }>(response);

        if (data.rowErrors && data.rowErrors.length > 0) {
          const nextErrors = new Map<number, string[]>();
          for (const entry of data.rowErrors) {
            nextErrors.set(entry.rowIndex, entry.errors);
          }
          setRowErrors(nextErrors);
        }

        if (!response.ok && (!data.saved || data.saved.length === 0)) {
          throw new Error(data.error ?? "Failed to save expense batch.");
        }

        const saved = data.saved ?? [];
        if (saved.length > 0) {
          if (mode === "finalized") {
            setRows([toGridRow({ ...createBlankBulkExpenseRow(), rowIndex: 0 })]);
          } else {
            setRows((current) =>
              reindexRows(
                current.map((row, index) => {
                  const savedRow = saved.find((entry) => entry.id === row.expenseId) ?? saved[index];
                  if (!savedRow) return row;
                  return {
                    ...row,
                    expenseId: savedRow.id,
                    attachmentPath: savedRow.attachmentPath,
                  };
                }),
              ),
            );
          }
          onSaved(
            saved,
            mode === "draft"
              ? `${saved.length} draft${saved.length === 1 ? "" : "s"} saved`
              : `${saved.length} expense${saved.length === 1 ? "" : "s"} submitted`,
          );
        }

        if (data.rowErrors && data.rowErrors.length > 0) {
          onError("Some rows could not be saved. See highlighted rows.");
        }
      } catch (error) {
        onError(error instanceof Error ? error.message : "Failed to save expense batch.");
      } finally {
        setSaving(false);
      }
    }

    const disabled = parentBusy || saving;

    return (
      <section className="rounded-2xl border border-white/15 bg-white/[0.04] p-4 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
              Reimbursable expense entry
            </p>
            <h3 className="mt-1 text-sm font-semibold text-white">Bulk entry grid</h3>
            <p className="mt-1 text-xs text-white/45">
              All rows are personally paid and reimbursable on submit. Invoice # and upload are
              optional.
            </p>
          </div>
          {draftExpenses.length > 0 && (
            <button
              type="button"
              disabled={disabled}
              onClick={loadDrafts}
              className="inline-flex h-9 items-center rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-300/50 disabled:opacity-50"
            >
              Load {draftExpenses.length} draft{draftExpenses.length === 1 ? "" : "s"}
            </button>
          )}
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-[9px] font-medium uppercase tracking-[0.12em] text-white/35">
                <th className="px-2 py-2 font-medium">Billing code</th>
                <th className="px-2 py-2 font-medium">Category</th>
                <th className="px-2 py-2 font-medium">Purpose</th>
                <th className="px-2 py-2 font-medium">Vendor</th>
                <th className="px-2 py-2 font-medium">Date paid</th>
                <th className="px-2 py-2 font-medium">Invoice #</th>
                <th className="px-2 py-2 font-medium">Amount</th>
                <th className="px-2 py-2 font-medium">Currency</th>
                <th className="px-2 py-2 font-medium">Invoice</th>
                <th className="px-2 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const errors = rowErrors.get(row.rowIndex) ?? [];
                return (
                  <tr
                    key={row.localId}
                    className={cn(
                      "border-b border-white/[0.05] last:border-0",
                      errors.length > 0 && "bg-red-500/5",
                    )}
                  >
                    <td className="px-2 py-1.5">
                      <select
                        className={cellInputClass()}
                        value={row.billingCategoryCode}
                        disabled={disabled}
                        onChange={(event) => {
                          patchRow(row.localId, syncCategoryFromBillingCode({
                            ...row,
                            billingCategoryCode: event.target.value,
                          }));
                        }}
                      >
                        {EXPENSE_BILLING_CATEGORY_OPTIONS.map((option) => (
                          <option key={option.code} value={option.code}>
                            {option.code} · {option.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={cellInputClass()}
                        value={row.category}
                        disabled={disabled}
                        onChange={(event) => {
                          patchRow(row.localId, syncBillingCodeFromCategory({
                            ...row,
                            category: event.target.value,
                          }));
                        }}
                      >
                        {EXPENSE_SEMANTIC_CATEGORIES.map((option) => (
                          <option key={option.label} value={option.label}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInputClass()}
                        value={row.purpose}
                        disabled={disabled}
                        placeholder="Business purpose"
                        onChange={(event) => patchRow(row.localId, { purpose: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInputClass()}
                        value={row.vendor}
                        disabled={disabled}
                        placeholder="Vendor"
                        onChange={(event) => patchRow(row.localId, { vendor: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        type="date"
                        className={cellInputClass()}
                        value={row.datePaid}
                        disabled={disabled}
                        onChange={(event) => patchRow(row.localId, { datePaid: event.target.value })}
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        className={cellInputClass()}
                        value={row.invoiceNumber ?? ""}
                        disabled={disabled}
                        placeholder="Optional"
                        onChange={(event) =>
                          patchRow(row.localId, { invoiceNumber: event.target.value })
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <input
                        inputMode="decimal"
                        className={cellInputClass()}
                        value={String(row.amount ?? "")}
                        disabled={disabled}
                        placeholder="0.00"
                        onChange={(event) =>
                          patchRow(row.localId, { amount: sanitizeAmountInput(event.target.value) })
                        }
                      />
                    </td>
                    <td className="px-2 py-1.5">
                      <select
                        className={cellInputClass()}
                        value={row.currency}
                        disabled={disabled}
                        onChange={(event) =>
                          patchRow(row.localId, { currency: event.target.value as ExpenseCurrency })
                        }
                      >
                        {EXPENSE_CURRENCY_OPTIONS.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          ref={(element) => {
                            fileInputRefs.current[row.localId] = element;
                          }}
                          type="file"
                          className="hidden"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.heic"
                          disabled={disabled}
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (!file) return;
                            patchRow(row.localId, {
                              attachmentFile: file,
                              attachmentName: file.name,
                              attachmentPath: null,
                            });
                          }}
                        />
                        <button
                          type="button"
                          disabled={disabled}
                          onClick={() => fileInputRefs.current[row.localId]?.click()}
                          className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-2 text-[10px] text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                        >
                          <Upload className="h-3 w-3" />
                          Upload
                        </button>
                        {(row.attachmentName || row.attachmentPath) && (
                          <span className="max-w-[5rem] truncate text-[10px] text-emerald-300/90">
                            {row.attachmentName ?? "Attached"}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-1.5">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={disabled}
                          title="Copy row below"
                          onClick={() => copyRowBelow(row.localId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-white/70 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={disabled}
                          title="Delete row"
                          onClick={() => deleteRow(row.localId)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-400/20 text-red-300 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {rowErrors.size > 0 && (
          <div className="mt-3 space-y-1 rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {[...rowErrors.entries()].map(([rowIndex, errors]) => (
              <p key={rowIndex}>
                Row {rowIndex + 1}: {errors.join(" ")}
              </p>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={addRow}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-xs text-white/75 transition-colors hover:border-white/20 hover:text-white disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Row
          </button>
          <div className="flex-1" />
          <button
            type="button"
            disabled={disabled}
            onClick={() => void saveBatch("draft")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 text-xs font-semibold text-amber-200 transition-colors hover:border-amber-300/50 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save as Draft
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => void saveBatch("finalized")}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3 text-xs font-semibold text-emerald-200 transition-colors hover:border-emerald-400/60 hover:bg-emerald-500/25 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Submit Expenses
          </button>
        </div>
      </section>
    );
  },
);

export default ExpenseBulkEntryGrid;
