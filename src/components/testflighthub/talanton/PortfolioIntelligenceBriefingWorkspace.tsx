"use client";

import { useMemo, type ReactNode } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  Target,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import {
  buildPortfolioExecutiveBriefing,
  formatAttentionCompanyText,
  formatRecommendedActionText,
  type PortfolioActivityKind,
  type PortfolioAttentionCompany,
  type PortfolioRecommendedAction,
} from "@/lib/talanton/portfolio-intelligence";
import type { RiskRating } from "@/lib/talanton/portfolio-data";
import { cn } from "@/lib/utils";

function riskClass(rating: RiskRating) {
  switch (rating) {
    case "Low":
      return "bg-emerald-500/15 text-emerald-300 ring-emerald-400/20";
    case "Medium":
      return "bg-amber-500/15 text-amber-300 ring-amber-400/20";
    case "High":
      return "bg-orange-500/20 text-orange-300 ring-orange-400/25";
    case "Critical":
      return "bg-rose-500/20 text-rose-300 ring-rose-400/25";
    default:
      return "bg-white/10 text-white/70 ring-white/10";
  }
}

function priorityClass(priority: PortfolioAttentionCompany["priority"]) {
  switch (priority) {
    case "Critical":
      return "text-rose-300";
    case "High":
      return "text-orange-300";
    default:
      return "text-amber-200/90";
  }
}

function urgencyClass(urgency: PortfolioRecommendedAction["urgency"]) {
  switch (urgency) {
    case "Today":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
    case "This week":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  }
}

function activityIcon(kind: PortfolioActivityKind) {
  switch (kind) {
    case "report":
      return <FileText className="h-3.5 w-3.5 text-emerald-300" />;
    case "training":
      return <GraduationCap className="h-3.5 w-3.5 text-sky-300" />;
    case "document":
      return <ClipboardList className="h-3.5 w-3.5 text-teal-300" />;
    case "compliance":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
    case "risk":
      return <ShieldAlert className="h-3.5 w-3.5 text-orange-300" />;
    default:
      return <Target className="h-3.5 w-3.5 text-white/50" />;
  }
}

function formatShortDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function GeneratedPanel({
  title,
  eyebrow,
  copyText,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  copyText: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/80 via-[#0b1a14]/90 to-[#08110d] p-5 sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
      />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        </div>
        <CopyToClipboardButton text={copyText} className="shrink-0" />
      </div>
      {children}
    </section>
  );
}

function HealthMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "alert" | "good";
}) {
  const valueClass =
    tone === "alert"
      ? "text-rose-200"
      : tone === "watch"
        ? "text-amber-200"
        : tone === "good"
          ? "text-emerald-200"
          : "text-white";

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-white/40">{hint}</p> : null}
    </div>
  );
}

export default function PortfolioIntelligenceBriefingWorkspace() {
  const briefing = useMemo(() => buildPortfolioExecutiveBriefing(), []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
              Portfolio Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Executive Briefing
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
              Prepared for {briefing.preparedFor}. Focused on what requires attention across the
              portfolio right now — not analytics theatre.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
              AI briefing · {formatShortDate(briefing.asOf)}
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium",
                briefing.health.posture === "Stable"
                  ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                  : briefing.health.posture === "Watch"
                    ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
                    : "border-rose-400/30 bg-rose-500/10 text-rose-100",
              )}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {briefing.health.posture} posture
            </span>
          </div>
        </div>
      </header>

      <GeneratedPanel
        eyebrow="Scorecard"
        title="Portfolio Health Summary"
        copyText={briefing.healthSummaryText}
      >
        <p className="mb-4 max-w-3xl text-sm leading-relaxed text-white/55">
          {briefing.health.postureReason}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <HealthMetric
            label="Portfolio Health Score"
            value={`${briefing.health.portfolioHealthScore}/100`}
            hint={briefing.health.posture}
            tone={
              briefing.health.portfolioHealthScore >= 78
                ? "good"
                : briefing.health.portfolioHealthScore >= 65
                  ? "watch"
                  : "alert"
            }
          />
          <HealthMetric
            label="Companies Requiring Attention"
            value={briefing.health.companiesRequiringAttention}
            hint="Prioritised for leadership follow-up"
            tone={briefing.health.companiesRequiringAttention > 4 ? "watch" : "default"}
          />
          <HealthMetric
            label="Reports Outstanding"
            value={briefing.health.reportsOutstanding}
            hint="Overdue, due soon, or not started"
            tone={briefing.health.reportsOutstanding > 0 ? "watch" : "good"}
          />
          <HealthMetric
            label="Compliance Issues"
            value={briefing.health.complianceIssues}
            hint="Training gaps and open compliance risks"
            tone={briefing.health.complianceIssues > 5 ? "alert" : "watch"}
          />
          <HealthMetric
            label="High Risk Companies"
            value={briefing.health.highRiskCompanies}
            hint="High or Critical risk rating"
            tone={briefing.health.highRiskCompanies > 0 ? "alert" : "good"}
          />
          <HealthMetric
            label="Total Portfolio Companies"
            value={briefing.health.totalPortfolioCompanies}
            hint="Active Talanton Impact holdings"
            tone="default"
          />
        </div>
      </GeneratedPanel>

      <GeneratedPanel
        eyebrow="AI generated"
        title="AI Executive Briefing"
        copyText={briefing.briefingText}
      >
        <div className="space-y-5 text-sm leading-relaxed text-white/75">
          <BriefingBlock heading="Overall portfolio status" body={briefing.overallStatus} />
          <BriefingList heading="Significant changes" items={briefing.significantChanges} />
          <BriefingList
            heading="Companies requiring attention"
            items={briefing.companiesRequiringAttentionNarrative}
            ordered
          />
          <BriefingList heading="Compliance concerns" items={briefing.complianceConcerns} />
          <BriefingList heading="Reporting concerns" items={briefing.reportingConcerns} />
          <BriefingList
            heading="Recommended actions"
            items={briefing.recommendedActionsNarrative}
            ordered
          />
        </div>
      </GeneratedPanel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Focus list
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Companies Requiring Attention
            </h2>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefing.attentionCompanies.map((company) => (
            <article
              key={company.companyId}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 shrink-0 text-emerald-300/80" />
                    <h3 className="truncate text-base font-semibold text-white">
                      {company.companyName}
                    </h3>
                  </div>
                  <p className="mt-1 text-xs text-white/45">
                    {company.sector} · {company.country}
                  </p>
                </div>
                <CopyToClipboardButton
                  text={formatAttentionCompanyText(company)}
                  className="shrink-0"
                />
              </div>

              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs text-white/70">
                  Health {company.healthScore}/100
                </span>
                <span
                  className={cn(
                    "rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                    riskClass(company.riskRating),
                  )}
                >
                  {company.riskRating} risk
                </span>
                <span className={cn("text-xs font-semibold uppercase tracking-wide", priorityClass(company.priority))}>
                  {company.priority}
                </span>
              </div>

              <p className="text-sm font-medium text-white/90">{company.reason}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-white/55">{company.detail}</p>
              <div className="mt-4 rounded-xl border border-emerald-400/15 bg-emerald-500/[0.07] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-300/80">
                  Recommended action
                </p>
                <p className="mt-1 text-sm text-emerald-50/95">{company.recommendedAction}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GeneratedPanel
        eyebrow="Timeline"
        title="Recent Portfolio Activity"
        copyText={briefing.activityText}
      >
        <ol className="relative space-y-0 border-l border-white/10 pl-5">
          {briefing.recentActivity.map((item) => (
            <li key={item.id} className="relative pb-5 last:pb-0">
              <span className="absolute -left-[1.55rem] top-0.5 flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0d1b14]">
                {activityIcon(item.kind)}
              </span>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-white">{item.title}</p>
                <time className="text-[11px] tabular-nums text-white/40">
                  {formatShortDate(item.occurredAt)}
                </time>
              </div>
              {item.companyName ? (
                <p className="mt-0.5 text-xs text-emerald-300/75">{item.companyName}</p>
              ) : null}
              <p className="mt-1 text-sm leading-relaxed text-white/55">{item.detail}</p>
            </li>
          ))}
        </ol>
      </GeneratedPanel>

      <GeneratedPanel
        eyebrow="Action centre"
        title="Recommended Actions"
        copyText={briefing.actionsText}
      >
        <p className="mb-4 max-w-3xl text-sm text-white/55">
          Executive action list for the next leadership cycle. Each item is copyable for email,
          board notes, or EA handoff.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {briefing.recommendedActions.map((action) => (
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
                <CopyToClipboardButton
                  text={formatRecommendedActionText(action)}
                  className="shrink-0"
                />
              </div>
              <h3 className="text-sm font-semibold leading-snug text-white">{action.title}</h3>
              {action.companyName ? (
                <p className="mt-1 text-xs text-emerald-300/75">{action.companyName}</p>
              ) : null}
              <p className="mt-2 text-sm leading-relaxed text-white/55">{action.rationale}</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-white/40">
                Owner · {action.owner}
              </p>
            </article>
          ))}
        </div>
      </GeneratedPanel>
    </div>
  );
}

function BriefingBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
      <p className="mt-2 text-white/75">{body}</p>
    </div>
  );
}

function BriefingList({
  heading,
  items,
  ordered = false,
}: {
  heading: string;
  items: string[];
  ordered?: boolean;
}) {
  const ListTag = ordered ? "ol" : "ul";
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
      <ListTag className={cn("mt-2 space-y-2", ordered ? "list-decimal pl-5" : "list-disc pl-5")}>
        {items.map((item) => (
          <li key={item} className="text-white/75">
            {item}
          </li>
        ))}
      </ListTag>
    </div>
  );
}
