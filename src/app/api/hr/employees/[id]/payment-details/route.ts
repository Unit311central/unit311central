import { NextRequest, NextResponse } from "next/server";

import {
  getEmployeePaymentDetails,
  upsertEmployeePaymentDetails,
} from "@/lib/expense-management/employee-payment-service";
import { resolveExpenseAccess } from "@/lib/expense-management/permissions";
import { requirePlatformSession } from "@/lib/platform-session";
import { requireCurrentWorkspace } from "@/lib/workspace-context";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const access = resolveExpenseAccess({ session });
    if (!access.canViewBankDetails) {
      return NextResponse.json({ error: "Not authorized to view payment details." }, { status: 403 });
    }
    const { id } = await context.params;
    const details = await getEmployeePaymentDetails(workspace.id, id);
    return NextResponse.json({ paymentDetails: details });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load payment details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  try {
    const session = await requirePlatformSession();
    const workspace = await requireCurrentWorkspace();
    const access = resolveExpenseAccess({ session });
    if (!access.canViewBankDetails) {
      return NextResponse.json({ error: "Not authorized to update payment details." }, { status: 403 });
    }
    const { id } = await context.params;
    const body = (await request.json()) as {
      countryCode?: string;
      accountHolderName?: string;
      bankName?: string;
      bankAddress?: string;
      sortCode?: string | null;
      accountNumber?: string | null;
      routingNumber?: string | null;
      iban?: string | null;
      swiftBic?: string | null;
    };
    const paymentDetails = await upsertEmployeePaymentDetails(workspace.id, id, body);
    return NextResponse.json({ paymentDetails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save payment details";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
