"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";

import type { WorkspaceAdminRecord } from "@/lib/platform-workspaces/types";
import {
  WORKSPACE_MODULE_CATALOGUE,
  subModuleKey,
} from "@/lib/platform-workspaces/module-catalogue";

type PanelMode = "view" | "edit" | "users" | "modules";

type WorkspaceDetailPanelProps = {
  workspace: WorkspaceAdminRecord;
  mode: PanelMode;
  onClose: () => void;
  onUpdated: () => Promise<void>;
};

export function WorkspaceDetailPanel({
  workspace,
  mode,
  onClose,
  onUpdated,
}: WorkspaceDetailPanelProps) {
  const [draft, setDraft] = useState(workspace);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function save(patch: Partial<WorkspaceAdminRecord>) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch(`/api/internal/workspaces/${workspace.workspaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Update failed.");
      setDraft(payload.workspace);
      setMessage("Workspace updated.");
      await onUpdated();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-[#08111d] p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
            {mode === "view"
              ? "Workspace details"
              : mode === "edit"
                ? "Edit configuration"
                : mode === "users"
                  ? "Manage users"
                  : "Manage modules"}
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{draft.name}</h2>
          <p className="text-sm text-white/50">{draft.slug}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-white/10 p-2 text-white/60 hover:bg-white/5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {mode === "view" ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <Detail label="Type" value={draft.type} />
          <Detail label="Status" value={draft.status} />
          <Detail label="Company" value={draft.companyName} />
          <Detail label="Contact" value={`${draft.contact.name} · ${draft.contact.email}`} />
          <Detail label="Country" value={draft.country || "—"} />
          <Detail label="Timezone" value={draft.timezone} />
          <Detail label="Currency" value={draft.currency} />
          <Detail label="Primary URL" value={draft.primaryUrl} />
          <Detail label="Users" value={String(draft.userCount)} />
          <Detail label="Modules enabled" value={String(draft.enabledModuleCount)} />
          <Detail label="Provisioning" value={draft.provisioning.lastMessage || "—"} />
          <Detail label="Description" value={draft.description || "—"} />
        </div>
      ) : null}

      {mode === "edit" ? (
        <form
          className="mt-5 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void save({
              name: draft.name,
              companyName: draft.companyName,
              description: draft.description,
              country: draft.country,
              timezone: draft.timezone,
              currency: draft.currency,
              contact: draft.contact,
              branding: draft.branding,
            });
          }}
        >
          <Field label="Workspace name" value={draft.name} onChange={(value) => setDraft({ ...draft, name: value })} />
          <Field label="Company" value={draft.companyName} onChange={(value) => setDraft({ ...draft, companyName: value })} />
          <Field label="Contact name" value={draft.contact.name} onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, name: value } })} />
          <Field label="Contact email" value={draft.contact.email} onChange={(value) => setDraft({ ...draft, contact: { ...draft.contact, email: value } })} />
          <Field label="Country" value={draft.country} onChange={(value) => setDraft({ ...draft, country: value })} />
          <Field label="Timezone" value={draft.timezone} onChange={(value) => setDraft({ ...draft, timezone: value })} />
          <Field label="Currency" value={draft.currency} onChange={(value) => setDraft({ ...draft, currency: value })} />
          <Field label="Display name" value={draft.branding.displayName} onChange={(value) => setDraft({ ...draft, branding: { ...draft.branding, displayName: value } })} />
          <div className="md:col-span-2">
            <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
              Description
            </label>
            <textarea
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              className="mt-1.5 min-h-24 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save changes
            </button>
          </div>
        </form>
      ) : null}

      {mode === "users" ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-white/55">
            {draft.pendingEmployees.length > 0
              ? `${draft.pendingEmployees.length} employee row(s) queued for authentication provisioning.`
              : "No pending employee imports recorded for this workspace."}
          </p>
          {draft.pendingEmployees.length > 0 ? (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/10 text-[10px] uppercase tracking-[0.12em] text-white/40">
                  <tr>
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {draft.pendingEmployees.map((employee) => (
                    <tr key={employee.email} className="border-b border-white/5">
                      <td className="px-3 py-2 text-white/80">
                        {employee.firstName} {employee.lastName}
                      </td>
                      <td className="px-3 py-2 text-white/60">{employee.email}</td>
                      <td className="px-3 py-2 text-white/60">{employee.role || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      ) : null}

      {mode === "modules" ? (
        <div className="mt-5 space-y-3">
          <p className="text-sm text-white/55">
            Toggle modules and sub-modules for this workspace. Changes sync to workspace_modules when
            Supabase is configured.
          </p>
          <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {WORKSPACE_MODULE_CATALOGUE.map((module) => {
              const enabled = draft.enabledModules.includes(module.id);
              return (
                <div key={module.id} className="rounded-xl border border-white/10 p-3">
                  <label className="flex items-center gap-2 text-sm font-medium text-white">
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={(event) => {
                        const nextModules = event.target.checked
                          ? [...draft.enabledModules, module.id]
                          : draft.enabledModules.filter((id) => id !== module.id);
                        const nextSubModules = event.target.checked
                          ? [
                              ...draft.enabledSubModules,
                              ...module.subModules
                                .map((sub) => subModuleKey(module.id, sub.id))
                                .filter((key) => !draft.enabledSubModules.includes(key)),
                            ]
                          : draft.enabledSubModules.filter(
                              (key) => !key.startsWith(`${module.id}:`),
                            );
                        setDraft({
                          ...draft,
                          enabledModules: nextModules,
                          enabledSubModules: nextSubModules,
                        });
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
                              checked={draft.enabledSubModules.includes(key)}
                              onChange={(event) => {
                                const next = event.target.checked
                                  ? [...draft.enabledSubModules, key]
                                  : draft.enabledSubModules.filter((item) => item !== key);
                                setDraft({ ...draft, enabledSubModules: next });
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
          <button
            type="button"
            disabled={saving}
            onClick={() =>
              void save({
                enabledModules: draft.enabledModules,
                enabledSubModules: draft.enabledSubModules,
              })
            }
            className="inline-flex items-center gap-2 rounded-xl border border-sky-400/40 bg-sky-500/15 px-4 py-2 text-sm font-medium text-sky-100"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save module selection
          </button>
        </div>
      ) : null}

      {message ? <p className="mt-4 text-sm text-white/65">{message}</p> : null}
    </section>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">{label}</p>
      <p className="mt-1 text-sm text-white/75">{value}</p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-sky-400/50"
      />
    </div>
  );
}
