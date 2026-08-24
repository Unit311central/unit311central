import { NextRequest, NextResponse } from "next/server";

import {
  archiveExpenseBillingCode,
  archiveExpenseCategory,
  createExpenseBillingCode,
  createExpenseCategory,
  getExpensePaymentSchedule,
  listExpenseBillingCodes,
  listExpenseCategories,
  listExpenseMileageRates,
  upsertExpensePaymentSchedule,
} from "@/lib/expense-management/config-service";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const [categories, billingCodes, mileageRates, schedule] = await Promise.all([
      listExpenseCategories(workspace.id),
      listExpenseBillingCodes(workspace.id),
      listExpenseMileageRates(workspace.id),
      getExpensePaymentSchedule(workspace.id),
    ]);
    return NextResponse.json({ categories, billingCodes, mileageRates, schedule });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load expense configuration";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const body = (await request.json()) as {
      action?: string;
      name?: string;
      code?: string;
      glAccountCode?: string;
      id?: string;
      schedule?: {
        frequency?: "weekly" | "fortnightly" | "monthly" | "custom";
        cutoffDay?: number;
        approvalDeadlineDay?: number;
        paymentDay?: number;
      };
    };

    switch (body.action) {
      case "create_category":
        const category = await createExpenseCategory(workspace.id, {
          name: body.name ?? "",
          code: body.code ?? "",
          glAccountCode: body.glAccountCode,
        });
        return NextResponse.json({ category });
      case "archive_category":
        await archiveExpenseCategory(workspace.id, body.id ?? "");
        return NextResponse.json({ ok: true });
      case "create_billing_code":
        const billingCode = await createExpenseBillingCode(workspace.id, {
          code: body.code ?? "",
          name: body.name ?? "",
        });
        return NextResponse.json({ billingCode });
      case "archive_billing_code":
        await archiveExpenseBillingCode(workspace.id, body.id ?? "");
        return NextResponse.json({ ok: true });
      case "update_schedule":
        const schedule = await upsertExpensePaymentSchedule(workspace.id, body.schedule ?? {});
        return NextResponse.json({ schedule });
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Configuration update failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
