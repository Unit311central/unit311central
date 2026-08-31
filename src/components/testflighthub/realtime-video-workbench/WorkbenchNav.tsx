"use client";

import { cn } from "@/lib/utils";

import { WORKBENCH_TABS, type WorkbenchTabId } from "./shared";

export function WorkbenchNav({
  activeTab,
  onTabChange,
}: {
  activeTab: WorkbenchTabId;
  onTabChange: (tab: WorkbenchTabId) => void;
}) {
  return (
    <div className="sticky top-0 z-30 -mx-1 border-b border-sky-400/20 bg-[#060a14]/95 px-1 py-3 backdrop-blur-md">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-300/70">
        Engineering Workbench
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WORKBENCH_TABS.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              title={tab.description}
              className={cn(
                "min-w-[9.5rem] shrink-0 rounded-lg border px-3 py-2.5 text-left transition-colors",
                active
                  ? "border-sky-400/50 bg-sky-500/20 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]"
                  : "border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]",
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <span
                className={cn(
                  "block text-xs font-semibold",
                  active ? "text-white" : "text-white/75",
                )}
              >
                {tab.label}
              </span>
              <span className="mt-0.5 block text-[10px] leading-snug text-white/40">
                {tab.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
