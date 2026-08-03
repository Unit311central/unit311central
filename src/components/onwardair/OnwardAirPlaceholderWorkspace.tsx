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
  group: "Engineering" | "Operations" | "Fundraising";
  description: string;
};

const GROUP_ICON = {
  Engineering: Target,
  Operations: LayoutDashboard,
  Fundraising: Landmark,
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
    value: "—",
    hint: "Live raise campaigns in progress",
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
    hint: "Committed capital from investors",
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

/** Fundraising Dashboard shell — KPI structure only until Phase 1 data lands. */
export function FundraisingDashboardWorkspace() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 px-1 py-6">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          OnwardAir · Fundraising
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Executive view of active raises, capital progress, investor activity, and pipeline health.
          Relationship management — not a generic CRM.
        </p>
      </header>

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
        <p className="mt-3 text-sm font-medium text-white/70">Fundraising data coming next</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/45">
          Navigation is live. Investor records, pipeline stages, meetings, pitch decks, and data
          rooms will populate these tiles in the Fundraising Phase 1 build.
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
