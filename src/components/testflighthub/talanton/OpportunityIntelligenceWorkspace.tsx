"use client";

import { useMemo } from "react";
import { AlertTriangle, Compass, Globe2, Lightbulb, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";

import {
  buildOpportunityBriefing,
  type Rating,
  type SectorTrend,
} from "@/lib/talanton/opportunity-intelligence";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function trendIcon(trend: SectorTrend) {
  if (trend === "Accelerating") return <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />;
  if (trend === "Cooling") return <TrendingDown className="h-3.5 w-3.5 text-rose-300" />;
  return <Minus className="h-3.5 w-3.5 text-white/45" />;
}

function ratingClass(rating: Rating) {
  if (rating === "High") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (rating === "Medium") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-white/15 bg-white/5 text-white/70";
}

function urgencyClass(urgency: "Today" | "This week" | "This month" | "This quarter") {
  if (urgency === "Today") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (urgency === "This week") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  if (urgency === "This month") return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  return "border-sky-400/25 bg-sky-500/10 text-sky-100";
}

function BriefingList({
  heading,
  items,
  ordered,
}: {
  heading: string;
  items: string[];
  ordered?: boolean;
}) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">{heading}</h3>
      <ListTag
        className={cn(
          "mt-2 space-y-1.5 text-sm leading-relaxed text-white/75",
          ordered ? "list-decimal pl-5" : "list-disc pl-5",
        )}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

export default function OpportunityIntelligenceWorkspace() {
  const briefing = useMemo(() => buildOpportunityBriefing(), []);
  const { health } = briefing;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Opportunity Intelligence"
        title="Opportunity Intelligence"
        description="Identify opportunities aligned with Talanton’s faith-driven impact investing mandate across Sub-Saharan Africa — pipeline companies, sectors, regions, partnerships, and executive next steps."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              AI opportunity briefing · {formatShortDate(briefing.asOf)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium",
                health.band === "Strong" || health.band === "Healthy"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : health.band === "Watch"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-100",
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {health.band} pipeline
            </span>
          </div>
        }
      />

      {/* 1. Opportunity Health Score */}
      <TalantonGeneratedPanel
        eyebrow="Scorecard"
        title="Opportunity Health Score"
        copyText={health.healthText}
      >
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/55">{health.postureReason}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric
            label="Opportunity Health Score"
            value={`${health.score}/100`}
            hint={health.band}
            tone={
              health.score >= 80 ? "good" : health.score >= 75 ? "default" : health.score >= 65 ? "watch" : "alert"
            }
          />
          <TalantonImpactMetric
            label="Pipeline Depth"
            value={health.pipelineDepth}
            hint="Active prospects under review"
          />
          <TalantonImpactMetric
            label="High Conviction"
            value={health.highConviction}
            hint="Score ≥ 82"
            tone="good"
          />
          <TalantonImpactMetric
            label="Coverage"
            value={`${health.sectorsCovered} sectors · ${health.regionsCovered} regions`}
            hint="SSA thematic & geographic span"
          />
        </div>
      </TalantonGeneratedPanel>

      {/* 2. Opportunity Executive Briefing */}
      <TalantonGeneratedPanel
        eyebrow="AI generated"
        title="AI Opportunity Executive Briefing"
        copyText={briefing.briefingText}
      >
        <div className="space-y-5 text-sm leading-relaxed text-white/75">
          <BriefingList heading="Emerging opportunities" items={briefing.emergingOpportunities} />
          <BriefingList heading="Sector developments" items={briefing.sectorDevelopments} />
          <BriefingList heading="Regional developments" items={briefing.regionalDevelopments} />
          <BriefingList heading="Strategic opportunities" items={briefing.strategicOpportunitiesNarrative} />
          <BriefingList heading="Risks and challenges" items={briefing.risksAndChallenges} />
          <BriefingList
            heading="Recommended investigations"
            items={briefing.recommendedInvestigations}
            ordered
          />
        </div>
      </TalantonGeneratedPanel>

      {/* 3. Potential Portfolio Companies */}
      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Pipeline
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Potential Portfolio Companies
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/50">
              Prospective holdings aligned to Talanton’s SSA impact mandate — ranked by opportunity score.
            </p>
          </div>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {briefing.potentialCompanies.map((company) => (
            <TalantonGeneratedPanel
              key={company.id}
              eyebrow={`${company.country} · ${company.sector}`}
              title={company.companyName}
              copyText={company.cardText}
            >
              <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-emerald-400/25 bg-emerald-500/10 px-2.5 py-1 font-medium text-emerald-100">
                  Opportunity {company.opportunityScore}/100
                </span>
                <span className={cn("rounded-full border px-2.5 py-1", ratingClass(company.impactPotential))}>
                  Impact {company.impactPotential}
                </span>
                <span
                  className={cn("rounded-full border px-2.5 py-1", ratingClass(company.investmentAttractiveness))}
                >
                  Invest {company.investmentAttractiveness}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/60">
                  {company.stageHint}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-white/45">{company.thesisFit}</p>
              <div className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">
                  AI Commentary
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{company.aiCommentary}</p>
              </div>
            </TalantonGeneratedPanel>
          ))}
        </div>
      </section>

      {/* 4. Sector Intelligence */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Thematic
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
            Sector Intelligence
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {briefing.sectors.map((sector) => (
            <TalantonGeneratedPanel
              key={sector.id}
              eyebrow="Sector"
              title={sector.sector}
              copyText={sector.cardText}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px]">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/70">
                  {trendIcon(sector.trend)}
                  {sector.trend}
                </span>
                <span className={cn("rounded-full border px-2.5 py-1", ratingClass(sector.opportunityRating))}>
                  {sector.opportunityRating} opportunity
                </span>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">Growth outlook</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{sector.growthOutlook}</p>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{sector.commentary}</p>
            </TalantonGeneratedPanel>
          ))}
        </div>
      </section>

      {/* 5. Regional Intelligence */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Geography
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
            <Globe2 className="h-5 w-5 text-emerald-300/80" />
            Regional Intelligence
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {briefing.regions.map((region) => (
            <TalantonGeneratedPanel
              key={region.id}
              eyebrow="Region"
              title={region.region}
              copyText={region.cardText}
            >
              <div className="mb-3">
                <span className={cn("rounded-full border px-2.5 py-1 text-[11px]", ratingClass(region.opportunityRating))}>
                  {region.opportunityRating} opportunity
                </span>
              </div>
              <p className="text-xs font-medium uppercase tracking-[0.1em] text-white/40">Economic outlook</p>
              <p className="mt-1 text-sm leading-relaxed text-white/75">{region.economicOutlook}</p>
              <div className="mt-3 rounded-xl border border-white/8 bg-black/20 px-3.5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/70">
                  AI Commentary
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/75">{region.aiCommentary}</p>
              </div>
            </TalantonGeneratedPanel>
          ))}
        </div>
      </section>

      {/* 6. Strategic Opportunities */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Ecosystem
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
            <Compass className="h-5 w-5 text-emerald-300/80" />
            Strategic Opportunities
          </h2>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {briefing.strategic.map((item) => (
            <TalantonGeneratedPanel
              key={item.id}
              eyebrow={item.category}
              title={item.title}
              copyText={item.cardText}
            >
              <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                <span className={cn("rounded-full border px-2.5 py-1", urgencyClass(item.urgency))}>
                  {item.urgency}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/60">
                  Owner · {item.owner}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/75">{item.detail}</p>
            </TalantonGeneratedPanel>
          ))}
        </div>
      </section>

      {/* 7. Recommended Actions */}
      <section>
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Leadership
          </p>
          <h2 className="mt-1 flex items-center gap-2 text-lg font-semibold tracking-tight text-white sm:text-xl">
            <Lightbulb className="h-5 w-5 text-emerald-300/80" />
            Recommended Actions
          </h2>
        </div>
        <div className="grid gap-3 xl:grid-cols-2">
          {briefing.recommendedActions.map((action) => (
            <TalantonGeneratedPanel
              key={action.id}
              eyebrow="Executive action"
              title={action.title}
              copyText={action.cardText}
            >
              <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
                <span className={cn("rounded-full border px-2.5 py-1", urgencyClass(action.urgency))}>
                  {action.urgency}
                </span>
                <span className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-white/60">
                  Owner · {action.owner}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-white/75">{action.rationale}</p>
            </TalantonGeneratedPanel>
          ))}
        </div>
      </section>
    </div>
  );
}
