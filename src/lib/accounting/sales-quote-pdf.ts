import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";

/** @deprecated Use buildSalesQuotePdfAsync from sales-quotes-service on the server. */
export function buildSalesQuotePdf(quote: SalesQuote, seller?: SalesQuoteSellerProfile): Uint8Array {
  void quote;
  void seller;
  throw new Error("buildSalesQuotePdf is server-only. Use renderSalesQuotePdf from sales-quotes-service.");
}
