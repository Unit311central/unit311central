"use client";

import type { ReactNode } from "react";

import {
  WorkspaceGeneratedPanel,
  WorkspaceImpactMetric,
  WorkspaceModuleHeader,
} from "@/components/workspace-ui";

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
}: {
  moduleLabel: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <WorkspaceModuleHeader
      brandLabel="Talanton Intelligence"
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
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "watch" | "alert" | "good";
}) {
  return <WorkspaceImpactMetric label={label} value={value} hint={hint} tone={tone} />;
}
