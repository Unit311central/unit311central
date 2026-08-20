/**
 * Adapters: plans / execute outcomes → execution cards.
 * Client-safe where possible; registry lookups require modules registered on server.
 */

import type { AssistantActionDefinition } from "./actions/types";
import {
  buildApprovalCard,
  buildConfirmationCard,
  buildDocumentCard,
  buildExecutionProgressCard,
  buildNavigationCard,
  buildRiskCard,
  buildSummaryCard,
  type EaCardField,
  type EaExecutionCard,
  type EaWorkflowStepView,
} from "./execution-cards";
import type { AssistantFollowUpAction } from "./tool-result";
import type { AssistantMessageArtifact } from "./types";

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (c) => c.toUpperCase())
    .trim();
}

function fieldsFromRecord(record: Record<string, unknown>, limit = 8): EaCardField[] {
  const fields: EaCardField[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (value == null || value === "") continue;
    if (typeof value === "object") continue;
    fields.push({
      key,
      label: humanize(key),
      value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
    });
    if (fields.length >= limit) break;
  }
  return fields;
}

export function cardsFromProposedPlan(input: {
  planId: string;
  title: string;
  summary: string;
  steps: Array<{
    stepId: string;
    actionId: string;
    name: string;
    status: string;
    input?: Record<string, unknown>;
    previewSummary?: string | null;
  }>;
  warnings?: string[];
  riskLevel?: "low" | "medium" | "high" | "critical";
  highRisk?: boolean;
}): EaExecutionCard[] {
  const risk = input.riskLevel ?? (input.highRisk ? "high" : "medium");
  const highRisk =
    input.highRisk ??
    (risk === "high" ||
      risk === "critical" ||
      input.steps.some((s) => /archive|delete|merge|terminate|payment/i.test(s.actionId)));

  const fields: EaCardField[] = [];
  const first = input.steps[0];
  if (first?.input) fields.push(...fieldsFromRecord(first.input));

  const cards: EaExecutionCard[] = [
    highRisk
      ? buildConfirmationCard({
          title: input.title,
          summary: input.summary,
          riskLevel: risk,
          fields,
          warnings: input.warnings,
          planId: input.planId,
          highRisk: true,
        })
      : buildApprovalCard({
          title: input.title,
          summary: input.summary,
          fields,
          planId: input.planId,
          riskLevel: risk,
        }),
  ];

  if (input.steps.length > 1) {
    cards.unshift({
      id: `workflow_plan_${input.planId}`,
      kind: "workflow",
      title: input.title,
      subtitle: "Multi-step execution plan",
      body: input.summary,
      steps: input.steps.map(
        (step): EaWorkflowStepView => ({
          id: step.stepId,
          label: step.name,
          actionId: step.actionId,
          status:
            step.status === "succeeded"
              ? "succeeded"
              : step.status === "failed"
                ? "failed"
                : step.status === "running" || step.status === "executing"
                  ? "running"
                  : "pending",
          detail: step.previewSummary ?? undefined,
        }),
      ),
      statusTone: "info",
    });
  }

  const riskCard = buildRiskCard({
    warnings: input.warnings ?? [],
    riskLevel: risk,
  });
  if (riskCard) cards.push(riskCard);

  return cards;
}

export function cardsFromExecuteSuccess(input: {
  title: string;
  fields?: EaCardField[];
  body?: string;
  followUpActions?: AssistantFollowUpAction[];
  navigateHref?: string;
  navigateLabel?: string;
  meta?: Record<string, unknown>;
}): EaExecutionCard[] {
  const cards: EaExecutionCard[] = [
    buildSummaryCard({
      title: input.title.startsWith("✓") ? input.title : `✓ ${input.title}`,
      body: input.body,
      fields: input.fields,
      nextActions: input.followUpActions,
      statusTone: "success",
    }),
  ];
  if (input.meta && cards[0]) {
    cards[0] = { ...cards[0], meta: { ...cards[0].meta, ...input.meta } };
  }
  if (input.navigateHref) {
    cards.push(
      buildNavigationCard({
        title: input.navigateLabel ?? "Open related module",
        href: input.navigateHref,
        label: input.navigateLabel ?? "Open",
      }),
    );
  }
  return cards;
}

export function cardsFromArtifacts(artifacts: AssistantMessageArtifact[]): EaExecutionCard[] {
  return artifacts.map((artifact) =>
    buildDocumentCard({
      title: artifact.title,
      filename: artifact.filename,
      openUrl: artifact.openUrl,
      downloadUrl: artifact.downloadUrl,
    }),
  );
}

/** Success card for ABHI Board Pack Generation. */
export function cardsFromBoardPackSuccess(input: {
  packName: string;
  meetingDate: string;
  status: string;
  folderPath: string;
  boardDeckHref: string;
  pdfOpenUrl: string;
  pdfDownloadUrl: string;
  pptxDownloadUrl: string;
  followUpActions?: AssistantFollowUpAction[];
}): EaExecutionCard[] {
  return [
    {
      id: `boardpack_success_${input.meetingDate}`,
      kind: "summary",
      title: "Board Pack Generated Successfully",
      subtitle: input.packName,
      body: `Board Pack:\n${input.packName}`,
      fields: [
        { key: "pack", label: "Board Pack", value: input.packName },
        { key: "meeting", label: "Meeting date", value: input.meetingDate },
        { key: "status", label: "Status", value: input.status },
      ],
      statusTone: "success",
      actions: [
        {
          id: "preview",
          label: "View PDF",
          variant: "primary",
          intent: "open",
          href: input.pdfOpenUrl,
        },
        {
          id: "pdf",
          label: "Download PDF",
          variant: "secondary",
          intent: "navigate",
          href: input.pdfDownloadUrl,
        },
        {
          id: "pptx",
          label: "Download PowerPoint",
          variant: "secondary",
          intent: "navigate",
          href: input.pptxDownloadUrl,
        },
        {
          id: "open_board_deck",
          label: "Open Board Deck",
          variant: "ghost",
          intent: "navigate",
          href: input.boardDeckHref,
        },
      ],
      nextActions: input.followUpActions,
      meta: {
        boardPack: true,
        packName: input.packName,
        meetingDate: input.meetingDate,
      },
    },
  ];
}

/** Ask card when Board Pack cannot invent a meeting date. */
export function cardsFromBoardPackNeedsDate(input: {
  message: string;
  boardMeetingsHref?: string;
  followUpActions?: AssistantFollowUpAction[];
}): EaExecutionCard[] {
  const href = input.boardMeetingsHref ?? "/dashboard?view=board-meetings";
  return [
    {
      id: "boardpack_needs_meeting_date",
      kind: "summary",
      title: "Meeting Date Required",
      subtitle: "Board Pack - Meeting Date Not Set",
      body: input.message,
      fields: [
        {
          key: "pack",
          label: "Board Pack",
          value: "Board Pack - Meeting Date Not Set",
        },
      ],
      statusTone: "warning",
      actions: [
        {
          id: "open_board_meetings",
          label: "Open Board Meetings",
          variant: "primary",
          intent: "navigate",
          href,
        },
      ],
      nextActions: input.followUpActions,
      meta: {
        boardPack: true,
        needsMeetingDate: true,
      },
    },
  ];
}

export function cardsFromProgress(input: {
  title: string;
  progressPct: number;
  steps?: EaWorkflowStepView[];
  estimatedLabel?: string;
}): EaExecutionCard {
  return buildExecutionProgressCard(input);
}

export function successCardsFromDefinitions(input: {
  definitions: AssistantActionDefinition[];
  results: Array<{
    actionId: string;
    message: string;
    recordLabel?: string | null;
    recordId?: string | null;
    input?: Record<string, unknown>;
  }>;
  followUpActions?: AssistantFollowUpAction[];
}): EaExecutionCard[] {
  const succeeded = input.results.filter(Boolean);
  const primary = succeeded[0];
  const definition = primary
    ? input.definitions.find((d) => d.id === primary.actionId)
    : undefined;
  const title = primary?.recordLabel
    ? `${definition?.capability.businessObject ?? "Record"} ready`
    : definition?.name
      ? `${definition.name} complete`
      : "Action complete";

  const fields: EaCardField[] = [];
  if (primary?.recordLabel) {
    fields.push({ key: "name", label: "Name", value: primary.recordLabel });
  }
  if (primary?.recordId) {
    fields.push({ key: "id", label: "ID", value: primary.recordId });
  }
  if (primary?.input) {
    for (const [key, value] of Object.entries(primary.input)) {
      if (value == null || value === "" || typeof value === "object") continue;
      if (fields.some((f) => f.key === key)) continue;
      fields.push({ key, label: humanize(key), value: String(value) });
      if (fields.length >= 6) break;
    }
  }

  return cardsFromExecuteSuccess({
    title,
    fields,
    body: undefined,
    followUpActions: input.followUpActions,
    meta: {
      clientId: primary?.recordId ?? null,
      clientName: primary?.recordLabel ?? null,
    },
  });
}
