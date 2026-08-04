"use client";

import {
  CalendarDays,
  FolderOpen,
  Landmark,
  LayoutDashboard,
  ScrollText,
  Target,
  Users,
} from "lucide-react";

type PlaceholderProps = {
  title: string;
  group: "Engineering" | "Operations" | "Fundraising" | "Fundraising & Cap Table";
  description: string;
};

const GROUP_ICON = {
  Engineering: Target,
  Operations: LayoutDashboard,
  Fundraising: Landmark,
  "Fundraising & Cap Table": Landmark,
} as const;

/**
 * Lightweight OnwardAir module shell — navigation + copy only.
 * Full functionality ships in a later phase.
 */
export function OnwardAirPlaceholderWorkspace({ title, group, description }: PlaceholderProps) {
  const Icon = GROUP_ICON[group];
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-sky-400/30 bg-sky-500/15 text-sky-200">
            <Icon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              OnwardAir · {group}
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">{title}</h1>
            <p className="mt-2 text-sm leading-relaxed text-white/55">{description}</p>
          </div>
        </div>
      </header>
      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-10 text-center">
        <p className="text-sm font-medium text-white/70">Module placeholder</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
          Navigation and workspace tenancy are live. Detailed workflows for this module will be
          added in a later release without affecting other tenants.
        </p>
      </section>
    </div>
  );
}

const FUNDRAISING_KPI = [
  {
    label: "Active Raises",
    value: "1",
    hint: "Pre-Seed in planning / outreach",
    icon: Landmark,
  },
  {
    label: "Raise Targets",
    value: "—",
    hint: "Target capital for active raises",
    icon: Target,
  },
  {
    label: "Capital Committed",
    value: "—",
    hint: "No public committed capital disclosed",
    icon: ScrollText,
  },
  {
    label: "Investor Activity",
    value: "—",
    hint: "Recent meetings and follow-ups",
    icon: Users,
  },
  {
    label: "Pipeline Summary",
    value: "—",
    hint: "Investors by pipeline stage",
    icon: CalendarDays,
  },
] as const;

type RoundStatus = "Active" | "Planned" | "Future";

type FundingRoundSummary = {
  id: string;
  name: string;
  status: RoundStatus;
  focus: string;
  typicalUse: string;
  target: string;
  raised: string;
  investors: string;
  notes: string;
};

/**
 * OnwardAir fundraising stage summary.
 * Public sources (e.g. Tracxn) report no closed rounds to date — do not invent raised amounts.
 */
const FUNDING_ROUND_SUMMARIES: FundingRoundSummary[] = [
  {
    id: "pre-seed",
    name: "Pre-Seed",
    status: "Active",
    focus: "Founding capital & strategic angels",
    typicalUse: "Team, IP consolidation, early Vertex VTOL / FLEX Pod prototyping, and go-to-market proof points.",
    target: "—",
    raised: "—",
    investors: "—",
    notes: "Current stage focus. No closed Pre-Seed amount disclosed publicly.",
  },
  {
    id: "seed",
    name: "Seed",
    status: "Planned",
    focus: "Prototype → flight-ready path",
    typicalUse: "Engineering scale-up, flight testing prep, certification pathway work, and first operator partnerships.",
    target: "—",
    raised: "—",
    investors: "—",
    notes: "Next planned raise after Pre-Seed milestones.",
  },
  {
    id: "series-a",
    name: "Series A",
    status: "Future",
    focus: "Certification & production readiness",
    typicalUse: "Type certification progress, manufacturing partners, and scaled logistics / defence pilot programs.",
    target: "—",
    raised: "—",
    investors: "—",
    notes: "Future institutional round — not yet active.",
  },
  {
    id: "series-b",
    name: "Series B",
    status: "Future",
    focus: "Commercial scale",
    typicalUse: "Fleet production, operator network expansion, and multi-mission commercial deployment.",
    target: "—",
    raised: "—",
    investors: "—",
    notes: "Future growth round — not yet active.",
  },
];

function roundStatusClass(status: RoundStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/30 bg-emerald-500/15 text-emerald-200";
    case "Planned":
      return "border-sky-400/30 bg-sky-500/15 text-sky-200";
    default:
      return "border-white/15 bg-white/[0.06] text-white/55";
  }
}

/** Fundraising Dashboard — round summary + KPI shell until Phase 1 CRM data lands. */
export function FundraisingDashboardWorkspace() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          OnwardAir · Fundraising & Cap Table
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Executive view of fundraising stages, active raises, capital progress, and investor
          pipeline health. Relationship management — not a generic CRM.
        </p>
      </header>

      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-2 px-0.5">
          <div>
            <h2 className="text-lg font-semibold text-white">Funding round summary</h2>
            <p className="mt-0.5 text-sm text-white/45">
              Pre-Seed through Series B roadmap. Amounts left blank where not publicly disclosed.
            </p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {FUNDING_ROUND_SUMMARIES.map((round) => (
            <article
              key={round.id}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-sky-500/[0.07] via-white/[0.03] to-transparent p-5"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-sky-300/80">
                    {round.focus}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{round.name}</h3>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${roundStatusClass(round.status)}`}
                >
                  {round.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-white/60">{round.typicalUse}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-white/10 pt-3">
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Target
                  </dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums text-white">{round.target}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Raised
                  </dt>
                  <dd className="mt-1 text-sm font-medium tabular-nums text-white">{round.raised}</dd>
                </div>
                <div>
                  <dt className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Investors
                  </dt>
                  <dd className="mt-1 text-sm font-medium text-white">{round.investors}</dd>
                </div>
              </dl>
              <p className="mt-3 text-xs text-white/40">{round.notes}</p>
            </article>
          ))}
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {FUNDRAISING_KPI.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <article
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {kpi.label}
                </p>
                <Icon className="h-4 w-4 text-amber-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{kpi.value}</p>
              <p className="mt-1 text-xs text-white/40">{kpi.hint}</p>
            </article>
          );
        })}
      </div>

      <section className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-6 py-8 text-center">
        <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
          <FolderOpen className="h-4 w-4" aria-hidden />
        </div>
        <p className="mt-3 text-sm font-medium text-white/70">Investor CRM data coming next</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
          Round summary is live. Investor records, meetings, pitch decks, and data rooms will
          populate the remaining tiles in the Fundraising Phase 1 build.
        </p>
      </section>
    </div>
  );
}

export function OperationsDashboardWorkspace() {
  return (
    <OnwardAirPlaceholderWorkspace
      title="Dashboard"
      group="Operations"
      description="Operations overview — assets, inventory, procurement, and logistics at a glance."
    />
  );
}
