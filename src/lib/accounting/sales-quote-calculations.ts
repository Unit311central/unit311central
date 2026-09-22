import {
  DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  isScopeStyleQuote,
  normalizeLineColumnVisibility,
  type SalesQuoteLineColumnVisibility,
  type SalesQuotePricingStyle,
} from "@/lib/accounting/sales-quote-display";

export type SalesQuoteLineInput = {
  description: string;
  detailText?: string | null;
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
    detailText: line.detailText?.trim() || null,
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

export function buildScopeStyleLineRows(
  lineItems: Array<{ description: string; detailText?: string | null; unit?: string | null }>,
): SalesQuoteLineComputed[] {
  return lineItems.map((line) => ({
    description: line.description.trim(),
    detailText: line.detailText?.trim() || null,
    quantity: 1,
    unitPrice: 0,
    unit: line.unit?.trim() || null,
    discountAmount: 0,
    taxRate: 0,
    lineSubtotal: 0,
    taxAmount: 0,
    amount: 0,
  }));
}

export function resolveSalesQuoteFinancials(input: {
  pricingStyle?: SalesQuotePricingStyle;
  lineColumnVisibility?: SalesQuoteLineColumnVisibility;
  commercialTotal?: number | null;
  quoteDiscountAmount?: number;
  lineItems: SalesQuoteLineInput[];
}): SalesQuoteTotals & { pricingStyle: SalesQuotePricingStyle; scopeStyle: boolean } {
  const visibility = normalizeLineColumnVisibility(
    input.lineColumnVisibility ?? DEFAULT_SALES_QUOTE_LINE_COLUMN_VISIBILITY,
  );
  const pricingStyle = input.pricingStyle ?? "detailed";
  const scopeStyle = isScopeStyleQuote(pricingStyle, visibility);

  if (scopeStyle) {
    const totalAmount = roundMoney(Number(input.commercialTotal ?? 0));
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new Error("Quote total is required for scope-style quotes.");
    }
    const lines = buildScopeStyleLineRows(input.lineItems);
    return {
      subtotal: totalAmount,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount,
      lines,
      pricingStyle: "scope_total",
      scopeStyle: true,
    };
  }

  for (const line of input.lineItems) {
    if (!Number.isFinite(line.quantity) || line.quantity <= 0) {
      throw new Error("Each line item requires a quantity greater than zero.");
    }
    if (!Number.isFinite(line.unitPrice) || line.unitPrice < 0) {
      throw new Error("Each line item requires a valid rate.");
    }
  }
  const totals = computeSalesQuoteTotals(input.lineItems, input.quoteDiscountAmount ?? 0);
  return { ...totals, pricingStyle: "detailed", scopeStyle: false };
}
