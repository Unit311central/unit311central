"use client";

import {
  TalantonGeneratedPanel,
  TalantonIntelligenceHeader,
  TalantonPlaceholderMetric,
} from "./talanton-intelligence-ui";

const PURPOSE = `Opportunity Intelligence

Identify emerging opportunities relevant to Talanton's mission and investment strategy.

Watch areas (coming soon):
• Potential future portfolio companies
• Sector opportunities
• Market developments
• Funding opportunities
• Strategic partnerships
• Economic trends across Sub-Saharan Africa

This workspace is a Phase 1 shell. Sourcing workflows and opportunity assessments will follow.`;

const TRACKS = [
  { label: "Pipeline prospects", hint: "Future holdings" },
  { label: "Sector opportunities", hint: "Thematic fit" },
  { label: "Market developments", hint: "SSA signals" },
  { label: "Funding opportunities", hint: "Co-invest / grants" },
  { label: "Strategic partnerships", hint: "Ecosystem" },
  { label: "Economic trends", hint: "Sub-Saharan Africa" },
] as const;

export default function OpportunityIntelligenceWorkspace() {
  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Opportunity Intelligence"
        title="Opportunity Intelligence"
        description="Surface emerging opportunities aligned to Talanton's mission and investment strategy — future holdings, sectors, funding, partnerships, and SSA market trends."
      />

      <TalantonGeneratedPanel
        eyebrow="Executive overview"
        title="Opportunity radar"
        copyText={PURPOSE}
      >
        <p className="max-w-3xl text-sm leading-relaxed text-white/55">
          This module will help Talanton leadership spot what is emerging — not only inside the
          current portfolio, but across markets and partners that may become the next chapter of
          impact and returns.
        </p>
        <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-emerald-300/70">
          Placeholder · sourcing model forthcoming
        </p>
      </TalantonGeneratedPanel>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-white/80">Opportunity tracks</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {TRACKS.map((track) => (
            <TalantonPlaceholderMetric key={track.label} label={track.label} hint={track.hint} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <TalantonGeneratedPanel
          eyebrow="Opportunity assessment"
          title="Priority opportunities"
          copyText={`Opportunity Assessment — Priority list

Status: Shell only
When live: ranked opportunities with thesis fit, geography, and recommended next step for Talanton staff.`}
        >
          <p className="text-sm leading-relaxed text-white/50">
            Ranked opportunity cards will appear here. Each assessment panel includes a copy button
            for sharing into briefings and board materials.
          </p>
        </TalantonGeneratedPanel>

        <TalantonGeneratedPanel
          eyebrow="Insight"
          title="Market & partnership signals"
          copyText={`Opportunity Intelligence — Market signals

Status: Shell only
When live: short executive notes on SSA trends, funding windows, and partnership openings relevant to Talanton.`}
        >
          <p className="text-sm leading-relaxed text-white/50">
            Concise signal notes and recommendations will land in this column — always copyable for
            EA and leadership workflows.
          </p>
        </TalantonGeneratedPanel>
      </div>
    </div>
  );
}
