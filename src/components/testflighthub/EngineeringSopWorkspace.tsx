"use client";

import { useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Eye,
  FileText,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";

import {
  ENG_SOP_STATUSES,
  createEmptyEngSopSection,
  createEmptyEngSopStep,
  engSopStatusClass,
  normalizeEngSopSections,
  type EngSop,
  type EngSopSection,
  type EngSopStatus,
  type EngSopStep,
} from "@/lib/engineering-sop-data";
import {
  approveEngSop,
  archiveEngSop,
  createEngSop,
  deleteEngSop,
  submitEngSopForReview,
  updateEngSop,
} from "@/lib/engineering-sop-store";
import { useEngineeringSopStore } from "./useEngineeringSopStore";
import {
  WsEmpty,
  WsInputClass,
  WsLabelClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsSection,
  WsSlideOver,
  WsStatusPill,
} from "./domain-workspace-ui";

type SopFormState = {
  number: string;
  title: string;
  version: string;
  owner: string;
  status: EngSopStatus;
  effectiveDate: string;
  reviewDate: string;
  summary: string;
  tags: string;
  sections: EngSopSection[];
};

function emptyForm(): SopFormState {
  return {
    number: "",
    title: "",
    version: "1.0",
    owner: "",
    status: "Draft",
    effectiveDate: "",
    reviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
    summary: "",
    tags: "",
    sections: [createEmptyEngSopSection(1)],
  };
}

function sopToForm(sop: EngSop): SopFormState {
  return {
    number: sop.number,
    title: sop.title,
    version: sop.version,
    owner: sop.owner,
    status: sop.status,
    effectiveDate: sop.effectiveDate ?? "",
    reviewDate: sop.reviewDate,
    summary: sop.summary,
    tags: sop.tags.join(", "),
    sections: normalizeEngSopSections(
      sop.sections.length ? sop.sections.map((s) => ({ ...s, steps: [...s.steps] })) : [createEmptyEngSopSection(1)],
    ),
  };
}

function actionClass(tone: "sky" | "amber" | "rose" | "emerald") {
  const map = {
    sky: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
    emerald: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25",
  } as const;
  return `inline-flex h-7 shrink-0 items-center gap-0.5 rounded-md border px-1.5 text-[10px] font-semibold transition-colors ${map[tone]}`;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function flattenSopSteps(sop: EngSop) {
  const rows: { stepId: string; sectionId: string; globalOrder: number }[] = [];
  let n = 0;
  for (const section of sop.sections) {
    for (const step of section.steps) {
      n += 1;
      rows.push({ stepId: step.id, sectionId: section.id, globalOrder: n });
    }
  }
  return rows;
}

function EngSopReader({ sop, onClose }: { sop: EngSop; onClose: () => void }) {
  const flatSteps = useMemo(() => flattenSopSteps(sop), [sop]);
  const totalSteps = flatSteps.length;
  const [completed, setCompleted] = useState<Set<string>>(() => new Set());

  const completedCount = completed.size;
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
  const firstIncompleteId =
    flatSteps.find((row) => !completed.has(row.stepId))?.stepId ?? null;
  const allComplete = totalSteps > 0 && completedCount === totalSteps;

  function toggleStep(stepId: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(stepId)) next.delete(stepId);
      else next.add(stepId);
      return next;
    });
  }

  function resetProgress() {
    setCompleted(new Set());
  }

  let globalCounter = 0;

  return (
    <WsSlideOver
      title={sop.title}
      subtitle={`${sop.number} · v${sop.version} · Follow procedure`}
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-white/60">
            {allComplete
              ? "All steps complete — procedure finished."
              : `${completedCount} of ${totalSteps} steps complete`}
          </p>
          <button type="button" className={WsSecondaryButtonClass()} onClick={resetProgress}>
            <RotateCcw className="h-3.5 w-3.5" />
            Reset progress
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          <WsStatusPill className={engSopStatusClass(sop.status)}>{sop.status}</WsStatusPill>
          {sop.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/55"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between gap-2 text-sm">
            <span className="font-medium text-white">Procedure progress</span>
            <span className="tabular-nums text-white/60">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-white/50">
            Check off each step as you complete it. Progress is local to this session only.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <MetaCell label="Owner" value={sop.owner} />
          <MetaCell label="Effective" value={formatDate(sop.effectiveDate)} />
          <MetaCell label="Next review" value={formatDate(sop.reviewDate)} />
          <MetaCell label="Steps" value={`${completedCount} / ${totalSteps}`} />
        </div>

        {sop.summary ? (
          <p className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-relaxed text-white/80">
            {sop.summary}
          </p>
        ) : null}

        <div className="space-y-5">
          {sop.sections.map((section) => {
            const sectionStepIds = section.steps.map((s) => s.id);
            const sectionDone = sectionStepIds.filter((id) => completed.has(id)).length;
            const sectionTotal = sectionStepIds.length;

            return (
              <article key={section.id} className="rounded-xl border border-white/10 bg-[#0a1220]/80">
                <header className="border-b border-white/10 px-4 py-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                        Section {section.order} of {sop.sections.length}
                      </p>
                      <h3 className="mt-1 text-base font-semibold text-white">{section.title}</h3>
                      {section.purpose ? (
                        <p className="mt-1 text-sm text-white/60">{section.purpose}</p>
                      ) : null}
                    </div>
                    <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] tabular-nums text-white/55">
                      {sectionDone}/{sectionTotal} steps
                    </span>
                  </div>
                </header>
                <ol className="divide-y divide-white/5">
                  {section.steps.map((step) => {
                    globalCounter += 1;
                    const globalOrder = globalCounter;
                    const isDone = completed.has(step.id);
                    const isCurrent = step.id === firstIncompleteId;

                    return (
                      <li
                        key={step.id}
                        className={`px-4 py-3 transition-colors ${
                          isCurrent ? "bg-sky-500/[0.06]" : isDone ? "bg-emerald-500/[0.04]" : ""
                        }`}
                      >
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => toggleStep(step.id)}
                            aria-label={isDone ? `Mark step ${globalOrder} incomplete` : `Mark step ${globalOrder} complete`}
                            aria-pressed={isDone}
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                              isDone
                                ? "border-emerald-400/50 bg-emerald-500/20 text-emerald-100"
                                : isCurrent
                                  ? "border-sky-400/50 bg-sky-500/15 text-sky-100"
                                  : "border-white/20 bg-white/[0.04] text-white/40 hover:border-white/35 hover:text-white/70"
                            }`}
                          >
                            {isDone ? <Check className="h-3.5 w-3.5" /> : <span className="text-xs font-semibold">{globalOrder}</span>}
                          </button>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p
                                className={`font-medium ${isDone ? "text-white/45 line-through" : "text-white"}`}
                              >
                                {step.title}
                              </p>
                              {isCurrent ? (
                                <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-100">
                                  Current
                                </span>
                              ) : null}
                            </div>
                            <p
                              className={`mt-1 whitespace-pre-wrap text-sm leading-relaxed ${
                                isDone ? "text-white/40" : "text-white/75"
                              }`}
                            >
                              {step.body}
                            </p>
                            <p className="mt-2 text-[11px] text-white/35">
                              Step {globalOrder} of {totalSteps}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              </article>
            );
          })}
        </div>

        {sop.workflow.pendingApprovals.length > 0 ? (
          <p className="text-xs text-amber-200/80">
            Pending approval: {sop.workflow.pendingApprovals.join(", ")}
          </p>
        ) : null}
      </div>
    </WsSlideOver>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className={WsLabelClass()}>{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

function SectionEditor({
  section,
  sectionIndex,
  onChange,
  onRemove,
  canRemove,
}: {
  section: EngSopSection;
  sectionIndex: number;
  onChange: (next: EngSopSection) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  function updateStep(stepIndex: number, patch: Partial<EngSopStep>) {
    const steps = section.steps.map((row, idx) => (idx === stepIndex ? { ...row, ...patch } : row));
    onChange({ ...section, steps });
  }

  function addStep() {
    onChange({
      ...section,
      steps: [...section.steps, createEmptyEngSopStep(section.steps.length + 1)],
    });
  }

  function removeStep(stepIndex: number) {
    if (section.steps.length <= 1) return;
    onChange({ ...section, steps: section.steps.filter((_, idx) => idx !== stepIndex) });
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="mb-3 flex items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-white/45">
          Section {sectionIndex + 1}
        </p>
        {canRemove ? (
          <button type="button" className={WsSecondaryButtonClass()} onClick={onRemove}>
            Remove section
          </button>
        ) : null}
      </div>
      <div className="space-y-3">
        <label>
          <span className={WsLabelClass()}>Section title</span>
          <input
            className={WsInputClass()}
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
            placeholder="Pre-release verification"
          />
        </label>
        <label>
          <span className={WsLabelClass()}>Purpose (optional)</span>
          <input
            className={WsInputClass()}
            value={section.purpose ?? ""}
            onChange={(e) => onChange({ ...section, purpose: e.target.value })}
            placeholder="Why this section exists"
          />
        </label>
        <div className="space-y-3">
          {section.steps.map((step, stepIndex) => (
            <div key={step.id} className="rounded-lg border border-white/10 bg-white/[0.02] p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-medium text-white/50">Step {stepIndex + 1}</span>
                {section.steps.length > 1 ? (
                  <button
                    type="button"
                    className="text-[11px] text-rose-300/80 hover:text-rose-200"
                    onClick={() => removeStep(stepIndex)}
                  >
                    Remove step
                  </button>
                ) : null}
              </div>
              <label className="block">
                <span className={WsLabelClass()}>Step title</span>
                <input
                  className={WsInputClass()}
                  value={step.title}
                  onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                />
              </label>
              <label className="mt-2 block">
                <span className={WsLabelClass()}>Instructions</span>
                <textarea
                  className={`${WsInputClass()} min-h-[72px] resize-y`}
                  value={step.body}
                  onChange={(e) => updateStep(stepIndex, { body: e.target.value })}
                />
              </label>
            </div>
          ))}
          <button type="button" className={WsSecondaryButtonClass()} onClick={addStep}>
            Add step
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EngineeringSopWorkspace() {
  const store = useEngineeringSopStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<EngSopStatus | "All">("All");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<SopFormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<EngSop | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.sops.filter((sop) => {
      if (statusFilter !== "All" && sop.status !== statusFilter) return false;
      if (!q) return true;
      return (
        sop.number.toLowerCase().includes(q) ||
        sop.title.toLowerCase().includes(q) ||
        sop.owner.toLowerCase().includes(q) ||
        sop.tags.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [store.sops, search, statusFilter]);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setFormOpen(true);
  }

  function openEdit(sop: EngSop) {
    setEditingId(sop.id);
    setForm(sopToForm(sop));
    setFormOpen(true);
  }

  function updateSection(sectionIndex: number, next: EngSopSection) {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((row, idx) => (idx === sectionIndex ? next : row)),
    }));
  }

  function handleSubmit() {
    if (!form.number.trim() || !form.title.trim() || !form.owner.trim()) {
      setNotice("SOP number, title, and owner are required.");
      return;
    }
    const sections = normalizeEngSopSections(form.sections).filter(
      (sec) => sec.title.trim() || sec.steps.some((s) => s.title.trim() || s.body.trim()),
    );
    const tags = form.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const payload = {
      number: form.number.trim(),
      title: form.title.trim(),
      version: form.version.trim() || "1.0",
      owner: form.owner.trim(),
      status: form.status,
      effectiveDate: form.effectiveDate.trim() || null,
      reviewDate: form.reviewDate,
      summary: form.summary.trim(),
      tags,
      sections,
    };

    if (editingId) {
      updateEngSop(editingId, payload);
      setNotice(`${payload.number} updated.`);
    } else {
      createEngSop(payload);
      setNotice(`${payload.number} added to catalogue.`);
    }
    setFormOpen(false);
    setForm(emptyForm());
    setEditingId(null);
  }

  return (
    <div className="space-y-5">
      {notice ? (
        <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <WsSection
        title="Standard Operating Procedures"
        subtitle="Engineering SOP catalogue — version control, ownership, and structured procedures."
        actions={
          <button type="button" className={WsPrimaryButtonClass()} onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Create SOP
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap gap-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search number, title, owner, tags…"
              className={`${WsInputClass()} mt-0 pl-9`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as EngSopStatus | "All")}
            className={`${WsInputClass()} mt-0 w-auto min-w-[140px]`}
          >
            <option value="All">All statuses</option>
            {ENG_SOP_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <WsEmpty message="No SOPs match your filters." />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-white/10 bg-white/[0.03] text-[11px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-medium">SOP Number</th>
                  <th className="px-3 py-2.5 font-medium">Title</th>
                  <th className="px-3 py-2.5 font-medium">Version</th>
                  <th className="px-3 py-2.5 font-medium">Owner</th>
                  <th className="px-3 py-2.5 font-medium">Status</th>
                  <th className="px-3 py-2.5 font-medium">Effective</th>
                  <th className="px-3 py-2.5 font-medium">Review</th>
                  <th className="px-3 py-2.5 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.map((sop) => (
                  <tr key={sop.id} className="hover:bg-white/[0.02]">
                    <td className="px-3 py-2.5 font-mono text-xs text-sky-200">{sop.number}</td>
                    <td className="px-3 py-2.5 font-medium text-white">{sop.title}</td>
                    <td className="px-3 py-2.5 tabular-nums text-white/70">v{sop.version}</td>
                    <td className="px-3 py-2.5 text-white/70">{sop.owner}</td>
                    <td className="px-3 py-2.5">
                      <WsStatusPill className={engSopStatusClass(sop.status)}>{sop.status}</WsStatusPill>
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">
                      {formatDate(sop.effectiveDate)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">
                      {formatDate(sop.reviewDate)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <div className="flex flex-nowrap items-center gap-1">
                        <button
                          type="button"
                          className={actionClass("sky")}
                          onClick={() => setViewing(sop)}
                        >
                          <Eye className="h-3 w-3" />
                          View
                        </button>
                        <button type="button" className={actionClass("amber")} onClick={() => openEdit(sop)}>
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        {sop.status === "Draft" ? (
                          <button
                            type="button"
                            className={actionClass("sky")}
                            onClick={() => {
                              submitEngSopForReview(sop.id);
                              setNotice(`${sop.number} submitted for review.`);
                            }}
                          >
                            <FileText className="h-3 w-3" />
                            Review
                          </button>
                        ) : null}
                        {sop.status === "In Review" ? (
                          <button
                            type="button"
                            className={actionClass("emerald")}
                            onClick={() => {
                              approveEngSop(sop.id);
                              setNotice(`${sop.number} approved.`);
                            }}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Approve
                          </button>
                        ) : null}
                        {sop.status !== "Obsolete" ? (
                          <button
                            type="button"
                            className={actionClass("amber")}
                            onClick={() => {
                              archiveEngSop(sop.id);
                              setNotice(`${sop.number} marked obsolete.`);
                            }}
                          >
                            Archive
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={actionClass("rose")}
                          onClick={() => {
                            if (window.confirm(`Delete ${sop.number}?`)) {
                              deleteEngSop(sop.id);
                              setNotice(`${sop.number} removed.`);
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
      </WsSection>

      {viewing ? <EngSopReader sop={viewing} onClose={() => setViewing(null)} /> : null}

      {formOpen ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
          <div className="my-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                {editingId ? "Edit SOP" : "Create SOP"}
              </h3>
              <button
                type="button"
                className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5"
                onClick={() => setFormOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {!editingId ? (
                <label>
                  <span className={WsLabelClass()}>SOP Number</span>
                  <input
                    className={WsInputClass()}
                    value={form.number}
                    onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))}
                    placeholder="SOP-ENG-001"
                  />
                </label>
              ) : null}
              <label className={editingId ? "sm:col-span-2" : undefined}>
                <span className={WsLabelClass()}>Title</span>
                <input
                  className={WsInputClass()}
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </label>
              <label>
                <span className={WsLabelClass()}>Version</span>
                <input
                  className={WsInputClass()}
                  value={form.version}
                  onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))}
                />
              </label>
              <label>
                <span className={WsLabelClass()}>Owner</span>
                <input
                  className={WsInputClass()}
                  value={form.owner}
                  onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
                />
              </label>
              <label>
                <span className={WsLabelClass()}>Status</span>
                <select
                  className={WsInputClass()}
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as EngSopStatus }))
                  }
                >
                  {ENG_SOP_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className={WsLabelClass()}>Effective date</span>
                <input
                  type="date"
                  className={WsInputClass()}
                  value={form.effectiveDate}
                  onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                />
              </label>
              <label>
                <span className={WsLabelClass()}>Next review</span>
                <input
                  type="date"
                  className={WsInputClass()}
                  value={form.reviewDate}
                  onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={WsLabelClass()}>Summary</span>
                <textarea
                  className={`${WsInputClass()} min-h-[64px] resize-y`}
                  value={form.summary}
                  onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))}
                />
              </label>
              <label className="sm:col-span-2">
                <span className={WsLabelClass()}>Tags (comma-separated)</span>
                <input
                  className={WsInputClass()}
                  value={form.tags}
                  onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                  placeholder="release, deployment"
                />
              </label>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-white">Sections & steps</h4>
                <button
                  type="button"
                  className={WsSecondaryButtonClass()}
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      sections: [...prev.sections, createEmptyEngSopSection(prev.sections.length + 1)],
                    }))
                  }
                >
                  Add section
                </button>
              </div>
              {form.sections.map((section, sectionIndex) => (
                <SectionEditor
                  key={section.id}
                  section={section}
                  sectionIndex={sectionIndex}
                  onChange={(next) => updateSection(sectionIndex, next)}
                  onRemove={() =>
                    setForm((prev) => ({
                      ...prev,
                      sections: prev.sections.filter((_, idx) => idx !== sectionIndex),
                    }))
                  }
                  canRemove={form.sections.length > 1}
                />
              ))}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={WsSecondaryButtonClass()} onClick={() => setFormOpen(false)}>
                Cancel
              </button>
              <button type="button" className={WsPrimaryButtonClass()} onClick={handleSubmit}>
                {editingId ? "Save changes" : "Create SOP"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
