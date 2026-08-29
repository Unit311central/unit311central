import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import type {
  IntelligenceDomainProvider,
  IntelligenceRecord,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import {
  buildNorthstarClientIntelligence,
  buildNorthstarCompanyIntelligence,
  buildNorthstarMarketIntelligence,
  northstarClientIntelligenceRecords,
  northstarCompanyIntelligenceRecords,
  northstarMarketIntelligenceRecords,
} from "@/lib/demo/northstar-intelligence";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";

const SLUG = DEMO_WORKSPACE_SLUG;

const DEMO_SOURCES = [
  {
    id: "nst-src-financials",
    workspaceSlug: SLUG,
    domainId: "company-intelligence",
    name: "Northstar Financials GL",
    kind: "ops_derived" as const,
    refreshCadence: "P1D",
    description: "Revenue, margin, opex, and cash from the demo financial model.",
  },
  {
    id: "nst-src-engineering",
    workspaceSlug: SLUG,
    domainId: "company-intelligence",
    name: "Engineering & procurement",
    kind: "ops_derived" as const,
    refreshCadence: "P1D",
    description: "Atlas programme burn, Voltex lead times, firmware QA queue.",
  },
  {
    id: "nst-src-crm",
    workspaceSlug: SLUG,
    domainId: "client-intelligence",
    name: "Northstar CRM + Support Desk",
    kind: "crm_derived" as const,
    refreshCadence: "P1D",
    description: "Account health, tickets, renewals, and AR ageing per client.",
  },
  {
    id: "nst-src-market",
    workspaceSlug: SLUG,
    domainId: "market-intelligence",
    name: "Market & regulatory monitor",
    kind: "public_feed" as const,
    refreshCadence: "P7D",
    description: "Competitive, regulatory, sector, and macro signals for industrial IoT.",
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

const dashboardProvider: IntelligenceDomainProvider = {
  domainId: "dashboard",
  async buildBriefing(ctx) {
    const company = buildNorthstarCompanyIntelligence();
    const client = buildNorthstarClientIntelligence();
    const market = buildNorthstarMarketIntelligence();
    return briefingFromSections(ctx.workspaceSlug, "dashboard", "Northstar Intelligence overview", [
      {
        id: "company",
        title: "Company Intelligence",
        bullets: [company.postureReason, ...company.priorityActions.slice(0, 2).map((a) => a.title)],
      },
      {
        id: "client",
        title: "Client Intelligence",
        bullets: [
          client.postureReason,
          `${client.summary.atRisk} at-risk accounts`,
          `${client.summary.renewalNext90Days} renewals in 90 days`,
        ],
      },
      {
        id: "market",
        title: "Market Intelligence",
        bullets: [market.postureReason, ...market.priorityActions.slice(0, 2).map((a) => a.title)],
      },
    ], {
      posture: company.posture,
      postureReason: "Consolidated view across company, client, and market intelligence.",
      recommendedActions: company.priorityActions.slice(0, 3).map((action) => action.title),
    });
  },
};

const companyProvider: IntelligenceDomainProvider = {
  domainId: "company-intelligence",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(
      filterRecords(northstarCompanyIntelligenceRecords(), query.filter?.search),
      query.limit,
      query.offset,
    );
  },
  async getRecord(_ctx, recordId) {
    return northstarCompanyIntelligenceRecords().find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const data = buildNorthstarCompanyIntelligence();
    return briefingFromSections(ctx.workspaceSlug, "company-intelligence", "Company Intelligence briefing", [
      {
        id: "performance",
        title: "Performance",
        bullets: data.kpis.slice(0, 4).map((kpi) => `${kpi.label}: ${kpi.value} — ${kpi.hint}`),
      },
      {
        id: "delivery",
        title: "Delivery & supply",
        bullets: data.deliverySignals.map((signal) => `${signal.title} — ${signal.detail}`),
      },
    ], {
      posture: data.posture,
      postureReason: data.postureReason,
      recommendedActions: data.priorityActions.map((action) => action.title),
    });
  },
};

const clientProvider: IntelligenceDomainProvider = {
  domainId: "client-intelligence",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(
      filterRecords(northstarClientIntelligenceRecords(), query.filter?.search),
      query.limit,
      query.offset,
    );
  },
  async getRecord(_ctx, recordId) {
    return northstarClientIntelligenceRecords().find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const data = buildNorthstarClientIntelligence();
    return briefingFromSections(ctx.workspaceSlug, "client-intelligence", "Client Intelligence briefing", [
      {
        id: "at-risk",
        title: "At-risk accounts",
        bullets: data.rows
          .filter((row) => row.healthBand === "at-risk")
          .map((row) => `${row.name} (${row.healthScore}) — ${row.issues[0] ?? "Review"}`),
      },
      {
        id: "renewals",
        title: "Renewals ≤90 days",
        bullets: data.rows
          .filter((row) => row.renewalInDays != null && row.renewalInDays <= 90)
          .map((row) => `${row.name} — ${row.renewalInDays} days`),
      },
    ], {
      posture: data.posture,
      postureReason: data.postureReason,
      recommendedActions: data.priorityActions.map((action) => action.title),
    });
  },
};

const marketProvider: IntelligenceDomainProvider = {
  domainId: "market-intelligence",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(
      filterRecords(northstarMarketIntelligenceRecords(), query.filter?.search),
      query.limit,
      query.offset,
    );
  },
  async getRecord(_ctx, recordId) {
    return northstarMarketIntelligenceRecords().find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const data = buildNorthstarMarketIntelligence();
    return briefingFromSections(ctx.workspaceSlug, "market-intelligence", "Market Intelligence briefing", [
      {
        id: "competitive",
        title: "Competitive",
        bullets: data.signals
          .filter((signal) => signal.category === "competitive")
          .map((signal) => `${signal.title} — ${signal.implication}`),
      },
      {
        id: "regulatory",
        title: "Regulatory & macro",
        bullets: data.signals
          .filter((signal) => signal.category !== "competitive")
          .map((signal) => signal.title),
      },
    ], {
      posture: data.posture,
      postureReason: data.postureReason,
      recommendedActions: data.priorityActions.map((action) => action.title),
    });
  },
};

export const demoIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "demo-intelligence",
  slug: SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[SLUG],
  hostSurface: "demo",
  domains: [
    {
      id: "dashboard",
      label: "Dashboard",
      description: "Overview across Company, Client, and Market Intelligence.",
      navViews: ["intelligence-dashboard"],
      providerId: "demo.dashboard",
    },
    {
      id: "company-intelligence",
      label: "Company Intelligence",
      description:
        "Northstar financial and operational performance — revenue, margin, cash, Atlas delivery, and supply chain.",
      navViews: ["demo-company-intelligence"],
      providerId: "demo.company-intelligence",
    },
    {
      id: "client-intelligence",
      label: "Client Intelligence",
      description:
        "Account health, renewal risk, support patterns, and specific actions to retain and grow clients.",
      navViews: ["demo-client-intelligence"],
      providerId: "demo.client-intelligence",
    },
    {
      id: "market-intelligence",
      label: "Market Intelligence",
      description:
        "Competitive moves, regulation, sector dynamics, and macro demand with implications for Northstar.",
      navViews: ["demo-market-intelligence"],
      providerId: "demo.market-intelligence",
    },
  ],
  uiViews: [
    { viewId: "intelligence-dashboard", domainId: "dashboard", label: "Dashboard" },
    { viewId: "demo-company-intelligence", domainId: "company-intelligence", label: "Company Intelligence" },
    { viewId: "demo-client-intelligence", domainId: "client-intelligence", label: "Client Intelligence" },
    { viewId: "demo-market-intelligence", domainId: "market-intelligence", label: "Market Intelligence" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["demo", "internal"],
    denyExternal: true,
  },
  providers: [dashboardProvider, companyProvider, clientProvider, marketProvider],
  eaBridge: {
    intentResolvers: [
      async ({ message }) => {
        const { resolveNorthstarExecutiveIntelligenceIntent } = await import(
          "@/lib/demo/executive-intelligence-intent"
        );
        const { packToolRoute } = await import(
          "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers"
        );
        const intent = resolveNorthstarExecutiveIntelligenceIntent(message);
        return intent ? packToolRoute(intent) : null;
      },
    ],
  },
  eaToolNames: [
    "northstar.getExecutiveBriefing",
    "northstar.getOrgHealth",
    "northstar.queryActions",
    "northstar.getBoardInsights",
    "northstar.queryModule",
    "intelligence.getBriefing",
    "intelligence.searchRecords",
    "getSmartInsights",
    "getDailyBrief",
  ],
};
