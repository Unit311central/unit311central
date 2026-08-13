import { NextRequest, NextResponse } from "next/server";

import {
  normalizeBulkExpenseRow,
  validateBulkExpenseRows,
  type BulkExpenseRowInput,
  type BulkExpenseSaveMode,
} from "@/lib/expenses-bulk-entry";
import type { ExpenseCurrency } from "@/lib/expenses-data";
import { saveBulkExpenses } from "@/lib/financial-expenses-service";
import { ensureFinancialExpensesTable } from "@/lib/internal-db-migrations";
import { requirePlatformSession } from "@/lib/platform-session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

export const dynamic = "force-dynamic";

type BulkRequestBody = {
  mode?: BulkExpenseSaveMode;
  submitterUserId?: string;
  rows?: Array<{
    rowIndex?: number;
    expenseId?: string | null;
    billingCategoryCode?: string;
    category?: string;
    purpose?: string;
    vendor?: string;
    invoiceNumber?: string | null;
    datePaid?: string;
    amount?: number | string;
    currency?: ExpenseCurrency;
    attachmentPath?: string | null;
  }>;
};

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as BulkRequestBody;
    const mode: BulkExpenseSaveMode = body.mode === "draft" ? "draft" : "finalized";

    const rows: BulkExpenseRowInput[] = (body.rows ?? []).map((row, index) => ({
      rowIndex: row.rowIndex ?? index,
      expenseId: row.expenseId ?? null,
      billingCategoryCode: row.billingCategoryCode ?? "5090",
      category: row.category ?? "General",
      purpose: row.purpose ?? "",
      vendor: row.vendor ?? "",
      invoiceNumber: row.invoiceNumber ?? "",
      datePaid: row.datePaid ?? new Date().toISOString().slice(0, 10),
      amount: row.amount ?? "",
      currency: row.currency ?? "EUR",
      attachmentPath: row.attachmentPath ?? null,
    }));

    const validationErrors = validateBulkExpenseRows(rows, mode);
    if (validationErrors.length > 0) {
      return NextResponse.json(
        {
          error: "Validation failed for one or more rows.",
          rowErrors: validationErrors,
        },
        { status: 400 },
      );
    }

    await ensureFinancialExpensesTable();

    const activeRows = rows.filter(
      (row) =>
        row.purpose.trim() ||
        row.vendor.trim() ||
        String(row.invoiceNumber ?? "").trim() ||
        String(row.amount).trim(),
    );

    const normalizedRows = activeRows.map((row) => ({
      source: row,
      normalized: normalizeBulkExpenseRow(row, mode, body.submitterUserId),
    }));

    const result = await saveBulkExpenses(
      normalizedRows.map(({ source, normalized }) => ({
        rowIndex: source.rowIndex,
        expenseId: normalized.expenseId,
        submitterUserId: normalized.submitterUserId,
        purposeDescription: normalized.purposeDescription,
        amount: normalized.amount,
        currency: normalized.currency,
        dateSubmitted: normalized.dateSubmitted,
        expenseDate: normalized.expenseDate,
        paid: normalized.paid,
        supplier: normalized.supplier,
        categoryAccountCode: normalized.categoryAccountCode,
        reference: normalized.reference,
        attachmentPath: normalized.attachmentPath,
        paymentMethod: normalized.paymentMethod,
        reimbursable: normalized.reimbursable,
        recordStatus: normalized.recordStatus,
      })),
      mode,
      { workspaceId: workspace.id },
    );

    if (result.saved.length === 0 && result.errors.length > 0) {
      return NextResponse.json(
        {
          error: "Failed to save expense batch.",
          rowErrors: result.errors.map((entry) => ({
            rowIndex: entry.rowIndex,
            errors: [entry.message],
          })),
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      saved: result.saved,
      rowErrors: result.errors.map((entry) => ({
        rowIndex: entry.rowIndex,
        errors: [entry.message],
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save expense batch";
    const status =
      message.includes("Authentication required") || message.includes("Workspace context")
        ? 401
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
