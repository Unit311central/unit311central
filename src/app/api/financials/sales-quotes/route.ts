import { NextRequest } from "next/server";

import {
  handleCreateSalesQuotePost,
  handleListSalesQuotesGet,
} from "@/lib/accounting/sales-quotes-list-api-handlers";

export const dynamic = "force-dynamic";

/** List/create quotes — isolated from /api/financials/quotes/[id] PDF bundle. */
export async function GET() {
  return handleListSalesQuotesGet();
}

export async function POST(request: NextRequest) {
  return handleCreateSalesQuotePost(request);
}
