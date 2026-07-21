"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarPlus,
  ClipboardList,
  FileText,
  Plus,
  Trash2,
  X,
} from "lucide-react";

import type { TqmsAudit, TqmsAuditStatus } from "@/lib/tqms-data";
import { tqmsStatusClass } from "@/lib/tqms-data";
import {
  createAudit,
  createReport,
  deleteAudit,
  recordAuditFindings,
} from "@/lib/tqms-mock-store";
import { useTqmsMockStore } from "./useTqmsMockStore";
import {
  TqmsEmpty,
  TqmsKpiTile,
  TqmsSection,
  TqmsStatusPill,
  tqmsInputClass,
  tqmsLabelClass,
  tqmsPrimaryButtonClass,
  tqmsSecondaryButtonClass,
} from "./tqms-ui";

type AuditFormState = {
  title: string;
  scope: string;
  lead: string;
  scheduledFor: string;
  status: TqmsAuditStatus;
};

const emptyAuditForm = (): AuditFormState => ({
  title: "",
  scope: "",
  lead: "",
  scheduledFor: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().slice(0, 10),
  status: "Scheduled",
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

export default function InternalAuditsWorkspace() {
  const store = useTqmsMockStore();
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AuditFormState>(emptyAuditForm);
  const [notice, setNotice] = useState<string | null>(null);

  const audits = store.audits;

  const buckets = useMemo(() => {
    const upcoming = audits.filter((a) => a.status === "Scheduled" || a.status === "In Progress");
    const completed = audits.filter((a) => a.status === "Completed");
    const overdue = audits.filter((a) => a.status === "Overdue");
    const totalFindings = audits.reduce((sum, a) => sum + a.findings, 0);
    const openActions = audits.reduce((sum, a) => sum + a.actionsOpen, 0);
    return { upcoming, completed, overdue, totalFindings, openActions };
  }, [audits]);

  function handleSchedule() {
    if (!form.title.trim() || !form.lead.trim()) {
      setNotice("Title and audit lead are required.");
      return;
    }
    createAudit({
      title: form.title.trim(),
      scope: form.scope.trim() || "General",
      lead: form.lead.trim(),
      scheduledFor: form.scheduledFor,
      status: form.status,
    });
    setNotice(`Audit "${form.title.trim()}" scheduled.`);
    setFormOpen(false);
    setForm(emptyAuditForm());
  }

  function handleRecordFindings(audit: TqmsAudit) {
    const raw = window.prompt(`Enter number of findings for "${audit.title}":`, String(audit.findings));
    if (raw === null) return;
    const count = Number.parseInt(raw, 10);
    if (Number.isNaN(count) || count < 0) {
      setNotice("Enter a valid non-negative number.");
      return;
    }
    recordAuditFindings(audit.id, count);
    setNotice(`${count} finding(s) recorded for "${audit.title}".`);
  }

  function handleGenerateReport(audit: TqmsAudit) {
    createReport({
      name: `Audit Report — ${audit.title}`,
      kind: "Audit",
      format: "PDF",
      createdBy: audit.lead,
    });
    setNotice(`Audit report generated for "${audit.title}".`);
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <TqmsKpiTile label="Upcoming" value={buckets.upcoming.length} />
        <TqmsKpiTile label="Completed" value={buckets.completed.length} />
        <TqmsKpiTile label="Overdue" value={buckets.overdue.length} />
        <TqmsKpiTile label="Total Findings" value={buckets.totalFindings} />
        <TqmsKpiTile label="Open Actions" value={buckets.openActions} />
      </section>

      <TqmsSection
        title="Internal Audits"
        subtitle="Schedule audits, record findings, and generate audit reports."
        actions={
          <button type="button" className={tqmsPrimaryButtonClass()} onClick={() => setFormOpen(true)}>
            <CalendarPlus className="h-3.5 w-3.5" />
            Schedule Audit
          </button>
        }
      >
        {audits.length === 0 ? (
          <TqmsEmpty message="No audits scheduled yet." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Audit</th>
                  <th className="px-3 py-2.5 font-medium">Scope</th>
                  <th className="px-3 py-2.5 font-medium">Lead</th>
                  <th className="px-3 py-2.5 font-medium">Scheduled</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Findings</th>
                  <th className="px-3 py-2.5 font-medium">Actions Open</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {audits.map((audit) => (
                  <tr key={audit.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-medium text-white">{audit.title}</td>
                    <td className="max-w-[180px] px-3 py-2.5 text-white/60">{audit.scope}</td>
                    <td className="px-3 py-2.5 text-white/70">{audit.lead}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">{audit.scheduledFor}</td>
                    <td className="px-3 py-2.5">
                      <TqmsStatusPill className={tqmsStatusClass(audit.status)}>
                        {audit.status}
                      </TqmsStatusPill>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/70">{audit.findings}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/70">{audit.actionsOpen}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          className={actionClass("sky")}
                          onClick={() => handleRecordFindings(audit)}
                        >
                          <ClipboardList className="h-3 w-3" />
                          Findings
                        </button>
                        <button
                          type="button"
                          className={actionClass("emerald")}
                          onClick={() => handleGenerateReport(audit)}
                        >
                          <FileText className="h-3 w-3" />
                          Report
                        </button>
                        <button
                          type="button"
                          className={actionClass("rose")}
                          onClick={() => {
                            if (window.confirm(`Delete audit "${audit.title}"?`)) {
                              deleteAudit(audit.id);
                              setNotice(`Audit "${audit.title}" deleted.`);
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

      <div className="grid gap-4 lg:grid-cols-3">
        <TqmsSection title="Upcoming" subtitle="Scheduled and in-progress audits.">
          {buckets.upcoming.length === 0 ? (
            <TqmsEmpty message="No upcoming audits." />
          ) : (
            <ul className="space-y-2">
              {buckets.upcoming.map((audit) => (
                <li
                  key={audit.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-white">{audit.title}</p>
                  <p className="text-xs text-white/45">
                    {audit.lead} · {audit.scheduledFor}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        <TqmsSection title="Completed" subtitle="Audits with recorded outcomes.">
          {buckets.completed.length === 0 ? (
            <TqmsEmpty message="No completed audits yet." />
          ) : (
            <ul className="space-y-2">
              {buckets.completed.map((audit) => (
                <li
                  key={audit.id}
                  className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
                >
                  <p className="text-sm font-medium text-white">{audit.title}</p>
                  <p className="text-xs text-white/45">
                    {audit.findings} findings · {audit.actionsOpen} actions open
                  </p>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>

        <TqmsSection title="Overdue" subtitle="Past due audits requiring attention.">
          {buckets.overdue.length === 0 ? (
            <p className="text-sm text-white/45">No overdue audits.</p>
          ) : (
            <ul className="space-y-2">
              {buckets.overdue.map((audit) => (
                <li
                  key={audit.id}
                  className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-500/5 px-3 py-2.5"
                >
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-300" />
                  <div>
                    <p className="text-sm font-medium text-white">{audit.title}</p>
                    <p className="text-xs text-white/45">
                      Due {audit.scheduledFor} · {audit.findings} findings
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </TqmsSection>
      </div>

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">Schedule Audit</h3>
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
                <span className={tqmsLabelClass()}>Title</span>
                <input
                  className={tqmsInputClass()}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Scope</span>
                <input
                  className={tqmsInputClass()}
                  value={form.scope}
                  onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value }))}
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Audit Lead</span>
                <input
                  className={tqmsInputClass()}
                  value={form.lead}
                  onChange={(e) => setForm((f) => ({ ...f, lead: e.target.value }))}
                />
              </label>
              <label>
                <span className={tqmsLabelClass()}>Scheduled For</span>
                <input
                  type="date"
                  className={tqmsInputClass()}
                  value={form.scheduledFor}
                  onChange={(e) => setForm((f) => ({ ...f, scheduledFor: e.target.value }))}
                />
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={tqmsSecondaryButtonClass()} onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="button" className={tqmsPrimaryButtonClass()} onClick={handleSchedule}>
                <Plus className="h-3.5 w-3.5" />
                Schedule
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
