import type { WolfOperationalStatus } from "@/lib/wolf/central/types";
import { cn } from "@/lib/utils";

export const wolfShellClass = "min-h-full bg-[#080c0a] text-white";
export const wolfCardClass =
  "rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.04] to-transparent";
export const wolfEyebrowClass =
  "text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300/80";
export const wolfMetricValueClass = "text-3xl sm:text-4xl font-semibold tracking-tight text-white";
export const wolfMetricLabelClass =
  "text-[11px] font-medium uppercase tracking-[0.14em] text-white/45";

export function WolfStatusPill({
  status,
  className,
}: {
  status: WolfOperationalStatus;
  className?: string;
}) {
  const isAttention = status === "attention";
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em]",
        isAttention
          ? "border border-amber-400/35 bg-amber-500/15 text-amber-200"
          : "border border-emerald-400/30 bg-emerald-500/12 text-emerald-200",
        className,
      )}
    >
      {isAttention ? "Attention" : "Normal"}
    </span>
  );
}
