"use client";

import type { ReactNode } from "react";

import {
  UNAVAILABLE_LABEL,
  formatNullableCount,
  formatNullableScore,
} from "@/lib/talanton/intelligence-metric-types";
import {
  WorkspaceGeneratedPanel,
  WorkspaceImpactMetric,
  WorkspaceModuleHeader,
} from "@/components/workspace-ui";

export { formatNullableCount, formatNullableScore, UNAVAILABLE_LABEL };

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
    <WorkspaceGeneratedPanel
      title={title}
      eyebrow={eyebrow}
      copyText={copyText}
      className={className}
      themeId="talanton-emerald"
    >
      {children}
    </WorkspaceGeneratedPanel>
  );
}

export function TalantonIntelligenceHeader({
  moduleLabel,
  title,
  description,
  actions,
  brandLabel = "Talanton Intelligence",
}: {
  moduleLabel?: string;
  title: string;
  description: string;
  actions?: ReactNode;
  brandLabel?: string;
}) {
  return (
    <WorkspaceModuleHeader
      brandLabel={brandLabel}
      moduleLabel={moduleLabel}
      title={title}
      description={description}
      actions={actions}
      themeId="talanton-emerald"
    />
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
  unavailable,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "alert" | "good";
  /** When true, render muted unavailable styling (value should be UNAVAILABLE_LABEL or similar). */
  unavailable?: boolean;
}) {
  if (unavailable || value === UNAVAILABLE_LABEL) {
    return (
      <TalantonPlaceholderMetric label={label} value={UNAVAILABLE_LABEL} hint={hint ?? "Not reported"} />
    );
  }
  return <WorkspaceImpactMetric label={label} value={value} hint={hint} tone={tone} />;
}
