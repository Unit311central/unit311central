"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

import { ABHI_BOARD_PACK_STAGES } from "@/lib/abhi/board-pack-stages";
import { OA_BOARD_PACK_STAGES } from "@/lib/onwardair/board-pack-stages";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import { cn } from "@/lib/utils";

const TOTAL_MS = 10_500;

type Props = {
  active: boolean;
  complete?: boolean;
};

export default function AbhiBoardPackProgress({ active, complete }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const isOa =
    typeof window !== "undefined" ? isBrowserOnwardAirSurface() : false;
  const STAGES = isOa ? OA_BOARD_PACK_STAGES : ABHI_BOARD_PACK_STAGES;

  useEffect(() => {
    if (!active || complete) return;
    setElapsed(0);
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Date.now() - started);
    }, 120);
    return () => window.clearInterval(id);
  }, [active, complete]);

  const progressPct = useMemo(() => {
    if (complete) return 100;
    return Math.min(96, Math.round((elapsed / TOTAL_MS) * 100));
  }, [complete, elapsed]);

  const stageIndex = useMemo(() => {
    if (complete) return STAGES.length;
    const per = TOTAL_MS / STAGES.length;
    return Math.min(STAGES.length - 1, Math.floor(elapsed / per));
  }, [complete, elapsed]);

  if (!active && !complete) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-sky-400/25 bg-gradient-to-br from-[#0b1f3a] via-[#0e2748] to-[#0b1524] p-4 shadow-[0_16px_48px_rgba(0,0,0,0.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-sky-300/80">
            {isOa ? "OnwardAir Board Intelligence" : "Board Intelligence"}
          </p>
          <h3 className="mt-1 text-base font-semibold text-white">
            {complete
              ? isOa
                ? "Board Deck ready"
                : "Board Pack ready"
              : isOa
                ? "Generating Board Deck…"
                : "Generating Board Pack…"}
          </h3>
          <p className="mt-1 text-xs text-white/55">
            {isOa
              ? "Analysing programme systems and assembling the OnwardAir board deck."
              : "Analysing organisational systems and assembling the executive pack."}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/25 px-3 py-2 text-center">
          <p className="text-lg font-semibold tabular-nums text-sky-100">{progressPct}%</p>
          <p className="text-[9px] uppercase tracking-wide text-white/40">Complete</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${progressPct}%` }}
          transition={{ ease: "easeOut", duration: 0.25 }}
        />
      </div>

      <ul className="mt-4 space-y-1.5">
        {STAGES.map((stage, index) => {
          const done = complete || index < stageIndex;
          const running = !complete && index === stageIndex;
          return (
            <li
              key={stage.id}
              className={cn(
                "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors",
                done && "bg-emerald-500/10 text-emerald-100",
                running && "bg-sky-500/15 text-sky-50",
                !done && !running && "text-white/35",
              )}
            >
              {done ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
              ) : running ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-300" />
              ) : (
                <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-white/20" />
              )}
              <span>
                {done ? "✓ " : ""}
                {stage.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
