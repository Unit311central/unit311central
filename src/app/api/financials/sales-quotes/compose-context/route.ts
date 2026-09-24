import { handleSalesQuoteComposeContextGet } from "@/lib/accounting/sales-quotes-compose-context-handler";

export const dynamic = "force-dynamic";

export async function GET() {
  return handleSalesQuoteComposeContextGet();
}
