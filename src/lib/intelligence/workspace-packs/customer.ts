/**
 * Generic customer workspace intelligence pack — no per-slug registration required.
 */

import type {
  IntelligenceDomainProvider,
  IntelligenceRecord,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";

const CUSTOMER_INTELLIGENCE_SLUG = "__customer__";

const CUSTOMER_SOURCES = [
  {
    id: "customer-src-company",
    workspaceSlug: CUSTOMER_INTELLIGENCE_SLUG,
    domainId: "company-intelligence",
    name: "Workspace operations",
    kind: "ops_derived" as const,
    refreshCadence: "P1D",
    description: "Company performance signals from your workspace modules.",
  },
  {
    id: "customer-src-clients",
    workspaceSlug: CUSTOMER_INTELLIGENCE_SLUG,
    domainId: "client-intelligence",
    name: "Client & CRM data",
    kind: "crm_derived" as const,
    refreshCadence: "P1D",
    description: "Client health, pipeline, and support patterns.",
  },
  {
    id: "customer-src-market",
    workspaceSlug: CUSTOMER_INTELLIGENCE_SLUG,
    domainId: "market-intelligence",
    name: "Market monitor",
    kind: "public_feed" as const,
    refreshCadence: "P7D",
    description: "Sector, competitive, and macro signals relevant to your business.",
  },
];

function emptyRecords(): IntelligenceRecord[] {
  return [];
}

function emptyProvider(domainId: string): IntelligenceDomainProvider {
  return {
    domainId,
    async listSources(ctx) {
      return CUSTOMER_SOURCES.filter((source) => source.domainId === ctx.domainId);
    },
    async searchRecords() {
      return { records: emptyRecords(), total: 0 };
    },
    async getRecord() {
      return null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(
        ctx.workspaceSlug,
        domainId,
        "Intelligence briefing",
        [
          {
            id: "getting-started",
            title: "Getting started",
            bullets: [
              "Connect your operational modules to populate intelligence signals.",
              "Use Company, Client, and Market Intelligence views for structured briefings.",
            ],
          },
        ],
        {
          posture: "watch",
          postureReason: "Intelligence data will populate as your workspace modules gather activity.",
          recommendedActions: ["Open each Intelligence function to review available signals."],
        },
      );
    },
  };
}

export const customerIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "customer-intelligence",
  slug: CUSTOMER_INTELLIGENCE_SLUG,
  label: "Intelligence",
  hostSurface: "customer",
  domains: [
    {
      id: "company-intelligence",
      label: "Company Intelligence",
      description: "Company performance and operational intelligence for your workspace.",
      navViews: ["demo-company-intelligence"],
      providerId: "customer.company-intelligence",
    },
    {
      id: "client-intelligence",
      label: "Client Intelligence",
      description: "Client health, pipeline, and support intelligence.",
      navViews: ["demo-client-intelligence"],
      providerId: "customer.client-intelligence",
    },
    {
      id: "market-intelligence",
      label: "Market Intelligence",
      description: "Market, sector, and competitive intelligence.",
      navViews: ["demo-market-intelligence"],
      providerId: "customer.market-intelligence",
    },
  ],
  uiViews: [
    { viewId: "demo-company-intelligence", domainId: "company-intelligence", label: "Company Intelligence" },
    { viewId: "demo-client-intelligence", domainId: "client-intelligence", label: "Client Intelligence" },
    { viewId: "demo-market-intelligence", domainId: "market-intelligence", label: "Market Intelligence" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["customer", "demo", "internal"],
    denyExternal: false,
  },
  providers: [
    emptyProvider("company-intelligence"),
    emptyProvider("client-intelligence"),
    emptyProvider("market-intelligence"),
  ],
  eaToolNames: [
    "intelligence.getBriefing",
    "intelligence.searchRecords",
    "getSmartInsights",
    "getDailyBrief",
  ],
};

export const CUSTOMER_INTELLIGENCE_PACK_SLUG = CUSTOMER_INTELLIGENCE_SLUG;
