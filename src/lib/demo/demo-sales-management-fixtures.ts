/**
 * Canonical Demo Sales Management fixture leads for regression checks.
 * Production Demo workspace data is seeded via migration 169_demo_sales_management_coherent_seed.sql.
 */
import type { CrmLead } from "@/lib/crm-data";

const DEMO_WS = "demo-workspace";
const NOW = "2026-08-16T10:00:00.000Z";

function lead(partial: Partial<CrmLead> & Pick<CrmLead, "id" | "companyName" | "contactName" | "status">): CrmLead {
  return {
    workspaceId: DEMO_WS,
    firstName: "",
    surname: "",
    role: "",
    email: "",
    phone: "",
    source: "",
    nextAction: "",
    nextActionDate: null,
    estimatedValue: null,
    notes: "",
    discoveryNotes: "",
    lastContactAt: null,
    lastActivityAt: null,
    contactCount: 0,
    needsManualReview: false,
    manualReviewReason: "",
    originalEnquirySubject: "",
    originalEnquiryMessage: "",
    originalEnquirySubmittedAt: null,
    clientReportFileId: null,
    clientReportFileName: null,
    clientReportGeneratedAt: null,
    clientReportPptFileId: null,
    clientReportPptFileName: null,
    clientReportSentAt: null,
    clientReportMessageId: null,
    clientReportRepliedAt: null,
    clientReportReminder7dSentAt: null,
    clientReportReminder14dSentAt: null,
    clientReportLastReminderSentAt: null,
    clientChatRoom: null,
    clientChatKey: null,
    clientChatAccessToken: null,
    companyLogoFileId: null,
    companyLogoFileName: null,
    ownerUserId: null,
    winProbability: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...partial,
  };
}

/** Representative subset mirroring migration 169 seed — used by unit checks only. */
export function getDemoSalesManagementLeads(): CrmLead[] {
  return [
    lead({
      id: "a1000001-0001-4001-8001-000000000001",
      companyName: "Manchester Digital Works",
      contactName: "Sarah Chen",
      status: "Hot",
      estimatedValue: 185_000,
      winProbability: 65,
    }),
    lead({
      id: "a1000001-0001-4001-8001-000000000003",
      companyName: "Cotswold Logistics Group",
      contactName: "Helen Marsh",
      status: "Warm",
      estimatedValue: 92_000,
      winProbability: 40,
    }),
    lead({
      id: "a1000001-0001-4001-8001-000000000007",
      companyName: "Derbyshire Food Co",
      contactName: "Priya Shah",
      status: "Won",
      estimatedValue: 210_000,
      winProbability: 100,
    }),
    lead({
      id: "a1000001-0001-4001-8001-000000000012",
      companyName: "Nottingham Textiles Ltd",
      contactName: "John Okafor",
      status: "Lost",
      estimatedValue: 68_000,
      winProbability: 0,
    }),
  ];
}
