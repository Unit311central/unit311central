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
  WORKSPACE_MODULE_IDS,
  allCatalogueModuleSelections,
  defaultEnabledModules,
  defaultEnabledSubModules,
  subModuleKey,
  syncModuleSelection,
} from "@/lib/platform-workspaces/module-catalogue";
import { deriveDefaultCustomerHostname } from "@/lib/platform-workspaces/workspace-hostname";
import {
  validateInitialWorkspaceAdministrator,
  validateLoginPageTitle,
} from "@/lib/platform-workspaces/provisioning-validation";
import type {
  CreateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceImportClient,
  WorkspaceImportEmployee,
} from "@/lib/platform-workspaces/types";
import { cn } from "@/lib/utils";

function defaultHostnameForWizard(state: { slug: string; name: string }): string {
  return deriveDefaultCustomerHostname({
    workspaceSlug: state.slug,
    workspaceName: state.name,
  });
}

const WIZARD_STEPS = [
  "Workspace type",
  "Workspace details",
  "Modules",
  "Users / employees",
  "Clients",
  "Login page",
  "Initial workspace administrator",
  "Branding / configuration",
  "Review",
  "Create / provision",
] as const;

type WizardState = CreateWorkspaceInput & {
  slugAvailable: boolean | null;
  slugMessage: string | null;
  hostnameAvailable: boolean | null;
  hostnameMessage: string | null;
  employeeErrors: Array<{ row: number; message: string }>;
  clientErrors: Array<{ row: number; message: string }>;
  loginPageLogoPreview: string | null;
  loginPageBackgroundPreview: string | null;
  initialAdminError: string | null;
};

function initialState(): WizardState {
  const enabledModules = defaultEnabledModules();
  return {
    type: "Customer",
    name: "",
    slug: "",
    customerHostname: "",
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
    loginPage: {
      title: "",
      logoDataUrl: null,
      backgroundDataUrl: null,
    },
    initialAdministrator: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    slugAvailable: null,
    slugMessage: null,
    hostnameAvailable: null,
    hostnameMessage: null,
    employeeErrors: [],
    clientErrors: [],
    loginPageLogoPreview: null,
    loginPageBackgroundPreview: null,
    initialAdminError: null,
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
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState<string | null>(null);
  const [employeeCsv, setEmployeeCsv] = useState("");
  const [clientCsv, setClientCsv] = useState("");

  function resetWizard() {
    setStep(0);
    setState(initialState());
    setBusy(false);
    setCreated(null);
    setProvisioning(false);
    setProvisionError(null);
    setEmployeeCsv("");
    setClientCsv("");
  }

  const allModulesSelected = useMemo(
    () =>
      WORKSPACE_MODULE_IDS.length > 0 &&
      WORKSPACE_MODULE_IDS.every((id) => state.enabledModules.includes(id)),
    [state.enabledModules],
  );

  const canContinue = useMemo(() => {
    if (step === 0) return state.type === "Customer" || state.type === "Demo";
    if (step === 1) {
      return (
        state.name.trim().length > 0 &&
        state.slug.trim().length > 0 &&
        state.companyName.trim().length > 0 &&
        state.contactName.trim().length > 0 &&
        state.contactEmail.trim().length > 0 &&
        state.slugAvailable === true &&
        (state.customerHostname?.trim().length === 0 || state.hostnameAvailable === true)
      );
    }
    if (step === 5) {
      return !validateLoginPageTitle(state.loginPage.title);
    }
    if (step === 6) {
      const validation = validateInitialWorkspaceAdministrator(state.initialAdministrator);
      return validation.ok;
    }
    if (step === 7) {
      const hostname = state.customerHostname?.trim() || defaultHostnameForWizard(state);
      return hostname.length > 0 && state.hostnameAvailable !== false;
    }
    if (step === 2) return state.enabledModules.length > 0;
    if (step === 3) return state.employeeErrors.length === 0;
    if (step === 4) return state.clientErrors.length === 0;
    return true;
  }, [state, step]);

  async function checkHostname(hostname: string) {
    const response = await fetch(
      `/api/internal/workspaces/check-hostname?hostname=${encodeURIComponent(hostname)}`,
    );
    const payload = await readJson<{ available: boolean; hostname: string; message?: string }>(
      response,
    );
    setState((current) => ({
      ...current,
      hostnameAvailable: payload.available,
      hostnameMessage: payload.message ?? (payload.available ? "Hostname is available." : "Hostname is unavailable."),
    }));
  }

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
    if (busy || provisioning || created) return;
    setBusy(true);
    setProvisionError(null);
    try {
      const customerHostname =
        state.customerHostname?.trim() || defaultHostnameForWizard(state);
      const response = await fetch("/api/internal/workspaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: state.type,
          name: state.name,
          slug: state.slug,
          customerHostname,
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
          loginPage: state.loginPage,
          initialAdministrator: state.initialAdministrator,
        } satisfies CreateWorkspaceInput),
      });
      const payload = await readJson<{ workspace?: WorkspaceAdminRecord; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || "Workspace provisioning failed.");
      setCreated(payload.workspace ?? null);
      setStep(WIZARD_STEPS.length - 1);
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : "Workspace provisioning failed.");
    } finally {
      setBusy(false);
      setProvisioning(false);
    }
  }

  async function retryProvisioning() {
    if (!created || busy || provisioning) return;
    setBusy(true);
    setProvisionError(null);
    try {
      const response = await fetch(`/api/internal/workspaces/${created.workspaceId}/provision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          initialAdministrator: state.initialAdministrator,
        }),
      });
      const payload = await readJson<{ workspace?: WorkspaceAdminRecord; error?: string }>(response);
      if (!response.ok) throw new Error(payload.error || "Workspace provisioning retry failed.");
      setCreated(payload.workspace ?? null);
    } catch (err) {
      setProvisionError(err instanceof Error ? err.message : "Workspace provisioning retry failed.");
    } finally {
      setBusy(false);
      setProvisioning(false);
    }
  }

  const resolvedHostname =
    state.customerHostname?.trim() || defaultHostnameForWizard(state) || "hostname";
  const provisioningComplete =
    created?.provisioning.overallStatus === "complete" ||
    (created?.provisioning.databaseStatus === "complete" &&
      created?.provisioning.deploymentStatus === "complete" &&
      created?.provisioning.workspaceRecordStatus === "complete" &&
      (created?.provisioning.authenticationStatus === "complete" ||
        created?.provisioning.authenticationStatus === "skipped"));
  const provisioningFailed = created?.provisioning.overallStatus === "failed";

  return (
    <div className="space-y-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
          <PlusCircle className="h-5 w-5" aria-hidden />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            Internal Central · Workspaces
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">New Workspace</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
            Configure a customer or demo workspace. Phase 3 provisions the database foundation,
            authentication, hostname routing, and optional imports when you create the workspace.
          </p>
        </div>
        </div>
        {!created ? (
          <button
            type="button"
            onClick={resetWizard}
            className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium text-white/60 transition hover:bg-white/5 hover:text-white/85"
          >
            Reset form
          </button>
        ) : null}
      </header>

      <form
        autoComplete="off"
        className="space-y-5"
        onSubmit={(event) => event.preventDefault()}
        name="unit311-new-workspace-provision"
      >

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
            <WizardField
              fieldKey="workspace-name"
              label="Workspace name *"
              value={state.name}
              onChange={(value) =>
                setState({
                  ...state,
                  name: value,
                  branding: { ...state.branding, displayName: value },
                  companyName: value,
                  loginPage: { ...state.loginPage, title: value },
                  customerHostname: deriveDefaultCustomerHostname({
                    workspaceSlug: state.slug,
                    workspaceName: value,
                  }),
                  hostnameAvailable: null,
                  hostnameMessage: null,
                })
              }
            />
            <WizardField
              fieldKey="workspace-slug"
              label="Workspace slug *"
              value={state.slug}
              onChange={(value) => {
                const nextSlug = value.toLowerCase().replace(/[^a-z0-9-]/g, "-");
                setState({
                  ...state,
                  slug: nextSlug,
                  slugAvailable: null,
                  slugMessage: null,
                  customerHostname: deriveDefaultCustomerHostname({
                    workspaceSlug: nextSlug,
                    workspaceName: state.name,
                  }),
                  hostnameAvailable: null,
                  hostnameMessage: null,
                });
              }}
              onBlur={() => {
                if (state.slug) {
                  void checkSlug(state.slug);
                  const hostname = state.customerHostname || defaultHostnameForWizard(state);
                  if (hostname) void checkHostname(hostname);
                }
              }}
            />
            {state.slugMessage ? (
              <div className="md:col-span-2 space-y-1">
                <p
                  className={cn(
                    "text-sm",
                    state.slugAvailable ? "text-emerald-200" : "text-rose-200",
                  )}
                >
                  {state.slugMessage}
                </p>
                {!state.slugAvailable ? (
                  <p className="text-xs text-white/45">
                    If you did not enter this workspace name, your browser may have restored a prior
                    attempt. Click <span className="font-medium text-white/65">Reset form</span> and
                    type the details again.
                  </p>
                ) : null}
              </div>
            ) : null}
            <WizardField
              fieldKey="company-name"
              label="Company / organisation *"
              value={state.companyName}
              onChange={(value) => setState({ ...state, companyName: value })}
            />
            <WizardField
              fieldKey="contact-name"
              label="Primary contact name *"
              value={state.contactName}
              onChange={(value) => setState({ ...state, contactName: value })}
            />
            <WizardField
              fieldKey="contact-email"
              label="Primary contact email *"
              value={state.contactEmail}
              autoComplete="off"
              onChange={(value) => setState({ ...state, contactEmail: value })}
            />
            <WizardField
              fieldKey="country"
              label="Country"
              value={state.country}
              onChange={(value) => setState({ ...state, country: value })}
            />
            <WizardField
              fieldKey="timezone"
              label="Timezone"
              value={state.timezone}
              onChange={(value) => setState({ ...state, timezone: value })}
            />
            <WizardField
              fieldKey="currency"
              label="Currency"
              value={state.currency}
              onChange={(value) => setState({ ...state, currency: value })}
            />
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
          <div className="space-y-3">
            <label className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm font-medium text-white">
              <input
                type="checkbox"
                checked={allModulesSelected}
                onChange={(event) => {
                  if (event.target.checked) {
                    setState({ ...state, ...allCatalogueModuleSelections() });
                    return;
                  }
                  setState({ ...state, enabledModules: [], enabledSubModules: [] });
                }}
              />
              Select all modules
            </label>
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
          <LoginPageStep
            state={state}
            onChange={(patch) => setState((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {step === 6 ? (
          <InitialAdministratorStep
            state={state}
            onChange={(patch) => setState((current) => ({ ...current, ...patch }))}
          />
        ) : null}

        {step === 7 ? (
          <div className="grid gap-4 md:grid-cols-2">
            <WizardField label="Display name" value={state.branding.displayName} onChange={(value) => setState({ ...state, branding: { ...state.branding, displayName: value } })} />
            <WizardField label="Logo URL" value={state.branding.logoUrl ?? ""} onChange={(value) => setState({ ...state, branding: { ...state.branding, logoUrl: value || null } })} />
            <WizardField label="Primary colour" value={state.branding.primaryColour} onChange={(value) => setState({ ...state, branding: { ...state.branding, primaryColour: value } })} />
            <WizardField label="Secondary colour" value={state.branding.secondaryColour} onChange={(value) => setState({ ...state, branding: { ...state.branding, secondaryColour: value } })} />
            <WizardField
              label="Customer-facing hostname *"
              value={state.customerHostname || defaultHostnameForWizard(state)}
              onChange={(value) =>
                setState({
                  ...state,
                  customerHostname: value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  hostnameAvailable: null,
                  hostnameMessage: null,
                })
              }
              onBlur={() => {
                const hostname = state.customerHostname || defaultHostnameForWizard(state);
                if (hostname) void checkHostname(hostname);
              }}
            />
            {state.hostnameMessage ? (
              <p
                className={cn(
                  "md:col-span-2 text-sm",
                  state.hostnameAvailable ? "text-emerald-200" : "text-rose-200",
                )}
              >
                {state.hostnameMessage}
              </p>
            ) : null}
            <WizardField
              label="Primary workspace URL"
              value={`https://${resolvedHostname}.unit311central.com`}
              onChange={() => undefined}
              readOnly
            />
            {state.slug && state.customerHostname && state.slug !== state.customerHostname ? (
              <p className="md:col-span-2 text-xs text-white/45">
                Workspace slug <span className="font-mono">{state.slug}</span> maps to customer host{" "}
                <span className="font-mono">{state.customerHostname}</span>.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 8 ? (
          <ReviewSummary state={state} onEdit={setStep} />
        ) : null}

        {step === 9 ? (
          <div className="space-y-4">
            {created ? (
              <ProvisioningResultPanel
                workspace={created}
                complete={provisioningComplete}
                failed={provisioningFailed}
                overviewHref={overviewHref}
                onRetry={() => void retryProvisioning()}
                retryBusy={busy}
                error={provisionError}
              />
            ) : (
              <>
                <p className="text-sm text-white/60">
                  This will provision the workspace database, configuration, hostname routing,
                  authentication accounts, and any optional client imports.
                </p>
                <ProvisioningStepList />
                {provisionError ? <p className="text-sm text-rose-200">{provisionError}</p> : null}
                <button
                  type="button"
                  disabled={busy || provisioning}
                  onClick={() => {
                    setProvisioning(true);
                    void createWorkspace();
                  }}
                  className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100 disabled:opacity-40"
                >
                  {busy || provisioning ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Create / provision workspace
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
      </form>
    </div>
  );
}

function WizardField({
  label,
  value,
  onChange,
  onBlur,
  readOnly,
  fieldKey,
  autoComplete = "off",
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
  /** Stable id/name — avoids browser autofill heuristics on generic field names. */
  fieldKey?: string;
  autoComplete?: string;
  type?: string;
}) {
  const [unlocked, setUnlocked] = useState(false);
  const inputId = fieldKey ? `unit311-nw-${fieldKey}` : undefined;
  const locked = !readOnly && !unlocked;

  return (
    <div>
      <label
        htmlFor={inputId}
        className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
      >
        {label}
      </label>
      <input
        id={inputId}
        name={inputId}
        type={type}
        value={value}
        readOnly={readOnly || locked}
        autoComplete={autoComplete}
        data-1p-ignore="true"
        data-lpignore="true"
        data-form-type="other"
        onFocus={() => setUnlocked(true)}
        onBlur={onBlur}
        onChange={(event) => onChange(event.target.value)}
        onInput={(event) => onChange(event.currentTarget.value)}
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
  const resolvedHostname =
    state.customerHostname?.trim() || defaultHostnameForWizard(state) || "hostname";
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
      <ReviewBlock title="Login page" onEdit={() => onEdit(5)}>
        <p>{state.loginPage.title}</p>
        <p>{state.loginPageLogoPreview ? "Logo uploaded" : "No logo uploaded"}</p>
        <p>{state.loginPageBackgroundPreview ? "Background uploaded" : "No background uploaded"}</p>
      </ReviewBlock>
      <ReviewBlock title="Initial administrator" onEdit={() => onEdit(6)}>
        <p>{state.initialAdministrator.firstName} {state.initialAdministrator.lastName}</p>
        <p>{state.initialAdministrator.email}</p>
      </ReviewBlock>
      <ReviewBlock title="Branding" onEdit={() => onEdit(7)}>
        <p>{state.branding.displayName}</p>
        <p>{state.branding.primaryColour} / {state.branding.secondaryColour}</p>
        <p>https://{resolvedHostname}.unit311central.com</p>
        {state.slug !== resolvedHostname ? (
          <p className="text-white/50">Slug: {state.slug}</p>
        ) : null}
      </ReviewBlock>
    </div>
  );
}

function ProvisioningStepList() {
  const steps = [
    "Workspace database foundation",
    "Configuration and modules",
    "Customer hostname routing",
    "Customer login page",
    "Initial workspace administrator",
    "Additional employee accounts",
    "Optional client imports",
    "Application deployment",
    "Hostname and login verification",
  ];
  return (
    <ul className="space-y-2 text-sm text-white/60">
      {steps.map((label) => (
        <li key={label} className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-sky-300" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

function ProvisioningResultPanel({
  workspace,
  complete,
  failed,
  overviewHref,
  onRetry,
  retryBusy,
  error,
}: {
  workspace: WorkspaceAdminRecord;
  complete: boolean;
  failed: boolean;
  overviewHref: string;
  onRetry: () => void;
  retryBusy: boolean;
  error: string | null;
}) {
  const borderClass = complete
    ? "border-emerald-400/30 bg-emerald-500/10"
    : failed
      ? "border-rose-400/30 bg-rose-500/10"
      : "border-sky-400/30 bg-sky-500/10";
  const title = complete ? "Workspace ready" : failed ? "Provisioning failed" : "Provisioning";

  return (
    <div className={cn("rounded-xl border p-4", borderClass)}>
      <div className="flex items-center gap-2 text-white">
        {complete ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-200" />
        ) : failed ? (
          <Loader2 className="h-5 w-5 text-rose-200" />
        ) : (
          <Loader2 className="h-5 w-5 animate-spin text-sky-200" />
        )}
        <p className="font-medium">{title}</p>
      </div>
      <p className="mt-2 text-sm text-white/80">
        Workspace ID <span className="font-mono">{workspace.workspaceId}</span>
      </p>
      <p className="mt-1 text-sm text-white/80">
        Customer URL{" "}
        <a href={workspace.primaryUrl} className="font-mono text-sky-200 hover:text-sky-100">
          {workspace.primaryUrl}
        </a>
      </p>
      {workspace.initialAdministrator?.email ? (
        <p className="mt-1 text-sm text-white/80">
          Administrator <span className="font-mono">{workspace.initialAdministrator.email}</span>
        </p>
      ) : null}
      <ProvisioningStatusGrid provisioning={workspace.provisioning} />
      <p className="mt-3 text-sm text-white/65">{workspace.provisioning.lastMessage}</p>
      {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}
      {failed ? (
        <button
          type="button"
          disabled={retryBusy}
          onClick={onRetry}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-sm text-white/80"
        >
          {retryBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Retry provisioning
        </button>
      ) : null}
      {complete ? (
        <Link href={overviewHref} className="mt-4 inline-flex text-sm text-sky-200 hover:text-sky-100">
          Open Workspace Overview
        </Link>
      ) : null}
    </div>
  );
}

function ProvisioningStatusGrid({
  provisioning,
}: {
  provisioning: WorkspaceAdminRecord["provisioning"];
}) {
  const rows: Array<{ label: string; status: string }> = [
    { label: "Database", status: provisioning.databaseStatus },
    { label: "Workspace record", status: provisioning.workspaceRecordStatus },
    { label: "Hostname / routing", status: provisioning.infrastructureStatus },
    { label: "Login page", status: provisioning.loginPageStatus ?? "not_started" },
    { label: "Initial administrator", status: provisioning.initialAdminStatus ?? "not_started" },
    { label: "Employee accounts", status: provisioning.authenticationStatus },
    { label: "Deployment", status: provisioning.deploymentStatus },
  ];
  return (
    <div className="mt-4 grid gap-2 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-lg border border-white/10 bg-black/10 px-3 py-2 text-xs text-white/70"
        >
          <span className="text-white/45">{row.label}</span>
          <p className="mt-1 font-medium capitalize text-white">{row.status.replace(/_/g, " ")}</p>
        </div>
      ))}
    </div>
  );
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Failed to read file."));
    reader.readAsDataURL(file);
  });
}

function LoginPageStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const previewBackground = state.loginPageBackgroundPreview;
  const previewLogo = state.loginPageLogoPreview;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <WizardField
        label="Login page title *"
        value={state.loginPage.title}
        onChange={(value) =>
          onChange({
            loginPage: { ...state.loginPage, title: value },
          })
        }
      />
      <div className="md:col-span-2">
        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Logo
        </label>
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="mt-1.5 block w-full text-sm text-white/70"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void readFileAsDataUrl(file).then((dataUrl) => {
              onChange({
                loginPage: { ...state.loginPage, logoDataUrl: dataUrl },
                loginPageLogoPreview: dataUrl,
              });
            });
          }}
        />
      </div>
      <div className="md:col-span-2">
        <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
          Background image (JPG)
        </label>
        <input
          type="file"
          accept="image/jpeg,image/jpg"
          className="mt-1.5 block w-full text-sm text-white/70"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            void readFileAsDataUrl(file).then((dataUrl) => {
              onChange({
                loginPage: { ...state.loginPage, backgroundDataUrl: dataUrl },
                loginPageBackgroundPreview: dataUrl,
              });
            });
          }}
        />
      </div>
      <div className="md:col-span-2 rounded-xl border border-white/10 bg-[#0b1524] p-4">
        <p className="text-xs font-medium uppercase tracking-[0.12em] text-white/45">Preview</p>
        <div className="relative mt-3 min-h-56 overflow-hidden rounded-xl border border-white/10">
          {previewBackground ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewBackground} alt="" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[#0b1524]" />
          )}
          <div className="absolute inset-0 bg-[#020617]/55" />
          <div className="relative flex min-h-56 flex-col items-center justify-center gap-4 p-6 text-center">
            {previewLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewLogo} alt="" className="max-h-16 max-w-[200px] object-contain" />
            ) : (
              <div className="rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-semibold text-white">
                {state.loginPage.title || "Workspace"}
              </div>
            )}
            <p className="text-lg font-semibold text-white">
              {(state.loginPage.title || "Workspace").trim()} Login
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function InitialAdministratorStep({
  state,
  onChange,
}: {
  state: WizardState;
  onChange: (patch: Partial<WizardState>) => void;
}) {
  const validation = validateInitialWorkspaceAdministrator(state.initialAdministrator);

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/55">
        This person will be the first login for the new workspace and is automatically assigned Full
        Workspace Administrator rights.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <WizardField
          fieldKey="admin-first-name"
          label="First name *"
          value={state.initialAdministrator.firstName}
          onChange={(value) =>
            onChange({
              initialAdministrator: { ...state.initialAdministrator, firstName: value },
            })
          }
        />
        <WizardField
          fieldKey="admin-last-name"
          label="Last name *"
          value={state.initialAdministrator.lastName}
          onChange={(value) =>
            onChange({
              initialAdministrator: { ...state.initialAdministrator, lastName: value },
            })
          }
        />
        <WizardField
          fieldKey="admin-email"
          label="Email address *"
          value={state.initialAdministrator.email}
          onChange={(value) =>
            onChange({
              initialAdministrator: { ...state.initialAdministrator, email: value },
            })
          }
        />
        <div />
        <WizardField
          fieldKey="admin-password"
          label="Password *"
          type="password"
          autoComplete="new-password"
          value={state.initialAdministrator.password}
          onChange={(value) =>
            onChange({
              initialAdministrator: { ...state.initialAdministrator, password: value },
            })
          }
        />
        <WizardField
          fieldKey="admin-password-confirm"
          label="Confirm password *"
          type="password"
          autoComplete="new-password"
          value={state.initialAdministrator.confirmPassword}
          onChange={(value) =>
            onChange({
              initialAdministrator: { ...state.initialAdministrator, confirmPassword: value },
            })
          }
        />
      </div>
      {!validation.ok ? (
        <p className="text-sm text-rose-200">{validation.message}</p>
      ) : null}
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
