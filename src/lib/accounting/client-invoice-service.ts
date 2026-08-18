import { buildClientSalesInvoiceEmail } from "@/lib/accounting/client-invoice-emails";
import { buildClientInvoicePdfFromQuote } from "@/lib/accounting/client-invoice-pdf";
import type { SalesQuote } from "@/lib/accounting/types";
import { getNorthstarSalesQuoteById, upsertNorthstarSalesQuote } from "@/lib/demo/northstar-sales-quotes-fixtures";
import { resolveFinancialsWorkspaceId, type FinancialsWorkspaceScope } from "@/lib/financials-workspace";
import { sendMailboxEmail } from "@/lib/email/smtp";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";
import { generateInvoiceNumber } from "@/lib/subscription-invoice-pdf";

function addDays(isoDate: string, days: number) {
  const date = new Date(`${isoDate}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildInvoicePaymentUrl(input: {
  origin?: string | null;
  paymentReference: string;
  amount: number;
  currency: string;
}) {
  const base = (input.origin ?? "https://demo.unit311central.com").replace(/\/$/, "");
  const params = new URLSearchParams({
    ref: input.paymentReference,
    amount: String(input.amount),
    currency: input.currency,
  });
  return `${base}/payment-transfer?${params.toString()}`;
}

function resolveInvoiceMeta(quote: SalesQuote) {
  const issueDate = new Date().toISOString().slice(0, 10);
  const dueDate = addDays(issueDate, 30);
  const invoiceNumber = quote.invoiceId
    ? `INV-${quote.quoteNumber.replace(/^Q-/, "")}`
    : `INV-${generateInvoiceNumber()}`;
  const paymentReference =
    quote.paymentReference ?? `INV-${invoiceNumber.replace(/^INV-/, "")}`;
  return { issueDate, dueDate, invoiceNumber, paymentReference };
}

export async function attachPaymentLinkToQuote(
  quoteId: string,
  scope: FinancialsWorkspaceScope,
  origin?: string | null,
): Promise<SalesQuote> {
  const quote =
    scope.workspaceSlug === "demo"
      ? getNorthstarSalesQuoteById(quoteId)
      : await import("@/lib/accounting/sales-quotes-service").then((mod) =>
          mod.getSalesQuoteById(quoteId, scope),
        );
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "accepted") {
    throw new Error("Accept the quote before creating a payment link.");
  }

  const { paymentReference } = resolveInvoiceMeta(quote);
  const paymentUrl = buildInvoicePaymentUrl({
    origin,
    paymentReference,
    amount: quote.totalAmount,
    currency: quote.currency,
  });

  if (scope.workspaceSlug === "demo") {
    return upsertNorthstarSalesQuote({
      ...quote,
      paymentReference,
      stripePaymentLinkUrl: paymentUrl,
      updatedAt: new Date().toISOString(),
    });
  }

  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = createTenancyServerClient();
  const { error } = await supabase
    .from("sales_quotes")
    .update({
      stripe_payment_link_url: paymentUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("workspace_id", workspaceId)
    .eq("id", quoteId);
  if (error) throw new Error(error.message);

  const updated = await import("@/lib/accounting/sales-quotes-service").then((mod) =>
    mod.getSalesQuoteById(quoteId, scope),
  );
  if (!updated) throw new Error("Quote not found after update.");
  return { ...updated, paymentReference, stripePaymentLinkUrl: paymentUrl };
}

export async function sendClientInvoiceForQuote(
  quoteId: string,
  scope: FinancialsWorkspaceScope,
  origin?: string | null,
): Promise<{ quote: SalesQuote; messageId: string | null; simulated: boolean }> {
  const quote =
    scope.workspaceSlug === "demo"
      ? getNorthstarSalesQuoteById(quoteId)
      : await import("@/lib/accounting/sales-quotes-service").then((mod) =>
          mod.getSalesQuoteById(quoteId, scope),
        );
  if (!quote) throw new Error("Quote not found.");
  if (quote.status !== "accepted") {
    throw new Error("Accept the quote before sending the client invoice.");
  }
  if (!quote.contactEmail?.trim()) {
    throw new Error("Add a contact email before sending the invoice.");
  }

  const { issueDate, dueDate, invoiceNumber, paymentReference } = resolveInvoiceMeta(quote);
  const paymentUrl =
    quote.stripePaymentLinkUrl ??
    buildInvoicePaymentUrl({
      origin,
      paymentReference,
      amount: quote.totalAmount,
      currency: quote.currency,
    });
  const pdf = buildClientInvoicePdfFromQuote(quote, {
    invoiceNumber,
    paymentReference,
    issueDate,
    dueDate,
  });
  const email = buildClientSalesInvoiceEmail({
    companyName: quote.companyName,
    contactName: quote.contactName ?? quote.companyName,
    invoiceNumber,
    amount: quote.totalAmount,
    currency: quote.currency,
    paymentReference,
    paymentUrl,
    dueDate,
  });

  const now = new Date().toISOString();
  let messageId: string | null = null;
  let simulated = false;

  if (scope.workspaceSlug === "demo") {
    simulated = true;
    messageId = `demo-msg-${Date.now()}`;
  } else {
    const workspaceId = await resolveFinancialsWorkspaceId(scope);
    const info = await sendMailboxEmail({
      account: "info",
      workspaceId,
      to: quote.contactEmail,
      subject: email.subject,
      html: email.html,
      text: email.text,
      attachments: [
        {
          filename: `${invoiceNumber}.pdf`,
          content: Buffer.from(pdf),
          contentType: "application/pdf",
        },
      ],
    });
    messageId = info.messageId ?? null;
  }

  if (scope.workspaceSlug === "demo") {
    const updated = upsertNorthstarSalesQuote({
      ...quote,
      paymentReference,
      stripePaymentLinkUrl: paymentUrl,
      invoiceSentAt: now,
      updatedAt: now,
    });
    return { quote: updated, messageId, simulated };
  }

  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured.");
  const workspaceId = await resolveFinancialsWorkspaceId(scope);
  const supabase = createTenancyServerClient();
  const { error } = await supabase
    .from("sales_quotes")
    .update({
      stripe_payment_link_url: paymentUrl,
      updated_at: now,
    })
    .eq("workspace_id", workspaceId)
    .eq("id", quoteId);
  if (error) throw new Error(error.message);

  const updated = await import("@/lib/accounting/sales-quotes-service").then((mod) =>
    mod.getSalesQuoteById(quoteId, scope),
  );
  if (!updated) throw new Error("Quote not found after send.");
  return {
    quote: { ...updated, paymentReference, stripePaymentLinkUrl: paymentUrl, invoiceSentAt: now },
    messageId,
    simulated,
  };
}

export function renderClientInvoicePdfForQuote(quote: SalesQuote) {
  const { issueDate, dueDate, invoiceNumber, paymentReference } = resolveInvoiceMeta(quote);
  return buildClientInvoicePdfFromQuote(quote, {
    invoiceNumber,
    paymentReference,
    issueDate,
    dueDate,
  });
}
