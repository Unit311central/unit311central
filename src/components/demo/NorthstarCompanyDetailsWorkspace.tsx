"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  buildDefaultNorthstarCompanyInformation,
  loadNorthstarCompanyInformation,
  saveNorthstarCompanyInformation,
  type NorthstarCompanyInformation,
  type NorthstarDepartmentEmail,
} from "@/lib/demo/northstar-company-information";
import {
  CorporateSection,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { cn } from "@/lib/utils";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
      {children}
    </span>
  );
}

export default function NorthstarCompanyDetailsWorkspace() {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NorthstarCompanyInformation>(() =>
    buildDefaultNorthstarCompanyInformation(),
  );

  useEffect(() => {
    setDraft(loadNorthstarCompanyInformation());
  }, []);

  const update = useCallback(
    <K extends keyof NorthstarCompanyInformation>(key: K, value: NorthstarCompanyInformation[K]) => {
      setDraft((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  function save() {
    saveNorthstarCompanyInformation(draft);
    setEditing(false);
  }

  function cancel() {
    setDraft(loadNorthstarCompanyInformation());
    setEditing(false);
  }

  function updateDepartment(id: string, patch: Partial<NorthstarDepartmentEmail>) {
    setDraft((current) => ({
      ...current,
      departmentEmails: current.departmentEmails.map((row) =>
        row.id === id ? { ...row, ...patch } : row,
      ),
    }));
  }

  function addDepartment() {
    setDraft((current) => ({
      ...current,
      departmentEmails: [
        ...current.departmentEmails,
        { id: `de-${Date.now()}`, label: "", email: "", notes: "" },
      ],
    }));
  }

  function removeDepartment(id: string) {
    setDraft((current) => ({
      ...current,
      departmentEmails: current.departmentEmails.filter((row) => row.id !== id),
    }));
  }

  const inputProps = (value: string, onChange: (v: string) => void, multiline?: boolean) => {
    if (!editing) {
      return (
        <p className={cn("mt-1.5 text-sm text-white/85", multiline && "whitespace-pre-wrap")}>
          {value.trim() || "—"}
        </p>
      );
    }
    if (multiline) {
      return (
        <textarea
          className={cn(corporateInputClass(), "mt-1.5 min-h-[88px] w-full")}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    }
    return (
      <input
        className={cn(corporateInputClass(), "mt-1.5 w-full")}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-white">Company Information</h1>
          <p className="mt-1 text-sm text-white/60">
            HQ registration, identifiers, and internal department contacts for Northstar.
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button type="button" className={corporateSecondaryButtonClass()} onClick={cancel}>
                <X className="mr-1 inline h-4 w-4" />
                Cancel
              </button>
              <button type="button" className={corporatePrimaryButtonClass()} onClick={save}>
                <Save className="mr-1 inline h-4 w-4" />
                Save
              </button>
            </>
          ) : (
            <button type="button" className={corporatePrimaryButtonClass()} onClick={() => setEditing(true)}>
              <Pencil className="mr-1 inline h-4 w-4" />
              Edit
            </button>
          )}
        </div>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <CorporateSection title="Legal entity" subtitle="Registered company identifiers.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Legal name</FieldLabel>
              {inputProps(draft.legalName, (v) => update("legalName", v))}
            </div>
            <div>
              <FieldLabel>Trading name</FieldLabel>
              {inputProps(draft.tradingName, (v) => update("tradingName", v))}
            </div>
            <div>
              <FieldLabel>Company registration number</FieldLabel>
              {inputProps(draft.companyNumber, (v) => update("companyNumber", v))}
            </div>
            <div>
              <FieldLabel>VAT number</FieldLabel>
              {inputProps(draft.vatNumber, (v) => update("vatNumber", v))}
            </div>
            <div>
              <FieldLabel>DUNS number</FieldLabel>
              {inputProps(draft.dunsNumber, (v) => update("dunsNumber", v))}
            </div>
            <div>
              <FieldLabel>Date of incorporation</FieldLabel>
              {editing ? (
                <input
                  type="date"
                  className={cn(corporateInputClass(), "mt-1.5 w-full")}
                  value={draft.dateOfIncorporation}
                  onChange={(e) => update("dateOfIncorporation", e.target.value)}
                />
              ) : (
                <p className="mt-1.5 text-sm text-white/85">{draft.dateOfIncorporation || "—"}</p>
              )}
            </div>
            <div>
              <FieldLabel>Country of registration</FieldLabel>
              {inputProps(draft.countryOfRegistration, (v) => update("countryOfRegistration", v))}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>SIC / industry classification</FieldLabel>
              {inputProps(draft.sicClassification, (v) => update("sicClassification", v))}
            </div>
          </div>
        </CorporateSection>

        <CorporateSection title="Registered addresses" subtitle="HQ and principal place of business.">
          <div className="space-y-4">
            <div>
              <FieldLabel>HQ registered office address</FieldLabel>
              {inputProps(draft.registeredOfficeAddress, (v) => update("registeredOfficeAddress", v), true)}
            </div>
            <div>
              <FieldLabel>Principal business address</FieldLabel>
              {inputProps(draft.principalBusinessAddress, (v) => update("principalBusinessAddress", v), true)}
            </div>
          </div>
        </CorporateSection>

        <CorporateSection title="Public contact" subtitle="Website and main switchboard.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>Website</FieldLabel>
              {editing ? (
                inputProps(draft.website, (v) => update("website", v))
              ) : draft.website ? (
                <a
                  href={draft.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-1.5 inline-block text-sm text-sky-300 hover:text-sky-200"
                >
                  {draft.website}
                </a>
              ) : (
                <p className="mt-1.5 text-sm text-white/85">—</p>
              )}
            </div>
            <div>
              <FieldLabel>Primary email</FieldLabel>
              {inputProps(draft.primaryEmail, (v) => update("primaryEmail", v))}
            </div>
            <div>
              <FieldLabel>Primary telephone</FieldLabel>
              {inputProps(draft.primaryTelephone, (v) => update("primaryTelephone", v))}
            </div>
          </div>
        </CorporateSection>

        <CorporateSection title="Company description" subtitle="Internal reference summary.">
          {inputProps(draft.companyDescription, (v) => update("companyDescription", v), true)}
        </CorporateSection>
      </div>

      <CorporateSection
        title="Department email contacts"
        subtitle="Shared inboxes for support, finance, HR, logistics, and other teams."
        actions={
          editing ? (
            <button type="button" className={corporateSecondaryButtonClass()} onClick={addDepartment}>
              <Plus className="mr-1 inline h-4 w-4" />
              Add contact
            </button>
          ) : null
        }
      >
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/[0.03]">
              <tr>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Team / function
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Email
                </th>
                <th className="px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                  Notes
                </th>
                {editing ? <th className="px-3 py-2" /> : null}
              </tr>
            </thead>
            <tbody>
              {draft.departmentEmails.map((row) => (
                <tr key={row.id} className="border-b border-white/5 last:border-0">
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <input
                        className={corporateInputClass()}
                        value={row.label}
                        onChange={(e) => updateDepartment(row.id, { label: e.target.value })}
                        placeholder="e.g. Finance"
                      />
                    ) : (
                      <span className="font-medium text-white">{row.label || "—"}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {editing ? (
                      <input
                        className={corporateInputClass()}
                        value={row.email}
                        onChange={(e) => updateDepartment(row.id, { email: e.target.value })}
                        placeholder="team@northstar.demo"
                      />
                    ) : (
                      <a href={`mailto:${row.email}`} className="text-sky-300 hover:text-sky-200">
                        {row.email || "—"}
                      </a>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-white/60">
                    {editing ? (
                      <input
                        className={corporateInputClass()}
                        value={row.notes ?? ""}
                        onChange={(e) => updateDepartment(row.id, { notes: e.target.value })}
                      />
                    ) : (
                      row.notes || "—"
                    )}
                  </td>
                  {editing ? (
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        className="rounded-lg border border-white/10 p-2 text-white/60 hover:text-rose-300"
                        onClick={() => removeDepartment(row.id)}
                        aria-label="Remove contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>
    </div>
  );
}
