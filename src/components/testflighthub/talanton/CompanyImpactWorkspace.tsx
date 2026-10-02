"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Building2 } from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { getLatestImpactReportForIntelligence } from "@/lib/talanton/company-stories-impact";
import {
  buildCompanyImpactProfile,
  buildPortfolioImpactBriefing,
  listCompanyImpactOptions,
  resolveCompanyImpactId,
  type ImpactTrend,
} from "@/lib/talanton/impact-intelligence";
import { useTalantonMemo } from "@/lib/talanton/use-talanton-intelligence-briefing";
import { cn } from "@/lib/utils";
import { useInternalOperationsBasePath } from "../InternalOperationsBasePathContext";
import { formatUsd } from "@/lib/talanton/portfolio-data";
import { UNAVAILABLE_LABEL } from "@/lib/talanton/intelligence-metric-types";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
  formatNullableCount,
} from "./talanton-intelligence-ui";

function trendClass(trend: ImpactTrend) {
  if (trend === "Improving") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (trend === "Declining") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  return "border-white/15 bg-white/[0.04] text-white/70";
}

function severityClass(severity: "Watch" | "Elevated" | "Critical") {
  if (severity === "Critical") return "border-rose-400/30 bg-rose-500/10 text-rose-100";
  if (severity === "Elevated") return "border-orange-400/30 bg-orange-500/10 text-orange-100";
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

export default function CompanyImpactWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const basePath = useInternalOperationsBasePath();
  const portfolioBriefing = useTalantonMemo(() => buildPortfolioImpactBriefing());
  const options = useTalantonMemo(() => listCompanyImpactOptions());

  const companyId = resolveCompanyImpactId(searchParams.get("companyId"));
  const profile = useTalantonMemo(() => buildCompanyImpactProfile(companyId), [companyId]);
  const portalReport = useMemo(
    () => getLatestImpactReportForIntelligence(companyId),
    [companyId],
  );

  const selectCompany = useCallback(
    (nextId: string) => {
      router.push(
        getInternalNavHref("impact-intelligence-company", basePath, { companyId: nextId }),
      );
    },
    [basePath, router],
  );

  useEffect(() => {
    if (searchParams.get("companyId")) return;
    router.replace(
      getInternalNavHref("impact-intelligence-company", basePath, { companyId }),
    );
  }, [basePath, companyId, router, searchParams]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Impact Intelligence"
        title="Company Impact"
        description="Detailed impact view for a selected portfolio company — jobs, inclusion, community reach, economic contribution, risks, and opportunities."
        actions={
          <div className="w-full max-w-md">
            <label
              htmlFor="company-impact-selector"
              className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/80"
            >
              Portfolio company
            </label>
            <div className="relative mt-1.5">
              <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-300/70" />
              <select
                id="company-impact-selector"
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
              {profile.sector} · {profile.country}
              {portalReport
                ? ` · Portal report ${portalReport.reportingPeriod} (${portalReport.status})`
                : ""}
            </p>
          </div>
        }
      />

      {portalReport ? (
        <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Metrics below incorporate the latest company portal impact submission (
          {portalReport.reportingPeriod}). Same figures feed Board Portal Impact Intelligence and
          portfolio analytics.
        </div>
      ) : (
        <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          No company portal impact submission on file. Core metrics below use the portfolio impact model
          from holdings data; portal submissions replace modelled figures when reported (local portal
          persistence — not Supabase).
        </div>
      )}

      <TalantonGeneratedPanel
        title="Impact Executive Briefing"
        copyText={portfolioBriefing.briefingText}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <ImpactBriefTile heading="Overall portfolio impact" body={portfolioBriefing.overallImpact} />
          <ImpactBriefTile
            heading="Key achievements"
            body={portfolioBriefing.keyAchievements.slice(0, 4).join(" · ")}
          />
          <ImpactBriefTile
            heading="Areas requiring attention"
            body={portfolioBriefing.areasRequiringAttention.slice(0, 4).join(" · ")}
          />
          <ImpactBriefTile
            heading="Recommended actions"
            body={portfolioBriefing.recommendedActionsNarrative.slice(0, 4).join(" · ")}
          />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel title="Impact Summary" copyText={profile.summaryText}>
        <p className="max-w-3xl text-sm leading-relaxed text-white/75">{profile.aiSummary}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium",
              trendClass(profile.trend),
            )}
          >
            Trend · {profile.trend}
          </span>
          <span className="rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-xs text-white/70">
            Key metric · {profile.keyImpactMetricLabel}: {profile.keyImpactMetric}
          </span>
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel title="Core Impact Metrics" copyText={profile.metricsText}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TalantonImpactMetric
            label="Jobs Created"
            value={formatNullableCount(profile.jobsCreated)}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
            hint={profile.impactMetricsFromSubmission ? "Portal submission" : "Holdings impact model"}
          />
          <TalantonImpactMetric
            label="Jobs Retained"
            value={formatNullableCount(profile.jobsRetained)}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
            hint={profile.impactMetricsFromSubmission ? "Portal submission" : "Holdings impact model"}
          />
          <TalantonImpactMetric
            label="Women Employed"
            value={formatNullableCount(profile.womenEmployed)}
            hint={`${Math.round(profile.womenEmployedPct * 100)}% of workforce · ${
              profile.impactMetricsFromSubmission ? "portal submission" : "holdings model"
            }`}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
          />
          <TalantonImpactMetric
            label="Youth Employed"
            value={formatNullableCount(profile.youthEmployed)}
            hint={`${Math.round(profile.youthEmployedPct * 100)}% of workforce · ${
              profile.impactMetricsFromSubmission ? "portal submission" : "holdings model"
            }`}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
          />
          <TalantonImpactMetric
            label="People Served"
            value={formatNullableCount(profile.peopleServed)}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
            hint={profile.impactMetricsFromSubmission ? "Portal submission" : "Holdings impact model"}
          />
          <TalantonImpactMetric
            label="Communities Impacted"
            value={formatNullableCount(profile.communitiesImpacted)}
            unavailable={profile.companyName === UNAVAILABLE_LABEL}
            hint={profile.impactMetricsFromSubmission ? "Portal submission" : "Holdings impact model"}
          />
          <TalantonImpactMetric
            label="Economic Contribution"
            value={
              profile.economicContributionUnavailable
                ? UNAVAILABLE_LABEL
                : formatUsd(profile.economicContributionUsd ?? 0)
            }
            hint={
              profile.economicContributionUnavailable
                ? "Not in portal submission schema"
                : "Holdings impact model"
            }
            unavailable={profile.economicContributionUnavailable}
          />
          <TalantonImpactMetric label="Country" value={profile.country} hint={profile.sector} />
        </div>
      </TalantonGeneratedPanel>

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
            <CopyToClipboardButton text={profile.risksText} />
          </div>
          <div className="space-y-3">
            {profile.risks.map((risk) => (
              <article
                key={risk.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{risk.title}</h3>
                  <div className="flex shrink-0 items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        severityClass(risk.severity),
                      )}
                    >
                      {risk.severity}
                    </span>
                    <CopyToClipboardButton
                      text={`Impact Risk — ${profile.companyName}\n${risk.title} (${risk.severity})\n\n${risk.detail}`}
                    />
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
                Upside
              </p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">
                Impact Opportunities
              </h2>
            </div>
            <CopyToClipboardButton text={profile.opportunitiesText} />
          </div>
          <div className="space-y-3">
            {profile.opportunities.map((opp) => (
              <article
                key={opp.id}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold text-white">{opp.title}</h3>
                  <CopyToClipboardButton
                    text={`Impact Opportunity — ${profile.companyName}\n${opp.title}\n\n${opp.detail}`}
                  />
                </div>
                <p className="text-sm leading-relaxed text-white/60">{opp.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function ImpactBriefTile({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">{heading}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{body}</p>
    </div>
  );
}
