import {
  updateFundraisingPipelineStage,
} from "@/lib/onwardair/executive-mutations-store";
import type { AssistantActionDefinition } from "../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export const updateFundraisingPipelineStageAction: AssistantActionDefinition = {
  id: "fundraising.updatePipelineStage",
  name: "Update fundraising pipeline stage",
  description:
    "Move an investor deal to a new Seed pipeline stage. Use when the user asks to advance, update, or pass a fundraising deal.",
  module: "strategy",
  requiredPermissions: ["authenticated", "canAccessStrategy"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      dealId: { type: "string" },
      investor: { type: "string" },
      firm: { type: "string" },
      stage: { type: "string" },
      notes: { type: "string" },
    },
    required: ["stage"],
  },
  capability: {
    id: "fundraising.updatePipelineStage",
    businessObject: "FundraisingPipelineDeal",
    intentExamples: [
      "Move Elena Vasquez to diligence",
      "Advance Horizon Ventures to term sheet",
      "Mark the Joby follow-on intro as passed",
      "Update seed pipeline — Atlas to meeting stage",
    ],
    semanticAliases: ["fundraising", "pipeline", "investor", "seed", "stage", "advance", "move"],
    entityExtraction: {
      primaryNameFields: ["investor", "firm"],
      fields: [
        { field: "investor", from: "person" },
        { field: "firm", from: "named_entity" },
      ],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Pipeline updated — {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [{ label: "Summarise seed pipeline", actionId: "onwardair.queryModule" }],
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.permissions.canAccessStrategy) {
        return { ok: false, errors: ["Strategy / fundraising access required."], warnings: [] };
      }
      const stage = asTrimmedString(input.stage);
      const hasTarget =
        asTrimmedString(input.dealId) ||
        asTrimmedString(input.investor) ||
        asTrimmedString(input.firm);
      const errors: string[] = [];
      if (!stage) errors.push("Provide the target pipeline stage.");
      if (!hasTarget) errors.push("Provide dealId, investor, or firm.");
      return { ok: errors.length === 0, errors, warnings: [] };
    },

    async preview(input) {
      const investor = asTrimmedString(input.investor) || asTrimmedString(input.firm) || "deal";
      const stage = asTrimmedString(input.stage);
      return {
        summary: `Move ${investor} to ${stage}`,
        affectedRecords: [
          { type: "fundraising_pipeline_deal", label: investor, change: `Stage → ${stage}` },
        ],
        warnings: [],
        reversible: false,
      };
    },

    async execute(input) {
      const result = updateFundraisingPipelineStage({
        dealId: asTrimmedString(input.dealId) || undefined,
        investor: asTrimmedString(input.investor) || undefined,
        firm: asTrimmedString(input.firm) || undefined,
        stage: asTrimmedString(input.stage),
        notes: asTrimmedString(input.notes) || undefined,
      });

      if (!result.ok) {
        return { ok: false, message: result.error };
      }

      return {
        ok: true,
        message: `${result.after.investor} moved to ${result.after.stage}.`,
        recordId: result.dealId,
        recordLabel: `${result.after.investor} · ${result.after.stage}`,
        beforeState: { stage: result.before.stage },
        afterState: { stage: result.after.stage, lastTouch: result.after.lastTouch },
        output: { dealId: result.dealId, stage: result.after.stage },
      };
    },
  },
};
