"use client";

import { Play } from "lucide-react";

import { useLivingHomeReplayIntro } from "./living-motion-context";
import { useLivingMotionEnabled } from "./living-motion";
import { cn } from "@/lib/utils";

export function HomeLivingReplayControl({ className }: { className?: string }) {
  const motionEnabled = useLivingMotionEnabled();
  const replayIntro = useLivingHomeReplayIntro();

  if (!motionEnabled) return null;

  return (
    <button
      type="button"
      data-qa-target="home-living-replay"
      onClick={replayIntro}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-white/[0.04] px-2.5 py-1.5 text-[11px] font-semibold text-white/75 transition-colors hover:border-sky-400/35 hover:bg-sky-500/10 hover:text-sky-100",
        className,
      )}
    >
      <Play className="h-3 w-3 fill-current" aria-hidden />
      Replay dashboard story
    </button>
  );
}
