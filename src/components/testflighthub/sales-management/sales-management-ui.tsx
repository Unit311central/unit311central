"use client";

import { useCallback, useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Inbox, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { WsKpiTile } from "../domain-workspace-ui";

export type SalesWorkspacePayload = {
  section: import("@/lib/sales-management-api").SalesManagementSection;
  workspace: { id: string; slug: string; name: string };
  context: {
    currentUserId: string;
    currentUserName: string;
    isManager: boolean;
    isSalesperson: boolean;
    currency: "GBP" | "USD" | "AUD" | "ZAR";
    people: Array<{ userId: string; displayName: string; email: string; isManager: boolean }>;
    teams: Array<{ id: string; name: string; managerName: string | null; memberCount: number }>;
  };
  metrics: Record<string, unknown>;
  mySales: Record<string, unknown>;
  salesTeam: unknown[];
  activities: unknown[];
  targets: unknown[];
  performance: Record<string, unknown>;
  forecast: Record<string, unknown>;
  commissionRules: unknown[];
  commissions: unknown[];
  reports: Record<string, unknown>;
};

export const SALES_CHART_HEIGHT = "h-[280px]";

export function SalesTabHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 pb-4">
      <div className="min-w-0 flex-1">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-white/50">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function SalesKpiGrid({
  children,
  columns = 4,
  className,
}: {
  children: ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const cols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-2 lg:grid-cols-3"
        : "sm:grid-cols-2 xl:grid-cols-4";
  return <div className={cn("grid gap-3", cols, className)}>{children}</div>;
}

export function SalesKpiTile({
  label,
  value,
  hint,
  valueClassName,
}: {
  label: string;
  value: string | number;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">{label}</p>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums tracking-tight text-white", valueClassName)}>
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs leading-snug text-white/45">{hint}</p> : null}
    </div>
  );
}

/** Back-compat wrapper where WsKpiTile sizing is still preferred. */
export { WsKpiTile };

export function SalesChartFrame({
  children,
  className,
  heightClassName = SALES_CHART_HEIGHT,
}: {
  children: ReactNode;
  className?: string;
  heightClassName?: string;
}) {
  return <div className={cn("min-h-[240px] w-full", heightClassName, className)}>{children}</div>;
}

export function SalesActivityRow({
  title,
  subtitle,
  companyName,
  ownerName,
  whenLabel,
  status,
  overdue = false,
}: {
  title: string;
  subtitle: string;
  companyName?: string | null;
  ownerName?: string | null;
  whenLabel?: string | null;
  status: string;
  overdue?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-3 border-b border-white/10 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_auto]",
        overdue && "border-l-2 border-l-amber-400/80 pl-3",
      )}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-white">{title}</p>
          <span className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/55">
            {status}
          </span>
        </div>
        <p className="text-sm text-white/50">{subtitle}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/45">
          {companyName ? <span>{companyName}</span> : null}
          {ownerName ? <span>Owner: {ownerName}</span> : null}
        </div>
      </div>
      <div className="shrink-0 self-start text-right text-sm tabular-nums text-white/60">
        {whenLabel ?? "—"}
      </div>
    </div>
  );
}

export function SalesCompactEmpty({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <p className={cn("rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white/45", className)}>
      {message}
    </p>
  );
}

export function SalesRegisterCard({
  children,
  className,
  highlight,
}: {
  children: ReactNode;
  className?: string;
  highlight?: "amber" | "violet" | "none";
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-3.5 py-3 transition-colors",
        highlight === "amber"
          ? "border-amber-400/20 bg-amber-500/10"
          : highlight === "violet"
            ? "border-violet-400/20 bg-violet-500/10"
            : "border-white/10 bg-white/[0.03] hover:border-white/15 hover:bg-white/[0.05]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SalesFilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SalesFilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3.5 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-violet-500/20 text-violet-100 ring-1 ring-violet-400/30"
          : "text-white/50 hover:bg-white/[0.05] hover:text-white/85",
      )}
    >
      {children}
    </button>
  );
}

async function readApiJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) throw new Error(`Request failed (${response.status})`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(response.ok ? "Invalid server response." : text.slice(0, 180));
  }
}

export function useSalesWorkspaceSection(section: import("@/lib/sales-management-api").SalesManagementSection) {
  const [data, setData] = useState<SalesWorkspacePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sales-management/workspace?section=${section}`, {
        cache: "no-store",
      });
      const payload = await readApiJson<SalesWorkspacePayload & { error?: string }>(response);
      if (!response.ok) throw new Error(payload.error ?? "Failed to load sales data");
      setData(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load sales data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [section]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, error, reload: load };
}

export function SalesManagementLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex min-h-[220px] items-center justify-center text-sm text-white/55">
      <Loader2 className="mr-2 h-5 w-5 animate-spin text-violet-300/80" />
      {label}
    </div>
  );
}

export function SalesManagementError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
      <p>{message}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-xs font-medium text-red-100 underline underline-offset-2"
        >
          Try again
        </button>
      ) : null}
    </div>
  );
}

export function SalesEmptyState({
  title,
  description,
  icon: Icon = Inbox,
  compact = false,
  dense = false,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  compact?: boolean;
  dense?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-white/15 bg-white/[0.02] text-center",
        dense ? "px-4 py-5" : compact ? "px-4 py-6" : "px-6 py-9",
      )}
    >
      <div
        className={cn(
          "mx-auto flex items-center justify-center rounded-full border border-white/10 bg-white/[0.04]",
          dense ? "h-9 w-9" : "h-11 w-11",
        )}
      >
        <Icon className={cn("text-violet-300/70", dense ? "h-4 w-4" : "h-5 w-5")} aria-hidden />
      </div>
      <p className={cn("font-semibold text-white/85", dense ? "mt-2 text-sm" : "mt-3 text-sm")}>{title}</p>
      <p className={cn("mx-auto max-w-md leading-relaxed text-white/45", dense ? "mt-1 text-xs" : "mt-2 text-[13px]")}>
        {description}
      </p>
    </div>
  );
}

export function ChartTooltip({
  active,
  payload,
  label,
  valueFormatter,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; name?: string; color?: string }>;
  label?: string;
  valueFormatter?: (value: number, name?: string) => string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0b1524] px-3 py-2 text-xs text-white shadow-xl">
      {label ? <div className="mb-1 font-medium text-white/80">{label}</div> : null}
      {payload.map((entry) => (
        <div key={entry.name} style={{ color: entry.color ?? "#fff" }}>
          {entry.name}:{" "}
          {valueFormatter && entry.value != null
            ? valueFormatter(entry.value, entry.name)
            : entry.value}
        </div>
      ))}
    </div>
  );
}
