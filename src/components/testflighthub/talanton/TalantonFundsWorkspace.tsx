"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Building2,
  CircleDollarSign,
  Globe2,
  Landmark,
  PieChart,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import {
  FUNDS_PLATFORM_OVERVIEW,
  FUNDS_SAMPLE_DISCLAIMER,
  FUND_VIEW_TO_ID,
  buildFundAiBriefing,
  formatFundUsd,
  getTalantonFund,
  listTalantonFunds,
  type FundDefinition,
  type FundId,
} from "@/lib/talanton/funds-data";
import { cn } from "@/lib/utils";

import { TalantonGeneratedPanel, TalantonImpactMetric } from "./talanton-intelligence-ui";

const FUND_ID_TO_VIEW: Record<FundId, InternalOperationsView> = {
  impact: "funds-impact",
  momentum: "funds-momentum",
  stewards: "funds-stewards",
};

type FundsView =
  | "funds-dashboard"
  | "funds-impact"
  | "funds-momentum"
  | "funds-stewards";

type FundTab = "overview" | "investors" | "portfolio" | "performance" | "documents";

const FUND_TABS: Array<{ id: FundTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "investors", label: "Investors" },
  { id: "portfolio", label: "Portfolio" },
  { id: "performance", label: "Performance" },
  { id: "documents", label: "Documents" },
];

function SampleDisclaimer() {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-50/90">
      {FUNDS_SAMPLE_DISCLAIMER}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  return (
    <span className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-emerald-100">
      {status}
    </span>
  );
}

function AllocationBars({
  rows,
}: {
  rows: Array<{ label: string; pct: number }>;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="text-white/70">{row.label}</span>
            <span className="tabular-nums text-white/90">{row.pct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
              style={{ width: `${Math.min(100, row.pct)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function TrendList({
  title,
  rows,
  valueKey,
}: {
  title: string;
  rows: Array<{ period: string; deployedUsdM?: number; navUsdM?: number }>;
  valueKey: "deployedUsdM" | "navUsdM";
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">{title}</p>
      <ul className="mt-3 space-y-2">
        {rows.map((row) => (
          <li
            key={row.period}
            className="flex items-center justify-between gap-3 border-b border-white/5 pb-2 text-[13px] last:border-0 last:pb-0"
          >
            <span className="text-white/60">{row.period}</span>
            <span className="font-semibold tabular-nums text-white">
              ${Number(row[valueKey] ?? 0).toFixed(1)}M
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FundsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const overview = FUNDS_PLATFORM_OVERVIEW;
  const funds = listTalantonFunds();
  const kpiCopy = [
    `Total Funds: ${overview.totalFunds}`,
    `Total Investors: ${overview.totalInvestors}`,
    `Capital Raised: ${formatFundUsd(overview.capitalRaisedUsd)}`,
    `Capital Deployed: ${formatFundUsd(overview.capitalDeployedUsd)}`,
    `Available Capital: ${formatFundUsd(overview.availableCapitalUsd)}`,
    `Portfolio Companies: ${overview.portfolioCompanies}`,
    `Countries Represented: ${overview.countriesRepresented}`,
  ].join("\n");

  const kpis = [
    { label: "Total Funds", value: String(overview.totalFunds), icon: Landmark },
    { label: "Total Investors", value: String(overview.totalInvestors), icon: Users },
    { label: "Capital Raised", value: formatFundUsd(overview.capitalRaisedUsd), icon: CircleDollarSign },
    { label: "Capital Deployed", value: formatFundUsd(overview.capitalDeployedUsd), icon: TrendingUp },
    { label: "Available Capital", value: formatFundUsd(overview.availableCapitalUsd), icon: Wallet },
    { label: "Portfolio Companies", value: String(overview.portfolioCompanies), icon: Building2 },
    { label: "Countries Represented", value: String(overview.countriesRepresented), icon: Globe2 },
  ];

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
          Funds
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          Fund Dashboard
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">
          Executive overview of Talanton demonstration funds — Impact, Momentum, and Stewards.
          Portfolio and investor figures are illustrative sample data for demos only.
        </p>
      </header>

      <SampleDisclaimer />

      <TalantonGeneratedPanel
        eyebrow="Executive rollup"
        title="Platform fund metrics"
        copyText={kpiCopy}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.label}
                className="rounded-xl border border-white/10 bg-black/25 px-4 py-3.5"
              >
                <div className="flex items-center gap-2 text-emerald-300/80">
                  <Icon className="h-3.5 w-3.5" />
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {kpi.label}
                  </p>
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white">
                  {kpi.value}
                </p>
              </div>
            );
          })}
        </div>
      </TalantonGeneratedPanel>

      <div className="grid gap-4 lg:grid-cols-3">
        {funds.map((fund) => (
          <Link
            key={fund.id}
            href={getInternalNavHref(FUND_ID_TO_VIEW[fund.id], basePath)}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 text-left transition hover:border-emerald-400/35 hover:bg-emerald-500/[0.06]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                  Fund
                </p>
                <h2 className="mt-1 text-lg font-semibold text-white">{fund.name}</h2>
              </div>
              <StatusPill status={fund.status} />
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px]">
              <div>
                <dt className="text-white/40">Fund Size</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">
                  {formatFundUsd(fund.fundSizeUsd)}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Investors</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">{fund.investorCount}</dd>
              </div>
              <div>
                <dt className="text-white/40">Companies</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">
                  {fund.portfolioCompanyCount}
                </dd>
              </div>
              <div>
                <dt className="text-white/40">Deployment</dt>
                <dd className="mt-0.5 font-semibold tabular-nums text-white">{fund.deploymentPct}%</dd>
              </div>
            </dl>
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${fund.deploymentPct}%` }}
              />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function FundDetail({ fund }: { fund: FundDefinition }) {
  const [tab, setTab] = useState<FundTab>("overview");
  const briefing = useMemo(() => buildFundAiBriefing(fund), [fund]);

  return (
    <div className="space-y-5">
      <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
              Funds · {fund.shortName}
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {fund.name}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-white/60">{fund.summary}</p>
          </div>
          <StatusPill status={fund.status} />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <TalantonImpactMetric label="Fund Size" value={formatFundUsd(fund.fundSizeUsd)} tone="good" />
          <TalantonImpactMetric label="Investors" value={fund.investorCount} />
          <TalantonImpactMetric label="Portfolio Companies" value={fund.portfolioCompanyCount} />
          <TalantonImpactMetric label="Deployment" value={`${fund.deploymentPct}%`} tone="good" />
        </div>
      </header>

      <SampleDisclaimer />

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-3">
        {FUND_TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-semibold transition",
              tab === entry.id
                ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/35"
                : "text-white/55 hover:bg-white/5 hover:text-white",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <TalantonGeneratedPanel
            eyebrow="Fund Intelligence"
            title="AI Fund Briefing"
            copyText={briefing.fullText}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Performance summary
                  </h3>
                  <CopyToClipboardButton text={briefing.performanceSummary} />
                </div>
                <p className="text-sm leading-relaxed text-white/75">{briefing.performanceSummary}</p>
              </section>
              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Portfolio highlights
                  </h3>
                  <CopyToClipboardButton text={briefing.portfolioHighlights} />
                </div>
                <p className="text-sm leading-relaxed text-white/75">{briefing.portfolioHighlights}</p>
              </section>
              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Impact highlights
                  </h3>
                  <CopyToClipboardButton text={briefing.impactHighlights} />
                </div>
                <p className="text-sm leading-relaxed text-white/75">{briefing.impactHighlights}</p>
              </section>
              <section className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Risks
                  </h3>
                  <CopyToClipboardButton text={briefing.risks} />
                </div>
                <p className="text-sm leading-relaxed text-white/75">{briefing.risks}</p>
              </section>
            </div>
            <section className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-[12px] font-semibold uppercase tracking-[0.12em] text-emerald-200/80">
                  Recommendations
                </h3>
                <CopyToClipboardButton text={briefing.recommendations} />
              </div>
              <p className="text-sm leading-relaxed text-emerald-50/90">{briefing.recommendations}</p>
            </section>
          </TalantonGeneratedPanel>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <TalantonImpactMetric label="Capital Raised" value={formatFundUsd(fund.capitalRaisedUsd)} />
            <TalantonImpactMetric label="Capital Deployed" value={formatFundUsd(fund.capitalDeployedUsd)} tone="good" />
            <TalantonImpactMetric label="Available Capital" value={formatFundUsd(fund.availableCapitalUsd)} />
            <TalantonImpactMetric label="Portfolio Companies" value={fund.portfolioCompanyCount} />
            <TalantonImpactMetric label="Countries" value={fund.countries} />
            <TalantonImpactMetric label="Deployment" value={`${fund.deploymentPct}%`} tone="good" />
          </div>

          <TalantonGeneratedPanel
            eyebrow="Impact metrics"
            title="Fund impact snapshot"
            copyText={fund.impactMetrics.map((m) => `${m.label}: ${m.value}`).join("\n")}
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {fund.impactMetrics.map((metric) => (
                <TalantonImpactMetric key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </div>
          </TalantonGeneratedPanel>
        </div>
      ) : null}

      {tab === "investors" ? (
        <div className="space-y-4">
          <SampleDisclaimer />
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="min-w-full text-left text-[12px]">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Investor Name</th>
                  <th className="px-3 py-2.5 font-semibold">Type</th>
                  <th className="px-3 py-2.5 font-semibold">Country</th>
                  <th className="px-3 py-2.5 font-semibold">Commitment</th>
                  <th className="px-3 py-2.5 font-semibold">Capital Called</th>
                  <th className="px-3 py-2.5 font-semibold">Remaining</th>
                  <th className="px-3 py-2.5 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody>
                {fund.investors.map((investor) => (
                  <tr key={investor.id} className="border-t border-white/8 text-white/80">
                    <td className="px-3 py-2.5 font-medium text-white">{investor.name}</td>
                    <td className="px-3 py-2.5">{investor.type}</td>
                    <td className="px-3 py-2.5">{investor.country}</td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatFundUsd(investor.commitmentUsd)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatFundUsd(investor.capitalCalledUsd)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums">
                      {formatFundUsd(investor.remainingCommitmentUsd)}
                    </td>
                    <td className="px-3 py-2.5 tabular-nums text-white/60">{investor.joinedDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-[11px] text-white/40">
            Showing {fund.investors.length} fictional sample LPs (fund register size illustrated as{" "}
            {fund.investorCount}).
          </p>
        </div>
      ) : null}

      {tab === "portfolio" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-[12px]">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Company</th>
                <th className="px-3 py-2.5 font-semibold">Country</th>
                <th className="px-3 py-2.5 font-semibold">Sector</th>
                <th className="px-3 py-2.5 font-semibold">Investment Status</th>
                <th className="px-3 py-2.5 font-semibold">Impact Rating</th>
              </tr>
            </thead>
            <tbody>
              {fund.portfolio.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.company}</td>
                  <td className="px-3 py-2.5">{row.country}</td>
                  <td className="px-3 py-2.5">{row.sector}</td>
                  <td className="px-3 py-2.5">{row.investmentStatus}</td>
                  <td className="px-3 py-2.5">
                    <span className="rounded-md border border-emerald-400/25 bg-emerald-500/10 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-100">
                      {row.impactRating}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "performance" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <TalantonImpactMetric label="Capital Raised" value={formatFundUsd(fund.capitalRaisedUsd)} />
            <TalantonImpactMetric
              label="Capital Deployed"
              value={formatFundUsd(fund.capitalDeployedUsd)}
              tone="good"
            />
            <TalantonImpactMetric
              label="Available Capital"
              value={formatFundUsd(fund.availableCapitalUsd)}
            />
          </div>
          <TalantonGeneratedPanel
            eyebrow="Performance analysis"
            title="Deployment & growth commentary"
            copyText={[
              `Deployment trend for ${fund.name}: ${fund.deploymentTrend.map((r) => `${r.period} $${r.deployedUsdM}M`).join("; ")}.`,
              `Fund growth (NAV sample): ${fund.fundGrowth.map((r) => `${r.period} $${r.navUsdM}M`).join("; ")}.`,
              `Sector allocation: ${fund.sectorAllocation.map((s) => `${s.label} ${s.pct}%`).join(", ")}.`,
              `Country allocation: ${fund.countryAllocation.map((c) => `${c.label} ${c.pct}%`).join(", ")}.`,
            ].join("\n")}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <TrendList title="Deployment trend" rows={fund.deploymentTrend} valueKey="deployedUsdM" />
              <TrendList title="Fund growth (NAV)" rows={fund.fundGrowth} valueKey="navUsdM" />
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-white/70">
                  <PieChart className="h-3.5 w-3.5 text-emerald-300" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Sector allocation
                  </p>
                </div>
                <AllocationBars rows={fund.sectorAllocation} />
              </div>
              <div className="rounded-xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-white/70">
                  <Globe2 className="h-3.5 w-3.5 text-emerald-300" />
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    Country allocation
                  </p>
                </div>
                <AllocationBars rows={fund.countryAllocation} />
              </div>
            </div>
          </TalantonGeneratedPanel>
        </div>
      ) : null}

      {tab === "documents" ? (
        <ul className="space-y-2">
          {fund.documents.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3"
            >
              <div>
                <p className="text-[13px] font-medium text-white">{doc.title}</p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  {doc.category} · Updated {doc.updatedAt}
                </p>
              </div>
              <span className="rounded-md border border-white/15 px-2 py-1 text-[10px] uppercase tracking-[0.1em] text-white/50">
                Sample
              </span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export default function TalantonFundsWorkspace({ view }: { view: string }) {
  const fundsView = view as FundsView;
  const fundId = FUND_VIEW_TO_ID[fundsView];

  if (fundId) {
    return <FundDetail fund={getTalantonFund(fundId)} />;
  }

  return <FundsDashboard />;
}
