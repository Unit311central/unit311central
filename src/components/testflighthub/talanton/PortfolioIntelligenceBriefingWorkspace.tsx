"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  ShieldAlert,
  Target,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
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
import { useInternalOperationsBasePath } from "../InternalOperationsBasePathContext";

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
  const basePath = useInternalOperationsBasePath();

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
              Talanton Intelligence
            </p>
            <p className="mt-1.5 text-[11px] font-medium tracking-wide text-emerald-200/55">
              Portfolio Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Executive Briefing
            </h1>
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
        <div className="grid gap-4 lg:grid-cols-3">
          <OverallStatusPanel health={briefing.health} bullets={briefing.overallStatusBullets} />
          <SignificantChangesPanel items={briefing.significantChangeItems} />
          <AttentionSummaryPanel
            companies={briefing.attentionCompanies}
            basePath={basePath}
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
          {briefing.attentionCompanies.map((company) => {
            const companyHref = getInternalNavHref("portfolio-intelligence-company", basePath, {
              companyId: company.companyId,
            });
            return (
              <article
                key={company.companyId}
                className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-emerald-400/25 hover:bg-emerald-500/[0.04] sm:p-5"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <Link href={companyHref} className="min-w-0 group">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-emerald-300/80" />
                      <h3 className="truncate text-base font-semibold text-white group-hover:text-emerald-100">
                        {company.companyName}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-white/45">
                      {company.sector} · {company.country}
                    </p>
                    <p className="mt-1 text-[11px] font-medium text-emerald-300/80">
                      Open Company Intelligence →
                    </p>
                  </Link>
                  <div
                    className="shrink-0"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  >
                    <CopyToClipboardButton text={formatAttentionCompanyText(company)} />
                  </div>
                </div>

                <Link href={companyHref} className="block">
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
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        priorityClass(company.priority),
                      )}
                    >
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
                </Link>
              </article>
            );
          })}
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
          {briefing.recommendedActions.map((action) => {
            const companyHref = action.companyId
              ? getInternalNavHref("portfolio-intelligence-company", basePath, {
                  companyId: action.companyId,
                })
              : null;
            return (
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
                {action.companyName && companyHref ? (
                  <Link
                    href={companyHref}
                    className="mt-1 inline-block text-xs text-emerald-300/75 transition hover:text-emerald-200"
                  >
                    {action.companyName} →
                  </Link>
                ) : action.companyName ? (
                  <p className="mt-1 text-xs text-emerald-300/75">{action.companyName}</p>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-white/55">{action.rationale}</p>
                <p className="mt-3 text-[11px] uppercase tracking-[0.1em] text-white/40">
                  Owner · {action.owner}
                </p>
              </article>
            );
          })}
        </div>
      </GeneratedPanel>
    </div>
  );
}

function postureTone(posture: "Stable" | "Watch" | "Elevated") {
  switch (posture) {
    case "Stable":
      return {
        border: "border-emerald-400/25",
        bg: "bg-emerald-500/10",
        label: "text-emerald-200",
        icon: CheckCircle2,
      };
    case "Watch":
      return {
        border: "border-amber-400/25",
        bg: "bg-amber-500/10",
        label: "text-amber-100",
        icon: AlertTriangle,
      };
    default:
      return {
        border: "border-rose-400/25",
        bg: "bg-rose-500/10",
        label: "text-rose-100",
        icon: AlertTriangle,
      };
  }
}

function OverallStatusPanel({
  health,
  bullets,
}: {
  health: ReturnType<typeof buildPortfolioExecutiveBriefing>["health"];
  bullets: string[];
}) {
  const tone = postureTone(health.posture);
  const Icon = tone.icon;
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        Overall portfolio status
      </h3>
      <div
        className={cn(
          "mt-3 flex items-start gap-3 rounded-lg border px-3 py-3",
          tone.border,
          tone.bg,
        )}
      >
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", tone.label)} />
        <div className="min-w-0">
          <p className={cn("text-sm font-semibold", tone.label)}>{health.posture} posture</p>
          <p className="mt-1 text-xs leading-relaxed text-white/65">{health.postureReason}</p>
        </div>
      </div>
      <ul className="mt-3 space-y-2">
        {bullets.map((line) => (
          <li key={line} className="flex gap-2 text-sm leading-snug text-white/70">
            <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400/80" />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SignificantChangesPanel({
  items,
}: {
  items: ReturnType<typeof buildPortfolioExecutiveBriefing>["significantChangeItems"];
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        Significant changes
      </h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5"
          >
            <p className="text-sm font-medium text-white">{item.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-white/55">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AttentionSummaryPanel({
  companies,
  basePath,
}: {
  companies: ReturnType<typeof buildPortfolioExecutiveBriefing>["attentionCompanies"];
  basePath: ReturnType<typeof useInternalOperationsBasePath>;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        Companies requiring attention
      </h3>
      <div className="mt-3 space-y-2">
        {companies.slice(0, 5).map((company) => {
          const companyHref = getInternalNavHref("portfolio-intelligence-company", basePath, {
            companyId: company.companyId,
          });
          return (
            <Link
              key={company.companyId}
              href={companyHref}
              className="block rounded-lg border border-white/8 bg-white/[0.03] px-3 py-2.5 transition hover:border-emerald-400/20 hover:bg-emerald-500/[0.04]"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white">{company.companyName}</p>
                <span
                  className={cn(
                    "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                    priorityClass(company.priority),
                  )}
                >
                  {company.priority}
                </span>
              </div>
              <p className="mt-1 text-xs text-white/50">{company.reason}</p>
              <p className="mt-1 text-[11px] leading-snug text-emerald-200/80">
                {company.recommendedAction}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
