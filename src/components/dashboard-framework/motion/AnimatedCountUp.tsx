"use client";

import { useEffect, useRef, useState } from "react";

import { LIVING_COUNT_UP_MS, useLivingMotionEnabled } from "./living-motion";

type AnimatedCountUpProps = {
  target: number;
  format: (value: number) => string;
  suffix?: string;
  className?: string;
  onComplete?: () => void;
};

export function AnimatedCountUp({
  target,
  format,
  suffix = "",
  className,
  onComplete,
}: AnimatedCountUpProps) {
  const motionEnabled = useLivingMotionEnabled();
  const [display, setDisplay] = useState(() => (motionEnabled ? format(0) : format(target)));
  const prevTarget = useRef(target);

  useEffect(() => {
    if (!motionEnabled) {
      setDisplay(format(target) + suffix);
      return;
    }

    const from = prevTarget.current === target ? 0 : prevTarget.current;
    prevTarget.current = target;
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
        onComplete?.();
      }
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, format, suffix, motionEnabled, onComplete]);

  return <span className={className}>{display}</span>;
}
