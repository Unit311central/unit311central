"use client";

import { useMemo, useState } from "react";
import {
  Clock,
  Plus,
  Trash2,
  UserPlus,
  X,
} from "lucide-react";

import {
  TQMS_CAPA_PRIORITIES,
  TQMS_CAPA_STATUSES,
  tqmsStatusClass,
  type TqmsCapa,
  type TqmsCapaPriority,
  type TqmsCapaStatus,
} from "@/lib/tqms-data";
import {
  createCapa,
  deleteCapa,
  updateCapaStatus,
} from "@/lib/tqms-mock-store";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsSection,
  TqmsSlideOver,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type CapaFormState = {
  reference: string;
  issue: string;
  rootCause: string;
  owner: string;
  priority: TqmsCapaPriority;
  status: TqmsCapaStatus;
  dueDate: string;
};

const emptyCapaForm = (): CapaFormState => ({
  reference: "",
  issue: "",
  rootCause: "",
  owner: "",
  priority: "Medium",
  status: "Open",
  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString().slice(0, 10),
});

function actionClass(tone: "sky" | "amber" | "rose" | "emerald") {
  const map = {
    sky: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
    emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  } as const;
  return `inline-flex h-8 items-center gap-1 rounded-lg border px-2 text-[11px] font-semibold transition-colors ${map[tone]}`;
}

export default function CapaWorkspace() {
  const store = useTqmsMockStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CapaFormState>(emptyCapaForm);
  const [timelineCapa, setTimelineCapa] = useState<TqmsCapa | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const capas = useMemo(
    () => [...store.capas].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [store.capas],
  );

  const openCount = capas.filter((c) => c.status !== "Closed").length;

  function handleCreate() {
    if (!form.reference.trim() || !form.issue.trim() || !form.owner.trim()) {
      setNotice("Reference, issue, and owner are required.");
      return;
    }
    createCapa({
      reference: form.reference.trim(),
      issue: form.issue.trim(),
      rootCause: form.rootCause.trim() || "Under investigation",
      owner: form.owner.trim(),
      priority: form.priority,
      status: form.status,
      dueDate: form.dueDate,
    });
    setNotice(`CAPA ${form.reference.trim()} created.`);
    setFormOpen(false);
    setForm(emptyCapaForm());
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <TqmsSection
        title="CAPA Register"
        subtitle={`${openCount} open corrective and preventive actions.`}
        actions={
          <button type="button" className={tqmsPrimaryButtonClass()} onClick={() => setFormOpen(true)}>
            <Plus className="h-3.5 w-3.5" />
            Create CAPA
          </button>
        }
      >
        {capas.length === 0 ? (
          <TqmsEmpty message="No CAPA records yet." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Reference</th>
                  <th className="px-3 py-2.5 font-medium">Issue</th>
                  <th className="px-3 py-2.5 font-medium">Root Cause</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Priority</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Due Date</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {capas.map((capa) => (
                  <tr key={capa.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-sky-200">{capa.reference}</td>
                    <td className="max-w-[200px] px-3 py-2.5 text-white">{capa.issue}</td>
                    <td className="max-w-[200px] px-3 py-2.5 text-white/60">{capa.rootCause}</td>
                    <td className="px-3 py-2.5 text-white/70">{capa.owner}</td>
                    <td className="px-3 py-2.5">
                      <TqmsStatusPill className={tqmsStatusClass(capa.priority)}>
                        {capa.priority}
                      </TqmsStatusPill>
                    </td>
                    <td className="px-3 py-2.5">
                      <TqmsStatusPill className={tqmsStatusClass(capa.status)}>
                        {capa.status}
                      </TqmsStatusPill>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">{capa.dueDate}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        {capa.status !== "Action" && capa.status !== "Closed" ? (
                          <button
                            type="button"
                            className={actionClass("sky")}
                            onClick={() => {
                              updateCapaStatus(capa.id, "Action");
                              setNotice(`${capa.reference} moved to Action.`);
                            }}
                          >
                            <UserPlus className="h-3 w-3" />
                            Assign
                          </button>
                        ) : null}
                        {capa.status !== "Closed" ? (
                          <button
                            type="button"
                            className={actionClass("emerald")}
                            onClick={() => {
                              updateCapaStatus(capa.id, "Closed");
                              setNotice(`${capa.reference} closed.`);
                            }}
                          >
                            Close
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={actionClass("amber")}
                          onClick={() => setTimelineCapa(capa)}
                        >
                          <Clock className="h-3 w-3" />
                          Timeline
                        </button>
                        <button
                          type="button"
                          className={actionClass("rose")}
                          onClick={() => {
                            if (window.confirm(`Delete ${capa.reference}?`)) {
                              deleteCapa(capa.id);
                              setNotice(`${capa.reference} deleted.`);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </TqmsSection>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Create CAPA</h3>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <label>
                <span className={tqmsLabelClass()}>Reference</span>
                <input
                  className={tqmsInputClass()}
                  value={form.reference}
                  onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
                  placeholder="CAPA-2026-015"
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Issue</span>
                <textarea
                  className={`${tqmsInputClass()} min-h-[72px] resize-y`}
                  value={form.issue}
                  onChange={(e) => setForm((f) => ({ ...f, issue: e.target.value }))}
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Root Cause</span>
                <textarea
                  className={`${tqmsInputClass()} min-h-[72px] resize-y`}
                  value={form.rootCause}
                  onChange={(e) => setForm((f) => ({ ...f, rootCause: e.target.value }))}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={tqmsLabelClass()}>Owner</span>
                  <input
                    className={tqmsInputClass()}
                    value={form.owner}
                    onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                  />
                </label>
                <label>
                  <span className={tqmsLabelClass()}>Priority</span>
                  <select
                    className={tqmsInputClass()}
                    value={form.priority}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, priority: e.target.value as TqmsCapaPriority }))
                    }
                  >
                    {TQMS_CAPA_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label>
                  <span className={tqmsLabelClass()}>Status</span>
                  <select
                    className={tqmsInputClass()}
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, status: e.target.value as TqmsCapaStatus }))
                    }
                  >
                    {TQMS_CAPA_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span className={tqmsLabelClass()}>Due Date</span>
                  <input
                    type="date"
                    className={tqmsInputClass()}
                    value={form.dueDate}
                    onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
                  />
                </label>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={tqmsSecondaryButtonClass()} onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="button" className={tqmsPrimaryButtonClass()} onClick={handleCreate}>
                Create CAPA
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {timelineCapa ? (
        <TqmsSlideOver
          title="CAPA Timeline"
          subtitle={timelineCapa.reference}
          onClose={() => setTimelineCapa(null)}
        >
          <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3">
            <p className="text-sm font-medium text-white">{timelineCapa.issue}</p>
            <p className="mt-1 text-xs text-white/45">Owner · {timelineCapa.owner}</p>
          </div>
          <ol className="relative space-y-4 border-l border-white/10 pl-4">
            {timelineCapa.timeline.map((entry, index) => (
              <li key={`${entry.at}-${index}`} className="relative">
                <span className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full border border-sky-400/50 bg-sky-500/30" />
                <p className="text-xs tabular-nums text-white/45">{entry.at}</p>
                <p className="text-sm text-white/80">{entry.label}</p>
              </li>
            ))}
          </ol>
        </TqmsSlideOver>
      ) : null}
    </div>
  );
}
