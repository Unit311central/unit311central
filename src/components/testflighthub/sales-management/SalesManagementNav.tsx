"use client";

import { cn } from "@/lib/utils";
import {
  SALES_MANAGEMENT_NAV_GROUPS,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";

export function SalesManagementNav({
  activeTab,
  onTabChange,
}: {
  activeTab: SalesManagementTabId;
  onTabChange: (tab: SalesManagementTabId) => void;
}) {
  return (
    <nav
      className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
      aria-label="Sales Management sections"
    >
      <div className="space-y-3">
        {SALES_MANAGEMENT_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
              {group.label}
            </p>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={`${group.label} tabs`}>
              {group.tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`sales-management-panel-${tab.id}`}
                  id={`sales-management-tab-${tab.id}`}
                  className={cn(
                    "rounded-lg px-3.5 py-2 text-[13px] font-medium transition-all",
                    activeTab === tab.id
                      ? "bg-violet-500/22 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-violet-400/35"
                      : "text-white/55 hover:bg-white/[0.05] hover:text-white/88",
                  )}
                  onClick={() => onTabChange(tab.id as SalesManagementTabId)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
