"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Building2, Sparkles, TrendingDown, TrendingUp, Minus } from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { buildPortfolioImpactBriefing, type ImpactTrend } from "@/lib/talanton/impact-intelligence";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "../InternalOperationsBasePathContext";
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

function trendIcon(trend: ImpactTrend) {
  if (trend === "Improving") return <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />;
  if (trend === "Declining") return <TrendingDown className="h-3.5 w-3.5 text-rose-300" />;
  return <Minus className="h-3.5 w-3.5 text-white/45" />;
}

function trendClass(trend: ImpactTrend) {
  if (trend === "Improving") return "text-emerald-200";
  if (trend === "Declining") return "text-rose-200";
  return "text-white/60";
}

function severityClass(severity: "Watch" | "Elevated" | "Critical") {
  if (severity === "Critical") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (severity === "Elevated") return "border-orange-400/30 bg-orange-500/10 text-orange-100";
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

function urgencyClass(urgency: "Today" | "This week" | "This month") {
  if (urgency === "Today") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (urgency === "This week") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
}

function BriefingBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">{heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
    </div>
  );
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
      <ListTag className={cn("mt-2 space-y-1.5 text-sm leading-relaxed text-white/75", ordered ? "list-decimal pl-5" : "list-disc pl-5")}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ListTag>
    </div>
  );
}

export default function ImpactIntelligenceDashboardWorkspace() {
  const briefing = useMemo(() => buildPortfolioImpactBriefing(), []);
  const basePath = useInternalOperationsBasePath();
  const { health, summary } = briefing;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Impact Intelligence"
        title="Impact Dashboard"
        description="Executive portfolio-wide view of social, economic and community impact across Talanton holdings — jobs, inclusion, reach, and the actions leadership should take next."
        actions={
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              AI impact briefing · {formatShortDate(briefing.asOf)}
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
              {health.band} impact
            </span>
          </div>
        }
      />

      <TalantonGeneratedPanel
        eyebrow="Scorecard"
        title="Impact Health Score"
        copyText={health.healthText}
      >
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/55">{health.postureReason}</p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric
            label="Impact Health Score"
            value={`${health.score}/100`}
            hint={health.band}
            tone={
              health.score >= 80 ? "good" : health.score >= 68 ? "default" : health.score >= 55 ? "watch" : "alert"
            }
          />
          <TalantonImpactMetric
            label="Jobs Created"
            value={summary.jobsCreated.toLocaleString()}
            hint="Rolling portfolio estimate"
            tone="good"
          />
          <TalantonImpactMetric
            label="People Served"
            value={summary.peopleServed.toLocaleString()}
            hint="Beneficiaries & customers reached"
          />
          <TalantonImpactMetric
            label="Countries Impacted"
            value={summary.countriesImpacted}
            hint="Sub-Saharan footprint"
          />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="Portfolio totals"
        title="Portfolio Impact Summary"
        copyText={briefing.summaryText}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric label="Jobs Created" value={summary.jobsCreated.toLocaleString()} />
          <TalantonImpactMetric label="Jobs Retained" value={summary.jobsRetained.toLocaleString()} />
          <TalantonImpactMetric label="Women Employed" value={summary.womenEmployed.toLocaleString()} />
          <TalantonImpactMetric label="Youth Employed" value={summary.youthEmployed.toLocaleString()} />
          <TalantonImpactMetric label="People Served" value={summary.peopleServed.toLocaleString()} />
          <TalantonImpactMetric
            label="Communities Impacted"
            value={summary.communitiesImpacted.toLocaleString()}
          />
          <TalantonImpactMetric label="Countries Impacted" value={summary.countriesImpacted} />
          <TalantonImpactMetric
            label="Economic Contribution"
            value={
              summary.economicContributionUsd >= 1_000_000
                ? `$${(summary.economicContributionUsd / 1_000_000).toFixed(1)}M`
                : `$${summary.economicContributionUsd.toLocaleString()}`
            }
            hint="Estimated local economic activity"
          />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="AI generated"
        title="AI Impact Executive Briefing"
        copyText={briefing.briefingText}
      >
        <div className="space-y-5 text-sm leading-relaxed text-white/75">
          <BriefingBlock heading="Overall portfolio impact" body={briefing.overallImpact} />
          <BriefingList heading="Key achievements" items={briefing.keyAchievements} />
          <BriefingList heading="Highest-impact companies" items={briefing.highestImpactCompanies} ordered />
          <BriefingList heading="Areas requiring attention" items={briefing.areasRequiringAttention} />
          <BriefingList
            heading="Recommended actions"
            items={briefing.recommendedActionsNarrative}
            ordered
          />
        </div>
      </TalantonGeneratedPanel>

      <section>
        <div className="mb-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
            Ranked holdings
          </p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
            Top Impact Companies
          </h2>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefing.topCompanies.map((company, index) => {
            const href = getInternalNavHref("impact-intelligence-company", basePath, {
              companyId: company.companyId,
            });
            return (
              <article
                key={company.companyId}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/25 hover:bg-emerald-500/[0.04] sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Link href={href} className="min-w-0 group">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md border border-emerald-400/25 bg-emerald-500/10 text-[11px] font-semibold text-emerald-200">
                        {index + 1}
                      </span>
                      <Building2 className="h-4 w-4 shrink-0 text-emerald-300/80" />
                      <h3 className="truncate text-base font-semibold text-white group-hover:text-emerald-100">
                        {company.companyName}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {company.sector} · {company.country}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-300/80">
                      Open Company Impact →
                    </p>
                  </Link>
                  <CopyToClipboardButton text={company.cardText} />
                </div>
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-white/70">
                    Impact {company.impactScore}/100
                  </span>
                  <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-white/70">
                    {company.keyImpactMetricLabel}: {company.keyImpactMetric}
                  </span>
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendClass(company.trend))}>
                    {trendIcon(company.trend)}
                    {company.trend}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-white/60">{company.aiCommentary}</p>
              </article>
            );
          })}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                Watchlist
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                Impact Risks
              </h2>
            </div>
            <CopyToClipboardButton text={briefing.risksText} />
          </div>
          <div className="space-y-3">
            {briefing.risks.map((risk) => (
              <article
                key={risk.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-white">{risk.title}</h3>
                    {risk.companyName ? (
                      <p className="mt-1 text-xs text-white/45">{risk.companyName}</p>
                    ) : (
                      <p className="mt-1 text-xs text-white/45">Portfolio-wide</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        severityClass(risk.severity),
                      )}
                    >
                      {risk.severity}
                    </span>
                    <CopyToClipboardButton text={risk.cardText} />
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-white/60">{risk.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
                Leadership agenda
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                Recommended Actions
              </h2>
            </div>
            <CopyToClipboardButton text={briefing.actionsText} />
          </div>
          <div className="space-y-3">
            {briefing.recommendedActions.map((action) => (
              <article
                key={action.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{action.title}</h3>
                  <CopyToClipboardButton text={action.cardText} />
                </div>
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                      urgencyClass(action.urgency),
                    )}
                  >
                    {action.urgency}
                  </span>
                  <span className="text-xs text-white/45">Owner: {action.owner}</span>
                  {action.companyName ? (
                    <span className="text-xs text-white/45">· {action.companyName}</span>
                  ) : null}
                </div>
                <p className="text-sm leading-relaxed text-white/60">{action.rationale}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
