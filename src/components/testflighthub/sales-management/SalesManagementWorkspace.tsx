"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Target } from "lucide-react";

import {
  DEFAULT_SALES_MANAGEMENT_TAB,
  isSalesManagementTab,
  type SalesManagementTabId,
} from "@/lib/sales-management-tabs";
import { getInternalNavHref } from "@/lib/internal-operations-data";
import { createInitialRepresentatives, type Representative } from "@/lib/representatives-data";
import { useInternalOperationsBasePath } from "@/components/testflighthub/InternalOperationsBasePathContext";
import { useOperatorEntitlements } from "@/components/testflighthub/OperatorEntitlementsProvider";
import type { SalesBusinessContext } from "@/lib/sales-business-context";
import {
  SALES_CONTEXT_QUERY_KEY,
  salesContextSelectorEnabled,
  writeSalesBusinessContext,
} from "@/lib/sales-business-context-ui";

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
import {
  isTargetClientsRolloutSurface,
  isTargetClientsTab,
  TARGET_CLIENTS_PREVIEW_TAB_LEGACY,
  TARGET_CLIENTS_TAB,
} from "@/lib/sales-management-target-clients";

import TargetClientsOpeningScreen from "./TargetClientsOpeningScreen";
import { SalesBusinessContextSelector } from "./SalesBusinessContextSelector";
import { SalesBusinessScopeProvider, useSalesBusinessContextStore } from "./sales-business-scope";
import { isBrowserWolfSentinelSurface } from "@/lib/wolf/wolf-sentinel";
import { SalesTabHeader } from "./sales-management-ui";
import {
  isInternalOpportunitiesArchitectureEnabled,
  isSalesTabHiddenInInternalOpportunitiesArchitecture,
} from "@/lib/internal-sales-opportunities-architecture";

function resolveTab(
  searchParams: URLSearchParams,
): SalesManagementTabId | typeof TARGET_CLIENTS_TAB | typeof TARGET_CLIENTS_PREVIEW_TAB_LEGACY {
  const fromTab = searchParams.get("tab");
  if (isTargetClientsTab(fromTab)) {
    return fromTab === TARGET_CLIENTS_PREVIEW_TAB_LEGACY ? TARGET_CLIENTS_PREVIEW_TAB_LEGACY : TARGET_CLIENTS_TAB;
  }
  if (isSalesManagementTab(fromTab)) return fromTab;
  return DEFAULT_SALES_MANAGEMENT_TAB;
}

export default function SalesManagementWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = useMemo(() => resolveTab(searchParams), [searchParams]);
  const basePath = useInternalOperationsBasePath();
  const entitlements = useOperatorEntitlements();
  const storedContext = useSalesBusinessContextStore();
  const selectorEnabled = salesContextSelectorEnabled({
    basePath,
    workspaceSlug: entitlements.workspaceSlug,
  });
  const [sentinelSales, setSentinelSales] = useState(false);
  useEffect(() => {
    setSentinelSales(isBrowserWolfSentinelSurface());
  }, []);
  const scope = selectorEnabled ? storedContext : sentinelSales ? "wolf" : null;
  const urlHydrated = useRef(false);

  useEffect(() => {
    if (!selectorEnabled) return;
    const explicit = searchParams.get(SALES_CONTEXT_QUERY_KEY);
    const urlContext: SalesBusinessContext = explicit === "wolf" ? "wolf" : "unit311central";
    if (!urlHydrated.current) {
      urlHydrated.current = true;
      if ((explicit === "wolf" || explicit === "unit311central") && explicit !== storedContext) {
        writeSalesBusinessContext(explicit);
        return;
      }
    }
    if (urlContext === storedContext && explicit !== "unit311central") return;
    const params = new URLSearchParams(searchParams.toString());
    if (!params.get("view")) params.set("view", "sales-management");
    if (storedContext === "wolf") params.set(SALES_CONTEXT_QUERY_KEY, "wolf");
    else params.delete(SALES_CONTEXT_QUERY_KEY);
    const path = basePath === "/" ? "/" : basePath;
    router.replace(`${path}?${params.toString()}`);
  }, [basePath, router, searchParams, selectorEnabled, storedContext]);
  const [targetClientsEnabled, setTargetClientsEnabled] = useState(() =>
    typeof window !== "undefined" ? isTargetClientsRolloutSurface() : false,
  );
  const [representatives, setRepresentatives] = useState<Representative[]>([]);

  useEffect(() => {
    setTargetClientsEnabled(isTargetClientsRolloutSurface());
  }, []);

  useEffect(() => {
    if (!isInternalOpportunitiesArchitectureEnabled()) return;
    if (!isSalesManagementTab(activeTab)) return;
    if (!isSalesTabHiddenInInternalOpportunitiesArchitecture(activeTab)) return;
    const href = getInternalNavHref("sales-management", basePath, {
      tab: "opportunities",
      ...(selectorEnabled && storedContext === "wolf" ? { salesContext: "wolf" } : {}),
    });
    router.replace(href);
  }, [activeTab, basePath, router, selectorEnabled, storedContext]);

  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState("rep-1");

  useEffect(() => {
    if (activeTab !== "partners" || representatives.length > 0) return;
    const seeded = createInitialRepresentatives();
    setRepresentatives(seeded);
    if (seeded[0]) setSelectedRepresentativeId(seeded[0].id);
  }, [activeTab, representatives.length]);

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
      case "target-clients":
      case "target-clients-preview":
        return targetClientsEnabled ? (
          <TargetClientsOpeningScreen variant="live" />
        ) : (
          <SalesManagementDashboard />
        );
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
  }, [activeTab, quotesReturnHref, representatives, selectedRepresentativeId, targetClientsEnabled]);

  return (
    <SalesBusinessScopeProvider value={scope}>
    <div className="w-full min-w-0 space-y-4" aria-label="Sales Management">
      {selectorEnabled ? (
        <SalesBusinessContextSelector context={storedContext} onChange={writeSalesBusinessContext} />
      ) : null}
      {activeTab === "dashboard" ? (
        <header className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5 text-white/90">
            <Target className="h-5 w-5 text-violet-300" aria-hidden />
            <h1 className="text-xl font-semibold tracking-tight">Sales Management</h1>
          </div>
          <p className="mt-1.5 text-sm leading-relaxed text-white/50">
            Pipeline, team performance, discovery, quotes, and commercial reporting for your workspace.
          </p>
        </header>
      ) : null}

      <div
        key={scope ?? "shared"}
        id={`sales-management-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`sales-management-tab-${activeTab}`}
        className="min-w-0"
      >
        {panel}
      </div>
    </div>
    </SalesBusinessScopeProvider>
  );
}
