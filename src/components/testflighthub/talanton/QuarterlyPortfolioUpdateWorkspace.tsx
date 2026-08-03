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
import {
  TalantonGeneratedPanel,
} from "./talanton-intelligence-ui";
import { useQuarterlyPortfolioUpdatesStore } from "./useQuarterlyPortfolioUpdatesStore";

const PortfolioCompanyMap = dynamic(() => import("./PortfolioCompanyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center rounded-xl border border-[#1B8A5A]/20 bg-[#f3faf6] text-sm text-[#1B8A5A]/70">
      Loading portfolio map…
    </div>
  ),
});

type Mode = "dashboard" | "create" | "viewer";

const GREEN = "#1B8A5A";

/** Light-report KPI card — dark ink on white/green (readable on green+white pages). */
function ReportMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "good";
}) {
  const valueClass =
    tone === "watch"
      ? "text-amber-700"
      : tone === "good"
        ? "text-[#1B8A5A]"
        : "text-slate-900";

  return (
    <div className="rounded-xl border border-[#1B8A5A]/25 bg-white px-4 py-3.5 shadow-sm">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#1B8A5A]/80">
        {label}
      </p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-slate-500">{hint}</p> : null}
    </div>
  );
}

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-full border border-[#1B8A5A]/40 bg-[#1B8A5A] px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-[#167a4f]";

const btnGhost =
  "inline-flex items-center gap-1.5 rounded-full border border-[#1B8A5A]/25 bg-white px-3 py-1.5 text-xs font-medium text-[#1B8A5A] transition hover:bg-[#1B8A5A]/8";

function statusClass(status: QuarterlyUpdateStatus) {
  if (status === "Published") return "border-emerald-600/30 bg-emerald-50 text-emerald-800";
  if (status === "Generated") return "border-sky-500/30 bg-sky-50 text-sky-800";
  if (status === "Archived") return "border-slate-300 bg-slate-50 text-slate-500";
  return "border-amber-400/40 bg-amber-50 text-amber-800";
}

function ReportPageShell({
  page,
  total,
  title,
  children,
  light = true,
}: {
  page: number;
  total: number;
  title: string;
  children: ReactNode;
  light?: boolean;
}) {
  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border shadow-sm",
        light
          ? "border-[#1B8A5A]/15 bg-white text-slate-800"
          : "border-[#1B8A5A]/40 bg-[#0b1f16] text-white",
      )}
    >
      <header
        className={cn(
          "flex items-center justify-between gap-3 border-b px-5 py-3 sm:px-6",
          light ? "border-[#1B8A5A]/12 bg-[#1B8A5A]" : "border-white/10 bg-[#1B8A5A]",
        )}
      >
        <TalantonLogoMark height={28} maxWidth={160} />
        <div className="text-right">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/80">
            Page {page} of {total}
          </p>
          <p className="text-xs font-medium text-white">{title}</p>
        </div>
      </header>
      <div className="p-5 sm:p-7">{children}</div>
    </article>
  );
}

function BarRow({
  label,
  pct,
  hint,
}: {
  label: string;
  pct: number;
  hint?: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <span className="text-sm text-slate-700">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-[#1B8A5A]">
          {hint ?? `${pct}%`}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#1B8A5A]/12">
        <div
          className="h-full rounded-full bg-[#1B8A5A]"
          style={{ width: `${Math.min(100, Math.max(4, pct))}%` }}
        />
      </div>
    </div>
  );
}

function TrendBars({
  rows,
  format,
}: {
  rows: Array<{ label: string; value: number }>;
  format: (n: number) => string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="flex h-40 items-end gap-3">
      {rows.map((r) => (
        <div key={r.label} className="flex flex-1 flex-col items-center gap-2">
          <span className="text-[10px] font-semibold tabular-nums text-[#1B8A5A]">
            {format(r.value)}
          </span>
          <div
            className="w-full max-w-[3rem] rounded-t-md bg-gradient-to-t from-[#1B8A5A] to-[#3cb371]"
            style={{ height: `${Math.max(12, Math.round((r.value / max) * 100))}%` }}
          />
          <span className="text-[11px] font-medium text-slate-500">{r.label}</span>
        </div>
      ))}
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
      <section className="rounded-2xl border border-[#1B8A5A]/20 bg-white p-6 shadow-sm">
        <div className="mb-4 rounded-xl bg-[#1B8A5A] px-4 py-3">
          <TalantonLogoMark height={26} maxWidth={150} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Create Quarterly Portfolio Update</h2>
        <p className="mt-2 text-sm text-slate-600">
          Assemble a 12-page portfolio performance and impact update for management, board, and IC
          — not a governance board pack.
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
    "Quarter At A Glance",
    "Executive Commentary",
    "Portfolio Footprint",
    "Portfolio Performance",
    "Impact Overview",
    "Featured Impact Story",
    "Journey Highlights",
    "Portfolio Highlights",
    "New Investments & Capital",
    "Opportunity Intelligence",
    "Looking Ahead",
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
              void downloadQuarterlyPortfolioUpdatePdf(report).then(() =>
                flash("Exported PDF."),
              );
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
                : "border-[#1B8A5A]/20 bg-white text-[#1B8A5A]/80 hover:bg-[#1B8A5A]/8",
            )}
          >
            {i + 1}. {t}
          </button>
        ))}
      </div>

      {page === 1 && (
        <ReportPageShell page={1} total={total} title="Cover" light={false}>
          <div className="relative overflow-hidden rounded-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.heroImageUrl}
              alt=""
              className="h-72 w-full object-cover sm:h-96"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0b1f16] via-[#0b1f16]/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-300">
                Talanton Impact
              </p>
              <h2 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                Talanton Quarterly Portfolio Update
              </h2>
              <p className="mt-3 text-lg text-white/85">{period}</p>
              <p className="mt-2 max-w-xl text-sm text-white/60">
                Portfolio performance, impact, and progress for management, board, and investment
                committee.
              </p>
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 2 && (
        <ReportPageShell page={2} total={total} title="Quarter At A Glance">
          <h2 className="text-2xl font-semibold text-slate-900">Quarter At A Glance</h2>
          <p className="mt-1 text-sm text-slate-500">{period} · Executive KPI summary</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <ReportMetric
              label="Portfolio Companies"
              value={report.glance.portfolioCompanies}
            />
            <ReportMetric label="Countries Active" value={report.glance.countriesActive} />
            <ReportMetric
              label="Capital Raised"
              value={formatUsd(report.glance.capitalRaisedUsd)}
            />
            <ReportMetric
              label="Capital Deployed"
              value={formatUsd(report.glance.capitalDeployedUsd)}
            />
            <ReportMetric
              label="People Served"
              value={report.glance.peopleServed.toLocaleString()}
              tone="good"
            />
            <ReportMetric
              label="Jobs Created"
              value={report.glance.jobsCreated.toLocaleString()}
            />
            <ReportMetric label="New Investments" value={report.glance.newInvestments} />
            <ReportMetric
              label="Impact Health Score"
              value={`${report.glance.impactHealthScore}/100`}
              tone="watch"
            />
          </div>
        </ReportPageShell>
      )}

      {page === 3 && (
        <ReportPageShell page={3} total={total} title="Executive Commentary">
          <h2 className="text-2xl font-semibold text-slate-900">Executive Commentary</h2>
          <div className="mt-5 space-y-4">
            {(
              [
                ["Quarter Overview", report.commentary.quarterOverview],
                ["Major Developments", report.commentary.majorDevelopments],
                ["Key Achievements", report.commentary.keyAchievements],
                ["Areas of Focus", report.commentary.areasOfFocus],
              ] as const
            ).map(([heading, body]) => (
              <TalantonGeneratedPanel key={heading} eyebrow="Narrative" title={heading} copyText={body}>
                <p className="text-sm leading-relaxed text-white/75">{body}</p>
              </TalantonGeneratedPanel>
            ))}
          </div>
        </ReportPageShell>
      )}

      {page === 4 && (
        <ReportPageShell page={4} total={total} title="Portfolio Footprint">
          <h2 className="text-2xl font-semibold text-slate-900">Portfolio Footprint</h2>
          <p className="mt-1 text-sm text-slate-500">
            Composition and geography — not a repeat of the glance metrics.
          </p>
          <div className="mt-5 overflow-hidden rounded-xl border border-[#1B8A5A]/15">
            <PortfolioCompanyMap />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-3 rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4">
              <h3 className="text-sm font-semibold text-[#1B8A5A]">Distribution by country</h3>
              {report.footprint.byCountry.map((c) => (
                <BarRow key={c.label} label={c.label} pct={c.pct} hint={`${c.value} · ${c.pct}%`} />
              ))}
            </div>
            <div className="space-y-3 rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4">
              <h3 className="text-sm font-semibold text-[#1B8A5A]">Distribution by sector</h3>
              {report.footprint.bySector.map((c) => (
                <BarRow key={c.label} label={c.label} pct={c.pct} hint={`${c.value} · ${c.pct}%`} />
              ))}
            </div>
          </div>
          <div className="mt-6 overflow-x-auto rounded-xl border border-[#1B8A5A]/15">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-[#1B8A5A] text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">Company</th>
                  <th className="px-3 py-2.5 font-semibold">Country</th>
                  <th className="px-3 py-2.5 font-semibold">Sector</th>
                  <th className="px-3 py-2.5 font-semibold">Employees</th>
                  <th className="px-3 py-2.5 font-semibold">Revenue</th>
                  <th className="px-3 py-2.5 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {report.footprint.rows.map((r) => (
                  <tr key={r.companyId} className="border-t border-slate-100 even:bg-[#f7fcf9]">
                    <td className="px-3 py-2 font-medium text-slate-800">{r.companyName}</td>
                    <td className="px-3 py-2 text-slate-600">{r.country}</td>
                    <td className="px-3 py-2 text-slate-600">{r.sector}</td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">
                      {r.employees.toLocaleString()}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-slate-700">
                      {formatUsd(r.revenueUsd)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          r.status === "Watch"
                            ? "bg-amber-100 text-amber-800"
                            : r.status === "Follow-on"
                              ? "bg-sky-100 text-sky-800"
                              : "bg-emerald-100 text-emerald-800",
                        )}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ReportPageShell>
      )}

      {page === 5 && (
        <ReportPageShell page={5} total={total} title="Portfolio Performance">
          <h2 className="text-2xl font-semibold text-slate-900">Portfolio Performance</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <ReportMetric
              label="Portfolio Revenue"
              value={formatUsd(report.performance.portfolioRevenueUsd)}
            />
            <ReportMetric
              label="Revenue Growth"
              value={`${report.performance.revenueGrowthPct}%`}
              tone="good"
            />
            <ReportMetric
              label="Employee Growth"
              value={`${report.performance.employeeGrowthPct}%`}
            />
            <ReportMetric
              label="Capital Raised"
              value={formatUsd(report.performance.capitalRaisedUsd)}
            />
            <ReportMetric
              label="Capital Deployed"
              value={formatUsd(report.performance.capitalDeployedUsd)}
            />
          </div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4">
              <h3 className="mb-4 text-sm font-semibold text-[#1B8A5A]">Revenue trend</h3>
              <TrendBars rows={report.performance.revenueTrend} format={(n) => formatUsd(n)} />
            </div>
            <div className="rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4">
              <h3 className="mb-4 text-sm font-semibold text-[#1B8A5A]">Employee trend</h3>
              <TrendBars
                rows={report.performance.employeeTrend}
                format={(n) => n.toLocaleString()}
              />
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 6 && (
        <ReportPageShell page={6} total={total} title="Impact Overview">
          <h2 className="text-2xl font-semibold text-slate-900">Impact Overview</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <ReportMetric
              label="People Served"
              value={report.impact.peopleServed.toLocaleString()}
              tone="good"
            />
            <ReportMetric
              label="Jobs Created"
              value={report.impact.jobsCreated.toLocaleString()}
            />
            <ReportMetric
              label="Jobs Retained"
              value={report.impact.jobsRetained.toLocaleString()}
            />
            <ReportMetric
              label="Women Impacted"
              value={report.impact.womenImpacted.toLocaleString()}
            />
            <ReportMetric
              label="Youth Impacted"
              value={report.impact.youthImpacted.toLocaleString()}
            />
            <ReportMetric
              label="Communities Reached"
              value={report.impact.communitiesReached.toLocaleString()}
            />
          </div>
          <div className="mt-5">
            <TalantonGeneratedPanel
              eyebrow="Impact Intelligence"
              title="Impact narrative"
              copyText={report.impact.narrative}
            >
              <p className="text-sm leading-relaxed text-white/75">{report.impact.narrative}</p>
            </TalantonGeneratedPanel>
          </div>
        </ReportPageShell>
      )}

      {page === 7 && (
        <ReportPageShell page={7} total={total} title="Featured Impact Story">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={report.featuredStory.imageUrl}
                alt=""
                className="h-72 w-full rounded-xl object-cover sm:h-96"
              />
              <div className="mt-4 grid grid-cols-3 gap-2">
                {report.featuredStory.metrics.map((m) => (
                  <div
                    key={m.label}
                    className="rounded-xl border border-[#1B8A5A]/20 bg-[#f7fcf9] px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[#1B8A5A]/70">
                      {m.label}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">{m.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1B8A5A]">
                Featured Impact Story
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">
                {report.featuredStory.companyName}
              </h2>
              <p className="mt-1 text-sm text-slate-500">{report.featuredStory.country}</p>
              {(
                [
                  ["Challenge", report.featuredStory.challenge],
                  ["Solution", report.featuredStory.solution],
                  ["Outcome", report.featuredStory.outcome],
                  ["Why It Matters", report.featuredStory.whyItMatters],
                ] as const
              ).map(([h, body]) => (
                <div key={h} className="mt-4">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1B8A5A]">
                    {h}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 8 && (
        <ReportPageShell page={8} total={total} title="Journey Highlights">
          <h2 className="text-2xl font-semibold text-slate-900">Journey Highlights</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pulled from Journey Stories · {report.journeys.countriesVisited.join(", ") || "—"} ·{" "}
            {report.journeys.companiesVisited.length} companies visited
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {report.journeys.gallery.map((g) => (
              <figure
                key={g.url + g.caption}
                className="overflow-hidden rounded-xl border border-[#1B8A5A]/15"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="" className="h-32 w-full object-cover" />
                <figcaption className="bg-[#f7fcf9] px-2.5 py-2 text-[11px] text-slate-600">
                  {g.caption}
                </figcaption>
              </figure>
            ))}
          </div>
          <div className="mt-6 space-y-4">
            {report.journeys.blocks.map((b) => (
              <TalantonGeneratedPanel
                key={b.title}
                eyebrow={b.country}
                title={b.title}
                copyText={[
                  b.observations,
                  `Opportunities: ${b.opportunities}`,
                  `Challenges: ${b.challenges}`,
                  `Companies: ${b.companies.join(", ")}`,
                ].join("\n")}
              >
                <p className="text-xs text-white/45">Companies: {b.companies.join(", ")}</p>
                <p className="mt-2 text-sm text-white/75">
                  <span className="font-semibold text-emerald-200">Observations — </span>
                  {b.observations}
                </p>
                <p className="mt-2 text-sm text-white/75">
                  <span className="font-semibold text-emerald-200">Opportunities — </span>
                  {b.opportunities}
                </p>
                <p className="mt-2 text-sm text-white/75">
                  <span className="font-semibold text-emerald-200">Challenges — </span>
                  {b.challenges}
                </p>
              </TalantonGeneratedPanel>
            ))}
          </div>
        </ReportPageShell>
      )}

      {page === 9 && (
        <ReportPageShell page={9} total={total} title="Portfolio Highlights">
          <h2 className="text-2xl font-semibold text-slate-900">Portfolio Highlights</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {report.portfolioHighlights.map((h) => (
              <article
                key={h.companyName + h.kind}
                className="rounded-xl border border-[#1B8A5A]/20 bg-[#f7fcf9] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{h.companyName}</h3>
                  <span className="rounded-full bg-[#1B8A5A]/12 px-2.5 py-0.5 text-[10px] font-semibold uppercase text-[#1B8A5A]">
                    {h.kind}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {h.country} · {h.sector}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">{h.milestone}</p>
              </article>
            ))}
          </div>
        </ReportPageShell>
      )}

      {page === 10 && (
        <ReportPageShell page={10} total={total} title="New Investments & Capital">
          <h2 className="text-2xl font-semibold text-slate-900">
            New Investments & Capital Deployment
          </h2>
          <TalantonGeneratedPanel
            eyebrow="Capital"
            title="Deployment activity"
            copyText={report.capital.deploymentNarrative}
            className="mt-5"
          >
            <p className="text-sm leading-relaxed text-white/75">
              {report.capital.deploymentNarrative}
            </p>
          </TalantonGeneratedPanel>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4">
              <h3 className="text-sm font-semibold text-[#1B8A5A]">New portfolio companies</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {report.capital.newCompanies.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
              <h3 className="mt-4 text-sm font-semibold text-[#1B8A5A]">Additional investments</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {report.capital.additionalInvestments.map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
            <div className="space-y-5">
              <div className="space-y-3 rounded-xl border border-[#1B8A5A]/15 bg-white p-4">
                <h3 className="text-sm font-semibold text-[#1B8A5A]">Sector allocation</h3>
                {report.capital.sectorAllocation.map((s) => (
                  <BarRow key={s.label} label={s.label} pct={s.pct} />
                ))}
              </div>
              <div className="space-y-3 rounded-xl border border-[#1B8A5A]/15 bg-white p-4">
                <h3 className="text-sm font-semibold text-[#1B8A5A]">Country allocation</h3>
                {report.capital.countryAllocation.map((s) => (
                  <BarRow key={s.label} label={s.label} pct={s.pct} />
                ))}
              </div>
            </div>
          </div>
        </ReportPageShell>
      )}

      {page === 11 && (
        <ReportPageShell page={11} total={total} title="Opportunity Intelligence">
          <h2 className="text-2xl font-semibold text-slate-900">Opportunity Intelligence</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {(
              [
                ["Emerging Opportunities", report.opportunity.emerging],
                ["Growth Opportunities", report.opportunity.growth],
                ["Strategic Opportunities", report.opportunity.strategic],
                ["Market Trends", report.opportunity.marketTrends],
              ] as const
            ).map(([title, items]) => (
              <TalantonGeneratedPanel
                key={title}
                eyebrow="Opportunity"
                title={title}
                copyText={items.join("\n")}
              >
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/75">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </TalantonGeneratedPanel>
            ))}
          </div>
          <div className="mt-4">
            <TalantonGeneratedPanel
              eyebrow="AI commentary"
              title="Opportunity commentary"
              copyText={report.opportunity.aiCommentary}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {report.opportunity.aiCommentary}
              </pre>
            </TalantonGeneratedPanel>
          </div>
        </ReportPageShell>
      )}

      {page === 12 && (
        <ReportPageShell page={12} total={total} title="Looking Ahead">
          <h2 className="text-2xl font-semibold text-slate-900">Looking Ahead</h2>
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {(
              [
                ["Next Quarter Priorities", report.lookingAhead.nextQuarterPriorities],
                ["Portfolio Focus Areas", report.lookingAhead.portfolioFocusAreas],
                ["Growth Priorities", report.lookingAhead.growthPriorities],
                ["Impact Priorities", report.lookingAhead.impactPriorities],
              ] as const
            ).map(([title, items]) => (
              <TalantonGeneratedPanel
                key={title}
                eyebrow="Forward look"
                title={title}
                copyText={items.join("\n")}
              >
                <ul className="list-disc space-y-1.5 pl-5 text-sm text-white/75">
                  {items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </TalantonGeneratedPanel>
            ))}
          </div>
          <div className="mt-4">
            <TalantonGeneratedPanel
              eyebrow="Closing"
              title="Closing summary"
              copyText={report.lookingAhead.closingSummary}
            >
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
                {report.lookingAhead.closingSummary}
              </pre>
            </TalantonGeneratedPanel>
          </div>
        </ReportPageShell>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          className={btnGhost}
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          Previous page
        </button>
        <p className="text-xs font-medium text-slate-500" style={{ color: GREEN }}>
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
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-[#f4faf7] p-5 sm:p-6">
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
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-[#f4faf7] p-5 sm:p-6">
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
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto bg-[#f4faf7] p-5 sm:p-6">
      <header className="overflow-hidden rounded-2xl border border-[#1B8A5A]/20 bg-white shadow-sm">
        <div className="bg-[#1B8A5A] px-5 py-4 sm:px-7">
          <TalantonLogoMark height={32} maxWidth={180} />
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
            Impact Intelligence
          </p>
          <div className="mt-1 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                Quarterly Portfolio Update
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
                Concise quarterly view of portfolio performance, impact, and progress — for Talanton
                management, board, investment committee, and internal stakeholders. Not a board
                deck.
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

      <section className="rounded-2xl border border-[#1B8A5A]/15 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Existing reports</h2>
        <p className="mt-1 text-sm text-slate-500">
          Demo library: Q1–Q3 2026 Portfolio Updates assembled from platform data.
        </p>
        <div className="mt-4 space-y-3">
          {reports.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-[#1B8A5A]/15 bg-[#f7fcf9] p-4 transition hover:border-[#1B8A5A]/35"
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
                    Reporting period · {periodLabel(r.period)} · Created{" "}
                    {new Date(r.createdAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
                      flash("Report refreshed for editing.");
                    }
                  }}
                >
                  Edit
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
                    void downloadQuarterlyPortfolioUpdatePdf(r).then(() =>
                      flash("Exported PDF."),
                    );
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
                    flash("Report archived.");
                  }}
                >
                  <Archive className="h-3.5 w-3.5" />
                  Archive
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    if (window.confirm(`Delete “${r.title}”?`)) {
                      deleteQuarterlyPortfolioUpdate(r.id);
                      flash("Report deleted.");
                    }
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
