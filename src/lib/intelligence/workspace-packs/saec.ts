import { SAEC_SLUG } from "@/lib/saec-surface";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import type { IntelligenceDomainProvider, IntelligenceRecord } from "@/lib/intelligence/types";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";
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

const dashboardProvider: IntelligenceDomainProvider = {
  domainId: "dashboard",
  async buildBriefing(ctx) {
    return briefingFromSections(ctx.workspaceSlug, "dashboard", "OmniTransit Intelligence overview", [
      {
        id: "company",
        title: "Company Intelligence",
        bullets: saecCompanyIntelligenceRecords().slice(0, 2).map((row) => row.summary),
      },
      {
        id: "client",
        title: "Client Intelligence",
        bullets: saecClientIntelligenceRecords().slice(0, 2).map((row) => `${row.title} — ${row.summary}`),
      },
      {
        id: "market",
        title: "Market Intelligence",
        bullets: saecMarketIntelligenceRecords().slice(0, 2).map((row) => row.summary),
      },
    ]);
  },
};

export const saecIntelligencePack = buildStandardIntelligencePack({
  id: "saec-intelligence",
  slug: SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[SLUG],
  hostSurface: "customer",
  companyProvider: companyProvider(),
  clientProvider: clientProvider(),
  marketProvider: marketProvider(),
  dashboardProvider,
});
