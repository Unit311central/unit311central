import { SAEC_SLUG } from "@/lib/saec-surface";
import type {
  IntelligenceDomainProvider,
  IntelligenceRecord,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";
import {
  saecClientIntelligenceRecords,
  saecCompanyIntelligenceRecords,
  saecMarketIntelligenceRecords,
} from "@/lib/saec/demo/intelligence-records";

const SLUG = SAEC_SLUG;

const SAEC_SOURCES = [
  {
    id: "saec-src-ops",
    workspaceSlug: SLUG,
    domainId: "company-intelligence",
    name: "OmniTransit operations",
    kind: "ops_derived" as const,
    refreshCadence: "P1D",
    description: "Installations, maintenance SLAs, and project delivery signals.",
  },
  {
    id: "saec-src-clients",
    workspaceSlug: SLUG,
    domainId: "client-intelligence",
    name: "Client & CRM",
    kind: "crm_derived" as const,
    refreshCadence: "P1D",
    description: "Shopping centres, hospitals, and property portfolios.",
  },
  {
    id: "saec-src-market",
    workspaceSlug: SLUG,
    domainId: "market-intelligence",
    name: "South African lift market",
    kind: "public_feed" as const,
    refreshCadence: "P7D",
    description: "Competition, regulation, construction pipeline, and technology trends.",
  },
];

function paginate(records: IntelligenceRecord[], limit = 50, offset = 0) {
  return { records: records.slice(offset, offset + limit), total: records.length };
}

function filterRecords(records: readonly IntelligenceRecord[], query?: string) {
  const q = query?.trim().toLowerCase();
  if (!q) return [...records];
  return records.filter(
    (record) =>
      record.title.toLowerCase().includes(q) ||
      record.summary.toLowerCase().includes(q) ||
      record.tags.some((tag) => tag.label.toLowerCase().includes(q)),
  );
}

function companyProvider(): IntelligenceDomainProvider {
  return {
    domainId: "company-intelligence",
    async listSources(ctx) {
      return SAEC_SOURCES.filter((source) => source.domainId === ctx.domainId);
    },
    async searchRecords(_ctx, query) {
      return paginate(
        filterRecords(saecCompanyIntelligenceRecords(), query.filter?.search),
        query.limit,
        query.offset,
      );
    },
    async getRecord(_ctx, recordId) {
      return saecCompanyIntelligenceRecords().find((row) => row.id === recordId) ?? null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(ctx.workspaceSlug, "company-intelligence", "OmniTransit company intelligence", [
        {
          id: "operations",
          title: "Operational highlights",
          bullets: saecCompanyIntelligenceRecords().slice(0, 3).map((row) => row.summary),
        },
      ]);
    },
  };
}

function clientProvider(): IntelligenceDomainProvider {
  return {
    domainId: "client-intelligence",
    async listSources(ctx) {
      return SAEC_SOURCES.filter((source) => source.domainId === ctx.domainId);
    },
    async searchRecords(_ctx, query) {
      return paginate(
        filterRecords(saecClientIntelligenceRecords(), query.filter?.search),
        query.limit,
        query.offset,
      );
    },
    async getRecord(_ctx, recordId) {
      return saecClientIntelligenceRecords().find((row) => row.id === recordId) ?? null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(ctx.workspaceSlug, "client-intelligence", "OmniTransit client intelligence", [
        {
          id: "portfolio",
          title: "Key accounts",
          bullets: saecClientIntelligenceRecords().map((row) => `${row.title} — ${row.summary}`),
        },
      ]);
    },
  };
}

function marketProvider(): IntelligenceDomainProvider {
  return {
    domainId: "market-intelligence",
    async listSources(ctx) {
      return SAEC_SOURCES.filter((source) => source.domainId === ctx.domainId);
    },
    async searchRecords(_ctx, query) {
      return paginate(
        filterRecords(saecMarketIntelligenceRecords(), query.filter?.search),
        query.limit,
        query.offset,
      );
    },
    async getRecord(_ctx, recordId) {
      return saecMarketIntelligenceRecords().find((row) => row.id === recordId) ?? null;
    },
    async buildBriefing(ctx) {
      return briefingFromSections(ctx.workspaceSlug, "market-intelligence", "South African market intelligence", [
        {
          id: "signals",
          title: "Market signals",
          bullets: saecMarketIntelligenceRecords().map((row) => row.summary),
        },
      ]);
    },
  };
}

export const saecIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "saec-intelligence",
  slug: SLUG,
  label: "OmniTransit Intelligence",
  hostSurface: "customer",
  domains: [
    {
      id: "company-intelligence",
      label: "Company Intelligence",
      description: "OmniTransit operational and performance intelligence.",
      navViews: ["demo-company-intelligence"],
      providerId: "saec.company-intelligence",
    },
    {
      id: "client-intelligence",
      label: "Client Intelligence",
      description: "Client health across property and healthcare portfolios.",
      navViews: ["demo-client-intelligence"],
      providerId: "saec.client-intelligence",
    },
    {
      id: "market-intelligence",
      label: "Market Intelligence",
      description: "South African elevator and escalator market monitor.",
      navViews: ["demo-market-intelligence"],
      providerId: "saec.market-intelligence",
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
  providers: [companyProvider(), clientProvider(), marketProvider()],
  eaToolNames: [
    "intelligence.getBriefing",
    "intelligence.searchRecords",
    "getSmartInsights",
    "getDailyBrief",
  ],
};
