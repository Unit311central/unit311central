"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import type { EmployeePaymentDetails } from "@/lib/expense-management/types";

import { expenseInputClassName, FieldLabel, readApiJson } from "./expenses/expense-hub-shared";

type EmployeePaymentDetailsPanelProps = {
  employeeId: string;
};

export default function EmployeePaymentDetailsPanel({
  employeeId,
}: EmployeePaymentDetailsPanelProps) {
  const [details, setDetails] = useState<EmployeePaymentDetails | null>(null);
  const [countryCode, setCountryCode] = useState("GB");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAddress, setBankAddress] = useState("");
  const [sortCode, setSortCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [iban, setIban] = useState("");
  const [swiftBic, setSwiftBic] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/payment-details`, {
        cache: "no-store",
      });
      const data = await readApiJson<{ paymentDetails?: EmployeePaymentDetails | null; error?: string }>(
        response,
      );
      if (!response.ok) throw new Error(data.error ?? "Failed to load payment details");
      const row = data.paymentDetails ?? null;
      setDetails(row);
      if (row) {
        setCountryCode(row.countryCode);
        setAccountHolderName(row.accountHolderName);
        setBankName(row.bankName);
        setBankAddress(row.bankAddress);
        setSortCode(row.sortCode ?? "");
        setAccountNumber(row.accountNumber ?? "");
        setRoutingNumber(row.routingNumber ?? "");
        setIban(row.iban ?? "");
        setSwiftBic(row.swiftBic ?? "");
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load payment details");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function save() {
    setBusy(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch(`/api/hr/employees/${employeeId}/payment-details`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode,
          accountHolderName,
          bankName,
          bankAddress,
          sortCode: sortCode || null,
          accountNumber: accountNumber || null,
          routingNumber: routingNumber || null,
          iban: iban || null,
          swiftBic: swiftBic || null,
        }),
      });
      const data = await readApiJson<{ error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Save failed");
      setMessage("Payment details saved.");
      await load();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/50">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading payment details…
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div>
        <h4 className="text-sm font-semibold text-white">Payment / bank details</h4>
        <p className="mt-1 text-xs text-white/45">
          Used for expense reimbursements. Sensitive fields are restricted to authorised finance users.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <FieldLabel>Bank country</FieldLabel>
          <select
            className={expenseInputClassName()}
            value={countryCode}
            onChange={(event) => setCountryCode(event.target.value)}
          >
            <option value="GB">United Kingdom</option>
            <option value="US">United States</option>
            <option value="INT">International</option>
          </select>
        </div>
        <div>
          <FieldLabel>Account holder name</FieldLabel>
          <input
            className={expenseInputClassName()}
            value={accountHolderName}
            onChange={(event) => setAccountHolderName(event.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Bank name</FieldLabel>
          <input
            className={expenseInputClassName()}
            value={bankName}
            onChange={(event) => setBankName(event.target.value)}
          />
        </div>
        <div>
          <FieldLabel>Bank address</FieldLabel>
          <input
            className={expenseInputClassName()}
            value={bankAddress}
            onChange={(event) => setBankAddress(event.target.value)}
          />
        </div>
        {(countryCode === "GB" || countryCode === "INT") && (
          <>
            <div>
              <FieldLabel>Sort code</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={sortCode}
                onChange={(event) => setSortCode(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Account number</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
              />
            </div>
          </>
        )}
        {countryCode === "US" && (
          <>
            <div>
              <FieldLabel>ACH routing number</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={routingNumber}
                onChange={(event) => setRoutingNumber(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Account number</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={accountNumber}
                onChange={(event) => setAccountNumber(event.target.value)}
              />
            </div>
          </>
        )}
        {(countryCode === "INT" || countryCode === "GB") && (
          <>
            <div>
              <FieldLabel>IBAN</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={iban}
                onChange={(event) => setIban(event.target.value)}
              />
            </div>
            <div>
              <FieldLabel>SWIFT / BIC</FieldLabel>
              <input
                className={expenseInputClassName()}
                value={swiftBic}
                onChange={(event) => setSwiftBic(event.target.value)}
              />
            </div>
          </>
        )}
      </div>

      {message && <p className="text-sm text-emerald-200">{message}</p>}
      {error && <p className="text-sm text-red-200">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={() => void save()}
        className="rounded-xl border border-white/10 px-4 py-2 text-xs text-white/70 hover:text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Save payment details"}
      </button>
      {details && (
        <p className="text-[10px] text-white/35">Last updated for expense reimbursement routing.</p>
      )}
    </div>
  );
}
