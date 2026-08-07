"use client";

import { startTransition, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useSearchParams } from "next/navigation";

import {
  createInitialAssetRegistry,
  type ManagedAsset,
} from "@/lib/asset-management-data";
import {
  type ManagedClient,
} from "@/lib/client-management-data";
import {
  createInitialRepresentatives,
  type Representative,
} from "@/lib/representatives-data";
import { isDemoDomainHost, isInternalDomainHost } from "@/lib/app-domains";
import { EXECUTIVE_ASSISTANT_VISIBLE } from "@/lib/product-surface-flags";
import {
  INTERNAL_OPERATIONS_BASE_PATH,
  getNavImplementationNotice,
  internalViewTitles,
  isCorporateInformationTab,
  isInternalOperationsView,
  corporateTabToLegacyView,
  legacyCorporateViewToTab,
  normalizeInternalOperationsView,
  resolveInternalOperationsBasePath,
  type CorporateInformationTab,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import {
  DEFAULT_POTENTIAL_CLIENTS_COUNTRY_ID,
  isPotentialClientsCountryId,
} from "@/lib/potential-clients-data";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";
import { InternalOperationsBasePathProvider } from "./InternalOperationsBasePathContext";
import SurveyOperationsShell from "./SurveyOperationsShell";
import { OperatorEntitlementsProvider, useOperatorEntitlements } from "./OperatorEntitlementsProvider";
import { isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import {
  ABHI_HIDDEN_VIEWS,
  CUSTOMER_PLATFORM_HIDDEN_VIEWS,
  isViewAllowedForGrants,
} from "@/lib/internal-role-views";
import { resolveRuntimeSurface } from "@/lib/runtime-surface";
import WorkspaceLoadingFallback from "./WorkspaceLoadingFallback";
import WorkspacePane from "./WorkspacePane";
import WorkspaceErrorBoundary from "./WorkspaceErrorBoundary";
import AdminPerformanceMode from "./AdminPerformanceMode";
import PlatformAnalyticsBeacon from "@/components/analytics/PlatformAnalyticsBeacon";
import InventoryManagementWorkspace from "./InventoryManagementWorkspace";
import {
  prefetchNeighborsForView,
  prefetchViewOnIntent,
  WORKSPACE_CHUNK_LOADERS,
} from "@/lib/workspace-prefetch";
import { markWorkspaceView } from "@/lib/platform-performance";

const ExecutiveHomeDashboard = dynamic(() => import("./ExecutiveHomeDashboard"), {
  loading: () => <WorkspaceLoadingFallback label="Loading executive dashboard" />,
  ssr: false,
});
const TalantonPortfolioWorkspace = dynamic(
  () => import("./talanton/TalantonPortfolioWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading Talanton portfolio" />,
    ssr: false,
  },
);
const PortfolioIntelligenceBriefingWorkspace = dynamic(
  () => import("./talanton/PortfolioIntelligenceBriefingWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading executive briefing" />,
    ssr: false,
  },
);
const CompanyIntelligenceWorkspace = dynamic(
  () => import("./talanton/CompanyIntelligenceWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading company intelligence" />,
    ssr: false,
  },
);
const ImpactIntelligenceDashboardWorkspace = dynamic(
  () => import("./talanton/ImpactIntelligenceDashboardWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading impact dashboard" />,
    ssr: false,
  },
);
const CompanyImpactWorkspace = dynamic(
  () => import("./talanton/CompanyImpactWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading company impact" />,
    ssr: false,
  },
);
const AnnualImpactReportWorkspace = dynamic(
  () => import("./talanton/AnnualImpactReportWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading annual impact report" />,
    ssr: false,
  },
);
const QuarterlyPortfolioUpdateWorkspace = dynamic(
  () => import("./talanton/QuarterlyPortfolioUpdateWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading quarterly portfolio update" />,
    ssr: false,
  },
);
const OpportunityIntelligenceWorkspace = dynamic(
  () => import("./talanton/OpportunityIntelligenceWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading opportunity intelligence" />,
    ssr: false,
  },
);
const PortfolioStoriesWorkspace = dynamic(
  () => import("./talanton/PortfolioStoriesWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading portfolio stories" />,
    ssr: false,
  },
);
const JourneyStoriesWorkspace = dynamic(
  () => import("./talanton/JourneyStoriesWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading journey stories" />,
    ssr: false,
  },
);
const StoriesNewsletterWorkspace = dynamic(
  () => import("./talanton/StoriesNewsletterWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading digital newsletter" />,
    ssr: false,
  },
);
const MediaLibraryWorkspace = dynamic(
  () => import("./talanton/MediaLibraryWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading media library" />,
    ssr: false,
  },
);
const StoriesMailingListWorkspace = dynamic(
  () => import("./talanton/StoriesMailingListWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading mailing list" />,
    ssr: false,
  },
);
const TalantonTrainingDashboardWorkspace = dynamic(
  () => import("./talanton/TalantonTrainingDashboardWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading training dashboard" />,
    ssr: false,
  },
);
const TalantonPortfolioCoursesWorkspace = dynamic(
  () => import("./talanton/TalantonPortfolioCoursesWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading portfolio courses" />,
    ssr: false,
  },
);
const TalantonLearningLibraryWorkspace = dynamic(
  () => import("./talanton/TalantonLearningLibraryWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading learning library" />,
    ssr: false,
  },
);
const TalantonCertificationsWorkspace = dynamic(
  () => import("./talanton/TalantonCertificationsWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading certifications" />,
    ssr: false,
  },
);
const TalantonCompanyProgressWorkspace = dynamic(
  () => import("./talanton/TalantonCompanyProgressWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading company progress" />,
    ssr: false,
  },
);
const TalantonPortalManagementWorkspace = dynamic(
  () => import("./talanton/TalantonPortalManagementWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading portal management" />,
    ssr: false,
  },
);
const TalantonPortfolioPortalOverviewWorkspace = dynamic(
  () => import("./talanton/TalantonPortfolioPortalOverviewWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading portfolio portal overview" />,
    ssr: false,
  },
);
const TalantonFundsWorkspace = dynamic(
  () => import("./talanton/TalantonFundsWorkspace"),
  {
    loading: () => <WorkspaceLoadingFallback label="Loading funds" />,
    ssr: false,
  },
);
import {
  AbhiCalendarEventsWorkspace,
  AbhiComplianceTrainingWorkspace,
  AbhiEventManagementWorkspace,
  AbhiEventsWorkspace,
  AbhiMailingListWorkspace,
  AbhiNewsletterWorkspace,
  AbhiUkPavilionWorkspace,
  AbhiProgrammesWorkspace,
  AccountsPayableWorkspace,
  AccountsReceivableWorkspace,
  AssetManagementWorkspace,
  AppearanceSettingsWorkspace,
  BillingWorkspace,
  BoardPackCustomizerWorkspace,
  CalendarWorkspace,
  CapaWorkspace,
  CapTableWorkspace,
  ClientFilesExplorerWorkspace,
  ClientManagementWorkspace,
  ClientOnboardingWorkspace,
  ClientsDashboardWorkspace,
  MemberIntelligenceWorkspace,
  RegulatoryIntelligenceWorkspace,
  CompetitorsWorkspace,
  ConnectionsWorkspace,
  CorporateDashboardWorkspace,
  CorporateInformationWorkspace,
  CrmQuestionsTestWorkspace,
  CrmWorkspace,
  DocumentControlWorkspace,
  EngineeringCapacityWorkspace,
  EngineeringDashboardWorkspace,
  EngineeringResourcesWorkspace,
  ExecutiveAssistantWorkspace,
  ExpensesWorkspace,
  ExternalClientAccessWorkspace,
  ExternalUsersWorkspace,
  FileRepositoryWorkspace,
  FinancialReportsWorkspace,
  FinancialsWorkspace,
  FleetWorkspace,
  GeneralLedgerWorkspace,
  GrantsWorkspace,
  HrReportsWorkspace,
  HrWorkspace,
  OrgChartWorkspace,
  InfoEmailWorkspace,
  InternalAuditsWorkspace,
  InternalDesignMockups,
  LeaveManagementWorkspace,
  LogisticsWorkspace,
  ManagementReviewWorkspace,
  MeetingsWorkspace,
  CommunicationsWorkspace,
  MessagingWorkspace,
  ModuleGoLiveWorkspace,
  PerformanceHubWorkspace,
  PayrollWorkspace,
  PlatformBillingWorkspace,
  PotentialClientsWorkspace,
  ProcurementWorkspace,
  ProductivityDashboardWorkspace,
  ProfileWorkspace,
  ProjectsWorkspace,
  QmsTrainingWorkspace,
  QualityManagementWorkspace,
  RecentMissionsPanel,
  RecruitmentWorkspace,
  RepresentativesWorkspace,
  RiskRegisterWorkspace,
  BoardMeetingsWorkspace,
  BoardGovernanceWorkspace,
  SectorWorkspace,
  SettingsWorkspace,
  SocialWorkspace,
  StaffTrainingWorkspace,
  ExternalTrainingWorkspace,
  StrategyWorkspace,
  SupportWorkspace,
  WhatsAppIntegrationWorkspace,
  TelemetryDashboard,
  TestingWeatherPanel,
  TechnologyDashboardWorkspace,
  TechnologyPlaceholderWorkspace,
  TechnologySoftwareWorkspace,
  TrainingDashboardWorkspace,
  TqmsReportsWorkspace,
  Unit311DetailsWorkspace,
  UserManagementWorkspace,
  WebODMWorkspace,
  WebsiteManagementWorkspace,
  IntegrationsWorkspace,
  PlatformAnalyticsWorkspace,
  WebsiteAnalyticsWorkspace,
  WhiteboardWorkspace,
  WiseWorkspace,
} from "./lazy-workspaces";
import { type ManagedUser } from "@/lib/user-management-data";
import { useInfoEmailWhatsAppPoller } from "@/hooks/useInfoEmailWhatsAppPoller";
import {
  fetchCachedJson,
  PLATFORM_CACHE_KEYS,
} from "@/lib/platform-fetch-cache";
import { useSurveyOperationsSimulator } from "./SurveyOperationsSimulatorProvider";
import { OnwardAirPlaceholderWorkspace, OperationsDashboardWorkspace } from "@/components/onwardair/OnwardAirPlaceholderWorkspace";
import {
  EngineeringAssuranceWorkspace,
  EngineeringIntegrationsWorkspace,
  EngineeringOverviewWorkspace,
  EngineeringProgramsWorkspace,
  EngineeringRisksWorkspace,
  EngineeringSupplyWorkspace,
  EngineeringTeamWorkspace,
} from "@/components/onwardair/OnwardAirEngineeringWorkspaces";
import {
  FundraisingDashboardWorkspace,
  FundraisingDataRoomsWorkspace,
  FundraisingInvestorsWorkspace,
  FundraisingMeetingsWorkspace,
  FundraisingPipelineWorkspace,
  FundraisingPitchDecksWorkspace,
} from "@/components/onwardair/FundraisingWorkspaces";
import {
  OnwardAirBoardDecksWorkspace,
  OnwardAirBoardMeetingsWorkspace,
} from "@/components/onwardair/OnwardAirBoardWorkspaces";
import { OnwardAirIpPatentsWorkspace } from "@/components/onwardair/OnwardAirIpPatentsWorkspace";
import { OnwardAirCompetitorIntelligenceWorkspace } from "@/components/onwardair/OnwardAirCompetitorIntelligenceWorkspace";
import { OnwardAirEcosystemPartnersWorkspace } from "@/components/onwardair/OnwardAirEcosystemPartnersWorkspace";
import OnwardAirMarketingEventsWorkspace from "@/components/onwardair/OnwardAirMarketingEventsWorkspace";
import OnwardAirBusinessCentralDashboard from "@/components/onwardair/OnwardAirBusinessCentralDashboard";

const VIEWS_NEEDING_SIMULATOR = new Set<InternalOperationsView>([
  "fleet",
  "testing",
  "telemetry",
]);

function NavImplementationNotice({ view }: { view: InternalOperationsView }) {
  const searchParams = useSearchParams();
  let notice = getNavImplementationNotice(view);
  if (!notice && view === "corporate-information") {
    const tab = searchParams.get("tab");
    if (
      tab === "cap-table" ||
      tab === "office-locations" ||
      tab === "bank-accounts" ||
      tab === "professional-advisors" ||
      tab === "contracts"
    ) {
      notice = "demo";
    }
  }
  if (!notice) return null;
  const meta = internalViewTitles[view];
  if (notice === "demo") {
    return (
      <div
        role="status"
        className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90"
      >
        <span className="font-semibold text-amber-50">Demo data</span>
        <span className="text-amber-100/70">
          {" "}
          — {meta.title} uses non-durable sample data and is not the live system of record yet.
        </span>
      </div>
    );
  }
  return (
    <div
      role="status"
      className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90"
    >
      <span className="font-semibold text-amber-50">Uses current implementation</span>
      <span className="text-amber-100/70">
        {" "}
        — {meta.title} opens the existing module until this navigation area is redesigned.
      </span>
    </div>
  );
}

function isClientOnboardingPath(pathname: string) {
  return (
    pathname.endsWith("/client-onboarding") ||
    pathname.endsWith("/internaldashboard/client-onboarding")
  );
}

function isExecutiveAssistantPath(pathname: string) {
  return (
    pathname.endsWith("/executive-assistant") ||
    pathname.endsWith("/internaldashboard/executive-assistant")
  );
}

function isCapTablePath(pathname: string) {
  return (
    pathname.endsWith("/corporate-information/cap-table") ||
    pathname.includes("/corporate-information/cap-table")
  );
}

function isLegacyModuleHardPath(pathname: string) {
  return (
    isClientOnboardingPath(pathname) ||
    isExecutiveAssistantPath(pathname) ||
    isCapTablePath(pathname)
  );
}

function readInitialView(
  searchParams: ReturnType<typeof useSearchParams>,
  pathname: string,
  initialView?: InternalOperationsView,
): InternalOperationsView {
  if (initialView) {
    return initialView;
  }

  // Legacy hard paths still resolve during migration; URL sync rewrites to ?view=.
  if (isClientOnboardingPath(pathname)) {
    return "client-onboarding";
  }

  if (isCapTablePath(pathname)) {
    return isBrowserAbhiSurface() ? "corporate-dashboard" : "corporate-cap-table";
  }

  if (isExecutiveAssistantPath(pathname)) {
    return EXECUTIVE_ASSISTANT_VISIBLE ? "executive-assistant" : "home";
  }

  const fromQuery = normalizeInternalOperationsView(searchParams.get("view"));
  if (fromQuery === "executive-assistant" && !EXECUTIVE_ASSISTANT_VISIBLE) {
    return "home";
  }
  if (fromQuery && ABHI_HIDDEN_VIEWS.has(fromQuery) && isBrowserAbhiSurface()) {
    return fromQuery === "corporate-cap-table" ? "corporate-dashboard" : "home";
  }
  if (
    fromQuery &&
    CUSTOMER_PLATFORM_HIDDEN_VIEWS.has(fromQuery) &&
    typeof window !== "undefined" &&
    resolveRuntimeSurface(window.location.hostname) === "customer"
  ) {
    return "home";
  }
  return fromQuery;
}

export default function InternalOperationsDashboard({
  basePath: basePathProp,
  initialView,
}: {
  basePath?: SurveyOperationsBasePath;
  initialView?: InternalOperationsView;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname() ?? "";
  const [resolvedBasePath, setResolvedBasePath] = useState<SurveyOperationsBasePath>(() => {
    if (basePathProp) return basePathProp;
    if (typeof window !== "undefined") {
      return resolveInternalOperationsBasePath(window.location.hostname);
    }
    // Prefer canonical `/` during SSR when host is unknown — never default to the
    // legacy App Router folder or history.replaceState will expose /internaldashboard.
    return "/";
  });
  const basePath = resolvedBasePath;

  useEffect(() => {
    if (basePathProp) {
      setResolvedBasePath(basePathProp);
      return;
    }
    setResolvedBasePath(resolveInternalOperationsBasePath(window.location.hostname));
  }, [basePathProp]);

  const [isInternalHost] = useState(() => {
    // Customer workspace hosts use /dashboard; Internal ops use / (canonical).
    // Demo ops also use / but must NOT get Internal-only platform billing.
    // /overview embeds the same customer shell for the private invite page.
    if (resolvedBasePath === "/dashboard" || resolvedBasePath === "/overview") return false;
    if (typeof window !== "undefined") {
      if (isDemoDomainHost(window.location.hostname)) return false;
      if (isInternalDomainHost(window.location.hostname)) return true;
    }
    return resolvedBasePath === "/" || resolvedBasePath === INTERNAL_OPERATIONS_BASE_PATH;
  });
  const [activeView, setActiveView] = useState<InternalOperationsView>(() =>
    readInitialView(searchParams, pathname, initialView),
  );
  const [warmViews, setWarmViews] = useState<InternalOperationsView[]>(() => [
    readInitialView(searchParams, pathname, initialView),
  ]);
  const warmSet = useMemo(() => new Set(warmViews), [warmViews]);
  const isWarm = useCallback((view: InternalOperationsView) => warmSet.has(view), [warmSet]);
  const {
    liveTelemetry,
    isRunning,
    setSandboxMountTarget,
    setExcludedProfileIds,
    setSimulatorEnabled,
  } = useSurveyOperationsSimulator();
  const [assets, setAssets] = useState<ManagedAsset[]>([]);
  const [assetCategories, setAssetCategories] = useState<string[]>([]);
  const [assetLocations, setAssetLocations] = useState<string[]>([]);
  const [clients, setClients] = useState<ManagedClient[]>([]);
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [selectedRepresentativeId, setSelectedRepresentativeId] = useState("rep-1");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const testingSandboxHostRef = useRef<HTMLDivElement>(null);
  const mockSeededRef = useRef(false);
  const clientsLoadedRef = useRef(false);
  const usersLoadedRef = useRef(false);

  useInfoEmailWhatsAppPoller(true);

  // Seed mock registries only when a module that needs them is first opened.
  // Resolve the registry in-effect so host-specific seeds (ABHI / CorpCentre) see `window`.
  useEffect(() => {
    const needsAssets =
      activeView === "assets" ||
      activeView === "inventory-management" ||
      activeView === "fleet";
    const needsReps = activeView === "representatives";
    if (!needsAssets && !needsReps) return;
    if (mockSeededRef.current && assets.length > 0 && representatives.length > 0) return;

    if (needsAssets && assets.length === 0) {
      const registry = createInitialAssetRegistry();
      setAssets(registry.assets);
      setAssetCategories(registry.categories);
      setAssetLocations(registry.locations);
      if (registry.assets[0]) setSelectedAssetId(registry.assets[0].id);
      mockSeededRef.current = true;
    }
    if (needsReps && representatives.length === 0) {
      setRepresentatives(createInitialRepresentatives());
    }
  }, [activeView, assets.length, representatives.length]);

  useEffect(() => {
    const needsUsers =
      activeView === "assets" ||
      activeView === "fleet" ||
      activeView === "calendar" ||
      activeView === "users" ||
      activeView === "users-external";
    if (!needsUsers || usersLoadedRef.current) return;
    usersLoadedRef.current = true;

    void fetchCachedJson<{ users?: ManagedUser[] }>(PLATFORM_CACHE_KEYS.users, "/api/users", {
      ttlMs: 120_000,
    })
      .then((data) => {
        setUsers(data.users ?? []);
      })
      .catch(() => {
        // keep local fallback until Supabase migration is applied
      });
  }, [activeView]);

  useEffect(() => {
    const needsClients =
      activeView === "clients" ||
      activeView === "clients-dashboard" ||
      activeView === "member-intelligence" ||
      activeView === "regulatory-dashboard" ||
      activeView === "regulatory-updates" ||
      activeView === "regulatory-impact" ||
      activeView === "regulatory-alerts" ||
      activeView === "assets" ||
      activeView === "projects" ||
      activeView === "projects-dashboard" ||
      activeView === "projects-internal" ||
      activeView === "projects-external" ||
      activeView === "calendar";
    if (!needsClients || clientsLoadedRef.current) return;
    clientsLoadedRef.current = true;

    void fetchCachedJson<{ clients?: ManagedClient[] }>(
      PLATFORM_CACHE_KEYS.clients,
      "/api/clients",
      { ttlMs: 120_000 },
    )
      .then((data) => {
        // Always replace — empty workspace must not keep mock/Unit311 seed clients.
        setClients(data.clients ?? []);
      })
      .catch(() => {
        setClients([]);
      });
  }, [activeView]);

  useEffect(() => {
    setSimulatorEnabled(VIEWS_NEEDING_SIMULATOR.has(activeView));
  }, [activeView, setSimulatorEnabled]);

  useEffect(() => {
    markWorkspaceView(activeView);
    setWarmViews((prev) => {
      const next = [activeView, ...prev.filter((view) => view !== activeView)];
      return next.slice(0, 8);
    });
    prefetchNeighborsForView(activeView);
  }, [activeView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      for (const view of ["crm", "messaging", "communications", "projects", "calendar", "financials", "clients"] as InternalOperationsView[]) {
        const loader = WORKSPACE_CHUNK_LOADERS[view];
        if (loader) void loader();
      }
    };
    const ric = window.requestIdleCallback?.(run, { timeout: 4000 });
    const timer = ric == null ? window.setTimeout(run, 1800) : null;
    return () => {
      cancelled = true;
      if (ric != null) window.cancelIdleCallback?.(ric);
      if (timer != null) window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const viewParam = searchParams.get("view");
    // Legacy combined URL: ?view=corporate-information&tab=office-locations
    if (viewParam === "corporate-information") {
      const tab = searchParams.get("tab");
      const leaf =
        isCorporateInformationTab(tab) && tab !== "cap-table"
          ? corporateTabToLegacyView(tab)
          : "corporate-company-details";
      startTransition(() => setActiveView(leaf));
      return;
    }

    const nextView = readInitialView(searchParams, pathname, initialView);
    startTransition(() => {
      if (viewParam && normalizeInternalOperationsView(viewParam) !== viewParam) {
        setActiveView(nextView);
        return;
      }
      if (isInternalOperationsView(viewParam)) {
        setActiveView(viewParam);
        return;
      }
      if (isClientOnboardingPath(pathname)) {
        setActiveView("client-onboarding");
        return;
      }
      if (isExecutiveAssistantPath(pathname)) {
        setActiveView("executive-assistant");
        return;
      }
      if (isCapTablePath(pathname)) {
        setActiveView(isBrowserAbhiSurface() ? "corporate-dashboard" : "corporate-cap-table");
        return;
      }
      if (!viewParam) {
        setActiveView(initialView ?? "home");
      }
    });
  }, [initialView, pathname, searchParams]);

  useEffect(() => {
    if (isBrowserAbhiSurface() && ABHI_HIDDEN_VIEWS.has(activeView)) {
      setActiveView(activeView === "corporate-cap-table" ? "corporate-dashboard" : "home");
      return;
    }
    if (
      resolveRuntimeSurface(window.location.hostname) === "customer" &&
      CUSTOMER_PLATFORM_HIDDEN_VIEWS.has(activeView)
    ) {
      setActiveView("home");
    }
  }, [activeView]);

  useEffect(() => {
    if (activeView !== "potential-clients") return;
    const country = searchParams.get("country");
    if (isPotentialClientsCountryId(country)) return;

    const url = new URL(window.location.href);
    url.searchParams.set("view", "potential-clients");
    url.searchParams.set("country", DEFAULT_POTENTIAL_CLIENTS_COUNTRY_ID);
    window.history.replaceState({}, "", url.toString());
  }, [activeView, searchParams]);

  useEffect(() => {
    const url = new URL(window.location.href);
    const host = window.location.hostname;
    const onOpsHost = isInternalDomainHost(host) || isDemoDomainHost(host);
    // Never expose the App Router implementation path on Internal/Demo hosts.
    const publicBasePath =
      onOpsHost && basePath === INTERNAL_OPERATIONS_BASE_PATH ? "/" : basePath;

    // Collapse former hard-path module URLs onto the single ?view= model.
    if (isLegacyModuleHardPath(url.pathname)) {
      url.pathname = publicBasePath === "/" ? "/" : publicBasePath;
    }

    if (activeView === "home") {
      url.searchParams.delete("view");
      url.searchParams.delete("country");
      url.searchParams.delete("tab");
    } else {
      url.searchParams.set("view", activeView);
      url.searchParams.delete("tab");
      if (activeView !== "potential-clients") {
        url.searchParams.delete("country");
      } else if (!isPotentialClientsCountryId(url.searchParams.get("country"))) {
        url.searchParams.set("country", DEFAULT_POTENTIAL_CLIENTS_COUNTRY_ID);
      }
    }
    window.history.replaceState({}, "", url.toString());
  }, [activeView, basePath]);

  useLayoutEffect(() => {
    const host = activeView === "testing" ? testingSandboxHostRef.current : null;
    setSandboxMountTarget(host);

    return () => setSandboxMountTarget(null);
  }, [activeView, setSandboxMountTarget]);

  useEffect(() => {
    if (activeView === "testing") {
      setExcludedProfileIds(["france", "austin"]);
      return;
    }

    setExcludedProfileIds([]);
  }, [activeView, setExcludedProfileIds]);

  const [logisticsEntryId, setLogisticsEntryId] = useState(0);
  const previousViewRef = useRef<InternalOperationsView | null>(null);

  useEffect(() => {
    const previous = previousViewRef.current;
    previousViewRef.current = activeView;
    // Remount only when entering Logistics from another view (or first navigation to it).
    if (activeView === "logistics" && previous !== "logistics") {
      setLogisticsEntryId((current) => current + 1);
    }
  }, [activeView]);

  const handleViewChange = useCallback((view: InternalOperationsView) => {
    const normalized = normalizeInternalOperationsView(view);
    prefetchViewOnIntent(normalized);
    setActiveView(normalized);
  }, []);

  return (
    <OperatorEntitlementsProvider>
      <InternalOperationsBasePathProvider basePath={basePath}>
        <AccessViewGuard
          activeView={activeView}
          onRedirect={handleViewChange}
          isInternalHost={isInternalHost}
        />
        <PlatformAnalyticsBeacon pageKey={activeView} />
        <SurveyOperationsShell
          mode="internal"
          activeView={activeView}
          onViewChange={(view) => {
            if (isInternalOperationsView(view)) {
              handleViewChange(view);
            }
          }}
          basePath={basePath}
        >
      <div
        className={
          activeView === "home" || activeView === "settings" || activeView === "billing"
            ? "relative mx-auto w-full min-w-0 px-1 py-1 sm:px-2 md:px-3 lg:px-4 lg:py-2 xl:max-w-[100rem]"
            : "relative mx-auto w-full min-w-0 max-w-7xl px-1 py-2 sm:px-2 md:px-3 lg:px-5 lg:py-3 xl:max-w-[90rem] xl:px-6 xl:py-4"
        }
      >
        <div className="relative min-w-0 space-y-4 sm:space-y-6">
          {activeView !== "home" && <NavImplementationNotice view={activeView} />}
          {isWarm("home") && (
            <WorkspacePane view="home" activeView={activeView} keepMounted={isWarm("home")}>
              <WorkspaceErrorBoundary title="Home">
                <ExecutiveHomeDashboard />
              </WorkspaceErrorBoundary>
            </WorkspacePane>
          )}

          {EXECUTIVE_ASSISTANT_VISIBLE && activeView === "executive-assistant" && (
            <ExecutiveAssistantWorkspace />
          )}
          {activeView === "quality-management" && <QualityManagementWorkspace />}
          {activeView === "qms-training" && <QmsTrainingWorkspace />}
          {activeView === "qms-document-control" && <DocumentControlWorkspace />}
          {activeView === "qms-capa" && <CapaWorkspace />}
          {activeView === "qms-internal-audits" && <InternalAuditsWorkspace />}
          {activeView === "qms-management-review" && <ManagementReviewWorkspace />}
          {activeView === "qms-reports" && <TqmsReportsWorkspace />}
          {activeView === "profile" && <ProfileWorkspace />}
          {activeView === "appearance" && <AppearanceSettingsWorkspace />}

          {activeView === "design-mockups" && (
            <InternalDesignMockups onBack={() => handleViewChange("home")} />
          )}

          {isWarm("clients") && (
            <WorkspacePane view="clients" activeView={activeView} keepMounted={isWarm("clients")}>
              <ClientManagementWorkspace onClientsChange={setClients} />
            </WorkspacePane>
          )}

          {isWarm("clients-dashboard") && (
            <WorkspacePane view="clients-dashboard" activeView={activeView} keepMounted={isWarm("clients-dashboard")}>
              <WorkspaceErrorBoundary title="Clients Dashboard">
                <ClientsDashboardWorkspace onClientsChange={setClients} />
              </WorkspaceErrorBoundary>
            </WorkspacePane>
          )}

          {activeView === "member-intelligence" && (
            <MemberIntelligenceWorkspace clients={clients} />
          )}

          {(activeView === "regulatory-dashboard" ||
            activeView === "regulatory-updates" ||
            activeView === "regulatory-impact" ||
            activeView === "regulatory-alerts") && (
            <RegulatoryIntelligenceWorkspace
              clients={clients}
              view={activeView}
            />
          )}

          {activeView === "client-onboarding" && <ClientOnboardingWorkspace />}

          {activeView === "assets" && (
            <AssetManagementWorkspace
              assets={assets}
              categories={assetCategories}
              locations={assetLocations}
              clients={clients}
              users={users}
              selectedAssetId={selectedAssetId}
              onSelectAsset={setSelectedAssetId}
              onAssetsChange={setAssets}
              onCategoriesChange={setAssetCategories}
              onLocationsChange={setAssetLocations}
            />
          )}

          {activeView === "inventory-management" && (
            <WorkspaceErrorBoundary title="Inventory">
              <InventoryManagementWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "procurement" && (
            <WorkspaceErrorBoundary title="Procurement">
              <ProcurementWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "fleet" && (
            <FleetWorkspace
              liveTelemetry={liveTelemetry}
              isRunning={isRunning}
              onOpenAssets={() => handleViewChange("assets")}
              users={users}
            />
          )}

          {activeView === "testing" && (
            <div className="space-y-6">
              <div ref={testingSandboxHostRef} />
              <TestingWeatherPanel liveTelemetry={liveTelemetry} />
            </div>
          )}

          {(isWarm("projects") ||
            isWarm("projects-dashboard") ||
            isWarm("projects-internal") ||
            isWarm("projects-external")) && (
            <div
              hidden={
                activeView !== "projects" &&
                activeView !== "projects-dashboard" &&
                activeView !== "projects-internal" &&
                activeView !== "projects-external"
              }
              className={
                activeView === "projects" ||
                activeView === "projects-dashboard" ||
                activeView === "projects-internal" ||
                activeView === "projects-external"
                  ? "min-w-0"
                  : "hidden"
              }
            >
              <ProjectsWorkspace
                clients={clients}
                scope={
                  activeView === "projects-internal"
                    ? "internal"
                    : activeView === "projects-external"
                      ? "external"
                      : "all"
                }
              />
            </div>
          )}

          {activeView === "grants" && <GrantsWorkspace />}
          {activeView === "business-central-dashboard" && <OnwardAirBusinessCentralDashboard />}

          {activeView === "recent-missions" && <RecentMissionsPanel />}

          {activeView === "webodm" && <WebODMWorkspace />}

          {isWarm("crm") && (
            <WorkspacePane view="crm" activeView={activeView} keepMounted={isWarm("crm")}>
              <CrmWorkspace onOpenConnections={() => handleViewChange("connections")} />
            </WorkspacePane>
          )}

          {isWarm("crm-meetings") && (
            <WorkspacePane view="crm-meetings" activeView={activeView} keepMounted={isWarm("crm-meetings")}>
              <MeetingsWorkspace />
            </WorkspacePane>
          )}

          {activeView === "crm-questions-test" && <CrmQuestionsTestWorkspace />}

          {activeView === "connections" && (
            <ConnectionsWorkspace onBackToCrm={() => handleViewChange("crm")} />
          )}

          {activeView === "representatives" && (
            <RepresentativesWorkspace
              representatives={representatives}
              selectedRepresentativeId={selectedRepresentativeId}
              onSelectRepresentative={setSelectedRepresentativeId}
              onRepresentativesChange={setRepresentatives}
            />
          )}

          {isWarm("financials") && (
            <WorkspacePane view="financials" activeView={activeView} keepMounted={isWarm("financials")}>
              <FinancialsWorkspace />
            </WorkspacePane>
          )}

          {activeView === "general-ledger" && <GeneralLedgerWorkspace />}

          {activeView === "accounts-receivable" && <AccountsReceivableWorkspace />}

          {activeView === "accounts-payable" && <AccountsPayableWorkspace />}

          {activeView === "financial-reports" && <FinancialReportsWorkspace />}

          {activeView === "wise" && <WiseWorkspace />}

          {activeView === "corporate-risk-register" &&
            (isBrowserTalantonImpactSurface() ? (
              <BoardGovernanceWorkspace section="risk" />
            ) : (
              <RiskRegisterWorkspace />
            ))}
          {activeView === "board-dashboard" && <BoardGovernanceWorkspace section="dashboard" />}
          {activeView === "board-meetings" &&
            (isBrowserTalantonImpactSurface() ? (
              <BoardGovernanceWorkspace section="meetings" />
            ) : isBrowserOnwardAirSurface() ? (
              <OnwardAirBoardMeetingsWorkspace />
            ) : (
              <BoardMeetingsWorkspace />
            ))}
          {activeView === "board-minutes" &&
            (isBrowserTalantonImpactSurface() ? (
              <BoardGovernanceWorkspace section="meetings" />
            ) : (
              <BoardGovernanceWorkspace section="minutes" />
            ))}
          {activeView === "board-members" && <BoardGovernanceWorkspace section="members" />}

          {activeView === "board-pack" &&
            (isBrowserOnwardAirSurface() ? (
              <OnwardAirBoardDecksWorkspace />
            ) : (
              <BoardPackCustomizerWorkspace />
            ))}

          {activeView === "expenses" && <ExpensesWorkspace />}

          {activeView === "hr" && <HrWorkspace mode="employees" />}

          {activeView === "hr-dashboard" && <HrWorkspace mode="dashboard" />}

          {activeView === "hr-org-chart" && <OrgChartWorkspace />}

          {activeView === "hr-recruitment" && <RecruitmentWorkspace />}

          {activeView === "hr-leave" && <LeaveManagementWorkspace />}

          {activeView === "hr-performance" && <PerformanceHubWorkspace />}

          {activeView === "hr-payroll" && <PayrollWorkspace />}

          {activeView === "hr-reports" && (
            <HrReportsWorkspace initialEmployeeId={searchParams.get("employeeId") ?? ""} />
          )}

          {activeView === "strategy" && <StrategyWorkspace />}

          {activeView === "potential-clients" && <PotentialClientsWorkspace />}

          {activeView === "whiteboard" && <WhiteboardWorkspace />}

          {activeView === "competitors" && (
            <WorkspaceErrorBoundary title="Competitors">
              <CompetitorsWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "sector" && <SectorWorkspace />}

          {activeView === "training" &&
            (isBrowserAbhiSurface() || isBrowserTalantonImpactSurface() ? (
              <AbhiComplianceTrainingWorkspace mode="courses" />
            ) : (
              <StaffTrainingWorkspace />
            ))}

          {activeView === "training-external" && <ExternalTrainingWorkspace />}

          {activeView === "oa-marketing-dashboard" && (
            <OnwardAirMarketingEventsWorkspace page="dashboard" />
          )}

          {activeView === "marketing-newsletter" &&
            (isBrowserOnwardAirSurface() ? (
              <OnwardAirMarketingEventsWorkspace page="newsletter" />
            ) : (
              <AbhiNewsletterWorkspace />
            ))}

          {activeView === "marketing-events" &&
            (isBrowserOnwardAirSurface() ? (
              <OnwardAirMarketingEventsWorkspace page="events" />
            ) : (
              <AbhiEventsWorkspace />
            ))}

          {activeView === "marketing-abhi-events" && <AbhiCalendarEventsWorkspace />}

          {activeView === "marketing-event-management" &&
            (isBrowserOnwardAirSurface() ? (
              <OnwardAirMarketingEventsWorkspace page="event-management" />
            ) : (
              <AbhiEventManagementWorkspace />
            ))}

          {activeView === "marketing-working-groups" && (
            <AbhiProgrammesWorkspace mode="working-groups" />
          )}

          {activeView === "marketing-us-accelerator" && (
            <AbhiProgrammesWorkspace mode="us-accelerator" />
          )}

          {activeView === "marketing-me-accelerator" && (
            <AbhiProgrammesWorkspace mode="me-accelerator" />
          )}

          {activeView === "marketing-training" &&
            (isBrowserAbhiSurface() ? (
              <AbhiComplianceTrainingWorkspace mode="courses" />
            ) : (
              <StaffTrainingWorkspace />
            ))}

          {activeView === "marketing-mailing-list" &&
            (isBrowserOnwardAirSurface() ? (
              <OnwardAirMarketingEventsWorkspace page="mailing-list" />
            ) : (
              <AbhiMailingListWorkspace />
            ))}

          {activeView === "training-dashboard" &&
            (isBrowserTalantonImpactSurface() ? (
              <WorkspaceErrorBoundary title="Training Dashboard">
                <TalantonTrainingDashboardWorkspace />
              </WorkspaceErrorBoundary>
            ) : isBrowserAbhiSurface() ? (
              <AbhiComplianceTrainingWorkspace mode="dashboard" />
            ) : (
              <TrainingDashboardWorkspace />
            ))}

          {activeView === "corporate-dashboard" && <CorporateDashboardWorkspace />}

          {(activeView === "corporate-information" ||
            Boolean(legacyCorporateViewToTab(activeView))) && (
            <CorporateInformationWorkspace
              tab={
                legacyCorporateViewToTab(activeView) ??
                (isCorporateInformationTab(searchParams.get("tab"))
                  ? (searchParams.get("tab") as CorporateInformationTab)
                  : "company-details")
              }
            />
          )}
          {activeView === "corporate-cap-table" && !isBrowserAbhiSurface() && (
            <CapTableWorkspace />
          )}

          {activeView === "portfolio-portal-overview" && isBrowserTalantonImpactSurface() && (
            <WorkspaceErrorBoundary title="Portfolio Portal Overview">
              <TalantonPortfolioPortalOverviewWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "external-client-access" &&
            (isBrowserTalantonImpactSurface() ? (
              <WorkspaceErrorBoundary title="Portal Management">
                <TalantonPortalManagementWorkspace />
              </WorkspaceErrorBoundary>
            ) : (
              <ExternalClientAccessWorkspace />
            ))}

          {activeView === "learning-library" && (
            <WorkspaceErrorBoundary title="Learning Library">
              <TalantonLearningLibraryWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "training-certifications" && (
            <WorkspaceErrorBoundary title="Certifications">
              <TalantonCertificationsWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "company-progress" && (
            <WorkspaceErrorBoundary title="Company Progress">
              <TalantonCompanyProgressWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "portfolio-courses" && isBrowserTalantonImpactSurface() && (
            <WorkspaceErrorBoundary title="Portfolio Courses">
              <TalantonPortfolioCoursesWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {isWarm("messaging") && (
            <WorkspacePane
              view="messaging"
              activeView={activeView}
              keepMounted={isWarm("messaging")}
            >
              <MessagingWorkspace />
            </WorkspacePane>
          )}

          {isWarm("communications") && (
            <WorkspacePane
              view="communications"
              activeView={activeView}
              keepMounted={isWarm("communications")}
            >
              <CommunicationsWorkspace />
            </WorkspacePane>
          )}

          {activeView === "social" && <SocialWorkspace />}

          {isWarm("settings") && (
            <WorkspacePane view="settings" activeView={activeView} keepMounted={isWarm("settings")}>
              <SettingsWorkspace />
            </WorkspacePane>
          )}

          {activeView === "billing" &&
            (isInternalHost ? <PlatformBillingWorkspace /> : <BillingWorkspace />)}

          {isWarm("calendar") && (
            <WorkspacePane view="calendar" activeView={activeView} keepMounted={isWarm("calendar")}>
              <CalendarWorkspace users={users} clients={clients} />
            </WorkspacePane>
          )}

          {activeView === "logistics" && (
            <LogisticsWorkspace key={`logistics-entry-${logisticsEntryId}`} />
          )}

          {isWarm("info-email") && (
            <WorkspacePane view="info-email" activeView={activeView} keepMounted={isWarm("info-email")}>
              <InfoEmailWorkspace />
            </WorkspacePane>
          )}

          {activeView === "files-internal" && (
            <FileRepositoryWorkspace
              scope="internal"
              initialFolderId={searchParams.get("folderId")}
            />
          )}

          {activeView === "unit311-details" && <Unit311DetailsWorkspace />}

          {activeView === "module-go-live" && <ModuleGoLiveWorkspace />}

          {activeView === "files-external" && <FileRepositoryWorkspace scope="external" />}

          {activeView === "files-client" && <ClientFilesExplorerWorkspace />}

          {activeView === "productivity-dashboard" && <ProductivityDashboardWorkspace />}

          {activeView === "support-overview" && <SupportWorkspace scope="overview" />}

          {activeView === "support" && <SupportWorkspace scope="all" />}

          {activeView === "support-mine" && <SupportWorkspace scope="mine" />}

          {activeView === "whatsapp-integration" && (
            <WorkspaceErrorBoundary title="WhatsApp Integration">
              <WhatsAppIntegrationWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "users" && <UserManagementWorkspace onUsersChange={setUsers} />}

          {activeView === "users-external" && <ExternalUsersWorkspace />}

          {activeView === "telemetry" && <TelemetryDashboard />}

          {activeView === "website-management" && <WebsiteManagementWorkspace />}

          {activeView === "website-uk-pavilion" && (
            <WorkspaceErrorBoundary title="UK Healthcare Pavilion">
              <AbhiUkPavilionWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "integrations" && (
            <WorkspaceErrorBoundary title="Integrations">
              <IntegrationsWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "platform-analytics" && isInternalHost && (
            <WorkspaceErrorBoundary title="Platform Analytics">
              <PlatformAnalyticsWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "website-analytics" && isInternalHost && (
            <WorkspaceErrorBoundary title="Website Analytics">
              <WebsiteAnalyticsWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {(activeView === "engineering" || activeView === "engineering-dashboard") && (
            <EngineeringDashboardWorkspace />
          )}

          {activeView === "engineering-resources" && <EngineeringResourcesWorkspace />}

          {activeView === "engineering-capacity" && <EngineeringCapacityWorkspace />}

          {(activeView === "technology" || activeView === "technology-dashboard") && (
            <TechnologyDashboardWorkspace />
          )}

          {activeView === "technology-devices" && (
            <TechnologyPlaceholderWorkspace module="devices" />
          )}

          {activeView === "technology-software" && <TechnologySoftwareWorkspace />}

          {activeView === "technology-telecommunications" && (
            <TechnologyPlaceholderWorkspace module="telecommunications" />
          )}

          {activeView === "technology-infrastructure" && (
            <TechnologyPlaceholderWorkspace module="infrastructure" />
          )}

          {activeView === "technology-reports" && (
            <TechnologyPlaceholderWorkspace module="reports" />
          )}

          {activeView === "technology-settings" && (
            <TechnologyPlaceholderWorkspace module="settings" />
          )}

          {activeView === "operations-dashboard" && <OperationsDashboardWorkspace />}

          {activeView === "fundraising-dashboard" && <FundraisingDashboardWorkspace />}
          {activeView === "fundraising-investors" && <FundraisingInvestorsWorkspace />}
          {activeView === "fundraising-pipeline" && <FundraisingPipelineWorkspace />}
          {activeView === "fundraising-meetings" && <FundraisingMeetingsWorkspace />}
          {activeView === "fundraising-pitch-decks" && <FundraisingPitchDecksWorkspace />}
          {activeView === "fundraising-data-rooms" && <FundraisingDataRoomsWorkspace />}

          {activeView === "oa-engineering-overview" && <EngineeringOverviewWorkspace />}
          {activeView === "oa-programs-milestones" && <EngineeringProgramsWorkspace />}
          {activeView === "oa-team-capacity" && <EngineeringTeamWorkspace />}
          {activeView === "oa-supply-dependencies" && <EngineeringSupplyWorkspace />}
          {activeView === "oa-assurance-certification" && <EngineeringAssuranceWorkspace />}
          {activeView === "oa-engineering-risks" && <EngineeringRisksWorkspace />}
          {activeView === "oa-engineering-integrations" && <EngineeringIntegrationsWorkspace />}

          {activeView === "oa-test-plans" && (
            <OnwardAirPlaceholderWorkspace
              title="Test Plans"
              group="Engineering"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-test-runs" && (
            <OnwardAirPlaceholderWorkspace
              title="Test Runs"
              group="Engineering"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-defects" && (
            <OnwardAirPlaceholderWorkspace
              title="Defects"
              group="Engineering"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-uat-tracking" && (
            <OnwardAirPlaceholderWorkspace
              title="UAT Tracking"
              group="Engineering"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-platform-health" && (
            <OnwardAirPlaceholderWorkspace
              title="Platform Health"
              group="Operations"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-monitoring" && (
            <OnwardAirPlaceholderWorkspace
              title="Monitoring"
              group="Operations"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-incident-management" && (
            <OnwardAirPlaceholderWorkspace
              title="Incident Management"
              group="Operations"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-change-management" && (
            <OnwardAirPlaceholderWorkspace
              title="Change Management"
              group="Operations"
              description="Legacy placeholder retained for compatibility."
            />
          )}
          {activeView === "oa-release-tracking" && (
            <OnwardAirPlaceholderWorkspace
              title="Release Tracking"
              group="Operations"
              description="Legacy placeholder retained for compatibility."
            />
          )}

          {activeView === "oa-ip-overview" && (
            <WorkspaceErrorBoundary title="IP Overview">
              <OnwardAirIpPatentsWorkspace section="overview" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ip-dashboard" && (
            <WorkspaceErrorBoundary title="Patents Dashboard">
              <OnwardAirIpPatentsWorkspace section="dashboard" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ip-register" && (
            <WorkspaceErrorBoundary title="Patent Register">
              <OnwardAirIpPatentsWorkspace section="register" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ip-portfolio" && (
            <WorkspaceErrorBoundary title="Patent Portfolio">
              <OnwardAirIpPatentsWorkspace section="portfolio" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ip-documents" && (
            <WorkspaceErrorBoundary title="Patent Documents">
              <OnwardAirIpPatentsWorkspace section="documents" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ip-search" && (
            <WorkspaceErrorBoundary title="IP Search">
              <OnwardAirIpPatentsWorkspace section="search" />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-competitor-intelligence" && (
            <WorkspaceErrorBoundary title="Competitor Intelligence">
              <OnwardAirCompetitorIntelligenceWorkspace />
            </WorkspaceErrorBoundary>
          )}
          {activeView === "oa-ecosystem-partners" && (
            <WorkspaceErrorBoundary title="Ecosystem Partners">
              <OnwardAirEcosystemPartnersWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "portfolio-intelligence-briefing" && (
            <WorkspaceErrorBoundary title="Portfolio Intelligence">
              <PortfolioIntelligenceBriefingWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "portfolio-intelligence-company" && (
            <WorkspaceErrorBoundary title="Company Intelligence">
              <CompanyIntelligenceWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "impact-intelligence-dashboard" && (
            <WorkspaceErrorBoundary title="Impact Intelligence">
              <ImpactIntelligenceDashboardWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "impact-intelligence-company" && (
            <WorkspaceErrorBoundary title="Company Impact">
              <CompanyImpactWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "annual-impact-report" && (
            <WorkspaceErrorBoundary title="Annual Impact Report">
              <AnnualImpactReportWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "quarterly-portfolio-update" && (
            <WorkspaceErrorBoundary title="Quarterly Portfolio Update">
              <QuarterlyPortfolioUpdateWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "opportunity-intelligence" && (
            <WorkspaceErrorBoundary title="Opportunity Intelligence">
              <OpportunityIntelligenceWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "portfolio-stories" && (
            <WorkspaceErrorBoundary title="Portfolio Stories">
              <PortfolioStoriesWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "journey-stories" && (
            <WorkspaceErrorBoundary title="Journey Stories">
              <JourneyStoriesWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "stories-newsletter" && (
            <WorkspaceErrorBoundary title="Digital Newsletter">
              <StoriesNewsletterWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "stories-media-library" && (
            <WorkspaceErrorBoundary title="Media Library">
              <MediaLibraryWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {activeView === "stories-mailing-list" && (
            <WorkspaceErrorBoundary title="Mailing List Management">
              <StoriesMailingListWorkspace />
            </WorkspaceErrorBoundary>
          )}

          {(activeView === "funds-dashboard" ||
            activeView === "funds-impact" ||
            activeView === "funds-momentum" ||
            activeView === "funds-stewards" ||
            activeView === "funds-investors" ||
            activeView === "funds-commitments" ||
            activeView === "funds-performance") && (
            <WorkspaceErrorBoundary title="Funds">
              <TalantonFundsWorkspace view={activeView} />
            </WorkspaceErrorBoundary>
          )}

          {(activeView === "portfolio-companies" ||
            activeView === "portfolio-dashboard" ||
            activeView === "portfolio-directory" ||
            activeView === "portfolio-company" ||
            (activeView === "portfolio-courses" && !isBrowserTalantonImpactSurface()) ||
            activeView === "portfolio-course-management" ||
            activeView === "portfolio-my-training" ||
            activeView === "portfolio-compliance-dashboard" ||
            activeView === "portfolio-policies" ||
            activeView === "portfolio-risk-register" ||
            activeView === "portfolio-action-tracking" ||
            activeView === "portfolio-report-compliance" ||
            activeView === "portfolio-report-company" ||
            activeView === "portfolio-report-training" ||
            activeView === "portfolio-analytics-performance" ||
            activeView === "portfolio-analytics-revenue" ||
            activeView === "portfolio-analytics-compliance" ||
            activeView === "portfolio-analytics-risk" ||
            activeView === "portfolio-analytics-geo" ||
            activeView === "portfolio-analytics-quarterly" ||
            activeView === "portfolio-quarterly-reporting") && (
            <WorkspaceErrorBoundary title="Talanton Impact">
              <TalantonPortfolioWorkspace view={activeView} />
            </WorkspaceErrorBoundary>
          )}
        </div>
      </div>
      <AdminPerformanceMode activeView={activeView} />
      </SurveyOperationsShell>
    </InternalOperationsBasePathProvider>
    </OperatorEntitlementsProvider>
  );
}

function AccessViewGuard({
  activeView,
  onRedirect,
  isInternalHost,
}: {
  activeView: InternalOperationsView;
  onRedirect: (view: InternalOperationsView) => void;
  isInternalHost: boolean;
}) {
  const { allowedViews, ready } = useOperatorEntitlements();

  useEffect(() => {
    if (!ready) return;
    if (
      (activeView === "platform-analytics" || activeView === "website-analytics") &&
      !isInternalHost
    ) {
      onRedirect("home");
      return;
    }
    if (!isViewAllowedForGrants(activeView, allowedViews)) {
      onRedirect("home");
    }
  }, [activeView, allowedViews, isInternalHost, onRedirect, ready]);

  return null;
}
