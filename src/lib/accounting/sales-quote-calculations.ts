export type SalesQuoteLineInput = {
  description: string;
  quantity: number;
  unitPrice: number;
  discountAmount?: number;
  taxRate?: number | null;
  unit?: string | null;
};

export type SalesQuoteLineComputed = SalesQuoteLineInput & {
  taxAmount: number;
  amount: number;
  lineSubtotal: number;
};

export type SalesQuoteTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  totalAmount: number;
  lines: SalesQuoteLineComputed[];
};

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

export function computeSalesQuoteLine(line: SalesQuoteLineInput): SalesQuoteLineComputed {
  const quantity = Number.isFinite(line.quantity) ? line.quantity : 0;
  const unitPrice = Number.isFinite(line.unitPrice) ? line.unitPrice : 0;
  const discountAmount = Number.isFinite(line.discountAmount ?? 0) ? (line.discountAmount ?? 0) : 0;
  const taxRate = Number.isFinite(line.taxRate ?? 0) ? (line.taxRate ?? 0) : 0;
  const lineSubtotal = Math.max(0, quantity * unitPrice - discountAmount);
  const taxAmount = roundMoney(lineSubtotal * (taxRate / 100));
  const amount = roundMoney(lineSubtotal + taxAmount);
  return {
    ...line,
    quantity,
    unitPrice,
    discountAmount,
    taxRate,
    lineSubtotal: roundMoney(lineSubtotal),
    taxAmount,
    amount,
  };
}

export function computeSalesQuoteTotals(
  lineItems: SalesQuoteLineInput[],
  quoteDiscountAmount = 0,
): SalesQuoteTotals {
  const lines = lineItems.map(computeSalesQuoteLine);
  const lineSubtotal = roundMoney(lines.reduce((sum, line) => sum + line.lineSubtotal, 0));
  const lineTax = roundMoney(lines.reduce((sum, line) => sum + line.taxAmount, 0));
  const discountAmount = roundMoney(Math.max(0, quoteDiscountAmount));
  const subtotal = roundMoney(Math.max(0, lineSubtotal - discountAmount));
  const taxAmount = lineTax;
  const totalAmount = roundMoney(subtotal + taxAmount);
  return { subtotal, discountAmount, taxAmount, totalAmount, lines };
}
