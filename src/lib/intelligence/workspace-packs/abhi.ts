import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import { resolveAbhiExecutiveIntelligenceIntent } from "@/lib/abhi/executive-intelligence-intent";
import type { ManagedClient } from "@/lib/client-management-data";
import {
  buildMemberIntelligencePortfolio,
  filterMemberIntelligenceRows,
  type AbhiMemberIntelligenceRow,
} from "@/lib/abhi/member-intelligence";
import {
  ABHI_REGULATORY_SOURCES,
  buildAbhiRegulatoryDashboard,
  type AbhiRegulatoryUpdate,
} from "@/lib/abhi/regulatory-intelligence";
import { ABHI_SLUG } from "@/lib/abhi-surface";
import { INTELLIGENCE_WORKSPACE_NAV_LABELS } from "@/lib/intelligence/intelligence-nav-labels";
import type {
  IntelligenceDomainProvider,
  IntelligenceProviderContext,
} from "@/lib/intelligence/types";
import {
  abhiCompanyIntelligenceRecords,
  abhiMarketIntelligenceRecords,
} from "@/lib/abhi/intelligence-records";
import { createCustomerIntelligenceSources } from "@/lib/intelligence/workspace-packs/_customer-providers";
import { briefingFromSections, paginateRecords } from "@/lib/intelligence/workspace-packs/_helpers";
import type { IntelligenceRecord } from "@/lib/intelligence/types";
import { buildStandardIntelligencePack } from "@/lib/intelligence/workspace-packs/_standard-pack";

const SLUG = ABHI_SLUG;

function clientsFromContext(ctx: IntelligenceProviderContext): ManagedClient[] {
  const raw = ctx.data?.clients;
  return Array.isArray(raw) ? (raw as ManagedClient[]) : [];
}

function memberRecord(row: AbhiMemberIntelligenceRow) {
  return {
    id: `member:${row.id}`,
    workspaceSlug: SLUG,
    domainId: "member" as const,
    title: row.memberName,
    summary: `${row.relationshipStatus} · renewal ${row.renewalDate}`,
    severity:
      row.renewalRisk === "High" ? ("high" as const) : row.renewalRisk === "Medium" ? ("medium" as const) : ("low" as const),
    score: {
      value: row.healthScore,
      band: row.healthBand === "At Risk" ? ("critical" as const) : row.healthBand === "Needs Attention" ? ("watch" as const) : ("healthy" as const),
      label: row.healthBand,
    },
    categories: [{ id: row.membershipType, label: row.membershipType }],
    tags: [{ id: row.renewalRisk, label: `Renewal ${row.renewalRisk}` }],
    entityRefs: [{ entityType: "member", entityId: row.id, label: row.memberName }],
  };
}

function regulatoryRecord(update: AbhiRegulatoryUpdate) {
  return {
    id: `regulatory:${update.id}`,
    workspaceSlug: SLUG,
    domainId: "regulatory" as const,
    title: update.title,
    summary: update.summary,
    severity:
      update.severity === "Critical"
        ? ("critical" as const)
        : update.severity === "High"
          ? ("high" as const)
          : update.severity === "Medium"
            ? ("medium" as const)
            : ("low" as const),
    categories: [{ id: update.category, label: update.category }],
    tags: [{ id: update.sourceId, label: update.sourceName }],
    occurredAt: update.publicationDate,
    entityRefs: [{ entityType: "regulatory_update", entityId: update.id, label: update.title }],
  };
}

const memberProvider: IntelligenceDomainProvider = {
  domainId: "member",
  async searchRecords(ctx, query) {
    const portfolio = buildMemberIntelligencePortfolio(clientsFromContext(ctx));
    let rows = portfolio.rows;
    const filter = query.filter?.tags?.[0];
    if (filter === "at-risk") {
      rows = filterMemberIntelligenceRows(rows, "at-risk");
    }
    const q = query.filter?.search?.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) => r.memberName.toLowerCase().includes(q));
    }
    return paginateRecords(rows, memberRecord, query.limit, query.offset);
  },
  async buildBriefing(ctx) {
    const portfolio = buildMemberIntelligencePortfolio(clientsFromContext(ctx));
    const actions = portfolio.aiIntelligence.priorityActions;
    return briefingFromSections(ctx.workspaceSlug, "member", "Member intelligence briefing", [
      {
        id: "portfolio",
        title: "Portfolio posture",
        bullets: [
          `${portfolio.summary.activeMembers} active members`,
          `${portfolio.summary.atRiskMembers} at risk`,
          `${portfolio.summary.renewalsDueIn90Days} renewals due in 90 days`,
        ],
      },
      {
        id: "attention",
        title: "Requires attention",
        bullets: actions.slice(0, 5).map((a) => `${a.memberName}: ${a.reasons[0] ?? "Review"}`),
      },
    ], {
      posture: portfolio.summary.atRiskMembers > 0 ? "elevated" : "healthy",
      postureReason: `${portfolio.summary.activeMembers} active members · ${portfolio.summary.atRiskMembers} at risk · ${portfolio.summary.renewalsDueIn90Days} renewals in 90 days`,
      recommendedActions: actions.slice(0, 2).map((a) => `Review ${a.memberName}`),
    });
  },
};

const regulatoryProvider: IntelligenceDomainProvider = {
  domainId: "regulatory",
  async listSources(ctx) {
    return ABHI_REGULATORY_SOURCES.map((source) => ({
      id: source.id,
      workspaceSlug: ctx.workspaceSlug,
      domainId: "regulatory",
      name: source.name,
      url: source.url,
      kind: "regulatory",
    }));
  },
  async searchRecords(ctx, query) {
    const dashboard = buildAbhiRegulatoryDashboard(clientsFromContext(ctx));
    let updates = dashboard.updates;
    const q = query.filter?.search?.trim().toLowerCase();
    if (q) {
      updates = updates.filter(
        (u) => u.title.toLowerCase().includes(q) || u.summary.toLowerCase().includes(q),
      );
    }
    return paginateRecords(updates, regulatoryRecord, query.limit, query.offset);
  },
  async buildBriefing(ctx) {
    const dashboard = buildAbhiRegulatoryDashboard(clientsFromContext(ctx));
    const elevated = dashboard.memberAlerts.some((a) => a.priority === "High");
    return briefingFromSections(ctx.workspaceSlug, "regulatory", dashboard.todaysBrief.headline, [
      {
        id: "today",
        title: "Today's brief",
        bullets: [
          dashboard.todaysBrief.headline,
          `${dashboard.todaysBrief.potentiallyAffectedMembers} members potentially affected`,
        ],
      },
      {
        id: "alerts",
        title: "Member alerts",
        bullets: dashboard.memberAlerts.slice(0, 5).map((a) => `${a.memberName} — ${a.priority} priority`),
      },
    ], {
      posture: elevated ? "elevated" : "watch",
      postureReason: `${dashboard.todaysBrief.potentiallyAffectedMembers} members potentially affected by today's regulatory updates`,
      recommendedActions: ["Review regulatory impact assessments", "Export member alert brief"],
    });
  },
};

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

const ABHI_INTEL_SOURCES = createCustomerIntelligenceSources(SLUG);

const companyProvider: IntelligenceDomainProvider = {
  domainId: "company-intelligence",
  async listSources(ctx) {
    return ABHI_INTEL_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    const rows = filterRecords(abhiCompanyIntelligenceRecords(), query.filter?.search);
    return paginateRecords(rows, (row) => row, query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    return abhiCompanyIntelligenceRecords().find((row) => row.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const records = abhiCompanyIntelligenceRecords();
    const top = records[0];
    return briefingFromSections(
      ctx.workspaceSlug,
      "company-intelligence",
      "ABHI company intelligence",
      [
        {
          id: "highlights",
          title: "Operational highlights",
          bullets: records.slice(0, 4).map((row) => row.summary),
        },
      ],
      {
        posture: "healthy",
        postureReason: top?.summary ?? "Association operations and membership programme performance.",
        recommendedActions: ["Review renewal concentration Q4", "Open programme delivery dashboard"],
      },
    );
  },
};

const marketProvider: IntelligenceDomainProvider = {
  domainId: "market-intelligence",
  async listSources(ctx) {
    return ABHI_INTEL_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    const rows = filterRecords(abhiMarketIntelligenceRecords(), query.filter?.search);
    return paginateRecords(rows, (row) => row, query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    return abhiMarketIntelligenceRecords().find((row) => row.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const records = abhiMarketIntelligenceRecords();
    const elevated = records.some((r) => r.severity === "high" || r.severity === "critical");
    const headlineRecord = records.find((r) => r.severity === "high") ?? records[0];
    return briefingFromSections(
      ctx.workspaceSlug,
      "market-intelligence",
      "UK health-tech market monitor",
      [
        {
          id: "signals",
          title: "Market signals",
          bullets: records.slice(0, 4).map((row) => row.summary),
        },
      ],
      {
        posture: elevated ? "elevated" : "watch",
        postureReason: headlineRecord?.summary ?? "Sector and regulatory signals for UK health-tech.",
        recommendedActions: ["Review MHRA reform timeline", "Monitor export demand in US & GCC"],
      },
    );
  },
};

const dashboardProvider: IntelligenceDomainProvider = {
  domainId: "dashboard",
  async buildBriefing(ctx) {
    const portfolio = buildMemberIntelligencePortfolio(clientsFromContext(ctx));
    const regulatory = buildAbhiRegulatoryDashboard(clientsFromContext(ctx));
    const companyTop = abhiCompanyIntelligenceRecords()[0];
    const marketTop =
      abhiMarketIntelligenceRecords().find((r) => r.severity === "high") ??
      abhiMarketIntelligenceRecords()[0];
    const posture =
      portfolio.summary.atRiskMembers > 0 || regulatory.memberAlerts.some((a) => a.priority === "High")
        ? "elevated"
        : "healthy";
    return briefingFromSections(
      ctx.workspaceSlug,
      "dashboard",
      "ABHI Intelligence overview",
      [
        {
          id: "company",
          title: "Company Intelligence",
          bullets: [
            companyTop?.summary ?? "Association operations and membership programme performance.",
            `${abhiCompanyIntelligenceRecords().length} active company signals`,
          ],
        },
        {
          id: "member",
          title: "Member Intelligence",
          bullets: [
            `${portfolio.summary.activeMembers} active members`,
            `${portfolio.summary.atRiskMembers} at risk · ${portfolio.summary.renewalsDueIn90Days} renewals in 90 days`,
          ],
        },
        {
          id: "market",
          title: "Market Intelligence",
          bullets: [
            marketTop?.summary ?? "UK health-tech and diagnostics sector monitor.",
            `${abhiMarketIntelligenceRecords().length} external market signals`,
          ],
        },
        {
          id: "regulatory",
          title: "Regulatory Intelligence",
          bullets: [
            regulatory.todaysBrief.headline,
            `${regulatory.todaysBrief.potentiallyAffectedMembers} members potentially affected`,
          ],
        },
      ],
      {
        posture,
        postureReason:
          "Consolidated posture across membership, operations, market, and regulatory monitoring.",
      },
    );
  },
};

export const abhiIntelligencePack = buildStandardIntelligencePack({
  id: "abhi-intelligence",
  slug: SLUG,
  label: INTELLIGENCE_WORKSPACE_NAV_LABELS[SLUG],
  hostSurface: "abhi",
  clientViewId: "member-intelligence",
  clientDomainId: "member",
  clientLabel: "Member Intelligence",
  clientProvider: memberProvider,
  companyProvider,
  marketProvider,
  dashboardProvider,
  extraDomains: [
    {
      id: "regulatory",
      label: "Regulatory Intelligence",
      description: "Regulatory monitoring and member impact.",
      navViews: [
        "regulatory-dashboard",
        "regulatory-updates",
        "regulatory-impact",
        "regulatory-alerts",
      ],
      providerId: "abhi.regulatory",
    },
  ],
  extraUiViews: [
    { viewId: "regulatory-dashboard", domainId: "regulatory", label: "Dashboard" },
    { viewId: "regulatory-updates", domainId: "regulatory", label: "Regulatory Updates" },
    { viewId: "regulatory-impact", domainId: "regulatory", label: "Impact Assessments" },
    { viewId: "regulatory-alerts", domainId: "regulatory", label: "Member Alerts" },
  ],
  extraProviders: [regulatoryProvider],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["abhi", "internal"],
    denyExternal: true,
  },
  eaBridge: {
    intentResolvers: [
      async ({ message }) => {
        const intent = resolveAbhiExecutiveIntelligenceIntent(message);
        return intent ? packToolRoute(intent) : null;
      },
    ],
  },
  eaToolNames: [
    "abhi.getExecutiveBriefing",
    "abhi.getOrgHealth",
    "abhi.queryActions",
    "abhi.getBoardInsights",
  ],
  specialistActions: [
    { id: "export-regulatory-pdf", label: "Export regulatory brief PDF", domainId: "regulatory" },
    { id: "export-relationship-brief", label: "Export member relationship brief", domainId: "member" },
  ],
});
