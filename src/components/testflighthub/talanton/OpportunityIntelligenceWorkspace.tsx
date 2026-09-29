"use client";

import { AlertTriangle, Database } from "lucide-react";

import { buildOpportunityBriefing } from "@/lib/talanton/opportunity-intelligence";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
  UNAVAILABLE_LABEL,
} from "./talanton-intelligence-ui";
import { useTalantonMemo } from "@/lib/talanton/use-talanton-intelligence-briefing";

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function BriefingTile({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/60">{body}</p>
    </div>
  );
}

export default function OpportunityIntelligenceWorkspace() {
  const briefing = useTalantonMemo(() => buildOpportunityBriefing());

  const mainTiles = [
    { label: "Opportunity Health Score", hint: "Requires pipeline records" },
    { label: "Pipeline Depth", hint: "Active prospects under review" },
    { label: "High Conviction", hint: "Score ≥ 82" },
    { label: "Sectors Covered", hint: "Distinct sectors in pipeline" },
    { label: "Regions Covered", hint: "Distinct regions in pipeline" },
    { label: "Live Data Connection", hint: "Supabase pipeline table" },
  ] as const;

  const briefingTiles = [
    {
      heading: "Emerging opportunities",
      body: briefing.emergingOpportunities.length
        ? briefing.emergingOpportunities.join(" ")
        : UNAVAILABLE_LABEL,
    },
    {
      heading: "Sector developments",
      body: briefing.sectorDevelopments.length
        ? briefing.sectorDevelopments.join(" ")
        : UNAVAILABLE_LABEL,
    },
    {
      heading: "Regional developments",
      body: briefing.regionalDevelopments.length
        ? briefing.regionalDevelopments.join(" ")
        : UNAVAILABLE_LABEL,
    },
    {
      heading: "Strategic opportunities",
      body: briefing.strategicOpportunitiesNarrative.length
        ? briefing.strategicOpportunitiesNarrative.join(" ")
        : UNAVAILABLE_LABEL,
    },
    {
      heading: "Risks and challenges",
      body: briefing.risksAndChallenges.length
        ? briefing.risksAndChallenges.join(" ")
        : UNAVAILABLE_LABEL,
    },
    {
      heading: "Recommended investigations",
      body: briefing.recommendedInvestigations.length
        ? briefing.recommendedInvestigations.join(" ")
        : UNAVAILABLE_LABEL,
    },
  ] as const;

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
          Missing data source: a Supabase (or API) table for Talanton opportunity / pipeline records (e.g. deal
          stage, sector, region, conviction score). Configured prospect fixtures are not shown as live intelligence.
        </p>
      </div>

      <section aria-label="Opportunity intelligence overview">
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Overview
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
            Pipeline scorecard
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {mainTiles.map((item) => (
            <TalantonImpactMetric
              key={item.label}
              label={item.label}
              value={UNAVAILABLE_LABEL}
              hint={item.hint}
              unavailable
            />
          ))}
        </div>
      </section>

      <TalantonGeneratedPanel
        eyebrow="AI generated"
        title="Opportunity Executive Briefing"
        copyText={briefing.briefingText}
      >
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/55">
          {briefing.pipelineUnavailableReason}
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {briefingTiles.map((tile) => (
            <BriefingTile key={tile.heading} heading={tile.heading} body={tile.body} />
          ))}
        </div>
      </TalantonGeneratedPanel>
    </div>
  );
}
