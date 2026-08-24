"use client";

import { useEffect, useMemo, useState } from "react";
import { History, Loader2, Pencil, Save, X } from "lucide-react";

import {
  COMPANY_STATUSES,
  companyDetailsFieldsEqual,
  createBlankCompanyDetailsFields,
  sanitizeCompanyDetailsFields,
  validateCompanyDetailsFields,
  type CompanyDetails,
  type CompanyDetailsFields,
  type CompanyDetailsValidationErrors,
  type CompanyStatus,
} from "@/lib/company-details-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
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

function FieldLabel({
  children,
  htmlFor,
  required,
}: {
  children: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
    >
      {children}
      {required ? <span className="ml-1 text-rose-300">*</span> : null}
    </label>
  );
}

function inputClassName(hasError?: boolean) {
  return cn(
    "mt-1.5 w-full rounded-xl border bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50 disabled:cursor-not-allowed disabled:opacity-70",
    hasError ? "border-rose-400/50" : "border-white/10",
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm leading-relaxed text-white/60">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function DisplayValue({ value, multiline }: { value: string; multiline?: boolean }) {
  if (!value.trim()) {
    return <p className="mt-1.5 text-sm text-white/40">Not set</p>;
  }
  return (
    <p
      className={cn(
        "mt-1.5 text-sm text-white/90",
        multiline && "whitespace-pre-wrap leading-relaxed",
      )}
    >
      {value}
    </p>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-rose-300">{message}</p>;
}

function toFields(details: CompanyDetails | null): CompanyDetailsFields {
  if (!details) return createBlankCompanyDetailsFields();
  return {
    legalCompanyName: details.legalCompanyName,
    tradingName: details.tradingName,
    companyNumber: details.companyNumber,
    vatTaxNumber: details.vatTaxNumber,
    registeredOfficeAddress: details.registeredOfficeAddress,
    principalBusinessAddress: details.principalBusinessAddress,
    countryOfRegistration: details.countryOfRegistration,
    dateOfIncorporation: details.dateOfIncorporation,
    companyStatus: details.companyStatus,
    sicIndustryClassification: details.sicIndustryClassification,
    website: details.website,
    primaryEmail: details.primaryEmail,
    primaryTelephone: details.primaryTelephone,
    generalCompanyDescription: details.generalCompanyDescription,
  };
}

type CompanyEntityCardProps = {
  company: CompanyDetails | null;
  isNew?: boolean;
  defaultEditing?: boolean;
  onSaved: (company: CompanyDetails) => void;
  onCancelNew?: () => void;
  onArchived?: (companyId: string) => void;
};

export default function CompanyEntityCard({
  company,
  isNew = false,
  defaultEditing = false,
  onSaved,
  onCancelNew,
  onArchived,
}: CompanyEntityCardProps) {
  const [isOnwardAir, setIsOnwardAir] = useState(false);
  const [draft, setDraft] = useState<CompanyDetailsFields>(() => toFields(company));
  const [savedSnapshot, setSavedSnapshot] = useState<CompanyDetailsFields>(() => toFields(company));
  const [mode, setMode] = useState<"view" | "edit">(defaultEditing || isNew ? "edit" : "view");
  const [saving, setSaving] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CompanyDetailsValidationErrors>({});
  const [showHistory, setShowHistory] = useState(false);
  const [record, setRecord] = useState<CompanyDetails | null>(company);

  useEffect(() => {
    setIsOnwardAir(isBrowserOnwardAirSurface());
  }, []);

  useEffect(() => {
    const fields = toFields(company);
    setRecord(company);
    setDraft(fields);
    setSavedSnapshot(fields);
    if (!isNew) {
      setMode("view");
    }
  }, [company, isNew]);

  const isDirty = useMemo(
    () => !companyDetailsFieldsEqual(draft, savedSnapshot),
    [draft, savedSnapshot],
  );

  const editing = mode === "edit";
  const displayName = draft.legalCompanyName.trim() || "New company";
  const countryLabel = draft.countryOfRegistration.trim();

  function updateField<K extends keyof CompanyDetailsFields>(
    key: K,
    value: CompanyDetailsFields[K],
  ) {
    setDraft((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setSaveMessage(null);
  }

  function startEditing() {
    setMode("edit");
    setError(null);
    setSaveMessage(null);
    setFieldErrors({});
  }

  function cancelEditing() {
    if (isNew) {
      onCancelNew?.();
      return;
    }
    setDraft(savedSnapshot);
    setFieldErrors({});
    setError(null);
    setSaveMessage(null);
    setMode("view");
  }

  async function handleSave() {
    const validation = validateCompanyDetailsFields(draft);
    setFieldErrors(validation);
    if (Object.keys(validation).length > 0) {
      setError("Fix the highlighted fields before saving.");
      return;
    }

    const optimistic = sanitizeCompanyDetailsFields(draft);
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const url = isNew || !record ? "/api/company-details" : `/api/company-details/${record.id}`;
      const method = isNew || !record ? "POST" : "PUT";
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(optimistic),
      });
      const payload = await readApiJson<{ details: CompanyDetails; error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error || `Save failed (${response.status})`);
      }
      const saved = payload.details;
      const fields = toFields(saved);
      setRecord(saved);
      setDraft(fields);
      setSavedSnapshot(fields);
      setMode("view");
      setSaveMessage(isNew ? "Company added." : "Company saved.");
      onSaved(saved);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save company.");
      setMode("edit");
    } finally {
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (!record || isNew) return;
    if (
      !window.confirm(
        `Archive ${record.legalCompanyName || "this company"}? Historical records are kept; the company will be hidden from this list.`,
      )
    ) {
      return;
    }
    setArchiving(true);
    setError(null);
    try {
      const response = await fetch(`/api/company-details/${record.id}`, { method: "DELETE" });
      const payload = await readApiJson<{ details: CompanyDetails; error?: string }>(response);
      if (!response.ok) {
        throw new Error(payload.error || `Archive failed (${response.status})`);
      }
      onArchived?.(record.id);
    } catch (archiveError) {
      setError(
        archiveError instanceof Error ? archiveError.message : "Failed to archive company.",
      );
    } finally {
      setArchiving(false);
    }
  }

  return (
    <article className="flex h-full flex-col space-y-4 rounded-2xl border border-white/12 bg-white/[0.02] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">{displayName}</h2>
          {countryLabel ? (
            <p className="mt-1 text-sm text-white/55">{countryLabel}</p>
          ) : null}
          {draft.tradingName.trim() && draft.tradingName.trim() !== draft.legalCompanyName.trim() ? (
            <p className="mt-1 text-xs text-white/45">Trading as {draft.tradingName.trim()}</p>
          ) : null}
          {!editing && draft.companyStatus ? (
            <p className="mt-2 inline-flex rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
              {draft.companyStatus}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {editing ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={cancelEditing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.08] disabled:opacity-50"
              >
                <X className="h-4 w-4" aria-hidden />
                Cancel
              </button>
              <button
                type="button"
                disabled={saving || (!isNew && !isDirty)}
                onClick={() => void handleSave()}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
                Save
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowHistory((value) => !value)}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-4 text-sm font-semibold text-white/85 transition-colors hover:bg-white/[0.08]"
              >
                <History className="h-4 w-4" aria-hidden />
                History
              </button>
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex min-h-10 items-center gap-1.5 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 text-sm font-semibold text-sky-100 transition-colors hover:bg-sky-500/25"
              >
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </button>
            </>
          )}
        </div>
      </div>

      {showHistory ? (
        <div className="rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-4">
          <h3 className="text-sm font-semibold text-white">Record history</h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">Created</dt>
              <dd className="mt-1 text-sm text-white/80">
                {record?.createdAt
                  ? new Date(record.createdAt).toLocaleString()
                  : "Not recorded yet"}
              </dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-[0.12em] text-white/45">
                Last updated
              </dt>
              <dd className="mt-1 text-sm text-white/80">
                {record?.updatedAt
                  ? new Date(record.updatedAt).toLocaleString()
                  : "Not recorded yet"}
              </dd>
            </div>
          </dl>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </p>
      ) : null}
      {saveMessage ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {saveMessage}
        </p>
      ) : null}

      <div className="grid flex-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Legal identity" description="Core registration details for the legal entity.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`legalCompanyName-${record?.id ?? "new"}`} required>
                Legal Company Name
              </FieldLabel>
              {editing ? (
                <input
                  id={`legalCompanyName-${record?.id ?? "new"}`}
                  value={draft.legalCompanyName}
                  onChange={(event) => updateField("legalCompanyName", event.target.value)}
                  className={inputClassName(Boolean(fieldErrors.legalCompanyName))}
                  disabled={saving}
                  autoComplete="organization"
                />
              ) : (
                <DisplayValue value={draft.legalCompanyName} />
              )}
              <FieldError message={fieldErrors.legalCompanyName} />
            </div>
            <div>
              <FieldLabel htmlFor={`tradingName-${record?.id ?? "new"}`}>Trading Name</FieldLabel>
              {editing ? (
                <input
                  id={`tradingName-${record?.id ?? "new"}`}
                  value={draft.tradingName}
                  onChange={(event) => updateField("tradingName", event.target.value)}
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.tradingName} />
              )}
            </div>
            <div>
              <FieldLabel htmlFor={`companyNumber-${record?.id ?? "new"}`}>Company Number</FieldLabel>
              {editing ? (
                <input
                  id={`companyNumber-${record?.id ?? "new"}`}
                  value={draft.companyNumber}
                  onChange={(event) => updateField("companyNumber", event.target.value)}
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.companyNumber} />
              )}
            </div>
            <div>
              <FieldLabel htmlFor={`vatTaxNumber-${record?.id ?? "new"}`}>VAT / Tax Number</FieldLabel>
              {editing ? (
                <input
                  id={`vatTaxNumber-${record?.id ?? "new"}`}
                  value={draft.vatTaxNumber}
                  onChange={(event) => updateField("vatTaxNumber", event.target.value)}
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.vatTaxNumber} />
              )}
            </div>
            <div>
              <FieldLabel htmlFor={`companyStatus-${record?.id ?? "new"}`}>Company Status</FieldLabel>
              {editing ? (
                <select
                  id={`companyStatus-${record?.id ?? "new"}`}
                  value={draft.companyStatus}
                  onChange={(event) =>
                    updateField("companyStatus", event.target.value as CompanyStatus)
                  }
                  className={inputClassName(Boolean(fieldErrors.companyStatus))}
                  disabled={saving}
                >
                  {COMPANY_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              ) : (
                <DisplayValue value={draft.companyStatus} />
              )}
              <FieldError message={fieldErrors.companyStatus} />
            </div>
            <div>
              <FieldLabel htmlFor={`dateOfIncorporation-${record?.id ?? "new"}`}>
                Date of Incorporation
              </FieldLabel>
              {editing ? (
                <input
                  id={`dateOfIncorporation-${record?.id ?? "new"}`}
                  type="date"
                  value={draft.dateOfIncorporation}
                  onChange={(event) => updateField("dateOfIncorporation", event.target.value)}
                  className={inputClassName(Boolean(fieldErrors.dateOfIncorporation))}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.dateOfIncorporation} />
              )}
              <FieldError message={fieldErrors.dateOfIncorporation} />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`countryOfRegistration-${record?.id ?? "new"}`}>
                Country of Registration
              </FieldLabel>
              {editing ? (
                <input
                  id={`countryOfRegistration-${record?.id ?? "new"}`}
                  value={draft.countryOfRegistration}
                  onChange={(event) => updateField("countryOfRegistration", event.target.value)}
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.countryOfRegistration} />
              )}
            </div>
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`sicIndustryClassification-${record?.id ?? "new"}`}>
                SIC / Industry Classification
              </FieldLabel>
              {editing ? (
                <input
                  id={`sicIndustryClassification-${record?.id ?? "new"}`}
                  value={draft.sicIndustryClassification}
                  onChange={(event) =>
                    updateField("sicIndustryClassification", event.target.value)
                  }
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.sicIndustryClassification} />
              )}
            </div>
            {isOnwardAir ? (
              <div className="sm:col-span-2">
                <FieldLabel htmlFor={`generalCompanyDescription-${record?.id ?? "new"}`}>
                  Company description
                </FieldLabel>
                {editing ? (
                  <textarea
                    id={`generalCompanyDescription-${record?.id ?? "new"}`}
                    rows={5}
                    value={draft.generalCompanyDescription}
                    onChange={(event) =>
                      updateField("generalCompanyDescription", event.target.value)
                    }
                    className={inputClassName()}
                    disabled={saving}
                  />
                ) : (
                  <DisplayValue value={draft.generalCompanyDescription} multiline />
                )}
              </div>
            ) : null}
          </div>
        </SectionCard>

        <SectionCard
          title="Addresses"
          description="Registered office and principal place of business."
        >
          <div className="grid gap-4">
            <div>
              <FieldLabel htmlFor={`registeredOfficeAddress-${record?.id ?? "new"}`}>
                Registered Office Address
              </FieldLabel>
              {editing ? (
                <textarea
                  id={`registeredOfficeAddress-${record?.id ?? "new"}`}
                  rows={4}
                  value={draft.registeredOfficeAddress}
                  onChange={(event) =>
                    updateField("registeredOfficeAddress", event.target.value)
                  }
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.registeredOfficeAddress} multiline />
              )}
            </div>
            <div>
              <FieldLabel htmlFor={`principalBusinessAddress-${record?.id ?? "new"}`}>
                Principal Business Address
              </FieldLabel>
              {editing ? (
                <textarea
                  id={`principalBusinessAddress-${record?.id ?? "new"}`}
                  rows={4}
                  value={draft.principalBusinessAddress}
                  onChange={(event) =>
                    updateField("principalBusinessAddress", event.target.value)
                  }
                  className={inputClassName()}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.principalBusinessAddress} multiline />
              )}
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Contact" description="Primary public and operational contact points.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel htmlFor={`website-${record?.id ?? "new"}`}>Website</FieldLabel>
              {editing ? (
                <input
                  id={`website-${record?.id ?? "new"}`}
                  value={draft.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  className={inputClassName(Boolean(fieldErrors.website))}
                  disabled={saving}
                  placeholder="https://example.com"
                />
              ) : draft.website.trim() ? (
                <a
                  href={draft.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 inline-block text-sm text-sky-200 underline-offset-2 hover:underline"
                >
                  {draft.website}
                </a>
              ) : (
                <DisplayValue value="" />
              )}
              <FieldError message={fieldErrors.website} />
            </div>
            <div>
              <FieldLabel htmlFor={`primaryEmail-${record?.id ?? "new"}`}>Primary Email</FieldLabel>
              {editing ? (
                <input
                  id={`primaryEmail-${record?.id ?? "new"}`}
                  type="email"
                  value={draft.primaryEmail}
                  onChange={(event) => updateField("primaryEmail", event.target.value)}
                  className={inputClassName(Boolean(fieldErrors.primaryEmail))}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.primaryEmail} />
              )}
              <FieldError message={fieldErrors.primaryEmail} />
            </div>
            <div>
              <FieldLabel htmlFor={`primaryTelephone-${record?.id ?? "new"}`}>
                Primary Telephone
              </FieldLabel>
              {editing ? (
                <input
                  id={`primaryTelephone-${record?.id ?? "new"}`}
                  value={draft.primaryTelephone}
                  onChange={(event) => updateField("primaryTelephone", event.target.value)}
                  className={inputClassName(Boolean(fieldErrors.primaryTelephone))}
                  disabled={saving}
                />
              ) : (
                <DisplayValue value={draft.primaryTelephone} />
              )}
              <FieldError message={fieldErrors.primaryTelephone} />
            </div>
          </div>
        </SectionCard>

        {!isOnwardAir ? (
          <SectionCard
            title="Company description"
            description="Short overview of the organisation for internal reference."
          >
            <FieldLabel htmlFor={`generalCompanyDescription-alt-${record?.id ?? "new"}`}>
              General Company Description
            </FieldLabel>
            {editing ? (
              <textarea
                id={`generalCompanyDescription-alt-${record?.id ?? "new"}`}
                rows={8}
                value={draft.generalCompanyDescription}
                onChange={(event) =>
                  updateField("generalCompanyDescription", event.target.value)
                }
                className={inputClassName()}
                disabled={saving}
              />
            ) : (
              <DisplayValue value={draft.generalCompanyDescription} multiline />
            )}
          </SectionCard>
        ) : null}
      </div>

      {!isNew && !editing && record && companiesCanArchive(record) ? (
        <div className="border-t border-white/10 pt-4">
          <button
            type="button"
            disabled={archiving}
            onClick={() => void handleArchive()}
            className="text-sm font-medium text-rose-300/90 underline-offset-2 hover:text-rose-200 hover:underline disabled:opacity-50"
          >
            {archiving ? "Archiving…" : "Archive company"}
          </button>
        </div>
      ) : null}
    </article>
  );
}

function companiesCanArchive(_company: CompanyDetails) {
  return true;
}
