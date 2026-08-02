import type { WorkspaceFilterKey } from "@/lib/platform-analytics/taxonomy";

export type PlatformAnalyticsPeriod =
  | "7d"
  | "30d"
  | "90d"
  | "12m"
  | "all";

export type PlatformUsageEventInput = {
  pageKey: string;
  moduleKey?: string | null;
  source?: "nav" | "route" | "ea_action";
  occurredAt?: string;
};

export type PageAdoptionRow = {
  pageKey: string;
  pageLabel: string;
  moduleKey: string;
  moduleLabel: string;
  sectionKey: string | null;
  sectionLabel: string | null;
  adoptionScore: number;
  reachPct: number;
  intensityScore: number;
  users: number;
  /** True when eligible in taxonomy but zero usage in period. */
  neverUsed: boolean;
};

export type SectionAdoptionRow = {
  sectionKey: string;
  sectionLabel: string;
  moduleKey: string;
  adoptionScore: number;
  pages: PageAdoptionRow[];
};

export type ModuleAdoptionRow = {
  moduleKey: string;
  moduleLabel: string;
  adoptionScore: number;
  reachPct: number;
  intensityScore: number;
  users: number;
  pageCount: number;
  pagesUsed: number;
  topPages: string[];
  leastPages: string[];
  sections: SectionAdoptionRow[];
  pages: PageAdoptionRow[];
};

export type WorkspaceAdoptionRow = {
  workspaceKey: string;
  workspaceLabel: string;
  adoptionScore: number;
  topModules: string[];
  leastModules: string[];
  topPages: string[];
  leastPages: string[];
  eaAdoption: number;
  trainingAdoption: number;
  users: number;
};

export type EaActionRow = { actionName: string; count: number };
export type EaTopicRow = { topic: string; count: number; sharePct: number };
export type EaWorkspaceRow = {
  workspaceKey: string;
  workspaceLabel: string;
  conversations: number;
  actions: number;
  users: number;
  adoptionScore: number;
};
export type EaTrendPoint = { bucket: string; conversations: number; actions: number };

export type FeatureOpportunityRow = {
  type:
    | "high_visibility_low_adoption"
    | "never_used"
    | "emerging"
    | "needs_enablement";
  label: string;
  detail: string;
  moduleKey: string;
  pageKey?: string | null;
  workspaceKey?: string | null;
};

export type UsageTrendPoint = {
  bucket: string;
  adoptionScore: number;
  activeUsers: number;
};

export type PlatformAnalyticsSummary = {
  period: PlatformAnalyticsPeriod;
  workspaceFilter: WorkspaceFilterKey;
  from: string | null;
  to: string;
  generatedAt: string;
  adoptionModel: {
    reachWeight: number;
    intensityWeight: number;
    notes: string;
  };
  /** Modules ranked (filtered scope). */
  modules: ModuleAdoptionRow[];
  modulesMost: ModuleAdoptionRow[];
  modulesLeast: ModuleAdoptionRow[];
  /** Pages ranked across hierarchy. */
  pagesMost: PageAdoptionRow[];
  pagesLeast: PageAdoptionRow[];
  neverUsedPages: PageAdoptionRow[];
  workspaceComparison: WorkspaceAdoptionRow[];
  usageTrend: UsageTrendPoint[];
  executiveAssistant: {
    conversations: number;
    actions: number;
    users: number;
    workspacesActive: number;
    mostUsedActions: EaActionRow[];
    topics: EaTopicRow[];
    byWorkspace: EaWorkspaceRow[];
    trend: EaTrendPoint[];
  };
  featureOpportunities: FeatureOpportunityRow[];
};
