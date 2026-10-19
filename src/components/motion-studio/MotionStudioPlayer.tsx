"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  PLAYBACK_TICK_MS,
  activeScene,
  advancePlaybackTime,
  elementMotionProgress,
  formatMotionClock,
  isElementRevealed,
  pipelineActiveIndex,
  restartPlayback,
  togglePlayPause,
} from "@/lib/motion-studio/playback";
import type { MotionElement, MotionScene, MotionStudioPreviewPayload } from "@/lib/motion-studio/types";

type ElementViewProps = {
  element: MotionElement;
  scene: MotionScene;
  elementIndex: number;
  timeMs: number;
  reducedMotion: boolean;
};

function ElementView({ element, scene, elementIndex, timeMs, reducedMotion }: ElementViewProps) {
  const revealed = isElementRevealed(scene, elementIndex, timeMs, reducedMotion);
  const progress = elementMotionProgress(scene, elementIndex, timeMs, reducedMotion);
  const opacity = revealed ? Math.max(0.15, progress) : 0;
  const y = reducedMotion ? 0 : (1 - progress) * 18;
  const scale = reducedMotion ? 1 : 0.96 + progress * 0.04;

  const motionProps = {
    initial: false as const,
    animate: { opacity, y, scale },
    transition: reducedMotion ? { duration: 0 } : { type: "spring" as const, stiffness: 320, damping: 28 },
  };

  switch (element.type) {
    case "title":
      return (
        <motion.div {...motionProps} className="space-y-1">
          <h3 className="font-display text-xl font-semibold text-white md:text-2xl">{element.text}</h3>
          {element.subtitle ? (
            <p className="text-sm text-cyan-100/75">{element.subtitle}</p>
          ) : null}
        </motion.div>
      );
    case "caption":
      return (
        <motion.p
          {...motionProps}
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
          {...motionProps}
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
        <motion.div
          {...motionProps}
          className="rounded-lg border border-white/10 bg-black/20 px-4 py-3"
        >
          <p className="text-xs uppercase tracking-wide text-white/50">{element.label}</p>
          <p className="text-base font-medium text-white">{element.value}</p>
          {element.meta ? <p className="text-xs text-white/60">{element.meta}</p> : null}
        </motion.div>
      );
    case "pipeline": {
      const activeIndex = pipelineActiveIndex(element, scene, timeMs, reducedMotion);
      return (
        <motion.div {...motionProps} className="space-y-2">
          {element.valueLabel ? (
            <motion.p
              key={element.valueLabel}
              initial={false}
              animate={{ opacity: 1, scale: 1 }}
              className="text-sm font-medium text-cyan-200"
            >
              {element.valueLabel}
            </motion.p>
          ) : null}
          <div className="flex flex-wrap gap-1">
            {element.stages.map((stage, i) => (
              <motion.div
                key={stage}
                layout={!reducedMotion}
                animate={
                  reducedMotion
                    ? {}
                    : {
                        scale: i === activeIndex ? 1.05 : 1,
                      }
                }
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors duration-300 ${
                  i === activeIndex
                    ? "bg-cyan-400 text-slate-950 shadow-[0_0_12px_rgba(34,211,238,0.45)]"
                    : i < activeIndex
                      ? "bg-white/20 text-white/90"
                      : "bg-white/5 text-white/50"
                }`}
              >
                {stage}
              </motion.div>
            ))}
          </div>
          {!reducedMotion ? (
            <motion.div
              className="h-1 overflow-hidden rounded-full bg-white/10"
              initial={false}
            >
              <motion.div
                className="h-full bg-cyan-400/80"
                animate={{
                  width: `${((activeIndex + 1) / element.stages.length) * 100}%`,
                }}
                transition={{ type: "spring", stiffness: 120, damping: 20 }}
              />
            </motion.div>
          ) : null}
        </motion.div>
      );
    }
    case "metric":
      return (
        <motion.div
          {...motionProps}
          className="inline-flex flex-col rounded-xl bg-white/10 px-4 py-3"
        >
          <span className="text-xs uppercase tracking-wide text-white/60">{element.label}</span>
          <span className="text-2xl font-semibold tabular-nums text-white">{element.value}</span>
          {element.hint ? <span className="text-xs text-white/55">{element.hint}</span> : null}
        </motion.div>
      );
    case "arrow":
      return (
        <motion.div
          {...motionProps}
          animate={{
            opacity,
            y: reducedMotion ? 0 : y + Math.sin(timeMs / 280) * 3,
          }}
          className="flex items-center justify-center py-1 text-cyan-300/80"
        >
          <span className="text-2xl">↓</span>
          {element.label ? <span className="ml-2 text-xs">{element.label}</span> : null}
        </motion.div>
      );
    case "workflow_link":
      return (
        <motion.div
          {...motionProps}
          className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-white/20 px-3 py-2 text-sm text-white/85"
        >
          <span className="rounded-md bg-white/10 px-2 py-1">{element.from}</span>
          <motion.span
            animate={reducedMotion ? {} : { x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            className="text-white/40"
          >
            →
          </motion.span>
          <span className="rounded-md bg-white/10 px-2 py-1">{element.to}</span>
          {element.note ? <span className="text-xs text-white/50">({element.note})</span> : null}
        </motion.div>
      );
    default:
      return null;
  }
}

export type MotionStudioPlayerProps = {
  payload: MotionStudioPreviewPayload;
  /** When true, playback starts on mount (modal open). */
  autoPlay?: boolean;
  /** Compact chrome for chat summary; full chrome for modal. */
  variant?: "compact" | "full";
  /** Exposed for tests — stable hook on canvas region. */
  dataTestId?: string;
};

export function MotionStudioPlayer({
  payload,
  autoPlay = false,
  variant = "full",
  dataTestId = "motion-studio-player",
}: MotionStudioPlayerProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [timeMs, setTimeMs] = useState(0);
  const [playing, setPlaying] = useState(autoPlay);

  const scene = useMemo(() => activeScene(payload, timeMs), [payload, timeMs]);

  const tick = useCallback(() => {
    setTimeMs((t) => {
      const { timeMs: next, reachedEnd } = advancePlaybackTime(t, payload.durationMs, PLAYBACK_TICK_MS);
      if (reachedEnd) setPlaying(false);
      return next;
    });
  }, [payload.durationMs]);

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(tick, PLAYBACK_TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, tick]);

  useEffect(() => {
    if (autoPlay) {
      setPlaying(true);
      setTimeMs(0);
    }
  }, [autoPlay, payload.id]);

  const progress = payload.durationMs > 0 ? (timeMs / payload.durationMs) * 100 : 0;
  const isCompact = variant === "compact";

  return (
    <div
      className={
        isCompact
          ? "space-y-3"
          : "flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 sm:p-5"
      }
      data-testid={dataTestId}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          {isCompact ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300/80">
              Motion Studio
            </p>
          ) : null}
          {!isCompact ? (
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-cyan-300/80">
              {payload.fictional ? "Illustrative demo animation" : "Animation"}
            </p>
          ) : null}
          {isCompact ? (
            <h4 className="font-display text-base text-white">{payload.title}</h4>
          ) : null}
          <p className="text-xs text-white/55" data-testid="motion-studio-clock">
            {formatMotionClock(timeMs)} / {formatMotionClock(payload.durationMs)}
            {reducedMotion ? " · Reduced motion" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="motion-studio-play-pause"
            className="rounded-full bg-cyan-400 px-3 py-1.5 text-xs font-semibold text-slate-950 hover:bg-cyan-300"
            onClick={() => {
              const next = togglePlayPause(playing, timeMs, payload.durationMs);
              setPlaying(next.playing);
              setTimeMs(next.timeMs);
            }}
          >
            {playing ? "Pause" : timeMs >= payload.durationMs ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            data-testid="motion-studio-restart"
            className="rounded-full border border-white/20 px-3 py-1.5 text-xs text-white/85 hover:bg-white/10"
            onClick={() => {
              const next = restartPlayback();
              setTimeMs(next.timeMs);
              setPlaying(next.playing);
            }}
          >
            Restart
          </button>
        </div>
      </div>

      <div
        className={`relative w-full overflow-hidden rounded-xl border border-white/10 bg-black/30 ${
          isCompact ? "aspect-video" : "aspect-video shrink-0"
        }`}
        role="region"
        aria-label="Animation canvas"
        data-testid="motion-studio-canvas"
        data-scene-id={scene?.id ?? ""}
        data-playing={playing ? "true" : "false"}
        data-time-ms={Math.floor(timeMs)}
      >
        <AnimatePresence mode="wait">
          {scene ? (
            <motion.div
              key={scene.id}
              initial={reducedMotion ? false : { opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, x: -24 }}
              transition={{ duration: reducedMotion ? 0 : 0.45 }}
              className="absolute inset-0 flex flex-col justify-center gap-3 p-4 md:p-8"
            >
              {scene.elements.map((el, i) => (
                <ElementView
                  key={`${scene.id}-${i}`}
                  element={el}
                  scene={scene}
                  elementIndex={i}
                  timeMs={timeMs}
                  reducedMotion={reducedMotion}
                />
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
        data-testid="motion-studio-timeline"
        onChange={(e) => {
          setPlaying(false);
          setTimeMs(Number(e.target.value));
        }}
        aria-label="Timeline"
      />

      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        aria-hidden
        data-testid="motion-studio-progress"
        data-progress={Math.round(progress)}
      >
        <div className="h-full bg-cyan-400/70 transition-[width] duration-75" style={{ width: `${progress}%` }} />
      </div>

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
                  {formatMotionClock(s.startMs)}–{formatMotionClock(s.endMs)}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
