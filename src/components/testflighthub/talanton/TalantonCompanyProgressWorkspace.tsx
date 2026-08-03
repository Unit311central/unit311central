"use client";

import { useMemo, useState } from "react";

import { buildCompanyLearningRows } from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

export default function TalantonCompanyProgressWorkspace() {
  const rows = useMemo(() => buildCompanyLearningRows(), []);
  const [selectedId, setSelectedId] = useState(rows[0]?.company.id ?? "");
  const selected = rows.find((r) => r.company.id === selectedId) ?? rows[0];

  const avg = Math.round(rows.reduce((s, r) => s + r.completionPct, 0) / Math.max(rows.length, 1));
  const best = Math.max(...rows.map((r) => r.completionPct));
  const worst = Math.min(...rows.map((r) => r.completionPct));

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Company Progress"
        description="Compare learning progress across Talanton portfolio companies — completion, certifications, recommended learning and participation trends."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <TalantonImpactMetric label="Portfolio avg completion" value={`${avg}%`} />
        <TalantonImpactMetric label="Highest completion" value={`${best}%`} tone="good" />
        <TalantonImpactMetric label="Lowest completion" value={`${worst}%`} tone="alert" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <aside className="space-y-2">
          {rows.map((r) => (
            <button
              key={r.company.id}
              type="button"
              onClick={() => setSelectedId(r.company.id)}
              className={cn(
                "w-full rounded-2xl border px-3.5 py-3 text-left transition",
                selected?.company.id === r.company.id
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 bg-black/20 hover:border-white/20",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium text-white">{r.company.name}</p>
                <span className="text-xs tabular-nums text-emerald-200">{r.completionPct}%</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-emerald-400/80"
                  style={{ width: `${r.completionPct}%` }}
                />
              </div>
            </button>
          ))}
        </aside>

        {selected ? (
          <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/55 via-[#0b1a14]/90 to-[#08110d] p-6">
            <h2 className="text-xl font-semibold text-white">{selected.company.name}</h2>
            <p className="mt-1 text-sm text-white/50">
              {selected.company.country} · {selected.company.sector} · {selected.status}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-3">
                <p className="text-[10px] uppercase text-white/40">Course completion</p>
                <p className="mt-1 text-2xl font-semibold text-white">{selected.completionPct}%</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-3">
                <p className="text-[10px] uppercase text-white/40">Completed / assigned</p>
                <p className="mt-1 text-2xl font-semibold text-white">
                  {selected.completed}/{selected.assigned}
                </p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-3">
                <p className="text-[10px] uppercase text-white/40">Certifications</p>
                <p className="mt-1 text-2xl font-semibold text-white">{selected.certifications}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/25 px-3 py-3">
                <p className="text-[10px] uppercase text-white/40">Last activity</p>
                <p className="mt-1 text-lg font-semibold text-white">{selected.lastActivity}</p>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                Recommended learning
              </h3>
              <ul className="mt-2 space-y-2">
                {selected.recommended.map((title) => (
                  <li
                    key={title}
                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-2 text-sm text-white/75"
                  >
                    {title}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                Participation trend (demo)
              </h3>
              <div className="mt-3 flex items-end gap-2">
                {[42, 55, 48, 61, 70, selected.completionPct].map((v, i) => (
                  <div key={i} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-md bg-emerald-400/70"
                      style={{ height: `${Math.max(8, v * 0.9)}px` }}
                    />
                    <span className="text-[10px] text-white/35">M{i + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </article>
        ) : null}
      </div>
    </div>
  );
}
