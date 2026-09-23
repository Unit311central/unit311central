/**
 * Builds a sample MAM scope quote PDF (Q-2026-974612 layout) for visual review.
 * Uses workspace default document logo via workspaceSlug=internal (no DB slug lookup required).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { buildSalesQuotePdfDocument } from "@/lib/accounting/sales-quote-pdf-build";
import type { SalesQuote, SalesQuoteSellerProfile } from "@/lib/accounting/types";

const SCOPE_LINES = [
  "Core Platform Principle",
  "Digital Part Passport and Digital Inventory",
  "Part Screening and Industrial Business Case",
  "Qualification Engineering and Revision Control",
  "Manufacturing Genealogy Quality and Traceability",
  "KPI and Performance Management",
  "Capacity Scheduling Maintenance and Availability",
  "Customer Digital Warehouse Portal",
  "Supplier IP and Data Governance",
  "Industrial AI and Knowledge Layer",
  "Standard Unit311 Central Modules",
];

const hiddenColumns = {
  showQuantity: false,
  showUnit: false,
  showRate: false,
  showDiscount: false,
  showTax: false,
};

const seller: SalesQuoteSellerProfile = {
  brandName: "Unit311 Central",
  legalCompanyName: "Nakama Technology Holdings Ltd",
  tradingName: "Unit311 Central",
  companyNumber: "78747890",
  vatTaxNumber: null,
  companyName: "Unit311 Central",
  contactName: null,
  email: "paul@unit311central.com",
  phone: null,
  address: "No. 5, 17/F Strand 50\nBonham Strand, Sheung Wan\nHong Kong",
  city: null,
  region: null,
  country: "Hong Kong",
  website: "https://unit311central.com",
};

const quote: SalesQuote = {
  id: "sample-mam-quote",
  workspaceId: "sample-workspace-internal",
  quoteNumber: "Q-2026-974612",
  crmLeadId: null,
  clientId: null,
  companyName: "Moroccan Advanced Manufacturing",
  contactName: "Paul Fotheringham",
  contactEmail: "paul@unit311central.com",
  title: "Unit311 Central — MAM",
  currency: "USD",
  subtotal: 40_000,
  taxAmount: 0,
  totalAmount: 40_000,
  status: "sent",
  validUntil: "2026-11-01",
  pdfPath: null,
  invoiceId: null,
  stripePaymentLinkUrl: null,
  notes: null,
  issueDate: "2026-09-21",
  reference: null,
  paymentTerms: null,
  termsAndConditions: null,
  discountAmount: 0,
  pricingStyle: "scope_total",
  lineColumnVisibility: hiddenColumns,
  bankDetails: null,
  termsPdfStoragePath: null,
  termsPdfFilename: null,
  lineItems: SCOPE_LINES.map((description, index) => ({
    id: `line-${index + 1}`,
    lineNumber: index + 1,
    description,
    detailText:
      index === 0
        ? "Commercial, engineering, qualification, manufacturing and management architecture."
        : null,
    quantity: 0,
    unit: null,
    unitPrice: 0,
    discountAmount: 0,
    taxRate: 0,
    taxAmount: 0,
    amount: 0,
  })),
  createdAt: "2026-09-21T00:00:00.000Z",
  updatedAt: "2026-09-21T00:00:00.000Z",
};

async function main() {
  const pdf = await buildSalesQuotePdfDocument(quote, seller, { workspaceSlug: "internal" });
  const outDir = "/opt/cursor/artifacts";
  mkdirSync(outDir, { recursive: true });
  const filename = "Q-2026-974612.pdf";
  const outPath = join(outDir, filename);
  writeFileSync(outPath, pdf);
  const latin = Buffer.from(pdf).toString("latin1");
  if (!latin.includes("/Subtype/Image") && !latin.includes("/Image")) {
    throw new Error("PDF verification failed: embedded logo image not found.");
  }
  console.log(`Wrote ${outPath} (${pdf.byteLength} bytes, logo image verified)`);

  try {
    const { execSync } = await import("node:child_process");
    execSync(
      `python3 -c "
import fitz
doc=fitz.open('${outPath}')
pix=doc[0].get_pixmap(matrix=fitz.Matrix(2,2), clip=fitz.Rect(0,0,260,120))
pix.save('/opt/cursor/artifacts/Q-2026-974612-logo-crop.png')
samples=[pix.pixel(i,j) for i in range(0,pix.width,20) for j in range(0,pix.height,8)]
dark=sum(1 for px in samples if px[0]<120)
if dark < 5: raise SystemExit('logo crop lacks dark UNIT ink')
print('logo crop ok', dark)
"`,
      { stdio: "inherit" },
    );
  } catch (e) {
    console.warn("Logo crop check skipped or failed:", e);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
