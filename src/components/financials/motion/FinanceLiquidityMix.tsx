"use client";

import { motion } from "framer-motion";

import {
  FINANCE_SECTION_STACK_S,
  financeSectionDelaySec,
  isFinanceAgeingOverdueBucket,
} from "@/components/dashboard-framework/motion/finance-intro-schedule";
import { useLivingMotionEnabled } from "@/components/dashboard-framework/motion/living-motion";
import { cn } from "@/lib/utils";

const SEGMENT_COLORS = ["#34d399", "#38bdf8", "#fbbf24"] as const;

type Segment = { name: string; value: number };

export function FinanceLiquidityMix({
  segments,
  playIntro,
  visitKey,
  formatCompact,
}: {
  segments: Segment[];
  playIntro: boolean;
  visitKey: number;
  formatCompact: (amount: number) => string;
}) {
  const motionEnabled = useLivingMotionEnabled();
  const total = segments.reduce((sum, row) => sum + row.value, 0);
  if (total <= 0) return null;

  const reveal = !motionEnabled || playIntro;

  return (
    <div key={visitKey} className="space-y-4" data-finance-motion="liquidity-stack">
      <div className="flex h-4 w-full overflow-hidden rounded-full border border-white/10 bg-white/[0.04]">
        {segments.map((row, index) => {
          const widthPct = (row.value / total) * 100;
          return (
            <motion.div
              key={row.name}
              data-living-finance-liquidity={index}
              data-finance-final-value={formatCompact(row.value)}
              className="h-full min-w-0"
              title={`${row.name}: ${formatCompact(row.value)}`}
              initial={false}
              animate={{ width: reveal ? `${widthPct}%` : "0%" }}
              transition={
                playIntro && motionEnabled
                  ? {
                      duration: FINANCE_SECTION_STACK_S,
                      delay: financeSectionDelaySec("liquidity-segment", index),
                      ease: [0.22, 1, 0.36, 1],
                    }
                  : { duration: 0 }
              }
              style={{ background: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
            />
          );
        })}
      </div>
      <ul className="space-y-1.5">
        {segments.map((row, index) => (
          <li key={row.name} className="flex items-center justify-between text-xs text-white/70">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: SEGMENT_COLORS[index % SEGMENT_COLORS.length] }}
              />
              {row.name}
            </span>
            <span className="tabular-nums text-white" data-finance-final-value={formatCompact(row.value)}>
              {formatCompact(row.value)}
            </span>
          </li>
        ))}
      </ul>
      <p className="text-[10px] text-white/35">
        Cash funds operations; receivables convert to cash; payables are settled from liquidity.
      </p>
    </div>
  );
}

export function FinanceAgeingBucketBars({
  buckets,
  playIntro,
  visitKey,
  formatMoney,
}: {
  buckets: Array<{ bucket: string; amount: number }>;
  playIntro: boolean;
  visitKey: number;
  formatMoney: (amount: number) => string;
}) {
  const motionEnabled = useLivingMotionEnabled();
  const max = Math.max(1, ...buckets.map((b) => b.amount));
  const reveal = !motionEnabled || playIntro;

  return (
    <div key={visitKey} className="space-y-2.5" data-finance-motion="ageing-buckets">
      {buckets.map((row, index) => {
        const overdue = isFinanceAgeingOverdueBucket(row.bucket);
        const widthPct = (row.amount / max) * 100;
        return (
          <div key={row.bucket}>
            <div className="mb-1 flex justify-between text-[11px] text-white/55">
              <span className={cn(overdue && "text-rose-200/90")}>{row.bucket}</span>
              <span
                className={cn("tabular-nums", overdue ? "text-rose-100" : "text-white/80")}
                data-finance-final-value={formatMoney(row.amount)}
              >
                {formatMoney(row.amount)}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
              <motion.div
                data-living-finance-ageing={index}
                className={cn(
                  "h-full rounded-full",
                  overdue ? "bg-rose-400/85" : "bg-sky-400/80",
                )}
                initial={false}
                animate={{ width: reveal ? `${widthPct}%` : "0%" }}
                transition={
                  playIntro && motionEnabled
                    ? {
                        duration: FINANCE_SECTION_STACK_S,
                        delay: financeSectionDelaySec("ageing-bucket", index),
                        ease: [0.22, 1, 0.36, 1],
                      }
                    : { duration: 0 }
                }
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
