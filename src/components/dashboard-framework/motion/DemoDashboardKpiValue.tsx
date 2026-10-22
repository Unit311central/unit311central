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
import { useIntroAnimationLock, useLivingMotionEnabled } from "./living-motion";

type Props = {
  value: string | number;
  /** When set, count up this number and format with `formatTarget` (or parsed display). */
  target?: number;
  formatTarget?: (n: number) => string;
  staggerIndex?: number;
  className?: string;
};

export function DemoDashboardKpiValue({
  value,
  target,
  formatTarget,
  staggerIndex = 0,
  className,
}: Props) {
  const motionEnabled = useLivingMotionEnabled();
  const armed = useDemoDashboardMotionArmed();
  const introPending = useDemoDashboardIntroPending();
  const ctx = useDemoDashboardMotionContext();
  const visitKey = ctx?.visitKey ?? 0;
  const parsed = useMemo(() => parseDemoMetricValue(value), [value]);
  const numericTarget = target ?? parsed.numeric;
  const formatFinal = useMemo(() => {
    if (formatTarget && numericTarget != null) {
      return (n: number) => formatTarget(n);
    }
    if (parsed.numeric != null) {
      return (n: number) => formatDemoMetricValue(parsed, n);
    }
    return () => String(value);
  }, [formatTarget, numericTarget, parsed, value]);

  const countUpActive = useIntroAnimationLock(
    introPending,
    armed && motionEnabled && numericTarget != null,
    visitKey,
  );

  const [display, setDisplay] = useState(() => String(value));
  const ranForVisit = useRef(-1);

  useEffect(() => {
    if (!armed || !motionEnabled || numericTarget == null) {
      setDisplay(formatFinal(numericTarget ?? 0));
      return;
    }

    if (!countUpActive) {
      if (ranForVisit.current === visitKey) return;
      setDisplay(formatFinal(numericTarget));
      return;
    }

    if (ranForVisit.current === visitKey) return;

    const to = numericTarget;
    const delayMs = Math.min(450, staggerIndex * 75);
    const duration = Math.min(1100, DEMO_DASHBOARD_INTRO_MS - 500);
    let frame = 0;
    let delayTimer = 0;

    setDisplay(formatFinal(0));

    const run = () => {
      const start = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - (1 - t) ** 3;
        const current = to * eased;
        setDisplay(formatFinal(current));
        if (t < 1) {
          frame = requestAnimationFrame(tick);
        } else {
          setDisplay(formatFinal(to));
          ranForVisit.current = visitKey;
        }
      };
      frame = requestAnimationFrame(tick);
    };

    delayTimer = window.setTimeout(run, delayMs);

    return () => {
      window.clearTimeout(delayTimer);
      cancelAnimationFrame(frame);
    };
  }, [
    armed,
    motionEnabled,
    countUpActive,
    numericTarget,
    formatFinal,
    staggerIndex,
    visitKey,
    value,
  ]);

  return (
    <span className={className} data-demo-dashboard-kpi>
      {display}
    </span>
  );
}
