"use client";

import { useMemo, useState } from "react";
import { Loader2, X } from "lucide-react";

import {
  COMMAND_CENTRE_HOME_TILE_CATALOG,
  type CommandCentreHomeTileId,
} from "@/lib/command-centre-home-tiles";
import {
  defaultAllowedViewsForRoles,
  defaultHomeTilesForRoles,
  isModuleGroupEnabled,
  isModuleGroupPartiallyEnabled,
  isModuleViewEnabled,
  isWorkspaceDashboardEnabled,
  MODULE_GRANT_GROUPS,
  moduleViewLabel,
  toggleModuleGroup,
  toggleModuleView,
  toggleWorkspaceDashboard,
  WORKSPACE_DASHBOARD_OPTIONS,
} from "@/lib/access-presets";
import {
  USER_DEPARTMENT_OPTIONS,
  USER_REGION_OPTIONS,
  USER_ROLE_OPTIONS,
  USER_STATUS_OPTIONS,
  primaryUserRole,
  type ManagedUser,
  type UserDepartment,
  type UserRegion,
  type UserRole,
  type UserStatus,
} from "@/lib/user-management-data";
import type { InternalOperationsView } from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

type WizardMode = "create" | "edit";

type AddUserAccessWizardProps = {
  mode: WizardMode;
  initial?: ManagedUser | null;
  busy?: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    operatorLabel: string;
    fullName: string;
    username: string;
    email: string;
    phone: string;
    role: UserRole;
    roles: UserRole[];
    department: UserDepartment;
    status: UserStatus;
    region: UserRegion;
    licenseId: string;
    notes: string;
    password?: string;
    allowedViews: InternalOperationsView[];
    dashboardPrefs: { homeTiles: CommandCentreHomeTileId[] };
  }) => Promise<void>;
};

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

const STEPS = ["Details", "Role", "Modules", "Dashboards"] as const;

export default function AddUserAccessWizard({
  mode,
  initial,
  busy = false,
  onClose,
  onSubmit,
}: AddUserAccessWizardProps) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [operatorLabel, setOperatorLabel] = useState(initial?.operatorLabel ?? "");
  const [fullName, setFullName] = useState(initial?.fullName ?? "");
  const [email, setEmail] = useState(initial?.email || initial?.username || "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<UserStatus>(initial?.status ?? "Active");
  const [region, setRegion] = useState<UserRegion>(initial?.region ?? "Barcelona");
  const [licenseId, setLicenseId] = useState(initial?.licenseId ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  const [roles, setRoles] = useState<UserRole[]>(
    () => initial?.roles?.length ? initial.roles : [initial?.role ?? "Manager"],
  );
  const role = primaryUserRole(roles);
  const [department, setDepartment] = useState<UserDepartment>(
    initial?.department ?? "Engineering",
  );

  const [allowedViews, setAllowedViews] = useState<InternalOperationsView[]>(
    () =>
      initial?.allowedViews ??
      defaultAllowedViewsForRoles(
        initial?.roles?.length ? initial.roles : [initial?.role ?? "Manager"],
        initial?.department ?? "Engineering",
      ),
  );
  const [homeTiles, setHomeTiles] = useState<CommandCentreHomeTileId[]>(
    () =>
      initial?.dashboardPrefs?.homeTiles ??
      defaultHomeTilesForRoles(
        initial?.roles?.length ? initial.roles : [initial?.role ?? "Manager"],
        initial?.department ?? "Engineering",
      ),
  );

  const groupedModules = useMemo(() => {
    const map = new Map<string, typeof MODULE_GRANT_GROUPS>();
    for (const group of MODULE_GRANT_GROUPS) {
      const list = map.get(group.section) ?? [];
      list.push(group);
      map.set(group.section, list);
    }
    return [...map.entries()];
  }, []);

  const groupedWorkspaceDashboards = useMemo(() => {
    const map = new Map<
      string,
      Array<(typeof WORKSPACE_DASHBOARD_OPTIONS)[number]>
    >();
    for (const dashboard of WORKSPACE_DASHBOARD_OPTIONS) {
      const list = map.get(dashboard.section) ?? [];
      list.push(dashboard);
      map.set(dashboard.section, list);
    }
    return [...map.entries()];
  }, []);

  function applyPreset(nextRoles: UserRole[], nextDepartment: UserDepartment) {
    setAllowedViews(defaultAllowedViewsForRoles(nextRoles, nextDepartment));
    setHomeTiles(defaultHomeTilesForRoles(nextRoles, nextDepartment));
  }

  async function handleFinish() {
    setError(null);
    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedName || !trimmedEmail) {
      setError("Full name and email are required.");
      setStep(0);
      return;
    }
    if (mode === "create" && password.trim() && password.trim().length < 8) {
      setError("Password must be at least 8 characters.");
      setStep(0);
      return;
    }

    try {
      await onSubmit({
        operatorLabel: operatorLabel.trim() || trimmedName.split(/\s+/)[0] || "Operator",
        fullName: trimmedName,
        username: trimmedEmail,
        email: trimmedEmail,
        phone: phone.trim(),
        role,
        roles,
        department,
        status,
        region,
        licenseId: licenseId.trim(),
        notes: notes.trim(),
        password: password.trim() || undefined,
        allowedViews,
        dashboardPrefs: { homeTiles },
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Failed to save user");
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/15 bg-[#0b1524] shadow-[0_24px_80px_rgba(0,0,0,0.65)]">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
              {mode === "create" ? "Add user" : "Edit access"}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white">
              {STEPS[step]} · Step {step + 1} of {STEPS.length}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-white/10 p-2 text-white/50 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex gap-2 border-b border-white/10 px-5 py-3">
          {STEPS.map((label, index) => (
            <button
              key={label}
              type="button"
              onClick={() => setStep(index)}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                index === step
                  ? "bg-sky-500/20 text-sky-200"
                  : "bg-white/[0.03] text-white/40 hover:text-white/70",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {error && (
            <p className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              {error}
            </p>
          )}

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Full name</FieldLabel>
                <input
                  className={inputClassName()}
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Operator label</FieldLabel>
                <input
                  className={inputClassName()}
                  value={operatorLabel}
                  onChange={(event) => setOperatorLabel(event.target.value)}
                  placeholder="Short display name"
                />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input
                  type="email"
                  className={inputClassName()}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Phone</FieldLabel>
                <input
                  className={inputClassName()}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Region</FieldLabel>
                <select
                  className={inputClassName()}
                  value={region}
                  onChange={(event) => setRegion(event.target.value as UserRegion)}
                >
                  {USER_REGION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <FieldLabel>Status</FieldLabel>
                <select
                  className={inputClassName()}
                  value={status}
                  onChange={(event) => setStatus(event.target.value as UserStatus)}
                >
                  {USER_STATUS_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              {mode === "create" && (
                <div className="sm:col-span-2">
                  <FieldLabel>Temporary password (optional)</FieldLabel>
                  <input
                    type="text"
                    className={cn(inputClassName(), "font-mono")}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Leave blank to auto-generate"
                  />
                </div>
              )}
              <div className="sm:col-span-2">
                <FieldLabel>Notes</FieldLabel>
                <textarea
                  className={cn(inputClassName(), "min-h-[80px]")}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-white/55">
                Select one or more roles. Role and department set smart defaults for modules and
                dashboards — customise them in the next steps.
              </p>
              <div>
                <FieldLabel>Access roles</FieldLabel>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {USER_ROLE_OPTIONS.map((option) => {
                    const selected = roles.includes(option);
                    return (
                      <label
                        key={option}
                        className={cn(
                          "inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs transition-colors",
                          selected
                            ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                            : "border-white/10 bg-white/[0.03] text-white/60 hover:border-white/20",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="accent-sky-400"
                          checked={selected}
                          onChange={(event) => {
                            let next: UserRole[];
                            if (event.target.checked) {
                              next = [...new Set([...roles, option])];
                            } else {
                              next = roles.filter((entry) => entry !== option);
                              if (next.length === 0) next = [option];
                            }
                            setRoles(next);
                            applyPreset(next, department);
                          }}
                        />
                        {option}
                      </label>
                    );
                  })}
                </div>
                <p className="mt-1.5 text-[11px] text-white/40">
                  Primary privilege used for admin gates: {role}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <FieldLabel>Department</FieldLabel>
                  <select
                    className={inputClassName()}
                    value={department}
                    onChange={(event) => {
                      const next = event.target.value as UserDepartment;
                      setDepartment(next);
                      applyPreset(roles, next);
                    }}
                  >
                    {USER_DEPARTMENT_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                type="button"
                onClick={() => applyPreset(roles, department)}
                className="rounded-xl border border-white/15 px-3 py-2 text-xs font-medium text-white/70 hover:border-white/25 hover:text-white"
              >
                Reset modules & dashboards to preset
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <p className="text-sm text-white/55">
                Toggle modules and their sub-pages. Use the module checkbox to select all, or pick
                individual screens below each group.
              </p>
              {groupedModules.map(([section, groups]) => (
                <div key={section}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    {section}
                  </p>
                  <ul className="space-y-3">
                    {groups.map((group) => {
                      const enabled = isModuleGroupEnabled(group, allowedViews);
                      const partial = isModuleGroupPartiallyEnabled(group, allowedViews);
                      const showSubs = group.views.length > 1;
                      return (
                        <li
                          key={group.id}
                          className="rounded-xl border border-white/10 bg-white/[0.03]"
                        >
                          <label className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3">
                            <span>
                              <span className="block text-sm font-medium text-white">
                                {group.label}
                              </span>
                              {showSubs ? (
                                <span className="mt-0.5 block text-[11px] text-white/40">
                                  {group.views.filter((view) =>
                                    isModuleViewEnabled(view, allowedViews),
                                  ).length}
                                  /{group.views.length} sub-modules
                                </span>
                              ) : null}
                            </span>
                            <input
                              type="checkbox"
                              checked={enabled}
                              ref={(el) => {
                                if (el) el.indeterminate = !enabled && partial;
                              }}
                              onChange={(event) =>
                                setAllowedViews(
                                  toggleModuleGroup(group, allowedViews, event.target.checked),
                                )
                              }
                              className="h-4 w-4 accent-sky-400"
                            />
                          </label>
                          {showSubs ? (
                            <ul className="space-y-1 border-t border-white/10 px-3 py-2.5 sm:px-4">
                              {group.views.map((view) => {
                                const subEnabled = isModuleViewEnabled(view, allowedViews);
                                return (
                                  <li key={view}>
                                    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                                      <span className="text-[13px] text-white/75">
                                        {moduleViewLabel(view)}
                                      </span>
                                      <input
                                        type="checkbox"
                                        checked={subEnabled}
                                        onChange={(event) =>
                                          setAllowedViews(
                                            toggleModuleView(
                                              view,
                                              allowedViews,
                                              event.target.checked,
                                            ),
                                          )
                                        }
                                        className="h-3.5 w-3.5 accent-sky-400"
                                      />
                                    </label>
                                  </li>
                                );
                              })}
                            </ul>
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Home sections
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    Choose which sections appear on the Home executive dashboard.
                  </p>
                </div>
                <ul className="space-y-2">
                  {COMMAND_CENTRE_HOME_TILE_CATALOG.map((tile) => {
                    const enabled = homeTiles.includes(tile.id);
                    return (
                      <li key={tile.id}>
                        <label className="flex cursor-pointer items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
                          <span>
                            <span className="block text-sm text-white">{tile.title}</span>
                            <span className="mt-0.5 block text-xs text-white/45">
                              {tile.description}
                            </span>
                          </span>
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={(event) => {
                              setHomeTiles((current) => {
                                if (event.target.checked) {
                                  return current.includes(tile.id)
                                    ? current
                                    : [...current, tile.id];
                                }
                                const next = current.filter((id) => id !== tile.id);
                                return next.length > 0 ? next : ["executive-brief"];
                              });
                            }}
                            className="mt-1 h-4 w-4 accent-sky-400"
                          />
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                    Workspace dashboards
                  </p>
                  <p className="mt-1 text-sm text-white/55">
                    Grant access to each module dashboard. Turn off any dashboard this user should
                    not open.
                  </p>
                </div>
                {groupedWorkspaceDashboards.map(([section, dashboards]) => (
                    <div key={section}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/35">
                        {section}
                      </p>
                      <ul className="space-y-2">
                        {dashboards.map((dashboard) => {
                          const enabled = isWorkspaceDashboardEnabled(
                            dashboard.id,
                            allowedViews,
                          );
                          const locked = dashboard.id === "home";
                          return (
                            <li key={dashboard.id}>
                              <label
                                className={cn(
                                  "flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3",
                                  locked ? "cursor-default opacity-80" : "cursor-pointer",
                                )}
                              >
                                <span>
                                  <span className="block text-sm text-white">{dashboard.title}</span>
                                  <span className="mt-0.5 block text-xs text-white/45">
                                    {dashboard.description}
                                  </span>
                                </span>
                                <input
                                  type="checkbox"
                                  checked={enabled}
                                  disabled={locked}
                                  onChange={(event) =>
                                    setAllowedViews(
                                      toggleWorkspaceDashboard(
                                        dashboard.id,
                                        allowedViews,
                                        event.target.checked,
                                      ),
                                    )
                                  }
                                  className="mt-1 h-4 w-4 accent-sky-400 disabled:opacity-60"
                                />
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <button
            type="button"
            onClick={() => (step === 0 ? onClose() : setStep((current) => current - 1))}
            className="rounded-xl border border-white/15 px-4 py-2 text-sm text-white/70 hover:text-white"
            disabled={busy}
          >
            {step === 0 ? "Cancel" : "Back"}
          </button>
          {step < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => current + 1)}
              className="rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-semibold text-sky-200 hover:bg-sky-500/25"
            >
              Continue
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void handleFinish()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-2 text-sm font-semibold text-emerald-200 hover:bg-emerald-500/25 disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "create" ? "Create user" : "Save access"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
