import { getInvoiceById } from "@/lib/accounting/invoices-service";
import { resolveInvoiceRecipientEmail } from "@/lib/accounting/onboarding-invoice";
import { daysOverdue, isLiveInvoiceOverdue } from "@/lib/ai-operating-assistant/live-finance";
import { sendMailboxEmail } from "@/lib/email/smtp";
import { getInternalClient } from "@/lib/internal-clients-service";
import type { AssistantActionDefinition } from "../../types";

function asTrimmedString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function buildChaseBody(input: {
  clientName: string;
  invoiceNumber: string;
  amountLabel: string;
  dueDate: string;
  days: number;
  paymentReference: string;
  customMessage?: string;
  senderName: string;
}) {
  const custom = input.customMessage?.trim();
  const lines = [
    `Dear Accounts Payable,`,
    ``,
    custom ||
      `I am writing regarding overdue invoice ${input.invoiceNumber} for ${input.clientName}.`,
    ``,
    `Invoice: ${input.invoiceNumber}`,
    `Amount: ${input.amountLabel}`,
    `Due date: ${input.dueDate}`,
    `Days overdue: ${input.days}`,
    `Payment reference: ${input.paymentReference}`,
    ``,
    `Please confirm payment status or advise when settlement will clear.`,
    ``,
    `Kind regards,`,
    input.senderName,
    `Accounts receivable`,
  ];
  return lines.join("\n");
}

export const chaseOverdueInvoiceAction: AssistantActionDefinition = {
  id: "finance.chaseOverdueInvoice",
  name: "Chase overdue invoice",
  description:
    "Email the client's accounts payable contact to chase an overdue invoice from the live ledger.",
  module: "finance",
  requiredPermissions: ["authenticated", "canAccessFinancials"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      invoiceId: { type: "string" },
      invoiceNumber: { type: "string" },
      clientName: { type: "string" },
      toEmail: { type: "string" },
      message: { type: "string" },
      draftOnly: { type: "boolean" },
    },
    required: [],
  },
  capability: {
    id: "finance.chaseOverdueInvoice",
    businessObject: "Invoice",
    intentExamples: [
      "Chase the overdue invoice for Peak Infrastructure",
      "Send an AR chase email for invoice INV-1004",
      "Follow up on overdue receivables for Acme",
      "Email accounts about the overdue invoice",
    ],
    semanticAliases: [
      "chase",
      "overdue",
      "invoice",
      "receivable",
      "ar",
      "collections",
      "follow-up",
      "followup",
      "remind",
      "payment",
    ],
    entityExtraction: {
      primaryNameFields: ["clientName", "invoiceNumber"],
      fields: [
        { field: "clientName", from: "named_entity" },
        { field: "toEmail", from: "email" },
      ],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Chase email sent for {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [
      { label: "Schedule payment follow-up", actionId: "calendar.scheduleMeeting" },
      { label: "Log related expense", actionId: "finance.createExpense" },
    ],
    relationships: {
      suggestedNext: [
        {
          label: "Schedule follow-up meeting",
          actionId: "calendar.scheduleMeeting",
          reason: "Invoice Chased",
        },
      ],
    },
  },
  handler: {
    async validate(input, ctx) {
      if (!ctx.business.user.id) {
        return { ok: false, errors: ["Authentication required."], warnings: [] };
      }
      if (!ctx.business.permissions.canAccessFinancials) {
        return { ok: false, errors: ["Financials access required."], warnings: [] };
      }
      const invoiceId = asTrimmedString(input.invoiceId);
      const invoiceNumber = asTrimmedString(input.invoiceNumber);
      const clientName = asTrimmedString(input.clientName);
      if (!invoiceId && !invoiceNumber && !clientName) {
        return {
          ok: false,
          errors: ["Provide invoiceId, invoiceNumber, or clientName for the overdue invoice."],
          warnings: [],
        };
      }
      return { ok: true, errors: [], warnings: [] };
    },

    async preview(input, ctx) {
      const scope = { workspaceId: ctx.business.workspace.id };
      const invoiceId = asTrimmedString(input.invoiceId);
      let invoice = invoiceId ? await getInvoiceById(invoiceId, scope) : null;
      if (!invoice) {
        const { loadLiveInvoices } = await import(
          "@/lib/ai-operating-assistant/live-finance"
        );
        const load = await loadLiveInvoices();
        if (load.ok) {
          const invoiceNumber = asTrimmedString(input.invoiceNumber).toLowerCase();
          const clientName = asTrimmedString(input.clientName).toLowerCase();
          invoice =
            load.overdue.find(
              (row) =>
                (invoiceNumber && row.invoiceNumber.toLowerCase() === invoiceNumber) ||
                (clientName && (row.clientName ?? "").toLowerCase().includes(clientName)),
            ) ?? null;
        }
      }

      const label = invoice
        ? `${invoice.invoiceNumber} · ${invoice.clientName ?? "client"}`
        : asTrimmedString(input.invoiceNumber) ||
          asTrimmedString(input.clientName) ||
          "overdue invoice";

      return {
        summary: `Chase overdue invoice ${label}`,
        affectedRecords: [
          {
            type: "invoice",
            id: invoice?.id ?? (invoiceId || "unknown"),
            label,
            change: input.draftOnly ? "Draft chase email" : "Send chase email",
          },
        ],
        warnings: invoice && !isLiveInvoiceOverdue(invoice)
          ? ["This invoice is not currently flagged as overdue."]
          : [],
        reversible: false,
      };
    },

    async execute(input, ctx) {
      const scope = { workspaceId: ctx.business.workspace.id };
      const invoiceId = asTrimmedString(input.invoiceId);
      let invoice = invoiceId ? await getInvoiceById(invoiceId, scope) : null;

      if (!invoice) {
        const { loadLiveInvoices } = await import(
          "@/lib/ai-operating-assistant/live-finance"
        );
        const load = await loadLiveInvoices();
        if (!load.ok) {
          return { ok: false, message: load.error };
        }
        const invoiceNumber = asTrimmedString(input.invoiceNumber).toLowerCase();
        const clientName = asTrimmedString(input.clientName).toLowerCase();
        invoice =
          load.overdue.find(
            (row) =>
              (invoiceNumber && row.invoiceNumber.toLowerCase() === invoiceNumber) ||
              (clientName && (row.clientName ?? "").toLowerCase().includes(clientName)),
          ) ??
          load.invoices.find(
            (row) =>
              (invoiceNumber && row.invoiceNumber.toLowerCase() === invoiceNumber) ||
              (invoiceId && row.id === invoiceId),
          ) ??
          null;
      }

      if (!invoice) {
        return {
          ok: false,
          message: "Could not find that invoice in the live ledger.",
        };
      }

      if (!isLiveInvoiceOverdue(invoice)) {
        return {
          ok: false,
          message: `Invoice ${invoice.invoiceNumber} is not overdue.`,
        };
      }

      const client = await getInternalClient(invoice.clientId, scope).catch(() => null);
      const toEmail =
        asTrimmedString(input.toEmail) ||
        (client ? resolveInvoiceRecipientEmail(client) : "") ||
        "";
      if (!toEmail) {
        return {
          ok: false,
          message:
            "No accounts payable email on the client record. Provide toEmail or update the client AP contact.",
        };
      }

      const days = daysOverdue(invoice);
      const amountLabel = `${invoice.currency} ${invoice.amount.toLocaleString()}`;
      const subject = `Overdue invoice ${invoice.invoiceNumber} — ${invoice.clientName ?? "payment reminder"}`;
      const text = buildChaseBody({
        clientName: invoice.clientName ?? client?.companyName ?? "your organisation",
        invoiceNumber: invoice.invoiceNumber,
        amountLabel,
        dueDate: invoice.dueDate,
        days,
        paymentReference: invoice.paymentReference,
        customMessage: asTrimmedString(input.message) || undefined,
        senderName: ctx.business.user.displayName,
      });

      if (input.draftOnly === true) {
        return {
          ok: true,
          message: `Chase draft ready for ${invoice.invoiceNumber} → ${toEmail}.`,
          recordId: invoice.id,
          recordLabel: invoice.invoiceNumber,
          beforeState: { status: invoice.status },
          afterState: { drafted: true, toEmail, subject },
          output: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            toEmail,
            subject,
            body: text,
            drafted: true,
          },
        };
      }

      const sent = await sendMailboxEmail({
        account: "info",
        workspaceId: ctx.business.workspace.id,
        to: toEmail,
        subject,
        text,
        html: `<pre style="font-family:inherit;white-space:pre-wrap;">${text
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")}</pre>`,
      });

      return {
        ok: true,
        message: `Chase email sent for ${invoice.invoiceNumber} → ${toEmail}.`,
        recordId: invoice.id,
        recordLabel: `${invoice.invoiceNumber} · ${invoice.clientName ?? "client"}`,
        beforeState: { status: invoice.status, chased: false },
        afterState: {
          status: invoice.status,
          chased: true,
          toEmail,
          messageId: sent.messageId,
        },
        output: {
          invoiceId: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          clientId: invoice.clientId,
          clientName: invoice.clientName,
          toEmail,
          subject,
          messageId: sent.messageId,
          daysOverdue: days,
        },
      };
    },
  },
};
