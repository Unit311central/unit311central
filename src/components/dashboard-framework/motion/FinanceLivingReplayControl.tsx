"use client";

import { Play } from "lucide-react";

import { useFinanceReplayIntro } from "./finance-living-motion-context";
import { useLivingMotionEnabled } from "./living-motion";
import { cn } from "@/lib/utils";

export function FinanceLivingReplayControl({ className }: { className?: string }) {
  const motionEnabled = useLivingMotionEnabled();
  const replayIntro = useFinanceReplayIntro();

  if (!motionEnabled) return null;

  return (
    <button
      type="button"
      data-qa-target="finance-living-replay"
      onClick={replayIntro}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:border-sky-400/35 hover:bg-sky-500/10 hover:text-sky-100",
        className,
      )}
    >
      <Play className="h-3.5 w-3.5 fill-current" aria-hidden />
      Replay financial story
    </button>
  );
}
