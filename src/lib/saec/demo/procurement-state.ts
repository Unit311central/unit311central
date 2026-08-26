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
import { SAEC_HEAD_OFFICE } from "@/lib/saec/demo/company";

function line(partial: Partial<ProcurementLineItem> & { item: string }): ProcurementLineItem {
  return {
    id: partial.id ?? uid("line"),
    item: partial.item,
    description: partial.description ?? partial.item,
    sku: partial.sku ?? `SKU-${Math.floor(Math.random() * 9000 + 1000)}`,
    quantity: partial.quantity ?? 1,
    unit: partial.unit ?? "ea",
    unitPrice: partial.unitPrice ?? partial.estimatedCost ?? 0,
    estimatedCost: partial.estimatedCost ?? partial.unitPrice ?? 0,
    taxPct: partial.taxPct ?? 15,
    discountPct: partial.discountPct ?? 0,
    preferredSupplierId: partial.preferredSupplierId ?? "",
    preferredSupplierName: partial.preferredSupplierName ?? "",
  };
}

export function buildSaecProcurementState(): ProcurementMockState {
  const suppliers: SupplierRecord[] = [
    {
      id: "saec-sup-kone",
      companyName: "Elevate Components SA (demo)",
      contacts: [
        {
          name: "Johan Steyn",
          email: "johan.steyn@elevatecomponents.demo",
          phone: "+27 11 555 0142",
          role: "Account Manager",
        },
      ],
      addresses: [
        {
          label: "Warehouse",
          line1: "12 Industrial Crescent",
          city: "Johannesburg",
          country: "South Africa",
          postcode: "2001",
        },
      ],
      taxId: "ZA-VAT-4123456789",
      paymentTerms: "Net 30",
      bankDetails: "FNB — 6200 1234 5678",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(200),
      contractExpiry: isoDaysFromNow(280),
      rating: 4.6,
      performanceScore: 92,
      onTimeDeliveryPct: 94,
      qualityScore: 91,
      priceCompetitiveness: 85,
      averageLeadTimeDays: 7,
      totalSpend: 2_840_000,
      notes: "Door operators, controllers, and escalator step chains.",
      documents: [],
      category: "Lift components",
      currency: "ZAR",
      status: "active",
    },
    {
      id: "saec-sup-wire",
      companyName: "WireCo Southern Africa (demo)",
      contacts: [
        {
          name: "Lindiwe Maseko",
          email: "l.maseko@wireco.demo",
          phone: "+27 21 555 0198",
          role: "Sales Engineer",
        },
      ],
      addresses: [
        {
          label: "Cape depot",
          line1: "Epping Industrial 2",
          city: "Cape Town",
          country: "South Africa",
          postcode: "7460",
        },
      ],
      taxId: "ZA-VAT-4987654321",
      paymentTerms: "Net 30",
      bankDetails: "Standard Bank — 051 234 567",
      preferred: true,
      insuranceExpiry: isoDaysFromNow(160),
      contractExpiry: isoDaysFromNow(240),
      rating: 4.4,
      performanceScore: 88,
      onTimeDeliveryPct: 90,
      qualityScore: 89,
      priceCompetitiveness: 88,
      averageLeadTimeDays: 5,
      totalSpend: 1_120_000,
      notes: "Lift ropes, compensation chains, and rigging consumables.",
      documents: [],
      category: "Rigging & ropes",
      currency: "ZAR",
      status: "active",
    },
    {
      id: "saec-sup-fleet",
      companyName: "Highveld Fleet Services (demo)",
      contacts: [
        {
          name: "Chris Naidoo",
          email: "chris.naidoo@highveldfleet.demo",
          phone: "+27 12 555 0177",
          role: "Fleet Coordinator",
        },
      ],
      addresses: [
        {
          label: "Depot",
          line1: "45 Koornhof Road",
          city: "Pretoria",
          country: "South Africa",
          postcode: "0184",
        },
      ],
      taxId: "ZA-VAT-4555123456",
      paymentTerms: "Net 15",
      bankDetails: "ABSA — 405 123 4567",
      preferred: false,
      insuranceExpiry: isoDaysFromNow(90),
      contractExpiry: isoDaysFromNow(180),
      rating: 4.2,
      performanceScore: 86,
      onTimeDeliveryPct: 93,
      qualityScore: 84,
      priceCompetitiveness: 90,
      averageLeadTimeDays: 2,
      totalSpend: 680_000,
      notes: "Service vehicle maintenance and tyre programme.",
      documents: [],
      category: "Fleet services",
      currency: "ZAR",
      status: "active",
    },
  ];

  const requisitions: PurchaseRequisition[] = [
    {
      id: "saec-req-1",
      requestNumber: "PR-2026-OMT-104",
      requestDate: isoDaysFromNow(-4),
      requestedBy: "Pieter van der Merwe",
      department: "Engineering",
      costCentre: "ENG-PTA",
      priority: "high",
      requiredDate: isoDaysFromNow(14),
      businessJustification: "KLW door operator kits for Brooklyn Mall modernisation.",
      budgetCode: "BUD-INST-26",
      status: "manager_approval",
      lines: [
        line({
          item: "MRL door operator kit",
          description: "Complete KLW door operator assembly",
          sku: "DO-KLW-2026",
          quantity: 4,
          unitPrice: 186_000,
          preferredSupplierId: "saec-sup-kone",
          preferredSupplierName: "Elevate Components SA (demo)",
        }),
      ],
      attachments: [],
      approvalHistory: [
        {
          id: uid("ap"),
          at: isoDaysFromNow(-4),
          actor: "Pieter van der Merwe",
          role: "employee",
          action: "submitted",
          note: "Submitted for approval",
        },
      ],
      linkedPoId: null,
      createdAt: isoDaysFromNow(-4),
      updatedAt: isoDaysFromNow(-4),
    },
  ];

  const poLines = [
    line({
      item: "Lift rope 10mm × 100m",
      quantity: 6,
      unitPrice: 64_000,
    }),
  ];
  const poTotals = calcPoTotals(poLines);

  const purchaseOrders: PurchaseOrder[] = [
    {
      id: "saec-po-1",
      poNumber: "PO-2026-OMT-088",
      supplierId: "saec-sup-wire",
      supplierName: "WireCo Southern Africa (demo)",
      supplierContact: "Lindiwe Maseko <l.maseko@wireco.demo>",
      deliveryAddress: `${SAEC_HEAD_OFFICE.addressLine}, ${SAEC_HEAD_OFFICE.city}`,
      billingAddress: `${SAEC_HEAD_OFFICE.name}, ${SAEC_HEAD_OFFICE.city}`,
      currency: "ZAR",
      paymentTerms: "Net 30",
      expectedDelivery: isoDaysFromNow(5),
      status: "sent",
      requisitionId: null,
      lines: poLines,
      notes: "KZN modernisation reserve stock",
      ...poTotals,
      emailedAt: isoDaysFromNow(-2),
      createdAt: isoDaysFromNow(-18),
      updatedAt: isoDaysFromNow(-2),
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
    aiInsights: [
      {
        id: "saec-ai-1",
        kind: "supplier_summary",
        title: "Component lead times stable",
        detail: "Elevate Components SA averaging 7 days · within SLA for Gauteng installs.",
        confidence: 0.86,
        actionLabel: "Review supplier scorecard",
        relatedIds: ["saec-sup-kone"],
        createdAt: isoDaysFromNow(0),
      },
    ],
    integrations: [],
    rolePermissions: DEFAULT_ROLE_PERMISSIONS,
    currentRole: "purchasing_officer",
    monthlyBudget: 1_250_000,
  };
}
