"use client";

import Link from "next/link";
import {
  Building2,
  ContactRound,
  Handshake,
  LayoutDashboard,
  ScrollText,
  Users,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { formatMoney } from "@/lib/accounting/chart-of-accounts";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { getOaBcDashboardSummary } from "@/lib/onwardair/business-central-data";

const chartTooltipStyle = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const STAGE_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#f472b6", "#94a3b8", "#22d3ee"];

function usd(amount: number) {
  return formatMoney(amount, "USD");
}

type Tile = {
  label: string;
  value: string;
  hint: string;
  href: string;
  icon: typeof LayoutDashboard;
};

export default function OnwardAirBusinessCentralDashboard() {
  const basePath = useInternalOperationsBasePath();
  const summary = getOaBcDashboardSummary();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);
  const salesPartnersHref = getInternalNavHref("sales-management", basePath, { tab: "partners" });

  const tiles: Tile[] = [
    {
      label: "Clients",
      value: String(summary.clientsCount),
      hint: `${summary.activeClients} active · ARR ${usd(summary.arrUsd)}`,
      href: href("clients-dashboard"),
      icon: Building2,
    },
    {
      label: "Pipeline value",
      value: usd(summary.pipelineValueUsd),
      hint: `${summary.pipelineByStage.reduce((n, row) => n + row.count, 0)} open deals (USD)`,
      href: href("crm"),
      icon: ContactRound,
    },
    {
      label: "Discovery",
      value: String(summary.discoveryCount),
      hint: "Scheduled discovery meetings",
      href: href("crm-meetings"),
      icon: Users,
    },
    {
      label: "Onboarding",
      value: String(summary.onboardingCount),
      hint: "Clients in onboarding",
      href: href("client-onboarding"),
      icon: LayoutDashboard,
    },
    {
      label: "Partners",
      value: String(summary.partnersCount),
      hint: summary.partnerRegions.slice(0, 3).join(" · ") || "Active regions",
      href: salesPartnersHref,
      icon: Handshake,
    },
    {
      label: "Commission pipeline",
      value: usd(summary.commissionPipelineUsd),
      hint: "Outstanding + upcoming (USD)",
      href: salesPartnersHref,
      icon: Handshake,
    },
    {
      label: "Grants",
      value: "US schemes",
      hint: "SBIR / STTR / DoD / NASA / FAA",
      href: href("grants"),
      icon: ScrollText,
    },
  ];

  const stageBars = summary.pipelineByStage.map((row) => ({
    stage: row.stage,
    count: row.count,
    valueUsd: Math.round(row.valueUsd / 1000),
  }));

  const stagePie = summary.pipelineByStage.map((row) => ({
    name: row.stage,
    value: row.count,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-1 py-4 sm:py-6" aria-label="Business Central dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-5 sm:p-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
          OnwardAir · Business Central
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
          Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and US
          grant programmes — all figures in USD.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {tile.label}
                </p>
                <Icon className="h-4 w-4 text-sky-300/80" aria-hidden />
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Pipeline by stage</h2>
          <p className="mt-1 text-xs text-white/45">Deal count and value ($k)</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <BarChart data={stageBars} margin={{ top: 8, right: 4, left: -12, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(value, name) =>
                    name === "valueUsd"
                      ? [`$${Number(value)}k`, "Value"]
                      : [String(value), "Deals"]
                  }
                />
                <Bar dataKey="count" name="Deals" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="valueUsd" name="valueUsd" fill="#34d399" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
          <h2 className="text-sm font-semibold text-white">Stage mix</h2>
          <p className="mt-1 text-xs text-white/45">Share of open pipeline deals</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
              <PieChart>
                <Pie
                  data={stagePie}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={78}
                  paddingAngle={2}
                >
                  {stagePie.map((_, index) => (
                    <Cell key={index} fill={STAGE_COLORS[index % STAGE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={chartTooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>
    </div>
  );
}
