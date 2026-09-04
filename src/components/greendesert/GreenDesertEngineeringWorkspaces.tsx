"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import {
  GREENDESERT_ENGINEERING_MILESTONES,
  GREENDESERT_ENGINEERING_PROGRAMS,
  GREENDESERT_ENGINEERING_RISKS,
  GREENDESERT_UTILISATION_HEATMAP,
  type GreenDesertEngMilestone,
  type GreenDesertEngProgram,
  type GreenDesertEngRisk,
} from "@/lib/greendesert/greendesert-engineering-data";
import { cn } from "@/lib/utils";
import { WsPrimaryButtonClass, WsSecondaryButtonClass } from "@/components/testflighthub/domain-workspace-ui";

const STORAGE_KEY = "unit311-greendesert-engineering-v1";

type EngineeringState = {
  programs: GreenDesertEngProgram[];
  milestones: GreenDesertEngMilestone[];
  risks: GreenDesertEngRisk[];
};

function loadState(): EngineeringState {
  if (typeof window === "undefined") {
    return {
      programs: GREENDESERT_ENGINEERING_PROGRAMS.map((row) => ({ ...row })),
      milestones: GREENDESERT_ENGINEERING_MILESTONES.map((row) => ({ ...row })),
      risks: GREENDESERT_ENGINEERING_RISKS.map((row) => ({ ...row })),
    };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error("missing");
    return JSON.parse(raw) as EngineeringState;
  } catch {
    return {
      programs: GREENDESERT_ENGINEERING_PROGRAMS.map((row) => ({ ...row })),
      milestones: GREENDESERT_ENGINEERING_MILESTONES.map((row) => ({ ...row })),
      risks: GREENDESERT_ENGINEERING_RISKS.map((row) => ({ ...row })),
    };
  }
}

function persistState(state: EngineeringState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function inputClass() {
  return "mt-1 w-full rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40";
}

function ragClass(status: string) {
  const key = status.toLowerCase();
  if (key.includes("on_track") || key.includes("complete") || key === "closed") {
    return "border-emerald-400/30 bg-emerald-500/15 text-emerald-100";
  }
  if (key.includes("at_risk") || key.includes("mitigating") || key.includes("in_progress")) {
    return "border-amber-400/30 bg-amber-500/15 text-amber-100";
  }
  return "border-rose-400/30 bg-rose-500/15 text-rose-100";
}

function heatColor(pct: number) {
  if (pct >= 90) return "bg-rose-500/80 text-white";
  if (pct >= 75) return "bg-amber-500/70 text-white";
  if (pct >= 60) return "bg-emerald-500/60 text-white";
  return "bg-sky-500/40 text-white/90";
}

export function GreenDesertEngineeringProgramsWorkspace() {
  const [state, setState] = useState<EngineeringState>(() => loadState());
  const [programEditor, setProgramEditor] = useState<Partial<GreenDesertEngProgram> & { id?: string } | null>(
    null,
  );
  const [milestoneEditor, setMilestoneEditor] = useState<
    (Partial<GreenDesertEngMilestone> & { id?: string }) | null
  >(null);

  useEffect(() => {
    persistState(state);
  }, [state]);

  const programNameById = useMemo(
    () => new Map(state.programs.map((program) => [program.id, program.name])),
    [state.programs],
  );

  const saveProgram = useCallback(() => {
    if (!programEditor?.name?.trim()) return;
    const row: GreenDesertEngProgram = {
      id: programEditor.id ?? `gd-eng-${Date.now()}`,
      name: programEditor.name.trim(),
      owner: programEditor.owner?.trim() || "Unassigned",
      status: (programEditor.status as GreenDesertEngProgram["status"]) ?? "on_track",
      budgetUsd: Number(programEditor.budgetUsd) || 0,
      spentUsd: Number(programEditor.spentUsd) || 0,
      summary: programEditor.summary?.trim() || "",
    };
    setState((current) => ({
      ...current,
      programs: current.programs.some((item) => item.id === row.id)
        ? current.programs.map((item) => (item.id === row.id ? row : item))
        : [...current.programs, row],
    }));
    setProgramEditor(null);
  }, [programEditor]);

  const saveMilestone = useCallback(() => {
    if (!milestoneEditor?.title?.trim()) return;
    const row: GreenDesertEngMilestone = {
      id: milestoneEditor.id ?? `gd-ms-${Date.now()}`,
      programId: milestoneEditor.programId || state.programs[0]?.id || "gd-eng-p1",
      title: milestoneEditor.title.trim(),
      owner: milestoneEditor.owner?.trim() || "Unassigned",
      dueDate: milestoneEditor.dueDate || new Date().toISOString().slice(0, 10),
      status: (milestoneEditor.status as GreenDesertEngMilestone["status"]) ?? "planned",
    };
    setState((current) => ({
      ...current,
      milestones: current.milestones.some((item) => item.id === row.id)
        ? current.milestones.map((item) => (item.id === row.id ? row : item))
        : [...current.milestones, row],
    }));
    setMilestoneEditor(null);
  }, [milestoneEditor, state.programs]);

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <h1 className="text-xl font-semibold text-white">Programs & Milestones</h1>
        <p className="mt-1 text-sm text-white/55">
          Algae cultivation programmes for Jeddah pilot deployment and Saudi protein scale-up.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Programs</h2>
          <button
            type="button"
            className={WsPrimaryButtonClass()}
            onClick={() => setProgramEditor({ name: "", owner: "", status: "on_track", budgetUsd: 0, spentUsd: 0, summary: "" })}
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add program
          </button>
        </div>
        <div className="space-y-2">
          {state.programs.map((program) => (
            <div
              key={program.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{program.name}</p>
                <p className="mt-1 text-xs text-white/50">{program.summary}</p>
                <p className="mt-1 text-xs text-white/40">
                  {program.owner} · ${program.spentUsd.toLocaleString()} / $
                  {program.budgetUsd.toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", ragClass(program.status))}>
                  {program.status.replace("_", " ")}
                </span>
                <button type="button" className={WsSecondaryButtonClass()} onClick={() => setProgramEditor(program)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={WsSecondaryButtonClass()}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      programs: current.programs.filter((item) => item.id !== program.id),
                      milestones: current.milestones.filter((item) => item.programId !== program.id),
                    }))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-white">Milestones</h2>
          <button
            type="button"
            className={WsPrimaryButtonClass()}
            onClick={() =>
              setMilestoneEditor({
                title: "",
                owner: "",
                programId: state.programs[0]?.id,
                dueDate: new Date().toISOString().slice(0, 10),
                status: "planned",
              })
            }
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            Add milestone
          </button>
        </div>
        <div className="space-y-2">
          {state.milestones.map((milestone) => (
            <div
              key={milestone.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-white">{milestone.title}</p>
                <p className="text-xs text-white/45">
                  {programNameById.get(milestone.programId) ?? "Program"} · {milestone.owner} ·{" "}
                  {milestone.dueDate}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", ragClass(milestone.status))}>
                  {milestone.status.replace("_", " ")}
                </span>
                <button type="button" className={WsSecondaryButtonClass()} onClick={() => setMilestoneEditor(milestone)}>
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  className={WsSecondaryButtonClass()}
                  onClick={() =>
                    setState((current) => ({
                      ...current,
                      milestones: current.milestones.filter((item) => item.id !== milestone.id),
                    }))
                  }
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {programEditor ? (
        <EditorPanel title={programEditor.id ? "Edit program" : "Add program"} onClose={() => setProgramEditor(null)} onSave={saveProgram}>
          <label className="block text-xs text-white/55">Name<input className={inputClass()} value={programEditor.name ?? ""} onChange={(e) => setProgramEditor((c) => ({ ...c, name: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Owner<input className={inputClass()} value={programEditor.owner ?? ""} onChange={(e) => setProgramEditor((c) => ({ ...c, owner: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Status<select className={inputClass()} value={programEditor.status ?? "on_track"} onChange={(e) => setProgramEditor((c) => ({ ...c, status: e.target.value as GreenDesertEngProgram["status"] }))}><option value="on_track">On track</option><option value="at_risk">At risk</option><option value="delayed">Delayed</option></select></label>
          <label className="block text-xs text-white/55">Summary<input className={inputClass()} value={programEditor.summary ?? ""} onChange={(e) => setProgramEditor((c) => ({ ...c, summary: e.target.value }))} /></label>
        </EditorPanel>
      ) : null}

      {milestoneEditor ? (
        <EditorPanel title={milestoneEditor.id ? "Edit milestone" : "Add milestone"} onClose={() => setMilestoneEditor(null)} onSave={saveMilestone}>
          <label className="block text-xs text-white/55">Title<input className={inputClass()} value={milestoneEditor.title ?? ""} onChange={(e) => setMilestoneEditor((c) => ({ ...c, title: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Program<select className={inputClass()} value={milestoneEditor.programId ?? ""} onChange={(e) => setMilestoneEditor((c) => ({ ...c, programId: e.target.value }))}>{state.programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
          <label className="block text-xs text-white/55">Owner<input className={inputClass()} value={milestoneEditor.owner ?? ""} onChange={(e) => setMilestoneEditor((c) => ({ ...c, owner: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Due date<input type="date" className={inputClass()} value={milestoneEditor.dueDate ?? ""} onChange={(e) => setMilestoneEditor((c) => ({ ...c, dueDate: e.target.value }))} /></label>
        </EditorPanel>
      ) : null}
    </div>
  );
}

export function GreenDesertEngineeringRisksWorkspace() {
  const [risks, setRisks] = useState<GreenDesertEngRisk[]>(() => loadState().risks);
  const [editor, setEditor] = useState<Partial<GreenDesertEngRisk> & { id?: string } | null>(null);

  useEffect(() => {
    const state = loadState();
    state.risks = risks;
    persistState(state);
  }, [risks]);

  const saveRisk = () => {
    if (!editor?.title?.trim()) return;
    const row: GreenDesertEngRisk = {
      id: editor.id ?? `gd-risk-${Date.now()}`,
      title: editor.title.trim(),
      owner: editor.owner?.trim() || "Unassigned",
      severity: (editor.severity as GreenDesertEngRisk["severity"]) ?? "medium",
      likelihood: (editor.likelihood as GreenDesertEngRisk["likelihood"]) ?? "medium",
      status: (editor.status as GreenDesertEngRisk["status"]) ?? "open",
      mitigation: editor.mitigation?.trim() || "",
    };
    setRisks((current) =>
      current.some((item) => item.id === row.id)
        ? current.map((item) => (item.id === row.id ? row : item))
        : [...current, row],
    );
    setEditor(null);
  };

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <h1 className="text-xl font-semibold text-white">Engineering Risks</h1>
        <p className="mt-1 text-sm text-white/55">
          Cultivation, supply-chain, and regulatory risks for Green Desert algae programmes.
        </p>
      </header>
      <div className="flex justify-end">
        <button type="button" className={WsPrimaryButtonClass()} onClick={() => setEditor({ title: "", owner: "", severity: "medium", likelihood: "medium", status: "open", mitigation: "" })}>
          <Plus className="mr-1 inline h-3.5 w-3.5" />
          Add risk
        </button>
      </div>
      <div className="space-y-2">
        {risks.map((risk) => (
          <div key={risk.id} className="rounded-xl border border-white/10 bg-[#0b1524]/70 px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">{risk.title}</p>
              <div className="flex gap-2">
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", ragClass(risk.severity))}>{risk.severity}</span>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase", ragClass(risk.status))}>{risk.status}</span>
              </div>
            </div>
            <p className="mt-2 text-xs text-white/50">{risk.mitigation}</p>
            <p className="mt-1 text-xs text-white/40">{risk.owner} · likelihood {risk.likelihood}</p>
            <div className="mt-2 flex gap-2">
              <button type="button" className={WsSecondaryButtonClass()} onClick={() => setEditor(risk)}><Pencil className="h-3.5 w-3.5" /></button>
              <button type="button" className={WsSecondaryButtonClass()} onClick={() => setRisks((current) => current.filter((item) => item.id !== risk.id))}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>
      {editor ? (
        <EditorPanel title={editor.id ? "Edit risk" : "Add risk"} onClose={() => setEditor(null)} onSave={saveRisk}>
          <label className="block text-xs text-white/55">Title<input className={inputClass()} value={editor.title ?? ""} onChange={(e) => setEditor((c) => ({ ...c, title: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Owner<input className={inputClass()} value={editor.owner ?? ""} onChange={(e) => setEditor((c) => ({ ...c, owner: e.target.value }))} /></label>
          <label className="block text-xs text-white/55">Mitigation<input className={inputClass()} value={editor.mitigation ?? ""} onChange={(e) => setEditor((c) => ({ ...c, mitigation: e.target.value }))} /></label>
        </EditorPanel>
      ) : null}
    </div>
  );
}

export function GreenDesertEngineeringCapacityWorkspace() {
  const engineers = [...new Set(GREENDESERT_UTILISATION_HEATMAP.map((cell) => cell.engineer))];
  const weeks = [...new Set(GREENDESERT_UTILISATION_HEATMAP.map((cell) => cell.week))];
  const lookup = new Map(
    GREENDESERT_UTILISATION_HEATMAP.map((cell) => [`${cell.engineer}:${cell.week}`, cell.utilisationPct]),
  );

  return (
    <div className="space-y-4">
      <header className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4">
        <h1 className="text-xl font-semibold text-white">Team & Capacity</h1>
        <p className="mt-1 text-sm text-white/55">Weekly utilisation heatmap for Jeddah engineering squad.</p>
      </header>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
        <table className="min-w-full text-left text-sm">
          <thead>
            <tr>
              <th className="px-3 py-2 text-xs uppercase tracking-wide text-white/45">Engineer</th>
              {weeks.map((week) => (
                <th key={week} className="px-3 py-2 text-xs uppercase tracking-wide text-white/45">{week}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {engineers.map((engineer) => (
              <tr key={engineer} className="border-t border-white/10">
                <td className="px-3 py-2 font-medium text-white">{engineer}</td>
                {weeks.map((week) => {
                  const pct = lookup.get(`${engineer}:${week}`) ?? 0;
                  return (
                    <td key={week} className="px-3 py-2">
                      <div className={cn("rounded-lg px-2 py-1 text-center text-xs font-semibold", heatColor(pct))}>
                        {pct}%
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function EditorPanel({
  title,
  children,
  onClose,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave: () => void;
}) {
  return (
    <section className="rounded-2xl border border-emerald-400/25 bg-emerald-500/5 p-4">
      <p className="text-sm font-medium text-white">{title}</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">{children}</div>
      <div className="mt-3 flex gap-2">
        <button type="button" className={WsPrimaryButtonClass()} onClick={onSave}>Save</button>
        <button type="button" className={WsSecondaryButtonClass()} onClick={onClose}>Cancel</button>
      </div>
    </section>
  );
}
