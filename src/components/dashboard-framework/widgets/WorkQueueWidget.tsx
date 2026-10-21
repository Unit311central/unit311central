"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

import {
  homeSectionDelaySec,
  queueAttentionFraction,
} from "@/components/dashboard-framework/motion/home-intro-schedule";
import { useHomeSectionIntro, useLivingMotionEnabled } from "@/components/dashboard-framework/motion/living-motion";
import type { DashboardWorkQueueWidget } from "@/lib/dashboard-framework";
import { cn } from "@/lib/utils";
import { WidgetTitle, widgetShellClass } from "./widget-shell";

function QueueAttentionBar({
  fraction,
  index,
  priority,
  playIntro,
}: {
  fraction: number;
  index: number;
  priority: "high" | "medium" | "low" | undefined;
  playIntro: boolean;
}) {
  const tone =
    priority === "high"
      ? "bg-rose-400"
      : priority === "medium"
        ? "bg-amber-300"
        : "bg-sky-400";

  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
      <motion.div
        className={cn("h-full rounded-full", tone)}
        data-living-queue-bar={index}
        initial={playIntro ? { width: "0%" } : false}
        animate={{ width: `${Math.round(fraction * 100)}%` }}
        transition={
          playIntro
            ? {
                duration: 1.75,
                delay: homeSectionDelaySec("queue", index),
                ease: [0.22, 1, 0.36, 1],
              }
            : { duration: 0 }
        }
      />
    </div>
  );
}

export default function WorkQueueWidget({ widget }: { widget: DashboardWorkQueueWidget }) {
  const motionEnabled = useLivingMotionEnabled();
  const { sectionRef, playSectionIntro, sectionDataAttr } = useHomeSectionIntro("queue");
  const [completedIds, setCompletedIds] = useState<Set<string>>(() => new Set());

  const toggleComplete = useCallback((id: string) => {
    setCompletedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return (
    <section
      ref={sectionRef}
      data-home-motion-section={sectionDataAttr}
      data-qa-target="home-work-queue"
      className={widgetShellClass()}
    >
      <WidgetTitle title={widget.title ?? "Work Queue"} meta={`${widget.items.length} items`} />
      {widget.items.length === 0 ? (
        <p className="text-[13px] text-white/45">Queue is clear.</p>
      ) : (
        <ul className="space-y-2">
          {widget.items.map((item, index) => {
            const done = completedIds.has(item.id);
            const attention = queueAttentionFraction(item.priority);
            return (
              <motion.li
                key={item.id}
                layout={motionEnabled}
                initial={false}
                animate={{ opacity: done ? 0.72 : 1, y: 0, scale: done ? 0.98 : 1 }}
                transition={{ duration: 0.35 }}
                className={cn(
                  "cursor-pointer rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 transition-shadow",
                  motionEnabled && "hover:border-white/12 hover:bg-white/[0.04] hover:shadow-md",
                  done && "border-emerald-400/20 bg-emerald-500/5",
                )}
                onClick={() => toggleComplete(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    toggleComplete(item.id);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-pressed={done}
              >
                <div className="flex items-start justify-between gap-2">
                  <p
                    className={cn(
                      "text-[13px] text-white/90 transition-all",
                      done && "text-white/55 line-through decoration-white/30",
                    )}
                  >
                    {item.title}
                  </p>
                  <motion.span
                    layout
                    className={cn(
                      "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
                      done
                        ? "bg-emerald-500/20 text-emerald-200"
                        : item.priority === "high"
                          ? "bg-rose-500/15 text-rose-200"
                          : item.priority === "medium"
                            ? "bg-amber-500/15 text-amber-200"
                            : "bg-white/10 text-white/55",
                    )}
                  >
                    {done ? "Done" : item.status}
                  </motion.span>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-[11px] text-white/40">{item.meta}</p>
                  {item.dueLabel ? (
                    <span className="shrink-0 text-[11px] text-white/35">{item.dueLabel}</span>
                  ) : null}
                </div>
                {!done ? (
                  <QueueAttentionBar
                    fraction={attention}
                    index={index}
                    priority={item.priority}
                    playIntro={playSectionIntro}
                  />
                ) : null}
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
