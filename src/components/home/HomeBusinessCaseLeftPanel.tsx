"use client";

import { useEffect, useState } from "react";
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
  gradient: string;
  glow: string;
}[] = [
  {
    value: "20+",
    label: "separate tools in a typical SME stack",
    icon: Layers3,
    gradient: "from-sky-400/25 via-sky-500/10 to-transparent",
    glow: "shadow-[0_0_28px_rgba(56,189,248,0.22)]",
  },
  {
    value: "Ongoing",
    label: "costs and admin on top of subscriptions",
    icon: RefreshCw,
    gradient: "from-amber-400/20 via-orange-500/10 to-transparent",
    glow: "shadow-[0_0_28px_rgba(251,191,36,0.18)]",
  },
  {
    value: "Multiple layers",
    label: "rebuilding the same picture by hand",
    icon: Layers2,
    gradient: "from-violet-400/20 via-blue-500/10 to-transparent",
    glow: "shadow-[0_0_28px_rgba(129,140,248,0.2)]",
  },
];

const APP_CHIPS = [
  { label: "CRM", x: 6, y: 14, color: "#38bdf8" },
  { label: "BI", x: 78, y: 10, color: "#60a5fa" },
  { label: "HR", x: 84, y: 52, color: "#3b82f6" },
  { label: "PM", x: 68, y: 78, color: "#818cf8" },
  { label: "Finance", x: 4, y: 68, color: "#22d3ee" },
  { label: "Support", x: 22, y: 38, color: "#67e8f9" },
  { label: "Board", x: 48, y: 6, color: "#93c5fd" },
  { label: "Marketing", x: 38, y: 82, color: "#a5b4fc" },
] as const;

const PAIN_POINTS = [
  {
    icon: Copy,
    title: "Duplicate data",
    detail: "Same numbers in CRM, finance and ops",
    accent: "#38bdf8",
    gradient: "from-sky-500/20 to-sky-500/0",
  },
  {
    icon: Layers3,
    title: "Manual reporting",
    detail: "Leadership decks rebuilt every month",
    accent: "#60a5fa",
    gradient: "from-blue-500/20 to-blue-500/0",
  },
  {
    icon: LogIn,
    title: "Login sprawl",
    detail: "Teams hopping between a dozen systems",
    accent: "#3b82f6",
    gradient: "from-indigo-500/20 to-indigo-500/0",
  },
  {
    icon: Puzzle,
    title: "Integration tax",
    detail: "Research, setup and glue code never ends",
    accent: "#2563eb",
    gradient: "from-violet-500/20 to-violet-500/0",
  },
] as const;

function SprawlConstellation({ animate }: { animate: boolean }) {
  return (
    <div className="relative mx-auto mt-4 h-[148px] w-full max-w-[340px] sm:h-[168px] sm:max-w-none">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id="sprawl-line" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.35)" />
            <stop offset="100%" stopColor="rgba(129,140,248,0.08)" />
          </linearGradient>
        </defs>
        {APP_CHIPS.map((chip, index) => (
          <line
            key={`line-${chip.label}`}
            x1={chip.x + 8}
            y1={chip.y + 4}
            x2={50 + (index % 3) * 4 - 4}
            y2={48 + (index % 2) * 6 - 3}
            stroke="url(#sprawl-line)"
            strokeWidth="0.35"
            strokeDasharray="1.8 1.4"
            opacity={0.65}
          />
        ))}
        <circle cx="50" cy="48" r="14" fill="rgba(15,23,42,0.85)" stroke="rgba(248,113,113,0.35)" strokeWidth="0.5" />
        <circle cx="50" cy="48" r="9" fill="none" stroke="rgba(251,191,36,0.25)" strokeWidth="0.35" strokeDasharray="2 1.5" />
      </svg>

      <div
        className={cn(
          "absolute left-1/2 top-[46%] flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-2xl border border-amber-400/25 bg-[#0a1220]/90 shadow-[0_0_32px_rgba(251,191,36,0.15)] sm:h-14 sm:w-14",
          animate && "motion-safe:animate-pulse",
        )}
      >
        <div className="grid grid-cols-2 gap-0.5 opacity-90">
          {[0, 1, 2, 3].map((cell) => (
            <span
              key={cell}
              className="h-2 w-2 rounded-[3px] bg-gradient-to-br from-amber-300/70 to-red-400/50 sm:h-2.5 sm:w-2.5"
              style={{ transform: `translate(${cell % 2 ? 1 : -1}px, ${cell > 1 ? 1 : -1}px)` }}
            />
          ))}
        </div>
      </div>

      {APP_CHIPS.map((chip, index) => (
        <span
          key={chip.label}
          className={cn(
            "sprawl-chip absolute rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-wide backdrop-blur-sm sm:px-2.5 sm:py-1 sm:text-[10px]",
            animate && "sprawl-chip-animate",
          )}
          style={{
            left: `${chip.x}%`,
            top: `${chip.y}%`,
            color: chip.color,
            borderColor: `${chip.color}55`,
            backgroundColor: `${chip.color}18`,
            animationDelay: animate ? `${index * 0.35}s` : undefined,
          }}
        >
          {chip.label}
        </span>
      ))}
    </div>
  );
}

export default function HomeBusinessCaseLeftPanel() {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    setAnimate(!media.matches);
    const onChange = () => setAnimate(!media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-xl border border-sky-300/20 bg-gradient-to-br from-sky-400/[0.12] via-[#070d18]/90 to-[#030712] p-4 shadow-[inset_0_1px_0_rgba(186,230,253,0.14)] sm:p-5 lg:min-h-full lg:p-6">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-400/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-amber-400/8 blur-3xl"
        aria-hidden
      />

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

      <SprawlConstellation animate={animate} />

      <div className="relative mt-3 grid grid-cols-3 gap-2 sm:gap-3">
        {STATS.map(({ value, label, icon: Icon, gradient, glow }) => (
          <div
            key={label}
            className={cn(
              "relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br p-2.5 text-center sm:p-3",
              gradient,
              glow,
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

      <div className="relative mt-4 grid flex-1 grid-cols-2 gap-2 sm:mt-5 sm:gap-2.5">
        {PAIN_POINTS.map(({ icon: Icon, title, detail, accent, gradient }) => (
          <div
            key={title}
            className={cn(
              "group relative overflow-hidden rounded-xl border border-white/[0.1] bg-[#070d18]/75 p-3 transition-colors hover:border-white/20 sm:p-3.5",
            )}
          >
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
                gradient,
              )}
              aria-hidden
            />
            <div className="relative flex gap-2.5 sm:gap-3">
              <div
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 shadow-[0_0_20px_rgba(56,189,248,0.12)] transition-transform group-hover:scale-105"
                style={{
                  color: accent,
                  backgroundColor: `${accent}14`,
                  boxShadow: `0 0 22px ${accent}22`,
                }}
              >
                <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white/90 sm:text-[13px]">{title}</p>
                <p className="mt-0.5 text-[10px] leading-snug text-white/45 sm:text-[11px]">
                  {detail}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes sprawl-float {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        .sprawl-chip-animate {
          animation: sprawl-float 4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
