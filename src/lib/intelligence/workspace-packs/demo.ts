import { DEMO_WORKSPACE_SLUG } from "@/lib/app-domains";
import type {
  IntelligenceDomainProvider,
  IntelligenceRecord,
  IntelligenceSource,
  IntelligenceWorkspacePackRegistration,
} from "@/lib/intelligence/types";
import { briefingFromSections } from "@/lib/intelligence/workspace-packs/_helpers";

const SLUG = DEMO_WORKSPACE_SLUG;

const DEMO_SOURCES: readonly IntelligenceSource[] = [
  {
    id: "demo-source-crm",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    name: "Demo CRM pipeline",
    kind: "crm_derived",
    refreshCadence: "P1D",
    description: "Synthetic pipeline velocity and renewal risk from the demo workspace.",
  },
  {
    id: "demo-source-market",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    name: "Demo market scanner",
    kind: "public_feed",
    refreshCadence: "P7D",
    description: "Curated public-market and sector signals for the demo tenant.",
  },
];

const WORKSPACE_SIGNALS: readonly IntelligenceRecord[] = [
  {
    id: "demo-signal-1",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Pipeline velocity improved week-on-week",
    summary: "Qualified opportunities increased 18% with three late-stage deals advancing to proposal.",
    severity: "info",
    score: { value: 72, band: "healthy", label: "Pipeline health" },
    categories: [{ id: "pipeline", label: "Pipeline" }],
    tags: [{ id: "growth", label: "Growth" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-2",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Renewal risk — Northbridge Retail Group",
    summary: "Support ticket volume is elevated and executive sponsor engagement dropped this month.",
    severity: "high",
    score: { value: 41, band: "watch", label: "Renewal risk" },
    categories: [{ id: "retention", label: "Retention" }],
    tags: [{ id: "at-risk", label: "At risk" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-3",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Cash collection ahead of forecast",
    summary: "Two enterprise invoices cleared early; operating cash is tracking above the demo forecast.",
    severity: "low",
    score: { value: 81, band: "healthy", label: "Cash posture" },
    categories: [{ id: "finance", label: "Finance" }],
    tags: [{ id: "collections", label: "Collections" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-4",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Helix onboarding stalled at security review",
    summary: "Client security questionnaire is blocking go-live; owner action required within 5 days.",
    severity: "medium",
    score: { value: 58, band: "watch", label: "Delivery risk" },
    categories: [{ id: "delivery", label: "Delivery" }],
    tags: [{ id: "onboarding", label: "Onboarding" }],
    sourceId: "demo-source-crm",
  },
];

const MARKET_RADAR: readonly IntelligenceRecord[] = [
  {
    id: "demo-market-1",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    title: "Sector funding activity up in health-tech",
    summary: "Three comparable raises announced in the last 30 days; valuation multiples stabilising.",
    severity: "info",
    score: { value: 66, band: "healthy", label: "Market momentum" },
    categories: [{ id: "funding", label: "Funding" }],
    tags: [{ id: "health-tech", label: "Health-tech" }],
    sourceId: "demo-source-market",
  },
  {
    id: "demo-market-2",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    title: "Regulatory consultation opened in EU med-tech",
    summary: "Draft guidance may affect software-as-a-medical-device classification timelines.",
    severity: "medium",
    categories: [{ id: "regulatory", label: "Regulatory" }],
    tags: [{ id: "eu", label: "EU" }],
    sourceId: "demo-source-market",
  },
  {
    id: "demo-market-3",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    title: "Competitor launched integrated analytics module",
    summary: "A direct competitor added portfolio analytics — monitor positioning in enterprise demos.",
    severity: "high",
    score: { value: 44, band: "elevated", label: "Competitive pressure" },
    categories: [{ id: "competitive", label: "Competitive" }],
    tags: [{ id: "product", label: "Product" }],
    sourceId: "demo-source-market",
  },
];

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

function paginate(records: IntelligenceRecord[], limit = 50, offset = 0) {
  return { records: records.slice(offset, offset + limit), total: records.length };
}

const signalsProvider: IntelligenceDomainProvider = {
  domainId: "workspace-signals",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(
      filterRecords(WORKSPACE_SIGNALS, query.filter?.search),
      query.limit,
      query.offset,
    );
  },
  async getRecord(_ctx, recordId) {
    return WORKSPACE_SIGNALS.find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    const atRisk = WORKSPACE_SIGNALS.filter((record) => record.severity === "high");
    return briefingFromSections(ctx.workspaceSlug, "workspace-signals", "Demo workspace briefing", [
      {
        id: "attention",
        title: "Needs attention",
        bullets: atRisk.map((record) => `${record.title} — ${record.summary}`),
      },
      {
        id: "healthy",
        title: "Healthy signals",
        bullets: WORKSPACE_SIGNALS.filter((record) => record.severity === "info" || record.severity === "low")
          .slice(0, 3)
          .map((record) => record.title),
      },
    ], {
      posture: atRisk.length ? "watch" : "healthy",
      postureReason: atRisk.length
        ? `${atRisk.length} high-priority workspace signals require review.`
        : "Demo workspace signals are broadly healthy.",
      recommendedActions: [
        "Review Northbridge renewal risk with customer success.",
        "Unblock Helix security questionnaire before go-live.",
      ],
    });
  },
};

const marketProvider: IntelligenceDomainProvider = {
  domainId: "market-radar",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(filterRecords(MARKET_RADAR, query.filter?.search), query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    return MARKET_RADAR.find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    return briefingFromSections(ctx.workspaceSlug, "market-radar", "Demo market radar briefing", [
      {
        id: "macro",
        title: "Market context",
        bullets: [
          "Health-tech funding activity is improving versus last quarter.",
          "EU med-tech consultation may affect delivery timelines for regulated clients.",
        ],
      },
      {
        id: "competitive",
        title: "Competitive watch",
        bullets: MARKET_RADAR.filter((record) => record.categories.some((c) => c.id === "competitive")).map(
          (record) => record.title,
        ),
      },
    ], { posture: "watch", postureReason: "Competitive and regulatory signals are active." });
  },
};

export const demoIntelligencePack: IntelligenceWorkspacePackRegistration = {
  id: "demo-intelligence",
  slug: SLUG,
  label: "Demo Intelligence",
  hostSurface: "demo",
  domains: [
    {
      id: "workspace-signals",
      label: "Workspace Signals",
      description: "Operational signals across pipeline, delivery, and finance for the demo tenant.",
      navViews: ["demo-intelligence"],
      providerId: "demo.workspace-signals",
    },
    {
      id: "market-radar",
      label: "Market Radar",
      description: "External market, regulatory, and competitive signals for demo briefings.",
      navViews: ["demo-market-radar"],
      providerId: "demo.market-radar",
    },
  ],
  uiViews: [
    { viewId: "demo-intelligence", domainId: "workspace-signals", label: "Workspace Signals" },
    { viewId: "demo-market-radar", domainId: "market-radar", label: "Market Radar" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["demo", "internal"],
    denyExternal: true,
  },
  providers: [signalsProvider, marketProvider],
  eaToolNames: ["intelligence.getBriefing", "intelligence.searchRecords", "getSmartInsights", "getDailyBrief"],
};
