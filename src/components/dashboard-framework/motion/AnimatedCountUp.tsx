"use client";

import { useEffect, useRef, useState } from "react";

import { LIVING_COUNT_UP_MS, useHomeLivingIntroPending, useLivingMotionEnabled } from "./living-motion";

type AnimatedCountUpProps = {
  target: number;
  format: (value: number) => string;
  suffix?: string;
  className?: string;
};

export function AnimatedCountUp({ target, format, suffix = "", className }: AnimatedCountUpProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending } = useHomeLivingIntroPending();
  const shouldAnimateFromZero = motionEnabled && introPending;

  const [display, setDisplay] = useState(() =>
    shouldAnimateFromZero ? format(0) + suffix : format(target) + suffix,
  );
  const prevTarget = useRef(target);

  useEffect(() => {
    if (!motionEnabled) {
      setDisplay(format(target) + suffix);
      return;
    }

    if (!introPending && prevTarget.current === target) {
      setDisplay(format(target) + suffix);
      return;
    }

    const from =
      introPending
        ? 0
        : prevTarget.current === target
          ? target
          : prevTarget.current;
    prevTarget.current = target;

    if (from === target) {
      setDisplay(format(target) + suffix);
      return;
    }

    const start = performance.now();
    const duration = LIVING_COUNT_UP_MS;
    let frame = 0;

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
    return () => cancelAnimationFrame(frame);
  }, [target, format, suffix, motionEnabled, introPending]);

  return <span className={className}>{display}</span>;
}
