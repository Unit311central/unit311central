"use client";

import { cn } from "@/lib/utils";
import {
  SALES_MANAGEMENT_NAV_GROUPS,
  SALES_MANAGEMENT_ROOT_TAB,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";

function NavButton({
  tabId,
  label,
  activeTab,
  onTabChange,
  nested = false,
}: {
  tabId: SalesManagementTabId;
  label: string;
  activeTab: SalesManagementTabId;
  onTabChange: (tab: SalesManagementTabId) => void;
  nested?: boolean;
}) {
  const selected = activeTab === tabId;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={selected}
      aria-controls={`sales-management-panel-${tabId}`}
      id={`sales-management-tab-${tabId}`}
      className={cn(
        "w-full rounded-lg px-2.5 py-1.5 text-left text-[13px] font-medium transition-all",
        nested ? "pl-4" : "",
        selected
          ? "bg-violet-500/22 text-violet-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-violet-400/35"
          : "text-white/55 hover:bg-white/[0.05] hover:text-white/88",
      )}
      onClick={() => onTabChange(tabId)}
    >
      {label}
    </button>
  );
}

export function SalesManagementNav({
  activeTab,
  onTabChange,
}: {
  activeTab: SalesManagementTabId;
  onTabChange: (tab: SalesManagementTabId) => void;
}) {
  return (
    <nav
      className="w-full shrink-0 rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.045] to-white/[0.015] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] lg:w-56 xl:w-60"
      aria-label="Sales Management sections"
    >
      <p className="px-1 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/38">
        Sales Management
      </p>

      <div role="tablist" aria-label="Sales Management navigation" className="space-y-3">
        <NavButton
          tabId={SALES_MANAGEMENT_ROOT_TAB.id}
          label={SALES_MANAGEMENT_ROOT_TAB.label}
          activeTab={activeTab}
          onTabChange={onTabChange}
        />

        {SALES_MANAGEMENT_NAV_GROUPS.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <p className="px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/32">
              {group.label}
            </p>
            <div className="space-y-0.5" role="tablist" aria-label={`${group.label} tabs`}>
              {group.tabs.map((tab) => (
                <NavButton
                  key={tab.id}
                  tabId={tab.id as SalesManagementTabId}
                  label={tab.label}
                  activeTab={activeTab}
                  onTabChange={onTabChange}
                  nested
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
