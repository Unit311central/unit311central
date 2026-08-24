"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Camera, Loader2, Save, Send } from "lucide-react";

import type { ExpenseCurrency, FinancialExpense } from "@/lib/expenses-data";
import type { HrEmployee } from "@/lib/hr-data";
import type {
  ExpenseBillingCode,
  ExpenseCategory,
  ExpenseMileageRate,
} from "@/lib/expense-management/types";
import { saveFileToFolderPath } from "@/lib/pdf-file-storage";
import { cn } from "@/lib/utils";

import { expenseInputClassName, FieldLabel, readApiJson } from "./expense-hub-shared";

type ExpenseAddFormProps = {
  currency: string;
  employees: HrEmployee[];
  categories: ExpenseCategory[];
  billingCodes: ExpenseBillingCode[];
  mileageRates: ExpenseMileageRate[];
  currentUserId: string;
  currentUserName: string;
  defaultEmployeeId?: string | null;
  editExpense?: FinancialExpense | null;
  onSaved: (expense: FinancialExpense, message: string) => void;
  onCancel?: () => void;
};

type FormState = {
  claimantEmployeeId: string;
  description: string;
  expenseCategoryId: string;
  billingCodeId: string;
  supplier: string;
  expenseDate: string;
  amount: string;
  currency: ExpenseCurrency;
  expenseType: "standard" | "mileage";
  mileageFrom: string;
  mileageTo: string;
  mileageDistance: string;
  mileageDistanceUnit: "miles" | "kilometres";
  mileageRateId: string;
  attachmentPath: string | null;
  attachmentName: string | null;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ExpenseAddForm({
  currency,
  employees,
  categories,
  billingCodes,
  mileageRates,
  currentUserId,
  currentUserName,
  defaultEmployeeId,
  editExpense,
  onSaved,
  onCancel,
}: ExpenseAddFormProps) {
  const activeCategories = categories.filter((row) => row.active);
  const activeBillingCodes = billingCodes.filter((row) => row.active);
  const activeMileageRates = mileageRates.filter((row) => row.active);
  const defaultMileageRate = activeMileageRates[0] ?? mileageRates[0];

  const [form, setForm] = useState<FormState>(() => ({
    claimantEmployeeId:
      editExpense?.claimantEmployeeId ??
      defaultEmployeeId ??
      employees[0]?.id ??
      "",
    description: editExpense?.description ?? "",
    expenseCategoryId: editExpense?.expenseCategoryId ?? activeCategories[0]?.id ?? "",
    billingCodeId: editExpense?.billingCodeId ?? activeBillingCodes[0]?.id ?? "",
    supplier: editExpense?.supplier ?? "",
    expenseDate: editExpense?.expenseDate ?? todayIso(),
    amount: editExpense ? String(editExpense.amount) : "",
    currency: (editExpense?.currency ?? currency) as ExpenseCurrency,
    expenseType: editExpense?.expenseType ?? "standard",
    mileageFrom: editExpense?.mileageFrom ?? "",
    mileageTo: editExpense?.mileageTo ?? "",
    mileageDistance:
      editExpense?.mileageDistance != null ? String(editExpense.mileageDistance) : "",
    mileageDistanceUnit: editExpense?.mileageDistanceUnit ?? defaultMileageRate?.distanceUnit ?? "miles",
    mileageRateId: defaultMileageRate?.id ?? "",
    attachmentPath: editExpense?.attachmentPath ?? null,
    attachmentName: editExpense?.attachmentPath ? "Receipt attached" : null,
  }));
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMileageRate =
    activeMileageRates.find((row) => row.id === form.mileageRateId) ?? defaultMileageRate;

  const mileageCalculated = useMemo(() => {
    if (form.expenseType !== "mileage") return 0;
    const distance = Number(form.mileageDistance) || 0;
    const rate = selectedMileageRate?.ratePerUnit ?? 0;
    return Math.round(distance * rate * 100) / 100;
  }, [form.expenseType, form.mileageDistance, selectedMileageRate]);

  useEffect(() => {
    if (form.expenseType === "mileage" && mileageCalculated > 0) {
      setForm((current) => ({ ...current, amount: String(mileageCalculated) }));
    }
  }, [form.expenseType, mileageCalculated]);

  async function uploadAttachment(file: File): Promise<string> {
    const upload = await saveFileToFolderPath({
      blob: file,
      filename: file.name,
      folderSegments: ["Financials", "Expense Receipts"],
      mimeType: file.type || "application/octet-stream",
    });
    if (!upload.ok) throw new Error(upload.error ?? "Failed to upload receipt.");
    return upload.fileObjectId ?? file.name;
  }

  const buildPayload = useCallback(
  async (submit: boolean) => {
    let attachmentPath = form.attachmentPath;
    if (attachmentFile) {
      attachmentPath = await uploadAttachment(attachmentFile);
    }
    const amount =
      form.expenseType === "mileage"
        ? mileageCalculated
        : Number(form.amount);
    return {
      submitterUserId: currentUserId,
      description: form.description.trim(),
      amount,
      currency: form.currency,
      supplier: form.supplier.trim() || null,
      expenseDate: form.expenseDate,
      dateSubmitted: form.expenseDate,
      attachmentPath,
      recordStatus: submit ? undefined : "draft",
      claimantEmployeeId: form.claimantEmployeeId || null,
      expenseCategoryId: form.expenseCategoryId || null,
      billingCodeId: form.billingCodeId || null,
      expenseType: form.expenseType,
      mileageFrom: form.expenseType === "mileage" ? form.mileageFrom : null,
      mileageTo: form.expenseType === "mileage" ? form.mileageTo : null,
      mileageDistance:
        form.expenseType === "mileage" ? Number(form.mileageDistance) || 0 : null,
      mileageDistanceUnit: form.expenseType === "mileage" ? form.mileageDistanceUnit : null,
      mileageRate: form.expenseType === "mileage" ? selectedMileageRate?.ratePerUnit ?? null : null,
      mileageCalculatedAmount: form.expenseType === "mileage" ? mileageCalculated : null,
      submit,
      skipDuplicateReferenceCheck: true,
    };
  },
  [
    attachmentFile,
    currentUserId,
    selectedMileageRate,
    form,
    mileageCalculated,
  ]);

  async function handleSave(submit: boolean) {
    setBusy(true);
    setError(null);
    try {
      if (!form.description.trim()) throw new Error("Description is required.");
      const payload = await buildPayload(submit);
      const endpoint = editExpense
        ? `/api/financials/expenses/${editExpense.id}`
        : "/api/financials/expenses";
      const method = editExpense ? "PATCH" : "POST";
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          editExpense
            ? {
                description: payload.description,
                amount: payload.amount,
                currency: payload.currency,
                supplier: payload.supplier,
                expenseDate: payload.expenseDate,
                attachmentPath: payload.attachmentPath,
                claimantEmployeeId: payload.claimantEmployeeId,
                expenseCategoryId: payload.expenseCategoryId,
                billingCodeId: payload.billingCodeId,
                expenseType: payload.expenseType,
                mileageFrom: payload.mileageFrom,
                mileageTo: payload.mileageTo,
                mileageDistance: payload.mileageDistance,
                mileageDistanceUnit: payload.mileageDistanceUnit,
                mileageRate: payload.mileageRate,
                mileageCalculatedAmount: payload.mileageCalculatedAmount,
                recordStatus: submit ? "draft" : "draft",
              }
            : payload,
        ),
      });
      const data = await readApiJson<{ expense?: FinancialExpense; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Save failed");

      let saved = data.expense;
      if (submit && saved) {
        const submitResponse = await fetch(`/api/expenses/${saved.id}/submit`, { method: "POST" });
        const submitData = await readApiJson<{ error?: string }>(submitResponse);
        if (!submitResponse.ok) throw new Error(submitData.error ?? "Submit failed");
        const refresh = await fetch("/api/expenses/my", { cache: "no-store" });
        const refreshData = await readApiJson<{ expenses?: FinancialExpense[] }>(refresh);
        saved = refreshData.expenses?.find((row) => row.id === saved?.id) ?? saved;
      }

      if (!saved) throw new Error("Expense was not returned.");
      onSaved(
        saved,
        submit ? "Expense submitted for approval." : "Draft saved.",
      );
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <FieldLabel>Assigned to</FieldLabel>
          <select
            className={expenseInputClassName()}
            value={form.claimantEmployeeId}
            onChange={(event) =>
              setForm((current) => ({ ...current, claimantEmployeeId: event.target.value }))
            }
          >
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-white/35">
            Default claimant: {currentUserName}
          </p>
        </div>
        <div>
          <FieldLabel>Expense type</FieldLabel>
          <select
            className={expenseInputClassName()}
            value={form.expenseType}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                expenseType: event.target.value as "standard" | "mileage",
              }))
            }
          >
            <option value="standard">Standard expense</option>
            <option value="mileage">Mileage / travel</option>
          </select>
        </div>
        <div className="md:col-span-2">
          <FieldLabel>Description</FieldLabel>
          <textarea
            className={cn(expenseInputClassName(), "min-h-[88px] resize-y")}
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            placeholder="Travel from Manchester office to London client meeting"
          />
        </div>
        <div>
          <FieldLabel>Category</FieldLabel>
          <select
            className={expenseInputClassName()}
            value={form.expenseCategoryId}
            onChange={(event) =>
              setForm((current) => ({ ...current, expenseCategoryId: event.target.value }))
            }
          >
            {activeCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Billing code</FieldLabel>
          <select
            className={expenseInputClassName()}
            value={form.billingCodeId}
            onChange={(event) =>
              setForm((current) => ({ ...current, billingCodeId: event.target.value }))
            }
          >
            {activeBillingCodes.map((code) => (
              <option key={code.id} value={code.id}>
                {code.code} — {code.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel>Vendor</FieldLabel>
          <input
            className={expenseInputClassName()}
            value={form.supplier}
            onChange={(event) =>
              setForm((current) => ({ ...current, supplier: event.target.value }))
            }
            placeholder="Optional"
          />
        </div>
        <div>
          <FieldLabel>Date</FieldLabel>
          <input
            type="date"
            className={expenseInputClassName()}
            value={form.expenseDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, expenseDate: event.target.value }))
            }
          />
        </div>
        {form.expenseType === "standard" ? (
          <>
            <div>
              <FieldLabel>Amount</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.01"
                className={expenseInputClassName()}
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>Currency</FieldLabel>
              <select
                className={expenseInputClassName()}
                value={form.currency}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    currency: event.target.value as ExpenseCurrency,
                  }))
                }
              >
                {["GBP", "USD", "EUR", "AUD", "CHF", "HKD"].map((code) => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <>
            <div>
              <FieldLabel>From</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={form.mileageFrom}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mileageFrom: event.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>To</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={form.mileageTo}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mileageTo: event.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>Distance</FieldLabel>
              <input
                type="number"
                min="0"
                step="0.1"
                className={expenseInputClassName()}
                value={form.mileageDistance}
                onChange={(event) =>
                  setForm((current) => ({ ...current, mileageDistance: event.target.value }))
                }
              />
            </div>
            <div>
              <FieldLabel>Mileage rate</FieldLabel>
              <select
                className={expenseInputClassName()}
                value={form.mileageRateId}
                onChange={(event) => {
                  const rate = activeMileageRates.find((row) => row.id === event.target.value);
                  setForm((current) => ({
                    ...current,
                    mileageRateId: event.target.value,
                    mileageDistanceUnit: rate?.distanceUnit ?? current.mileageDistanceUnit,
                  }));
                }}
              >
                {activeMileageRates.map((rate) => (
                  <option key={rate.id} value={rate.id}>
                    {rate.vehicleType} — {rate.ratePerUnit} / {rate.distanceUnit}
                    {rate.countryCode ? ` (${rate.countryCode})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <FieldLabel>Unit</FieldLabel>
              <select
                className={expenseInputClassName()}
                value={form.mileageDistanceUnit}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    mileageDistanceUnit: event.target.value as "miles" | "kilometres",
                  }))
                }
              >
                <option value="miles">Miles</option>
                <option value="kilometres">Kilometres</option>
              </select>
            </div>
            <div className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3 md:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Calculated reimbursement</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {form.currency} {mileageCalculated.toFixed(2)}
              </p>
              {selectedMileageRate && (
                <p className="mt-1 text-[10px] text-white/40">
                  Rate: {selectedMileageRate.ratePerUnit} / {selectedMileageRate.distanceUnit}
                </p>
              )}
            </div>
          </>
        )}
        <div className="md:col-span-2">
          <FieldLabel>Receipt</FieldLabel>
          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <label
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/70 transition-colors hover:border-sky-400/30 hover:text-white"
            >
              <Camera className="h-4 w-4" />
              {attachmentFile?.name ?? form.attachmentName ?? "Upload or take photo"}
              <input
                type="file"
                accept="image/*,application/pdf"
                capture="environment"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) setAttachmentFile(file);
                }}
              />
            </label>
            {(form.attachmentName || attachmentFile) && (
              <span className="text-xs text-white/45">
                {attachmentFile?.name ?? form.attachmentName}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/60 hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSave(false)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-white/[0.1] disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
          Save draft
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void handleSave(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2 text-xs font-medium text-emerald-100 transition-colors hover:bg-emerald-500/25 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Submit expense
        </button>
      </div>
    </div>
  );
}
