"use client";

import { motion } from "framer-motion";

import { homeSectionDelaySec } from "@/components/dashboard-framework/motion/home-intro-schedule";
import { useHomeSectionIntro, useLivingMotionEnabled } from "@/components/dashboard-framework/motion/living-motion";
import type { DashboardRecentActivityWidget } from "@/lib/dashboard-framework";
import { cn } from "@/lib/utils";
import { WidgetTitle, widgetShellClass } from "./widget-shell";

export default function RecentActivityWidget({
  widget,
}: {
  widget: DashboardRecentActivityWidget;
}) {
  const motionEnabled = useLivingMotionEnabled();
  const { sectionRef, playSectionIntro, sectionDataAttr } = useHomeSectionIntro("activity");

  return (
    <section
      ref={sectionRef}
      data-home-motion-section={sectionDataAttr}
      data-qa-target="home-recent-activity"
      className={widgetShellClass()}
    >
      <WidgetTitle title={widget.title ?? "Recent Activity"} />
      {widget.items.length === 0 ? (
        <p className="text-[13px] text-white/45">No recent activity.</p>
      ) : (
        <ul className="space-y-2.5">
          {widget.items.map((item, index) => (
            <motion.li
              key={item.id}
              className={cn(
                "min-w-0 rounded-lg px-2 py-1.5 transition-colors",
                item.highlight && motionEnabled && "bg-cyan-500/10 ring-1 ring-cyan-400/20",
              )}
              initial={playSectionIntro ? { opacity: 0, x: -16 } : false}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: playSectionIntro ? homeSectionDelaySec("activity", index) : 0,
                duration: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
              data-living-activity-row={index}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-[13px] text-white/90">{item.title}</p>
                <span className="shrink-0 text-[11px] text-white/35">{item.timeLabel}</span>
              </div>
              <p className="truncate text-[12px] text-white/45">
                {item.category ? `${item.category} · ` : ""}
                {item.meta}
              </p>
            </motion.li>
          ))}
        </ul>
      )}
    </section>
  );
}
