"use client";

import { useMemo, useState } from "react";
import { Check, X } from "lucide-react";

import {
  ENG_SOP_AUDIENCES,
  ENG_SOP_STATUSES,
  ENG_SOP_STEP_OUTCOMES,
  countSopSteps,
  createEmptyEngSopSection,
  createEmptyEngSopStep,
  engSopRunStatusClass,
  engSopStatusClass,
  flattenSopSteps,
  isEngSopDefinitionEditable,
  normalizeEngSopSections,
  type EngSop,
  type EngSopAudience,
  type EngSopRun,
  type EngSopSection,
  type EngSopStatus,
  type EngSopStep,
  type EngSopStepOutcome,
} from "@/lib/engineering-sop-data";
import {
  createEngineeringSopApi,
  completeEngineeringSopRunApi,
  completeEngineeringSopRunStepApi,
  deleteEngineeringSopApi,
  engineeringSopActionApi,
  updateEngineeringSopApi,
} from "@/lib/engineering-sop/client-api";
import {
  WsInputClass,
  WsLabelClass,
  WsPrimaryButtonClass,
  WsSecondaryButtonClass,
  WsStatusPill,
} from "./domain-workspace-ui";

export const DEFAULT_SOP_RUNNER = "Current Operator";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return iso.slice(0, 10);
}

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

function outcomeLabel(outcome: EngSopStepOutcome) {
  if (outcome === "pass") return "Pass";
  if (outcome === "fail") return "Fail";
  return "N/A";
}

// ─── Definition (read-only) ────────────────────────────────────────────────

export function EngSopDefinitionPanel({ sop, onClose }: { sop: EngSop; onClose: () => void }) {
  let globalCounter = 0;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1524] shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <header className="flex items-start justify-between gap-3 border-b border-white/10 px-5 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">SOP Definition</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{sop.title}</h3>
            <p className="mt-1 text-sm text-white/50">
              {sop.number} · v{sop.version} · Owner {sop.owner} · Approver {sop.approver}
            </p>
          </div>
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            Close
          </button>
        </header>
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap gap-2">
            <WsStatusPill className={engSopStatusClass(sop.status)}>{sop.status}</WsStatusPill>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase text-white/55">
              {sop.audience}
            </span>
          </div>
          {sop.summary ? <p className="text-sm leading-relaxed text-white/75">{sop.summary}</p> : null}
          <div className="grid gap-3 sm:grid-cols-3">
            <Meta label="Effective" value={formatDate(sop.effectiveDate)} />
            <Meta label="Next review" value={formatDate(sop.reviewDate)} />
            <Meta label="Steps" value={String(countSopSteps(sop))} />
          </div>
          {sop.sections.map((section) => (
            <article key={section.id} className="rounded-xl border border-white/10 bg-white/[0.02]">
              <header className="border-b border-white/10 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-white/40">Section {section.order}</p>
                <h4 className="font-medium text-white">{section.title}</h4>
              </header>
              <ol className="divide-y divide-white/5">
                {section.steps.map((step) => {
                  globalCounter += 1;
                  return (
                    <li key={step.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-white">
                        {globalCounter}. {step.title}
                        {step.required !== false ? (
                          <span className="ml-2 text-[10px] font-semibold uppercase text-amber-200/80">Required</span>
                        ) : null}
                      </p>
                      <p className="mt-1 text-sm text-white/65">{step.body}</p>
                    </li>
                  );
                })}
              </ol>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className={WsLabelClass()}>{label}</p>
      <p className="mt-1 text-sm text-white/85">{value}</p>
    </div>
  );
}

// ─── Manage (authoring + lifecycle) ────────────────────────────────────────

type ManageForm = {
  number: string;
  title: string;
  version: string;
  owner: string;
  approver: string;
  audience: EngSopAudience;
  status: EngSopStatus;
  effectiveDate: string;
  reviewDate: string;
  summary: string;
  tags: string;
  sections: EngSopSection[];
};

function sopToManageForm(sop: EngSop): ManageForm {
  return {
    number: sop.number,
    title: sop.title,
    version: sop.version,
    owner: sop.owner,
    approver: sop.approver,
    audience: sop.audience,
    status: sop.status,
    effectiveDate: sop.effectiveDate ?? "",
    reviewDate: sop.reviewDate,
    summary: sop.summary,
    tags: sop.tags.join(", "),
    sections: normalizeEngSopSections(sop.sections.map((s) => ({ ...s, steps: [...s.steps] }))),
  };
}

export function EngSopManagePanel({
  sop,
  onClose,
  onSaved,
  onDraftCreated,
}: {
  sop: EngSop;
  onClose: () => void;
  onSaved: (message: string) => void;
  onDraftCreated: (draft: EngSop) => void;
}) {
  const editable = isEngSopDefinitionEditable(sop);
  const [form, setForm] = useState<ManageForm>(() => sopToManageForm(sop));
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setNotice(null);
    try {
      await action();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!editable) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
        <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0b1524] p-5">
          <h3 className="text-lg font-semibold text-white">Manage approved SOP</h3>
          <p className="mt-2 text-sm text-white/65">
            Approved definitions are read-only. Create a draft revision to change content or metadata.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={WsPrimaryButtonClass(busy)}
              disabled={busy}
              onClick={() =>
                void runAction(async () => {
                  const draft = await engineeringSopActionApi(sop.id, "version");
                  onDraftCreated(draft);
                  onClose();
                })
              }
            >
              Create revision draft
            </button>
          </div>
        </div>
      </div>
    );
  }

  function save() {
    void runAction(async () => {
      const updated = await updateEngineeringSopApi(sop.id, {
        title: form.title.trim(),
        owner: form.owner.trim(),
        approver: form.approver.trim(),
        reviewDate: form.reviewDate,
        summary: form.summary.trim(),
        sections: form.sections,
      });
      onSaved(`${updated.number} saved.`);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1524] p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">Manage SOP</h3>
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            Close
          </button>
        </div>
        {notice ? <p className="mb-3 text-sm text-rose-200">{notice}</p> : null}
        <ManageFormFields form={form} setForm={setForm} showNumber={false} />
        <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
          {sop.status === "Draft" ? (
            <button
              type="button"
              className={WsSecondaryButtonClass()}
              disabled={busy}
              onClick={() =>
                void runAction(async () => {
                  await engineeringSopActionApi(sop.id, "submit");
                  onSaved(`${sop.number} submitted for review.`);
                  onClose();
                })
              }
            >
              Submit for review
            </button>
          ) : null}
          {sop.status === "In Review" ? (
            <button
              type="button"
              className={WsSecondaryButtonClass()}
              disabled={busy}
              onClick={() =>
                void runAction(async () => {
                  await engineeringSopActionApi(sop.id, "approve");
                  onSaved(`${sop.number} approved.`);
                  onClose();
                })
              }
            >
              Approve
            </button>
          ) : null}
          {sop.status !== "Obsolete" && sop.status !== "Retired" ? (
            <button
              type="button"
              className={WsSecondaryButtonClass()}
              disabled={busy}
              onClick={() =>
                void runAction(async () => {
                  await engineeringSopActionApi(sop.id, "retire");
                  onSaved(`${sop.number} archived.`);
                  onClose();
                })
              }
            >
              Archive
            </button>
          ) : null}
          <button
            type="button"
            className={WsSecondaryButtonClass()}
            disabled={busy}
            onClick={() => {
              if (!window.confirm(`Delete ${sop.number}?`)) return;
              void runAction(async () => {
                await deleteEngineeringSopApi(sop.id);
                onSaved(`${sop.number} deleted.`);
                onClose();
              });
            }}
          >
            Delete
          </button>
          <div className="flex-1" />
          <button type="button" className={WsPrimaryButtonClass(busy)} disabled={busy} onClick={save}>
            Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

export function EngSopCreatePanel({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (message: string) => void;
}) {
  const [form, setForm] = useState<ManageForm>({
    number: "",
    title: "",
    version: "1.0",
    owner: "",
    approver: "",
    audience: "internal",
    status: "Draft",
    effectiveDate: "",
    reviewDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10),
    summary: "",
    tags: "",
    sections: [createEmptyEngSopSection(1)],
  });

  const [busy, setBusy] = useState(false);

  function submit() {
    if (!form.number.trim() || !form.title.trim() || !form.owner.trim() || !form.approver.trim()) {
      return;
    }
    setBusy(true);
    void createEngineeringSopApi({
      number: form.number.trim(),
      title: form.title.trim(),
      owner: form.owner.trim(),
      approver: form.approver.trim(),
      reviewDate: form.reviewDate,
      summary: form.summary.trim(),
      sections: form.sections,
    })
      .then((created) => {
        onCreated(`${created.number} created.`);
        onClose();
      })
      .catch(() => {
        setBusy(false);
      });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="my-4 w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0b1524] p-5">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">New procedure</h3>
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <ManageFormFields form={form} setForm={setForm} showNumber />
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>
            Cancel
          </button>
          <button type="button" className={WsPrimaryButtonClass(busy)} disabled={busy} onClick={submit}>
            Create procedure
          </button>
        </div>
      </div>
    </div>
  );
}

function ManageFormFields({
  form,
  setForm,
  showNumber,
}: {
  form: ManageForm;
  setForm: React.Dispatch<React.SetStateAction<ManageForm>>;
  showNumber: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {showNumber ? (
          <label>
            <span className={WsLabelClass()}>SOP Number</span>
            <input className={WsInputClass()} value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
          </label>
        ) : null}
        <label className={showNumber ? undefined : "sm:col-span-2"}>
          <span className={WsLabelClass()}>Title</span>
          <input className={WsInputClass()} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </label>
        <label>
          <span className={WsLabelClass()}>Version</span>
          <input className={WsInputClass()} value={form.version} onChange={(e) => setForm((f) => ({ ...f, version: e.target.value }))} />
        </label>
        <label>
          <span className={WsLabelClass()}>Owner</span>
          <input className={WsInputClass()} value={form.owner} onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))} />
        </label>
        <label>
          <span className={WsLabelClass()}>Approver</span>
          <input className={WsInputClass()} value={form.approver} onChange={(e) => setForm((f) => ({ ...f, approver: e.target.value }))} />
        </label>
        <label>
          <span className={WsLabelClass()}>Audience</span>
          <select className={WsInputClass()} value={form.audience} onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as EngSopAudience }))}>
            {ENG_SOP_AUDIENCES.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </label>
        <label>
          <span className={WsLabelClass()}>Effective date</span>
          <input type="date" className={WsInputClass()} value={form.effectiveDate} onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))} />
        </label>
        <label>
          <span className={WsLabelClass()}>Next review</span>
          <input type="date" className={WsInputClass()} value={form.reviewDate} onChange={(e) => setForm((f) => ({ ...f, reviewDate: e.target.value }))} />
        </label>
        <label className="sm:col-span-2">
          <span className={WsLabelClass()}>Summary</span>
          <textarea className={`${WsInputClass()} min-h-[64px]`} value={form.summary} onChange={(e) => setForm((f) => ({ ...f, summary: e.target.value }))} />
        </label>
      </div>
      <SectionEditorList sections={form.sections} onChange={(sections) => setForm((f) => ({ ...f, sections }))} />
    </div>
  );
}

function SectionEditorList({
  sections,
  onChange,
}: {
  sections: EngSopSection[];
  onChange: (sections: EngSopSection[]) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-white">Sections & steps</h4>
        <button type="button" className={WsSecondaryButtonClass()} onClick={() => onChange([...sections, createEmptyEngSopSection(sections.length + 1)])}>
          Add section
        </button>
      </div>
      {sections.map((section, idx) => (
        <SectionEditor
          key={section.id}
          section={section}
          sectionIndex={idx}
          onChange={(next) => onChange(sections.map((s, i) => (i === idx ? next : s)))}
          onRemove={() => onChange(sections.filter((_, i) => i !== idx))}
          canRemove={sections.length > 1}
        />
      ))}
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
    onChange({ ...section, steps: section.steps.map((s, i) => (i === stepIndex ? { ...s, ...patch } : s)) });
  }

  return (
    <div className="rounded-xl border border-white/10 p-3">
      <div className="mb-2 flex justify-between">
        <span className="text-xs text-white/50">Section {sectionIndex + 1}</span>
        {canRemove ? (
          <button type="button" className="text-xs text-rose-300" onClick={onRemove}>Remove</button>
        ) : null}
      </div>
      <input className={`${WsInputClass()} mb-2`} placeholder="Section title" value={section.title} onChange={(e) => onChange({ ...section, title: e.target.value })} />
      {section.steps.map((step, stepIdx) => (
        <div key={step.id} className="mb-2 rounded-lg border border-white/10 p-2">
          <input className={`${WsInputClass()} mb-1`} placeholder="Step title" value={step.title} onChange={(e) => updateStep(stepIdx, { title: e.target.value })} />
          <textarea className={`${WsInputClass()} min-h-[56px]`} placeholder="Instructions" value={step.body} onChange={(e) => updateStep(stepIdx, { body: e.target.value })} />
        </div>
      ))}
      <button type="button" className={WsSecondaryButtonClass()} onClick={() => onChange({ ...section, steps: [...section.steps, createEmptyEngSopStep(section.steps.length + 1)] })}>
        Add step
      </button>
    </div>
  );
}

// ─── Run workspace ─────────────────────────────────────────────────────────

export function EngSopRunPanel({
  sop,
  run,
  runnerName,
  onClose,
  onComplete,
}: {
  sop: EngSop;
  run: EngSopRun;
  runnerName: string;
  onClose: () => void;
  onComplete: (run: EngSopRun) => void;
}) {
  const flat = useMemo(() => flattenSopSteps(sop), [sop]);
  const [runState, setRunState] = useState(run);
  const [outcome, setOutcome] = useState<EngSopStepOutcome>("pass");
  const [notes, setNotes] = useState("");
  const [evidenceRef, setEvidenceRef] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<"steps" | "signoff" | "summary">("steps");
  const [signComment, setSignComment] = useState("");
  const [finishedRun, setFinishedRun] = useState<EngSopRun | null>(null);
  const [busy, setBusy] = useState(false);

  const completedCount = runState.stepStates.filter((s) => s.completedAt).length;
  const progressPct = flat.length > 0 ? Math.round((completedCount / flat.length) * 100) : 0;
  const currentStepId = flat.find((row) => {
    const st = runState.stepStates.find((s) => s.stepId === row.stepId);
    return !st?.completedAt;
  })?.stepId ?? null;
  const currentRow = flat.find((r) => r.stepId === currentStepId);
  const allStepsDone = completedCount === flat.length && flat.length > 0;

  function completeCurrentStep() {
    if (!currentStepId || busy) return;
    setBusy(true);
    setError(null);
    void completeEngineeringSopRunStepApi(runState.runId, currentStepId, {
      outcome,
      notes,
      evidenceRefs: evidenceRef.trim() ? [evidenceRef.trim()] : [],
    })
      .then((nextRun) => {
        setRunState(nextRun);
        setNotes("");
        setEvidenceRef("");
        setOutcome("pass");
        if (nextRun.stepStates.every((s) => s.completedAt)) {
          setPhase("signoff");
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to complete step.");
      })
      .finally(() => setBusy(false));
  }

  function submitSignOff() {
    if (busy) return;
    setBusy(true);
    setError(null);
    void completeEngineeringSopRunApi(runState.runId)
      .then((nextRun) => {
        setFinishedRun(nextRun);
        setPhase("summary");
        onComplete(nextRun);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to complete run.");
      })
      .finally(() => setBusy(false));
  }

  if (phase === "summary" && finishedRun) {
    const fails = finishedRun.stepStates.filter((s) => s.outcome === "fail").length;
    const passes = finishedRun.stepStates.filter((s) => s.outcome === "pass").length;
    const nas = finishedRun.stepStates.filter((s) => s.outcome === "na").length;
    return (
      <RunShell title="Run complete" subtitle={`${sop.number} · v${sop.version}`} onClose={onClose}>
        <div className="space-y-4">
          <WsStatusPill className={engSopRunStatusClass(finishedRun.status)}>{finishedRun.status}</WsStatusPill>
          <div className="grid gap-3 sm:grid-cols-3">
            <Meta label="Total steps" value={String(flat.length)} />
            <Meta label="Pass / Fail / N/A" value={`${passes} / ${fails} / ${nas}`} />
            <Meta label="Signed off" value={formatDateTime(finishedRun.signOff?.signedAt ?? null)} />
          </div>
          <p className="text-sm text-white/70">
            Runner: {finishedRun.signOff?.signedBy} · {finishedRun.signOff?.comment || "No comment"}
          </p>
          <button type="button" className={WsPrimaryButtonClass()} onClick={onClose}>
            Close
          </button>
        </div>
      </RunShell>
    );
  }

  if (phase === "signoff") {
    return (
      <RunShell title="Sign-off" subtitle={`${sop.title} · all steps recorded`} onClose={onClose}>
        <div className="space-y-4">
          <p className="text-sm text-white/70">Confirm you have completed this procedure run.</p>
          <Meta label="Runner" value={runnerName} />
          <Meta label="Timestamp" value={formatDateTime(new Date().toISOString())} />
          <label>
            <span className={WsLabelClass()}>Comment (optional)</span>
            <textarea className={`${WsInputClass()} min-h-[72px]`} value={signComment} onChange={(e) => setSignComment(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-rose-200">{error}</p> : null}
          <div className="flex gap-2">
            <button type="button" className={WsSecondaryButtonClass()} onClick={() => setPhase("steps")}>
              Back
            </button>
            <button type="button" className={WsPrimaryButtonClass(busy)} disabled={busy} onClick={submitSignOff}>
              <Check className="h-3.5 w-3.5" />
              Sign off & complete run
            </button>
          </div>
        </div>
      </RunShell>
    );
  }

  return (
    <RunShell
      title={sop.title}
      subtitle={`${sop.number} · v${sop.version} · Runner ${runnerName}`}
      onClose={() => {
        if (window.confirm("Close this run? You can resume it from Active Runs.")) {
          onClose();
        }
      }}
    >
      <div className="space-y-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-white">Procedure progress</span>
            <span className="text-white/60">{progressPct}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-emerald-500 transition-[width]" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="mt-2 text-xs text-white/50">
            Step {completedCount + (allStepsDone ? 0 : 1)} of {flat.length}
            {currentRow ? ` · ${currentRow.section.title}` : ""}
          </p>
        </div>

        {currentRow ? (
          <article className="rounded-xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-sky-200/80">
              Current step {currentRow.globalOrder} of {flat.length}
              {currentRow.step.required !== false ? " · Required" : ""}
            </p>
            <h4 className="mt-1 text-lg font-semibold text-white">{currentRow.step.title}</h4>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{currentRow.step.body}</p>

            <div className="mt-4">
              <p className={WsLabelClass()}>Outcome</p>
              <div className="mt-1 flex flex-wrap gap-2">
                {ENG_SOP_STEP_OUTCOMES.map((o) => (
                  <button
                    key={o}
                    type="button"
                    className={`rounded-lg border px-3 py-1.5 text-sm ${
                      outcome === o
                        ? "border-sky-400/50 bg-sky-500/20 text-white"
                        : "border-white/15 text-white/60 hover:border-white/30"
                    }`}
                    onClick={() => setOutcome(o)}
                  >
                    {outcomeLabel(o)}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-3 block">
              <span className={WsLabelClass()}>Notes</span>
              <textarea className={`${WsInputClass()} min-h-[56px]`} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </label>

            <label className="mt-3 block">
              <span className={WsLabelClass()}>
                Evidence reference {currentRow.step.requiresEvidence ? "(required)" : "(optional)"}
              </span>
              <input
                className={WsInputClass()}
                placeholder="e.g. ticket-123, screenshot-url"
                value={evidenceRef}
                onChange={(e) => setEvidenceRef(e.target.value)}
              />
            </label>

            {error ? <p className="mt-2 text-sm text-rose-200">{error}</p> : null}

            <button type="button" className={`${WsPrimaryButtonClass(busy)} mt-4`} disabled={busy} onClick={completeCurrentStep}>
              Complete step
            </button>
          </article>
        ) : allStepsDone ? (
          <button type="button" className={WsPrimaryButtonClass()} onClick={() => setPhase("signoff")}>
            Proceed to sign-off
          </button>
        ) : null}

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/40">Procedure outline</p>
          {flat.map((row) => {
            const st = runState.stepStates.find((s) => s.stepId === row.stepId);
            const done = Boolean(st?.completedAt);
            const isCurrent = row.stepId === currentStepId;
            return (
              <div
                key={row.stepId}
                className={`rounded-lg border px-3 py-2 text-sm ${
                  isCurrent ? "border-sky-400/30 bg-sky-500/10" : done ? "border-emerald-400/20 bg-emerald-500/5" : "border-white/10 opacity-60"
                }`}
              >
                <span className="font-medium text-white">
                  {row.globalOrder}. {row.step.title}
                </span>
                {done && st?.outcome ? (
                  <span className="ml-2 text-xs text-white/50">{outcomeLabel(st.outcome)}</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </RunShell>
  );
}

function RunShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
      <button type="button" aria-label="Close" className="flex-1" onClick={onClose} />
      <aside className="flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-[#0b1524] shadow-2xl">
        <header className="border-b border-white/10 px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">SOP Run</p>
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-white/50">{subtitle}</p>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </aside>
    </div>
  );
}
