"use client";

import { useMemo, useState } from "react";
import { Archive, Plus, Search, X } from "lucide-react";

import {
  abhiRiskRegisterTrendFromLabel,
  abhiRiskRegisterTrendLabel,
  archiveAbhiRisk,
  computeAbhiRiskRating,
  deleteAbhiRisk,
  upsertAbhiRisk,
  type AbhiRiskLevel,
  type AbhiRiskRegisterEntry,
  type AbhiRiskTrendLabel,
  type AbhiRiskTrendSymbol,
} from "@/lib/abhi/risk-register-store";
import {
  CorporateFieldLabel,
  CorporateKpiTile,
  CorporateSection,
  CorporateStatusPill,
  corporateInputClass,
  corporatePrimaryButtonClass,
  corporateSecondaryButtonClass,
} from "./corporate-ui";
import { useRiskRegisterStore } from "./useRiskRegisterStore";

const RISK_LEVELS: AbhiRiskLevel[] = ["H", "M", "L"];
const TREND_LABELS: AbhiRiskTrendLabel[] = ["Increasing", "Stable", "Reducing"];
const STATUS_OPTIONS = ["Active", "Mitigating", "New", "Monitoring", "Closed"] as const;

type RiskFormState = {
  id?: string;
  description: string;
  owner: string;
  impact: AbhiRiskLevel;
  likelihood: AbhiRiskLevel;
  rating: string;
  trendLabel: AbhiRiskTrendLabel;
  mitigation: string;
  status: string;
  dateRaised: string;
  reviewDate: string;
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
    rating: String(computeAbhiRiskRating("M", "M")),
    trendLabel: "Stable",
    mitigation: "",
    status: "Active",
    dateRaised: todayIso(),
    reviewDate: todayIso(),
  };
}

function formFrom(risk: AbhiRiskRegisterEntry): RiskFormState {
  return {
    id: risk.id,
    description: risk.description,
    owner: risk.owner,
    impact: risk.impact,
    likelihood: risk.likelihood,
    rating: String(risk.rating),
    trendLabel: abhiRiskRegisterTrendLabel(risk.trend),
    mitigation: risk.mitigation,
    status: risk.status === "Archived" ? "Active" : risk.status,
    dateRaised: risk.dateRaised,
    reviewDate: risk.reviewDate,
  };
}

function formatShortDate(dateKey: string) {
  if (!dateKey) return "—";
  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${dateKey}T12:00:00`));
}

function ratingTone(rating: number) {
  if (rating >= 15) return "border-rose-400/35 bg-rose-500/15 text-rose-100";
  if (rating >= 9) return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  return "border-emerald-400/35 bg-emerald-500/15 text-emerald-100";
}

function statusTone(status: string) {
  const key = status.toLowerCase();
  if (key === "active" || key === "new") {
    return "border-sky-400/35 bg-sky-500/15 text-sky-100";
  }
  if (key === "mitigating") {
    return "border-violet-400/35 bg-violet-500/15 text-violet-100";
  }
  if (key === "monitoring") {
    return "border-amber-400/35 bg-amber-500/15 text-amber-100";
  }
  if (key === "archived" || key === "closed") {
    return "border-white/15 bg-white/[0.04] text-white/55";
  }
  return "border-white/15 bg-white/[0.04] text-white/70";
}

function trendDisplay(trend: AbhiRiskTrendSymbol) {
  return `${trend} ${abhiRiskRegisterTrendLabel(trend)}`;
}

function actionClass(tone: "sky" | "amber" | "rose" | "violet") {
  const map = {
    sky: "border-sky-400/40 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    amber: "border-amber-400/40 bg-amber-500/15 text-amber-100 hover:bg-amber-500/25",
    rose: "border-rose-400/40 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25",
    violet: "border-violet-400/40 bg-violet-500/15 text-violet-100 hover:bg-violet-500/25",
  } as const;
  return `inline-flex h-8 items-center rounded-lg border px-2.5 text-[11px] font-semibold transition-colors ${map[tone]}`;
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm sm:p-8">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0b1524] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button
            type="button"
            className="rounded-lg border border-white/10 p-1.5 text-white/50 hover:bg-white/5 hover:text-white"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 p-3">
      <p className="text-[10px] uppercase tracking-[0.12em] text-white/45">{label}</p>
      <div className="mt-1 text-sm text-white/80">{value || "—"}</div>
    </div>
  );
}

export default function RiskRegisterWorkspace() {
  const store = useRiskRegisterStore();
  const [search, setSearch] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [form, setForm] = useState<RiskFormState | null>(null);
  const [viewRisk, setViewRisk] = useState<AbhiRiskRegisterEntry | null>(null);

  const activeRisks = useMemo(
    () => store.risks.filter((row) => !row.archived),
    [store.risks],
  );
  const archivedCount = store.risks.length - activeRisks.length;
  const highCount = activeRisks.filter((row) => row.rating >= 15).length;
  const dueSoonCount = activeRisks.filter((row) => {
    if (!row.reviewDate) return false;
    const due = new Date(`${row.reviewDate}T12:00:00`).getTime();
    const now = Date.now();
    const days = (due - now) / (1000 * 60 * 60 * 24);
    return days <= 30;
  }).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return store.risks
      .filter((row) => (showArchived ? true : !row.archived))
      .filter((row) => {
        if (!q) return true;
        return [
          row.id,
          row.description,
          row.owner,
          row.status,
          row.mitigation,
        ]
          .join(" ")
          .toLowerCase()
          .includes(q);
      })
      .slice()
      .sort((a, b) => b.rating - a.rating || a.id.localeCompare(b.id));
  }, [search, showArchived, store.risks]);

  function openCreate() {
    setForm(emptyForm());
  }

  function openEdit(risk: AbhiRiskRegisterEntry) {
    setViewRisk(null);
    setForm(formFrom(risk));
  }

  function saveForm() {
    if (!form?.description.trim()) return;
    const ratingNum = Number(form.rating);
    upsertAbhiRisk({
      id: form.id,
      description: form.description,
      owner: form.owner,
      impact: form.impact,
      likelihood: form.likelihood,
      rating: Number.isFinite(ratingNum)
        ? ratingNum
        : computeAbhiRiskRating(form.impact, form.likelihood),
      trend: abhiRiskRegisterTrendFromLabel(form.trendLabel),
      mitigation: form.mitigation,
      status: form.status,
      dateRaised: form.dateRaised,
      reviewDate: form.reviewDate,
      archived: false,
    });
    setForm(null);
  }

  function handleDelete(risk: AbhiRiskRegisterEntry) {
    if (!window.confirm(`Permanently delete risk ${risk.id}?`)) return;
    deleteAbhiRisk(risk.id);
    if (viewRisk?.id === risk.id) setViewRisk(null);
  }

  function handleArchive(risk: AbhiRiskRegisterEntry) {
    archiveAbhiRisk(risk.id, true);
    if (viewRisk?.id === risk.id) setViewRisk(null);
  }

  function handleRestore(risk: AbhiRiskRegisterEntry) {
    archiveAbhiRisk(risk.id, false);
  }

  function updateFormLevel(
    field: "impact" | "likelihood",
    value: AbhiRiskLevel,
  ) {
    setForm((prev) => {
      if (!prev) return prev;
      const impact = field === "impact" ? value : prev.impact;
      const likelihood = field === "likelihood" ? value : prev.likelihood;
      const prevComputed = computeAbhiRiskRating(prev.impact, prev.likelihood);
      const currentRating = Number(prev.rating);
      const shouldRecompute =
        !Number.isFinite(currentRating) || currentRating === prevComputed;
      return {
        ...prev,
        [field]: value,
        rating: shouldRecompute
          ? String(computeAbhiRiskRating(impact, likelihood))
          : prev.rating,
      };
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-300/90">
          Corporate Information
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">Risk Register</h2>
        <p className="mt-1 max-w-2xl text-sm text-white/50">
          Track organisational risks, owners, ratings, and mitigations. Seeded from the
          current board pack register.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <CorporateKpiTile label="Active risks" value={activeRisks.length} />
        <CorporateKpiTile label="High rating" value={highCount} hint="Score ≥ 15" />
        <CorporateKpiTile
          label="Review due (30d)"
          value={dueSoonCount}
          hint="Needs attention"
        />
        <CorporateKpiTile label="Archived" value={archivedCount} />
      </section>

      <CorporateSection
        title="Risk register"
        subtitle="Impact, likelihood, trend, and mitigation status."
        actions={
          <button type="button" className={corporatePrimaryButtonClass()} onClick={openCreate}>
            <Plus className="h-3.5 w-3.5" />
            Add risk
          </button>
        }
      >
        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2">
            <CorporateFieldLabel>Search</CorporateFieldLabel>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                className={`${corporateInputClass()} pl-9`}
                placeholder="Risk ID, description, owner…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-white/70">
              <input
                type="checkbox"
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
                className="rounded border-white/20"
              />
              Show archived
            </label>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Risk</th>
                <th className="px-4 py-3">Owner</th>
                <th className="px-4 py-3">I / L</th>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Trend</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Review</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-sm text-white/45">
                    No risks match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((risk) => (
                  <tr
                    key={risk.id}
                    className={`border-b border-white/8 text-white/85 ${
                      risk.archived ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-medium tabular-nums text-white">
                      {risk.id}
                    </td>
                    <td className="max-w-[280px] px-4 py-3">
                      <button
                        type="button"
                        className="text-left hover:text-white"
                        onClick={() => setViewRisk(risk)}
                      >
                        {risk.description}
                      </button>
                    </td>
                    <td className="px-4 py-3">{risk.owner || "—"}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {risk.impact}/{risk.likelihood}
                    </td>
                    <td className="px-4 py-3">
                      <CorporateStatusPill className={ratingTone(risk.rating)}>
                        {risk.rating}
                      </CorporateStatusPill>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {trendDisplay(risk.trend)}
                    </td>
                    <td className="px-4 py-3">
                      <CorporateStatusPill
                        className={statusTone(risk.archived ? "Archived" : risk.status)}
                      >
                        {risk.archived ? "Archived" : risk.status}
                      </CorporateStatusPill>
                    </td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatShortDate(risk.reviewDate)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className={actionClass("sky")}
                          onClick={() => setViewRisk(risk)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className={actionClass("violet")}
                          onClick={() => openEdit(risk)}
                        >
                          Edit
                        </button>
                        {risk.archived ? (
                          <button
                            type="button"
                            className={actionClass("amber")}
                            onClick={() => handleRestore(risk)}
                          >
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className={actionClass("amber")}
                            onClick={() => handleArchive(risk)}
                          >
                            Archive
                          </button>
                        )}
                        <button
                          type="button"
                          className={actionClass("rose")}
                          onClick={() => handleDelete(risk)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CorporateSection>

      {viewRisk ? (
        <Modal title={`${viewRisk.id} · Risk detail`} onClose={() => setViewRisk(null)}>
          <div className="space-y-4">
            <p className="text-sm text-white/80">{viewRisk.description}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Info label="Owner" value={viewRisk.owner} />
              <Info
                label="Status"
                value={viewRisk.archived ? "Archived" : viewRisk.status}
              />
              <Info
                label="Impact / Likelihood"
                value={`${viewRisk.impact} / ${viewRisk.likelihood}`}
              />
              <Info label="Rating" value={viewRisk.rating} />
              <Info label="Trend" value={trendDisplay(viewRisk.trend)} />
              <Info label="Date raised" value={formatShortDate(viewRisk.dateRaised)} />
              <Info label="Review date" value={formatShortDate(viewRisk.reviewDate)} />
            </div>
            <Info label="Mitigation" value={viewRisk.mitigation || "—"} />
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setViewRisk(null)}
              >
                Close
              </button>
              {!viewRisk.archived ? (
                <button
                  type="button"
                  className={corporateSecondaryButtonClass()}
                  onClick={() => handleArchive(viewRisk)}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
              ) : null}
              <button
                type="button"
                className={corporatePrimaryButtonClass()}
                onClick={() => openEdit(viewRisk)}
              >
                Edit
              </button>
            </div>
          </div>
        </Modal>
      ) : null}

      {form ? (
        <Modal title={form.id ? `Edit ${form.id}` : "Add risk"} onClose={() => setForm(null)}>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              saveForm();
            }}
          >
            <div>
              <CorporateFieldLabel>Risk description</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[88px]`}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <CorporateFieldLabel>Owner</CorporateFieldLabel>
                <input
                  className={corporateInputClass()}
                  value={form.owner}
                  onChange={(e) => setForm({ ...form, owner: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Status</CorporateFieldLabel>
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
                  {!STATUS_OPTIONS.includes(
                    form.status as (typeof STATUS_OPTIONS)[number],
                  ) ? (
                    <option value={form.status}>{form.status}</option>
                  ) : null}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Impact</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.impact}
                  onChange={(e) =>
                    updateFormLevel("impact", e.target.value as AbhiRiskLevel)
                  }
                >
                  {RISK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Likelihood</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.likelihood}
                  onChange={(e) =>
                    updateFormLevel("likelihood", e.target.value as AbhiRiskLevel)
                  }
                >
                  {RISK_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Rating</CorporateFieldLabel>
                <input
                  type="number"
                  min={0}
                  className={corporateInputClass()}
                  value={form.rating}
                  onChange={(e) => setForm({ ...form, rating: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Trend</CorporateFieldLabel>
                <select
                  className={corporateInputClass()}
                  value={form.trendLabel}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      trendLabel: e.target.value as AbhiRiskTrendLabel,
                    })
                  }
                >
                  {TREND_LABELS.map((label) => (
                    <option key={label} value={label}>
                      {label} ({abhiRiskRegisterTrendFromLabel(label)})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <CorporateFieldLabel>Date raised</CorporateFieldLabel>
                <input
                  type="date"
                  className={corporateInputClass()}
                  value={form.dateRaised}
                  onChange={(e) => setForm({ ...form, dateRaised: e.target.value })}
                />
              </div>
              <div>
                <CorporateFieldLabel>Review date</CorporateFieldLabel>
                <input
                  type="date"
                  className={corporateInputClass()}
                  value={form.reviewDate}
                  onChange={(e) => setForm({ ...form, reviewDate: e.target.value })}
                />
              </div>
            </div>
            <div>
              <CorporateFieldLabel>Mitigation</CorporateFieldLabel>
              <textarea
                className={`${corporateInputClass()} min-h-[88px]`}
                value={form.mitigation}
                onChange={(e) => setForm({ ...form, mitigation: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2 pt-2">
              <button
                type="button"
                className={corporateSecondaryButtonClass()}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button type="submit" className={corporatePrimaryButtonClass()}>
                {form.id ? "Save changes" : "Create risk"}
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}
