"use client";

import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2, ExternalLink } from "lucide-react";

import {
  buildNorthstarCapTableSnapshot,
  NORTHSTAR_AUTHORISED_SHARES,
  NORTHSTAR_NOMINAL_PER_SHARE_GBP,
  type NorthstarCapTableRow,
  type NorthstarOptionGrant,
} from "@/lib/demo/northstar-cap-table-data";
import {
  DEMO_COMPANY_LEGAL_NAME,
  DEMO_COMPANY_FOUNDER,
} from "@/lib/demo/demo-company-identity";
import {
  loadDemoCapTableOptionGrants,
  loadDemoCapTableShareholders,
  saveDemoCapTableOptionGrants,
  saveDemoCapTableShareholders,
} from "@/lib/demo/demo-cap-table-store";
import { DEMO_REPORTING_CURRENCY } from "@/lib/demo/read-only";
import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { cn } from "@/lib/utils";

import { formatReportingMoney } from "@/lib/financial-reporting-currency";

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return formatReportingMoney(value, DEMO_REPORTING_CURRENCY);
}

function formatShares(value: number) {
  return value.toLocaleString("en-GB");
}

function thClass() {
  return "px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45";
}

function tdClass() {
  return "px-3 py-2.5 text-sm text-white/75";
}

type ShareholderForm = NorthstarCapTableRow;

type OptionForm = NorthstarOptionGrant;

type CapTableTab = "overview" | "shareholders" | "options" | "capital";

const CAP_TABLE_TABS: { id: CapTableTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "shareholders", label: "Shareholders" },
  { id: "options", label: "Option pool" },
  { id: "capital", label: "Share capital" },
];

export default function NorthstarCapTableWorkspace() {
  const seed = useMemo(() => buildNorthstarCapTableSnapshot(), []);
  const [tab, setTab] = useState<CapTableTab>("overview");
  const [shareholders, setShareholders] = useState<NorthstarCapTableRow[]>(() =>
    loadDemoCapTableShareholders(),
  );
  const [optionGrants, setOptionGrants] = useState<NorthstarOptionGrant[]>(() =>
    loadDemoCapTableOptionGrants(),
  );
  const [shareholderForm, setShareholderForm] = useState<ShareholderForm | null>(null);
  const [optionForm, setOptionForm] = useState<OptionForm | null>(null);

  useEffect(() => {
    saveDemoCapTableShareholders(shareholders);
  }, [shareholders]);

  useEffect(() => {
    saveDemoCapTableOptionGrants(optionGrants);
  }, [optionGrants]);

  const totalShares = shareholders.reduce((sum, row) => sum + row.shares, 0);
  const totalOwnershipPct = shareholders.reduce((sum, row) => sum + row.ownershipPct, 0);
  const totalOptions = optionGrants.reduce((sum, row) => sum + row.options, 0);
  const paul = shareholders.find((row) => row.id === "cap-paul" || /paul/i.test(row.holder));

  function saveShareholder() {
    if (!shareholderForm?.holder.trim()) return;
    setShareholders((current) => {
      const exists = current.some((row) => row.id === shareholderForm.id);
      if (exists) return current.map((row) => (row.id === shareholderForm.id ? shareholderForm : row));
      return [shareholderForm, ...current];
    });
    setShareholderForm(null);
  }

  function saveOption() {
    if (!optionForm?.employee.trim()) return;
    setOptionGrants((current) => {
      const exists = current.some((row) => row.id === optionForm.id);
      if (exists) return current.map((row) => (row.id === optionForm.id ? optionForm : row));
      return [optionForm, ...current];
    });
    setOptionForm(null);
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-white">Cap Table Management</h1>
        <p className="mt-1 text-sm text-white/60">
          {DEMO_COMPANY_LEGAL_NAME} — fully diluted ownership, option pool, and share capital (
          {DEMO_REPORTING_CURRENCY}).
        </p>
      </header>

      <nav
        aria-label="Cap table sections"
        className="flex flex-wrap gap-1.5 overflow-x-auto border-b border-white/10 pb-3"
      >
        {CAP_TABLE_TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              "shrink-0 rounded-xl border px-3 py-2 text-xs font-semibold transition-colors",
              tab === item.id
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.03] text-white/60 hover:bg-white/[0.06] hover:text-white/80",
            )}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === "overview" ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <CorporateKpiTile
              label="Founder ownership"
              value={paul ? `${paul.ownershipPct}%` : "60%"}
              hint={`${DEMO_COMPANY_FOUNDER} · ordinary equity`}
            />
            <CorporateKpiTile
              label="Employee option pool"
              value="7%"
              hint={`${formatShares(seed.optionPool.issuedShares)} issued · ${formatShares(seed.optionPool.reservedShares)} reserved`}
            />
            <CorporateKpiTile
              label="Total ownership"
              value={`${totalOwnershipPct.toFixed(1).replace(/\.0$/, "")}%`}
              hint={`${formatShares(totalShares)} shares on register`}
            />
            <CorporateKpiTile
              label="Issued share capital"
              value={seed.capital.issuedShareCapitalGbp}
              hint={`Authorised ${seed.capital.authorisedShareCapitalGbp}`}
            />
          </section>
          <CorporateSection
            title="Register summary"
            subtitle="High-level ownership split — open Shareholders or Option pool tabs to edit entries."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  Shareholders
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{shareholders.length}</p>
                <p className="text-sm text-white/50">{formatShares(totalShares)} shares issued</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                  Option grants
                </p>
                <p className="mt-2 text-2xl font-semibold text-white">{optionGrants.length}</p>
                <p className="text-sm text-white/50">{formatShares(totalOptions)} options issued</p>
              </div>
            </div>
          </CorporateSection>
        </>
      ) : null}

      {tab === "shareholders" ? (
      <CorporateSection
        title="Shareholders"
        subtitle="Ordinary equity and unallocated option pool reserve."
        actions={
          <button
            type="button"
            className={corporatePrimaryButtonClass()}
            onClick={() =>
              setShareholderForm({
                id: `cap-${Date.now()}`,
                holder: "",
                role: "",
                shareClass: "Ordinary shares",
                shareType: "Equity",
                shares: 0,
                ownershipPct: 0,
                investmentGbp: null,
                pricePerShareGbp: null,
                issueDate: new Date().toISOString().slice(0, 10),
                notes: "",
              })
            }
          >
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add holder
          </button>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Holder</th>
                <th className={thClass()}>Role</th>
                <th className={thClass()}>Share class</th>
                <th className={thClass()}>Type</th>
                <th className={thClass()}>Shares</th>
                <th className={thClass()}>Ownership</th>
                <th className={thClass()}>Investment</th>
                <th className={thClass()}>SHA</th>
                <th className={thClass()} />
              </tr>
            </thead>
            <tbody>
              {shareholders.map((row) => (
                <tr key={row.id} className="border-b border-white/5">
                  <td className={cn(tdClass(), "font-medium text-white")}>{row.holder}</td>
                  <td className={tdClass()}>{row.role}</td>
                  <td className={tdClass()}>{row.shareClass}</td>
                  <td className={tdClass()}>{row.shareType}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatShares(row.shares)}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{row.ownershipPct}%</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatMoney(row.investmentGbp)}</td>
                  <td className={tdClass()}>
                    {row.shareholderAgreementUrl ? (
                      <a
                        href={row.shareholderAgreementUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 rounded-md border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[11px] text-sky-300 hover:text-sky-200"
                      >
                        SHA
                        <ExternalLink className="h-3 w-3 opacity-60" />
                      </a>
                    ) : (
                      <span className="text-white/35">—</span>
                    )}
                  </td>
                  <td className={tdClass()}>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                        onClick={() => setShareholderForm(row)}
                        aria-label={`Edit ${row.holder}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-rose-200"
                        onClick={() =>
                          setShareholders((current) => current.filter((item) => item.id !== row.id))
                        }
                        aria-label={`Delete ${row.holder}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-white/10 bg-white/[0.03]">
              <tr>
                <td colSpan={4} className={cn(tdClass(), "font-semibold text-white")}>
                  Total
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {formatShares(totalShares)}
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {totalOwnershipPct.toFixed(1).replace(/\.0$/, "")}%
                </td>
                <td colSpan={3} className={tdClass()} />
              </tr>
            </tfoot>
          </table>
        </div>
      </CorporateSection>
      ) : null}

      {tab === "options" ? (
      <CorporateSection
        title="Employee option grants"
        subtitle="Five team members with 10,000 options each (within 7% ESOP)."
        actions={
          <button
            type="button"
            className={corporateSecondaryButtonClass()}
            onClick={() =>
              setOptionForm({
                id: `opt-${Date.now()}`,
                employee: "",
                role: "",
                options: 10_000,
                grantDate: new Date().toISOString().slice(0, 10),
                vesting: "4 yr · 1 yr cliff",
                status: "Active",
              })
            }
          >
            <Plus className="mr-1.5 inline h-4 w-4" />
            Add grant
          </button>
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className={thClass()}>Employee</th>
                <th className={thClass()}>Role</th>
                <th className={thClass()}>Options</th>
                <th className={thClass()}>Grant date</th>
                <th className={thClass()}>Vesting</th>
                <th className={thClass()}>Status</th>
                <th className={thClass()} />
              </tr>
            </thead>
            <tbody>
              {optionGrants.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className={cn(tdClass(), "font-medium text-white")}>{row.employee}</td>
                  <td className={tdClass()}>{row.role}</td>
                  <td className={cn(tdClass(), "tabular-nums")}>{formatShares(row.options)}</td>
                  <td className={tdClass()}>{row.grantDate}</td>
                  <td className={tdClass()}>{row.vesting}</td>
                  <td className={tdClass()}>
                    <CorporateStatusPill>{row.status}</CorporateStatusPill>
                  </td>
                  <td className={tdClass()}>
                    <button
                      type="button"
                      className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-white"
                      onClick={() => setOptionForm(row)}
                      aria-label={`Edit ${row.employee}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-white/10 bg-white/[0.03]">
              <tr>
                <td colSpan={2} className={cn(tdClass(), "font-semibold text-white")}>
                  Total options issued
                </td>
                <td className={cn(tdClass(), "tabular-nums font-semibold text-white")}>
                  {formatShares(totalOptions)}
                </td>
                <td colSpan={4} className={tdClass()} />
              </tr>
            </tfoot>
          </table>
        </div>
      </CorporateSection>
      ) : null}

      {tab === "capital" ? (
        <CorporateSection
          title="Share capital"
          subtitle="Authorised and issued share capital for the Demo workspace."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <CorporateKpiTile
              label="Authorised shares"
              value={formatShares(NORTHSTAR_AUTHORISED_SHARES)}
              hint="Ordinary £0.001 nominal"
            />
            <CorporateKpiTile
              label="Nominal per share"
              value={formatMoney(NORTHSTAR_NOMINAL_PER_SHARE_GBP)}
              hint="GBP nominal value"
            />
            <CorporateKpiTile
              label="Issued share capital"
              value={seed.capital.issuedShareCapitalGbp}
              hint="On register"
            />
            <CorporateKpiTile
              label="Authorised share capital"
              value={seed.capital.authorisedShareCapitalGbp}
              hint="Companies House filing"
            />
          </div>
        </CorporateSection>
      ) : null}

      {shareholderForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">
              {shareholders.some((r) => r.id === shareholderForm.id) ? "Edit holder" : "Add holder"}
            </h3>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["holder", "Holder name"],
                  ["role", "Role"],
                  ["shares", "Shares (number)"],
                  ["ownershipPct", "Ownership %"],
                  ["issueDate", "Issue date"],
                  ["notes", "Notes"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="block text-sm text-white/60">
                  {label}
                  <input
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={
                      field === "shares" || field === "ownershipPct"
                        ? String(shareholderForm[field])
                        : shareholderForm[field]
                    }
                    onChange={(e) =>
                      setShareholderForm({
                        ...shareholderForm,
                        [field]:
                          field === "shares" || field === "ownershipPct"
                            ? Number(e.target.value) || 0
                            : e.target.value,
                      })
                    }
                  />
                </label>
              ))}
              <label className="block text-sm text-white/60">
                Share class
                <select
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={shareholderForm.shareClass}
                  onChange={(e) =>
                    setShareholderForm({
                      ...shareholderForm,
                      shareClass: e.target.value as ShareholderForm["shareClass"],
                    })
                  }
                >
                  <option>Ordinary shares</option>
                  <option>Preference shares</option>
                  <option>Options</option>
                </select>
              </label>
              <label className="block text-sm text-white/60">
                Share type
                <select
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={shareholderForm.shareType}
                  onChange={(e) =>
                    setShareholderForm({
                      ...shareholderForm,
                      shareType: e.target.value as ShareholderForm["shareType"],
                    })
                  }
                >
                  <option>Equity</option>
                  <option>Options</option>
                </select>
              </label>
              <label className="block text-sm text-white/60">
                Investment ({DEMO_REPORTING_CURRENCY})
                <input
                  className={cn(corporateInputClass(), "mt-1 w-full")}
                  value={shareholderForm.investmentGbp ?? ""}
                  onChange={(e) =>
                    setShareholderForm({
                      ...shareholderForm,
                      investmentGbp: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setShareholderForm(null)}>
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={saveShareholder}>
                Save
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {optionForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0b1524] p-5">
            <h3 className="text-lg font-semibold text-white">Option grant</h3>
            <div className="mt-4 space-y-3">
              {(
                [
                  ["employee", "Employee"],
                  ["role", "Role"],
                  ["options", "Options"],
                  ["grantDate", "Grant date"],
                  ["vesting", "Vesting"],
                ] as const
              ).map(([field, label]) => (
                <label key={field} className="block text-sm text-white/60">
                  {label}
                  <input
                    className={cn(corporateInputClass(), "mt-1 w-full")}
                    value={field === "options" ? String(optionForm[field]) : optionForm[field]}
                    onChange={(e) =>
                      setOptionForm({
                        ...optionForm,
                        [field]: field === "options" ? Number(e.target.value) || 0 : e.target.value,
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <div className="mt-5 flex justify-between gap-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => {
                  setOptionGrants((current) => current.filter((row) => row.id !== optionForm.id));
                  setOptionForm(null);
                }}
              >
                <Trash2 className="mr-1 inline h-4 w-4" />
                Delete
              </button>
              <div className="flex gap-2">
                <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setOptionForm(null)}>
                  Cancel
                </button>
                <button type="button" className={corporatePrimaryButtonClass()} onClick={saveOption}>
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
