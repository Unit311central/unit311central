"use client";

import {
  Area,
  AreaChart,
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
import {
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Globe2,
  Search,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";

import {
  ABHI_DEVICE_SPLIT,
  ABHI_GTMETRIX,
  ABHI_PERF_METRICS,
  ABHI_SEO_KEYWORDS,
  ABHI_SEO_SUMMARY,
  ABHI_SITE_DOMAIN,
  ABHI_TRAFFIC_SERIES,
  ABHI_TRAFFIC_SOURCES,
  ABHI_TRAFFIC_SUMMARY,
  ABHI_WAPPALYZER,
} from "@/lib/abhi-website-insights";
import { cn } from "@/lib/utils";

const TOOLTIP = {
  background: "#0b1524",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
  color: "#fff",
} as const;

const PIE_COLORS = ["#38bdf8", "#34d399", "#fbbf24", "#a78bfa", "#fb7185"];

function gradeClass(grade: string) {
  if (grade === "A") return "border-emerald-400/40 bg-emerald-500/15 text-emerald-100";
  if (grade === "B") return "border-sky-400/40 bg-sky-500/15 text-sky-100";
  if (grade === "C") return "border-amber-400/40 bg-amber-500/15 text-amber-100";
  return "border-rose-400/40 bg-rose-500/15 text-rose-100";
}

function Delta({ value, suffix = "%" }: { value: number; suffix?: string }) {
  const up = value >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-[11px] font-semibold",
        up ? "text-emerald-300" : "text-rose-300",
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {up ? "+" : ""}
      {value}
      {suffix}
    </span>
  );
}

function Panel({
  title,
  subtitle,
  icon,
  children,
  tone = "sky",
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  tone?: "sky" | "emerald" | "amber" | "violet";
}) {
  const toneMap = {
    sky: "from-sky-500/15 to-cyan-500/5 border-sky-400/20",
    emerald: "from-emerald-500/15 to-teal-500/5 border-emerald-400/20",
    amber: "from-amber-500/15 to-orange-500/5 border-amber-400/20",
    violet: "from-violet-500/15 to-fuchsia-500/5 border-violet-400/20",
  } as const;
  return (
    <article className="overflow-hidden rounded-2xl border border-white/12 bg-[#0a1422]/90 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
      <div className={cn("border-b bg-gradient-to-r px-4 py-4 sm:px-5", toneMap[tone])}>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.05] text-white">
            {icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <p className="text-xs text-white/50">{subtitle}</p>
          </div>
        </div>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </article>
  );
}

export function AbhiSeoInsightsPanel() {
  return (
    <div className="space-y-4">
      <Panel
        title="SEO statistics"
        subtitle={`${ABHI_SITE_DOMAIN} · Search Console style snapshot`}
        icon={<Search className="h-5 w-5 text-sky-200" />}
        tone="emerald"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Domain authority", String(ABHI_SEO_SUMMARY.domainAuthority)],
            ["Organic keywords", ABHI_SEO_SUMMARY.organicKeywords.toLocaleString()],
            ["Est. organic traffic", ABHI_SEO_SUMMARY.organicTrafficEst.toLocaleString()],
            ["Avg. position", String(ABHI_SEO_SUMMARY.avgPosition)],
            ["Top 10 keywords", String(ABHI_SEO_SUMMARY.top10Keywords)],
            ["Indexed pages", String(ABHI_SEO_SUMMARY.indexedPages)],
            ["Crawl errors", String(ABHI_SEO_SUMMARY.crawlErrors)],
            ["Core Web Vitals", ABHI_SEO_SUMMARY.coreWebVitals],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wide text-white/40">{label}</p>
              <p className="mt-1 text-lg font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
          <TrendingUp className="h-3.5 w-3.5 text-emerald-300" />
          Visibility <Delta value={ABHI_SEO_SUMMARY.visibilityChangePct} /> vs prior 28 days
        </div>
      </Panel>

      <Panel
        title="Tracked keywords"
        subtitle="Position movement for priority ABHI queries"
        icon={<Globe2 className="h-5 w-5 text-emerald-200" />}
        tone="sky"
      >
        <ul className="space-y-2">
          {ABHI_SEO_KEYWORDS.map((row) => {
            const improved = row.change > 0;
            const declined = row.change < 0;
            return (
              <li
                key={row.keyword}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/90">{row.keyword}</p>
                  <p className="truncate text-[11px] text-white/40">
                    {row.volume}/mo · {row.url}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">#{row.position}</p>
                  <p
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-[10px] font-medium",
                      improved ? "text-emerald-300" : declined ? "text-rose-300" : "text-white/40",
                    )}
                  >
                    {improved ? <ArrowUpRight className="h-3 w-3" /> : null}
                    {declined ? <ArrowDownRight className="h-3 w-3" /> : null}
                    {row.change === 0 ? "—" : `${Math.abs(row.change)} pos`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </Panel>
    </div>
  );
}

export function AbhiAnalyticsInsightsPanel() {
  return (
    <div className="space-y-4">
      <Panel
        title="Visitors & engagement"
        subtitle="30-day audience snapshot for the public site"
        icon={<Users className="h-5 w-5 text-sky-200" />}
        tone="sky"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Visitors (30d)</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {ABHI_TRAFFIC_SUMMARY.visitors30d.toLocaleString()}
            </p>
            <Delta value={ABHI_TRAFFIC_SUMMARY.visitorsMomPct} />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Pageviews</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {ABHI_TRAFFIC_SUMMARY.pageviews30d.toLocaleString()}
            </p>
            <Delta value={ABHI_TRAFFIC_SUMMARY.pageviewsMomPct} />
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Avg. session</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {Math.floor(ABHI_TRAFFIC_SUMMARY.avgSessionSec / 60)}m{" "}
              {ABHI_TRAFFIC_SUMMARY.avgSessionSec % 60}s
            </p>
            <p className="text-[11px] text-white/40">
              {ABHI_TRAFFIC_SUMMARY.pagesPerSession} pages / session
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Bounce rate</p>
            <p className="mt-1 text-xl font-semibold text-white">
              {ABHI_TRAFFIC_SUMMARY.bounceRatePct}%
            </p>
            <p className="text-[11px] text-white/40">
              {ABHI_TRAFFIC_SUMMARY.newUsersPct}% new users
            </p>
          </div>
        </div>

        <div className="mt-5 h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[...ABHI_TRAFFIC_SERIES]}>
              <defs>
                <linearGradient id="abhi-visitors" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }} />
              <YAxis tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 10 }} width={40} />
              <Tooltip contentStyle={TOOLTIP} />
              <Area
                type="monotone"
                dataKey="visitors"
                name="Visitors"
                stroke="#38bdf8"
                strokeWidth={2.5}
                fill="url(#abhi-visitors)"
              />
              <Area
                type="monotone"
                dataKey="pageviews"
                name="Pageviews"
                stroke="#34d399"
                strokeWidth={1.5}
                fillOpacity={0}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Traffic sources"
          subtitle="Session mix · last 30 days"
          icon={<Globe2 className="h-5 w-5 text-violet-200" />}
          tone="violet"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[...ABHI_TRAFFIC_SOURCES]} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="source"
                  width={110}
                  tick={{ fill: "rgba(255,255,255,0.55)", fontSize: 11 }}
                />
                <Tooltip contentStyle={TOOLTIP} />
                <Bar dataKey="sessions" fill="#a78bfa" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 space-y-1.5 text-xs text-white/65">
            {ABHI_TRAFFIC_SOURCES.map((row) => (
              <li key={row.source} className="flex justify-between gap-2">
                <span>{row.source}</span>
                <span className="tabular-nums text-white">
                  {row.sessions.toLocaleString()} · {row.sharePct}%
                </span>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel
          title="Devices"
          subtitle="Visitor device split"
          icon={<Gauge className="h-5 w-5 text-amber-200" />}
          tone="amber"
        >
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[...ABHI_DEVICE_SPLIT]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={48}
                  outerRadius={74}
                  paddingAngle={3}
                  stroke="rgba(8,16,28,0.9)"
                  strokeWidth={2}
                >
                  {ABHI_DEVICE_SPLIT.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP} formatter={(v) => [`${v}%`, "Share"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-1 flex flex-wrap gap-3 text-xs text-white/65">
            {ABHI_DEVICE_SPLIT.map((row, index) => (
              <li key={row.name} className="inline-flex items-center gap-1.5">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                />
                {row.name} {row.value}%
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

export function AbhiPerformanceTechPanel() {
  return (
    <div className="space-y-4">
      <Panel
        title="Performance (GTmetrix-style)"
        subtitle={`Tested ${new Date(ABHI_GTMETRIX.testedAt).toLocaleString()} · ${ABHI_GTMETRIX.location}`}
        icon={<Gauge className="h-5 w-5 text-amber-200" />}
        tone="amber"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Performance</p>
            <p
              className={cn(
                "mt-2 inline-flex h-14 w-14 items-center justify-center rounded-full border text-2xl font-bold",
                gradeClass(ABHI_GTMETRIX.performanceGrade),
              )}
            >
              {ABHI_GTMETRIX.performanceGrade}
            </p>
            <p className="mt-2 text-sm tabular-nums text-white/70">
              {ABHI_GTMETRIX.performanceScore}/100
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-center">
            <p className="text-[10px] uppercase tracking-wide text-white/40">Structure</p>
            <p
              className={cn(
                "mt-2 inline-flex h-14 w-14 items-center justify-center rounded-full border text-2xl font-bold",
                gradeClass(ABHI_GTMETRIX.structureGrade),
              )}
            >
              {ABHI_GTMETRIX.structureGrade}
            </p>
            <p className="mt-2 text-sm tabular-nums text-white/70">
              {ABHI_GTMETRIX.structureScore}/100
            </p>
          </div>
          <p className="max-w-sm text-xs text-white/45">
            {ABHI_GTMETRIX.browser}. Scores mirror Lighthouse / GTmetrix-style lab metrics for the
            homepage.
          </p>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {ABHI_PERF_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-[10px] uppercase tracking-wide text-white/40">{metric.label}</p>
                {metric.grade ? (
                  <span
                    className={cn(
                      "rounded-md border px-1.5 py-0.5 text-[10px] font-bold",
                      gradeClass(metric.grade),
                    )}
                  >
                    {metric.grade}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 text-lg font-semibold text-white">{metric.value}</p>
              <p className="text-[11px] text-white/40">{metric.hint}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        title="Technology stack (Wappalyzer-style)"
        subtitle="Detected CMS, analytics, CDN and libraries"
        icon={<Shield className="h-5 w-5 text-violet-200" />}
        tone="violet"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {ABHI_WAPPALYZER.map((tech) => (
            <div
              key={`${tech.category}-${tech.name}`}
              className="flex items-start justify-between gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
            >
              <div>
                <p className="text-sm font-medium text-white">{tech.name}</p>
                <p className="text-[11px] text-white/45">
                  {tech.category}
                  {tech.version ? ` · v${tech.version}` : ""}
                </p>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-md border px-1.5 py-0.5 text-[10px] font-semibold",
                  tech.confidence === "High"
                    ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
                    : "border-amber-400/30 bg-amber-500/10 text-amber-100",
                )}
              >
                {tech.confidence}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-[11px] text-white/35">
          Detection snapshot for planning — connect live crawlers for continuous scans.
        </p>
      </Panel>
    </div>
  );
}
