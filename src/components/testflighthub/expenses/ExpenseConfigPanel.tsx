"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus } from "lucide-react";

import type {
  ExpenseBillingCode,
  ExpenseCategory,
  ExpenseMileageRate,
  ExpensePaymentSchedule,
} from "@/lib/expense-management/types";
import { scheduleFrequencyLabel } from "@/lib/expense-management/payment-schedule";

import { expenseInputClassName, FieldLabel, readApiJson } from "./expense-hub-shared";

export default function ExpenseConfigPanel() {
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [billingCodes, setBillingCodes] = useState<ExpenseBillingCode[]>([]);
  const [mileageRates, setMileageRates] = useState<ExpenseMileageRate[]>([]);
  const [schedule, setSchedule] = useState<ExpensePaymentSchedule | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newBillingCode, setNewBillingCode] = useState("");
  const [newBillingName, setNewBillingName] = useState("");
  const [newMileageCountry, setNewMileageCountry] = useState("GB");
  const [newMileageVehicle, setNewMileageVehicle] = useState("car");
  const [newMileageRate, setNewMileageRate] = useState("0.45");
  const [newMileageUnit, setNewMileageUnit] = useState<"miles" | "kilometres">("miles");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/expenses/config", { cache: "no-store" });
      const data = await readApiJson<{
        categories?: ExpenseCategory[];
        billingCodes?: ExpenseBillingCode[];
        mileageRates?: ExpenseMileageRate[];
        schedule?: ExpensePaymentSchedule;
        error?: string;
      }>(response);
      if (!response.ok) throw new Error(data.error ?? "Failed to load configuration");
      setCategories(data.categories ?? []);
      setBillingCodes(data.billingCodes ?? []);
      setMileageRates(data.mileageRates ?? []);
      setSchedule(data.schedule ?? null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function postConfig(body: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/expenses/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Update failed");
      await load();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading configuration…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Expense payment schedule</h4>
        <p className="text-xs text-white/45">
          Configure how often expense runs are paid. Fortnightly creates two payment windows per
          month (payment day and payment day + 14).
        </p>
        {schedule && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <FieldLabel>Frequency</FieldLabel>
              <select
                className={expenseInputClassName()}
                value={schedule.frequency}
                onChange={(event) =>
                  setSchedule({
                    ...schedule,
                    frequency: event.target.value as ExpensePaymentSchedule["frequency"],
                  })
                }
              >
                <option value="fortnightly">Every 2 weeks</option>
                <option value="monthly">Monthly</option>
              </select>
              <p className="mt-1 text-[10px] text-white/35">
                {scheduleFrequencyLabel(schedule.frequency)}
              </p>
            </div>
            <div>
              <FieldLabel>Payment day (of month)</FieldLabel>
              <input
                type="number"
                min={1}
                max={31}
                className={expenseInputClassName()}
                value={schedule.paymentDay}
                onChange={(event) =>
                  setSchedule({ ...schedule, paymentDay: Number(event.target.value) })
                }
              />
            </div>
            <div>
              <FieldLabel>Cut-off day (of month)</FieldLabel>
              <input
                type="number"
                min={1}
                max={31}
                className={expenseInputClassName()}
                value={schedule.cutoffDay}
                onChange={(event) =>
                  setSchedule({ ...schedule, cutoffDay: Number(event.target.value) })
                }
              />
            </div>
            <div>
              <FieldLabel>Approval deadline day</FieldLabel>
              <input
                type="number"
                min={1}
                max={31}
                className={expenseInputClassName()}
                value={schedule.approvalDeadlineDay}
                onChange={(event) =>
                  setSchedule({ ...schedule, approvalDeadlineDay: Number(event.target.value) })
                }
              />
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={busy || !schedule}
          onClick={() =>
            void postConfig({
              action: "update_schedule",
              schedule: {
                frequency: schedule?.frequency ?? "monthly",
                cutoffDay: schedule?.cutoffDay,
                approvalDeadlineDay: schedule?.approvalDeadlineDay,
                paymentDay: schedule?.paymentDay,
              },
            })
          }
          className="rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70 hover:text-white"
        >
          Save schedule
        </button>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Mileage rates</h4>
        <ul className="space-y-2">
          {mileageRates.map((rate) => (
            <li
              key={rate.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80"
            >
              <span>
                {rate.countryCode} · {rate.vehicleType}: {rate.ratePerUnit} / {rate.distanceUnit}
                {!rate.active && " (archived)"}
              </span>
              {rate.active && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void postConfig({ action: "archive_mileage_rate", id: rate.id })}
                  className="text-xs text-white/40 hover:text-red-300"
                >
                  Archive
                </button>
              )}
            </li>
          ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className={expenseInputClassName()}
            placeholder="Country (GB, US)"
            value={newMileageCountry}
            onChange={(event) => setNewMileageCountry(event.target.value)}
          />
          <input
            className={expenseInputClassName()}
            placeholder="Vehicle type"
            value={newMileageVehicle}
            onChange={(event) => setNewMileageVehicle(event.target.value)}
          />
          <input
            className={expenseInputClassName()}
            placeholder="Rate per unit"
            value={newMileageRate}
            onChange={(event) => setNewMileageRate(event.target.value)}
          />
          <select
            className={expenseInputClassName()}
            value={newMileageUnit}
            onChange={(event) =>
              setNewMileageUnit(event.target.value as "miles" | "kilometres")
            }
          >
            <option value="miles">Miles</option>
            <option value="kilometres">Kilometres</option>
          </select>
        </div>
        <button
          type="button"
          disabled={busy || !newMileageRate.trim()}
          onClick={() =>
            void postConfig({
              action: "create_mileage_rate",
              mileageRate: {
                countryCode: newMileageCountry.trim(),
                vehicleType: newMileageVehicle.trim(),
                ratePerUnit: Number(newMileageRate),
                distanceUnit: newMileageUnit,
              },
            })
          }
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70"
        >
          <Plus className="h-3.5 w-3.5" />
          Add mileage rate
        </button>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Expense categories</h4>
        <ul className="space-y-2">
          {categories
            .filter((row) => !row.archivedAt)
            .map((category) => (
              <li
                key={category.id}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80"
              >
                <span>{category.name}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void postConfig({ action: "archive_category", id: category.id })
                  }
                  className="text-xs text-white/40 hover:text-red-300"
                >
                  Archive
                </button>
              </li>
            ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <input
            className={expenseInputClassName()}
            placeholder="New category name"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <button
            type="button"
            disabled={busy || !newCategoryName.trim()}
            onClick={() => {
              void postConfig({
                action: "create_category",
                name: newCategoryName.trim(),
                code: newCategoryName.trim().toUpperCase().replace(/\s+/g, "_").slice(0, 24),
              }).then(() => setNewCategoryName(""));
            }}
            className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70"
          >
            <Plus className="h-3.5 w-3.5" />
            Add category
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <h4 className="text-sm font-semibold text-white">Billing codes</h4>
        <ul className="space-y-2">
          {billingCodes
            .filter((row) => !row.archivedAt)
            .map((code) => (
              <li
                key={code.id}
                className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80"
              >
                <span>{code.code} — {code.name}</span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void postConfig({ action: "archive_billing_code", id: code.id })
                  }
                  className="text-xs text-white/40 hover:text-red-300"
                >
                  Archive
                </button>
              </li>
            ))}
        </ul>
        <div className="grid gap-2 sm:grid-cols-2">
          <input
            className={expenseInputClassName()}
            placeholder="Code"
            value={newBillingCode}
            onChange={(event) => setNewBillingCode(event.target.value)}
          />
          <input
            className={expenseInputClassName()}
            placeholder="Name"
            value={newBillingName}
            onChange={(event) => setNewBillingName(event.target.value)}
          />
        </div>
        <button
          type="button"
          disabled={busy || !newBillingCode.trim() || !newBillingName.trim()}
          onClick={() => {
            void postConfig({
              action: "create_billing_code",
              code: newBillingCode.trim(),
              name: newBillingName.trim(),
            }).then(() => {
              setNewBillingCode("");
              setNewBillingName("");
            });
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/70"
        >
          <Plus className="h-3.5 w-3.5" />
          Add billing code
        </button>
      </section>
    </div>
  );
}
