"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";

import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  SALES_MANAGEMENT_TABS,
  getSalesManagementTabLabel,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { cn } from "@/lib/utils";

import CrmWorkspace from "../CrmWorkspace";
import MeetingsWorkspace from "../MeetingsWorkspace";
import { WsSection } from "../domain-workspace-ui";
import SalesManagementDashboard from "./SalesManagementDashboard";
import SalesManagementOpportunitiesTab from "./SalesManagementOpportunitiesTab";
import SalesManagementPipelineTab from "./SalesManagementPipelineTab";

const PHASE_1_TABS = new Set<SalesManagementTabId>([
  "dashboard",
  "prospects",
  "discovery",
  "opportunities",
  "pipeline",
]);

function resolveTab(searchParams: URLSearchParams): SalesManagementTabId {
  const fromTab = searchParams.get("tab");
  if (isSalesManagementTab(fromTab)) return fromTab;
  return DEFAULT_SALES_MANAGEMENT_TAB;
}

function Phase1Placeholder({ tab }: { tab: SalesManagementTabId }) {
  return (
    <WsSection
      title={getSalesManagementTabLabel(tab)}
      subtitle="Planned for a later Sales Management phase — not part of Phase 1 scope."
    >
      <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-8 text-center">
        <p className="text-sm font-medium text-white/70">{getSalesManagementTabLabel(tab)}</p>
        <p className="mx-auto mt-2 max-w-lg text-[12px] leading-relaxed text-white/40">
          Phase 1 delivers Dashboard, Prospects, Discovery, Opportunities, and Pipeline. This tab
          will be implemented after review.
        </p>
      </div>
    </WsSection>
  );
}

export default function SalesManagementWorkspace() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const activeTab = useMemo(() => resolveTab(searchParams), [searchParams]);

  const basePath = useInternalOperationsBasePath();
  const quotesReturnHref = useMemo(
    () => getInternalNavHref("sales-management", basePath, { tab: "opportunities", panel: "quotes" }),
    [basePath],
  );

  const onTabChange = useCallback(
    (tab: SalesManagementTabId) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("view", "sales-management");
      params.set("tab", tab);
      params.delete("panel");
      params.delete("leadId");
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const panel = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <SalesManagementDashboard />;
      case "prospects":
        return (
          <CrmWorkspace
            variant="prospects"
            embedded
            title="Prospects"
            subtitle="Early-stage leads from the shared CRM register — no duplicate customer database."
          />
        );
      case "discovery":
        return <MeetingsWorkspace />;
      case "opportunities":
        return <SalesManagementOpportunitiesTab quotesReturnHref={quotesReturnHref} />;
      case "pipeline":
        return <SalesManagementPipelineTab />;
      default:
        return PHASE_1_TABS.has(activeTab) ? null : <Phase1Placeholder tab={activeTab} />;
    }
  }, [activeTab, quotesReturnHref]);

  return (
    <div className="mx-auto max-w-7xl space-y-4" aria-label="Sales Management">
      <header className="space-y-1">
        <div className="flex items-center gap-2 text-white/90">
          <Target className="h-5 w-5" aria-hidden />
          <h1 className="text-lg font-semibold tracking-tight">Sales Management</h1>
        </div>
        <p className="text-sm text-white/50">
          Operational sales workspace for pipeline, discovery, quotes, and commercial process.
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
              PHASE_1_TABS.has(tab.id) ? "" : "opacity-70",
            )}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div
        id={`sales-management-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`sales-management-tab-${activeTab}`}
      >
        {panel}
      </div>
    </div>
  );
}
