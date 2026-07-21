/**
 * Unit311 Central — Enterprise Design System
 *
 * Feature development is frozen. Use these tokens/primitives for all
 * internal Ops UI. Do not invent per-page spacing, radii, or accent colours.
 */

import { cn } from "@/lib/utils";

/** Single primary accent (sky). Status colours are reserved for meaning only. */
export const enterpriseTokens = {
  accent: {
    text: "text-sky-300",
    textSoft: "text-sky-200/90",
    border: "border-sky-400/30",
    bg: "bg-sky-500/10",
    bgHover: "hover:bg-sky-500/15",
    fill: "bg-sky-400",
    ring: "focus-visible:ring-sky-400/40",
  },
  surface: {
    page: "bg-[#020617]",
    panel: "bg-[#0b1524]/80",
    inset: "bg-[#07111f]/90",
    elevated: "bg-[#0c1628]",
  },
  border: {
    default: "border-white/10",
    subtle: "border-white/8",
    strong: "border-white/15",
  },
  text: {
    primary: "text-white",
    secondary: "text-white/70",
    muted: "text-white/45",
    faint: "text-white/35",
  },
  status: {
    success: { text: "text-emerald-300", bg: "bg-emerald-500/10", border: "border-emerald-400/30" },
    warning: { text: "text-amber-300", bg: "bg-amber-500/10", border: "border-amber-400/30" },
    critical: { text: "text-rose-300", bg: "bg-rose-500/10", border: "border-rose-400/30" },
    info: { text: "text-sky-300", bg: "bg-sky-500/10", border: "border-sky-400/30" },
  },
  radius: {
    sm: "rounded-lg",
    md: "rounded-xl",
    lg: "rounded-2xl",
  },
  /** Card size slots only — no arbitrary heights. */
  cardSize: {
    small: "min-h-[4.75rem]",
    medium: "min-h-[12rem]",
    large: "min-h-[18rem]",
  },
  space: {
    gap: "gap-3 xl:gap-4",
    pad: "p-4",
    padCompact: "p-3",
    section: "space-y-4 sm:space-y-5",
  },
  type: {
    display: "text-2xl font-semibold tracking-tight text-white sm:text-3xl",
    pageTitle: "text-lg font-semibold tracking-tight text-white sm:text-xl",
    section: "text-sm font-semibold tracking-tight text-white",
    cardHeading: "text-sm font-semibold text-white",
    body: "text-sm leading-relaxed text-white/70",
    metadata:
      "text-[10px] font-semibold uppercase tracking-[0.16em] text-white/40",
    label: "text-[10px] font-medium uppercase tracking-[0.12em] text-white/45",
    helper: "text-xs text-white/45",
  },
} as const;

export type EnterpriseCardSize = keyof typeof enterpriseTokens.cardSize;
export type EnterpriseStatus = keyof typeof enterpriseTokens.status;

/** Canonical panel / card shell — replace local panelClassName() copies. */
export function enterpriseCardClassName(
  options?:
    | string
    | {
        size?: EnterpriseCardSize;
        interactive?: boolean;
        className?: string;
      },
) {
  const resolved =
    typeof options === "string" ? { className: options } : options ?? undefined;
  return cn(
    enterpriseTokens.radius.lg,
    enterpriseTokens.border.default,
    enterpriseTokens.surface.panel,
    enterpriseTokens.space.pad,
    "shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
    resolved?.size ? enterpriseTokens.cardSize[resolved.size] : null,
    resolved?.interactive &&
      "transition-colors hover:border-white/15 hover:bg-[#0b1524]/90",
    resolved?.className,
  );
}

export function enterpriseInputClassName(className?: string) {
  return cn(
    "w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors",
    "placeholder:text-white/30",
    "focus:border-sky-400/45 focus-visible:ring-2 focus-visible:ring-sky-400/25",
    className,
  );
}

export function enterpriseButtonClassName(
  variant: "primary" | "secondary" | "ghost" | "danger" = "secondary",
  className?: string,
) {
  const base =
    "inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/35 disabled:pointer-events-none disabled:opacity-50";
  const variants = {
    primary: cn(
      "border border-sky-400/35 bg-sky-500/15 text-sky-100 hover:bg-sky-500/25",
    ),
    secondary:
      "border border-white/10 bg-white/[0.03] text-white/75 hover:bg-white/[0.06] hover:text-white",
    ghost: "border border-transparent text-white/60 hover:bg-white/[0.05] hover:text-white",
    danger:
      "border border-rose-400/30 bg-rose-500/10 text-rose-100 hover:bg-rose-500/20",
  } as const;
  return cn(base, variants[variant], className);
}

export function enterpriseLabelClassName(className?: string) {
  return cn(enterpriseTokens.type.label, className);
}

export function enterpriseMetaClassName(className?: string) {
  return cn(enterpriseTokens.type.metadata, className);
}

export function enterpriseGridClassName(className?: string) {
  return cn("grid grid-cols-12", enterpriseTokens.space.gap, className);
}

export function enterpriseStatusClassName(
  status: EnterpriseStatus,
  className?: string,
) {
  const tone = enterpriseTokens.status[status];
  return cn("rounded-lg border px-2 py-1 text-[11px] font-medium", tone.border, tone.bg, tone.text, className);
}

/** Neutral icon well — avoid decorative multi-colour borders. */
export function enterpriseIconWellClassName(className?: string) {
  return cn(
    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55",
    className,
  );
}

export function enterpriseHelperClassName(className?: string) {
  return cn(enterpriseTokens.type.helper, className);
}

export function enterpriseErrorClassName(className?: string) {
  return cn("text-xs text-rose-300", className);
}

export function enterpriseFieldClassName(className?: string) {
  return cn("space-y-1.5", className);
}
