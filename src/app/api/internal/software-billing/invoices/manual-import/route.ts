import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireInternalSoftwareBillingAccess } from "@/lib/software-billing/internal-api-auth";
import {
  importManualProviderInvoices,
  type ManualProviderInvoiceInput,
} from "@/lib/software-billing/manual-invoice-import";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireInternalSoftwareBillingAccess(request);
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json()) as {
      invoices?: ManualProviderInvoiceInput[];
    };

    if (!Array.isArray(body.invoices) || body.invoices.length === 0) {
      return NextResponse.json(
        { error: "Request body must include a non-empty invoices array." },
        { status: 400 },
      );
    }

    const result = await importManualProviderInvoices(auth.workspaceId, body.invoices);
    return NextResponse.json({ ok: result.errors.length === 0, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Manual invoice import failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
