/**
 * Executive Assistant execution cards — structured business UI for assistant responses.
 * Client-safe (no server-only imports).
 */

import type { AssistantFollowUpAction } from "./tool-result";

export type EaExecutionCardKind =
  | "approval"
  | "creation_form"
  | "summary"
  | "status"
  | "risk"
  | "workflow"
  | "document"
  | "navigation"
  | "confirmation"
  | "execution_progress";

export type EaCardField = {
  key: string;
  label: string;
  value?: string | number | boolean | null;
  required?: boolean;
  inputType?: "text" | "textarea" | "select" | "toggle" | "number";
  placeholder?: string;
  options?: Array<{ label: string; value: string }>;
};

export type EaCardAction = {
  id: string;
  label: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  /** Maps to follow-up / plan approve behaviour on the client. */
  intent:
    | "submit_form"
    | "approve_plan"
    | "reject_plan"
    | "confirm_high_risk"
    | "navigate"
    | "generate"
    | "open"
    | "dismiss";
  href?: string;
  actionId?: string;
  planId?: string;
};

export type EaWorkflowStepView = {
  id: string;
  label: string;
  status: "pending" | "ready" | "running" | "succeeded" | "failed" | "skipped";
  actionId?: string;
  detail?: string;
};

export type EaExecutionCard = {
  id: string;
  kind: EaExecutionCardKind;
  title: string;
  subtitle?: string;
  body?: string;
  /** Key business fields shown as label/value rows. */
  fields?: EaCardField[];
  /** Workflow / progress steps. */
  steps?: EaWorkflowStepView[];
  /** Progress 0–100 for execution_progress cards. */
  progressPct?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  statusTone?: "neutral" | "success" | "warning" | "danger" | "info";
  actions?: EaCardAction[];
  nextActions?: AssistantFollowUpAction[];
  meta?: Record<string, unknown>;
};

function humanizeField(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

export function fieldDefsFromInputSchema(
  schema: Record<string, unknown> | undefined,
  options?: { highlightRequired?: string[]; prefill?: Record<string, unknown> },
): EaCardField[] {
  if (!schema || typeof schema !== "object") return [];
  const properties =
    schema.properties && typeof schema.properties === "object"
      ? (schema.properties as Record<string, Record<string, unknown>>)
      : {};
  const required = new Set(
    Array.isArray(schema.required)
      ? schema.required.filter((v): v is string => typeof v === "string")
      : [],
  );
  const highlight = new Set(options?.highlightRequired ?? []);
  const keys = Object.keys(properties);
  const ordered = [
    ...keys.filter((k) => highlight.has(k) || required.has(k)),
    ...keys.filter((k) => !highlight.has(k) && !required.has(k)),
  ];
  return ordered.map((key) => {
    const prop = properties[key] ?? {};
    const type = typeof prop.type === "string" ? prop.type : "string";
    const prefill = options?.prefill?.[key];
    return {
      key,
      label: humanizeField(key),
      required: required.has(key) || highlight.has(key),
      inputType: type === "boolean" ? "toggle" : type === "number" ? "number" : "text",
      placeholder:
        typeof prop.description === "string" ? prop.description : `Enter ${humanizeField(key)}`,
      value:
        prefill == null
          ? ""
          : typeof prefill === "string" || typeof prefill === "number" || typeof prefill === "boolean"
            ? prefill
            : String(prefill),
    };
  });
}

export function buildCreationFormCard(input: {
  actionId: string;
  actionName: string;
  businessObject?: string;
  schema?: Record<string, unknown>;
  missingFields?: string[];
  prefill?: Record<string, unknown>;
  message?: string;
}): EaExecutionCard {
  const fields = fieldDefsFromInputSchema(input.schema, {
    highlightRequired: input.missingFields,
    prefill: input.prefill,
  });
  return {
    id: `creation_${input.actionId}`,
    kind: "creation_form",
    title: input.actionName,
    subtitle: input.businessObject ? `${input.businessObject} · executable action` : "Executable action",
    body: input.message ?? "Complete the fields below to continue.",
    fields: fields.length
      ? fields
      : (input.missingFields ?? []).map((key) => ({
          key,
          label: humanizeField(key),
          required: true,
          inputType: "text" as const,
          value: "",
        })),
    actions: [
      {
        id: `submit_${input.actionId}`,
        label: input.actionName.startsWith("Create") ? "Create" : "Continue",
        variant: "primary",
        intent: "submit_form",
        actionId: input.actionId,
      },
    ],
    meta: { actionId: input.actionId },
  };
}

export function buildConfirmationCard(input: {
  title: string;
  summary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  fields?: EaCardField[];
  warnings?: string[];
  planId?: string;
  highRisk?: boolean;
}): EaExecutionCard {
  const highRisk =
    input.highRisk ??
    (input.riskLevel === "high" || input.riskLevel === "critical");
  return {
    id: `confirmation_${input.planId ?? "plan"}`,
    kind: "confirmation",
    title: highRisk ? `Confirm: ${input.title}` : input.title,
    subtitle: highRisk
      ? "High-risk action — review impact before approving."
      : "Review what will happen, then approve.",
    body: input.summary,
    riskLevel: input.riskLevel,
    fields: input.fields,
    statusTone: highRisk ? "danger" : "warning",
    actions: [
      {
        id: "approve",
        label: highRisk ? "Confirm & execute" : "Approve",
        variant: highRisk ? "danger" : "primary",
        intent: highRisk ? "confirm_high_risk" : "approve_plan",
        planId: input.planId,
      },
      {
        id: "reject",
        label: "Reject",
        variant: "secondary",
        intent: "reject_plan",
        planId: input.planId,
      },
    ],
    meta: {
      warnings: input.warnings ?? [],
      highRisk,
    },
  };
}

export function buildSummaryCard(input: {
  title: string;
  body?: string;
  fields?: EaCardField[];
  nextActions?: AssistantFollowUpAction[];
  statusTone?: EaExecutionCard["statusTone"];
}): EaExecutionCard {
  return {
    id: `summary_${Date.now()}`,
    kind: "summary",
    title: input.title,
    body: input.body,
    fields: input.fields,
    nextActions: input.nextActions,
    statusTone: input.statusTone ?? "success",
  };
}

export function buildStatusCard(input: {
  title: string;
  body?: string;
  fields?: EaCardField[];
  statusTone?: EaExecutionCard["statusTone"];
}): EaExecutionCard {
  return {
    id: `status_${Date.now()}`,
    kind: "status",
    title: input.title,
    body: input.body,
    fields: input.fields,
    statusTone: input.statusTone ?? "info",
  };
}

export function buildRiskCard(input: {
  title?: string;
  warnings: string[];
  riskLevel?: EaExecutionCard["riskLevel"];
}): EaExecutionCard | null {
  if (!input.warnings.length) return null;
  return {
    id: `risk_${Date.now()}`,
    kind: "risk",
    title: input.title ?? "Risks & warnings",
    riskLevel: input.riskLevel ?? "medium",
    statusTone: "warning",
    fields: input.warnings.map((warning, index) => ({
      key: `w_${index}`,
      label: `Warning ${index + 1}`,
      value: warning,
    })),
  };
}

export function buildWorkflowCard(input: {
  id: string;
  name: string;
  purpose?: string;
  steps: EaWorkflowStepView[];
  actions?: EaCardAction[];
}): EaExecutionCard {
  return {
    id: `workflow_${input.id}`,
    kind: "workflow",
    title: input.name,
    subtitle: "Multi-step business workflow",
    body: input.purpose,
    steps: input.steps,
    actions: input.actions,
    statusTone: "info",
  };
}

export function buildDocumentCard(input: {
  title: string;
  filename?: string;
  openUrl?: string;
  downloadUrl?: string;
}): EaExecutionCard {
  return {
    id: `document_${input.title}`,
    kind: "document",
    title: input.title,
    subtitle: input.filename,
    actions: [
      ...(input.openUrl
        ? [
            {
              id: "open",
              label: "Open",
              variant: "primary" as const,
              intent: "open" as const,
              href: input.openUrl,
            },
          ]
        : []),
      ...(input.downloadUrl
        ? [
            {
              id: "download",
              label: "Download",
              variant: "secondary" as const,
              intent: "navigate" as const,
              href: input.downloadUrl,
            },
          ]
        : []),
    ],
  };
}

export function buildNavigationCard(input: {
  title: string;
  body?: string;
  href: string;
  label?: string;
}): EaExecutionCard {
  return {
    id: `nav_${input.href}`,
    kind: "navigation",
    title: input.title,
    body: input.body,
    actions: [
      {
        id: "go",
        label: input.label ?? "Open module",
        variant: "primary",
        intent: "navigate",
        href: input.href,
      },
    ],
  };
}

export function buildExecutionProgressCard(input: {
  title: string;
  progressPct: number;
  steps?: EaWorkflowStepView[];
  estimatedLabel?: string;
}): EaExecutionCard {
  return {
    id: `progress_${Date.now()}`,
    kind: "execution_progress",
    title: input.title,
    subtitle: input.estimatedLabel,
    progressPct: Math.min(100, Math.max(0, input.progressPct)),
    steps: input.steps,
    statusTone: "info",
  };
}

export function buildApprovalCard(input: {
  title: string;
  summary: string;
  fields?: EaCardField[];
  planId?: string;
  riskLevel?: EaExecutionCard["riskLevel"];
}): EaExecutionCard {
  return {
    id: `approval_${input.planId ?? "plan"}`,
    kind: "approval",
    title: input.title,
    body: input.summary,
    fields: input.fields,
    riskLevel: input.riskLevel ?? "medium",
    actions: [
      {
        id: "approve",
        label: "Approve",
        variant: "primary",
        intent: "approve_plan",
        planId: input.planId,
      },
      {
        id: "reject",
        label: "Reject",
        variant: "secondary",
        intent: "reject_plan",
        planId: input.planId,
      },
    ],
  };
}

/** Short headline for chat bubble when cards carry the detail. */
export function shortCardLead(cards: EaExecutionCard[]): string {
  const primary = cards[0];
  if (!primary) return "";
  switch (primary.kind) {
    case "creation_form":
      return primary.body ?? `Complete ${primary.title} to continue.`;
    case "workflow":
      return `${primary.title} — ${primary.steps?.length ?? 0} steps ready.`;
    case "summary":
      return primary.title;
    case "confirmation":
    case "approval":
      return "Review and approve to execute.";
    case "execution_progress":
      return `Executing… ${primary.progressPct ?? 0}%`;
    default:
      return primary.title;
  }
}
