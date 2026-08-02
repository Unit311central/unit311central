"use client";

import { useCallback, useEffect, useMemo, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import {
  buildCompanyIntelligence,
  formatCompanyActionText,
  formatCompanyRiskText,
  listCompanyIntelligenceOptions,
  resolveCompanyIntelligenceId,
  type CompanyActivityItem,
  type CompanyRecommendedAction,
} from "@/lib/talanton/company-intelligence";
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

function urgencyClass(urgency: CompanyRecommendedAction["urgency"]) {
  switch (urgency) {
    case "Today":
      return "border-rose-400/30 bg-rose-500/10 text-rose-200";
    case "This week":
      return "border-amber-400/30 bg-amber-500/10 text-amber-100";
    default:
      return "border-emerald-400/25 bg-emerald-500/10 text-emerald-100";
  }
}

function activityIcon(kind: CompanyActivityItem["kind"]) {
  switch (kind) {
    case "report":
      return <FileText className="h-3.5 w-3.5 text-emerald-300" />;
    case "training":
      return <GraduationCap className="h-3.5 w-3.5 text-sky-300" />;
    case "document":
      return <ClipboardList className="h-3.5 w-3.5 text-teal-300" />;
    case "review":
      return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-300" />;
    case "risk":
      return <ShieldAlert className="h-3.5 w-3.5 text-orange-300" />;
    default:
      return <Building2 className="h-3.5 w-3.5 text-white/50" />;
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
  tone = "default",
}: {
  label: string;
  value: string;
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
      <p className={cn("mt-2 text-lg font-semibold tracking-tight sm:text-xl", valueClass)}>{value}</p>
    </div>
  );
}

export default function CompanyIntelligenceWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useInternalOperationsBasePath();
  const options = useMemo(() => listCompanyIntelligenceOptions(), []);

  const companyId = resolveCompanyIntelligenceId(searchParams.get("companyId"));
  const intel = useMemo(() => buildCompanyIntelligence(companyId), [companyId]);

  const selectCompany = useCallback(
    (nextId: string) => {
      const href = getInternalNavHref("portfolio-intelligence-company", basePath, {
        companyId: nextId,
      });
      router.push(href);
    },
    [basePath, router],
  );

  useEffect(() => {
    if (searchParams.get("companyId")) return;
    router.replace(
      getInternalNavHref("portfolio-intelligence-company", basePath, { companyId }),
    );
  }, [basePath, companyId, router, searchParams]);

  const { company, health, summary, performance, risks, compliance } = intel;

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7 sm:py-7">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
        />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
              Talanton Intelligence
            </p>
            <p className="mt-1.5 text-[11px] font-medium tracking-wide text-emerald-200/55">
              Portfolio Intelligence
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Company Intelligence
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-white/60">
              Executive view of a single holding — status, performance, risk, compliance, and the
              actions Talanton staff should take next.
            </p>
          </div>

          <div className="w-full max-w-md">
            <label
              htmlFor="company-intelligence-selector"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80"
            >
              Portfolio company
            </label>
            <div className="relative mt-1.5">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/70" />
              <select
                id="company-intelligence-selector"
                value={companyId}
                onChange={(e) => selectCompany(e.target.value)}
                className="w-full appearance-none rounded-xl border border-white/15 bg-black/35 py-2.5 pl-10 pr-9 text-sm font-medium text-white outline-none transition focus:border-emerald-400/40"
              >
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id} className="bg-[#0b1a14] text-white">
                    {opt.name} · {opt.country}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-1.5 text-xs text-white/40">
              {company.sector} · {company.city}, {company.country}
            </p>
          </div>
        </div>

        <div className="relative mt-5 flex flex-wrap items-center gap-2 text-xs text-white/55">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/25 px-3 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-emerald-300" />
            {company.name}
          </span>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-medium ring-1 ring-inset",
              riskClass(health.riskRating),
            )}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            {health.riskRating} risk · Health {health.healthScore}/100
          </span>
        </div>
      </header>

      <GeneratedPanel eyebrow="AI generated" title="Executive Summary" copyText={intel.summaryText}>
        <div className="space-y-5 text-sm leading-relaxed text-white/75">
          <SummaryBlock heading="Current company status" body={summary.currentStatus} />
          <SummaryBlock heading="Performance trend" body={summary.performanceTrend} />
          <SummaryBlock heading="Risk profile" body={summary.riskProfile} />
          <SummaryBlock heading="Compliance position" body={summary.compliancePosition} />
          <SummaryList heading="Key developments" items={summary.keyDevelopments} />
          <SummaryList
            heading="Recommended focus areas"
            items={summary.recommendedFocusAreas}
            ordered
          />
        </div>
      </GeneratedPanel>

      <GeneratedPanel eyebrow="Scorecard" title="Company Health" copyText={intel.healthText}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <HealthMetric
            label="Health Score"
            value={`${health.healthScore}/100`}
            tone={
              health.healthScore >= 78 ? "good" : health.healthScore >= 65 ? "watch" : "alert"
            }
          />
          <HealthMetric
            label="Risk Rating"
            value={health.riskRating}
            tone={
              health.riskRating === "Critical" || health.riskRating === "High"
                ? "alert"
                : health.riskRating === "Medium"
                  ? "watch"
                  : "good"
            }
          />
          <HealthMetric
            label="Compliance Status"
            value={health.complianceStatus}
            tone={
              health.complianceStatus.startsWith("At risk")
                ? "alert"
                : health.complianceStatus.startsWith("Watch")
                  ? "watch"
                  : "good"
            }
          />
          <HealthMetric
            label="Reporting Status"
            value={health.reportingStatus}
            tone={
              health.reportingStatus.includes("Overdue")
                ? "alert"
                : health.reportingStatus.includes("Due Soon") ||
                    health.reportingStatus.includes("Not Started")
                  ? "watch"
                  : "good"
            }
          />
          <HealthMetric
            label="Last Review Date"
            value={formatShortDate(health.lastReviewDate)}
            tone="default"
          />
        </div>
      </GeneratedPanel>

      <GeneratedPanel
        eyebrow="Operating picture"
        title="Performance Overview"
        copyText={intel.performanceText}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <InsightRow
            icon={<TrendingUp className="h-4 w-4 text-emerald-300" />}
            label="Revenue trend"
            value={performance.revenueTrend}
          />
          <InsightRow
            icon={<TrendingUp className="h-4 w-4 text-sky-300" />}
            label="Growth trend"
            value={performance.growthTrend}
          />
          <InsightRow
            icon={<Users className="h-4 w-4 text-teal-300" />}
            label="Headcount"
            value={`${performance.headcount.toLocaleString("en-GB")} employees`}
          />
          <InsightRow
            icon={<AlertTriangle className="h-4 w-4 text-amber-300" />}
            label="Cash position"
            value={performance.cashPosition}
          />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {performance.keyKpis.map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-xl border border-white/10 bg-black/20 px-4 py-3"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                {kpi.label}
              </p>
              <p className="mt-1.5 text-xl font-semibold tabular-nums text-white">{kpi.value}</p>
              <p className="mt-1 text-[11px] text-white/40">{kpi.note}</p>
            </div>
          ))}
        </div>
      </GeneratedPanel>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              Risk register
            </p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
              Risks & Concerns
            </h2>
          </div>
          <CopyToClipboardButton text={intel.risksText} />
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {risks.map((risk) => (
            <article
              key={risk.id}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-white">{risk.title}</h3>
                  <p className="mt-1 text-xs text-white/45">
                    Owner {risk.owner} · Due {formatShortDate(risk.dueDate)}
                  </p>
                </div>
                <CopyToClipboardButton
                  text={formatCompanyRiskText(risk, company.name)}
                  className="shrink-0"
                />
              </div>
              <span
                className={cn(
                  "inline-flex rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset",
                  riskClass(risk.severity),
                )}
              >
                {risk.severity} severity
              </span>
              <p className="mt-3 text-sm leading-relaxed text-white/55">{risk.description}</p>
              <div className="mt-4 rounded-xl border border-amber-400/15 bg-amber-500/[0.07] px-3 py-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-200/80">
                  Mitigation status
                </p>
                <p className="mt-1 text-sm text-amber-50/95">{risk.mitigationStatus}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <GeneratedPanel
        eyebrow="Assurance"
        title="Compliance & Assurance"
        copyText={intel.complianceText}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Training completion
            </p>
            <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
              {compliance.trainingCompletionPct}%
            </p>
            <p className="mt-1 text-xs text-white/40">
              {company.outstandingTraining} outstanding items · {company.usersEnrolled} enrolled
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
              Policy compliance
            </p>
            <p className="mt-2 text-sm leading-relaxed text-white/75">{compliance.policyCompliance}</p>
          </div>
        </div>
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Outstanding requirements
          </p>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm text-white/70">
            {compliance.outstandingRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </GeneratedPanel>

      <GeneratedPanel eyebrow="Timeline" title="Recent Activity" copyText={intel.activityText}>
        <ol className="relative space-y-0 border-l border-white/10 pl-5">
          {intel.recentActivity.map((item) => (
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
              <p className="mt-1 text-sm leading-relaxed text-white/55">{item.detail}</p>
            </li>
          ))}
        </ol>
      </GeneratedPanel>

      <GeneratedPanel
        eyebrow="Action centre"
        title="Recommended Actions"
        copyText={intel.actionsText}
      >
        <p className="mb-4 max-w-3xl text-sm text-white/55">
          AI-generated recommendations for Talanton staff working {company.name}.
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {intel.recommendedActions.map((action) => (
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
                  text={formatCompanyActionText(action)}
                  className="shrink-0"
                />
              </div>
              <h3 className="text-sm font-semibold leading-snug text-white">{action.title}</h3>
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

function SummaryBlock({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
        {heading}
      </h3>
      <p className="mt-2 text-white/75">{body}</p>
    </div>
  );
}

function SummaryList({
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

function InsightRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <div className="flex items-center gap-2 text-white/45">
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">{label}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-white/80">{value}</p>
    </div>
  );
}
