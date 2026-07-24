import { updateInternalClient } from "@/lib/internal-clients-service";
import { normalizeClientAccountStatus } from "@/lib/client-management-data";
import type { AssistantActionDefinition } from "../../types";
import {
  asTrimmedString,
  requireWorkspaceScope,
  resolveClientRef,
} from "./helpers";

export const activateClientAction: AssistantActionDefinition = {
  id: "clients.activateClient",
  name: "Activate client",
  description:
    "Set a client directory account to Active. Use after converting a lead or finishing onboarding.",
  module: "clients",
  requiredPermissions: ["authenticated"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: true,
  inputSchema: {
    type: "object",
    properties: {
      clientId: { type: "string" },
      clientName: { type: "string" },
    },
  },
  capability: {
    id: "clients.activate",
    businessObject: "Client",
    intentExamples: [
      "Activate Peak Infrastructure",
      "Make Harbour Mapping an active client",
      "Set this client to Active",
    ],
    semanticAliases: ["activate", "active", "client", "customer", "go live"],
    entityExtraction: {
      primaryNameFields: ["clientName"],
      fields: [{ field: "clientName", from: "named_entity" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Client activated.\n\nName\n{recordLabel}",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [],
    relationships: { suggestedNext: [] },
  },
  handler: {
    async validate(input, ctx) {
      const ws = requireWorkspaceScope(ctx.business);
      if (!ws.ok) return ws.validation;
      const resolved = await resolveClientRef(input, ws.scope);
      if (!resolved.ok) return { ok: false, errors: resolved.errors, warnings: [] };
      const status = normalizeClientAccountStatus(resolved.client.accountStatus);
      if (status === "Active") {
        return {
          ok: false,
          errors: [`“${resolved.client.companyName}” is already Active.`],
          warnings: [],
        };
      }
      if (status === "Archived") {
        return {
          ok: false,
          errors: [`Restore “${resolved.client.companyName}” before activating.`],
          warnings: [],
        };
      }
      return { ok: true, errors: [], warnings: [] };
    },

    async preview(input, ctx) {
      const ws = requireWorkspaceScope(ctx.business);
      if (!ws.ok) {
        return {
          summary: "Activate client (blocked)",
          affectedRecords: [],
          warnings: ws.validation.errors,
          reversible: true,
        };
      }
      const resolved = await resolveClientRef(input, ws.scope);
      if (!resolved.ok) {
        return {
          summary: "Activate client (not found)",
          affectedRecords: [],
          warnings: resolved.errors,
          reversible: true,
        };
      }
      return {
        summary: `Activate “${resolved.client.companyName}” (${resolved.client.accountStatus} → Active)`,
        affectedRecords: [
          {
            type: "client",
            id: resolved.client.id,
            label: resolved.client.companyName,
            change: `${resolved.client.accountStatus} → Active`,
          },
        ],
        warnings: [],
        reversible: true,
      };
    },

    async execute(input, ctx) {
      const ws = requireWorkspaceScope(ctx.business);
      if (!ws.ok) {
        return { ok: false, message: ws.validation.errors.join(" "), data: {} };
      }
      const resolved = await resolveClientRef(input, ws.scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" "), data: {} };
      }
      const previous = resolved.client.accountStatus;
      const updated = await updateInternalClient(
        resolved.client.id,
        { accountStatus: "Active" },
        ws.scope,
      );
      return {
        ok: true,
        message: `“${updated.companyName}” is now Active.`,
        data: {
          recordId: updated.id,
          recordLabel: updated.companyName,
          previousStatus: previous,
        },
      };
    },

    async rollback(input, ctx, prior) {
      const previousStatus = asTrimmedString(prior?.previousStatus);
      if (!previousStatus) {
        return { ok: false, message: "No prior status to restore.", data: {} };
      }
      const ws = requireWorkspaceScope(ctx.business);
      if (!ws.ok) {
        return { ok: false, message: ws.validation.errors.join(" "), data: {} };
      }
      const resolved = await resolveClientRef(input, ws.scope);
      if (!resolved.ok) {
        return { ok: false, message: resolved.errors.join(" "), data: {} };
      }
      const updated = await updateInternalClient(
        resolved.client.id,
        { accountStatus: previousStatus as "Client Created" },
        ws.scope,
      );
      return {
        ok: true,
        message: `Restored “${updated.companyName}” to ${updated.accountStatus}.`,
        data: { recordId: updated.id, recordLabel: updated.companyName },
      };
    },
  },
};
