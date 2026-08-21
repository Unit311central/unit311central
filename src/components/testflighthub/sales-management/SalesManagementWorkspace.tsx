"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Target } from "lucide-react";

import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { createInitialRepresentatives, type Representative } from "@/lib/representatives-data";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";

import CrmWorkspace from "../CrmWorkspace";
import MeetingsWorkspace from "../MeetingsWorkspace";
import RepresentativesWorkspace from "../RepresentativesWorkspace";
import SalesQuotesWorkspace from "../SalesQuotesWorkspace";
import SalesManagementDashboard from "./SalesManagementDashboard";
import SalesManagementOpportunitiesTab from "./SalesManagementOpportunitiesTab";
import SalesManagementPipelineTab from "./SalesManagementPipelineTab";
import {
  SalesManagementMySalesTab,
  SalesManagementSalesTeamTab,
} from "./SalesManagementOverviewTabs";
import {
  SalesManagementActivitiesTab,
  SalesManagementCommissionsTab,
  SalesManagementForecastTab,
  SalesManagementPerformanceTab,
  SalesManagementReportsTab,
  SalesManagementTargetsTab,
} from "./SalesManagementManagementTabs";
import { SalesTabHeader } from "./sales-management-ui";

function resolveTab(searchParams: URLSearchParams): SalesManagementTabId {
  const fromTab = searchParams.get("tab");
  if (isSalesManagementTab(fromTab)) return fromTab;
  return DEFAULT_SALES_MANAGEMENT_TAB;
}

export default function SalesManagementWorkspace() {
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => resolveTab(searchParams), [searchParams]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState("rep-1");

  useEffect(() => {
    if (activeTab !== "partners" || representatives.length > 0) return;
    const seeded = createInitialRepresentatives();
    setRepresentatives(seeded);
    if (seeded[0]) setSelectedRepresentativeId(seeded[0].id);
  }, [activeTab, representatives.length]);

  const basePath = useInternalOperationsBasePath();
  const quotesReturnHref = useMemo(
    () => getInternalNavHref("sales-management", basePath, { tab: "sales-quotes" }),
    [basePath],
  );

  const panel = useMemo(() => {
    switch (activeTab) {
      case "dashboard":
        return <SalesManagementDashboard />;
      case "my-sales":
        return <SalesManagementMySalesTab />;
      case "sales-team":
        return <SalesManagementSalesTeamTab />;
      case "prospects":
        return (
          <div className="space-y-4">
            <SalesTabHeader
              title="Prospects"
              description="Early-stage leads from the shared CRM register — the same source of truth used across Sales Management."
            />
            <CrmWorkspace
              variant="prospects"
              embedded
              title="Prospects"
              subtitle="Early-stage CRM leads before qualification."
            />
          </div>
        );
      case "discovery":
        return <MeetingsWorkspace salesEmbedded />;
      case "opportunities":
        return <SalesManagementOpportunitiesTab quotesReturnHref={quotesReturnHref} />;
      case "pipeline":
        return <SalesManagementPipelineTab />;
      case "activities":
        return <SalesManagementActivitiesTab />;
      case "sales-quotes":
        return <SalesQuotesWorkspace embedded title="Sales Quotes" />;
      case "partners":
        return (
          <div className="space-y-4">
            <SalesTabHeader
              title="Partners"
              description="Representatives, distributors, and referral partners — the same register previously under Business Central."
            />
            <RepresentativesWorkspace
              representatives={representatives}
              selectedRepresentativeId={selectedRepresentativeId}
              onSelectRepresentative={setSelectedRepresentativeId}
              onRepresentativesChange={setRepresentatives}
            />
          </div>
        );
      case "targets":
        return <SalesManagementTargetsTab />;
      case "performance":
        return <SalesManagementPerformanceTab />;
      case "forecast":
        return <SalesManagementForecastTab />;
      case "commissions":
        return <SalesManagementCommissionsTab />;
      case "reports":
        return <SalesManagementReportsTab />;
      default:
        return null;
    }
  }, [activeTab, quotesReturnHref, representatives, selectedRepresentativeId]);

  return (
    <div className="w-full min-w-0 space-y-4" aria-label="Sales Management">
      <header className="border-b border-white/10 pb-4">
        <div className="flex items-center gap-2.5 text-white/90">
          <Target className="h-5 w-5 text-violet-300" aria-hidden />
          <h1 className="text-xl font-semibold tracking-tight">Sales Management</h1>
        </div>
        <p className="mt-1.5 text-sm leading-relaxed text-white/50">
          Pipeline, team performance, discovery, quotes, and commercial reporting for your workspace.
        </p>
      </header>

      <div
        id={`sales-management-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`sales-management-tab-${activeTab}`}
        className="min-w-0"
      >
        {panel}
      </div>
    </div>
  );
}
