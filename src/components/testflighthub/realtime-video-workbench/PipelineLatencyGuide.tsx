"use client";

import {
  LATENCY_CATEGORY_DEFINITIONS,
  MILESTONE_LATENCY_DEFINITIONS,
} from "@/lib/realtime-video-pipeline/pipeline-terminology";

export function LatencyCategoryGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "space-y-2" : "grid gap-3 md:grid-cols-2 xl:grid-cols-3"}>
      {Object.values(LATENCY_CATEGORY_DEFINITIONS).map((item) => (
        <div
          key={item.label}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm"
          title={item.description}
        >
          <p className="font-medium text-white">{item.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-white/55">{item.description}</p>
          <p className="mt-1 text-[11px] text-white/35">Examples: {item.examples}</p>
        </div>
      ))}
    </div>
  );
}

export function MilestoneLatencyGuide() {
  return (
    <div className="space-y-2">
      {Object.entries(MILESTONE_LATENCY_DEFINITIONS).map(([key, item]) => (
        <div key={key} className="rounded-lg border border-white/8 bg-black/15 px-3 py-2 text-sm">
          <p className="font-medium text-white">{item.label}</p>
          <p className="mt-0.5 text-xs text-white/55">{item.description}</p>
        </div>
      ))}
    </div>
  );
}
