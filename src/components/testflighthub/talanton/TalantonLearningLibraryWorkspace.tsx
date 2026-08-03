"use client";

import { useMemo, useState } from "react";

import {
  LEARNING_CATEGORIES,
  LEARNING_LIBRARY,
  type LearningCategory,
} from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import { TalantonIntelligenceHeader } from "./talanton-intelligence-ui";

const selectClass =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-emerald-400/40";

export default function TalantonLearningLibraryWorkspace() {
  const [category, setCategory] = useState<LearningCategory | "all">("all");
  const [audience, setAudience] = useState<"all" | "Internal Staff" | "Portfolio Companies" | "Both">(
    "all",
  );

  const courses = useMemo(() => {
    return LEARNING_LIBRARY.filter((c) => {
      if (category !== "all" && c.category !== category) return false;
      if (audience !== "all" && c.audience !== audience && c.audience !== "Both") return false;
      return true;
    });
  }, [category, audience]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Learning Library"
        description="Talanton-focused curricula for governance, leadership, financial management, impact measurement, ESG, operations and growth — for staff and portfolio companies."
      />

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value as LearningCategory | "all")}
          >
            <option value="all">All categories</option>
            {LEARNING_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
          >
            <option value="all">All audiences</option>
            <option value="Internal Staff">Internal staff</option>
            <option value="Portfolio Companies">Portfolio companies</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        {LEARNING_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              category === c
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/50 hover:text-white",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <article
            key={c.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/45 via-[#0b1a14]/85 to-[#08110d] p-5"
          >
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
              {c.category}
            </p>
            <h3 className="mt-2 text-base font-semibold text-white">{c.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-white/60">{c.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                {c.level}
              </span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                {c.durationHours}h · {c.modules} modules
              </span>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                {c.audience}
              </span>
              {c.certification ? (
                <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">
                  Certification
                </span>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
