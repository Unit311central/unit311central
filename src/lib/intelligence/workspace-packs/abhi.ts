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
import type {
  IntelligenceDomainProvider,
  IntelligenceProviderContext,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { bandFromPriority, briefingFromSections, paginateRecords } from "@/lib/intelligence/workspace-packs/_helpers";

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
    ]);
  },
};

export const abhiIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "abhi-intelligence",
  slug: SLUG,
  label: "ABHI Intelligence",
  hostSurface: "abhi",
  domains: [
    {
      id: "member",
      label: "Member Intelligence",
      description: "Member relationship and renewal intelligence.",
      navViews: ["member-intelligence"],
      providerId: "abhi.member",
    },
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
  uiViews: [
    { viewId: "member-intelligence", domainId: "member" },
    { viewId: "regulatory-dashboard", domainId: "regulatory" },
    { viewId: "regulatory-updates", domainId: "regulatory" },
    { viewId: "regulatory-impact", domainId: "regulatory" },
    { viewId: "regulatory-alerts", domainId: "regulatory" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["abhi", "internal"],
    denyExternal: true,
  },
  providers: [memberProvider, regulatoryProvider],
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
};
