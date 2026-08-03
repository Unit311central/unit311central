"use client";

import { useMemo, useState, type ReactNode } from "react";
import {
  Archive,
  ArrowLeft,
  Copy,
  Download,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";

import TalantonLogoMark from "@/components/layout/TalantonLogoMark";
import { formatUsd } from "@/lib/talanton/portfolio-data";
import {
  archiveQuarterlyPortfolioUpdate,
  createQuarterlyPortfolioUpdate,
  deleteQuarterlyPortfolioUpdate,
  duplicateQuarterlyPortfolioUpdate,
  periodLabel,
  regenerateQuarterlyPortfolioUpdate,
  type QuarterlyPeriod,
  type QuarterlyPortfolioUpdate,
  type QuarterlyUpdateStatus,
} from "@/lib/talanton/quarterly-portfolio-update-store";
import { downloadQuarterlyPortfolioUpdatePdf } from "@/lib/talanton/quarterly-portfolio-update-pdf";
import { cn } from "@/lib/utils";
import { useQuarterlyPortfolioUpdatesStore } from "./useQuarterlyPortfolioUpdatesStore";

const PortfolioCompanyMap = dynamic(() => import("./PortfolioCompanyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-56 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500">
      Loading portfolio map…
    </div>
  ),
});

type Mode = "dashboard" | "create" | "viewer";

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-full border border-[#1B8A5A]/40 bg-[#1B8A5A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#167a4f]";

const btnGhost =
  "inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-[#1B8A5A]/40 hover:text-[#1B8A5A]";

function statusClass(status: QuarterlyUpdateStatus) {
  if (status === "Published") return "border-emerald-600/30 bg-emerald-50 text-emerald-800";
  if (status === "Generated") return "border-sky-500/30 bg-sky-50 text-sky-800";
  if (status === "Archived") return "border-slate-300 bg-slate-50 text-slate-500";
  return "border-amber-400/40 bg-amber-50 text-amber-800";
}

/** ABHI-style light page chrome: white paper, logo plate top-left, green footer bar. */
function ReportPageShell({
  page,
  total,
  title,
  children,
  cover = false,
}: {
  page: number;
  total: number;
  title: string;
  children: ReactNode;
  cover?: boolean;
}) {
  if (cover) {
    return (
      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-6 sm:p-8">{children}</div>
      </article>
    );
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4 sm:px-8">
        <div className="inline-flex rounded-lg bg-[#1B8A5A] px-3 py-2">
          <TalantonLogoMark height={26} maxWidth={150} />
        </div>
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Page {page} of {total}
          </p>
          <p className="text-sm font-semibold text-[#1B8A5A]">{title}</p>
        </div>
      </header>
      <div className="px-6 py-7 sm:px-8 sm:py-8">{children}</div>
      <footer className="flex items-center justify-between bg-[#1B8A5A] px-6 py-2.5 text-[11px] text-white sm:px-8">
        <span>Talanton Quarterly Portfolio Update</span>
        <span>
          Page {page} of {total}
        </span>
      </footer>
    </article>
  );
}

function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-3xl font-semibold tracking-tight text-[#1B8A5A] sm:text-4xl">
      {children}
    </h2>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#1B8A5A]">
      {children}
    </h3>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="mt-3 space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-base leading-relaxed text-slate-700">
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1B8A5A]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-[#f7faf8] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums text-[#1B8A5A]">{value}</p>
    </div>
  );
}

function BarChart({
  title,
  rows,
  format,
}: {
  title: string;
  rows: Array<{ label: string; value: number }>;
  format: (n: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between gap-2 text-sm">
              <span className="text-slate-700">{r.label}</span>
              <span className="font-semibold tabular-nums text-[#1B8A5A]">{format(r.value)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-[#1B8A5A]"
                style={{ width: `${Math.max(4, Math.round((r.value / max) * 100))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CreateWizard({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (r: QuarterlyPortfolioUpdate) => void;
}) {
  const [year, setYear] = useState(2026);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(4);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <button type="button" onClick={onCancel} className={btnGhost}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Back
      </button>
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 inline-flex rounded-lg bg-[#1B8A5A] px-3 py-2">
          <TalantonLogoMark height={26} maxWidth={150} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Create Quarterly Portfolio Update</h2>
        <p className="mt-2 text-sm text-slate-600">
          Assemble a 12-page executive portfolio publication from live Talanton platform data.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-slate-500">
            Year
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(Number(e.target.value) || 2026)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B8A5A]"
            />
          </label>
          <label className="block text-xs font-medium text-slate-500">
            Quarter
            <select
              value={quarter}
              onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 outline-none focus:border-[#1B8A5A]"
            >
              {[1, 2, 3, 4].map((q) => (
                <option key={q} value={q}>
                  Q{q}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              const period: QuarterlyPeriod = { year, quarter };
              onCreated(createQuarterlyPortfolioUpdate(period));
            }}
          >
            Generate update
          </button>
          <button type="button" className={btnGhost} onClick={onCancel}>
            Cancel
          </button>
        </div>
      </section>
    </div>
  );
}

function ReportViewer({
  report,
  onBack,
  onUpdated,
}: {
  report: QuarterlyPortfolioUpdate;
  onBack: () => void;
  onUpdated: (r: QuarterlyPortfolioUpdate) => void;
}) {
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState<string | null>(null);
  const total = 12;
  const period = periodLabel(report.period);

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2500);
  }

  const pageTitles = [
    "Cover",
    "Executive Summary",
    "Portfolio Overview",
    "Portfolio Performance",
    "New Investments & Changes",
    "Impact Overview",
    "Featured Impact Story",
    "Journey Highlights",
    "Portfolio Highlights",
    "Opportunity Intelligence",
    "Strategic Outlook",
    "Closing Summary",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button type="button" onClick={onBack} className={btnGhost}>
          <ArrowLeft className="h-3.5 w-3.5" />
          All reports
        </button>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              const next = regenerateQuarterlyPortfolioUpdate(report.id);
              if (next) {
                onUpdated(next);
                flash("Refreshed from live platform data.");
              }
            }}
          >
            Refresh data
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              void downloadQuarterlyPortfolioUpdatePdf(report).then(() => flash("Exported PDF."));
            }}
          >
            <Download className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-1.5">
        {pageTitles.map((t, i) => (
          <button
            key={t}
            type="button"
            onClick={() => setPage(i + 1)}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
              page === i + 1
                ? "border-[#1B8A5A] bg-[#1B8A5A] text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-[#1B8A5A]/40",
            )}
          >
            {i + 1}. {t}
          </button>
        ))}
      </div>

      {page === 1 && (
        <ReportPageShell page={1} total={total} title="Cover" cover>
          <div className="inline-flex rounded-lg bg-[#1B8A5A] px-3 py-2">
            <TalantonLogoMark height={28} maxWidth={160} />
          </div>
          <h1 className="mt-14 max-w-3xl text-4xl font-semibold tracking-tight text-[#1B8A5A] sm:text-5xl">
            Talanton Quarterly Portfolio Update
          </h1>
          <p className="mt-6 text-2xl font-semibold text-slate-900">{period}</p>
          <p className="mt-3 text-base text-slate-500">Report Date · {report.reportDate}</p>
          <div className="mt-10 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.heroImageUrl}
              alt=""
              className="h-80 w-full object-cover sm:h-[28rem]"
            />
          </div>
        </ReportPageShell>
      )}

      {page === 2 && (
        <ReportPageShell page={2} total={total} title="Executive Summary">
          <PageTitle>Executive Summary</PageTitle>
          <div className="mt-8 space-y-8">
            <div>
              <SectionLabel>Quarter Highlights</SectionLabel>
              <BulletList items={report.executiveSummary.quarterHighlights} />
            </div>
            <div>
              <SectionLabel>Key Portfolio Developments</SectionLabel>
              <BulletList items={report.executiveSummary.keyPortfolioDevelopments} />
            </div>
            <div>
              <SectionLabel>Key Impact Achievements</SectionLabel>
              <BulletList items={report.executiveSummary.keyImpactAchievements} />
            </div>
            <div>
              <SectionLabel>Portfolio Focus Areas</SectionLabel>
              <BulletList items={report.executiveSummary.portfolioFocusAreas} />
            </div>
            <div>
              <SectionLabel>Looking Ahead</SectionLabel>
              <BulletList items={report.executiveSummary.lookingAhead} />
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 3 && (
        <ReportPageShell page={3} total={total} title="Portfolio Overview">
          <PageTitle>Portfolio Overview</PageTitle>
          <p className="mt-2 text-base text-slate-500">
            Introduction to the active Talanton portfolio.
          </p>
          <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
            <PortfolioCompanyMap />
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#1B8A5A] text-[11px] uppercase tracking-wide text-white">
                <tr>
                  <th className="px-3 py-3 font-semibold">Company Name</th>
                  <th className="px-3 py-3 font-semibold">Country</th>
                  <th className="px-3 py-3 font-semibold">Sector</th>
                  <th className="px-3 py-3 font-semibold">Short Description</th>
                  <th className="px-3 py-3 font-semibold">What They Do</th>
                </tr>
              </thead>
              <tbody>
                {report.portfolioOverview.rows.map((r) => (
                  <tr key={r.companyId} className="border-t border-slate-100 even:bg-[#f7faf8]">
                    <td className="px-3 py-2.5 font-medium text-slate-900">{r.companyName}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.country}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.sector}</td>
                    <td className="px-3 py-2.5 text-slate-600">{r.shortDescription}</td>
                    <td className="max-w-xs px-3 py-2.5 text-slate-600">{r.whatTheyDo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPageShell>
      )}

      {page === 4 && (
        <ReportPageShell page={4} total={total} title="Portfolio Performance">
          <PageTitle>Portfolio Performance</PageTitle>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Revenue Growth"
              value={`${report.performance.revenueGrowthPct}%`}
            />
            <MetricTile
              label="Employment Growth"
              value={`${report.performance.employmentGrowthPct}%`}
            />
            <MetricTile
              label="New Customers Served"
              value={report.performance.newCustomersServed.toLocaleString()}
            />
            <MetricTile
              label="Capital Invested Across Portfolio"
              value={formatUsd(report.performance.capitalRaisedByPortfolioUsd)}
            />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <BarChart
              title="Revenue by Sector"
              rows={report.performance.revenueBySector}
              format={formatUsd}
            />
            <BarChart
              title="Employment by Country"
              rows={report.performance.employmentByCountry}
              format={(n) => n.toLocaleString()}
            />
          </div>
        </ReportPageShell>
      )}

      {page === 5 && (
        <ReportPageShell page={5} total={total} title="New Investments & Portfolio Changes">
          <PageTitle>New Investments & Portfolio Changes</PageTitle>
          <p className="mt-5 text-base leading-relaxed text-slate-700">
            {report.portfolioChanges.summary}
          </p>
          <div className="mt-8 space-y-7">
            <div>
              <SectionLabel>New Investments / Priority Growth</SectionLabel>
              <BulletList items={report.portfolioChanges.newInvestments} />
            </div>
            <div>
              <SectionLabel>Additional Investments</SectionLabel>
              <BulletList items={report.portfolioChanges.additionalInvestments} />
            </div>
            <div>
              <SectionLabel>Portfolio Changes</SectionLabel>
              <BulletList items={report.portfolioChanges.portfolioChanges} />
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 6 && (
        <ReportPageShell page={6} total={total} title="Impact Overview">
          <PageTitle>Impact Overview</PageTitle>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <MetricTile label="Jobs Created" value={report.impact.jobsCreated.toLocaleString()} />
            <MetricTile label="Jobs Retained" value={report.impact.jobsRetained.toLocaleString()} />
            <MetricTile
              label="Women Employed"
              value={report.impact.womenEmployed.toLocaleString()}
            />
            <MetricTile
              label="Youth Employed"
              value={report.impact.youthEmployed.toLocaleString()}
            />
            <MetricTile
              label="Communities Impacted"
              value={report.impact.communitiesImpacted.toLocaleString()}
            />
          </div>
          <div className="mt-6">
            <BarChart
              title="Jobs Created by Sector"
              rows={report.impact.jobsBySector}
              format={(n) => n.toLocaleString()}
            />
          </div>
        </ReportPageShell>
      )}

      {page === 7 && (
        <ReportPageShell page={7} total={total} title="Featured Impact Story">
          <PageTitle>Featured Impact Story</PageTitle>
          <div className="mt-6 overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.featuredStory.imageUrl}
              alt=""
              className="h-72 w-full object-cover sm:h-96"
            />
          </div>
          <h3 className="mt-6 text-2xl font-semibold text-slate-900">
            {report.featuredStory.companyName}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            {report.featuredStory.country} · {report.featuredStory.sector}
          </p>
          <div className="mt-4 inline-flex rounded-lg border border-[#1B8A5A]/20 bg-[#f7faf8] px-4 py-2 text-sm font-semibold text-[#1B8A5A]">
            {report.featuredStory.metricLabel}: {report.featuredStory.metricValue}
          </div>
          <p className="mt-6 text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
            {report.featuredStory.narrative}
          </p>
        </ReportPageShell>
      )}

      {page === 8 && (
        <ReportPageShell page={8} total={total} title="Journey Highlights">
          <PageTitle>Journey Highlights</PageTitle>
          <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-[#1B8A5A]">Countries visited:</span>{" "}
              {report.journeys.countriesVisited.join(", ") || "—"}
            </p>
            <p>
              <span className="font-semibold text-[#1B8A5A]">Companies visited:</span>{" "}
              {report.journeys.companiesVisited.join(", ") || "—"}
            </p>
          </div>
          {report.journeys.gallery.length > 0 ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {report.journeys.gallery.slice(0, 3).map((g) => (
                <figure key={g.url} className="overflow-hidden rounded-xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.url} alt="" className="h-36 w-full object-cover" />
                  <figcaption className="px-3 py-2 text-xs text-slate-500">{g.caption}</figcaption>
                </figure>
              ))}
            </div>
          ) : null}
          <div className="mt-8 space-y-6">
            {report.journeys.blocks.map((b) => (
              <div key={b.title} className="rounded-xl border border-slate-200 bg-[#f7faf8] p-5">
                <h3 className="text-lg font-semibold text-slate-900">{b.title}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {b.country} · {b.companies.join(", ")}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-[#1B8A5A]">Key observations.</span>{" "}
                  {b.observations}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-slate-700">
                  <span className="font-semibold text-[#1B8A5A]">Lessons learned.</span> {b.lessons}
                </p>
              </div>
            ))}
          </div>
        </ReportPageShell>
      )}

      {page === 9 && (
        <ReportPageShell page={9} total={total} title="Portfolio Highlights">
          <PageTitle>Portfolio Highlights</PageTitle>
          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {report.portfolioHighlights.map((h) => (
              <article
                key={`${h.companyName}-${h.kind}`}
                className="rounded-xl border border-slate-200 bg-[#f7faf8] p-5"
              >
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#1B8A5A]">
                  {h.kind}
                </p>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{h.companyName}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {h.country} · {h.sector}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{h.achievement}</p>
              </article>
            ))}
          </div>
        </ReportPageShell>
      )}

      {page === 10 && (
        <ReportPageShell page={10} total={total} title="Opportunity Intelligence">
          <PageTitle>Opportunity Intelligence</PageTitle>
          <div className="mt-8 space-y-8">
            <div>
              <SectionLabel>Strategic Observations</SectionLabel>
              <BulletList items={report.opportunity.observations} />
            </div>
            <div>
              <SectionLabel>Sector Outlook</SectionLabel>
              <BulletList items={report.opportunity.emerging} />
            </div>
            <div>
              <SectionLabel>Recommended Focus</SectionLabel>
              <BulletList items={report.opportunity.recommendedFocus} />
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 11 && (
        <ReportPageShell page={11} total={total} title="Strategic Outlook">
          <PageTitle>Strategic Outlook</PageTitle>
          <div className="mt-8 space-y-8">
            <div>
              <SectionLabel>Management Outlook</SectionLabel>
              <BulletList items={report.outlook.management} />
            </div>
            <div>
              <SectionLabel>Portfolio Outlook</SectionLabel>
              <BulletList items={report.outlook.portfolio} />
            </div>
            <div>
              <SectionLabel>Impact Outlook</SectionLabel>
              <BulletList items={report.outlook.impact} />
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 12 && (
        <ReportPageShell page={12} total={total} title="Closing Summary">
          <PageTitle>Closing Summary</PageTitle>
          <div className="mt-10 max-w-3xl space-y-6">
            {report.closing.statement.split(/\n\n+/).map((para) => (
              <p key={para.slice(0, 40)} className="text-lg leading-relaxed text-slate-700">
                {para}
              </p>
            ))}
          </div>
        </ReportPageShell>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          className={btnGhost}
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous page
        </button>
        <p className="text-xs font-medium text-slate-500">
          {page} / {total} · {pageTitles[page - 1]}
        </p>
        <button
          type="button"
          className={btnGhost}
          disabled={page >= total}
          onClick={() => setPage((p) => Math.min(total, p + 1))}
        >
          Next page
        </button>
      </div>
    </div>
  );
}

export default function QuarterlyPortfolioUpdateWorkspace() {
  const store = useQuarterlyPortfolioUpdatesStore();
  const [mode, setMode] = useState<Mode>("dashboard");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const reports = useMemo(
    () =>
      store.reports
        .slice()
        .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    [store.reports],
  );
  const active = activeId ? reports.find((r) => r.id === activeId) : null;

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2500);
  }

  if (mode === "create") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-slate-50 p-5 sm:p-6">
        <CreateWizard
          onCancel={() => setMode("dashboard")}
          onCreated={(r) => {
            setActiveId(r.id);
            setMode("viewer");
            flash("Quarterly Portfolio Update generated.");
          }}
        />
      </div>
    );
  }

  if (mode === "viewer" && active) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-slate-50 p-5 sm:p-6">
        <ReportViewer
          report={active}
          onBack={() => {
            setMode("dashboard");
            setActiveId(null);
          }}
          onUpdated={(r) => setActiveId(r.id)}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-slate-50 p-5 sm:p-6">
      <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 px-5 py-5 sm:px-7">
          <div className="inline-flex rounded-lg bg-[#1B8A5A] px-3 py-2">
            <TalantonLogoMark height={28} maxWidth={160} />
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#1B8A5A]">
            Portfolio Intelligence
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
                Quarterly Portfolio Update
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600">
                Professional quarterly portfolio publication — performance, impact, journeys and
                outlook for Talanton stakeholders.
              </p>
            </div>
            <button type="button" className={btnPrimary} onClick={() => setMode("create")}>
              <Plus className="h-3.5 w-3.5" />
              Create Report
            </button>
          </div>
        </div>
      </header>

      {notice ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm text-emerald-800">
          {notice}
        </p>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Existing reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Demo library: Q1–Q3 2026 Portfolio Updates assembled from platform data.
        </p>
        <div className="mt-4 space-y-3">
          {reports.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-slate-200 bg-[#f7faf8] p-4 transition hover:border-[#1B8A5A]/40"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <button
                  type="button"
                  className="min-w-0 text-left"
                  onClick={() => {
                    setActiveId(r.id);
                    setMode("viewer");
                  }}
                >
                  <h3 className="text-base font-semibold text-slate-900 hover:text-[#1B8A5A]">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    {periodLabel(r.period)} · {r.reportDate}
                  </p>
                </button>
                <span
                  className={cn(
                    "inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide",
                    statusClass(r.status),
                  )}
                >
                  {r.status}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    setActiveId(r.id);
                    setMode("viewer");
                  }}
                >
                  <FileText className="h-3.5 w-3.5" />
                  Open
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    const next = regenerateQuarterlyPortfolioUpdate(r.id);
                    if (next) {
                      setActiveId(next.id);
                      setMode("viewer");
                      flash("Report refreshed.");
                    }
                  }}
                >
                  Refresh
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    const copy = duplicateQuarterlyPortfolioUpdate(r.id);
                    if (copy) {
                      setActiveId(copy.id);
                      setMode("viewer");
                      flash("Report duplicated.");
                    }
                  }}
                >
                  <Copy className="h-3.5 w-3.5" />
                  Duplicate
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    void downloadQuarterlyPortfolioUpdatePdf(r).then(() => flash("Exported PDF."));
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export PDF
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    archiveQuarterlyPortfolioUpdate(r.id);
                    flash("Archived.");
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  type="button"
                  className={cn(btnGhost, "border-rose-200 text-rose-700 hover:border-rose-300")}
                  onClick={() => {
                    deleteQuarterlyPortfolioUpdate(r.id);
                    if (activeId === r.id) setActiveId(null);
                    flash("Deleted.");
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
