"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";

import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  SALES_MANAGEMENT_TABS,
  getSalesManagementTabLabel,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";
import { cn } from "@/lib/utils";

import { WsSection } from "../domain-workspace-ui";

function resolveTab(searchParams: URLSearchParams): SalesManagementTabId {
  const fromTab = searchParams.get("tab");
  if (isSalesManagementTab(fromTab)) return fromTab;
  return DEFAULT_SALES_MANAGEMENT_TAB;
}

export default function SalesManagementWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<SalesManagementTabId>(() => resolveTab(searchParams));

  useEffect(() => {
    setActiveTab(resolveTab(searchParams));
  }, [searchParams]);

  const onTabChange = useCallback(
    (tab: SalesManagementTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "sales-management");
      params.set("tab", tab);
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const activeLabel = useMemo(() => getSalesManagementTabLabel(activeTab), [activeTab]);

  return (
    <div className="mx-auto max-w-6xl space-y-4" aria-label="Sales Management">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-white/90">
          <Target className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight">Sales Management</h1>
        </div>
        <p className="text-sm text-white/50">
          Operational sales workspace for pipeline, performance, and commercial process.
        </p>
      </header>

      <div
        className="flex flex-wrap gap-1 border-b border-white/10 pb-2"
        role="tablist"
        aria-label="Sales Management sections"
      >
        {SALES_MANAGEMENT_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`sales-management-panel-${tab.id}`}
            id={`sales-management-tab-${tab.id}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors",
              activeTab === tab.id
                ? "bg-white/10 text-white"
                : "text-white/50 hover:bg-white/[0.04] hover:text-white/80",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <WsSection
        title={activeLabel}
        subtitle="Phase 0 module shell — detailed functionality arrives in later phases."
      >
        <div
          id={`sales-management-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`sales-management-tab-${activeTab}`}
          className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center"
        >
          <p className="text-sm font-medium text-white/70">{activeLabel}</p>
          <p className="mx-auto mt-2 max-w-lg text-[12px] leading-relaxed text-white/40">
            This tab is registered and routed. CRM, discovery, and sales quotes remain under
            Business Central → Customer Management until they are re-homed in a later phase.
          </p>
        </div>
      </WsSection>
    </div>
  );
}
