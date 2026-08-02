"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ExternalLink, Flame, MapPinned, MonitorSmartphone, MousePointerClick, Radar } from "lucide-react";

import type { WebsiteAnalyticsSummary } from "@/lib/website-analytics/service";
import { cn } from "@/lib/utils";

const SOURCE_COLORS: Record<string, string> = {
  "Organic Search": "#38BDF8",
  Direct: "#A78BFA",
  Referral: "#34D399",
  LinkedIn: "#60A5FA",
  Other: "#FBBF24",
};

const DEVICE_COLORS = {
  Desktop: "#38BDF8",
  Mobile: "#F472B6",
};

const TOOLTIP_STYLE = {
  background: "rgba(8, 16, 28, 0.96)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  color: "#fff",
  fontSize: 12,
};

function Section({
  title,
  subtitle,
  icon,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-white/12 bg-white/[0.035] p-5 shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.06)] backdrop-blur-xl",
        className,
      )}
    >
      <div className="mb-5 flex items-start gap-3">
        {icon ? (
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sky-200">
            {icon}
          </div>
        ) : null}
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-white/45">{subtitle}</p> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

function RankBars({
  rows,
  empty,
  accent,
}: {
  rows: Array<{ name: string; value: number; percentage: number }>;
  empty: string;
  accent: string;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-sm text-white/40">{empty}</p>;
  }
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-4">
      {rows.map((row, index) => (
        <li key={`${row.name}-${index}`}>
          <div className="mb-1.5 flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="text-sm font-medium tabular-nums text-white/35">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate text-base font-medium text-white">{row.name}</span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-lg font-semibold tabular-nums text-white">{row.value}</span>
              <span className="ml-2 text-sm tabular-nums text-white/40">{row.percentage}%</span>
            </div>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.max(4, (row.value / max) * 100)}%`,
                background: accent,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function InvestigationCard({
  title,
  href,
  description,
}: {
  title: string;
  href: string;
  description: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-h-[140px] flex-col justify-between rounded-2xl border border-sky-400/25 bg-gradient-to-br from-sky-500/15 via-white/[0.03] to-transparent p-5 transition hover:border-sky-300/45 hover:from-sky-500/25"
    >
      <div>
        <p className="text-lg font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm text-white/50">{description}</p>
      </div>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-200 group-hover:text-sky-100">
        Open
        <ExternalLink className="h-4 w-4" />
      </span>
    </a>
  );
}

export default function WebsiteAnalyticsWorkspace() {
  const [summary, setSummary] = useState<WebsiteAnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/website-analytics/summary", { cache: "no-store" });
      const data = (await response.json()) as WebsiteAnalyticsSummary & { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Failed to load website analytics.");
      setSummary(data);
    } catch (loadError) {
      setSummary(null);
      setError(loadError instanceof Error ? loadError.message : "Failed to load website analytics.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const sourceChartData = useMemo(
    () =>
      (summary?.trafficSources ?? []).map((row) => ({
        ...row,
        label: row.source,
        fill: SOURCE_COLORS[row.source] ?? "#94A3B8",
      })),
    [summary],
  );

  const deviceChartData = useMemo(
    () =>
      (summary?.devices ?? []).map((row) => ({
        ...row,
        fill: DEVICE_COLORS[row.name],
      })),
    [summary],
  );

  const deviceTotal = summary?.devices.reduce((sum, row) => sum + row.count, 0) ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Website Analytics</h1>
          <p className="mt-1 text-sm text-white/45">
            unit311central.com · decisions from real visitor behaviour
            {summary ? ` · ${summary.periodLabel}` : ""}
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-white/50">Loading website analytics…</p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {summary && !loading ? (
        <>
          <div className="grid gap-5 xl:grid-cols-5">
            <Section
              className="xl:col-span-3"
              title="Traffic Sources"
              subtitle="Where visitors come from · last 30 days"
              icon={<Radar className="h-5 w-5" />}
            >
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sourceChartData}
                    layout="vertical"
                    margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={120}
                      tick={{ fill: "rgba(255,255,255,0.65)", fontSize: 13 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, _name, item) => {
                        const row = item?.payload as { percentage?: number } | undefined;
                        return [`${value} (${row?.percentage ?? 0}%)`, "Visits"];
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]} barSize={22}>
                      {sourceChartData.map((row) => (
                        <Cell key={row.source} fill={row.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                {sourceChartData.map((row) => (
                  <div
                    key={row.source}
                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5"
                  >
                    <p className="truncate text-[11px] uppercase tracking-wide text-white/40">
                      {row.source}
                    </p>
                    <p className="mt-1 text-2xl font-semibold tabular-nums text-white">{row.count}</p>
                    <p className="text-sm tabular-nums text-white/45">{row.percentage}%</p>
                  </div>
                ))}
              </div>
            </Section>

            <Section
              className="xl:col-span-2"
              title="Device Split"
              subtitle="Desktop vs mobile"
              icon={<MonitorSmartphone className="h-5 w-5" />}
            >
              <div className="relative mx-auto h-[240px] w-full max-w-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      dataKey="count"
                      nameKey="name"
                      innerRadius={68}
                      outerRadius={100}
                      paddingAngle={3}
                      stroke="rgba(8,16,28,0.95)"
                      strokeWidth={3}
                    >
                      {deviceChartData.map((row) => (
                        <Cell key={row.name} fill={row.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value, name, item) => {
                        const row = item?.payload as { percentage?: number } | undefined;
                        return [`${value} · ${row?.percentage ?? 0}%`, String(name)];
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-3xl font-semibold tabular-nums text-white">{deviceTotal}</p>
                  <p className="text-xs uppercase tracking-wide text-white/40">Visitors</p>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-3">
                {deviceChartData.map((row) => (
                  <div
                    key={row.name}
                    className="rounded-xl border border-white/8 bg-black/20 px-3 py-3 text-center"
                  >
                    <p className="text-sm text-white/50">{row.name}</p>
                    <p className="mt-1 text-3xl font-semibold tabular-nums text-white">
                      {row.percentage}%
                    </p>
                    <p className="text-sm tabular-nums text-white/40">{row.count}</p>
                  </div>
                ))}
              </div>
            </Section>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Section
              title="Content Interest"
              subtitle="Most viewed pages"
              icon={<Flame className="h-5 w-5" />}
            >
              <RankBars
                rows={summary.content.pages}
                empty="No page views yet."
              accent="#38BDF8"
            />
            </Section>

            <Section
              title="Content Interest"
              subtitle="Most clicked CTAs"
              icon={<MousePointerClick className="h-5 w-5" />}
            >
              <RankBars
                rows={summary.content.ctas}
                empty="No CTA clicks yet."
                accent="#34D399"
              />
            </Section>
          </div>

          <Section
            title="Geography"
            subtitle="Where visitors are"
            icon={<MapPinned className="h-5 w-5" />}
          >
            {summary.countries.length === 0 ? (
              <p className="py-6 text-sm text-white/40">No geography data yet.</p>
            ) : (
              <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                {summary.countries.map((row) => (
                  <li
                    key={row.code}
                    className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/20 px-4 py-4"
                  >
                    <span className="text-3xl leading-none" aria-hidden>
                      {row.flag}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-base font-medium text-white">{row.name}</p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-sky-400"
                          style={{ width: `${Math.max(6, row.percentage)}%` }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-2xl font-semibold tabular-nums text-white">
                        {row.percentage}%
                      </p>
                      <p className="text-xs tabular-nums text-white/40">{row.count}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section
            title="User Investigation"
            subtitle="Open Clarity when you need to watch real behaviour"
          >
            <div className="grid gap-4 md:grid-cols-3">
              <InvestigationCard
                title="Clarity Dashboard"
                description="Full behavioural view of the marketing site."
                href={summary.clarityDashboardUrl}
              />
              <InvestigationCard
                title="Heatmaps"
                description="See where people click, scroll, and stall."
                href={summary.heatmapsUrl}
              />
              <InvestigationCard
                title="Session Recordings"
                description="Replay journeys that lead to interest or drop-off."
                href={summary.recordingsUrl}
              />
            </div>
          </Section>
        </>
      ) : null}
    </div>
  );
}
