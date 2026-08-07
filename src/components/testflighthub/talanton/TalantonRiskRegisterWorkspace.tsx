"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { Plus, Search, Trash2, X } from "lucide-react";

import {
  archiveTiRisk,
  computeTiRiskRating,
  deleteTiRisk,
  getTiRiskRegisterServerSnapshot,
  getTiRiskRegisterState,
  listActiveTiRisks,
  restoreTiRisk,
  subscribeTiRiskRegister,
  upsertTiRisk,
  type TiRiskLevel,
  type TiRiskRegisterEntry,
} from "@/lib/talanton/risk-register-store";
import { getTiDemoApprovedBoardPacks as boardPacks } from "@/lib/talanton/board-portal-data";
import {
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "@/components/testflighthub/corporate-ui";
import { cn } from "@/lib/utils";

const RISK_LEVELS: TiRiskLevel[] = ["H", "M", "L"];
const STATUS_OPTIONS = ["Open", "Mitigating", "Watch", "Closed"] as const;

type RiskFormState = {
  id?: string;
  description: string;
  owner: string;
  impact: TiRiskLevel;
  likelihood: TiRiskLevel;
  mitigation: string;
  status: string;
  dateAdded: string;
  reviewDate: string;
  boardPackId: string;
  boardPackLabel: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function emptyForm(): RiskFormState {
  return {
    description: "",
    owner: "",
    impact: "M",
    likelihood: "M",
    mitigation: "",
    status: "Open",
    dateAdded: todayIso(),
    reviewDate: todayIso(),
    boardPackId: "",
    boardPackLabel: "",
  };
}

function formFrom(risk: TiRiskRegisterEntry): RiskFormState {
  return {
    id: risk.id,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    mitigation: risk.mitigation,
    status: risk.status,
    dateAdded: risk.dateAdded,
    reviewDate: risk.reviewDate,
    boardPackId: risk.boardPackId,
    boardPackLabel: risk.boardPackLabel,
  };
}

function useTiRiskStore() {
  return useSyncExternalStore(
    subscribeTiRiskRegister,
    getTiRiskRegisterState,
    getTiRiskRegisterServerSnapshot,
  );
}

export default function TalantonRiskRegisterWorkspace() {
  const store = useTiRiskStore();
  const packs = useMemo(() => boardPacks(), []);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<RiskFormState>(emptyForm());

  const risks = useMemo(() => {
    const rows = showArchived ? store.risks : listActiveTiRisks();
    const query = q.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((risk) => {
      const hay = `${risk.id} ${risk.description} ${risk.owner} ${risk.mitigation} ${risk.boardPackLabel}`.toLowerCase();
      return hay.includes(query);
    });
  }, [store.risks, showArchived, q]);

  const highCount = store.risks.filter((r) => !r.archived && r.impact === "H").length;

  function openCreate() {
    setForm(emptyForm());
    setEditorOpen(true);
  }

  function openEdit(risk: TiRiskRegisterEntry) {
    setForm(formFrom(risk));
    setEditorOpen(true);
  }

  function saveForm() {
    if (!form.description.trim()) return;
    const pack = packs.find((p) => p.id === form.boardPackId);
    upsertTiRisk({
      ...form,
      boardPackLabel: pack?.packName ?? form.boardPackLabel,
      rating: computeTiRiskRating(form.impact, form.likelihood),
    });
    setEditorOpen(false);
    setForm(emptyForm());
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
            Talanton Impact · Board
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">Risk Register</h2>
          <p className="mt-1 text-sm text-white/55">
            Add, edit, and link risks to board packs. Changes persist in this browser.
          </p>
        </div>
        <button type="button" className={corporatePrimaryButtonClass()} onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add risk
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Active risks" value={listActiveTiRisks().length} hint="Open register" />
        <CorporateKpiTile label="High impact" value={highCount} hint="Impact H" />
        <CorporateKpiTile label="Linked to packs" value={store.risks.filter((r) => r.boardPackId).length} hint="Board pack refs" />
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search risks, owners, board packs…"
            className={cn(corporateInputClass, "pl-9")}
          />
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-white/60">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-white/20"
          />
          Show archived
        </label>
      </div>

      <CorporateSection title="Risk register" subtitle="Date added, mitigation, and board pack linkage.">
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.14em] text-white/40">
              <tr>
                <th className="px-3 py-3">Risk</th>
                <th className="px-3 py-3">Date added</th>
                <th className="px-3 py-3">Impact</th>
                <th className="px-3 py-3">Likelihood</th>
                <th className="px-3 py-3">Rating</th>
                <th className="px-3 py-3">Owner</th>
                <th className="px-3 py-3">Board pack</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {risks.map((risk) => (
                <tr key={risk.id} className="border-t border-white/8 text-white/75">
                  <td className="px-3 py-3">
                    <p className="font-medium text-white/90">{risk.id}</p>
                    <p className="mt-0.5 max-w-xs text-xs text-white/55">{risk.description}</p>
                    <p className="mt-1 max-w-xs text-[11px] text-white/40">{risk.mitigation}</p>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">{risk.dateAdded}</td>
                  <td className="px-3 py-3">{risk.impact}</td>
                  <td className="px-3 py-3">{risk.likelihood}</td>
                  <td className="px-3 py-3">{risk.rating}</td>
                  <td className="px-3 py-3">{risk.owner}</td>
                  <td className="px-3 py-3 max-w-[10rem] text-xs">
                    {risk.boardPackLabel ? (
                      <span className="text-emerald-200/80">{risk.boardPackLabel}</span>
                    ) : (
                      <span className="text-white/35">—</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <CorporateStatusPill
                      className={
                        risk.archived
                          ? "border-white/15 bg-white/5 text-white/50"
                          : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                      }
                    >
                      {risk.archived ? "Archived" : risk.status}
                    </CorporateStatusPill>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      <button
                        type="button"
                        className={corporateSecondaryButtonClass()}
                        onClick={() => openEdit(risk)}
                      >
                        Edit
                      </button>
                      {risk.archived ? (
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => restoreTiRisk(risk.id)}
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          className={corporateSecondaryButtonClass()}
                          onClick={() => archiveTiRisk(risk.id)}
                        >
                          Archive
                        </button>
                      )}
                      <button
                        type="button"
                        className={corporateSecondaryButtonClass()}
                        onClick={() => {
                          if (window.confirm(`Delete ${risk.id}?`)) deleteTiRisk(risk.id);
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CorporateSection>

      {editorOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <form
            className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl border border-white/10 bg-[#0b1a14] p-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveForm();
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold text-white">
                {form.id ? `Edit ${form.id}` : "New risk"}
              </h3>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-white/50" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <label className="block text-[11px] text-white/45">
                Description
                <textarea
                  className={cn(corporateInputClass, "mt-1 min-h-[80px]")}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </label>
              <label className="block text-[11px] text-white/45">
                Owner
                <input
                  className={cn(corporateInputClass, "mt-1")}
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] text-white/45">
                  Impact
                  <select
                    className={cn(corporateInputClass, "mt-1")}
                    value={form.impact}
                    onChange={(e) =>
                      setForm({ ...form, impact: e.target.value as TiRiskLevel })
                    }
                  >
                    {RISK_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-[11px] text-white/45">
                  Likelihood
                  <select
                    className={cn(corporateInputClass, "mt-1")}
                    value={form.likelihood}
                    onChange={(e) =>
                      setForm({ ...form, likelihood: e.target.value as TiRiskLevel })
                    }
                  >
                    {RISK_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block text-[11px] text-white/45">
                  Date added
                  <input
                    type="date"
                    className={cn(corporateInputClass, "mt-1")}
                    value={form.dateAdded}
                    onChange={(e) => setForm({ ...form, dateAdded: e.target.value })}
                  />
                </label>
                <label className="block text-[11px] text-white/45">
                  Review date
                  <input
                    type="date"
                    className={cn(corporateInputClass, "mt-1")}
                    value={form.reviewDate}
                    onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                  />
                </label>
              </div>
              <label className="block text-[11px] text-white/45">
                Mitigation
                <textarea
                  className={cn(corporateInputClass, "mt-1 min-h-[72px]")}
                  value={form.mitigation}
                  onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
                />
              </label>
              <label className="block text-[11px] text-white/45">
                Status
                <select
                  className={cn(corporateInputClass, "mt-1")}
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-[11px] text-white/45">
                Link to board pack
                <select
                  className={cn(corporateInputClass, "mt-1")}
                  value={form.boardPackId}
                  onChange={(e) => {
                    const pack = packs.find((p) => p.id === e.target.value);
                    setForm({
                      ...form,
                      boardPackId: e.target.value,
                      boardPackLabel: pack?.packName ?? "",
                    });
                  }}
                >
                  <option value="">None</option>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.packName}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" className={corporateSecondaryButtonClass()} onClick={() => setEditorOpen(false)}>
                Cancel
              </button>
              <button type="submit" className={corporatePrimaryButtonClass()}>
                Save risk
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
