"use client";

import type {
  ActualSpendBreakdown,
  AllowanceUsageState,
  ProjectedSpendBreakdown,
  SpendToDateState,
} from "@/lib/software-billing/dashboard-model";
import { cn } from "@/lib/utils";

export function formatSaasMoney(amount: number, currency: string) {
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: code,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${code} ${amount.toFixed(2)}`;
  }
}

export function ActualSpendBlock({
  title,
  spend,
  compact = false,
}: {
  title?: string;
  spend: ActualSpendBreakdown;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0", compact ? "space-y-1" : "space-y-1.5")}>
      {title ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          {title}
        </p>
      ) : null}
      <p className={cn("font-semibold text-white", compact ? "text-base" : "text-lg")}>
        {formatSaasMoney(spend.total, spend.currency)}
      </p>
      <div className="space-y-0.5 text-[11px] text-white/55">
        <p>Subscription {formatSaasMoney(spend.subscription, spend.currency)}</p>
        <p>
          Additional credits / usage{" "}
          {formatSaasMoney(spend.additionalUsageOrCredits, spend.currency)}
        </p>
      </div>
      {spend.note ? <p className="text-[10px] text-white/35">{spend.note}</p> : null}
    </div>
  );
}

export function ProjectedSpendBlock({
  title,
  spend,
  compact = false,
}: {
  title?: string;
  spend: ProjectedSpendBreakdown;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0", compact ? "space-y-1" : "space-y-1.5")}>
      {title ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          {title}
        </p>
      ) : null}
      <p className={cn("font-semibold text-white", compact ? "text-base" : "text-lg")}>
        {formatSaasMoney(spend.expectedTotal, spend.currency)}
      </p>
      <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-amber-200/80">
        Estimate
      </p>
      <div className="space-y-0.5 text-[11px] text-white/55">
        <p>Subscription {formatSaasMoney(spend.subscription, spend.currency)}</p>
        <p>
          Projected additional credits / usage{" "}
          {formatSaasMoney(spend.projectedAdditionalUsageOrCredits, spend.currency)}
        </p>
      </div>
      {spend.note ? <p className="text-[10px] text-white/35">{spend.note}</p> : null}
    </div>
  );
}

export function SpendToDateBlock({
  title,
  spend,
  compact = false,
}: {
  title?: string;
  spend: SpendToDateState;
  compact?: boolean;
}) {
  return (
    <div className={cn("min-w-0", compact ? "space-y-1" : "space-y-1.5")}>
      {title ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          {title}
        </p>
      ) : null}
      <p className={cn("font-semibold text-white", compact ? "text-base" : "text-lg")}>
        {formatSaasMoney(spend.totalActual, spend.currency)}
      </p>
      <p className="text-[11px] text-white/55">{spend.statusLabel}</p>
      {spend.trackedFrom ? (
        <p className="text-[10px] text-white/40">Tracked from {spend.trackedFrom}</p>
      ) : null}
      {spend.coverage === "complete" ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-emerald-200/80">
          Complete actuals
        </p>
      ) : spend.historicalImportIncomplete ? (
        <p className="text-[10px] font-medium uppercase tracking-[0.1em] text-amber-200/80">
          Historical import pending
        </p>
      ) : null}
      {spend.invoiceOrReceiptCount != null ? (
        <p className="text-[10px] text-white/40">
          {spend.invoiceOrReceiptCount} invoice / receipt
          {spend.invoiceOrReceiptCount === 1 ? "" : "s"}
        </p>
      ) : null}
    </div>
  );
}

export function AllowanceUsageBlock({ state }: { state: AllowanceUsageState }) {
  if (state.kind === "monetary_remaining") {
    return (
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          Allowance / usage
        </p>
        <p className="text-base font-semibold text-white">
          {formatSaasMoney(state.remaining, state.currency)} remaining
        </p>
        <p className="text-[11px] text-white/55">
          {state.label}: {formatSaasMoney(state.used ?? 0, state.currency)} of{" "}
          {formatSaasMoney(state.limit, state.currency)}
          {state.percentUsed != null ? ` (${state.percentUsed}% used)` : ""}
        </p>
      </div>
    );
  }

  if (state.kind === "percent_used") {
    return (
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          Allowance / usage
        </p>
        <p className="text-base font-semibold text-white">{state.percentUsed}% used</p>
        <p className="text-[11px] text-white/55">
          {state.label}
          {state.usedLabel ? ` · ${state.usedLabel}` : ""}
          {state.limitLabel ? ` of ${state.limitLabel}` : ""}
        </p>
      </div>
    );
  }

  if (state.kind === "credits") {
    return (
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          Allowance / usage
        </p>
        <p className="text-base font-semibold text-white">
          {state.remainingCredits != null
            ? `${state.remainingCredits} remaining`
            : `${state.includedCredits} included`}
        </p>
        <p className="text-[11px] text-white/55">
          {state.label}
          {state.usedCredits != null ? ` · ${state.usedCredits} used` : ""}
          {state.unitLabel ? ` (${state.unitLabel})` : ""}
        </p>
      </div>
    );
  }

  if (state.kind === "usage_only") {
    return (
      <div className="min-w-0 space-y-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
          Usage
        </p>
        <p className="text-base font-semibold text-white">
          {formatSaasMoney(state.usageAmount, state.currency)}
        </p>
        <p className="text-[11px] text-white/55">{state.label}</p>
        {state.detail ? <p className="text-[10px] text-white/35">{state.detail}</p> : null}
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1">
      <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/40">
        {state.label}
      </p>
      <p className="text-sm text-white/55">{state.message}</p>
    </div>
  );
}
