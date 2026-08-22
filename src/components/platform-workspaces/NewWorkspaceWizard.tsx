"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, PlusCircle } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import {
  CLIENT_CSV_TEMPLATE,
  EMPLOYEE_CSV_TEMPLATE,
} from "@/lib/platform-workspaces/csv-import";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  WORKSPACE_MODULE_CATALOGUE,
  defaultEnabledModules,
  defaultEnabledSubModules,
  subModuleKey,
  syncModuleSelection,
} from "@/lib/platform-workspaces/module-catalogue";
import type {
  CreateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceImportClient,
  WorkspaceImportEmployee,
} from "@/lib/platform-workspaces/types";
import { cn } from "@/lib/utils";

const WIZARD_STEPS = [
  "Workspace type",
  "Workspace details",
  "Modules",
  "Users / employees",
  "Clients",
  "Branding / configuration",
  "Review",
  "Create / provision",
] as const;

type WizardState = CreateWorkspaceInput & {
  slugAvailable: boolean | null;
  slugMessage: string | null;
  employeeErrors: Array<{ row: number; message: string }>;
  clientErrors: Array<{ row: number; message: string }>;
};

function initialState(): WizardState {
  const enabledModules = defaultEnabledModules();
  return {
    type: "Customer",
    name: "",
    slug: "",
    companyName: "",
    contactName: "",
    contactEmail: "",
    country: "United Kingdom",
    timezone: "Europe/London",
    currency: "GBP",
    description: "",
    enabledModules,
    enabledSubModules: defaultEnabledSubModules(enabledModules),
    branding: {
      displayName: "",
      logoUrl: null,
      primaryColour: "#0b2d63",
      secondaryColour: "#2563eb",
    },
    employees: [],
    clients: [],
    slugAvailable: null,
    slugMessage: null,
    employeeErrors: [],
    clientErrors: [],
  };
}

async function readJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  return JSON.parse(text) as T;
}

export function NewWorkspaceWizard() {
  const basePath = useInternalOperationsBasePath();
  const overviewHref = getInternalNavHref("workspaces-overview", basePath);
  const [step, setStep] = useState(0);
  const [state, setState] = useState<WizardState>(initialState);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<WorkspaceAdminRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [employeeCsv, setEmployeeCsv] = useState("");
  const [clientCsv, setClientCsv] = useState("");

  const canContinue = useMemo(() => {
    if (step === 0) return state.type === "Customer" || state.type === "Demo";
    if (step === 1) {
      return (
        state.name.trim().length > 0 &&
        state.slug.trim().length > 0 &&
        state.companyName.trim().length > 0 &&
        state.contactName.trim().length > 0 &&
        state.contactEmail.trim().length > 0 &&
        state.slugAvailable === true
      );
    }
    if (step === 2) return state.enabledModules.length > 0;
    if (step === 3) return state.employeeErrors.length === 0;
    if (step === 4) return state.clientErrors.length === 0;
    return true;
  }, [state, step]);

  async function checkSlug(slug: string) {
    const response = await fetch(
      `/api/internal/workspaces/check-slug?slug=${encodeURIComponent(slug)}`,
    );
    const payload = await readJson<{ available: boolean; slug: string }>(response);
    setState((current) => ({
      ...current,
      slugAvailable: payload.available,
      slugMessage: payload.available
        ? "Slug is available."
        : "Slug is already in use or reserved.",
    }));
  }

  async function validateEmployees(csv: string) {
    const response = await fetch("/api/internal/workspaces/validate-employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const payload = await readJson<{
      rows: WorkspaceImportEmployee[];
      errors: Array<{ row: number; message: string }>;
    }>(response);
    setState((current) => ({
      ...current,
      employees: payload.rows,
      employeeErrors: payload.errors,
    }));
  }

  async function validateClients(csv: string) {
    const response = await fetch("/api/internal/workspaces/validate-clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv }),
    });
    const payload = await readJson<{
      rows: WorkspaceImportClient[];
      errors: Array<{ row: number; message: string }>;
    }>(response);
    setState((current) => ({
      ...current,
      clients: payload.rows,
      clientErrors: payload.errors,
    }));
  }

  async function createWorkspace() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/internal/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: state.type,
          name: state.name,
          slug: state.slug,
          companyName: state.companyName,
          contactName: state.contactName,
          contactEmail: state.contactEmail,
          country: state.country,
          timezone: state.timezone,
          currency: state.currency,
          description: state.description,
          enabledModules: state.enabledModules,
          enabledSubModules: state.enabledSubModules,
          branding: {
            ...state.branding,
            displayName: state.branding.displayName || state.name,
          },
          employees: state.employees,
          clients: state.clients,
        } satisfies CreateWorkspaceInput),
      });
      const payload = await readJson<{ workspace?: WorkspaceAdminRecord; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || "Workspace creation failed.");
      setCreated(payload.workspace ?? null);
      setStep(WIZARD_STEPS.length - 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Workspace creation failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex items-start gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
          <PlusCircle className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Internal Central · Workspaces
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">New Workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Configure a customer or demo workspace. Phase 2 creates the workspace record and
            configuration; external infrastructure provisioning connects in a later phase.
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {WIZARD_STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            onClick={() => index < step && setStep(index)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              index === step
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : index < step
                  ? "border-white/15 text-white/65"
                  : "border-white/10 text-white/35",
            )}
          >
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        {step === 0 ? (
          <div className="grid gap-3 md:grid-cols-2">
            {(["Customer", "Demo"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setState((current) => ({ ...current, type }))}
                className={cn(
                  "rounded-xl border p-4 text-left transition",
                  state.type === type
                    ? "border-sky-400/40 bg-sky-500/10"
                    : "border-white/10 hover:bg-white/[0.03]",
                )}
              >
                <p className="text-sm font-semibold text-white">{type} Workspace</p>
                <p className="mt-2 text-sm text-white/50">
                  {type === "Customer"
                    ? "Provision a customer tenant with selected modules and imports."
                    : "Create a demo tenant for sales, training, or showcase environments."}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <WizardField label="Workspace name *" value={state.name} onChange={(value) => setState({ ...state, name: value, branding: { ...state.branding, displayName: value } })} />
            <WizardField
              label="Workspace slug *"
              value={state.slug}
              onChange={(value) =>
                setState({
                  ...state,
                  slug: value.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
                  slugAvailable: null,
                  slugMessage: null,
                })
              }
              onBlur={() => state.slug && void checkSlug(state.slug)}
            />
            {state.slugMessage ? (
              <p className={cn("md:col-span-2 text-sm", state.slugAvailable ? "text-emerald-200" : "text-rose-200")}>
                {state.slugMessage}
              </p>
            ) : null}
            <WizardField label="Company / organisation *" value={state.companyName} onChange={(value) => setState({ ...state, companyName: value })} />
            <WizardField label="Primary contact name *" value={state.contactName} onChange={(value) => setState({ ...state, contactName: value })} />
            <WizardField label="Primary contact email *" value={state.contactEmail} onChange={(value) => setState({ ...state, contactEmail: value })} />
            <WizardField label="Country" value={state.country} onChange={(value) => setState({ ...state, country: value })} />
            <WizardField label="Timezone" value={state.timezone} onChange={(value) => setState({ ...state, timezone: value })} />
            <WizardField label="Currency" value={state.currency} onChange={(value) => setState({ ...state, currency: value })} />
            <div className="md:col-span-2">
              <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                Description
              </label>
              <textarea
                value={state.description}
                onChange={(event) => setState({ ...state, description: event.target.value })}
                className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
              />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="max-h-[520px] space-y-3 overflow-y-auto pr-1">
            {WORKSPACE_MODULE_CATALOGUE.map((module) => {
              const enabled = state.enabledModules.includes(module.id);
              return (
                <div key={module.id} className="rounded-xl border border-white/10 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => {
                        const nextModules = event.target.checked
                          ? [...state.enabledModules, module.id]
                          : state.enabledModules.filter((id) => id !== module.id);
                        const nextSubModules = event.target.checked
                          ? [
                              ...state.enabledSubModules,
                              ...module.subModules
                                .map((sub) => subModuleKey(module.id, sub.id))
                                .filter((key) => !state.enabledSubModules.includes(key)),
                            ]
                          : state.enabledSubModules.filter((key) => !key.startsWith(`${module.id}:`));
                        setState({ ...state, enabledModules: nextModules, enabledSubModules: nextSubModules });
                      }}
                    />
                    {module.number}. {module.label}
                  </label>
                  {enabled ? (
                    <div className="mt-2 space-y-1 pl-6">
                      {module.subModules.map((sub) => {
                        const key = subModuleKey(module.id, sub.id);
                        return (
                          <label key={key} className="flex items-center gap-2 text-xs text-white/65">
                            <input
                              type="checkbox"
                              checked={state.enabledSubModules.includes(key)}
                              onChange={(event) => {
                                const synced = syncModuleSelection(
                                  module.id,
                                  state.enabledModules,
                                  state.enabledSubModules,
                                  sub.id,
                                  event.target.checked,
                                );
                                setState({
                                  ...state,
                                  enabledModules: synced.enabledModules,
                                  enabledSubModules: synced.enabledSubModules,
                                });
                              }}
                            />
                            {sub.label}
                          </label>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : null}

        {step === 3 ? (
          <CsvStep
            title="Employee CSV upload"
            template={EMPLOYEE_CSV_TEMPLATE}
            csv={employeeCsv}
            onCsvChange={setEmployeeCsv}
            onValidate={() => void validateEmployees(employeeCsv)}
            rows={state.employees}
            errors={state.employeeErrors}
            columns={["email", "first_name", "last_name", "role", "department"]}
          />
        ) : null}

        {step === 4 ? (
          <CsvStep
            title="Optional active-client import"
            template={CLIENT_CSV_TEMPLATE}
            csv={clientCsv}
            onCsvChange={setClientCsv}
            onValidate={() => void validateClients(clientCsv)}
            rows={state.clients}
            errors={state.clientErrors}
            columns={["name", "email", "country"]}
          />
        ) : null}

        {step === 5 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <WizardField label="Display name" value={state.branding.displayName} onChange={(value) => setState({ ...state, branding: { ...state.branding, displayName: value } })} />
            <WizardField label="Logo URL" value={state.branding.logoUrl ?? ""} onChange={(value) => setState({ ...state, branding: { ...state.branding, logoUrl: value || null } })} />
            <WizardField label="Primary colour" value={state.branding.primaryColour} onChange={(value) => setState({ ...state, branding: { ...state.branding, primaryColour: value } })} />
            <WizardField label="Secondary colour" value={state.branding.secondaryColour} onChange={(value) => setState({ ...state, branding: { ...state.branding, secondaryColour: value } })} />
            <WizardField label="Primary workspace URL" value={`https://${state.slug || "slug"}.unit311central.com`} onChange={() => undefined} readOnly />
          </div>
        ) : null}

        {step === 6 ? (
          <ReviewSummary state={state} onEdit={setStep} />
        ) : null}

        {step === 7 ? (
          <div className="space-y-4">
            {created ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 p-4">
                <div className="flex items-center gap-2 text-emerald-100">
                  <CheckCircle2 className="h-5 w-5" />
                  <p className="font-medium">Workspace created</p>
                </div>
                <p className="mt-2 text-sm text-emerald-50/85">
                  Workspace ID <span className="font-mono">{created.workspaceId}</span> ·{" "}
                  {created.primaryUrl}
                </p>
                <p className="mt-2 text-sm text-white/65">{created.provisioning.lastMessage}</p>
                <Link href={overviewHref} className="mt-4 inline-flex text-sm text-sky-200 hover:text-sky-100">
                  Open Workspace Overview
                </Link>
              </div>
            ) : (
              <>
                <p className="text-sm text-white/60">
                  This will create the workspace record and persist configuration. Authentication,
                  DNS, and external infrastructure provisioning remain Phase 3.
                </p>
                {error ? <p className="text-sm text-rose-200">{error}</p> : null}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void createWorkspace()}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100"
                >
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create workspace
                </button>
              </>
            )}
          </div>
        ) : null}
      </section>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0 || Boolean(created)}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-white/70 disabled:opacity-40"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        {step < WIZARD_STEPS.length - 2 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep((current) => current + 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 disabled:opacity-40"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : step === WIZARD_STEPS.length - 2 ? (
          <button
            type="button"
            disabled={!canContinue}
            onClick={() => setStep(WIZARD_STEPS.length - 1)}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100"
          >
            Review complete — proceed to create
            <ArrowRight className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function WizardField({
  label,
  value,
  onChange,
  onBlur,
  readOnly,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
        {label}
      </label>
      <input
        value={value}
        readOnly={readOnly}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50 read-only:opacity-70"
      />
    </div>
  );
}

function CsvStep({
  title,
  template,
  csv,
  onCsvChange,
  onValidate,
  rows,
  errors,
  columns,
}: {
  title: string;
  template: string;
  csv: string;
  onCsvChange: (value: string) => void;
  onValidate: () => void;
  rows: Array<Record<string, string | undefined>>;
  errors: Array<{ row: number; message: string }>;
  columns: string[];
}) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-white">{title}</p>
        <p className="mt-1 text-sm text-white/50">
          Download the template, fill rows, paste or upload CSV content, then validate.
        </p>
      </div>
      <pre className="overflow-x-auto rounded-xl border border-white/10 bg-[#0b1524] p-3 text-xs text-white/70">
        {template}
      </pre>
      <textarea
        value={csv}
        onChange={(event) => onCsvChange(event.target.value)}
        placeholder="Paste CSV content here"
        className="min-h-32 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
      />
      <button
        type="button"
        onClick={onValidate}
        className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/75 hover:bg-white/5"
      >
        Validate import
      </button>
      {errors.length > 0 ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm text-rose-100">
          {errors.map((item) => (
            <p key={`${item.row}-${item.message}`}>
              Row {item.row}: {item.message}
            </p>
          ))}
        </div>
      ) : null}
      {rows.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/40">
              <tr>
                {columns.map((column) => (
                  <th key={column} className="px-3 py-2">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 10).map((row, index) => (
                <tr key={index} className="border-b border-white/5">
                  {columns.map((column) => {
                    const camel = column.replace(/_([a-z])/g, (_, char: string) => char.toUpperCase());
                    const value =
                      row[column] ??
                      row[camel] ??
                      (column === "first_name" && "firstName" in row
                        ? row.firstName
                        : column === "last_name" && "lastName" in row
                          ? row.lastName
                          : undefined);
                    return (
                      <td key={column} className="px-3 py-2 text-white/70">
                        {String(value ?? "—")}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 10 ? (
            <p className="px-3 py-2 text-xs text-white/45">Showing first 10 of {rows.length} rows.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function ReviewSummary({
  state,
  onEdit,
}: {
  state: WizardState;
  onEdit: (step: number) => void;
}) {
  return (
    <div className="space-y-4 text-sm text-white/75">
      <ReviewBlock title="Workspace" onEdit={() => onEdit(1)}>
        <p>{state.type} · {state.name} · {state.slug}</p>
        <p>{state.companyName}</p>
        <p>{state.contactName} · {state.contactEmail}</p>
      </ReviewBlock>
      <ReviewBlock title="Modules" onEdit={() => onEdit(2)}>
        <p>{state.enabledModules.length} modules · {state.enabledSubModules.length} sub-modules selected</p>
      </ReviewBlock>
      <ReviewBlock title="Users" onEdit={() => onEdit(3)}>
        <p>{state.employees.length} employee row(s) queued</p>
      </ReviewBlock>
      <ReviewBlock title="Clients" onEdit={() => onEdit(4)}>
        <p>{state.clients.length} client row(s) queued</p>
      </ReviewBlock>
      <ReviewBlock title="Branding" onEdit={() => onEdit(5)}>
        <p>{state.branding.displayName}</p>
        <p>{state.branding.primaryColour} / {state.branding.secondaryColour}</p>
        <p>https://{state.slug}.unit311central.com</p>
      </ReviewBlock>
    </div>
  );
}

function ReviewBlock({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-medium text-white">{title}</p>
        <button type="button" onClick={onEdit} className="text-xs text-sky-300 hover:text-sky-200">
          Edit
        </button>
      </div>
      <div className="mt-2 space-y-1">{children}</div>
    </div>
  );
}
