"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, RotateCcw } from "lucide-react";

import type { ProcedureAnimationSpec } from "@/lib/lms/procedure-animation-spec";
import { cn } from "@/lib/utils";

type LayoutPoint = { id: string; x: number; y: number };

const NODE_W = 148;
const NODE_H = 72;
const GAP_X = 56;
const GAP_Y = 88;

function computeLayout(
  spec: ProcedureAnimationSpec,
): { points: LayoutPoint[]; width: number; height: number } {
  const order = spec.playbackOrder ?? spec.nodes.map((n) => n.id);
  const byId = new Map(spec.nodes.map((n) => [n.id, n]));
  const points: LayoutPoint[] = [];

  if (spec.layout === "decision_tree") {
    let row = 0;
    let col = 0;
    const maxCols = 3;
    for (const id of order) {
      if (!byId.has(id)) continue;
      points.push({ id, x: 24 + col * (NODE_W + GAP_X), y: 24 + row * (NODE_H + GAP_Y) });
      col += 1;
      if (col >= maxCols) {
        col = 0;
        row += 1;
      }
    }
  } else {
    order.forEach((id, index) => {
      if (!byId.has(id)) return;
      points.push({
        id,
        x: 24 + index * (NODE_W + GAP_X),
        y: spec.layout === "pipeline" ? 48 : 32,
      });
    });
  }

  const maxX = points.reduce((m, p) => Math.max(m, p.x + NODE_W), NODE_W + 48);
  const maxY = points.reduce((m, p) => Math.max(m, p.y + NODE_H), NODE_H + 48);
  return { points, width: Math.max(320, maxX), height: Math.max(200, maxY) };
}

function edgePath(from: LayoutPoint, to: LayoutPoint): string {
  const x1 = from.x + NODE_W / 2;
  const y1 = from.y + NODE_H / 2;
  const x2 = to.x + NODE_W / 2;
  const y2 = to.y + NODE_H / 2;
  const midX = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
}

type Props = {
  spec: ProcedureAnimationSpec;
  className?: string;
  compact?: boolean;
  onFinished?: () => void;
};

export default function ProcedureAnimationPlayer({
  spec,
  className,
  compact,
  onFinished,
}: Props) {
  const reduceMotion = useReducedMotion();
  const order = spec.playbackOrder ?? spec.nodes.map((n) => n.id);
  const stepCount = Math.max(1, order.length);

  const [activeIndex, setActiveIndex] = useState(reduceMotion ? stepCount - 1 : 0);
  const [playing, setPlaying] = useState(!reduceMotion);
  const [finished, setFinished] = useState(Boolean(reduceMotion));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const layout = useMemo(() => computeLayout(spec), [spec]);
  const pointMap = useMemo(() => new Map(layout.points.map((p) => [p.id, p])), [layout.points]);
  const byId = useMemo(() => new Map(spec.nodes.map((n) => [n.id, n])), [spec.nodes]);

  const activeNodeId = order[Math.min(activeIndex, order.length - 1)];
  const activeEdgeIds = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < activeIndex && i < order.length - 1; i++) {
      const from = order[i];
      const to = order[i + 1];
      const edge = spec.edges.find((e) => e.from === from && e.to === to);
      if (edge) set.add(edge.id);
    }
    return set;
  }, [activeIndex, order, spec.edges]);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const advance = useCallback(() => {
    setActiveIndex((prev) => {
      const next = Math.min(prev + 1, stepCount - 1);
      if (next >= stepCount - 1) {
        setPlaying(false);
        setFinished(true);
        onFinished?.();
      }
      return next;
    });
  }, [onFinished, stepCount]);

  useEffect(() => {
    clearTimer();
    if (!playing || reduceMotion) return;
    timerRef.current = setTimeout(advance, 1400);
    return clearTimer;
  }, [playing, activeIndex, advance, clearTimer, reduceMotion]);

  function replay() {
    clearTimer();
    setFinished(false);
    setActiveIndex(0);
    setPlaying(!reduceMotion);
  }

  function togglePlay() {
    if (finished && !reduceMotion) {
      replay();
      return;
    }
    setPlaying((p) => !p);
  }

  const tokenPoint = activeNodeId ? pointMap.get(activeNodeId) : undefined;

  return (
    <div className={cn("rounded-2xl border border-white/10 bg-black/25", className)}>
      <div className={cn("border-b border-white/10 px-4 py-3", compact ? "py-2" : "")}>
        <p className="text-sm font-semibold text-white">{spec.title}</p>
        {spec.subtitle ? (
          <p className="mt-0.5 text-xs text-white/50">{spec.subtitle}</p>
        ) : null}
      </div>

      <div className="overflow-x-auto p-4">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="w-full min-w-[280px]"
          role="img"
          aria-label={`Animated procedure: ${spec.title}`}
        >
          {spec.edges.map((edge) => {
            const from = pointMap.get(edge.from);
            const to = pointMap.get(edge.to);
            if (!from || !to) return null;
            const path = edgePath(from, to);
            const lit = activeEdgeIds.has(edge.id) || finished;
            return (
              <g key={edge.id}>
                <motion.path
                  d={path}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={cn(lit ? "text-emerald-400/90" : "text-white/15")}
                  initial={reduceMotion ? false : { pathLength: 0 }}
                  animate={{ pathLength: lit ? 1 : 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.85, ease: "easeInOut" }}
                />
                {edge.label && lit ? (
                  <text
                    x={(from.x + to.x) / 2 + NODE_W / 2}
                    y={(from.y + to.y) / 2 + NODE_H / 2 - 6}
                    textAnchor="middle"
                    className="fill-white/70 text-[10px]"
                  >
                    {edge.label}
                  </text>
                ) : null}
              </g>
            );
          })}

          {layout.points.map((pt) => {
            const node = byId.get(pt.id);
            if (!node) return null;
            const orderIdx = order.indexOf(pt.id);
            const active = orderIdx >= 0 && orderIdx <= activeIndex;
            const isDecision = node.kind === "decision";
            return (
              <g key={pt.id} transform={`translate(${pt.x}, ${pt.y})`}>
                <motion.rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={isDecision ? 14 : 16}
                  className={cn(
                    active ? "fill-emerald-500/25 stroke-emerald-400/80" : "fill-white/[0.06] stroke-white/20",
                  )}
                  strokeWidth={2}
                  initial={reduceMotion ? false : { opacity: 0.35, scale: 0.96 }}
                  animate={{
                    opacity: active ? 1 : 0.45,
                    scale: active ? 1 : 0.98,
                  }}
                  transition={{ duration: reduceMotion ? 0 : 0.45 }}
                />
                <text
                  x={NODE_W / 2}
                  y={22}
                  textAnchor="middle"
                  className="fill-white/45 text-[9px] font-semibold uppercase tracking-wider"
                >
                  {node.kind}
                </text>
                <text
                  x={NODE_W / 2}
                  y={42}
                  textAnchor="middle"
                  className="fill-white text-[11px] font-semibold"
                >
                  {node.label.length > 22 ? `${node.label.slice(0, 20)}…` : node.label}
                </text>
              </g>
            );
          })}

          {tokenPoint && !reduceMotion ? (
            <motion.circle
              r={7}
              className="fill-amber-300"
              animate={{
                cx: tokenPoint.x + NODE_W / 2,
                cy: tokenPoint.y + NODE_H / 2,
              }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
            />
          ) : null}
        </svg>

        {activeNodeId && byId.get(activeNodeId)?.description ? (
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            {byId.get(activeNodeId)?.description}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3">
        <p className="text-xs text-white/45">
          Step {Math.min(activeIndex + 1, stepCount)} of {stepCount}
          {finished ? " · Final state" : ""}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => void togglePlay()}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/5"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : finished ? "Replay" : "Play"}
          </button>
          <button
            type="button"
            onClick={replay}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-white/85 hover:bg-white/5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
