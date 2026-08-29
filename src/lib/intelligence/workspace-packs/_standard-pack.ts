import type {
  IntelligenceDomainProvider,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import {
  createDashboardIntelligenceProvider,
  createEmptyIntelligenceProvider,
} from "@/lib/intelligence/workspace-packs/_customer-providers";

export type StandardIntelligencePackOptions = {
  id: string;
  slug: string;
  label: string;
  hostSurface: string;
  clientViewId?: string;
  clientDomainId?: string;
  clientLabel?: string;
  companyProvider?: IntelligenceDomainProvider;
  clientProvider?: IntelligenceDomainProvider;
  marketProvider?: IntelligenceDomainProvider;
  dashboardProvider?: IntelligenceDomainProvider;
  extraDomains?: IntelligenceWorkspacePackRegistration["domains"];
  extraUiViews?: IntelligenceWorkspacePackRegistration["uiViews"];
  extraProviders?: IntelligenceDomainProvider[];
  accessPolicy?: IntelligenceWorkspacePackRegistration["accessPolicy"];
  eaBridge?: IntelligenceWorkspacePackRegistration["eaBridge"];
  eaToolNames?: IntelligenceWorkspacePackRegistration["eaToolNames"];
  specialistActions?: IntelligenceWorkspacePackRegistration["specialistActions"];
};

const STANDARD_EA_TOOL_NAMES = [
  "intelligence.getBriefing",
  "intelligence.searchRecords",
  "getSmartInsights",
  "getDailyBrief",
] as const;

export function buildStandardIntelligencePack(
  options: StandardIntelligencePackOptions,
): IntelligenceWorkspacePackRegistration {
  const clientViewId = options.clientViewId ?? "demo-client-intelligence";
  const clientDomainId = options.clientDomainId ?? "client-intelligence";
  const clientLabel = options.clientLabel ?? "Client Intelligence";

  const companyProvider =
    options.companyProvider ?? createEmptyIntelligenceProvider(options.slug, "company-intelligence");
  const clientProvider =
    options.clientProvider ?? createEmptyIntelligenceProvider(options.slug, clientDomainId);
  const marketProvider =
    options.marketProvider ?? createEmptyIntelligenceProvider(options.slug, "market-intelligence");
  const dashboardProvider =
    options.dashboardProvider ??
    createDashboardIntelligenceProvider(options.slug, clientLabel);

  const standardDomains: IntelligenceWorkspacePackRegistration["domains"] = [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Overview across Company, Client, and Market Intelligence.",
      navViews: ["intelligence-dashboard"],
      providerId: `${options.id}.dashboard`,
    },
    {
      id: "company-intelligence",
      label: "Company Intelligence",
      description: "Company performance and operational intelligence for your workspace.",
      navViews: ["demo-company-intelligence"],
      providerId: `${options.id}.company-intelligence`,
    },
    {
      id: clientDomainId,
      label: clientLabel,
      description: `${clientLabel} for your workspace.`,
      navViews: [clientViewId],
      providerId: `${options.id}.${clientDomainId}`,
    },
    {
      id: "market-intelligence",
      label: "Market Intelligence",
      description: "Market, sector, and competitive intelligence.",
      navViews: ["demo-market-intelligence"],
      providerId: `${options.id}.market-intelligence`,
    },
    ...(options.extraDomains ?? []),
  ];

  const standardUiViews: IntelligenceWorkspacePackRegistration["uiViews"] = [
    { viewId: "intelligence-dashboard", domainId: "dashboard", label: "Dashboard" },
    {
      viewId: "demo-company-intelligence",
      domainId: "company-intelligence",
      label: "Company Intelligence",
    },
    { viewId: clientViewId, domainId: clientDomainId, label: clientLabel },
    {
      viewId: "demo-market-intelligence",
      domainId: "market-intelligence",
      label: "Market Intelligence",
    },
    ...(options.extraUiViews ?? []),
  ];

  return {
    id: options.id,
    slug: options.slug,
    label: options.label,
    hostSurface: options.hostSurface,
    domains: standardDomains,
    uiViews: standardUiViews,
    accessPolicy: options.accessPolicy ?? {
      defaultAllowedHostSurfaces: ["customer", "demo", "internal"],
      denyExternal: false,
    },
    providers: [
      dashboardProvider,
      companyProvider,
      clientProvider,
      marketProvider,
      ...(options.extraProviders ?? []),
    ],
    eaBridge: options.eaBridge,
    eaToolNames: options.eaToolNames ?? [...STANDARD_EA_TOOL_NAMES],
    specialistActions: options.specialistActions,
  };
}
