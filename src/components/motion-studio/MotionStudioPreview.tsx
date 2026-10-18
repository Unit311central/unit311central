"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MotionElement, MotionScene, MotionStudioPreviewPayload } from "@/lib/motion-studio/types";

function formatClock(ms: number): string {
  const s = Math.max(0, ms / 1000);
  return `${s.toFixed(1)}s`;
}

function ElementView({ element, visible }: { element: MotionElement; visible: boolean }) {
  const common = visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 };
  switch (element.type) {
    case "title":
      return (
        <motion.div animate={common} className="space-y-1">
          <h3 className="font-display text-xl font-semibold text-white md:text-2xl">{element.text}</h3>
          {element.subtitle ? (
            <p className="text-sm text-cyan-100/75">{element.subtitle}</p>
          ) : null}
        </motion.div>
      );
    case "caption":
      return (
        <motion.p
          animate={common}
          className={`text-xs uppercase tracking-wide ${
            element.emphasis === "demo" ? "text-amber-200/90" : "text-white/60"
          }`}
        >
          {element.text}
        </motion.p>
      );
    case "card":
      return (
        <motion.div
          animate={common}
          className={`rounded-xl border px-4 py-3 ${
            element.tone === "success"
              ? "border-emerald-400/40 bg-emerald-500/10"
              : element.tone === "accent"
                ? "border-cyan-400/35 bg-cyan-500/10"
                : "border-white/15 bg-white/5"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-white">{element.title}</p>
            {element.badge ? (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/80">
                {element.badge}
              </span>
            ) : null}
          </div>
          {element.body ? <p className="mt-1 text-sm text-white/75">{element.body}</p> : null}
        </motion.div>
      );
    case "entity_row":
      return (
        <motion.div animate={common} className="rounded-lg border border-white/10 bg-black/20 px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-white/50">{element.label}</p>
          <p className="text-base font-medium text-white">{element.value}</p>
          {element.meta ? <p className="text-xs text-white/60">{element.meta}</p> : null}
        </motion.div>
      );
    case "pipeline":
      return (
        <motion.div animate={common} className="space-y-2">
          {element.valueLabel ? (
            <p className="text-sm font-medium text-cyan-200">{element.valueLabel}</p>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {element.stages.map((stage, i) => (
              <div
                key={stage}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                  i === element.activeIndex
                    ? "bg-cyan-400 text-slate-950"
                    : i < element.activeIndex
                      ? "bg-white/20 text-white/90"
                      : "bg-white/5 text-white/50"
                }`}
              >
                {stage}
              </div>
            ))}
          </div>
        </motion.div>
      );
    case "metric":
      return (
        <motion.div animate={common} className="inline-flex flex-col rounded-xl bg-white/10 px-4 py-3">
          <span className="text-xs uppercase tracking-wide text-white/60">{element.label}</span>
          <span className="text-2xl font-semibold tabular-nums text-white">{element.value}</span>
          {element.hint ? <span className="text-xs text-white/55">{element.hint}</span> : null}
        </motion.div>
      );
    case "arrow":
      return (
        <motion.div animate={common} className="flex items-center justify-center py-1 text-cyan-300/80">
          <span className="text-2xl">↓</span>
          {element.label ? <span className="ml-2 text-xs">{element.label}</span> : null}
        </motion.div>
      );
    case "workflow_link":
      return (
        <motion.div
          animate={common}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-sm text-white/85"
        >
          <span className="rounded-md bg-white/10 px-2 py-1">{element.from}</span>
          <span className="text-white/40">→</span>
          <span className="rounded-md bg-white/10 px-2 py-1">{element.to}</span>
          {element.note ? <span className="text-xs text-white/50">({element.note})</span> : null}
        </motion.div>
      );
    default:
      return null;
  }
}

function activeScene(spec: MotionStudioPreviewPayload, timeMs: number): MotionScene | null {
  return (
    spec.scenes.find((s) => timeMs >= s.startMs && timeMs < s.endMs) ??
    spec.scenes[spec.scenes.length - 1] ??
    null
  );
}

type Props = {
  payload: MotionStudioPreviewPayload;
  onSeek?: (ms: number) => void;
};

export function MotionStudioPreview({ payload }: Props) {
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const scene = useMemo(() => activeScene(payload, timeMs), [payload, timeMs]);

  const tick = useCallback(() => {
    setTimeMs((t) => {
      if (t >= payload.durationMs) {
        setPlaying(false);
        return payload.durationMs;
      }
      return Math.min(payload.durationMs, t + 50);
    });
  }, [payload.durationMs]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [playing, tick]);

  const progress = payload.durationMs > 0 ? (timeMs / payload.durationMs) * 100 : 0;

  return (
    <div className="mt-3 space-y-3 rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950/40 p-4 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300/80">
            Motion Studio
          </p>
          <h4 className="font-display text-lg text-white">{payload.title}</h4>
          <p className="text-xs text-white/55">
            {formatClock(timeMs)} / {formatClock(payload.durationMs)} · 16:9 preview
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
            onClick={() => {
              if (!playing && timeMs >= payload.durationMs) {
                setTimeMs(0);
              }
              setPlaying((p) => !p);
            }}
          >
            {playing ? "Pause" : timeMs >= payload.durationMs ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
            onClick={() => {
              setTimeMs(0);
              setPlaying(true);
            }}
          >
            Restart
          </button>
        </div>
      </div>

      <div
        className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/30"
        role="region"
        aria-label="Animation preview"
      >
        <AnimatePresence mode="wait">
          {scene ? (
            <motion.div
              key={scene.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="absolute inset-0 flex flex-col justify-center gap-3 p-4 md:p-8"
            >
              {scene.elements.map((el, i) => (
                <ElementView key={`${scene.id}-${i}`} element={el} visible />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      <input
        type="range"
        min={0}
        max={payload.durationMs}
        value={timeMs}
        className="w-full accent-cyan-400"
        onChange={(e) => {
          setPlaying(false);
          setTimeMs(Number(e.target.value));
        }}
        aria-label="Timeline"
      />

      <ol className="grid gap-1 text-xs text-white/70 md:grid-cols-2">
        {payload.scenes.map((s) => {
          const active = scene?.id === s.id;
          return (
            <li key={s.id}>
              <button
                type="button"
                className={`w-full rounded-lg px-2 py-1.5 text-left transition ${
                  active ? "bg-cyan-500/20 text-cyan-100" : "hover:bg-white/5"
                }`}
                onClick={() => {
                  setPlaying(false);
                  setTimeMs(s.startMs);
                }}
              >
                <span className="font-medium">{s.title}</span>
                <span className="ml-2 tabular-nums text-white/45">
                  {formatClock(s.startMs)}–{formatClock(s.endMs)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
