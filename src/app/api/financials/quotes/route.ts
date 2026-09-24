import { NextRequest, NextResponse } from "next/server";

import { handleCreateSalesQuotePost } from "@/lib/accounting/sales-quotes-list-api-handlers";

export const dynamic = "force-dynamic";

/** @deprecated Use GET /api/financials/sales-quotes — kept out of this tree to avoid PDF/sharp bundle coupling. */
export async function GET() {
  return NextResponse.json(
    { error: "Use GET /api/financials/sales-quotes for the quotes list." },
    { status: 410 },
  );
}

export async function POST(request: NextRequest) {
  return handleCreateSalesQuotePost(request);
}
