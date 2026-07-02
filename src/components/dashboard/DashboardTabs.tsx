"use client";

import { PAGE_TABS, type PageTabId } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

type DashboardTabsProps = {
  activeTab: PageTabId;
  onTabChange: (tabId: PageTabId) => void;
};

export default function DashboardTabs({ activeTab, onTabChange }: DashboardTabsProps) {
  return (
    <div className="border-b border-white/[0.06] -mx-4 px-4 sm:mx-0 sm:px-0">
      <nav className="-mb-px flex gap-0.5 overflow-x-auto pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {PAGE_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:px-4 sm:py-3 sm:text-sm",
              activeTab === tab.id
                ? "border-blue-500 text-white"
                : "border-transparent text-white/40 hover:border-white/10 hover:text-white/65",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
