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
const LIKELIHOOD_ORDER: TiRiskLevel[] = ["L", "M", "H"];
const IMPACT_ORDER: TiRiskLevel[] = ["H", "M", "L"];
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

function heatCellTone(rating: number) {
  if (rating >= 15) return "border-rose-400/40 bg-rose-500/25 text-rose-50";
  if (rating >= 9) return "border-amber-400/35 bg-amber-500/20 text-amber-50";
  if (rating >= 3) return "border-yellow-400/25 bg-yellow-500/10 text-yellow-100";
  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
}

function ratingForCell(impact: TiRiskLevel, likelihood: TiRiskLevel) {
  return computeTiRiskRating(impact, likelihood);
}

const fieldLabel = "mb-1 block text-xs font-medium text-white/55";

export default function TalantonRiskRegisterWorkspace() {
  const store = useTiRiskStore();
  const packs = useMemo(() => boardPacks(), []);
  const [q, setQ] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState<RiskFormState>(emptyForm());
  const [heatmapFocus, setHeatmapFocus] = useState<{ impact: TiRiskLevel; likelihood: TiRiskLevel } | null>(
    null,
  );

  const activeRisks = useMemo(
    () => store.risks.filter((r) => !r.archived),
    [store.risks],
  );

  const risks = useMemo(() => {
    const rows = showArchived ? store.risks : activeRisks;
    const query = q.trim().toLowerCase();
    let filtered = rows;
    if (heatmapFocus) {
      filtered = filtered.filter(
        (r) => r.impact === heatmapFocus.impact && r.likelihood === heatmapFocus.likelihood,
      );
    }
    if (!query) return filtered;
    return filtered.filter((risk) => {
      const hay = `${risk.id} ${risk.description} ${risk.owner} ${risk.mitigation} ${risk.boardPackLabel}`.toLowerCase();
      return hay.includes(query);
    });
  }, [store.risks, showArchived, q, heatmapFocus, activeRisks]);

  const risksByCell = useMemo(() => {
    const map = new Map<string, TiRiskRegisterEntry[]>();
    for (const risk of activeRisks) {
      const key = `${risk.impact}:${risk.likelihood}`;
      const list = map.get(key) ?? [];
      list.push(risk);
      map.set(key, list);
    }
    return map;
  }, [activeRisks]);

  const highCount = activeRisks.filter((r) => r.impact === "H").length;

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

  function onHeatCellClick(impact: TiRiskLevel, likelihood: TiRiskLevel) {
    const cellRisks = risksByCell.get(`${impact}:${likelihood}`) ?? [];
    if (cellRisks.length === 1) {
      openEdit(cellRisks[0]!);
      return;
    }
    setHeatmapFocus((prev) =>
      prev?.impact === impact && prev.likelihood === likelihood ? null : { impact, likelihood },
    );
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
            View, add, and manage risks by impact and likelihood. Changes persist in this browser.
          </p>
        </div>
        <button type="button" className={corporatePrimaryButtonClass()} onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add risk
        </button>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <CorporateKpiTile label="Active risks" value={activeRisks.length} hint="Open register" />
        <CorporateKpiTile label="High impact" value={highCount} hint="Impact H" />
        <CorporateKpiTile
          label="Linked to packs"
          value={store.risks.filter((r) => r.boardPackId).length}
          hint="Board pack refs"
        />
      </section>

      <CorporateSection
        title="Risk heat map"
        subtitle="Impact × likelihood — cell colour reflects resulting risk score (H=5, M=3, L=1). Click a cell to filter or open a single risk."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-1 text-left text-xs">
            <thead>
              <tr>
                <th className="min-w-[88px] px-2 py-2 text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
                  Impact ↓ / Likelihood →
                </th>
                {LIKELIHOOD_ORDER.map((level) => (
                  <th
                    key={level}
                    className="min-w-[72px] px-1 py-2 text-center text-[10px] font-medium uppercase tracking-[0.12em] text-white/45"
                  >
                    {level}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {IMPACT_ORDER.map((impact) => (
                <tr key={impact}>
                  <td className="rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-[11px] font-semibold text-white/70">
                    {impact}
                  </td>
                  {LIKELIHOOD_ORDER.map((likelihood) => {
                    const cellRisks = risksByCell.get(`${impact}:${likelihood}`) ?? [];
                    const count = cellRisks.length;
                    const rating = ratingForCell(impact, likelihood);
                    const focused =
                      heatmapFocus?.impact === impact && heatmapFocus.likelihood === likelihood;
                    return (
                      <td key={`${impact}-${likelihood}`} className="p-0.5">
                        <button
                          type="button"
                          title={`Impact ${impact} · Likelihood ${likelihood} · Score ${rating} · ${count} risk(s)`}
                          onClick={() => onHeatCellClick(impact, likelihood)}
                          className={cn(
                            "flex h-14 w-full min-w-[72px] flex-col items-center justify-center rounded-lg border text-center transition hover:ring-1 hover:ring-emerald-400/40",
                            heatCellTone(rating),
                            focused && "ring-2 ring-emerald-300/60",
                            count === 0 && "opacity-40",
                          )}
                        >
                          <span className="text-sm font-semibold tabular-nums">{count > 0 ? count : "—"}</span>
                          <span className="text-[9px] uppercase tracking-wide opacity-80">Score {rating}</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {heatmapFocus ? (
          <button
            type="button"
            className={cn(corporateSecondaryButtonClass(), "mt-3")}
            onClick={() => setHeatmapFocus(null)}
          >
            Clear heat map filter ({heatmapFocus.impact} × {heatmapFocus.likelihood})
          </button>
        ) : null}
      </CorporateSection>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {risks.slice(0, 6).map((risk) => (
          <button
            key={risk.id}
            type="button"
            onClick={() => openEdit(risk)}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-emerald-400/30 hover:bg-emerald-500/[0.06]"
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-200/90">{risk.id}</span>
              <CorporateStatusPill className="border-white/15 bg-white/5 text-white/60">
                {risk.impact}/{risk.likelihood}
              </CorporateStatusPill>
              <span className="text-[10px] text-white/40">Rating {risk.rating}</span>
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-white">{risk.description}</p>
            <p className="mt-2 text-xs text-white/45">{risk.owner} · {risk.status}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative block min-w-[220px] flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search risks, owners, board packs…"
            className={cn(corporateInputClass(), "pl-9")}
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

      <CorporateSection title="Risk register" subtitle="Full register with edit and delete.">
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
                <tr
                  key={risk.id}
                  className="cursor-pointer border-t border-white/8 text-white/75 hover:bg-white/[0.03]"
                  onClick={() => openEdit(risk)}
                >
                  <td className="px-3 py-3">
                    <p className="font-medium text-white/90">{risk.id}</p>
                    <p className="mt-0.5 max-w-xs text-xs text-white/55">{risk.description}</p>
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
                  <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
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
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0b1a14] shadow-xl"
            onSubmit={(e) => {
              e.preventDefault();
              saveForm();
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-white/10 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {form.id ? `Edit ${form.id}` : "New risk"}
                </h3>
                <p className="text-xs text-white/45">Talanton governance risk register</p>
              </div>
              <button type="button" onClick={() => setEditorOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-white/50" />
              </button>
            </div>
            <div className="space-y-5 overflow-y-auto px-5 py-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                  Risk information
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="block sm:col-span-2">
                    <span className={fieldLabel}>Description</span>
                    <textarea
                      className={cn(corporateInputClass(), "min-h-[88px]")}
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Owner</span>
                    <input
                      className={corporateInputClass()}
                      value={form.owner}
                      onChange={(e) => setForm({ ...form, owner: e.target.value })}
                    />
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <label className="block">
                      <span className={fieldLabel}>Impact</span>
                      <select
                        className={corporateInputClass()}
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
                    <label className="block">
                      <span className={fieldLabel}>Likelihood</span>
                      <select
                        className={corporateInputClass()}
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
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                  Review
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className={fieldLabel}>Date added</span>
                    <input
                      type="date"
                      className={corporateInputClass()}
                      value={form.dateAdded}
                      onChange={(e) => setForm({ ...form, dateAdded: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Review date</span>
                    <input
                      type="date"
                      className={corporateInputClass()}
                      value={form.reviewDate}
                      onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                    />
                  </label>
                  <label className="block">
                    <span className={fieldLabel}>Status</span>
                    <select
                      className={corporateInputClass()}
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
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                  Mitigation
                </p>
                <label className="mt-3 block">
                  <span className={fieldLabel}>Mitigation</span>
                  <textarea
                    className={cn(corporateInputClass(), "min-h-[80px]")}
                    value={form.mitigation}
                    onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
                  />
                </label>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80">
                  Governance
                </p>
                <label className="mt-3 block">
                  <span className={fieldLabel}>Link to board pack</span>
                  <select
                    className={corporateInputClass()}
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
            </div>
            <div className="flex justify-end gap-2 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setEditorOpen(false)}
              >
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
