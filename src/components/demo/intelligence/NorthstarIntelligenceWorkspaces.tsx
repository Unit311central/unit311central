"use client";

import type { ReactNode } from "react";
import { AlertTriangle, ArrowRight, Brain, CheckCircle2, TrendingUp } from "lucide-react";

import type { ManagedClient } from "@/lib/client-management-data";
import {
  buildNorthstarClientIntelligence,
  buildNorthstarCompanyIntelligence,
  buildNorthstarMarketIntelligence,
  type NorthstarClientIntelRow,
  type NorthstarIntelAction,
  type NorthstarIntelPosture,
  type NorthstarMarketSignal,
} from "@/lib/demo/northstar-intelligence";
import { cn } from "@/lib/utils";

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

const POSTURE_STYLES: Record<NorthstarIntelPosture, string> = {
  healthy: "border-emerald-400/30 bg-emerald-500/10 text-emerald-100",
  watch: "border-amber-400/30 bg-amber-500/10 text-amber-100",
  elevated: "border-orange-400/35 bg-orange-500/12 text-orange-100",
  critical: "border-rose-400/35 bg-rose-500/12 text-rose-100",
};

function IntelHeader({
  moduleLabel,
  title,
  description,
  posture,
  postureReason,
  asAt,
}: {
  moduleLabel: string;
  title: string;
  description: string;
  posture: NorthstarIntelPosture;
  postureReason: string;
  asAt: string;
}) {
  return (
    <header className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/10 via-white/[0.02] to-transparent p-5 sm:p-6">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-300/80">
        Northstar Intelligence · {moduleLabel}
      </p>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-white">
            <Brain className="h-6 w-6 text-violet-300" />
            {title}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-white/60">{description}</p>
          <p className="mt-2 text-[11px] text-white/35">As at {asAt}</p>
        </div>
        <div className={cn("rounded-xl border px-4 py-2 text-sm", POSTURE_STYLES[posture])}>
          <span className="font-semibold capitalize">{posture}</span>
          <p className="mt-1 max-w-xs text-[12px] leading-snug opacity-90">{postureReason}</p>
        </div>
      </div>
    </header>
  );
}

function ActionsPanel({ actions }: { actions: NorthstarIntelAction[] }) {
  return (
    <section className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4 sm:p-5">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-emerald-100">
        <CheckCircle2 className="h-4 w-4" />
        What to do next
      </h2>
      <ul className="mt-3 space-y-3">
        {actions.map((action) => (
          <li key={action.id} className="rounded-xl border border-white/8 bg-black/20 px-3 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-white">{action.title}</p>
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/45">
                {action.priority.replace("-", " ")}
              </span>
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-white/55">{action.rationale}</p>
            <p className="mt-1 text-[11px] text-white/35">Owner: {action.owner}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function KpiCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "good" | "warn" | "risk";
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-wide text-white/40">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-semibold tabular-nums",
          tone === "risk" ? "text-rose-200" : tone === "warn" ? "text-amber-200" : "text-white",
        )}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-white/45">{hint}</p>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export function NorthstarCompanyIntelligenceWorkspace() {
  const data = buildNorthstarCompanyIntelligence();

  return (
    <div className="space-y-5 p-1">
      <IntelHeader
        moduleLabel="Company"
        title="Company Intelligence"
        description="How Northstar is performing — revenue, margin, cash, delivery, and supply chain — tied to live Financials and Engineering data."
        posture={data.posture}
        postureReason={data.postureReason}
        asAt={data.asAt}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {data.kpis.map((kpi) => (
          <KpiCard key={kpi.id} {...kpi} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Gross margin trajectory">
          <ul className="space-y-2">
            {data.marginHistory.map((row) => (
              <li
                key={row.month}
                className="flex items-center justify-between gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-white">{row.month}</p>
                  {row.note ? <p className="text-[11px] text-white/45">{row.note}</p> : null}
                </div>
                <span className="tabular-nums font-semibold text-sky-200">{row.marginPct}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Cost & burn drivers (Aug 2026)">
          <ul className="space-y-2">
            {data.costDrivers.map((row) => (
              <li key={row.label} className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
                <div className="flex items-center justify-between gap-2 text-sm">
                  <span className="font-medium text-white">{row.label}</span>
                  <span className="tabular-nums text-white/80">{formatGbp(row.amountGbp)}</span>
                </div>
                <p className="mt-1 text-[11px] text-white/45">{row.detail}</p>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Delivery & supply signals">
        <ul className="space-y-2">
          {data.deliverySignals.map((signal) => (
            <li
              key={signal.title}
              className="flex gap-3 rounded-lg border border-white/8 bg-black/20 px-3 py-2.5 text-sm"
            >
              <AlertTriangle
                className={cn(
                  "mt-0.5 h-4 w-4 shrink-0",
                  signal.severity === "critical" || signal.severity === "high"
                    ? "text-rose-300"
                    : "text-amber-300",
                )}
              />
              <div>
                <p className="font-medium text-white">{signal.title}</p>
                <p className="mt-0.5 text-[12px] text-white/55">{signal.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <ActionsPanel actions={data.priorityActions} />
    </div>
  );
}

function HealthBadge({ band, score }: { band: NorthstarClientIntelRow["healthBand"]; score: number }) {
  const tone =
    band === "at-risk"
      ? "border-rose-400/30 bg-rose-500/10 text-rose-100"
      : band === "watch"
        ? "border-amber-400/30 bg-amber-500/10 text-amber-100"
        : "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  return (
    <span className={cn("rounded-full border px-2 py-0.5 text-[11px] font-medium", tone)}>
      {score} · {band}
    </span>
  );
}

function ClientDetailCard({ row }: { row: NorthstarClientIntelRow }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">{row.name}</h3>
          <p className="mt-0.5 text-sm text-white/45">
            {row.contractType} · {formatGbp(row.arrGbp)} ARR · {row.accountOwner}
          </p>
        </div>
        <HealthBadge band={row.healthBand} score={row.healthScore} />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Renewal</p>
          <p className="mt-1 text-sm font-medium text-white">
            {row.renewalInDays != null ? `${row.renewalInDays} days` : "N/A (onboarding)"}
          </p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Open tickets</p>
          <p className="mt-1 text-sm font-medium text-white">{row.openSupportTickets}</p>
        </div>
        <div className="rounded-lg border border-white/8 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Status</p>
          <p className="mt-1 text-sm font-medium capitalize text-white">{row.healthBand}</p>
        </div>
      </div>

      {row.issues.length > 0 ? (
        <div className="mt-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/40">Why it matters</p>
          <ul className="mt-2 space-y-1.5">
            {row.issues.map((issue) => (
              <li key={issue} className="flex gap-2 text-[13px] text-white/70">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300/70">
          How to keep them
        </p>
        <ul className="mt-2 space-y-1.5">
          {row.keepThemActions.map((action) => (
            <li key={action} className="flex gap-2 text-[13px] text-white/75">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300/80" />
              {action}
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-4 text-[11px] text-white/35">
        Evidence: {row.evidence.join(" · ")}
      </p>
    </article>
  );
}

export function NorthstarClientIntelligenceWorkspace({ clients }: { clients?: ManagedClient[] }) {
  const data = buildNorthstarClientIntelligence(clients ?? []);
  const focus = data.rows.filter((row) => row.healthBand !== "healthy").slice(0, 4);
  const healthy = data.rows.filter((row) => row.healthBand === "healthy").slice(0, 3);

  return (
    <div className="space-y-5 p-1">
      <IntelHeader
        moduleLabel="Clients"
        title="Client Intelligence"
        description="Which accounts need intervention, why, and what to do — grounded in support tickets, delivery status, AR, and renewal windows."
        posture={data.posture}
        postureReason={data.postureReason}
        asAt={data.asAt}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Active accounts" value={String(data.summary.activeAccounts)} hint="CRM active" />
        <KpiCard
          label="At risk"
          value={String(data.summary.atRisk)}
          hint="Health score below 55"
          tone="risk"
        />
        <KpiCard label="Onboarding" value={String(data.summary.onboarding)} hint="Go-live dependencies" />
        <KpiCard
          label="Renewal ≤90d"
          value={String(data.summary.renewalNext90Days)}
          hint="Requires exec attention"
          tone="warn"
        />
        <KpiCard
          label="Featured ARR"
          value={formatGbp(data.summary.portfolioArrGbp)}
          hint="Sheffield, Peak, Bristol + sample"
        />
      </div>

      <ActionsPanel actions={data.priorityActions} />

      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-[0.12em] text-rose-200/80">
          Accounts needing action
        </h2>
        {focus.map((row) => (
          <ClientDetailCard key={row.id} row={row} />
        ))}
      </div>

      {healthy.length > 0 ? (
        <Panel title="Healthy accounts (maintain cadence)">
          <ul className="divide-y divide-white/5">
            {healthy.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium text-white">{row.name}</p>
                  <p className="text-[12px] text-white/45">{row.keepThemActions[0]}</p>
                </div>
                <HealthBadge band={row.healthBand} score={row.healthScore} />
              </li>
            ))}
          </ul>
        </Panel>
      ) : null}
    </div>
  );
}

function MarketSignalCard({ signal }: { signal: NorthstarMarketSignal }) {
  return (
    <article className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-300/70">
          {signal.category}
        </p>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] capitalize text-white/50">
          {signal.severity}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-semibold text-white">{signal.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-white/65">{signal.summary}</p>
      <div className="mt-4 space-y-2 text-[13px]">
        <p>
          <span className="font-medium text-amber-200/90">Implication: </span>
          <span className="text-white/65">{signal.implication}</span>
        </p>
        <p>
          <span className="font-medium text-emerald-200/90">Response: </span>
          <span className="text-white/65">{signal.response}</span>
        </p>
      </div>
      <p className="mt-3 text-[11px] text-white/35">{signal.source}</p>
    </article>
  );
}

export function NorthstarMarketIntelligenceWorkspace() {
  const data = buildNorthstarMarketIntelligence();

  return (
    <div className="space-y-5 p-1">
      <IntelHeader
        moduleLabel="Market"
        title="Market Intelligence"
        description="Competitive moves, regulation, sector consolidation, and macro demand — with implications and responses, not news clippings."
        posture={data.posture}
        postureReason={data.postureReason}
        asAt={data.asAt}
      />

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
        <TrendingUp className="h-4 w-4 shrink-0 text-sky-300" />
        {data.signals.length} active external signals · competitive and regulatory pressure highest near Sheffield
        renewal window
      </div>

      <ActionsPanel actions={data.priorityActions} />

      <div className="grid gap-4 lg:grid-cols-2">
        {data.signals.map((signal) => (
          <MarketSignalCard key={signal.id} signal={signal} />
        ))}
      </div>
    </div>
  );
}

export function NorthstarIntelligenceRouter({
  activeView,
  clients,
}: {
  activeView: string;
  clients?: ManagedClient[];
}) {
  if (activeView === "demo-company-intelligence") {
    return <NorthstarCompanyIntelligenceWorkspace />;
  }
  if (activeView === "demo-client-intelligence") {
    return <NorthstarClientIntelligenceWorkspace clients={clients} />;
  }
  if (activeView === "demo-market-intelligence") {
    return <NorthstarMarketIntelligenceWorkspace />;
  }
  return null;
}
