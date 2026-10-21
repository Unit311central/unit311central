"use client";

import { motion } from "framer-motion";

import { HOME_SECTION_LINE_DRAW_S, homeSectionDelaySec } from "./home-intro-schedule";

type AnimatedPerformanceTrendProps = {
  values: readonly number[];
  stroke?: string;
  className?: string;
  playIntro: boolean;
  enteredView: boolean;
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
  playIntro,
  enteredView,
}: AnimatedPerformanceTrendProps) {
  const draw = playIntro && enteredView;
  const width = 320;
  const height = 72;
  const path = buildTrendPath(values, width, height);

  if (!path) return null;

  const lineDelay = homeSectionDelaySec("chart-line", 0);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
      preserveAspectRatio="none"
      data-living-trend-chart
    >
      <defs>
        <linearGradient id="home-trend-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {draw ? (
        <motion.path
          d={`${path} L ${width} ${height} L 0 ${height} Z`}
          fill="url(#home-trend-fill)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: lineDelay, duration: 0.35 }}
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
        initial={draw ? { pathLength: 0, opacity: 0.45 } : enteredView ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: enteredView ? 1 : 0, opacity: enteredView ? 1 : 0 }}
        transition={
          draw
            ? {
                pathLength: {
                  duration: HOME_SECTION_LINE_DRAW_S,
                  delay: lineDelay,
                  ease: [0.22, 1, 0.36, 1],
                },
                opacity: { duration: 0.25, delay: lineDelay },
              }
            : { duration: 0 }
        }
      />
    </svg>
  );
}
