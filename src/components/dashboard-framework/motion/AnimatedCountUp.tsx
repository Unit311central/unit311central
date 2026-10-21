"use client";

import { useEffect, useRef, useState } from "react";

import type { HomeIntroLane } from "./home-intro-schedule";
import {
  LIVING_COUNT_UP_MS,
  homeHeroDelayMs,
  homeSectionDelayMs,
  useHomeLivingIntroPending,
  useLivingMotionEnabled,
} from "./living-motion";
import { useLivingHomeVisitKey } from "./living-motion-context";

type AnimatedCountUpProps = {
  target: number;
  format: (value: number) => string;
  suffix?: string;
  className?: string;
  /** Stagger lane for coordinated Home intro (default immediate when not in intro). */
  lane?: HomeIntroLane;
  laneIndex?: number;
  durationMs?: number;
  /** When set, overrides hero intro for viewport-section count-ups. */
  sectionIntroActive?: boolean;
  /** Exposed for acceptance tests */
  "data-living-count-up"?: string;
};

export function AnimatedCountUp({
  target,
  format,
  suffix = "",
  className,
  lane = "kpi",
  laneIndex = 0,
  durationMs = LIVING_COUNT_UP_MS,
  sectionIntroActive,
  "data-living-count-up": dataLivingCountUp,
}: AnimatedCountUpProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending: heroIntroPending } = useHomeLivingIntroPending();
  const visitKey = useLivingHomeVisitKey();
  const isHeroLane = lane === "ai-metric" || lane === "kpi";
  const introPending =
    sectionIntroActive !== undefined
      ? sectionIntroActive
      : isHeroLane
        ? heroIntroPending
        : false;
  const shouldAnimateFromZero = motionEnabled && introPending;

  const [display, setDisplay] = useState(() =>
    shouldAnimateFromZero ? format(0) + suffix : format(target) + suffix,
  );
  const prevTarget = useRef(target);

  useEffect(() => {
    if (motionEnabled && introPending) {
      setDisplay(format(0) + suffix);
    }
  }, [visitKey, lane, laneIndex, format, suffix, motionEnabled, introPending]);

  useEffect(() => {
    if (!motionEnabled) {
      setDisplay(format(target) + suffix);
      return;
    }

    if (!introPending && prevTarget.current === target) {
      setDisplay(format(target) + suffix);
      return;
    }

    const from = introPending ? 0 : prevTarget.current === target ? target : prevTarget.current;
    prevTarget.current = target;

    if (from === target && !introPending) {
      setDisplay(format(target) + suffix);
      return;
    }

    const delayMs = introPending
      ? isHeroLane
        ? homeHeroDelayMs(lane as "ai-metric" | "kpi", laneIndex)
        : homeSectionDelayMs(lane, laneIndex)
      : 0;
    const duration = introPending
      ? isHeroLane
        ? durationMs
        : Math.max(1500, durationMs - 400)
      : Math.min(600, durationMs);
    let frame = 0;
    let delayTimer = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        const value = from + (target - from) * eased;
        setDisplay(format(value) + suffix);
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplay(format(target) + suffix);
        }
      };
      frame = requestAnimationFrame(tick);
    };

    if (delayMs > 0) {
      delayTimer = window.setTimeout(run, delayMs);
    } else {
      run();
    }

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(frame);
    };
  }, [target, format, suffix, motionEnabled, introPending, lane, laneIndex, durationMs, visitKey]);

  return (
    <span className={className} data-living-count-up={dataLivingCountUp}>
      {display}
    </span>
  );
}
