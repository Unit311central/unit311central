import "server-only";

import { downloadSalesQuoteTermsPdf } from "@/lib/accounting/sales-quote-terms-storage";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

export async function renderSalesQuotePdf(
  quote: SalesQuote,
  seller?: SalesQuoteSellerProfile,
  options?: { workspaceSlug?: string | null },
) {
  const { appendTermsPdfToQuote, buildSalesQuotePdfDocument } = await import(
    "@/lib/accounting/sales-quote-pdf-build"
  );
  let workspaceSlug = options?.workspaceSlug?.trim() || null;
  if (!workspaceSlug) {
    try {
      const supabase = requireSupabase();
      const { data } = await supabase
        .from("workspaces")
        .select("slug")
        .eq("id", quote.workspaceId)
        .maybeSingle();
      workspaceSlug = data?.slug ? String(data.slug).trim() : null;
    } catch {
      workspaceSlug = null;
    }
  }
  const main = await buildSalesQuotePdfDocument(quote, seller, {
    workspaceSlug,
  });
  if (!quote.termsPdfStoragePath) return main;
  const terms = await downloadSalesQuoteTermsPdf(quote.termsPdfStoragePath);
  if (!terms) return main;
  return appendTermsPdfToQuote(main, terms);
}
