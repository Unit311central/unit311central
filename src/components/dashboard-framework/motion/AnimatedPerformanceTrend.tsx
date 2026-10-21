"use client";

import { motion } from "framer-motion";

import { HOME_INTRO_LINE_DRAW_S, homeIntroDelaySec } from "./home-intro-schedule";
import { useHomeLivingIntroPending, useIntroAnimationLock, useLivingMotionEnabled } from "./living-motion";

type AnimatedPerformanceTrendProps = {
  values: readonly number[];
  stroke?: string;
  className?: string;
};

function buildTrendPath(values: readonly number[], width: number, height: number): string {
  if (values.length === 0) return "";
  const max = Math.max(1, ...values);
  const step = values.length > 1 ? width / (values.length - 1) : 0;
  const points = values.map((value, index) => {
    const x = index * step;
    const y = height - (value / max) * (height - 4) - 2;
    return [x, y] as const;
  });
  return points.map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`).join(" ");
}

export function AnimatedPerformanceTrend({
  values,
  stroke = "var(--platform-accent, #2F80ED)",
  className,
}: AnimatedPerformanceTrendProps) {
  const motionEnabled = useLivingMotionEnabled();
  const { introPending } = useHomeLivingIntroPending();
  const playIntro = useIntroAnimationLock(introPending, motionEnabled);
  const width = 320;
  const height = 72;
  const path = buildTrendPath(values, width, height);

  if (!path) return null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="home-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {playIntro ? (
        <motion.path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#home-trend-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: homeIntroDelaySec("chart-line", 0), duration: 0.35 }}
        />
      ) : (
        <path d={`${path} L ${width} ${height} L 0 ${height} Z`} fill="url(#home-trend-fill)" />
      )}
      <motion.path
        d={path}
        fill="none"
        stroke={stroke}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={playIntro ? { pathLength: 0, opacity: 0.4 } : false}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={
          playIntro
            ? {
                pathLength: {
                  duration: HOME_INTRO_LINE_DRAW_S,
                  delay: homeIntroDelaySec("chart-line", 0),
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: 0.25, delay: homeIntroDelaySec("chart-line", 0) },
              }
            : { duration: 0 }
        }
      />
    </svg>
  );
}
