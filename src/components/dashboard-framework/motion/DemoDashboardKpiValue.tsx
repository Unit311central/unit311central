"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  formatDemoMetricValue,
  parseDemoMetricValue,
} from "@/lib/dashboard-framework/demo-metric-parse";

import { useDemoDashboardMotionContext } from "./demo-dashboard-motion-context";
import {
  DEMO_DASHBOARD_INTRO_MS,
  useDemoDashboardIntroPending,
  useDemoDashboardMotionArmed,
} from "./demo-dashboard-motion";
import { useLivingMotionEnabled } from "./living-motion";

type Props = {
  value: string | number;
  staggerIndex?: number;
  className?: string;
};

export function DemoDashboardKpiValue({ value, staggerIndex = 0, className }: Props) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useDemoDashboardMotionArmed();
  const introPending = useDemoDashboardIntroPending();
  const ctx = useDemoDashboardMotionContext();
  const parsed = useMemo(() => parseDemoMetricValue(value), [value]);
  const visitKey = ctx?.visitKey ?? 0;

  const shouldAnimate =
    armed && motionEnabled && introPending && parsed.numeric != null && Number.isFinite(parsed.numeric);

  const [display, setDisplay] = useState(() =>
    shouldAnimate ? formatDemoMetricValue(parsed, 0) : String(value),
  );
  const prevTarget = useRef(parsed.numeric);

  useEffect(() => {
    if (!armed || !motionEnabled) {
      setDisplay(String(value));
      return;
    }

    if (!introPending) {
      if (parsed.numeric != null) {
        setDisplay(formatDemoMetricValue(parsed, parsed.numeric));
      } else {
        setDisplay(String(value));
      }
      prevTarget.current = parsed.numeric;
      return;
    }

    if (parsed.numeric == null) {
      setDisplay(String(value));
      return;
    }

    const target = parsed.numeric;
    const from = 0;
    const delayMs = Math.min(400, staggerIndex * 70);
    const duration = Math.min(900, DEMO_DASHBOARD_INTRO_MS - 400);
    let frame = 0;
    let delayTimer = 0;

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        const current = from + (target - from) * eased;
        setDisplay(formatDemoMetricValue(parsed, current));
        if (t < 1) frame = requestAnimationFrame(tick);
        else setDisplay(formatDemoMetricValue(parsed, target));
      };
      frame = requestAnimationFrame(tick);
    };

    setDisplay(formatDemoMetricValue(parsed, 0));
    delayTimer = window.setTimeout(run, delayMs);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(frame);
    };
  }, [value, parsed, armed, motionEnabled, introPending, staggerIndex, visitKey]);

  return (
    <span className={className} data-demo-dashboard-kpi>
      {display}
    </span>
  );
}
