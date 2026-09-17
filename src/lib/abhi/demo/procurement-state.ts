import type { ProcurementMockState } from "@/lib/procurement-mock-store";
import { isoDaysFromNow, uid } from "@/lib/procurement-mock-store";
import {
  calcPoTotals,
  DEFAULT_ROLE_PERMISSIONS,
  type ProcurementLineItem,
  type PurchaseOrder,
  type PurchaseRequisition,
  type SupplierRecord,
} from "@/lib/procurement-data";

function line(partial: Partial<ProcurementLineItem> & { item: string }): ProcurementLineItem {
  return {
    id: partial.id ?? uid("line"),
    item: partial.item,
    description: partial.description ?? partial.item,
    sku: partial.sku ?? `ABHI-${Math.floor(Math.random() * 9000 + 1000)}`,
    quantity: partial.quantity ?? 1,
    unit: partial.unit ?? "ea",
    unitPrice: partial.unitPrice ?? partial.estimatedCost ?? 0,
    estimatedCost: partial.estimatedCost ?? partial.unitPrice ?? 0,
    taxPct: partial.taxPct ?? 20,
    discountPct: partial.discountPct ?? 0,
    preferredSupplierId: partial.preferredSupplierId ?? "",
    preferredSupplierName: partial.preferredSupplierName ?? "",
  };
}

/** ABHI procurement fixtures — all amounts in GBP. */
export function buildAbhiProcurementState(): ProcurementMockState {
  const suppliers: SupplierRecord[] = [
    {
      id: "abhi-sup-print",
      companyName: "London Print Partners Ltd",
      contacts: [{ name: "Helen Marsh", email: "orders@londonprint.demo", phone: "+44 20 7946 0958", role: "Account manager" }],
      addresses: [{ label: "Depot", line1: "14 Clerkenwell Road", city: "London", country: "United Kingdom", postcode: "EC1M 5PS" }],
      taxId: "GB-VAT-123456789",
      paymentTerms: "Net 30",
      bankDetails: "Barclays — 20-00-00 · 12345678",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(240),
      contractExpiry: isoDaysFromNow(320),
      rating: 4.7,
      performanceScore: 93,
      onTimeDeliveryPct: 96,
      qualityScore: 94,
      priceCompetitiveness: 88,
      averageLeadTimeDays: 5,
      totalSpend: 186_400,
      notes: "Membership collateral, event signage, and pavilion materials.",
      documents: [],
      category: "Print & events",
      currency: "GBP",
      status: "active",
    },
    {
      id: "abhi-sup-av",
      companyName: "MedTech AV Solutions",
      contacts: [{ name: "James Okonkwo", email: "james@medtechav.demo", phone: "+44 161 555 0199", role: "Sales" }],
      addresses: [{ label: "Warehouse", line1: "Unit 3, Trafford Park", city: "Manchester", country: "United Kingdom", postcode: "M17 1WA" }],
      taxId: "GB-VAT-987654321",
      paymentTerms: "Net 14",
      bankDetails: "HSBC — 40-00-00 · 87654321",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(180),
      contractExpiry: isoDaysFromNow(260),
      rating: 4.5,
      performanceScore: 90,
      onTimeDeliveryPct: 92,
      qualityScore: 91,
      priceCompetitiveness: 86,
      averageLeadTimeDays: 8,
      totalSpend: 94_250,
      notes: "Conference AV hire and hybrid event kits.",
      documents: [],
      category: "AV & events",
      currency: "GBP",
      status: "active",
    },
  ];

  const requisitions: PurchaseRequisition[] = [
    {
      id: "abhi-req-1",
      requestNumber: "PR-ABHI-2401",
      requestDate: isoDaysFromNow(-4),
      requestedBy: "Jane Lewis",
      department: "Events",
      costCentre: "EVT-LDN",
      priority: "normal",
      requiredDate: isoDaysFromNow(10),
      businessJustification: "MedTech Expo pavilion refresh — brochures and pull-up banners.",
      budgetCode: "BUD-EVT-26",
      status: "manager_approval",
      lines: [
        line({
          item: "Pull-up banners (x4)",
          quantity: 4,
          unitPrice: 185,
          preferredSupplierId: "abhi-sup-print",
          preferredSupplierName: "London Print Partners Ltd",
        }),
      ],
      attachments: [],
      approvalHistory: [],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-4),
      updatedAt: isoDaysFromNow(-4),
    },
  ];

  const poLines = [
    line({
      item: "Membership welcome packs",
      quantity: 500,
      unitPrice: 2.4,
      preferredSupplierId: "abhi-sup-print",
      preferredSupplierName: "London Print Partners Ltd",
    }),
  ];
  const poTotals = calcPoTotals(poLines);

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "abhi-po-1",
      poNumber: "PO-ABHI-1082",
      supplierId: "abhi-sup-print",
      supplierName: "London Print Partners Ltd",
      supplierContact: "Helen Marsh",
      deliveryAddress: "ABHI · 3rd Floor, 25 Farringdon Street, London EC4A 4AB",
      billingAddress: "ABHI Finance · London",
      currency: "GBP",
      paymentTerms: "Net 30",
      expectedDelivery: isoDaysFromNow(6),
      status: "sent",
      requisitionId: null,
      lines: poLines,
      notes: "Q3 member onboarding packs",
      ...poTotals,
      emailedAt: isoDaysFromNow(-1),
      createdAt: isoDaysFromNow(-10),
      updatedAt: isoDaysFromNow(-1),
    },
  ];

  return {
    suppliers,
    requisitions,
    purchaseOrders,
    goodsReceipts: [],
    invoiceMatches: [],
    approvalRules: [],
    contracts: [],
    aiInsights: [],
    integrations: [],
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    currentRole: "purchasing_officer",
    monthlyBudget: 120_000,
  };
}
