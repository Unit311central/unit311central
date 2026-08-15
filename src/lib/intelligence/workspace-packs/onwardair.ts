import { packToolRoute } from "@/lib/ai-operating-assistant/workspace-packs/orchestration-helpers";
import { resolveOnwardAirExecutiveIntelligenceIntent } from "@/lib/onwardair/executive-intelligence-intent";
import {
  listCompetitors,
  getCompetitor,
  searchCompetitors,
  type CompetitorProfile,
} from "@/lib/onwardair/competitor-intelligence-data";
import {
  listEcosystemPartners,
  searchEcosystemPartners,
  type EcosystemPartner,
} from "@/lib/onwardair/ecosystem-partners-data";
import { ONWARDAIR_SLUG, ONWARDAIR_SLUG_ALIASES } from "@/lib/onwardair-surface";
import type {
  IntelligenceDomainProvider,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import {
  briefingFromSections,
  paginateRecords,
  severityFromCertCategory,
} from "@/lib/intelligence/workspace-packs/_helpers";

const SLUG = ONWARDAIR_SLUG;

function competitorRecord(profile: CompetitorProfile) {
  return {
    id: `competitor:${profile.id}`,
    workspaceSlug: SLUG,
    domainId: "competitor" as const,
    title: profile.companyName,
    summary: profile.description || profile.notablePublicFact,
    severity: severityFromCertCategory(profile.certificationCategory),
    categories: [{ id: profile.certificationCategory, label: profile.certificationCategory }],
    tags: [{ id: profile.missionFocus, label: profile.missionFocus }],
    entityRefs: [{ entityType: "competitor", entityId: profile.id, label: profile.companyName }],
    metadata: { aircraftName: profile.aircraftName, certAuthority: profile.certAuthority },
  };
}

function ecosystemRecord(partner: EcosystemPartner) {
  return {
    id: `ecosystem:${partner.id}`,
    workspaceSlug: SLUG,
    domainId: "ecosystem" as const,
    title: partner.name,
    summary: partner.whyItMatters,
    severity: "info" as const,
    categories: [{ id: partner.category, label: partner.category }],
    tags: [{ id: partner.status, label: partner.status }],
    entityRefs: [{ entityType: "ecosystem_partner", entityId: partner.id, label: partner.name }],
  };
}

const competitorProvider: IntelligenceDomainProvider = {
  domainId: "competitor",
  async searchRecords(ctx, query) {
    const q = query.filter?.search?.trim() ?? "";
    const items = q ? searchCompetitors(q) : listCompetitors();
    return paginateRecords(items, competitorRecord, query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    const id = recordId.replace(/^competitor:/, "");
    const profile = getCompetitor(id);
    return profile ? competitorRecord(profile) : null;
  },
  async buildBriefing(ctx) {
    const inCert = listCompetitors().filter((c) => c.certificationCategory === "In Certification");
    return briefingFromSections(ctx.workspaceSlug, "competitor", "Competitor certification landscape", [
      {
        id: "tracked",
        title: "Tracked competitors",
        bullets: [`${listCompetitors().length} public programmes in the landscape.`],
      },
      {
        id: "in_cert",
        title: "In certification",
        bullets: inCert.slice(0, 5).map((c) => `${c.companyName} — ${c.certAuthority}`),
      },
    ]);
  },
};

const ecosystemProvider: IntelligenceDomainProvider = {
  domainId: "ecosystem",
  async searchRecords(_ctx, query) {
    const q = query.filter?.search?.trim() ?? "";
    const items = q ? searchEcosystemPartners(q) : listEcosystemPartners();
    return paginateRecords(items, ecosystemRecord, query.limit, query.offset);
  },
  async buildBriefing(ctx) {
    const partners = listEcosystemPartners();
    return briefingFromSections(ctx.workspaceSlug, "ecosystem", "Ecosystem partners posture", [
      {
        id: "active",
        title: "Engagement",
        bullets: [
          `${partners.filter((p) => p.status === "Active trial").length} active trials`,
          `${partners.filter((p) => p.status === "Priority target").length} priority targets`,
        ],
      },
    ]);
  },
};

export const onwardAirIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "onwardair-intelligence",
  slug: SLUG,
  label: "OnwardAir Intelligence",
  hostSurface: "onwardair",
  slugAliases: [...ONWARDAIR_SLUG_ALIASES],
  domains: [
    {
      id: "competitor",
      label: "Competitor Intelligence",
      description: "Public certification-race and competitor landscape.",
      navViews: ["oa-competitor-intelligence"],
      providerId: "onwardair.competitor",
    },
    {
      id: "ecosystem",
      label: "Ecosystem Partners",
      description: "Pre-ops ecosystem and partner engagement.",
      navViews: ["oa-ecosystem-partners"],
      providerId: "onwardair.ecosystem",
    },
  ],
  uiViews: [
    { viewId: "oa-competitor-intelligence", domainId: "competitor" },
    { viewId: "oa-ecosystem-partners", domainId: "ecosystem" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["onwardair", "internal"],
    denyExternal: true,
  },
  providers: [competitorProvider, ecosystemProvider],
  eaBridge: {
    intentResolvers: [
      async ({ message }) => {
        const intent = resolveOnwardAirExecutiveIntelligenceIntent(message);
        return intent ? packToolRoute(intent) : null;
      },
    ],
  },
  eaToolNames: [
    "onwardair.getExecutiveBriefing",
    "onwardair.getOrgHealth",
    "onwardair.queryActions",
    "onwardair.getBoardInsights",
    "onwardair.queryModule",
  ],
  specialistActions: [
    {
      id: "refresh-competitor-feed",
      label: "Refresh competitor weekly feed",
      domainId: "competitor",
    },
  ],
};
