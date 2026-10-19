"use client";

import { useCallback, useState } from "react";
import { motion } from "framer-motion";

import { DashboardReveal } from "@/components/dashboard-framework/motion/DashboardReveal";
import { useLivingMotionEnabled } from "@/components/dashboard-framework/motion/living-motion";
import type { DashboardWorkQueueWidget } from "@/lib/dashboard-framework";
import { cn } from "@/lib/utils";
import { WidgetTitle, widgetShellClass } from "./widget-shell";

export default function WorkQueueWidget({ widget }: { widget: DashboardWorkQueueWidget }) {
  const motionEnabled = useLivingMotionEnabled();
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
    <DashboardReveal index={3}>
      <section className={widgetShellClass()}>
        <WidgetTitle title={widget.title ?? "Work Queue"} meta={`${widget.items.length} items`} />
        {widget.items.length === 0 ? (
          <p className="text-[13px] text-white/45">Queue is clear.</p>
        ) : (
          <ul className="space-y-2">
            {widget.items.map((item, index) => {
              const done = completedIds.has(item.id);
              return (
                <motion.li
                  key={item.id}
                  layout={motionEnabled}
                  initial={motionEnabled ? { opacity: 0, y: 8 } : false}
                  animate={{ opacity: done ? 0.72 : 1, y: 0, scale: done ? 0.98 : 1 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
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
                </motion.li>
              );
            })}
          </ul>
        )}
      </section>
    </DashboardReveal>
  );
}
