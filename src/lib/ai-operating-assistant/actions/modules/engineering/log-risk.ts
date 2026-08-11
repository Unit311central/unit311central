import { logEngineeringRiskViaEa } from "@/lib/onwardair/executive-mutations-store";
import type { OaEngRisk } from "@/lib/onwardair/engineering-data";
import type { AssistantActionDefinition } from "../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSeverity(raw: string): OaEngRisk["severity"] | null {
  const key = raw.trim().toLowerCase();
  if (key === "critical" || key === "high" || key === "medium" || key === "low") return key;
  return null;
}

export const logEngineeringRiskAction: AssistantActionDefinition = {
  id: "engineering.logRisk",
  name: "Log engineering risk",
  description:
    "Record an engineering programme risk on the OnwardAir register. Use when the user asks to log, flag, or track a VTOL / FLEX Pod risk.",
  module: "strategy",
  requiredPermissions: ["authenticated", "canAccessStrategy"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      title: { type: "string" },
      program: { type: "string" },
      severity: { type: "string" },
      owner: { type: "string" },
      dueDate: { type: "string" },
      mitigation: { type: "string" },
    },
    required: ["title", "program"],
  },
  capability: {
    id: "engineering.logRisk",
    businessObject: "EngineeringRisk",
    intentExamples: [
      "Log a high engineering risk on battery thermal runaway testing",
      "Flag FLEX Pod supply chain delay as critical risk",
      "Add engineering risk — flight controls integration slip",
    ],
    semanticAliases: ["engineering", "risk", "vtol", "flex pod", "programme", "log", "flag"],
    entityExtraction: {
      primaryNameFields: ["title", "program"],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Engineering risk logged — {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.permissions.canAccessStrategy) {
        return { ok: false, errors: ["Engineering / strategy access required."], warnings: [] };
      }
      const errors: string[] = [];
      if (!asTrimmedString(input.title)) errors.push("Provide a risk title.");
      if (!asTrimmedString(input.program)) errors.push("Provide a programme name.");
      const severity = asTrimmedString(input.severity);
      if (severity && !normalizeSeverity(severity)) {
        errors.push("Severity must be critical, high, medium, or low.");
      }
      return { ok: errors.length === 0, errors, warnings: [] };
    },

    async preview(input) {
      const title = asTrimmedString(input.title);
      const program = asTrimmedString(input.program);
      return {
        summary: `Log ${asTrimmedString(input.severity) || "medium"} risk — ${title} (${program})`,
        affectedRecords: [{ type: "engineering_risk", id: "new", label: title, change: "Create" }],
        warnings: [],
        reversible: false,
      };
    },

    async execute(input) {
      const severityRaw = asTrimmedString(input.severity);
      const severity = severityRaw ? normalizeSeverity(severityRaw) : undefined;
      if (severityRaw && !severity) {
        return { ok: false, message: `Unknown severity “${severityRaw}”.` };
      }

      const result = logEngineeringRiskViaEa({
        title: asTrimmedString(input.title),
        program: asTrimmedString(input.program),
        severity,
        owner: asTrimmedString(input.owner) || undefined,
        dueDate: asTrimmedString(input.dueDate) || undefined,
        mitigation: asTrimmedString(input.mitigation) || undefined,
      });

      if (!result.ok) {
        return { ok: false, message: result.error };
      }

      return {
        ok: true,
        message: `Engineering risk logged — ${result.risk.title}.`,
        recordId: result.risk.id,
        recordLabel: `${result.risk.title} · ${result.risk.severity}`,
        afterState: result.risk as unknown as Record<string, unknown>,
        output: { riskId: result.risk.id },
      };
    },
  },
};
