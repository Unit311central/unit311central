import { ensureClientSubscriptionInvoice } from "@/lib/accounting/invoices-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { resolveFinancialsWorkspaceId } from "@/lib/financials-workspace";
import type { AssistantActionDefinition, AssistantActionHandlerContext } from "../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asAmount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.,-]/g, "").replace(",", ".");
    const parsed = Number.parseFloat(cleaned);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }
  return null;
}

async function resolveClientId(
  input: Record<string, unknown>,
  business: AssistantActionHandlerContext["business"],
): Promise<{ clientId: string; companyName: string } | null> {
  const explicitId = asTrimmedString(input.clientId);
  const clientName = asTrimmedString(input.clientName) || asTrimmedString(input.companyName);
  const clients = await listInternalClients({
    workspaceId: business.workspace.id ?? undefined,
  });
  if (explicitId) {
    const match = clients.find((c) => c.id === explicitId);
    if (match) return { clientId: match.id, companyName: match.companyName };
  }
  if (clientName) {
    const lower = clientName.toLowerCase();
    const match =
      clients.find((c) => c.companyName.toLowerCase() === lower) ??
      clients.find((c) => c.companyName.toLowerCase().includes(lower));
    if (match) return { clientId: match.id, companyName: match.companyName };
  }
  return null;
}

export const createInvoiceAction: AssistantActionDefinition = {
  id: "finance.createInvoice",
  name: "Create invoice",
  description:
    "Issue a new accounts receivable invoice for a client in the current workspace.",
  module: "finance",
  requiredPermissions: ["authenticated", "canAccessFinancials"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      clientId: { type: "string" },
      clientName: { type: "string" },
      companyName: { type: "string" },
      amount: { type: "number" },
      currency: { type: "string" },
      dueImmediately: { type: "boolean" },
    },
    required: ["clientName"],
  },
  capability: {
    id: "finance.createInvoice",
    businessObject: "Invoice",
    intentExamples: [
      "Create an invoice for Acme Corp",
      "Build me an invoice for Peak Infrastructure for £5000",
      "Issue invoice to Northwind for 12000 GBP",
    ],
    semanticAliases: ["invoice", "invoices", "bill", "billing", "accounts receivable", "ar"],
    entityExtraction: {
      primaryNameFields: ["clientName", "companyName"],
      fields: [{ field: "clientName", from: "named_entity" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Invoice {recordLabel} issued for {clientName}.",
      fields: [
        { token: "recordLabel", path: "result.recordLabel" },
        { token: "clientName", path: "input.clientName" },
      ],
    },
    suggestedFollowUps: [
      { label: "Chase overdue invoice", actionId: "finance.chaseOverdueInvoice" },
    ],
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.permissions.canAccessFinancials) {
        return { ok: false, errors: ["Financials access required."], warnings: [] };
      }
      const clientName = asTrimmedString(input.clientName) || asTrimmedString(input.companyName);
      const errors: string[] = [];
      if (!clientName && !asTrimmedString(input.clientId)) {
        errors.push("Which client should this invoice be for?");
      }
      const amount = asAmount(input.amount);
      if (input.amount != null && amount == null) {
        errors.push("Invoice amount must be a positive number.");
      }
      return { ok: errors.length === 0, errors, warnings: [] };
    },
    async preview(input) {
      const clientName =
        asTrimmedString(input.clientName) ||
        asTrimmedString(input.companyName) ||
        "Selected client";
      const amount = asAmount(input.amount);
      return {
        summary: `Issue invoice for ${clientName}${amount ? ` (${amount})` : ""}.`,
        affectedRecords: [
          { type: "invoice", id: "new", label: clientName, change: "Create issued invoice" },
        ],
        warnings: [],
        reversible: false,
      };
    },
    async execute(input, ctx) {
      const resolved = await resolveClientId(input, ctx.business);
      if (!resolved) {
        return {
          ok: false,
          message: "I couldn't find that client in your workspace. Please provide the exact client name.",
          error: "client_not_found",
        };
      }
      const workspaceId = await resolveFinancialsWorkspaceId({
        workspaceId: ctx.business.workspace.id,
      });
      const amount = asAmount(input.amount) ?? undefined;
      const currency = asTrimmedString(input.currency) || undefined;
      const invoice = await ensureClientSubscriptionInvoice({
        clientId: resolved.clientId,
        workspaceId,
        companyName: resolved.companyName,
        organisationId: ctx.business.organisation.id,
        amount,
        currency,
        dueImmediately: input.dueImmediately === true,
      });
      return {
        ok: true,
        message: `Invoice ${invoice.invoiceNumber} issued for ${resolved.companyName} (${invoice.currency} ${invoice.amount}).`,
        recordId: invoice.id,
        recordLabel: invoice.invoiceNumber,
        afterState: {
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.amount,
          currency: invoice.currency,
          status: invoice.status,
        },
      };
    },
  },
};
