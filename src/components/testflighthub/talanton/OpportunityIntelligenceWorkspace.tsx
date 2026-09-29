"use client";

import { AlertTriangle, Database } from "lucide-react";

import { buildOpportunityBriefing } from "@/lib/talanton/opportunity-intelligence";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonIntelligenceHeader,
  UNAVAILABLE_LABEL,
} from "./talanton-intelligence-ui";
import { useTalantonMemo } from "@/lib/talanton/use-talanton-intelligence-briefing";

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function OpportunityIntelligenceWorkspace() {
  const briefing = useTalantonMemo(() => buildOpportunityBriefing());
  const { health } = briefing;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Opportunity Intelligence"
        title="Opportunity Intelligence"
        description="Pipeline and sourcing intelligence for Talanton’s faith-driven impact investing mandate. Live metrics require database-backed opportunity records."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              Updated {formatShortDate(briefing.asOf)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 font-medium text-amber-100">
              <Database className="h-3.5 w-3.5" />
              Pipeline data not connected
            </span>
          </div>
        }
      />

      <div
        className={cn(
          "rounded-2xl border border-amber-400/25 bg-amber-500/10 px-5 py-4 text-sm leading-relaxed text-amber-50/90",
        )}
      >
        <p className="flex items-start gap-2 font-medium">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          {briefing.pipelineUnavailableReason}
        </p>
        <p className="mt-2 text-amber-100/70">
          Missing data source: a Supabase (or API) table for Talanton opportunity / pipeline records (e.g. deal stage,
          sector, region, conviction score). Configured prospect fixtures are not shown as live intelligence.
        </p>
      </div>

      <TalantonGeneratedPanel
        eyebrow="Scorecard"
        title="Opportunity Health Score"
        copyText={health.healthText}
      >
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/55">{health.postureReason}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {(
            [
              { label: "Opportunity Health Score", hint: "Requires pipeline records" },
              { label: "Pipeline Depth", hint: "Active prospects under review" },
              { label: "High Conviction", hint: "Score ≥ 82" },
              { label: "Coverage", hint: "Sectors and regions" },
            ] as const
          ).map((item) => (
            <div
              key={item.label}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {item.label}
              </p>
              <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white/35">
                {UNAVAILABLE_LABEL}
              </p>
              <p className="mt-1 text-[11px] leading-snug text-white/35">{item.hint}</p>
            </div>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel title="Opportunity Executive Briefing" copyText={briefing.briefingText}>
        <p className="text-sm leading-relaxed text-white/60">
          AI Opportunity Executive Briefing content is unavailable until pipeline records are persisted and wired to
          this module.
        </p>
      </TalantonGeneratedPanel>
    </div>
  );
}
