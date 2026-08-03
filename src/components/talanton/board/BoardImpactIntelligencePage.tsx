"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  Minus,
  Sparkles,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import {
  buildBoardImpactIntelligence,
  type ImpactTrendPoint,
} from "@/lib/talanton/board-impact-intelligence";
import type { ImpactTrend } from "@/lib/talanton/impact-intelligence";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
} from "@/components/testflighthub/talanton/talanton-intelligence-ui";

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
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
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
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
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

function TrendBars({
  label,
  points,
  valueKey,
}: {
  label: string;
  points: ImpactTrendPoint[];
  valueKey: keyof Pick<ImpactTrendPoint, "jobsCreated" | "peopleServed" | "impactHealthScore">;
}) {
  const max = Math.max(...points.map((p) => Number(p[valueKey])), 1);
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <div className="mt-3 flex items-end gap-2 h-24">
        {points.map((p) => {
          const v = Number(p[valueKey]);
          const h = Math.max(8, Math.round((v / max) * 100));
          return (
            <div key={p.period} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className="w-full rounded-t-md bg-emerald-400/70"
                style={{ height: `${h}%` }}
                title={`${p.period}: ${v.toLocaleString()}`}
              />
              <span className="text-[9px] text-white/40">{p.period.replace(" 20", " ’")}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs tabular-nums text-white/55">
        Latest: {Number(points[points.length - 1]?.[valueKey] ?? 0).toLocaleString()}
      </p>
    </div>
  );
}

export default function BoardImpactIntelligencePage() {
  const data = useMemo(() => buildBoardImpactIntelligence(), []);
  const { health, summary } = data;

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.22),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-6">
        <div className="relative flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80">
              Board Portal
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Impact Intelligence
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">
              Governance view of portfolio impact — oversight, trends, risks, and decisions for the
              Board and Investment Committee.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              Board briefing · {formatShortDate(data.asOf)}
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
              {health.band}
            </span>
          </div>
        </div>
      </header>

      <TalantonGeneratedPanel
        eyebrow="Scorecard"
        title="Impact Health Score"
        copyText={data.healthText}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-5xl font-semibold tabular-nums tracking-tight text-white sm:text-6xl">
              {health.score}
              <span className="text-2xl text-white/40">/100</span>
            </p>
            <p className="mt-2 text-sm font-medium text-emerald-200/90">{health.band}</p>
          </div>
          <p className="max-w-xl text-sm leading-relaxed text-white/60">{health.postureReason}</p>
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="Portfolio"
        title="Portfolio Impact Snapshot"
        copyText={data.snapshotText}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric label="Jobs Created" value={summary.jobsCreated.toLocaleString()} />
          <TalantonImpactMetric label="Jobs Retained" value={summary.jobsRetained.toLocaleString()} />
          <TalantonImpactMetric label="People Served" value={summary.peopleServed.toLocaleString()} />
          <TalantonImpactMetric label="Women Employed" value={summary.womenEmployed.toLocaleString()} />
          <TalantonImpactMetric label="Youth Employed" value={summary.youthEmployed.toLocaleString()} />
          <TalantonImpactMetric
            label="Communities Impacted"
            value={summary.communitiesImpacted.toLocaleString()}
          />
          <TalantonImpactMetric label="Countries Impacted" value={String(summary.countriesImpacted)} />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="AI generated"
        title="Board Impact Briefing"
        copyText={data.boardBriefingText}
      >
        <div className="space-y-5">
          <BriefingBlock heading="Overall portfolio impact" body={data.overallImpact} />
          <BriefingList heading="Key achievements" items={data.keyAchievements} />
          <BriefingList heading="Strongest performing companies" items={data.strongestPerformers} />
          <BriefingList heading="Emerging concerns" items={data.emergingConcerns} />
          <BriefingList
            heading="Areas requiring board attention"
            items={data.areasRequiringBoardAttention}
          />
        </div>
      </TalantonGeneratedPanel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Proof points
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">
              Top Impact Companies
            </h2>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.topCompanies.map((company) => (
            <article
              key={company.companyId}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">{company.companyName}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    {company.sector} · {company.country}
                  </p>
                </div>
                <CopyToClipboardButton text={company.cardText} className="shrink-0" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-white/70">
                  Impact {company.impactScore}/100
                </span>
                <span className={cn("inline-flex items-center gap-1 text-xs font-medium", trendClass(company.trend))}>
                  {trendIcon(company.trend)}
                  {company.trend}
                </span>
              </div>
              <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
                {company.keyImpactMetricLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-white/90">{company.keyImpactMetric}</p>
            </article>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Oversight
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white">Impact Risks</h2>
          </div>
          <CopyToClipboardButton text={data.risksText} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.risks.map((risk) => (
            <article
              key={risk.id}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold text-white">{risk.title}</h3>
                <CopyToClipboardButton text={risk.cardText} className="shrink-0" />
              </div>
              <span
                className={cn(
                  "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                  severityClass(risk.severity),
                )}
              >
                {risk.severity}
              </span>
              {risk.companyName ? (
                <p className="mt-2 text-xs text-emerald-300/75">{risk.companyName}</p>
              ) : (
                <p className="mt-2 text-xs text-white/40">Portfolio-wide</p>
              )}
              <p className="mt-2 text-sm leading-relaxed text-white/55">{risk.detail}</p>
            </article>
          ))}
        </div>
      </section>

      <TalantonGeneratedPanel
        eyebrow="Governance"
        title="Board Recommendations"
        copyText={data.recommendationsText}
      >
        <p className="mb-4 text-sm text-white/55">
          Recommendations for directors and the Investment Committee.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {data.boardRecommendations.map((action) => (
            <article
              key={action.id}
              className="relative rounded-xl border border-white/10 bg-black/20 p-4"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "inline-flex rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em]",
                    urgencyClass(action.urgency),
                  )}
                >
                  {action.urgency}
                </span>
                <CopyToClipboardButton text={action.cardText} className="shrink-0" />
              </div>
              <h3 className="text-sm font-semibold leading-snug text-white">{action.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/55">{action.rationale}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-white/40">
                Owner · {action.owner}
              </p>
            </article>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel eyebrow="Trajectory" title="Impact Trends" copyText={data.trendsText}>
        <div className="grid gap-3 lg:grid-cols-3">
          <TrendBars label="Jobs Created" points={data.trends} valueKey="jobsCreated" />
          <TrendBars label="People Served" points={data.trends} valueKey="peopleServed" />
          <TrendBars label="Impact Health Score" points={data.trends} valueKey="impactHealthScore" />
        </div>
      </TalantonGeneratedPanel>
    </div>
  );
}
