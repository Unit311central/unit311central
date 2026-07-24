import { promoteCrmLeadToClient } from "@/lib/crm-lead-client-service";
import { listLeads, type CrmWorkspaceScope } from "@/lib/crm-leads-service";
import type { AssistantActionDefinition } from "../../types";
import type { AssistantBusinessContext } from "../../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function crmScope(business: AssistantBusinessContext): CrmWorkspaceScope {
  return { workspaceId: business.workspace.id?.trim() || null };
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

export const convertLeadToClientAction: AssistantActionDefinition = {
  id: "crm.convertLeadToClient",
  name: "Convert CRM lead to client",
  description:
    "Promote a CRM lead into Client Directory (starts at Client Created). Use for convert potential/lead to client.",
  module: "crm",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      leadId: { type: "string" },
      companyName: { type: "string" },
      leadName: { type: "string" },
    },
  },
  capability: {
    id: "crm.convertLeadToClient",
    businessObject: "CrmLead",
    intentExamples: [
      "Convert Peak Infrastructure from potential to active client",
      "Promote the Harbour Mapping lead to a client",
      "Convert this CRM lead into the client directory",
    ],
    semanticAliases: [
      "convert",
      "promote",
      "potential",
      "lead",
      "crm",
      "client",
      "customer",
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
      template:
        "Lead converted to Client Directory.\n\nClient\n{recordLabel}\n\nStatus starts at Client Created — activate when ready.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [
      { label: "Activate client", actionId: "clients.activateClient" },
    ],
    relationships: {
      suggestedNext: [
        {
          label: "Activate client",
          actionId: "clients.activateClient",
          reason: "Directory row created",
        },
      ],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      const resolved = await resolveLead(input, crmScope(ctx.business));
      if (!resolved.ok) return { ok: false, errors: resolved.errors, warnings: [] };
      return {
        ok: true,
        errors: [],
        warnings: [
          "Directory status will be Client Created (not Active) until you activate the client.",
        ],
      };
    },

    async preview(input, ctx) {
      const resolved = await resolveLead(input, crmScope(ctx.business));
      if (!resolved.ok) {
        return {
          summary: "Convert lead (not found)",
          affectedRecords: [],
          warnings: resolved.errors,
          reversible: false,
        };
      }
      return {
        summary: `Convert CRM lead “${resolved.lead.companyName}” into Client Directory`,
        affectedRecords: [
          {
            type: "crm_lead",
            id: resolved.lead.id,
            label: resolved.lead.companyName,
            change: "Promote → Client Directory (Client Created)",
          },
        ],
        warnings: ["Does not set account status to Active automatically."],
        reversible: false,
      };
    },

    async execute(input, ctx) {
      const scope = crmScope(ctx.business);
      const resolved = await resolveLead(input, scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" "), data: {} };
      }
      const client = await promoteCrmLeadToClient(resolved.lead.id, scope);
      return {
        ok: true,
        message: `“${client.companyName}” is in Client Directory (${client.accountStatus}).`,
        data: {
          recordId: client.id,
          recordLabel: client.companyName,
          accountStatus: client.accountStatus,
          leadId: resolved.lead.id,
        },
      };
    },
  },
};
