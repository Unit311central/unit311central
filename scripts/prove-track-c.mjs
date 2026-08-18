/**
 * Prove Track C money workflows on demo production.
 *
 * Usage:
 *   npm run prove:track-c
 *   node scripts/prove-track-c.mjs https://demo.unit311central.com
 */
import assert from "node:assert/strict";

const DEFAULT_ORIGIN = "https://demo.unit311central.com";

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text.slice(0, 200) || `HTTP ${response.status}`);
  }
}

async function main() {
  const origin = (process.argv[2] ?? DEFAULT_ORIGIN).replace(/\/$/, "");

  const quotesRes = await fetch(`${origin}/api/financials/quotes`);
  const quotesBody = await readJson(quotesRes);
  assert.equal(quotesRes.status, 200, quotesBody.error ?? "quotes GET failed");
  assert.ok(Array.isArray(quotesBody.quotes), "quotes array missing");
  assert.ok(quotesBody.quotes.length >= 2, "expected seed quotes");

  const fromLeadRes = await fetch(`${origin}/api/financials/quotes/from-lead`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId: "nst-lead-004" }),
  });
  const fromLeadBody = await readJson(fromLeadRes);
  assert.equal(fromLeadRes.status, 201, fromLeadBody.error ?? "from-lead failed");
  const quoteId = fromLeadBody.quote?.id;
  assert.ok(quoteId, "quote id missing");

  const acceptRes = await fetch(`${origin}/api/financials/quotes/${quoteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "accept" }),
  });
  const acceptBody = await readJson(acceptRes);
  assert.equal(acceptRes.status, 200, acceptBody.error ?? "accept failed");
  assert.equal(acceptBody.quote?.status, "accepted");

  const sendRes = await fetch(`${origin}/api/financials/quotes/${quoteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "send-invoice" }),
  });
  const sendBody = await readJson(sendRes);
  assert.equal(sendRes.status, 200, sendBody.error ?? "send-invoice failed");
  assert.equal(sendBody.simulated, true);

  const linkRes = await fetch(`${origin}/api/financials/quotes/${quoteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "payment-link" }),
  });
  const linkBody = await readJson(linkRes);
  assert.equal(linkRes.status, 200, linkBody.error ?? "payment-link failed");
  assert.match(linkBody.quote?.stripePaymentLinkUrl ?? "", /payment-transfer/);

  const draftsRes = await fetch(`${origin}/api/financials/supplier-invoices`);
  const draftsBody = await readJson(draftsRes);
  assert.equal(draftsRes.status, 200, draftsBody.error ?? "supplier-invoices GET failed");
  assert.ok(Array.isArray(draftsBody.drafts));

  const ingestRes = await fetch(`${origin}/api/financials/supplier-invoices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "Supplier: Prove Vendor Ltd\nInvoice number: PV-9001\nTotal due: GBP 999.00",
    }),
  });
  const ingestBody = await readJson(ingestRes);
  assert.equal(ingestRes.status, 201, ingestBody.error ?? "supplier ingest failed");
  const draftId = ingestBody.draft?.id;
  assert.ok(draftId);

  const approveRes = await fetch(`${origin}/api/financials/supplier-invoices/${draftId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "approve" }),
  });
  const approveBody = await readJson(approveRes);
  assert.equal(approveRes.status, 200, approveBody.error ?? "supplier approve failed");
  assert.equal(approveBody.draft?.status, "approved");

  console.log(`Track C production prove passed on ${origin}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
