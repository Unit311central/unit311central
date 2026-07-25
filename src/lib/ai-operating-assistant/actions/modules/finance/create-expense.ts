import {
  createExpense,
} from "@/lib/financial-expenses-service";
import {
  EXPENSE_CURRENCY_OPTIONS,
  type ExpenseCurrency,
} from "@/lib/expenses-data";
import type { AssistantActionDefinition } from "../../types";

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

function asCurrency(value: unknown): ExpenseCurrency {
  const raw = asTrimmedString(value).toUpperCase();
  if (EXPENSE_CURRENCY_OPTIONS.includes(raw as ExpenseCurrency)) {
    return raw as ExpenseCurrency;
  }
  return "EUR";
}

export const createExpenseAction: AssistantActionDefinition = {
  id: "finance.createExpense",
  name: "Log expense",
  description:
    "Create a financial expense claim in the live expenses ledger. Use when the user asks to log, record, or submit an expense.",
  module: "finance",
  requiredPermissions: ["authenticated", "canAccessFinancials"],
  confirmationRequired: true,
  auditRequired: true,
  undoCapable: false,
  inputSchema: {
    type: "object",
    properties: {
      purposeDescription: { type: "string" },
      amount: { type: "number" },
      currency: { type: "string" },
      supplier: { type: "string" },
      expenseDate: { type: "string" },
      paid: { type: "boolean" },
      categoryAccountCode: { type: "string" },
      reference: { type: "string" },
    },
    required: ["purposeDescription", "amount"],
  },
  capability: {
    id: "finance.createExpense",
    businessObject: "Expense",
    intentExamples: [
      "Log an expense of €85 for client lunch",
      "Record a £120 travel expense for the Oxford trip",
      "Submit an expense for software subscription $49",
      "Add an unpaid expense for hotel stay 240 EUR",
    ],
    semanticAliases: [
      "expense",
      "expenses",
      "claim",
      "receipt",
      "log",
      "record",
      "submit",
      "reimburse",
      "spend",
    ],
    entityExtraction: {
      primaryNameFields: ["purposeDescription", "supplier"],
      fields: [{ field: "supplier", from: "named_entity" }],
    },
    confirmationPolicy: "always",
    successFormatter: {
      template: "Expense logged — {recordLabel}.",
      fields: [{ token: "recordLabel", path: "result.recordLabel" }],
    },
    suggestedFollowUps: [
      { label: "Schedule follow-up meeting", actionId: "calendar.scheduleMeeting" },
    ],
    relationships: {
      suggestedNext: [
        {
          label: "Schedule follow-up",
          actionId: "calendar.scheduleMeeting",
          reason: "Expense Logged",
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
      const purpose =
        asTrimmedString(input.purposeDescription) ||
        asTrimmedString(input.purpose) ||
        asTrimmedString(input.description);
      const amount = asAmount(input.amount);
      const errors: string[] = [];
      if (!purpose) errors.push("Provide what the expense was for.");
      if (!amount) errors.push("Provide a positive expense amount.");
      return { ok: errors.length === 0, errors, warnings: [] };
    },

    async preview(input, ctx) {
      const purpose =
        asTrimmedString(input.purposeDescription) ||
        asTrimmedString(input.purpose) ||
        asTrimmedString(input.description) ||
        "Expense";
      const amount = asAmount(input.amount) ?? 0;
      const currency = asCurrency(input.currency);
      return {
        summary: `Log ${currency} ${amount.toLocaleString()} expense — ${purpose}`,
        affectedRecords: [
          {
            type: "financial_expense",
            id: "new",
            label: purpose,
            change: "Create",
          },
        ],
        warnings: ctx.business.permissions.canAccessFinancials
          ? []
          : ["Financials access may be restricted."],
        reversible: false,
      };
    },

    async execute(input, ctx) {
      const purpose =
        asTrimmedString(input.purposeDescription) ||
        asTrimmedString(input.purpose) ||
        asTrimmedString(input.description);
      const amount = asAmount(input.amount);
      if (!purpose || !amount) {
        return { ok: false, message: "Purpose and amount are required." };
      }

      const currency = asCurrency(input.currency);
      const expense = await createExpense(
        {
          submitterUserId: ctx.business.user.id,
          submitterName: ctx.business.user.displayName,
          purposeDescription: purpose,
          amount,
          currency,
          supplier: asTrimmedString(input.supplier) || null,
          expenseDate: asTrimmedString(input.expenseDate) || undefined,
          paid: Boolean(input.paid),
          categoryAccountCode: asTrimmedString(input.categoryAccountCode) || undefined,
          reference: asTrimmedString(input.reference) || null,
          workspaceId: ctx.business.workspace.id ?? undefined,
        },
        { workspaceId: ctx.business.workspace.id },
      );

      return {
        ok: true,
        message: `Expense logged — ${currency} ${amount.toLocaleString()} · ${purpose}.`,
        recordId: expense.id,
        recordLabel: `${currency} ${amount.toLocaleString()} · ${purpose}`,
        beforeState: null,
        afterState: {
          expenseId: expense.id,
          amount: expense.amount,
          currency: expense.currency,
          purpose: expense.purposeDescription,
          paid: expense.paid,
        },
        output: {
          expenseId: expense.id,
          amount: expense.amount,
          currency: expense.currency,
          purpose: expense.purposeDescription,
        },
      };
    },
  },
};
