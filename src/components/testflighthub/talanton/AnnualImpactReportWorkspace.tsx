"use client";

import { useMemo, useState } from "react";
import {
  Archive,
  ArrowLeft,
  Copy,
  Download,
  FileText,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react";

import { saveAbhiBoardPack } from "@/lib/abhi/board-pack-record";
import {
  annualImpactReportDashboardMetrics,
  archiveAnnualImpactReport,
  createAnnualImpactReport,
  deleteAnnualImpactReport,
  downloadImpactReport,
  duplicateAnnualImpactReport,
  IMPACT_REPORT_KINDS,
  listTalantonFunds,
  periodLabel,
  publishImpactReportToBoard,
  regenerateAnnualImpactReport,
  scopeLabel,
  upsertAnnualImpactReport,
  type AnnualImpactReport,
  type ImpactReportKind,
  type ImpactReportPeriod,
  type ImpactReportScope,
} from "@/lib/talanton/annual-impact-report-store";
import { formatUsd, TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";
import { cn } from "@/lib/utils";
import {
  TalantonGeneratedPanel,
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";
import { useAnnualImpactReportsStore } from "./useAnnualImpactReportsStore";

type Mode = "dashboard" | "create" | "viewer";

const inputClass =
  "w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-emerald-400/40";

const btnPrimary =
  "inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-100 transition hover:bg-emerald-500/25";

const btnGhost =
  "inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white/75 transition hover:bg-white/[0.08]";

function statusClass(status: AnnualImpactReport["status"]) {
  if (status === "Published") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-200";
  if (status === "Generated") return "border-sky-400/30 bg-sky-500/10 text-sky-100";
  if (status === "Archived") return "border-white/15 bg-white/[0.04] text-white/45";
  return "border-amber-400/30 bg-amber-500/10 text-amber-100";
}

function kindLabel(kind: ImpactReportKind) {
  return IMPACT_REPORT_KINDS.find((k) => k.id === kind)?.label ?? kind;
}

function syncReportToBoardPack(report: AnnualImpactReport) {
  if (typeof window === "undefined") return;
  saveAbhiBoardPack({
    id: `air-pack-${report.id}`,
    packName: report.title,
    meetingDate: report.generatedAt.slice(0, 10),
    status: "Final",
    createdAt: report.generatedAt,
    pdfOpenUrl: "#",
    pptxDownloadUrl: "#",
    folderPath: `Annual Impact Reports/${report.id}`,
    pageSummaries: [
      report.summaries.executiveSummary,
      report.summaries.boardSummary,
      ...report.sections.lookingForward.split("\n").filter(Boolean).slice(0, 3),
    ],
  });
}

function MetricBar({
  label,
  value,
  max,
  tone = "emerald",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "emerald" | "sky" | "amber";
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const fill =
    tone === "sky"
      ? "bg-sky-400/70"
      : tone === "amber"
        ? "bg-amber-400/70"
        : "bg-emerald-400/70";
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-xs text-white/65">{label}</span>
        <span className="text-xs font-semibold tabular-nums text-white/85">
          {value.toLocaleString()}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/10">
        <div className={cn("h-full rounded-full transition-all", fill)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ReportCover({ report }: { report: AnnualImpactReport }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-400/25 bg-[radial-gradient(ellipse_at_top,_rgba(27,138,90,0.35),_transparent_55%),linear-gradient(160deg,#0a1f16_0%,#06140f_50%,#040c09_100%)] px-6 py-10 sm:px-10 sm:py-14">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 top-0 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
      />
      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-300/90">
        Talanton Impact
      </p>
      <h2 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {report.sections.coverTitle}
      </h2>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/60">
        {report.sections.coverSubtitle}
      </p>
      <div className="mt-8 flex flex-wrap gap-3 text-xs text-white/55">
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5">
          Period · {periodLabel(report.period)}
        </span>
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5">
          Scope · {scopeLabel(report.scope)}
        </span>
        <span className="rounded-full border border-white/12 bg-black/25 px-3 py-1.5">
          Generated ·{" "}
          {new Date(report.generatedAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </span>
      </div>
    </div>
  );
}

function CreateWizard({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (report: AnnualImpactReport) => void;
}) {
  const funds = useMemo(() => listTalantonFunds(), []);
  const countries = useMemo(
    () => [...new Set(TALANTON_PORTFOLIO_COMPANIES.map((c) => c.country))].sort(),
    [],
  );

  const [kind, setKind] = useState<ImpactReportKind>("annual");
  const [periodMode, setPeriodMode] = useState<ImpactReportPeriod["mode"]>("year");
  const [year, setYear] = useState(2026);
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(2);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [scopeMode, setScopeMode] = useState<ImpactReportScope["mode"]>("portfolio");
  const [fundId, setFundId] = useState<"impact" | "momentum" | "stewards">("impact");
  const [country, setCountry] = useState(countries[0] ?? "Kenya");
  const [companyIds, setCompanyIds] = useState<string[]>([]);

  function buildPeriod(): ImpactReportPeriod {
    if (periodMode === "quarter") return { mode: "quarter", year, quarter };
    if (periodMode === "custom") return { mode: "custom", startDate, endDate };
    return { mode: "year", year };
  }

  function buildScope(): ImpactReportScope {
    if (scopeMode === "fund") return { mode: "fund", fundId };
    if (scopeMode === "country") return { mode: "country", country };
    if (scopeMode === "companies") {
      return {
        mode: "companies",
        companyIds: companyIds.length
          ? companyIds
          : TALANTON_PORTFOLIO_COMPANIES.slice(0, 3).map((c) => c.id),
      };
    }
    return { mode: "portfolio" };
  }

  function toggleCompany(id: string) {
    setCompanyIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <button type="button" onClick={onCancel} className={btnGhost}>
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to reports
      </button>

      <TalantonIntelligenceHeader
        moduleLabel="Impact Intelligence · Annual Impact Report"
        title="Create Impact Report"
        description="Assemble an investor- and board-grade impact narrative from live Talanton platform data — Impact Intelligence, Journey Stories, Funds, and portfolio holdings."
      />

      <section className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Report type
          </h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {IMPACT_REPORT_KINDS.map((k) => (
              <button
                key={k.id}
                type="button"
                onClick={() => setKind(k.id)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left text-sm transition",
                  kind === k.id
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-white/10 bg-black/20 text-white/70 hover:bg-white/[0.05]",
                )}
              >
                {k.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Reporting period
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["year", "Year"],
                ["quarter", "Quarter"],
                ["custom", "Custom Date Range"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPeriodMode(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  periodMode === id
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-white/12 text-white/65",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(periodMode === "year" || periodMode === "quarter") && (
              <label className="block text-xs text-white/50">
                Year
                <input
                  type="number"
                  className={cn(inputClass, "mt-1")}
                  value={year}
                  onChange={(e) => setYear(Number(e.target.value) || 2026)}
                />
              </label>
            )}
            {periodMode === "quarter" && (
              <label className="block text-xs text-white/50">
                Quarter
                <select
                  className={cn(inputClass, "mt-1")}
                  value={quarter}
                  onChange={(e) => setQuarter(Number(e.target.value) as 1 | 2 | 3 | 4)}
                >
                  {[1, 2, 3, 4].map((q) => (
                    <option key={q} value={q}>
                      Q{q}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {periodMode === "custom" && (
              <>
                <label className="block text-xs text-white/50">
                  Start
                  <input
                    type="date"
                    className={cn(inputClass, "mt-1")}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </label>
                <label className="block text-xs text-white/50">
                  End
                  <input
                    type="date"
                    className={cn(inputClass, "mt-1")}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
            Report scope
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {(
              [
                ["portfolio", "Entire Portfolio"],
                ["fund", "Specific Fund"],
                ["country", "Specific Country"],
                ["companies", "Specific Portfolio Companies"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setScopeMode(id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  scopeMode === id
                    ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                    : "border-white/12 text-white/65",
                )}
              >
                {label}
              </button>
            ))}
          </div>
          {scopeMode === "fund" && (
            <select
              className={cn(inputClass, "mt-3")}
              value={fundId}
              onChange={(e) =>
                setFundId(e.target.value as "impact" | "momentum" | "stewards")
              }
            >
              {funds.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          )}
          {scopeMode === "country" && (
            <select
              className={cn(inputClass, "mt-3")}
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}
          {scopeMode === "companies" && (
            <div className="mt-3 grid max-h-48 gap-1.5 overflow-auto rounded-xl border border-white/10 bg-black/20 p-2 sm:grid-cols-2">
              {TALANTON_PORTFOLIO_COMPANIES.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-white/70 hover:bg-white/[0.04]"
                >
                  <input
                    type="checkbox"
                    checked={companyIds.includes(c.id)}
                    onChange={() => toggleCompany(c.id)}
                  />
                  {c.name}
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              const report = createAnnualImpactReport({
                kind,
                period: buildPeriod(),
                scope: buildScope(),
              });
              onCreated(report);
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate report
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
  report: AnnualImpactReport;
  onBack: () => void;
  onUpdated: (r: AnnualImpactReport) => void;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const maxCountryPeople = Math.max(...report.countryRows.map((c) => c.peopleServed), 1);
  const maxSectorJobs = Math.max(...report.sectorRows.map((s) => s.jobsCreated), 1);

  function flash(msg: string) {
    setNotice(msg);
    window.setTimeout(() => setNotice(null), 2800);
  }

  const summaryPanels: {
    key: keyof AnnualImpactReport["summaries"];
    title: string;
    eyebrow: string;
  }[] = [
    { key: "executiveSummary", title: "Executive Summary", eyebrow: "Leadership" },
    { key: "investorSummary", title: "Investor Summary", eyebrow: "LP pack" },
    { key: "boardSummary", title: "Board Summary", eyebrow: "Board Portal" },
    { key: "websiteSummary", title: "Website Summary", eyebrow: "Public narrative" },
    { key: "pressSummary", title: "Press Summary", eyebrow: "Stewardship communications" },
  ];

  return (
    <div className="space-y-5">
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
              const next = regenerateAnnualImpactReport(report.id);
              if (next) {
                onUpdated(next);
                flash("Report regenerated from live platform data.");
              }
            }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Refresh data
          </button>
          <button
            type="button"
            className={btnGhost}
            onClick={() => {
              const next = upsertAnnualImpactReport({
                ...report,
                title: report.title.replace(/ \(Edited\)$/, "") + " (Edited)",
                status: report.status === "Archived" ? "Draft" : report.status,
              });
              onUpdated(next);
              flash("Report marked edited.");
            }}
          >
            Edit
          </button>
          {(
            [
              ["pdf", "PDF"],
              ["board-deck", "Board Deck"],
              ["investor-report", "Investor Report"],
              ["website-report", "Website Report"],
            ] as const
          ).map(([fmt, label]) => (
            <button
              key={fmt}
              type="button"
              className={btnGhost}
              onClick={() => {
                downloadImpactReport(report, fmt);
                flash(`Exported ${label}.`);
              }}
            >
              <Download className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              const next = publishImpactReportToBoard(report.id);
              if (next) {
                syncReportToBoardPack(next);
                onUpdated(next);
                flash("Published to Board Portal & Board Decks.");
              }
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Publish to Board
          </button>
        </div>
      </div>

      {notice ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <ReportCover report={report} />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <TalantonImpactMetric
          label="People served"
          value={report.metrics.peopleServed.toLocaleString()}
          tone="good"
        />
        <TalantonImpactMetric
          label="Jobs created"
          value={report.metrics.jobsCreated.toLocaleString()}
        />
        <TalantonImpactMetric
          label="Communities"
          value={report.metrics.communitiesReached.toLocaleString()}
        />
        <TalantonImpactMetric
          label="Capital raised"
          value={formatUsd(report.metrics.capitalRaisedUsd)}
        />
      </div>

      <TalantonGeneratedPanel
        eyebrow="02 · Letter"
        title="Letter From Talanton"
        copyText={report.sections.letterFromTalanton}
      >
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
          {report.sections.letterFromTalanton}
        </pre>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="03 · Overview"
        title="Talanton Overview"
        copyText={report.sections.overviewText}
      >
        <p className="text-sm leading-relaxed text-white/75">{report.sections.overviewText}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <TalantonImpactMetric
            label="Portfolio companies"
            value={report.metrics.companiesIncluded}
          />
          <TalantonImpactMetric
            label="Countries active"
            value={report.metrics.countriesActive}
          />
          <TalantonImpactMetric
            label="Sectors"
            value={report.metrics.sectors.length}
            hint={report.metrics.sectors.slice(0, 4).join(", ")}
          />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="04 · Impact Summary"
        title="Impact Summary"
        copyText={report.sections.impactSummaryNarrative}
      >
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          {report.sections.impactSummaryNarrative}
        </p>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <TalantonImpactMetric
            label="People served"
            value={report.metrics.peopleServed.toLocaleString()}
            tone="good"
          />
          <TalantonImpactMetric
            label="Jobs created"
            value={report.metrics.jobsCreated.toLocaleString()}
          />
          <TalantonImpactMetric
            label="Jobs retained"
            value={report.metrics.jobsRetained.toLocaleString()}
          />
          <TalantonImpactMetric
            label="Women impacted"
            value={report.metrics.womenEmployed.toLocaleString()}
          />
          <TalantonImpactMetric
            label="Youth impacted"
            value={report.metrics.youthEmployed.toLocaleString()}
          />
          <TalantonImpactMetric
            label="Communities reached"
            value={report.metrics.communitiesReached.toLocaleString()}
          />
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="05 · Portfolio"
        title="Portfolio Highlights"
        copyText={[
          report.sections.portfolioHighlightsNarrative,
          ...report.portfolioHighlights.map(
            (h) => `${h.companyName}: ${h.impactMetric} — ${h.achievement}`,
          ),
        ].join("\n")}
      >
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          {report.sections.portfolioHighlightsNarrative}
        </p>
        <div className="grid gap-3 lg:grid-cols-2">
          {report.portfolioHighlights.map((h) => (
            <article
              key={h.companyId}
              className="rounded-xl border border-white/10 bg-black/25 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-white">{h.companyName}</h3>
                <span className="text-[10px] uppercase tracking-wide text-white/40">
                  {h.country} · {h.sector}
                </span>
              </div>
              <p className="mt-2 text-xs font-medium text-emerald-200/90">{h.impactMetric}</p>
              <p className="mt-2 text-sm leading-relaxed text-white/65">{h.achievement}</p>
            </article>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="06 · Journeys"
        title="Journey Story Highlights"
        copyText={[
          report.sections.journeyNarrative,
          ...report.journeyHighlights.map((j) => `${j.title} (${j.country}): ${j.summary}`),
        ].join("\n")}
      >
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          {report.sections.journeyNarrative}
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {report.journeyHighlights.map((j) => (
            <article
              key={j.id}
              className="overflow-hidden rounded-xl border border-white/10 bg-black/25"
            >
              {j.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={j.photoUrl}
                  alt=""
                  className="h-36 w-full object-cover opacity-90"
                />
              ) : (
                <div className="flex h-36 items-center justify-center bg-emerald-950/40 text-emerald-200/50">
                  <MapPin className="h-8 w-8" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-white">{j.title}</h3>
                <p className="mt-1 text-xs text-white/45">
                  {j.country} · {j.date} · {j.author}
                </p>
                <p className="mt-2 line-clamp-3 text-sm text-white/65">{j.summary}</p>
              </div>
            </article>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="07 · Countries"
        title="Country Impact"
        copyText={[
          report.sections.countryNarrative,
          ...report.countryRows.map(
            (c) =>
              `${c.country}: ${c.companies} cos · jobs ${c.jobsCreated} · people ${c.peopleServed}`,
          ),
        ].join("\n")}
      >
        <p className="mb-4 text-sm leading-relaxed text-white/75">
          {report.sections.countryNarrative}
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-4">
            {report.countryRows.map((c) => (
              <MetricBar
                key={c.country}
                label={`${c.country} · ${c.companies} companies`}
                value={c.peopleServed}
                max={maxCountryPeople}
              />
            ))}
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {report.countryRows.map((c) => (
              <div
                key={`${c.country}-card`}
                className="rounded-xl border border-emerald-400/15 bg-gradient-to-br from-emerald-500/10 to-transparent p-3"
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold text-white">
                  <MapPin className="h-3.5 w-3.5 text-emerald-300" />
                  {c.country}
                </p>
                <p className="mt-2 text-xs text-white/55">
                  Jobs {c.jobsCreated.toLocaleString()} · Communities {c.communities}
                </p>
              </div>
            ))}
          </div>
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="08 · Sectors"
        title="Sector Impact"
        copyText={[
          report.sections.sectorNarrative,
          ...report.sectorRows.map((s) => `${s.sector}: ${s.summary}`),
        ].join("\n")}
      >
        <div className="space-y-4">
          {report.sectorRows.map((s) => (
            <div key={s.sector} className="rounded-xl border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-white">{s.sector}</h3>
                <span className="text-xs text-white/45">{s.companies} holdings</span>
              </div>
              <p className="mt-2 text-sm text-white/65">{s.summary}</p>
              <div className="mt-3">
                <MetricBar
                  label="Jobs created"
                  value={s.jobsCreated}
                  max={maxSectorJobs}
                  tone="sky"
                />
              </div>
            </div>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="09 · Impact Intelligence"
        title="Impact Intelligence Summary"
        copyText={report.sections.impactIntelligenceNarrative}
      >
        <p className="text-sm leading-relaxed text-white/75">
          {report.sections.impactIntelligenceNarrative}
        </p>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="10 · Opportunity Intelligence"
        title="Opportunity Intelligence Summary"
        copyText={report.sections.opportunityNarrative}
      >
        <p className="text-sm leading-relaxed text-white/75">
          {report.sections.opportunityNarrative}
        </p>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="11 · Looking Forward"
        title="Looking Forward"
        copyText={report.sections.lookingForward}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-white/75">
          {report.sections.lookingForward
            .split("\n")
            .filter(Boolean)
            .map((line) => (
              <li key={line}>{line}</li>
            ))}
        </ul>
      </TalantonGeneratedPanel>

      <TalantonGeneratedPanel
        eyebrow="12 · Appendix"
        title="Appendix"
        copyText={report.sections.appendixNotes}
      >
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/70">
          {report.sections.appendixNotes}
        </pre>
        <p className="mt-4 text-[11px] uppercase tracking-[0.12em] text-white/40">
          Data sources
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {report.dataSources.map((d) => (
            <span
              key={d}
              className="rounded-full border border-white/10 bg-black/25 px-2.5 py-1 text-[11px] text-white/55"
            >
              {d}
            </span>
          ))}
        </div>
      </TalantonGeneratedPanel>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white">AI-generated content packs</h2>
        {summaryPanels.map((p) => (
          <TalantonGeneratedPanel
            key={p.key}
            eyebrow={p.eyebrow}
            title={p.title}
            copyText={report.summaries[p.key]}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-white/75">
              {report.summaries[p.key]}
            </pre>
          </TalantonGeneratedPanel>
        ))}
      </div>
    </div>
  );
}

export default function AnnualImpactReportWorkspace() {
  const store = useAnnualImpactReportsStore();
  const [mode, setMode] = useState<Mode>("dashboard");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const metrics = useMemo(() => annualImpactReportDashboardMetrics(), [store.reports]);
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
    window.setTimeout(() => setNotice(null), 2800);
  }

  if (mode === "create") {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
        <CreateWizard
          onCancel={() => setMode("dashboard")}
          onCreated={(r) => {
            setActiveId(r.id);
            setMode("viewer");
            flash("Impact report generated from Talanton platform data.");
          }}
        />
      </div>
    );
  }

  if (mode === "viewer" && active) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
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
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Impact Intelligence"
        title="Annual Impact Report"
        description="Flagship investor- and board-grade impact reporting — assembled automatically from Impact Intelligence, Journey Stories, Portfolio Stories, Funds, and the full Talanton stewardship record."
        actions={
          <button type="button" className={btnPrimary} onClick={() => setMode("create")}>
            <Plus className="h-3.5 w-3.5" />
            Create Report
          </button>
        }
      />

      {notice ? (
        <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-100">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
        <TalantonImpactMetric label="Reports Generated" value={metrics.reportsGenerated} />
        <TalantonImpactMetric label="Reporting Years" value={metrics.reportingYears} />
        <TalantonImpactMetric
          label="Portfolio Companies"
          value={metrics.companiesIncluded}
        />
        <TalantonImpactMetric label="Countries Active" value={metrics.countriesActive} />
        <TalantonImpactMetric
          label="Total Capital Raised"
          value={formatUsd(metrics.capitalRaisedUsd)}
        />
        <TalantonImpactMetric
          label="People Served"
          value={metrics.peopleServed.toLocaleString()}
          tone="good"
        />
        <TalantonImpactMetric
          label="Jobs Created"
          value={metrics.jobsCreated.toLocaleString()}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Recent reports</h2>
            <p className="mt-1 text-sm text-white/50">
              Demo library includes 2025 & 2026 annual packs, Q2 2026, and Impact Fund investor
              scope.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {reports.map((r) => (
            <article
              key={r.id}
              className="rounded-xl border border-white/10 bg-black/25 p-4 transition hover:border-emerald-400/25"
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
                  <h3 className="text-base font-semibold text-white hover:text-emerald-100">
                    {r.title}
                  </h3>
                  <p className="mt-1 text-xs text-white/45">
                    {kindLabel(r.kind)} · {periodLabel(r.period)} · {scopeLabel(r.scope)}
                  </p>
                  <p className="mt-1 text-xs text-white/40">
                    Updated{" "}
                    {new Date(r.updatedAt).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                    {r.publishedToBoard ? " · On Board Portal" : ""}
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

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-white/50">
                <span>
                  {r.metrics.companiesIncluded} cos · {r.metrics.countriesActive} countries
                </span>
                <span>·</span>
                <span>{r.metrics.peopleServed.toLocaleString()} people served</span>
                <span>·</span>
                <span>{r.metrics.jobsCreated.toLocaleString()} jobs</span>
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
                    const copy = duplicateAnnualImpactReport(r.id);
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
                    downloadImpactReport(r, "pdf");
                    flash("Exported PDF pack.");
                  }}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export
                </button>
                <button
                  type="button"
                  className={btnGhost}
                  onClick={() => {
                    const next = archiveAnnualImpactReport(r.id);
                    if (next) flash("Report archived.");
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
                      deleteAnnualImpactReport(r.id);
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
