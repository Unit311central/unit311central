"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, Search } from "lucide-react";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getInternalNavHref, type InternalOperationsView } from "@/lib/internal-operations-data";
import {
  FUNDS_PLATFORM_OVERVIEW,
  FUNDS_SAMPLE_DISCLAIMER,
  FUND_VIEW_TO_ID,
  buildCapitalAllocationChart,
  buildCapitalByCountryChart,
  buildCapitalByFundChart,
  buildCapitalBySectorChart,
  buildFundAiBriefing,
  capitalCommitmentsSummary,
  formatFundUsd,
  fundImpactSummary,
  getPlatformInvestor,
  getTalantonFund,
  listCapitalCommitments,
  listPlatformInvestors,
  listTalantonFunds,
  type CapitalChartRow,
  type FundDefinition,
  type FundId,
  type InvestorStatus,
  type InvestorType,
  type PlatformInvestor,
} from "@/lib/talanton/funds-data";
import { getJourneyStory } from "@/lib/talanton/journey-stories-store";
import { cn } from "@/lib/utils";

import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

const FUND_ID_TO_VIEW: Record<FundId, InternalOperationsView> = {
  impact: "funds-impact",
  momentum: "funds-momentum",
  stewards: "funds-stewards",
};

type FundsView =
  | "funds-dashboard"
  | "funds-impact"
  | "funds-momentum"
  | "funds-stewards"
  | "funds-investors"
  | "funds-commitments"
  | "funds-performance";

type FundTab = "overview" | "portfolio" | "impact";

const FUND_TABS: Array<{ id: FundTab; label: string }> = [
  { id: "overview", label: "Overview" },
  { id: "portfolio", label: "Portfolio Allocation" },
  { id: "impact", label: "Impact Summary" },
];

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/85 outline-none focus:border-emerald-400/40";

function SampleDisclaimer() {
  return (
    <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[12px] leading-relaxed text-amber-50/90">
      {FUNDS_SAMPLE_DISCLAIMER}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Active" || status === "Investing" || status === "Fulfilled"
      ? "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
      : status === "Onboarding" || status === "Pending" || status === "Committed"
        ? "border-amber-400/30 bg-amber-500/15 text-amber-100"
        : "border-white/15 bg-white/5 text-white/60";
  return (
    <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]", tone)}>
      {status}
    </span>
  );
}

function AllocationBars({
  rows,
  showAmount,
}: {
  rows: CapitalChartRow[] | Array<{ label: string; pct: number; amountUsd?: number }>;
  showAmount?: boolean;
}) {
  return (
    <ul className="space-y-2.5">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex items-center justify-between gap-2 text-[12px]">
            <span className="text-white/70">{row.label}</span>
            <span className="tabular-nums text-white/90">
              {showAmount && "amountUsd" in row && row.amountUsd != null
                ? `${formatFundUsd(row.amountUsd)} · ${row.pct}%`
                : `${row.pct}%`}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
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

function ChartCard({
  title,
  rows,
  showAmount,
}: {
  title: string;
  rows: CapitalChartRow[];
  showAmount?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
        {title}
      </p>
      <div className="mt-4">
        <AllocationBars rows={rows} showAmount={showAmount} />
      </div>
    </div>
  );
}

function FundsDashboard() {
  const basePath = useInternalOperationsBasePath();
  const overview = FUNDS_PLATFORM_OVERVIEW;
  const funds = listTalantonFunds();
  const byFund = buildCapitalByFundChart();
  const byCountry = buildCapitalByCountryChart();
  const bySector = buildCapitalBySectorChart();
  const allocation = buildCapitalAllocationChart();

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Funds · Stewardship"
        title="Fund Dashboard"
        description="Executive view of Talanton capital stewardship — investors, commitments, deployment into portfolio companies, and impact health across Impact, Momentum and Stewards funds."
      />
      <SampleDisclaimer />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric label="Total Investors" value={listPlatformInvestors().length} />
        <TalantonImpactMetric
          label="Total Capital Committed"
          value={formatFundUsd(overview.capitalCommittedUsd)}
          tone="good"
        />
        <TalantonImpactMetric
          label="Total Capital Deployed"
          value={formatFundUsd(overview.capitalDeployedUsd)}
        />
        <TalantonImpactMetric
          label="Available Capital"
          value={formatFundUsd(overview.availableCapitalUsd)}
        />
        <TalantonImpactMetric
          label="Active Portfolio Companies"
          value={overview.portfolioCompanies}
        />
        <TalantonImpactMetric label="Countries Active" value={overview.countriesRepresented} />
        <TalantonImpactMetric
          label="Impact Health Score"
          value={`${overview.impactHealthScore}/100`}
          tone="watch"
          hint="Portfolio stewardship band"
        />
        <TalantonImpactMetric label="Funds" value={overview.totalFunds} hint="Impact · Momentum · Stewards" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Capital Allocation" rows={allocation} showAmount />
        <ChartCard title="Capital By Fund" rows={byFund} showAmount />
        <ChartCard title="Capital By Country" rows={byCountry.slice(0, 6)} showAmount />
        <ChartCard title="Capital By Sector" rows={bySector.slice(0, 6)} showAmount />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {funds.map((fund) => (
          <Link
            key={fund.id}
            href={getInternalNavHref(FUND_ID_TO_VIEW[fund.id], basePath)}
            className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.02] p-5 transition hover:border-emerald-400/35 hover:bg-emerald-500/[0.06]"
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
                <dt className="text-white/40">Deployed</dt>
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

function InvestorsWorkspace() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<InvestorType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<InvestorStatus | "all">("all");
  const [fundFilter, setFundFilter] = useState<FundId | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const investors = useMemo(() => {
    return listPlatformInvestors().filter((inv) => {
      if (typeFilter !== "all" && inv.type !== typeFilter) return false;
      if (statusFilter !== "all" && inv.status !== statusFilter) return false;
      if (fundFilter !== "all" && !inv.fundIds.includes(fundFilter)) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        inv.name.toLowerCase().includes(q) ||
        inv.organisation.toLowerCase().includes(q) ||
        inv.type.toLowerCase().includes(q)
      );
    });
  }, [query, typeFilter, statusFilter, fundFilter]);

  const selected = selectedId ? getPlatformInvestor(selectedId) : null;

  if (selected) {
    return <InvestorProfile investor={selected} onBack={() => setSelectedId(null)} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Funds · Investors"
        title="Investors"
        description="Relationship view of Talanton investors — organisations, fund participation, commitments and stewardship communications."
      />
      <SampleDisclaimer />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="relative block xl:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            className={cn(inputClass, "pl-9")}
            placeholder="Search investors or organisations…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className={inputClass}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as InvestorType | "all")}
        >
          <option value="all">All investor types</option>
          {(
            [
              "Family Office",
              "Foundation",
              "Faith-Based Investor",
              "Donor Advised Fund",
              "Private Investor",
              "Institutional Investor",
            ] as InvestorType[]
          ).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className={inputClass}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvestorStatus | "all")}
        >
          <option value="all">All statuses</option>
          <option value="Active">Active</option>
          <option value="Committed">Committed</option>
          <option value="Onboarding">Onboarding</option>
        </select>
        <select
          className={inputClass}
          value={fundFilter}
          onChange={(e) => setFundFilter(e.target.value as FundId | "all")}
        >
          <option value="all">All funds</option>
          <option value="impact">Impact Fund</option>
          <option value="momentum">Momentum Fund</option>
          <option value="stewards">Stewards Fund</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-[12px]">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Investor Name</th>
              <th className="px-3 py-2.5 font-semibold">Organisation</th>
              <th className="px-3 py-2.5 font-semibold">Investor Type</th>
              <th className="px-3 py-2.5 font-semibold">Fund Participation</th>
              <th className="px-3 py-2.5 font-semibold">Commitment</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Joined</th>
              <th className="px-3 py-2.5 font-semibold" />
            </tr>
          </thead>
          <tbody>
            {investors.map((inv) => (
              <tr key={inv.id} className="border-t border-white/8 text-white/80">
                <td className="px-3 py-2.5 font-medium text-white">{inv.name}</td>
                <td className="px-3 py-2.5">{inv.organisation}</td>
                <td className="px-3 py-2.5">{inv.type}</td>
                <td className="px-3 py-2.5">
                  {inv.fundIds
                    .map((id) => getTalantonFund(id).shortName)
                    .join(" · ")}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{formatFundUsd(inv.commitmentUsd)}</td>
                <td className="px-3 py-2.5">
                  <StatusPill status={inv.status} />
                </td>
                <td className="px-3 py-2.5 tabular-nums text-white/55">{inv.joinedDate}</td>
                <td className="px-3 py-2.5">
                  <button
                    type="button"
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-emerald-100 hover:bg-emerald-500/15"
                    onClick={() => setSelectedId(inv.id)}
                  >
                    View Profile
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-white/40">{investors.length} investors shown · sample directory</p>
    </div>
  );
}

function InvestorProfile({
  investor,
  onBack,
}: {
  investor: PlatformInvestor;
  onBack: () => void;
}) {
  const stories = investor.relatedJourneyStoryIds
    .map((id) => getJourneyStory(id))
    .filter(Boolean);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-emerald-200/90 hover:text-emerald-100"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Investors
      </button>

      <TalantonIntelligenceHeader
        moduleLabel="Funds · Investor Profile"
        title={investor.name}
        description={`${investor.organisation} · ${investor.type} · ${investor.country}`}
        actions={<StatusPill status={investor.status} />}
      />
      <SampleDisclaimer />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric label="Capital Committed" value={formatFundUsd(investor.commitmentUsd)} tone="good" />
        <TalantonImpactMetric label="Funds" value={investor.fundIds.length} />
        <TalantonImpactMetric label="Joined" value={investor.joinedDate} />
        <TalantonImpactMetric label="Country" value={investor.country} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
            Investor Details
          </h3>
          <dl className="mt-3 space-y-2 text-sm text-white/75">
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">Organisation</dt>
              <dd className="text-right text-white">{investor.organisation}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">Type</dt>
              <dd className="text-right">{investor.type}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-white/45">Status</dt>
              <dd>
                <StatusPill status={investor.status} />
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
            Funds Participating In
          </h3>
          <ul className="mt-3 space-y-2">
            {investor.fundIds.map((id) => {
              const fund = getTalantonFund(id);
              return (
                <li
                  key={id}
                  className="flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <span className="text-white">{fund.name}</span>
                  <span className="text-white/45">{fund.status}</span>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
            Portfolio Exposure
          </h3>
          <ul className="mt-3 space-y-1.5 text-sm text-white/75">
            {investor.portfolioExposure.map((c) => (
              <li key={c} className="flex gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                {c}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
            Communications History
          </h3>
          <ul className="mt-3 space-y-2">
            {investor.communications.map((c) => (
              <li key={c.id} className="rounded-xl border border-white/8 px-3 py-2">
                <p className="text-sm text-white">{c.subject}</p>
                <p className="mt-0.5 text-[11px] text-white/45">
                  {c.date} · {c.channel}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/25 p-5">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
          Related Journey Stories
        </h3>
        <ul className="mt-3 grid gap-3 lg:grid-cols-2">
          {stories.length === 0 ? (
            <li className="text-sm text-white/45">No linked Journey Stories in this demo set.</li>
          ) : (
            stories.map((s) =>
              s ? (
                <li key={s.id} className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3">
                  <p className="text-sm font-medium text-white">{s.title}</p>
                  <p className="mt-1 text-[11px] text-white/45">
                    {s.country} · {s.startDate}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-white/60">
                    {s.generated.executiveSummary}
                  </p>
                </li>
              ) : null,
            )
          )}
        </ul>
      </section>
    </div>
  );
}

function CommitmentsWorkspace() {
  const summary = capitalCommitmentsSummary();
  const rows = listCapitalCommitments();
  const [query, setQuery] = useState("");
  const [fundFilter, setFundFilter] = useState<FundId | "all">("all");

  const filtered = rows.filter((r) => {
    if (fundFilter !== "all" && r.fundId !== fundFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      r.investorName.toLowerCase().includes(q) ||
      r.organisation.toLowerCase().includes(q) ||
      r.fundName.toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Funds · Capital"
        title="Capital Commitments"
        description="Stewardship view of investor commitments across Impact, Momentum and Stewards — committed capital, deployed capital and remaining capacity."
      />
      <SampleDisclaimer />

      <div className="grid gap-3 sm:grid-cols-3">
        <TalantonImpactMetric
          label="Total Committed"
          value={formatFundUsd(summary.totalCommitted)}
          tone="good"
        />
        <TalantonImpactMetric
          label="Total Deployed"
          value={formatFundUsd(summary.totalDeployed)}
        />
        <TalantonImpactMetric
          label="Remaining Capital"
          value={formatFundUsd(summary.remainingCapital)}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Commitments By Fund" rows={summary.byFund} showAmount />
        <ChartCard title="Capital Allocation" rows={buildCapitalAllocationChart()} showAmount />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            className={cn(inputClass, "pl-9")}
            placeholder="Search commitments…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <select
          className={inputClass}
          value={fundFilter}
          onChange={(e) => setFundFilter(e.target.value as FundId | "all")}
        >
          <option value="all">All funds</option>
          <option value="impact">Impact Fund</option>
          <option value="momentum">Momentum Fund</option>
          <option value="stewards">Stewards Fund</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-[12px]">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Fund</th>
              <th className="px-3 py-2.5 font-semibold">Investor</th>
              <th className="px-3 py-2.5 font-semibold">Organisation</th>
              <th className="px-3 py-2.5 font-semibold">Commitment Amount</th>
              <th className="px-3 py-2.5 font-semibold">Date</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t border-white/8 text-white/80">
                <td className="px-3 py-2.5 text-white">{r.fundName}</td>
                <td className="px-3 py-2.5">{r.investorName}</td>
                <td className="px-3 py-2.5">{r.organisation}</td>
                <td className="px-3 py-2.5 tabular-nums">{formatFundUsd(r.amountUsd)}</td>
                <td className="px-3 py-2.5 tabular-nums text-white/55">{r.date}</td>
                <td className="px-3 py-2.5">
                  <StatusPill status={r.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FundPerformanceWorkspace() {
  const overview = FUNDS_PLATFORM_OVERVIEW;
  const funds = listTalantonFunds();

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Funds · Stewardship Performance"
        title="Fund Performance"
        description="Strategic view of capital deployment, portfolio distribution and impact outcomes — focused on stewardship and community growth, not private equity administration."
      />
      <SampleDisclaimer />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric
          label="Capital Deployed"
          value={formatFundUsd(overview.capitalDeployedUsd)}
          tone="good"
        />
        <TalantonImpactMetric
          label="Available Capital"
          value={formatFundUsd(overview.availableCapitalUsd)}
        />
        <TalantonImpactMetric
          label="Portfolio Companies"
          value={overview.portfolioCompanies}
        />
        <TalantonImpactMetric
          label="Impact Health Score"
          value={`${overview.impactHealthScore}/100`}
          tone="watch"
        />
      </div>

      <TalantonGeneratedPanel
        eyebrow="Deployment progress"
        title="Capital deployment by fund"
        copyText={funds
          .map(
            (f) =>
              `${f.name}: ${f.deploymentPct}% deployed (${formatFundUsd(f.capitalDeployedUsd)} of ${formatFundUsd(f.capitalRaisedUsd)})`,
          )
          .join("\n")}
      >
        <div className="space-y-4">
          {funds.map((f) => (
            <div key={f.id}>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-white/80">{f.name}</span>
                <span className="tabular-nums text-white">{f.deploymentPct}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-300"
                  style={{ width: `${f.deploymentPct}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard title="Portfolio Company Distribution (by fund capital)" rows={buildCapitalByFundChart()} showAmount />
        <ChartCard title="Country Distribution" rows={buildCapitalByCountryChart().slice(0, 7)} showAmount />
        <ChartCard title="Sector Distribution" rows={buildCapitalBySectorChart().slice(0, 7)} showAmount />
        <div className="rounded-2xl border border-white/10 bg-black/25 p-5">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-emerald-300/75">
            Impact Metrics
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {funds.map((f) => {
              const impact = fundImpactSummary(f);
              return (
                <div key={f.id} className="rounded-xl border border-white/8 bg-white/[0.03] p-3">
                  <p className="text-sm font-medium text-white">{f.shortName}</p>
                  <p className="mt-2 text-[11px] text-white/50">People served · {impact.people}</p>
                  <p className="text-[11px] text-white/50">Jobs created · {impact.jobs}</p>
                  <p className="text-[11px] text-white/50">Communities · {impact.communities}</p>
                  <p className="mt-1 text-[11px] text-emerald-200/80">Health · {impact.health}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function FundDetail({ fund }: { fund: FundDefinition }) {
  const [tab, setTab] = useState<FundTab>("overview");
  const briefing = useMemo(() => buildFundAiBriefing(fund), [fund]);
  const impact = fundImpactSummary(fund);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel={`Funds · ${fund.shortName}`}
        title={fund.name}
        description={fund.summary}
        actions={<StatusPill status={fund.status} />}
      />
      <SampleDisclaimer />

      <div className="flex flex-wrap gap-2">
        {FUND_TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              tab === entry.id
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/55 hover:border-white/25 hover:text-white",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <TalantonImpactMetric label="Fund Size" value={formatFundUsd(fund.fundSizeUsd)} tone="good" />
            <TalantonImpactMetric label="Investors" value={fund.investorCount} />
            <TalantonImpactMetric
              label="Capital Deployed"
              value={formatFundUsd(fund.capitalDeployedUsd)}
            />
            <TalantonImpactMetric
              label="Remaining Capital"
              value={formatFundUsd(fund.availableCapitalUsd)}
            />
            <TalantonImpactMetric label="Portfolio Companies" value={fund.portfolioCompanyCount} />
            <TalantonImpactMetric label="Countries" value={fund.countries} />
          </div>

          <TalantonGeneratedPanel
            eyebrow="Fund Intelligence"
            title="Stewardship Briefing"
            copyText={briefing.fullText}
          >
            <div className="grid gap-4 lg:grid-cols-2">
              <p className="text-sm leading-relaxed text-white/75">{briefing.performanceSummary}</p>
              <p className="text-sm leading-relaxed text-white/75">{briefing.portfolioHighlights}</p>
              <p className="text-sm leading-relaxed text-white/75">{briefing.impactHighlights}</p>
              <p className="text-sm leading-relaxed text-white/75">{briefing.recommendations}</p>
            </div>
          </TalantonGeneratedPanel>
        </div>
      ) : null}

      {tab === "portfolio" ? (
        <div className="overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-left text-[12px]">
            <thead className="bg-white/[0.04] text-[10px] uppercase tracking-[0.12em] text-white/45">
              <tr>
                <th className="px-3 py-2.5 font-semibold">Companies Funded</th>
                <th className="px-3 py-2.5 font-semibold">Allocation Amount</th>
                <th className="px-3 py-2.5 font-semibold">Sector</th>
                <th className="px-3 py-2.5 font-semibold">Country</th>
                <th className="px-3 py-2.5 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {fund.portfolio.map((row) => (
                <tr key={row.id} className="border-t border-white/8 text-white/80">
                  <td className="px-3 py-2.5 font-medium text-white">{row.company}</td>
                  <td className="px-3 py-2.5 tabular-nums">{formatFundUsd(row.allocationUsd)}</td>
                  <td className="px-3 py-2.5">{row.sector}</td>
                  <td className="px-3 py-2.5">{row.country}</td>
                  <td className="px-3 py-2.5">
                    <StatusPill status={row.investmentStatus} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "impact" ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <TalantonImpactMetric label="People Served" value={impact.people} />
            <TalantonImpactMetric label="Jobs Created" value={impact.jobs} tone="good" />
            <TalantonImpactMetric label="Communities Impacted" value={impact.communities} />
            <TalantonImpactMetric label="Impact Health Score" value={impact.health} tone="watch" />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <ChartCard title="Sector Allocation" rows={fund.sectorAllocation.map((r) => ({ ...r, amountUsd: 0 }))} />
            <ChartCard title="Country Allocation" rows={fund.countryAllocation.map((r) => ({ ...r, amountUsd: 0 }))} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function TalantonFundsWorkspace({ view }: { view: string }) {
  const fundsView = view as FundsView;

  if (fundsView === "funds-investors") return <InvestorsWorkspace />;
  if (fundsView === "funds-commitments") return <CommitmentsWorkspace />;
  if (fundsView === "funds-performance") return <FundPerformanceWorkspace />;

  const fundId = FUND_VIEW_TO_ID[fundsView];
  if (fundId) {
    return <FundDetail fund={getTalantonFund(fundId)} />;
  }

  return <FundsDashboard />;
}
