/**
 * Executive Operating Assistant — proactive domain types.
 * Additive layer; does not alter chat/OpenAI/page-registry/guided-learning cores.
 */

import type { AssistantFollowUpAction } from "./tool-result";
import type { AiExplanation } from "./explainability";

export type InsightSeverity = "critical" | "high" | "medium" | "low";

export type InsightCategory =
  | "projects"
  | "clients"
  | "finance"
  | "hr"
  | "crm"
  | "compliance"
  | "operations"
  | "recruitment"
  | "contracts"
  | "release";

export type ExecutiveInsight = {
  id: string;
  category: InsightCategory;
  severity: InsightSeverity;
  title: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
  recommendedActions: AssistantFollowUpAction[];
  relatedWorkflowId?: string;
  dataGaps?: string[];
  /** Required for trust — never ship black-box recommendations. */
  explanation: AiExplanation;
  generatedAt: string;
};

export type DailyBriefSection = {
  id: string;
  title: string;
  bullets: string[];
  insightIds?: string[];
};

export type DailyExecutiveBrief = {
  id: string;
  dateKey: string;
  greeting: string;
  headline: string;
  priorities: string[];
  sections: DailyBriefSection[];
  insights: ExecutiveInsight[];
  recommendedWorkflows: string[];
  followUpActions: AssistantFollowUpAction[];
  dataGaps: string[];
  generatedAt: string;
};

export type HealthDimensionId =
  | "projects"
  | "finance"
  | "hr"
  | "compliance"
  | "crm"
  | "operations";

export type HealthDimension = {
  id: HealthDimensionId;
  label: string;
  score: number;
  strengths: string[];
  risks: string[];
};

export type BusinessHealthScore = {
  overall: number;
  confidence: number;
  dimensions: HealthDimension[];
  strengths: string[];
  risks: string[];
  recommendedActions: AssistantFollowUpAction[];
  insightIds: string[];
  dataGaps: string[];
  explanation?: AiExplanation;
  generatedAt: string;
};

export type ProactiveNotification = {
  id: string;
  insightId: string;
  severity: InsightSeverity;
  title: string;
  body: string;
  href?: string;
  workflowId?: string;
  confidence?: number;
  explanation?: AiExplanation;
  createdAt: string;
};

export type ReleaseFeature = {
  id: string;
  title: string;
  summary: string;
  releasedAt: string;
  tourViewId?: string;
  highlightTargetIds?: string[];
};

export type ReleaseIntelligence = {
  unseenFeatures: ReleaseFeature[];
  offerTour: boolean;
  message: string;
  tourViewId: string | null;
};

export type WorkflowStep = {
  id: string;
  title: string;
  instruction: string;
  viewId?: string;
  targetId?: string;
  href?: string;
  estimatedMinutes?: number;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  purpose: string;
  businessOutcome: string;
  steps: WorkflowStep[];
  requiredPermissions: Array<"financials" | "hr" | "users" | "strategy" | "any">;
  estimatedDurationMinutes: number;
  relatedModules: string[];
  intentPhrases: string[];
  roles: Array<"ceo" | "hr" | "project_manager" | "finance" | "operator" | "any">;
};

export type WorkflowGuideSession = {
  workflowId: string;
  name: string;
  stepIndex: number;
  steps: WorkflowStep[];
  clientAction?: {
    type: "highlight" | "navigate" | "start_tour";
    viewId?: string;
    targetId?: string;
    explanation?: string;
    href?: string;
  };
};
