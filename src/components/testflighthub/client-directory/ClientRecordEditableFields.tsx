"use client";

import Link from "next/link";

import type { ClientFinanceSummary } from "@/lib/accounting/client-finance";
import {
  CLIENT_CONTRACT_OPTIONS,
  CLIENT_INDUSTRY_OPTIONS,
  CLIENT_STATUS_OPTIONS,
  canTransitionClientAccountStatus,
  composeLegacyRegion,
  isNewClientDraftId,
  resolveClientLocation,
  type ClientAccountStatus,
  type ManagedClient,
} from "@/lib/client-management-data";
import { isCrmLinkedClientNotes } from "@/lib/crm-lead-client-data";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50";
}

function formatFinanceMoney(amount: number, currency = "EUR") {
  const { withPreferredCurrencySymbol } =
    require("@/lib/accounting/chart-of-accounts") as typeof import("@/lib/accounting/chart-of-accounts");
  const code = String(currency || "EUR").toUpperCase();
  return withPreferredCurrencySymbol(
    new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
    }).format(amount),
    code,
  );
}

export type ClientRecordEditableFieldsProps = {
  client: ManagedClient;
  busy: boolean;
  companyNameError?: string | null;
  recordCountryOptions: readonly string[];
  selectedCityOptions: readonly string[];
  onPatch: (patch: Partial<ManagedClient>) => void;
  /** Finance block for saved clients in Client Directory (omit for inline opportunity create). */
  financeSection?: {
    basePath: string;
    financeSummary: ClientFinanceSummary | null;
    financeLoading: boolean;
    financeError: string | null;
    loginUrl: string;
  };
};

export function ClientRecordEditableFields({
  client,
  busy,
  companyNameError,
  recordCountryOptions,
  selectedCityOptions,
  onPatch,
  financeSection,
}: ClientRecordEditableFieldsProps) {
  const selectedLocation = resolveClientLocation(client);

  function patchLocation(next: { country?: string; city?: string }) {
    const country = next.country !== undefined ? next.country : selectedLocation.country;
    const city = next.city !== undefined ? next.city : selectedLocation.city;
    onPatch({
      companyCountry: country,
      companyCity: city,
      region: composeLegacyRegion(country, city),
    });
  }

  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <FieldLabel>Company Name</FieldLabel>
        <input
          className={inputClassName()}
          value={client.companyName}
          onChange={(event) => onPatch({ companyName: event.target.value })}
          disabled={busy}
          aria-invalid={companyNameError ? true : undefined}
        />
        {companyNameError ? <p className="mt-1.5 text-xs text-red-300">{companyNameError}</p> : null}
      </div>
      <div>
        <FieldLabel>Industry</FieldLabel>
        <select
          className={inputClassName()}
          value={client.industry}
          onChange={(event) => onPatch({ industry: event.target.value as ManagedClient["industry"] })}
          disabled={busy}
        >
          {CLIENT_INDUSTRY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Country</FieldLabel>
        <select
          className={inputClassName()}
          value={selectedLocation.country}
          onChange={(event) => patchLocation({ country: event.target.value, city: "" })}
          disabled={busy}
        >
          <option value="">Select country</option>
          {Array.from(
            new Set([...recordCountryOptions, ...(selectedLocation.country ? [selectedLocation.country] : [])]),
          ).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>City</FieldLabel>
        <input
          className={inputClassName()}
          list="client-record-city-suggestions"
          value={selectedLocation.city}
          onChange={(event) => patchLocation({ city: event.target.value })}
          disabled={busy || !selectedLocation.country}
          placeholder="City"
        />
        <datalist id="client-record-city-suggestions">
          {selectedCityOptions.map((option) => (
            <option key={option} value={option} />
          ))}
        </datalist>
      </div>
      <div>
        <FieldLabel>Primary Contact</FieldLabel>
        <input
          className={inputClassName()}
          value={client.primaryContact}
          onChange={(event) => onPatch({ primaryContact: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Primary Contact First Name</FieldLabel>
        <input
          className={inputClassName()}
          value={client.primaryContactFirstName ?? ""}
          onChange={(event) => onPatch({ primaryContactFirstName: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Primary Contact Surname</FieldLabel>
        <input
          className={inputClassName()}
          value={client.primaryContactSurname ?? ""}
          onChange={(event) => onPatch({ primaryContactSurname: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Email</FieldLabel>
        <input
          type="email"
          className={inputClassName()}
          value={client.email}
          onChange={(event) => onPatch({ email: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Phone</FieldLabel>
        <input
          className={inputClassName()}
          value={client.phone}
          onChange={(event) => onPatch({ phone: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Role</FieldLabel>
        <input
          className={inputClassName()}
          value={client.jobTitle ?? ""}
          onChange={(event) => onPatch({ jobTitle: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Account Status</FieldLabel>
        <select
          className={inputClassName()}
          value={client.accountStatus}
          onChange={(event) =>
            onPatch({ accountStatus: event.target.value as ManagedClient["accountStatus"] })
          }
          disabled={busy || client.accountStatus === "Archived"}
        >
          {CLIENT_STATUS_OPTIONS.filter(
            (option) =>
              option === client.accountStatus ||
              canTransitionClientAccountStatus(client.accountStatus as ClientAccountStatus, option),
          ).map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        {client.crmLeadId || isCrmLinkedClientNotes(client.notes) ? (
          <p className="mt-1 text-[11px] text-white/45">
            CRM lineage linked — Directory owns lifecycle (Prospect remains in CRM).
          </p>
        ) : null}
        {client.accountStatus === "Archived" ? (
          <p className="mt-1 text-[11px] text-white/45">
            Archived is terminal and cannot transition to another status.
          </p>
        ) : null}
      </div>
      <div>
        <FieldLabel>Contract Type</FieldLabel>
        <select
          className={inputClassName()}
          value={client.contractType}
          onChange={(event) =>
            onPatch({ contractType: event.target.value as ManagedClient["contractType"] })
          }
          disabled={busy}
        >
          {CLIENT_CONTRACT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div>
        <FieldLabel>Tax / VAT ID</FieldLabel>
        <input
          className={inputClassName()}
          value={client.taxId}
          onChange={(event) => onPatch({ taxId: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Projects</FieldLabel>
        <input
          type="number"
          min={0}
          className={inputClassName()}
          value={client.activeProjects}
          readOnly
          disabled
          title="Derived from linked projects — not edited here"
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Company Address</FieldLabel>
        <textarea
          rows={3}
          className={inputClassName()}
          value={client.companyAddress ?? ""}
          onChange={(event) => onPatch({ companyAddress: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Company Postcode</FieldLabel>
        <input
          className={inputClassName()}
          value={client.companyPostcode ?? ""}
          onChange={(event) => onPatch({ companyPostcode: event.target.value })}
          disabled={busy}
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Accounts Payable Email</FieldLabel>
        <input
          type="email"
          className={inputClassName()}
          value={client.accountsPayableEmail ?? client.invoiceEmail ?? ""}
          onChange={(event) =>
            onPatch({
              accountsPayableEmail: event.target.value,
              invoiceEmail: event.target.value,
            })
          }
          disabled={busy}
        />
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Billing Address</FieldLabel>
        <input
          className={inputClassName()}
          value={client.billingAddress}
          onChange={(event) => onPatch({ billingAddress: event.target.value })}
          disabled={busy}
        />
      </div>
      <div>
        <FieldLabel>Subscription Status</FieldLabel>
        <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>{client.subscriptionStatus ?? "—"}</p>
      </div>
      <div>
        <FieldLabel>Billing Frequency</FieldLabel>
        <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>{client.billingFrequency ?? "—"}</p>
      </div>
      <div className="sm:col-span-2">
        <FieldLabel>Renewal Date</FieldLabel>
        <p className={cn(inputClassName(), "mt-1.5 text-white/75")}>{client.renewalDate ?? "—"}</p>
      </div>
      {financeSection && !isNewClientDraftId(client.id) ? (
        <div className="sm:col-span-2 rounded-xl border border-white/10 bg-[#0b1524]/60 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">Finance</p>
            {financeSection.financeLoading ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Loading…
              </span>
            ) : null}
          </div>
          {financeSection.financeError ? (
            <div className="mt-3 space-y-1 text-xs text-red-300">
              <p>{financeSection.financeError}</p>
              {/unauthorized|authentication required/i.test(financeSection.financeError) ? (
                <p className="text-red-200/80">
                  <a
                    href={financeSection.loginUrl}
                    className="font-semibold underline underline-offset-2 hover:text-white"
                  >
                    Sign in again
                  </a>{" "}
                  to load invoices and payments.
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Outstanding Balance</p>
              <p className="mt-1 font-mono text-sm text-white/90">
                {formatFinanceMoney(financeSection.financeSummary?.outstandingBalance ?? 0)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-[0.12em] text-white/40">Financial Summary</p>
              <p className="mt-1 text-sm text-white/75">
                {financeSection.financeSummary?.invoices.length ?? 0} invoices ·{" "}
                {financeSection.financeSummary?.payments.length ?? 0} payments ·{" "}
                {financeSection.financeSummary?.invoices.filter(
                  (invoice) => invoice.status === "issued" || invoice.status === "overdue",
                ).length ?? 0}{" "}
                open
              </p>
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">Invoices</p>
              {(financeSection.financeSummary?.invoices.length ?? 0) === 0 ? (
                <p className="mt-2 text-xs text-white/40">No invoices</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {financeSection.financeSummary!.invoices.map((invoice) => (
                    <li
                      key={invoice.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-xs"
                    >
                      <div>
                        <Link
                          href={`${financeSection.basePath}?view=accounts-receivable`}
                          className="font-medium text-sky-300 hover:text-sky-200"
                        >
                          {invoice.invoiceNumber}
                        </Link>
                        <span className="ml-2 text-white/45">{invoice.status}</span>
                      </div>
                      <span className="font-mono text-white/80">
                        {formatFinanceMoney(invoice.amount, invoice.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">Payments</p>
              {(financeSection.financeSummary?.payments.length ?? 0) === 0 ? (
                <p className="mt-2 text-xs text-white/40">No payments</p>
              ) : (
                <ul className="mt-2 space-y-1.5">
                  {financeSection.financeSummary!.payments.map((payment) => (
                    <li
                      key={payment.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-white/10 px-2.5 py-2 text-xs"
                    >
                      <div>
                        <span className="font-medium text-white/85">{payment.invoiceNumber}</span>
                        <span className="ml-2 text-white/45">{payment.paidAt.slice(0, 10)}</span>
                      </div>
                      <span className="font-mono text-emerald-300/90">
                        {formatFinanceMoney(payment.amount, payment.currency)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <FieldLabel>Notes</FieldLabel>
        <textarea
          rows={3}
          className={cn(inputClassName(), "resize-y")}
          value={client.notes}
          onChange={(event) => onPatch({ notes: event.target.value })}
          disabled={busy}
        />
      </div>
    </div>
  );
}
