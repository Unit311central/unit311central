"use client";

import type { ReactNode } from "react";

import { CopyToClipboardButton } from "@/components/ui/CopyToClipboardButton";
import { cn } from "@/lib/utils";

/** Mandatory Talanton Intelligence standard: copy control top-right on every generated panel. */
export function TalantonGeneratedPanel({
  title,
  eyebrow,
  copyText,
  children,
  className,
}: {
  title: string;
  eyebrow?: string;
  copyText: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/80 via-[#0b1a14]/90 to-[#08110d] p-5 sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent"
      />
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          {eyebrow ? (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-300/80">
              {eyebrow}
            </p>
          ) : null}
          <h2 className="mt-1 text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        </div>
        <CopyToClipboardButton text={copyText} className="shrink-0" />
      </div>
      {children}
    </section>
  );
}

export function TalantonIntelligenceHeader({
  moduleLabel,
  title,
  description,
  actions,
}: {
  /** e.g. Portfolio Intelligence · Impact Intelligence */
  moduleLabel: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-[radial-gradient(ellipse_at_top_left,_rgba(27,138,90,0.28),_transparent_55%),linear-gradient(135deg,#0c1f17_0%,#08140f_55%,#060d0a_100%)] px-5 py-6 sm:px-7 sm:py-7">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl"
      />
      <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/85">
            Talanton Intelligence
          </p>
          <p className="mt-1.5 text-[11px] font-medium tracking-wide text-emerald-200/55">
            {moduleLabel}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">{description}</p>
        </div>
        {actions ? <div className="shrink-0">{actions}</div> : null}
      </div>
    </header>
  );
}

export function TalantonPlaceholderMetric({
  label,
  value = "—",
  hint,
}: {
  label: string;
  value?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-white/35">{value}</p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-white/35">{hint}</p> : null}
    </div>
  );
}

export function TalantonImpactMetric({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "alert" | "good";
}) {
  const valueClass =
    tone === "alert"
      ? "text-rose-200"
      : tone === "watch"
        ? "text-amber-200"
        : tone === "good"
          ? "text-emerald-200"
          : "text-white";

  return (
    <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-3.5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">{label}</p>
      <p className={cn("mt-2 text-2xl font-semibold tabular-nums tracking-tight", valueClass)}>
        {value}
      </p>
      {hint ? <p className="mt-1 text-[11px] leading-snug text-white/40">{hint}</p> : null}
    </div>
  );
}
