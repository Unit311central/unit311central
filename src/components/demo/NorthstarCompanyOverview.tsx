"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";

import { buildNorthstarOverviewSnapshot } from "@/lib/demo/overview";
import { CorporateKpiTile, CorporateSection } from "@/components/testflighthub/corporate-ui";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function NorthstarCompanyOverview() {
  const snapshot = buildNorthstarOverviewSnapshot();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 sm:p-6">
      <header className="rounded-3xl border border-sky-400/20 bg-gradient-to-br from-sky-950/40 to-[#07111f] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-sky-300/80">Demo company overview</p>
        <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">{snapshot.company.tradingName}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/70">{snapshot.company.description}</p>
        <div className="mt-4 flex flex-wrap gap-3 text-xs text-white/50">
          <span>Founded {snapshot.company.foundedYear}</span>
          <span>·</span>
          {snapshot.offices.map((o) => (
            <span key={o.city}>
              {o.city} ({o.headcount})
            </span>
          ))}
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <CorporateKpiTile label="Employees" value={String(snapshot.metrics.employees)} />
        <CorporateKpiTile label="Clients" value={String(snapshot.metrics.clients)} />
        <CorporateKpiTile label="ARR" value={formatGbp(snapshot.metrics.arrGbp)} />
        <CorporateKpiTile label="Cash" value={formatGbp(snapshot.metrics.cashGbp)} />
        <CorporateKpiTile
          label="Gross margin"
          value={`${snapshot.metrics.actualGmPct}%`}
          hint={`Target ${snapshot.metrics.targetGmPct}%`}
        />
        <CorporateKpiTile label="Active projects" value={String(snapshot.metrics.activeProjects)} />
        <CorporateKpiTile label="Pipeline" value={formatGbp(snapshot.metrics.pipelineGbp)} />
        <CorporateKpiTile label="Total raised" value={formatGbp(snapshot.metrics.totalRaisedGbp)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CorporateSection title="Wins">
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
            {snapshot.wins.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </CorporateSection>
        <CorporateSection title="Losses & lessons">
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
            {snapshot.losses.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </CorporateSection>
        <CorporateSection title="People changes">
          <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
            {snapshot.peopleChanges.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </CorporateSection>
        <CorporateSection title="Board snapshot">
          <p className="text-sm text-white/70">Next: {snapshot.board.nextMeeting}</p>
          <p className="mt-2 text-sm text-white/70">Open actions: {snapshot.board.openActions}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-white/75">
            {snapshot.board.topRisks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </CorporateSection>
      </div>

      <CorporateSection title="Current priorities">
        <ul className="list-disc space-y-2 pl-5 text-sm text-white/80">
          {snapshot.priorities.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      </CorporateSection>

      <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 text-amber-300" />
          <div>
            <p className="font-medium text-amber-100">Intelligence — what needs attention</p>
            <p className="mt-1 text-sm text-amber-100/80">{snapshot.intelligenceHeadline}</p>
            <Link href="/?view=demo-intelligence" className="mt-3 inline-block text-sm text-sky-300 hover:underline">
              Open AI Intelligence →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
