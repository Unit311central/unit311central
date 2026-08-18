/**
 * Run: npm run prove:track-c
 */
import assert from "node:assert/strict";

import {
  acceptSalesQuote,
  createSalesQuoteFromLead,
  getSalesQuoteById,
} from "@/lib/accounting/sales-quotes-service";
import {
  attachPaymentLinkToQuote,
  buildInvoicePaymentUrl,
  sendClientInvoiceForQuote,
} from "@/lib/accounting/client-invoice-service";
import { buildClientInvoicePdfFromQuote } from "@/lib/accounting/client-invoice-pdf";
import { parseSupplierInvoiceText } from "@/lib/accounting/supplier-invoice-parse";
import {
  approveSupplierInvoiceDraft,
  ingestSupplierInvoice,
  listSupplierInvoiceDrafts,
} from "@/lib/accounting/supplier-invoice-service";

const DEMO_SCOPE = { workspaceSlug: "demo" as const };

async function main() {
  const parsed = parseSupplierInvoiceText(
    "Supplier: Acme Parts Ltd\nInvoice number: AP-99201\nTotal due: GBP 1,240.50",
  );
  assert.ok(parsed);
  assert.equal(parsed.supplier, "Acme Parts Ltd");
  assert.equal(parsed.reference, "AP-99201");
  assert.equal(parsed.amount, 1240.5);

  const paymentUrl = buildInvoicePaymentUrl({
    origin: "https://demo.unit311central.com",
    paymentReference: "INV-12345",
    amount: 1000,
    currency: "GBP",
  });
  assert.match(paymentUrl, /payment-transfer\?ref=INV-12345/);

  const quote = await createSalesQuoteFromLead(DEMO_SCOPE, { leadId: "nst-lead-002" });
  assert.equal(quote.crmLeadId, "nst-lead-002");
  assert.ok(quote.totalAmount > 0);
  assert.ok(quote.lineItems.length === 1);

  const pdf = buildClientInvoicePdfFromQuote(quote, {
    invoiceNumber: "INV-TEST-001",
    paymentReference: "INV-TEST-001",
    issueDate: "2026-08-16",
    dueDate: "2026-09-15",
  });
  assert.ok(pdf.byteLength > 500);

  const accepted = await acceptSalesQuote(quote.id, DEMO_SCOPE);
  assert.equal(accepted.quote.status, "accepted");
  assert.ok(accepted.quote.paymentReference);

  const sent = await sendClientInvoiceForQuote(quote.id, DEMO_SCOPE, "https://demo.unit311central.com");
  assert.equal(sent.simulated, true);
  assert.ok(sent.quote.invoiceSentAt);

  const linked = await attachPaymentLinkToQuote(quote.id, DEMO_SCOPE, "https://demo.unit311central.com");
  assert.ok(linked.stripePaymentLinkUrl?.includes("payment-transfer"));

  const draft = await ingestSupplierInvoice(DEMO_SCOPE, {
    text: "Supplier: Test Vendor\nInvoice number: TV-100\nTotal due: GBP 500.00",
  });
  assert.equal(draft.status, "draft");

  const draftsBefore = (await listSupplierInvoiceDrafts(DEMO_SCOPE)).filter((row) => row.status === "draft");
  assert.ok(draftsBefore.some((row) => row.id === draft.id));

  const approved = await approveSupplierInvoiceDraft(draft.id, DEMO_SCOPE);
  assert.equal(approved.status, "approved");
  assert.ok(approved.journalEntryId);

  const reloaded = await getSalesQuoteById(quote.id, DEMO_SCOPE);
  assert.equal(reloaded?.status, "accepted");

  console.log("Track C money workflow checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
