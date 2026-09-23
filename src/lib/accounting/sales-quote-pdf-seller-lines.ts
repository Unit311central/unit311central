import type { SalesQuoteSellerProfile } from "@/lib/accounting/types";

/** Presentation-only: show host without scheme in PDF body/footer. */
export function formatWebsiteForPdfDisplay(website: string | null | undefined): string | null {
  const trimmed = website?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

function normalizeAddressLines(address: string | null | undefined): string[] {
  if (!address?.trim()) return [];
  return address
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Document block under logo — values only, no field labels; no duplicate country after company no. */
export function formatSellerPdfCompanyLines(seller?: SalesQuoteSellerProfile | null): string[] {
  if (!seller) return [];

  const lines: string[] = [];
  const brand = seller.brandName?.trim() || seller.companyName?.trim();
  if (brand) lines.push(brand);

  const legal = seller.legalCompanyName?.trim();
  if (legal && legal.localeCompare(brand ?? "", undefined, { sensitivity: "accent" }) !== 0) {
    lines.push(legal);
  }

  const addressLines = normalizeAddressLines(seller.address);
  lines.push(...addressLines);

  const country = seller.country?.trim();
  if (country && !addressLines.length) {
    lines.push(country);
  } else if (country && addressLines.length) {
    const last = addressLines[addressLines.length - 1] ?? "";
    if (last.localeCompare(country, undefined, { sensitivity: "accent" }) !== 0) {
      const inAddress = addressLines.some(
        (line) => line.localeCompare(country, undefined, { sensitivity: "accent" }) === 0,
      );
      if (!inAddress) lines.push(country);
    }
  }

  const companyNumber = seller.companyNumber?.trim();
  if (companyNumber) lines.push(`Company No: ${companyNumber}`);

  const email = seller.email?.trim();
  if (email) lines.push(email);

  const website = formatWebsiteForPdfDisplay(seller.website);
  if (website) lines.push(website);

  return lines;
}

export function formatSellerPdfFooterLine(seller?: SalesQuoteSellerProfile | null): string {
  const brand = seller?.brandName?.trim() || seller?.companyName?.trim() || "Unit311 Central";
  const email = seller?.email?.trim();
  const website = formatWebsiteForPdfDisplay(seller?.website);
  const parts = [brand];
  if (email) parts.push(email);
  if (website) parts.push(website);
  return parts.join(" | ");
}
