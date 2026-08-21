"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Building2,
  ContactRound,
  Handshake,
  LayoutDashboard,
  Pencil,
  ScrollText,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { getNorthstarCalendarEvents } from "@/lib/demo/northstar-api-fixtures";
import {
  getNorthstarClients,
  getNorthstarCrmLeads,
  getNorthstarDiscoveryMeetings,
  getNorthstarGrantApplications,
  getNorthstarOnboardingRecords,
  getNorthstarPartners,
} from "@/lib/demo/module-fixtures";
import {
  getInternalNavHref,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import { cn } from "@/lib/utils";

const TILE_STORAGE_KEY = "northstar-bc-dashboard-tiles-v1";

type TileConfig = {
  id: string;
  label: string;
  value: string;
  hint: string;
  href: InternalOperationsView;
  icon: typeof Building2;
};

function formatGbp(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function buildDefaultTiles(): TileConfig[] {
  const clients = getNorthstarClients();
  const leads = getNorthstarCrmLeads();
  const meetings = getNorthstarDiscoveryMeetings();
  const onboarding = getNorthstarOnboardingRecords();
  const partners = getNorthstarPartners();
  const grants = getNorthstarGrantApplications();
  const ukCount = grants.filter((g) => g.region === "UK").length;
  const euCount = grants.filter((g) => g.region === "EU").length;
  const pipelineGbp = grants.reduce((sum, g) => sum + g.amountEur, 0);
  const pipelineGbpLabel =
    pipelineGbp >= 1_000_000
      ? `£${(pipelineGbp / 1_000_000).toFixed(2)}M`
      : formatGbp(pipelineGbp);
  const activeClients = clients.filter((c) => c.accountStatus === "Active").length;
  const openLeads = leads.filter((l) => l.status !== "Won" && l.status !== "Lost");

  return [
    {
      id: "clients",
      label: "Clients",
      value: String(clients.length),
      hint: `${activeClients} active · ${formatGbp(4_800_000)} ARR`,
      href: "clients-dashboard",
      icon: Building2,
    },
    {
      id: "pipeline",
      label: "Pipeline value",
      value: formatGbp(openLeads.reduce((sum, l) => sum + (l.estimatedValue ?? 0), 0)),
      hint: `${openLeads.length} open deals`,
      href: "crm",
      icon: ContactRound,
    },
    {
      id: "discovery",
      label: "Discovery",
      value: String(meetings.length),
      hint: "Scheduled discovery meetings",
      href: "crm-meetings",
      icon: Users,
    },
    {
      id: "onboarding",
      label: "Onboarding",
      value: String(onboarding.length),
      hint: "Clients in onboarding",
      href: "client-onboarding",
      icon: LayoutDashboard,
    },
    {
      id: "partners",
      label: "Partners",
      value: String(partners.length),
      hint: "Channel & integration partners",
      href: "representatives",
      icon: Handshake,
    },
    {
      id: "grants",
      label: "Grants",
      value: `UK ${ukCount} · EU ${euCount}`,
      hint: `${pipelineGbpLabel} pipeline · Innovate UK · Horizon`,
      href: "grants",
      icon: ScrollText,
    },
  ];
}

const ACTIVE_CLIENTS_SERIES = [
  { month: "Mar", clients: 82 },
  { month: "Apr", clients: 86 },
  { month: "May", clients: 89 },
  { month: "Jun", clients: 93 },
  { month: "Jul", clients: 96 },
  { month: "Aug", clients: 99 },
];

export default function NorthstarBusinessCentralDashboard() {
  const basePath = useInternalOperationsBasePath();
  const href = (view: InternalOperationsView) => getInternalNavHref(view, basePath);
  const [editing, setEditing] = useState(false);
  const [tiles, setTiles] = useState<TileConfig[]>(() => buildDefaultTiles());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TILE_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as TileConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) setTiles(parsed);
    } catch {
      // ignore
    }
  }, []);

  const saveTiles = useCallback((next: TileConfig[]) => {
    setTiles(next);
    try {
      localStorage.setItem(TILE_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, []);

  const upcomingEvent = useMemo(() => {
    const events = getNorthstarCalendarEvents()
      .filter((e) => e.clientName)
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return events[0] ?? null;
  }, []);

  return (
    <div className="mx-auto max-w-6xl space-y-4 px-1 py-4 sm:py-5" aria-label="Business Central dashboard">
      <header className="rounded-2xl border border-white/12 bg-white/[0.03] p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40">
              Northstar · Business Central
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/55">
              Commercial snapshot across clients, pipeline, discovery, onboarding, partners, and grant programmes — GBP.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setEditing((v) => !v)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition",
              editing
                ? "border-sky-400/40 bg-sky-500/15 text-sky-200"
                : "border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20",
            )}
          >
            <Pencil className="h-3.5 w-3.5" />
            {editing ? "Done editing" : "Edit tiles"}
          </button>
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tiles.map((tile, index) => {
          const Icon = tile.icon;
          const content = (
            <>
              <div className="flex items-center justify-between gap-3">
                {editing ? (
                  <input
                    value={tile.label}
                    onChange={(e) => {
                      const next = [...tiles];
                      next[index] = { ...tile, label: e.target.value };
                      saveTiles(next);
                    }}
                    className="w-full rounded border border-white/15 bg-[#0b1524] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white"
                  />
                ) : (
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">{tile.label}</p>
                )}
                <Icon className="h-4 w-4 shrink-0 text-sky-300/80" aria-hidden />
              </div>
              {editing ? (
                <input
                  value={tile.value}
                  onChange={(e) => {
                    const next = [...tiles];
                    next[index] = { ...tile, value: e.target.value };
                    saveTiles(next);
                  }}
                  className="mt-3 w-full rounded border border-white/15 bg-[#0b1524] px-2 py-1.5 text-lg font-semibold text-white"
                />
              ) : (
                <p className="mt-3 text-2xl font-semibold tabular-nums text-white">{tile.value}</p>
              )}
              {editing ? (
                <input
                  value={tile.hint}
                  onChange={(e) => {
                    const next = [...tiles];
                    next[index] = { ...tile, hint: e.target.value };
                    saveTiles(next);
                  }}
                  className="mt-1 w-full rounded border border-white/15 bg-[#0b1524] px-2 py-1 text-xs text-white/70"
                />
              ) : (
                <p className="mt-1 text-xs text-white/40">{tile.hint}</p>
              )}
            </>
          );

          if (editing) {
            return (
              <div
                key={tile.id}
                className="rounded-2xl border border-sky-400/25 bg-white/[0.03] px-4 py-4"
              >
                {content}
              </div>
            );
          }

          return (
            <Link
              key={tile.id}
              href={
                tile.id === "partners"
                  ? getInternalNavHref("sales-management", basePath, { tab: "partners" })
                  : href(tile.href)
              }
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4 transition-colors hover:border-sky-400/35 hover:bg-sky-500/[0.07]"
            >
              {content}
            </Link>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Active clients</p>
          <p className="mt-1 text-xs text-white/50">Last 6 months</p>
          <div className="mt-3 h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ACTIVE_CLIENTS_SERIES} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="nstClientsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="month" tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }} axisLine={false} tickLine={false} width={28} />
                <Tooltip
                  contentStyle={{ background: "#0b1524", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12 }}
                  labelStyle={{ color: "rgba(255,255,255,0.7)" }}
                />
                <Area type="monotone" dataKey="clients" stroke="#38bdf8" fill="url(#nstClientsFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Upcoming client event</p>
          {upcomingEvent ? (
            <div className="mt-3">
              <p className="text-sm font-semibold text-white">{upcomingEvent.title}</p>
              <p className="mt-1 text-xs text-sky-300/90">{upcomingEvent.clientName}</p>
              <p className="mt-2 text-xs text-white/50">
                {new Date(upcomingEvent.startsAt).toLocaleString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {upcomingEvent.location ? ` · ${upcomingEvent.location}` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-sm text-white/45">No upcoming client events.</p>
          )}
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">Best performing country / region</p>
          <p className="mt-2 text-2xl font-bold text-white">United Kingdom</p>
          <p className="mt-1 text-xs text-white/50">68% of active ARR · 67 live clients</p>
          <div className="mt-4 space-y-2">
            {[
              { label: "UK", pct: 68, tone: "bg-sky-400" },
              { label: "US", pct: 22, tone: "bg-emerald-400" },
              { label: "EU", pct: 10, tone: "bg-violet-400" },
            ].map((row) => (
              <div key={row.label}>
                <div className="mb-1 flex justify-between text-[11px] text-white/55">
                  <span>{row.label}</span>
                  <span>{row.pct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div className={cn("h-full rounded-full", row.tone)} style={{ width: `${row.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
