"use client";

import { useEffect, useRef, useState } from "react";

import type { HomeIntroLane } from "./home-intro-schedule";
import {
  LIVING_COUNT_UP_MS,
  homeIntroDelayMs,
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
  "data-living-count-up": dataLivingCountUp,
}: AnimatedCountUpProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending } = useHomeLivingIntroPending();
  const visitKey = useLivingHomeVisitKey();
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

    const delayMs = introPending ? homeIntroDelayMs(lane, laneIndex) : 0;
    const duration = introPending ? durationMs : Math.min(600, durationMs);
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
