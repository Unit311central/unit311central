import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import { resolveTalantonExecutiveIntelligenceIntent } from "@/lib/talanton/executive-intelligence-intent";
import { buildPortfolioExecutiveBriefing } from "@/lib/talanton/portfolio-intelligence";
import { buildPortfolioImpactBriefing } from "@/lib/talanton/impact-intelligence";
import { buildOpportunityBriefing } from "@/lib/talanton/opportunity-intelligence";
import {
  TALANTON_HOST_ALIAS_SLUG,
  TALANTON_IMPACT_SLUG,
} from "@/lib/talanton-surface";
import type {
  IntelligenceDomainProvider,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { bandFromPriority, briefingFromSections, paginateRecords } from "@/lib/intelligence/workspace-packs/_helpers";

const SLUG = TALANTON_IMPACT_SLUG;

const portfolioProvider: IntelligenceDomainProvider = {
  domainId: "portfolio",
  async searchRecords(_ctx, query) {
    const briefing = buildPortfolioExecutiveBriefing();
    const items = briefing.attentionCompanies;
    return paginateRecords(
      items,
      (company) => ({
        id: `portfolio-attention:${company.companyId}`,
        workspaceSlug: SLUG,
        domainId: "portfolio",
        title: company.companyName,
        summary: company.detail,
        severity: company.priority === "Critical" ? "critical" : company.priority === "High" ? "high" : "medium",
        score: { value: company.healthScore, band: bandFromPriority(company.priority), label: company.riskRating },
        categories: [{ id: company.sector, label: company.sector }],
        tags: [{ id: company.reason, label: company.reason }],
        entityRefs: [{ entityType: "portfolio_company", entityId: company.companyId, label: company.companyName }],
      }),
      query.limit,
      query.offset,
    );
  },
  async buildBriefing(ctx) {
    const briefing = buildPortfolioExecutiveBriefing();
    return briefingFromSections(ctx.workspaceSlug, "portfolio", "Portfolio executive briefing", [
      {
        id: "posture",
        title: "Portfolio posture",
        bullets: [briefing.health.postureReason],
      },
      {
        id: "attention",
        title: "Companies requiring attention",
        bullets: briefing.attentionCompanies.slice(0, 5).map((c) => `${c.companyName} — ${c.reason}`),
      },
    ], {
      posture: briefing.health.posture === "Elevated" ? "elevated" : briefing.health.posture === "Watch" ? "watch" : "healthy",
    });
  },
};

const impactProvider: IntelligenceDomainProvider = {
  domainId: "impact",
  async searchRecords(_ctx, query) {
    const briefing = buildPortfolioImpactBriefing();
    return paginateRecords(
      briefing.topCompanies,
      (company) => ({
        id: `impact:${company.companyId}`,
        workspaceSlug: SLUG,
        domainId: "impact",
        title: company.companyName,
        summary: company.aiCommentary,
        severity: company.trend === "Declining" ? "high" : "info",
        score: { value: company.impactScore, band: company.trend === "Declining" ? "watch" : "healthy" },
        categories: [{ id: company.sector, label: company.sector }],
        tags: [{ id: company.trend, label: company.trend }],
        entityRefs: [{ entityType: "portfolio_company", entityId: company.companyId, label: company.companyName }],
      }),
      query.limit,
      query.offset,
    );
  },
  async buildBriefing(ctx) {
    const briefing = buildPortfolioImpactBriefing();
    return briefingFromSections(ctx.workspaceSlug, "impact", "Portfolio impact intelligence", [
      {
        id: "summary",
        title: "Impact summary",
        bullets: [
          `${briefing.summary.jobsCreated.toLocaleString()} jobs created`,
          `${briefing.summary.peopleServed.toLocaleString()} people served`,
        ],
      },
      {
        id: "risks",
        title: "Impact risks",
        bullets: briefing.risks.slice(0, 4).map((r) => r.title),
      },
    ], { posture: briefing.health.band === "At Risk" || briefing.health.band === "Watch" ? "watch" : "healthy" });
  },
};

const opportunityProvider: IntelligenceDomainProvider = {
  domainId: "opportunity",
  async searchRecords(_ctx, query) {
    const briefing = buildOpportunityBriefing();
    return paginateRecords(
      briefing.potentialCompanies,
      (company) => ({
        id: `opportunity:${company.id}`,
        workspaceSlug: SLUG,
        domainId: "opportunity",
        title: company.companyName,
        summary: company.aiCommentary,
        severity: company.opportunityScore >= 80 ? "high" : "medium",
        score: { value: company.opportunityScore, band: company.opportunityScore >= 80 ? "healthy" : "watch" },
        categories: [{ id: company.sector, label: company.sector }],
        tags: [{ id: company.country, label: company.country }],
      }),
      query.limit,
      query.offset,
    );
  },
  async buildBriefing(ctx) {
    const briefing = buildOpportunityBriefing();
    return briefingFromSections(ctx.workspaceSlug, "opportunity", "Opportunity intelligence briefing", [
      {
        id: "health",
        title: "Pipeline health",
        bullets: [briefing.health.postureReason],
      },
      {
        id: "emerging",
        title: "Emerging opportunities",
        bullets: briefing.emergingOpportunities.slice(0, 5),
      },
    ], { posture: briefing.health.band === "Thin" ? "watch" : "healthy" });
  },
};

export const talantonIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "talanton-intelligence",
  slug: SLUG,
  label: "Talanton Intelligence",
  hostSurface: "talanton",
  slugAliases: [TALANTON_HOST_ALIAS_SLUG],
  domains: [
    {
      id: "portfolio",
      label: "Portfolio Intelligence",
      navViews: ["portfolio-intelligence-briefing", "portfolio-intelligence-company"],
      providerId: "talanton.portfolio",
    },
    {
      id: "impact",
      label: "Impact Intelligence",
      navViews: ["impact-intelligence-dashboard", "impact-intelligence-company"],
      providerId: "talanton.impact",
    },
    {
      id: "opportunity",
      label: "Opportunity Intelligence",
      navViews: ["opportunity-intelligence"],
      providerId: "talanton.opportunity",
    },
  ],
  uiViews: [
    { viewId: "portfolio-intelligence-briefing", domainId: "portfolio" },
    { viewId: "portfolio-intelligence-company", domainId: "portfolio" },
    { viewId: "impact-intelligence-dashboard", domainId: "impact" },
    { viewId: "impact-intelligence-company", domainId: "impact" },
    { viewId: "opportunity-intelligence", domainId: "opportunity" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["talanton", "internal"],
    denyExternal: true,
  },
  providers: [portfolioProvider, impactProvider, opportunityProvider],
  eaBridge: {
    intentResolvers: [
      async ({ message }) => {
        const intent = resolveTalantonExecutiveIntelligenceIntent(message);
        return intent ? packToolRoute(intent) : null;
      },
    ],
  },
  eaToolNames: [
    "talanton.getExecutiveBriefing",
    "talanton.getOrgHealth",
    "talanton.queryPortfolio",
    "talanton.queryImpact",
    "talanton.queryFunds",
    "talanton.queryStories",
  ],
};
