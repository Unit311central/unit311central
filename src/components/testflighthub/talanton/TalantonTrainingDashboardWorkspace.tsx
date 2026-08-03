"use client";

import { useMemo } from "react";
import { AlertTriangle, GraduationCap, TrendingUp, Users } from "lucide-react";

import { buildTrainingExecutiveSummary } from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

function Bar({ value, tone = "good" }: { value: number; tone?: "good" | "watch" | "alert" }) {
  const color =
    tone === "alert" ? "bg-rose-400" : tone === "watch" ? "bg-amber-400" : "bg-emerald-400";
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
      <div className={cn("h-full rounded-full", color)} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export default function TalantonTrainingDashboardWorkspace() {
  const summary = useMemo(() => buildTrainingExecutiveSummary(), []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Training Dashboard"
        description="Executive view of learning for Talanton staff and portfolio companies — completion, certifications, engagement and holdings that need attention."
      />

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
          Internal staff
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric
            label="Staff completion rate"
            value={`${summary.staffCompletion}%`}
            hint="Mandatory + leadership curricula"
            tone="good"
          />
          <TalantonImpactMetric
            label="Mandatory training open"
            value={summary.mandatoryOpen}
            hint="Items outstanding across holdings"
            tone={summary.mandatoryOpen > 40 ? "watch" : "default"}
          />
          <TalantonImpactMetric
            label="Staff certifications"
            value={summary.certificationsEarned}
            hint="Active & expiring"
          />
          <TalantonImpactMetric
            label="Upcoming training"
            value={summary.upcomingStaff}
            hint="Sessions this month"
          />
        </div>
      </section>

      <section>
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
          Portfolio companies
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TalantonImpactMetric label="Company participation" value={summary.portfolioCompanies} hint="Holdings with assigned curricula" />
          <TalantonImpactMetric
            label="Avg course completion"
            value={`${summary.avgPortfolioCompletion}%`}
            tone={summary.avgPortfolioCompletion >= 80 ? "good" : "watch"}
          />
          <TalantonImpactMetric
            label="Certifications earned"
            value={summary.certificationsEarned}
            hint="Staff + portfolio"
            tone="good"
          />
          <TalantonImpactMetric
            label="Companies requiring attention"
            value={summary.companiesRequiringAttention}
            hint="Completion below 70%"
            tone={summary.companiesRequiringAttention > 0 ? "alert" : "good"}
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/60 via-[#0b1a14]/85 to-[#08110d] p-5">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Completion rates</h2>
          </div>
          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-white/55">
                <span>On track (≥90%)</span>
                <span>{summary.above90} companies</span>
              </div>
              <Bar value={(summary.above90 / summary.portfolioCompanies) * 100} />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-white/55">
                <span>Watch (70–89%)</span>
                <span>{summary.between70And90} companies</span>
              </div>
              <Bar value={(summary.between70And90 / summary.portfolioCompanies) * 100} tone="watch" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-white/55">
                <span>At risk (&lt;70%)</span>
                <span>{summary.below70} companies</span>
              </div>
              <Bar value={(summary.below70 / summary.portfolioCompanies) * 100} tone="alert" />
            </div>
            <div>
              <div className="mb-1 flex justify-between text-xs text-white/55">
                <span>Talanton staff</span>
                <span>{summary.staffCompletion}%</span>
              </div>
              <Bar value={summary.staffCompletion} />
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="mb-4 flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Most popular courses</h2>
          </div>
          <ul className="space-y-3">
            {summary.popularCourses.map((c, i) => (
              <li key={c.id} className="flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-500/10 text-xs font-semibold text-emerald-100">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">{c.title}</p>
                  <p className="text-[11px] text-white/40">
                    {c.category} · {c.audience}
                  </p>
                </div>
                <span className="text-xs tabular-nums text-emerald-200/80">{c.popularity}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <article className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-300" />
            <h2 className="text-lg font-semibold text-white">Portfolio engagement</h2>
          </div>
          <p className="text-3xl font-semibold tabular-nums text-white">
            {summary.activeLearners.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-white/50">Active learners across portfolio company portals</p>
          <p className="mt-4 text-sm text-white/60">
            {summary.coursesAssigned.toLocaleString()} course assignments ·{" "}
            {summary.coursesCompleted.toLocaleString()} completions recorded
          </p>
        </article>
        <article className="rounded-2xl border border-amber-400/20 bg-amber-500/5 p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-300" />
            <h2 className="text-lg font-semibold text-white">Certification status</h2>
          </div>
          <p className="text-sm leading-relaxed text-white/70">
            {summary.certificationsEarned} certifications are active or nearing expiry across staff and
            holdings. Use Certifications to prioritise renewals before the next LP reporting cycle.
          </p>
        </article>
      </section>
    </div>
  );
}
