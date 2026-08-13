import {
  Copy,
  Layers2,
  Layers3,
  LogIn,
  Puzzle,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const STATS: {
  value: string;
  label: string;
  icon: LucideIcon;
  tint: string;
}[] = [
  {
    value: "20+",
    label: "separate tools in a typical SME stack",
    icon: Layers3,
    tint: "bg-[#0b1522]",
  },
  {
    value: "Ongoing",
    label: "costs and admin on top of subscriptions",
    icon: RefreshCw,
    tint: "bg-[#12100c]",
  },
  {
    value: "Multiple layers",
    label: "rebuilding the same picture by hand",
    icon: Layers2,
    tint: "bg-[#0f1020]",
  },
];

const PAIN_POINTS = [
  {
    icon: Copy,
    title: "Duplicate data",
    detail: "Same numbers in CRM, finance and ops",
    accent: "#38bdf8",
    tint: "bg-[#081018]",
  },
  {
    icon: Layers3,
    title: "Manual reporting",
    detail: "Leadership decks rebuilt every month",
    accent: "#60a5fa",
    tint: "bg-[#08111c]",
  },
  {
    icon: LogIn,
    title: "Login sprawl",
    detail: "Teams hopping between a dozen systems",
    accent: "#3b82f6",
    tint: "bg-[#080f1a]",
  },
  {
    icon: Puzzle,
    title: "Integration tax",
    detail: "Research, setup and glue code never ends",
    accent: "#2563eb",
    tint: "bg-[#0a0e1c]",
  },
] as const;

export default function HomeBusinessCaseLeftPanel() {
  return (
    <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-sky-300/20 bg-[#070d18] p-4 sm:p-5 lg:min-h-full lg:p-6">
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/70">
          The problem
        </p>
        <h3 className="mt-2 text-base font-semibold leading-snug text-white sm:text-lg">
          The hidden cost of multiple business applications
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/55">
          Growing teams accumulate software layer by layer — with no single connected picture of the
          business.
        </p>
      </div>

      <div className="relative mt-5 grid grid-cols-3 gap-2 sm:gap-3">
        {STATS.map(({ value, label, icon: Icon, tint }) => (
          <div
            key={label}
            className={cn(
              "overflow-hidden rounded-xl border border-white/10 p-2.5 text-center sm:p-3",
              tint,
            )}
          >
            <div className="mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-sky-200 sm:h-8 sm:w-8">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.75} aria-hidden />
            </div>
            <p
              className={cn(
                "font-bold tracking-tight text-white",
                value.length > 8
                  ? "text-xs leading-tight sm:text-sm"
                  : "text-base sm:text-lg",
              )}
            >
              {value}
            </p>
            <p className="mt-1 text-[9px] leading-snug text-white/50 sm:text-[10px]">{label}</p>
          </div>
        ))}
      </div>

      <div className="relative mt-4 grid flex-1 grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3">
        {PAIN_POINTS.map(({ icon: Icon, title, detail, accent, tint }) => (
          <div
            key={title}
            className={cn(
              "flex min-h-[108px] flex-col overflow-hidden rounded-2xl border border-white/[0.12] p-3.5 sm:min-h-[118px] sm:p-4",
              tint,
            )}
            style={{ borderTopColor: `${accent}55`, borderTopWidth: 2 }}
          >
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0a1220]"
              style={{ color: accent }}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden />
            </div>
            <div className="mt-auto">
              <p className="text-[13px] font-semibold leading-snug text-white sm:text-sm">{title}</p>
              <p className="mt-1.5 text-[11px] leading-relaxed text-white/50 sm:text-xs">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
