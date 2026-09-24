/** Random 6-digit invoice/quote suffix — no PDF dependencies. */
export function generateInvoiceNumber() {
  return String(Math.floor(100000 + Math.random() * 900000));
}
