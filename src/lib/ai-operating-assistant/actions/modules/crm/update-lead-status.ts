import { LEAD_STATUS_OPTIONS, type LeadStatus } from "@/lib/crm-data";
import { listLeads, updateLead, type CrmWorkspaceScope } from "@/lib/crm-leads-service";
import type { AssistantActionDefinition } from "../../types";
import type { AssistantBusinessContext } from "../../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function crmScope(business: AssistantBusinessContext): CrmWorkspaceScope {
  return { workspaceId: business.workspace.id?.trim() || null };
}

function normalizeStatus(raw: string): LeadStatus | null {
  const hit = LEAD_STATUS_OPTIONS.find(
    (s) => s.toLowerCase() === raw.trim().toLowerCase(),
  );
  return hit ?? null;
}

async function resolveLead(input: Record<string, unknown>, scope: CrmWorkspaceScope) {
  const leadId = asTrimmedString(input.leadId);
  const companyName = asTrimmedString(input.companyName || input.leadName);
  const leads = await listLeads("All", scope);
  if (leadId) {
    const byId = leads.find((l) => l.id === leadId);
    if (byId) return { ok: true as const, lead: byId };
  }
  if (!companyName) {
    return { ok: false as const, errors: ["Provide a lead company name or leadId."] };
  }
  const key = companyName.toLowerCase();
  const matches = leads.filter((l) => l.companyName.toLowerCase().includes(key));
  if (matches.length === 0) {
    return { ok: false as const, errors: [`No CRM lead found matching “${companyName}”.`] };
  }
  if (matches.length > 1) {
    const exact = matches.find((l) => l.companyName.toLowerCase() === key);
    if (exact) return { ok: true as const, lead: exact };
    return {
      ok: false as const,
      errors: [
        `Multiple leads match “${companyName}”: ${matches
          .slice(0, 5)
          .map((l) => l.companyName)
          .join(", ")}.`,
      ],
    };
  }
  return { ok: true as const, lead: matches[0]! };
}

export const updateLeadStatusAction: AssistantActionDefinition = {
  id: "crm.updateLeadStatus",
  name: "Update CRM lead status",
  description:
    "Move a CRM lead to another pipeline stage (Cold/Warm/Hot/Won/Lost/Active Customer).",
  module: "crm",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: true,
  inputSchema: {
    type: "object",
    properties: {
      leadId: { type: "string" },
      companyName: { type: "string" },
      leadName: { type: "string" },
      status: { type: "string" },
    },
    required: ["status"],
  },
  capability: {
    id: "crm.updateLeadStatus",
    businessObject: "CrmLead",
    intentExamples: [
      "Move the Riverside corridor deal to negotiation",
      "Qualify Summit Rail as a warm opportunity",
      "Mark Peak Infrastructure as Hot",
      "Update CRM lead status to Won",
    ],
    semanticAliases: [
      "crm",
      "lead",
      "pipeline",
      "qualify",
      "stage",
      "status",
      "hot",
      "warm",
      "cold",
      "won",
      "lost",
      "move",
      "mark",
    ],
    entityExtraction: {
      primaryNameFields: ["companyName", "leadName"],
      fields: [
        { field: "companyName", from: "named_entity" },
        { field: "leadName", from: "named_entity" },
      ],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Lead status updated.\n\n{recordLabel}\n{fromStatus} → {toStatus}",
      fields: [
        { token: "recordLabel", path: "result.recordLabel" },
        { token: "fromStatus", path: "result.fromStatus" },
        { token: "toStatus", path: "result.toStatus" },
      ],
    },
    suggestedFollowUps: [
      { label: "Convert lead to client", actionId: "crm.convertLeadToClient" },
    ],
    relationships: {
      suggestedNext: [
        {
          label: "Convert lead to client",
          actionId: "crm.convertLeadToClient",
          reason: "Lead Won / Active",
        },
      ],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const status = normalizeStatus(asTrimmedString(input.status));
      if (!status) {
        return {
          ok: false,
          errors: [`Status must be one of: ${LEAD_STATUS_OPTIONS.join(", ")}.`],
          warnings: [],
        };
      }
      const resolved = await resolveLead(input, crmScope(ctx.business));
      if (!resolved.ok) return { ok: false, errors: resolved.errors, warnings: [] };
      const warnings: string[] = [];
      if (status === "Won") {
        warnings.push("Setting Won also promotes the lead into Client Directory.");
      }
      return { ok: true, errors: [], warnings };
    },

    async preview(input, ctx) {
      const status = normalizeStatus(asTrimmedString(input.status)) ?? "Hot";
      const resolved = await resolveLead(input, crmScope(ctx.business));
      if (!resolved.ok) {
        return {
          summary: "Update lead status (not found)",
          affectedRecords: [],
          warnings: resolved.errors,
          reversible: true,
        };
      }
      return {
        summary: `Move “${resolved.lead.companyName}” ${resolved.lead.status} → ${status}`,
        affectedRecords: [
          {
            type: "crm_lead",
            id: resolved.lead.id,
            label: resolved.lead.companyName,
            change: `${resolved.lead.status} → ${status}`,
          },
        ],
        warnings:
          status === "Won"
            ? ["Won status also creates/updates a Client Directory row."]
            : [],
        reversible: true,
      };
    },

    async execute(input, ctx) {
      const status = normalizeStatus(asTrimmedString(input.status));
      if (!status) {
        return { ok: false, message: "Invalid lead status." };
      }
      const scope = crmScope(ctx.business);
      const resolved = await resolveLead(input, scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" ") };
      }
      const previous = resolved.lead.status;
      const updated = await updateLead(resolved.lead.id, { status }, scope);
      return {
        ok: true,
        message: `Lead “${updated.companyName}” moved to ${updated.status}.`,
        recordId: updated.id,
        recordLabel: updated.companyName,
        beforeState: { status: previous },
        afterState: { status: updated.status },
        output: {
          leadId: updated.id,
          fromStatus: previous,
          toStatus: updated.status,
        },
      };
    },

    async rollback(input, ctx) {
      const previousStatus = asTrimmedString(ctx.executeResult.beforeState?.status);
      const status = normalizeStatus(previousStatus);
      if (!status) return { ok: false, message: "No prior status to restore." };
      const scope = crmScope(ctx.business);
      const resolved = await resolveLead(input, scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" ") };
      }
      const updated = await updateLead(resolved.lead.id, { status }, scope);
      return {
        ok: true,
        message: `Lead status restored to ${updated.status}.`,
      };
    },
  },
};
