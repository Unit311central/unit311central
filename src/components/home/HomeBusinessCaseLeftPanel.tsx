import {
  ArrowRight,
  Copy,
  Layers3,
  LogIn,
  Puzzle,
  Sparkles,
} from "lucide-react";

const STATS = [
  { value: "12+", label: "separate tools in a typical SME stack" },
  { value: "$45.8K", label: "annual software + integration cost" },
  { value: "1 layer", label: "instead of rebuilding the picture by hand" },
] as const;

const PAIN_POINTS = [
  {
    icon: Copy,
    title: "Duplicate data",
    detail: "Same numbers in CRM, finance and ops",
    accent: "#38bdf8",
  },
  {
    icon: Layers3,
    title: "Manual reporting",
    detail: "Leadership decks rebuilt every month",
    accent: "#60a5fa",
  },
  {
    icon: LogIn,
    title: "Login sprawl",
    detail: "Teams hopping between a dozen systems",
    accent: "#3b82f6",
  },
  {
    icon: Puzzle,
    title: "Integration tax",
    detail: "Research, setup and glue code never ends",
    accent: "#2563eb",
  },
] as const;

export default function HomeBusinessCaseLeftPanel() {
  return (
    <div className="flex h-full min-h-[320px] flex-col justify-between rounded-xl border border-sky-300/20 bg-gradient-to-br from-sky-400/[0.1] via-sky-500/[0.04] to-transparent p-4 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)] sm:p-5 lg:min-h-full lg:p-6">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/70">
          The problem
        </p>
        <h3 className="mt-2 text-base font-semibold leading-snug text-white sm:text-lg">
          The hidden cost of multiple business applications
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Growing teams don&apos;t need another subscription — they need one connected operating
          layer with AI on real company data, not another dashboard to maintain.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {STATS.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-3 text-center sm:px-3 sm:py-3.5"
          >
            <p className="text-lg font-bold tabular-nums tracking-tight text-white sm:text-xl">
              {stat.value}
            </p>
            <p className="mt-1 text-[10px] leading-snug text-white/45 sm:text-[11px]">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-5 grid flex-1 grid-cols-2 gap-2 sm:gap-2.5">
        {PAIN_POINTS.map(({ icon: Icon, title, detail, accent }) => (
          <div
            key={title}
            className="flex gap-2.5 rounded-xl border border-white/[0.08] bg-[#070d18]/70 p-3 sm:gap-3 sm:p-3.5"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]"
              style={{ color: accent }}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white/85 sm:text-[13px]">{title}</p>
              <p className="mt-0.5 text-[10px] leading-snug text-white/45 sm:text-[11px]">
                {detail}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-[11px]">
          <span>Typical tool stack</span>
          <span className="text-white/70">$45,788/yr</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-full rounded-full bg-gradient-to-r from-amber-400/80 via-orange-400/70 to-red-400/60" />
        </div>
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45 sm:text-[11px]">
          <span>One connected workspace</span>
          <span className="text-sky-200">Answers in one place</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-[38%] rounded-full bg-gradient-to-r from-sky-400 to-blue-500 shadow-[0_0_18px_rgba(56,189,248,0.35)]" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3 rounded-xl border border-[#3b82f6]/25 bg-gradient-to-r from-[#2563eb]/[0.16] to-[#1d4ed8]/[0.08] px-3.5 py-3 sm:px-4 sm:py-3.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sky-400/15 text-sky-200">
          <Sparkles className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </div>
        <p className="min-w-0 flex-1 text-xs leading-relaxed text-white/75 sm:text-[13px]">
          Stop logging into multiple systems. Get instant answers across finance, ops and leadership
          — from one layer.
        </p>
        <ArrowRight className="hidden h-4 w-4 shrink-0 text-sky-300 sm:block" aria-hidden />
      </div>
    </div>
  );
}
