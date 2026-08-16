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
  {
    id: "demo-source-customer",
    workspaceSlug: SLUG,
    domainId: "customer-health",
    name: "Northstar CRM health",
    kind: "crm_derived",
    refreshCadence: "P1D",
    description: "Renewal, support and engagement signals for Northstar customers.",
  },
  {
    id: "demo-source-supply",
    workspaceSlug: SLUG,
    domainId: "supply-chain",
    name: "Supplier risk monitor",
    kind: "ops_derived",
    refreshCadence: "P1D",
    description: "Component lead times and supplier reliability for Northstar delivery.",
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
    title: "Renewal risk — Sheffield Precision Engineering",
    summary: "Support ticket volume elevated; executive sponsor engagement dropped ahead of Atlas go-live.",
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
    title: "Atlas programme over budget",
    summary: "Atlas Monitoring Platform spend is 18% above plan; Voltex component delays driving rework.",
    severity: "high",
    score: { value: 38, band: "elevated", label: "Project risk" },
    categories: [{ id: "delivery", label: "Delivery" }],
    tags: [{ id: "atlas", label: "Atlas" }, { id: "meridian", label: "Sheffield Precision" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-5",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Jun 2025 margin compression",
    summary: "Gross margin fell to 51% in Jun 2025 — Voltex delays and Harbor Forge churn cited in board pack.",
    severity: "medium",
    categories: [{ id: "finance", label: "Finance" }],
    tags: [{ id: "margin", label: "Margin" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-6",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Dec 2025 strong close",
    summary: "Four new logos closed; collections ahead of forecast entering 2026 budget cycle.",
    severity: "info",
    score: { value: 84, band: "healthy", label: "Revenue" },
    categories: [{ id: "finance", label: "Finance" }],
    tags: [{ id: "growth", label: "Growth" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-7",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Austin expansion burn watch",
    summary: "US payroll run-rate tracking 12% above plan; pipeline conversion still lagging UK.",
    severity: "medium",
    categories: [{ id: "operations", label: "Operations" }],
    tags: [{ id: "us", label: "US" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-8",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Harbor Forge churn post-mortem",
    summary: "Integration failure documented; playbook updated for enterprise onboarding.",
    severity: "low",
    categories: [{ id: "retention", label: "Retention" }],
    tags: [{ id: "churn", label: "Churn" }],
    sourceId: "demo-source-crm",
  },
  {
    id: "demo-signal-4",
    workspaceSlug: SLUG,
    domainId: "workspace-signals",
    title: "Firmware QA backlog — Bristol",
    summary: "Atlas edge controller firmware validation queue at 3-week lag; go-live risk for Sheffield Precision.",
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
    title: "Industrial IoT M&A activity — UK mid-market",
    summary: "Two bolt-on acquisitions announced; consolidation may pressure Northstar positioning.",
    severity: "info",
    score: { value: 66, band: "healthy", label: "Market momentum" },
    categories: [{ id: "funding", label: "Funding" }],
    tags: [{ id: "industrial-iot", label: "Industrial IoT" }],
    sourceId: "demo-source-market",
  },
  {
    id: "demo-market-2",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    title: "EU machinery regulation update",
    summary: "Draft cyber-resilience requirements for connected industrial equipment may affect Atlas edge controllers.",
    severity: "medium",
    categories: [{ id: "regulatory", label: "Regulatory" }],
    tags: [{ id: "eu", label: "EU" }],
    sourceId: "demo-source-market",
  },
  {
    id: "demo-market-3",
    workspaceSlug: SLUG,
    domainId: "market-radar",
    title: "Competitor SenseForge launched predictive maintenance suite",
    summary: "Direct competitor targeting mid-market manufacturers — monitor US pilot positioning.",
    severity: "high",
    score: { value: 44, band: "elevated", label: "Competitive pressure" },
    categories: [{ id: "competitive", label: "Competitive" }],
    tags: [{ id: "product", label: "Product" }],
    sourceId: "demo-source-market",
  },
];

const CUSTOMER_HEALTH: readonly IntelligenceRecord[] = [
  {
    id: "demo-customer-1",
    workspaceSlug: SLUG,
    domainId: "customer-health",
    title: "Sheffield Precision — renewal in 90 days",
    summary: "Atlas delay increases renewal risk; monthly executive QBR now required by board.",
    severity: "high",
    categories: [{ id: "retention", label: "Retention" }],
    tags: [{ id: "meridian", label: "Sheffield Precision" }],
    sourceId: "demo-source-customer",
  },
  {
    id: "demo-customer-2",
    workspaceSlug: SLUG,
    domainId: "customer-health",
    title: "Sheffield Precision support ticket spike",
    summary: "Eight open tickets linked to Atlas firmware regression; CSM escalation active.",
    severity: "high",
    categories: [{ id: "support", label: "Support" }],
    tags: [{ id: "meridian", label: "Sheffield Precision" }],
    sourceId: "demo-source-customer",
  },
  {
    id: "demo-customer-3",
    workspaceSlug: SLUG,
    domainId: "customer-health",
    title: "Harbor Forge — churned",
    summary: "Customer terminated after failed ERP integration; lessons captured in onboarding playbook.",
    severity: "medium",
    categories: [{ id: "churn", label: "Churn" }],
    tags: [{ id: "harbor-forge", label: "Harbor Forge" }],
    sourceId: "demo-source-customer",
  },
  {
    id: "demo-customer-4",
    workspaceSlug: SLUG,
    domainId: "customer-health",
    title: "US pilot — Summit Foods engaged",
    summary: "Austin team progressing discovery; security review scheduled.",
    severity: "info",
    categories: [{ id: "expansion", label: "Expansion" }],
    tags: [{ id: "us", label: "US" }],
    sourceId: "demo-source-customer",
  },
];

const SUPPLY_CHAIN: readonly IntelligenceRecord[] = [
  {
    id: "demo-supply-1",
    workspaceSlug: SLUG,
    domainId: "supply-chain",
    title: "Voltex Automation — lead time +6 weeks",
    summary: "Edge controller PCB backlog affecting Atlas delivery milestones for Sheffield Precision.",
    severity: "critical",
    categories: [{ id: "supplier", label: "Supplier" }],
    tags: [{ id: "voltex", label: "Voltex" }, { id: "atlas", label: "Atlas" }],
    sourceId: "demo-source-supply",
  },
  {
    id: "demo-supply-2",
    workspaceSlug: SLUG,
    domainId: "supply-chain",
    title: "Backup supplier qualification underway",
    summary: "Board approved dual-source plan for edge controllers; RFQ issued to Nordic Components.",
    severity: "medium",
    categories: [{ id: "mitigation", label: "Mitigation" }],
    tags: [{ id: "voltex", label: "Voltex" }],
    sourceId: "demo-source-supply",
  },
  {
    id: "demo-supply-3",
    workspaceSlug: SLUG,
    domainId: "supply-chain",
    title: "Component cost inflation — Q1 2026",
    summary: "Semiconductor pass-through adding ~2.1% to unit costs; margin recovery plan in progress.",
    severity: "medium",
    categories: [{ id: "cost", label: "Cost" }],
    tags: [{ id: "margin", label: "Margin" }],
    sourceId: "demo-source-supply",
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
        "Review Sheffield Precision renewal risk with customer success.",
        "Unblock Atlas firmware validation before Sheffield Precision go-live.",
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
          "Industrial IoT M&A and EU machinery regulation signals are active.",
          "Competitor SenseForge launch may affect US pilot positioning.",
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

const customerProvider: IntelligenceDomainProvider = {
  domainId: "customer-health",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(filterRecords(CUSTOMER_HEALTH, query.filter?.search), query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    return CUSTOMER_HEALTH.find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    return briefingFromSections(ctx.workspaceSlug, "customer-health", "Customer health briefing", [
      {
        id: "at-risk",
        title: "At-risk accounts",
        bullets: CUSTOMER_HEALTH.filter((r) => r.severity === "high").map((r) => r.title),
      },
      {
        id: "expansion",
        title: "Expansion",
        bullets: CUSTOMER_HEALTH.filter((r) => r.categories.some((c) => c.id === "expansion")).map((r) => r.title),
      },
    ], { posture: "watch", postureReason: "Sheffield Precision renewal risk elevated ahead of Atlas go-live." });
  },
};

const supplyProvider: IntelligenceDomainProvider = {
  domainId: "supply-chain",
  async listSources(ctx) {
    return DEMO_SOURCES.filter((source) => source.domainId === ctx.domainId);
  },
  async searchRecords(_ctx, query) {
    return paginate(filterRecords(SUPPLY_CHAIN, query.filter?.search), query.limit, query.offset);
  },
  async getRecord(_ctx, recordId) {
    return SUPPLY_CHAIN.find((record) => record.id === recordId) ?? null;
  },
  async buildBriefing(ctx) {
    return briefingFromSections(ctx.workspaceSlug, "supply-chain", "Supply-chain briefing", [
      {
        id: "critical",
        title: "Critical supplier issues",
        bullets: SUPPLY_CHAIN.filter((r) => r.severity === "critical" || r.severity === "high").map((r) => r.title),
      },
    ], { posture: "elevated", postureReason: "Voltex Automation delays are affecting Atlas delivery." });
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
    {
      id: "customer-health",
      label: "Customer Health",
      description: "Renewal, support and engagement signals for Northstar customers.",
      navViews: ["demo-customer-health"],
      providerId: "demo.customer-health",
    },
    {
      id: "supply-chain",
      label: "Supply Chain",
      description: "Supplier lead times and component risk for Northstar delivery.",
      navViews: ["demo-supply-chain"],
      providerId: "demo.supply-chain",
    },
  ],
  uiViews: [
    { viewId: "demo-intelligence", domainId: "workspace-signals", label: "Workspace Signals" },
    { viewId: "demo-market-radar", domainId: "market-radar", label: "Market Radar" },
    { viewId: "demo-customer-health", domainId: "customer-health", label: "Customer Health" },
    { viewId: "demo-supply-chain", domainId: "supply-chain", label: "Supply Chain" },
  ],
  accessPolicy: {
    defaultAllowedHostSurfaces: ["demo", "internal"],
    denyExternal: true,
  },
  providers: [signalsProvider, marketProvider, customerProvider, supplyProvider],
  eaToolNames: ["intelligence.getBriefing", "intelligence.searchRecords", "getSmartInsights", "getDailyBrief"],
};

