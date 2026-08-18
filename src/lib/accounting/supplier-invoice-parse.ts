export type ParsedSupplierInvoice = {
  supplier: string;
  reference: string | null;
  amount: number;
  currency: string;
  invoiceDate: string | null;
  dueDate: string | null;
  description: string;
};

function parseAmount(raw: string) {
  const normalized = raw.replace(/,/g, "").trim();
  const value = Number(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function parseIsoDate(raw: string) {
  const trimmed = raw.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const uk = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!uk) return null;
  const day = uk[1].padStart(2, "0");
  const month = uk[2].padStart(2, "0");
  const year = uk[3].length === 2 ? `20${uk[3]}` : uk[3];
  return `${year}-${month}-${day}`;
}

function firstMatch(text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return null;
}

export function parseSupplierInvoiceText(text: string): ParsedSupplierInvoice | null {
  const normalized = text.replace(/\r/g, "").trim();
  if (!normalized) return null;

  const supplier =
    firstMatch(normalized, [
      /(?:supplier|vendor|from|bill\s*from)\s*[:\-]?\s*([^\n]+)/i,
      /^([A-Z][A-Za-z0-9 &.'-]{2,60})$/m,
    ]) ?? "Unknown supplier";

  const reference =
    firstMatch(normalized, [
      /(?:invoice\s*(?:no|number|#)|inv\s*#?|reference)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]{2,})/i,
    ]) ?? null;

  const amountRaw =
    firstMatch(normalized, [
      /(?:total\s*(?:due|amount)|amount\s*due|balance\s*due)\s*[:\-]?\s*(?:GBP|USD|EUR)?\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
      /(?:GBP|USD|EUR)\s*([0-9][0-9,]*(?:\.[0-9]{2})?)/i,
      /\b([0-9][0-9,]*\.[0-9]{2})\b/,
    ]) ?? null;
  const amount = amountRaw ? parseAmount(amountRaw) : null;
  if (!amount) return null;

  const currencyMatch = normalized.match(/\b(GBP|USD|EUR)\b/i);
  const currency = currencyMatch ? currencyMatch[1].toUpperCase() : "GBP";

  const invoiceDateRaw = firstMatch(normalized, [
    /(?:invoice\s*date|date)\s*[:\-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/i,
  ]);
  const dueDateRaw = firstMatch(normalized, [
    /(?:due\s*date|payment\s*due)\s*[:\-]?\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{1,2}[/.-][0-9]{1,2}[/.-][0-9]{2,4})/i,
  ]);

  const description =
    firstMatch(normalized, [/(?:description|for)\s*[:\-]?\s*([^\n]+)/i]) ??
    `Supplier invoice${reference ? ` ${reference}` : ""}`;

  return {
    supplier,
    reference,
    amount,
    currency,
    invoiceDate: invoiceDateRaw ? parseIsoDate(invoiceDateRaw) : null,
    dueDate: dueDateRaw ? parseIsoDate(dueDateRaw) : null,
    description,
  };
}
