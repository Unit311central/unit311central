/**
 * OnwardAir-only Business Central fixtures (static overlays).
 *
 * Callers should gate with `isOnwardAirBusinessCentralFixtures()` /
 * `isBrowserOnwardAirSurface()` — never wipe shared DB rows.
 */

import type { ClientOnboardingRecord } from "@/lib/client-onboarding-data";
import type { CrmConnection } from "@/lib/connections-data";
import type { CrmLead, LeadStatus } from "@/lib/crm-data";
import type { ExecutiveMeetingStatus } from "@/lib/founder-booking/meeting-slug";
import { formatExecutiveMeetingStatus } from "@/lib/founder-booking/meeting-slug";
import type { GrantApplication, GrantStatus } from "@/lib/grants-data";
import { isBrowserOnwardAirSurface } from "@/lib/onwardair-surface";
import type { Representative } from "@/lib/representatives-data";
import type { RepCommissionRow } from "@/lib/representatives-extended-data";

const OA_WS = "onwardair";
const FIXTURE_NOW = "2026-08-01T12:00:00.000Z";

/** MeetingsWorkspace / GET /api/crm/meetings row shape + crmLeadId for OA linking. */
export type OaDiscoveryMeeting = {
  id: string;
  crmLeadId: string;
  name: string;
  organization: string;
  role: string | null;
  email: string;
  formattedWhenGmt: string;
  formattedWhenClient: string | null;
  clientTimezone: string;
  status: ExecutiveMeetingStatus;
  statusLabel: string;
  meetingLink: string;
  startReminderSentAt: string | null;
  transcriptSavedAt: string | null;
  transcriptFileId: string | null;
  focusOverviewPdfFileId: string | null;
  focusSelectionsSubmittedAt: string | null;
};

export type OaBcDashboardSummary = {
  clientsCount: number;
  activeClients: number;
  arrUsd: number;
  pipelineValueUsd: number;
  pipelineByStage: Array<{ stage: LeadStatus; count: number; valueUsd: number }>;
  discoveryCount: number;
  onboardingCount: number;
  partnersCount: number;
  partnerRegions: string[];
  commissionPipelineUsd: number;
};

export type OaClientsDashboardCharts = {
  statusPie: Array<{ name: string; value: number }>;
  monthlyTrend: Array<{ month: string; clients: number; active: number }>;
  segmentBars: Array<{ segment: string; count: number }>;
};

/** Grant KPI tile — mirrors GRANTS_KPIS shape; values are USD-formatted for OA. */
export type OaGrantKpi = {
  id: string;
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "neutral";
  hint: string;
};

function lead(partial: {
  id: string;
  companyName: string;
  contactName: string;
  firstName: string;
  surname: string;
  role: string;
  email: string;
  phone: string;
  status: LeadStatus;
  source: string;
  nextAction: string;
  nextActionDate: string | null;
  estimatedValue: number;
  notes: string;
  discoveryNotes: string;
  lastContactAt: string | null;
  lastActivityAt: string | null;
  contactCount: number;
}): CrmLead {
  return {
    id: partial.id,
    workspaceId: OA_WS,
    companyName: partial.companyName,
    contactName: partial.contactName,
    firstName: partial.firstName,
    surname: partial.surname,
    role: partial.role,
    email: partial.email,
    phone: partial.phone,
    status: partial.status,
    source: partial.source,
    nextAction: partial.nextAction,
    nextActionDate: partial.nextActionDate,
    estimatedValue: partial.estimatedValue,
    notes: partial.notes,
    discoveryNotes: partial.discoveryNotes,
    lastContactAt: partial.lastContactAt,
    lastActivityAt: partial.lastActivityAt,
    contactCount: partial.contactCount,
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
    createdAt: "2026-03-15T10:00:00.000Z",
    updatedAt: FIXTURE_NOW,
  };
}

function meeting(partial: {
  id: string;
  crmLeadId: string;
  name: string;
  organization: string;
  role: string;
  email: string;
  formattedWhenGmt: string;
  formattedWhenClient: string | null;
  clientTimezone: string;
  status: ExecutiveMeetingStatus;
  meetingLink: string;
  startReminderSentAt?: string | null;
  transcriptSavedAt?: string | null;
  focusSelectionsSubmittedAt?: string | null;
}): OaDiscoveryMeeting {
  return {
    id: partial.id,
    crmLeadId: partial.crmLeadId,
    name: partial.name,
    organization: partial.organization,
    role: partial.role,
    email: partial.email,
    formattedWhenGmt: partial.formattedWhenGmt,
    formattedWhenClient: partial.formattedWhenClient,
    clientTimezone: partial.clientTimezone,
    status: partial.status,
    statusLabel: formatExecutiveMeetingStatus(partial.status),
    meetingLink: partial.meetingLink,
    startReminderSentAt: partial.startReminderSentAt ?? null,
    transcriptSavedAt: partial.transcriptSavedAt ?? null,
    transcriptFileId: null,
    focusOverviewPdfFileId: null,
    focusSelectionsSubmittedAt: partial.focusSelectionsSubmittedAt ?? null,
  };
}

function connection(
  index: number,
  row: Omit<CrmConnection, "id" | "createdAt" | "updatedAt">,
): CrmConnection {
  return {
    ...row,
    id: `oa-conn-${String(index).padStart(2, "0")}`,
    createdAt: FIXTURE_NOW,
    updatedAt: FIXTURE_NOW,
  };
}

// ---------------------------------------------------------------------------
// 1. Pipeline leads (CrmLead / LeadStatus — not New/Qualified/Proposal enums)
// ---------------------------------------------------------------------------

export const OA_PIPELINE_LEADS: CrmLead[] = [
  lead({
    id: "oa-lead-01",
    companyName: "USTRANSCOM Contested Logistics Cell",
    contactName: "Col. Marcus Hale",
    firstName: "Marcus",
    surname: "Hale",
    role: "Director, Contested Logistics",
    email: "marcus.hale@ustranscom.mil",
    phone: "+1 618 555 0142",
    status: "Hot",
    source: "Referral",
    nextAction: "Send contested-logistics platform proposal",
    nextActionDate: "2026-08-08",
    estimatedValue: 1850000,
    notes: "DoD logistics digital twin for austere airlift routing — USD pipeline.",
    discoveryNotes: "Needs FedRAMP path + SIPR-compatible reporting.",
    lastContactAt: "2026-07-28T16:00:00.000Z",
    lastActivityAt: "2026-07-28T16:00:00.000Z",
    contactCount: 6,
  }),
  lead({
    id: "oa-lead-02",
    companyName: "DFW Airport Vertiport Operations",
    contactName: "Elena Vasquez",
    firstName: "Elena",
    surname: "Vasquez",
    role: "VP Airport Operations",
    email: "e.vasquez@dfwairport.com",
    phone: "+1 972 555 0198",
    status: "Warm",
    source: "Trade show",
    nextAction: "Schedule vertiport ops discovery follow-up",
    nextActionDate: "2026-08-12",
    estimatedValue: 620000,
    notes: "Airport ops suite for eVTOL pad scheduling and ground movement.",
    discoveryNotes: "Interested in multi-pad capacity planning for 2027.",
    lastContactAt: "2026-07-22T14:30:00.000Z",
    lastActivityAt: "2026-07-22T14:30:00.000Z",
    contactCount: 4,
  }),
  lead({
    id: "oa-lead-03",
    companyName: "Etihad Cargo AAM Corridor",
    contactName: "Omar Al-Harthy",
    firstName: "Omar",
    surname: "Al-Harthy",
    role: "Head of Cargo Innovation",
    email: "o.alharthy@etihad.ae",
    phone: "+971 2 555 0177",
    status: "Hot",
    source: "LinkedIn",
    nextAction: "Negotiate Gulf corridor SOW",
    nextActionDate: "2026-08-06",
    estimatedValue: 980000,
    notes: "Gulf operator cargo corridor digitisation — Abu Dhabi to regional hubs.",
    discoveryNotes: "Wants USD commercial terms and Arabic/English ops console.",
    lastContactAt: "2026-07-30T09:00:00.000Z",
    lastActivityAt: "2026-07-30T09:00:00.000Z",
    contactCount: 5,
  }),
  lead({
    id: "oa-lead-04",
    companyName: "UNAMI Aviation Support Unit",
    contactName: "Sofia Bergstrom",
    firstName: "Sofia",
    surname: "Bergstrom",
    role: "Chief Air Operations",
    email: "sofia.bergstrom@un.org",
    phone: "+964 770 555 0120",
    status: "Warm",
    source: "Existing client",
    nextAction: "Share UN mission airlift dashboard demo",
    nextActionDate: "2026-08-15",
    estimatedValue: 540000,
    notes: "UN Iraq mission aviation support — flight following + spare parts visibility.",
    discoveryNotes: "Procurement via UN secretariat; long lead times.",
    lastContactAt: "2026-07-18T11:00:00.000Z",
    lastActivityAt: "2026-07-18T11:00:00.000Z",
    contactCount: 3,
  }),
  lead({
    id: "oa-lead-05",
    companyName: "Kuwait Airways Ground Systems",
    contactName: "Layla Al-Sabah",
    firstName: "Layla",
    surname: "Al-Sabah",
    role: "GM Ground Systems",
    email: "l.alsabah@kuwaitairways.com",
    phone: "+965 2475 5501",
    status: "Cold",
    source: "Cold outreach",
    nextAction: "Qualify ramp digitisation budget",
    nextActionDate: "2026-08-20",
    estimatedValue: 310000,
    notes: "Ground ops modernisation for Kuwait hub.",
    discoveryNotes: "",
    lastContactAt: "2026-07-05T08:00:00.000Z",
    lastActivityAt: "2026-07-05T08:00:00.000Z",
    contactCount: 1,
  }),
  lead({
    id: "oa-lead-06",
    companyName: "NASA Armstrong Flight Research",
    contactName: "Dr. Priya Nair",
    firstName: "Priya",
    surname: "Nair",
    role: "Program Manager, AAM Flight Test",
    email: "priya.nair@nasa.gov",
    phone: "+1 661 555 0164",
    status: "Hot",
    source: "Website Contact Form",
    nextAction: "Align SBIR Phase II technical volume",
    nextActionDate: "2026-08-09",
    estimatedValue: 750000,
    notes: "Flight-test data platform for advanced air mobility research.",
    discoveryNotes: "Requires ITAR-aware data handling.",
    lastContactAt: "2026-07-29T17:00:00.000Z",
    lastActivityAt: "2026-07-29T17:00:00.000Z",
    contactCount: 7,
  }),
  lead({
    id: "oa-lead-07",
    companyName: "FAA Integration Pilot Office",
    contactName: "James Whitaker",
    firstName: "James",
    surname: "Whitaker",
    role: "Program Lead, BEYOND",
    email: "james.whitaker@faa.gov",
    phone: "+1 202 555 0133",
    status: "Warm",
    source: "Trade show",
    nextAction: "Submit BEYOND data-exchange RFI response",
    nextActionDate: "2026-08-18",
    estimatedValue: 425000,
    notes: "FAA-style integration pilot for UAS traffic management reporting.",
    discoveryNotes: "Public-sector procurement; multi-quarter cycle.",
    lastContactAt: "2026-07-14T15:00:00.000Z",
    lastActivityAt: "2026-07-14T15:00:00.000Z",
    contactCount: 2,
  }),
  lead({
    id: "oa-lead-08",
    companyName: "Turkish Aerospace Logistics Hub",
    contactName: "Emre Yilmaz",
    firstName: "Emre",
    surname: "Yilmaz",
    role: "Director, Supply Chain",
    email: "e.yilmaz@tusas.com.tr",
    phone: "+90 312 555 0188",
    status: "Cold",
    source: "Referral",
    nextAction: "Intro call with Ankara logistics lead",
    nextActionDate: "2026-08-25",
    estimatedValue: 390000,
    notes: "Defense OEM logistics hub visibility across Ankara–Istanbul.",
    discoveryNotes: "",
    lastContactAt: null,
    lastActivityAt: "2026-06-30T10:00:00.000Z",
    contactCount: 0,
  }),
  lead({
    id: "oa-lead-09",
    companyName: "Lockheed Martin Skunk Works Logistics",
    contactName: "Rachel Kim",
    firstName: "Rachel",
    surname: "Kim",
    role: "Senior Manager, Special Programs Logistics",
    email: "rachel.kim@lmco.com",
    phone: "+1 661 555 0190",
    status: "Won",
    source: "Existing client",
    nextAction: "Kick off Phase 1 delivery",
    nextActionDate: "2026-08-05",
    estimatedValue: 1120000,
    notes: "Won — special programs logistics orchestration (USD).",
    discoveryNotes: "Contract executed July 2026.",
    lastContactAt: "2026-07-31T18:00:00.000Z",
    lastActivityAt: "2026-07-31T18:00:00.000Z",
    contactCount: 9,
  }),
  lead({
    id: "oa-lead-10",
    companyName: "San Antonio Aerospace Defense Depot",
    contactName: "Capt. Andre Brooks",
    firstName: "Andre",
    surname: "Brooks",
    role: "Depot Operations Lead",
    email: "andre.brooks@us.af.mil",
    phone: "+1 210 555 0155",
    status: "Active Customer",
    source: "Existing client",
    nextAction: "Q3 renewal & expansion scoping",
    nextActionDate: "2026-09-01",
    estimatedValue: 860000,
    notes: "Active customer — depot MRO scheduling and parts tracking.",
    discoveryNotes: "Live since Q1 2026.",
    lastContactAt: "2026-07-25T13:00:00.000Z",
    lastActivityAt: "2026-07-25T13:00:00.000Z",
    contactCount: 12,
  }),
];

// ---------------------------------------------------------------------------
// 2. Discovery meetings (linked to oa-lead-01 … 03)
// ---------------------------------------------------------------------------

export const OA_DISCOVERY_MEETINGS: OaDiscoveryMeeting[] = [
  meeting({
    id: "oa-meet-01",
    crmLeadId: "oa-lead-01",
    name: "Col. Marcus Hale",
    organization: "USTRANSCOM Contested Logistics Cell",
    role: "Director, Contested Logistics",
    email: "marcus.hale@ustranscom.mil",
    formattedWhenGmt: "Wed 06 Aug 2026 · 15:00 GMT",
    formattedWhenClient: "Wed 06 Aug 2026 · 10:00 CDT",
    clientTimezone: "America/Chicago",
    status: "scheduled",
    meetingLink: "https://meet.onwardair.tech/discovery-ustranscom",
  }),
  meeting({
    id: "oa-meet-02",
    crmLeadId: "oa-lead-02",
    name: "Elena Vasquez",
    organization: "DFW Airport Vertiport Operations",
    role: "VP Airport Operations",
    email: "e.vasquez@dfwairport.com",
    formattedWhenGmt: "Fri 08 Aug 2026 · 16:30 GMT",
    formattedWhenClient: "Fri 08 Aug 2026 · 11:30 CDT",
    clientTimezone: "America/Chicago",
    status: "scheduled",
    meetingLink: "https://meet.onwardair.tech/discovery-dfw",
  }),
  meeting({
    id: "oa-meet-03",
    crmLeadId: "oa-lead-03",
    name: "Omar Al-Harthy",
    organization: "Etihad Cargo AAM Corridor",
    role: "Head of Cargo Innovation",
    email: "o.alharthy@etihad.ae",
    formattedWhenGmt: "Mon 21 Jul 2026 · 12:00 GMT",
    formattedWhenClient: "Mon 21 Jul 2026 · 16:00 GST",
    clientTimezone: "Asia/Dubai",
    status: "completed",
    meetingLink: "https://meet.onwardair.tech/discovery-etihad",
    startReminderSentAt: "2026-07-21T11:00:00.000Z",
    transcriptSavedAt: "2026-07-21T13:20:00.000Z",
    focusSelectionsSubmittedAt: "2026-07-20T10:00:00.000Z",
  }),
];

// ---------------------------------------------------------------------------
// 3. Onboarding (same 3 companies; platformOrganisationId = lead id for link)
// ---------------------------------------------------------------------------

export const OA_ONBOARDING_RECORDS: ClientOnboardingRecord[] = [
  {
    id: "oa-onboard-01",
    platformOrganisationId: "oa-lead-01",
    platformUserId: null,
    companyName: "USTRANSCOM Contested Logistics Cell",
    contactName: "Col. Marcus Hale",
    contactEmail: "marcus.hale@ustranscom.mil",
    signupDate: "2026-07-20",
    currentStage: "payment_received",
    progressPercent: 33,
    currentStatus: "In Progress",
    signedUpAt: "2026-07-20T14:00:00.000Z",
    signedUpBy: "system",
    paymentReceivedAt: "2026-07-28T16:30:00.000Z",
    paymentReceivedBy: "finance",
    questionnaireCompleteAt: null,
    questionnaireCompleteBy: null,
    platformCloneCompleteAt: null,
    platformCloneCompleteBy: null,
    reviewCompleteAt: null,
    reviewCompleteBy: null,
    platformLiveAt: null,
    platformLiveBy: null,
  },
  {
    id: "oa-onboard-02",
    platformOrganisationId: "oa-lead-02",
    platformUserId: null,
    companyName: "DFW Airport Vertiport Operations",
    contactName: "Elena Vasquez",
    contactEmail: "e.vasquez@dfwairport.com",
    signupDate: "2026-07-12",
    currentStage: "questionnaire_complete",
    progressPercent: 50,
    currentStatus: "In Progress",
    signedUpAt: "2026-07-12T10:00:00.000Z",
    signedUpBy: "system",
    paymentReceivedAt: "2026-07-15T11:00:00.000Z",
    paymentReceivedBy: "finance",
    questionnaireCompleteAt: "2026-07-22T15:00:00.000Z",
    questionnaireCompleteBy: "ops",
    platformCloneCompleteAt: null,
    platformCloneCompleteBy: null,
    reviewCompleteAt: null,
    reviewCompleteBy: null,
    platformLiveAt: null,
    platformLiveBy: null,
  },
  {
    id: "oa-onboard-03",
    platformOrganisationId: "oa-lead-03",
    platformUserId: null,
    companyName: "Etihad Cargo AAM Corridor",
    contactName: "Omar Al-Harthy",
    contactEmail: "o.alharthy@etihad.ae",
    signupDate: "2026-06-28",
    currentStage: "platform_clone_complete",
    progressPercent: 67,
    currentStatus: "In Progress",
    signedUpAt: "2026-06-28T09:00:00.000Z",
    signedUpBy: "system",
    paymentReceivedAt: "2026-07-02T12:00:00.000Z",
    paymentReceivedBy: "finance",
    questionnaireCompleteAt: "2026-07-10T14:00:00.000Z",
    questionnaireCompleteBy: "ops",
    platformCloneCompleteAt: "2026-07-24T16:00:00.000Z",
    platformCloneCompleteBy: "engineering",
    reviewCompleteAt: null,
    reviewCompleteBy: null,
    platformLiveAt: null,
    platformLiveBy: null,
  },
];

// ---------------------------------------------------------------------------
// 4. Connections — 10 USA + UAE/Kuwait/Turkey + UN Iraq/Syria + TDI Mali (16)
// ---------------------------------------------------------------------------

export const OA_CONNECTIONS: CrmConnection[] = [
  connection(1, {
    name: "Gen. (Ret.) Patricia Moore",
    role: "Advisor",
    specialties: "DoD air mobility, TRANSCOM doctrine",
    background: "USAF mobility command leadership",
    countryExperience: "USA, Middle East",
    city: "Dayton",
    country: "USA",
    latitude: 39.7589,
    longitude: -84.1916,
  }),
  connection(2, {
    name: "Dr. Kevin Ortiz",
    role: "CTO",
    specialties: "Autonomy, detect-and-avoid",
    background: "NASA / FAA research programs",
    countryExperience: "USA",
    city: "Huntsville",
    country: "USA",
    latitude: 34.7304,
    longitude: -86.5861,
  }),
  connection(3, {
    name: "Michelle Tran",
    role: "CRO",
    specialties: "Airport concessions, vertiport commercial",
    background: "Major hub airport development",
    countryExperience: "USA",
    city: "Dallas",
    country: "USA",
    latitude: 32.7767,
    longitude: -96.797,
  }),
  connection(4, {
    name: "Capt. Brian Keller",
    role: "COO",
    specialties: "Airline ops control, irregular ops",
    background: "Legacy carrier OCC",
    countryExperience: "USA, Europe",
    city: "Atlanta",
    country: "USA",
    latitude: 33.749,
    longitude: -84.388,
  }),
  connection(5, {
    name: "Dr. Ananya Shah",
    role: "Advisor",
    specialties: "Battery systems, propulsion safety",
    background: "Aerospace materials R&D",
    countryExperience: "USA",
    city: "Seattle",
    country: "USA",
    latitude: 47.6062,
    longitude: -122.3321,
  }),
  connection(6, {
    name: "Lt Col (Ret.) Derek Shaw",
    role: "CSO",
    specialties: "Defense logistics, contested environments",
    background: "Joint logistics enterprise",
    countryExperience: "USA, Pacific",
    city: "Colorado Springs",
    country: "USA",
    latitude: 38.8339,
    longitude: -104.8214,
  }),
  connection(7, {
    name: "Laura Chen",
    role: "Advisor",
    specialties: "FAA certification pathways, Part 23/135",
    background: "Regulatory consulting",
    countryExperience: "USA",
    city: "Boston",
    country: "USA",
    latitude: 42.3601,
    longitude: -71.0589,
  }),
  connection(8, {
    name: "Marcus Webb",
    role: "Advisor",
    specialties: "Cargo MRO, desert ops",
    background: "Heavy maintenance networks",
    countryExperience: "USA, Middle East",
    city: "Phoenix",
    country: "USA",
    latitude: 33.4484,
    longitude: -112.074,
  }),
  connection(9, {
    name: "Dr. Helen Park",
    role: "Advisor",
    specialties: "UTM / ATM integration",
    background: "MITRE / ANSPs collaboration",
    countryExperience: "USA",
    city: "Chicago",
    country: "USA",
    latitude: 41.8781,
    longitude: -87.6298,
  }),
  connection(10, {
    name: "Rafael Dominguez",
    role: "Advisor",
    specialties: "Latin America defense attaché networks",
    background: "SOF logistics advisory",
    countryExperience: "USA, LatAm",
    city: "Miami",
    country: "USA",
    latitude: 25.7617,
    longitude: -80.1918,
  }),
  connection(11, {
    name: "Sheikha Noor Al-Maktoum",
    role: "Advisor",
    specialties: "Gulf aviation investment, free-zone ops",
    background: "UAE aerospace ecosystem",
    countryExperience: "UAE, GCC",
    city: "Dubai",
    country: "UAE",
    latitude: 25.2048,
    longitude: 55.2708,
  }),
  connection(12, {
    name: "Faisal Al-Mutairi",
    role: "Advisor",
    specialties: "Kuwait defense & civil aviation liaison",
    background: "National air carrier partnerships",
    countryExperience: "Kuwait, GCC",
    city: "Kuwait City",
    country: "Kuwait",
    latitude: 29.3759,
    longitude: 47.9774,
  }),
  connection(13, {
    name: "Dr. Ayse Demir",
    role: "Advisor",
    specialties: "Turkish aerospace supply chain",
    background: "OEM & MRO industrial policy",
    countryExperience: "Turkey, Europe",
    city: "Ankara",
    country: "Turkey",
    latitude: 39.9334,
    longitude: 32.8597,
  }),
  connection(14, {
    name: "Jean-Pierre Moreau",
    role: "Advisor",
    specialties: "UN air ops, mission support aviation",
    background: "UNAMA / UNAMI aviation coordination",
    countryExperience: "Iraq, UN missions",
    city: "Baghdad",
    country: "Iraq",
    latitude: 33.3152,
    longitude: 44.3661,
  }),
  connection(15, {
    name: "Luke Irving",
    role: "Advisor",
    specialties: "Humanitarian airlift, UN Syria corridor",
    background: "UN cross-border logistics",
    countryExperience: "Syria, Middle East, Europe",
    city: "Damascus",
    country: "Syria",
    latitude: 33.5138,
    longitude: 36.2765,
  }),
  connection(16, {
    name: "Amadou Diallo",
    role: "Advisor",
    specialties: "Development logistics, Sahel air access",
    background: "The Development Initiative — Mali programmes",
    countryExperience: "Mali, West Africa",
    city: "Bamako",
    country: "Mali",
    latitude: 12.6392,
    longitude: -8.0029,
  }),
];

// ---------------------------------------------------------------------------
// 5. Partners (Representative) + USD commissions (amountEur field holds USD)
// ---------------------------------------------------------------------------

export const OA_PARTNERS: Representative[] = [
  {
    id: "oa-rep-01",
    fullName: "Daniel Reeves",
    companyName: "Gulf AAM Channel Partners",
    email: "d.reeves@gulfaam.partners",
    phone: "+971 4 555 2201",
    territory: "Middle East",
    repType: "Distributor",
    status: "Active",
    notes: "Primary UAE/GCC distributor. Commission schedule USD — see OA_PARTNER_COMMISSIONS.",
  },
  {
    id: "oa-rep-02",
    fullName: "Capt. Sarah Lindholm",
    companyName: "Nordic Defense Logistics Ltd",
    email: "s.lindholm@nordicdefenselog.com",
    phone: "+1 703 555 0144",
    territory: "Global",
    repType: "Agent",
    status: "Active",
    notes: "DoD / NATO logistics introductions. USD commissions.",
  },
  {
    id: "oa-rep-03",
    fullName: "Hassan Al-Rashid",
    companyName: "Kuwait Aerospace Intermediaries",
    email: "h.alrashid@kai-aviation.com",
    phone: "+965 2225 0180",
    territory: "Middle East",
    repType: "Reseller",
    status: "Active",
    notes: "Kuwait civil + defense reseller for ground ops modules.",
  },
  {
    id: "oa-rep-04",
    fullName: "Emily Carter",
    companyName: "Austin Vertiport Advisors",
    email: "emily.carter@austinvertiport.com",
    phone: "+1 512 555 0172",
    territory: "Global",
    repType: "Agent",
    status: "Active",
    notes: "US airport / vertiport channel — Texas & Southeast.",
  },
  {
    id: "oa-rep-05",
    fullName: "Mehmet Kaya",
    companyName: "Ankara Flight Systems Partners",
    email: "m.kaya@afs-partners.com.tr",
    phone: "+90 312 555 0199",
    territory: "Global",
    repType: "Distributor",
    status: "Onboarding",
    notes: "Turkish Aerospace ecosystem — contract review in progress.",
  },
  {
    id: "oa-rep-06",
    fullName: "Claire Fontaine",
    companyName: "UN Mission Aviation Liaisons",
    email: "c.fontaine@unmal.partners",
    phone: "+1 212 555 0166",
    territory: "Global",
    repType: "Agent",
    status: "Active",
    notes: "UN Iraq / Syria mission aviation introductions.",
  },
  {
    id: "oa-rep-07",
    fullName: "Ibrahim Touré",
    companyName: "Sahel Air Access Initiative",
    email: "i.toure@sahelairaccess.org",
    phone: "+223 20 555 014",
    territory: "Global",
    repType: "Reseller",
    status: "Onboarding",
    notes: "The Development Initiative (Mali) programme channel.",
  },
  {
    id: "oa-rep-08",
    fullName: "Jonathan Blake",
    companyName: "Atlantic Defense Systems UK",
    email: "j.blake@atlanticdef.uk",
    phone: "+44 20 7946 0188",
    territory: "UK & Ireland",
    repType: "Distributor",
    status: "Inactive",
    notes: "Paused pending US entity realignment — prior EUR deal retired.",
  },
];

/** USD amounts stored in `amountEur` to match RepCommissionRow (field name is EUR-legacy). */
export const OA_PARTNER_COMMISSIONS: RepCommissionRow[] = [
  { repId: "oa-rep-01", client: "Etihad Cargo AAM Corridor", period: "Q2 2026", amountEur: 28500, status: "Outstanding" },
  { repId: "oa-rep-01", client: "Kuwait Airways Ground Systems", period: "Mar 2026", amountEur: 12400, status: "Paid" },
  { repId: "oa-rep-02", client: "USTRANSCOM Contested Logistics Cell", period: "Q3 2026", amountEur: 42000, status: "Upcoming" },
  { repId: "oa-rep-03", client: "Kuwait Airways Ground Systems", period: "Apr 2026", amountEur: 9800, status: "Outstanding" },
  { repId: "oa-rep-04", client: "DFW Airport Vertiport Operations", period: "Jul 2026", amountEur: 15600, status: "Outstanding" },
  { repId: "oa-rep-06", client: "UNAMI Aviation Support Unit", period: "Q2 2026", amountEur: 11200, status: "Paid" },
];

// ---------------------------------------------------------------------------
// 6. Grants — US SBIR/STTR, DoD, NASA, FAA-style (amountEur field = USD)
// ---------------------------------------------------------------------------

export const OA_GRANTS_KPIS: OaGrantKpi[] = [
  {
    id: "pipeline",
    label: "Grant pipeline",
    value: "$3.12M",
    change: "+$510k",
    trend: "up",
    hint: "Active US applications in flight",
  },
  {
    id: "approved-ytd",
    label: "Approved YTD",
    value: "$890k",
    change: "+3 awards",
    trend: "up",
    hint: "Confirmed funding this year",
  },
  {
    id: "under-review",
    label: "Under review",
    value: "4",
    change: "1 due this week",
    trend: "neutral",
    hint: "Awaiting agency feedback",
  },
  {
    id: "success-rate",
    label: "Success rate",
    value: "61%",
    change: "+4 pts",
    trend: "up",
    hint: "Rolling 12-month win rate",
  },
];

export const OA_GRANTS_BY_STATUS: Array<{ status: GrantStatus | string; count: number; value: number }> = [
  { status: "Draft", count: 2, value: 320000 },
  { status: "Submitted", count: 3, value: 540000 },
  { status: "Under Review", count: 4, value: 980000 },
  { status: "Approved", count: 3, value: 890000 },
  { status: "Disbursed", count: 2, value: 410000 },
  { status: "Rejected", count: 1, value: 175000 },
];

export const OA_GRANTS_BY_PROGRAMME = [
  { programme: "DoD SBIR/STTR", amount: 980000 },
  { programme: "NASA AAM", amount: 720000 },
  { programme: "FAA BEYOND / ASSURE", amount: 510000 },
  { programme: "AFWERX", amount: 430000 },
  { programme: "DOT SMART", amount: 280000 },
];

export const OA_GRANTS_MONTHLY_SUBMISSIONS = [
  { month: "Jan", submitted: 1, approved: 1 },
  { month: "Feb", submitted: 2, approved: 0 },
  { month: "Mar", submitted: 2, approved: 1 },
  { month: "Apr", submitted: 3, approved: 2 },
  { month: "May", submitted: 2, approved: 1 },
  { month: "Jun", submitted: 3, approved: 2 },
];

export const OA_GRANT_APPLICATIONS: GrantApplication[] = [
  {
    id: "oa-grant-1",
    programme: "DoD SBIR Phase II",
    funder: "U.S. Department of Defense",
    title: "Contested logistics digital twin for austere airfields",
    amountEur: 750000,
    status: "Under Review",
    owner: "Marcus Hale liaison",
    submittedAt: "2026-04-18",
    deadline: "2026-07-31",
    region: "USA",
    coFundingPct: 20,
  },
  {
    id: "oa-grant-2",
    programme: "NASA AAM National Campaign",
    funder: "NASA",
    title: "Flight-test telemetry platform for eVTOL corridor ops",
    amountEur: 480000,
    status: "Approved",
    owner: "Priya Nair liaison",
    submittedAt: "2026-02-10",
    deadline: "2026-05-01",
    region: "USA",
    coFundingPct: 25,
  },
  {
    id: "oa-grant-3",
    programme: "FAA BEYOND",
    funder: "Federal Aviation Administration",
    title: "UTM data-exchange integration for BEYOND sites",
    amountEur: 265000,
    status: "Submitted",
    owner: "James Whitaker liaison",
    submittedAt: "2026-05-22",
    deadline: "2026-08-15",
    region: "USA",
    coFundingPct: 30,
  },
  {
    id: "oa-grant-4",
    programme: "AFWERX Open Topic",
    funder: "U.S. Air Force / AFWERX",
    title: "Depot MRO scheduling for agile combat employment",
    amountEur: 350000,
    status: "Draft",
    owner: "Andre Brooks liaison",
    submittedAt: null,
    deadline: "2026-09-01",
    region: "USA",
    coFundingPct: 15,
  },
  {
    id: "oa-grant-5",
    programme: "DoD STTR Phase I",
    funder: "U.S. Department of Defense",
    title: "Edge-resilient ops console for contested communications",
    amountEur: 175000,
    status: "Disbursed",
    owner: "Engineering",
    submittedAt: "2025-10-12",
    deadline: "2026-01-15",
    region: "USA",
    coFundingPct: 10,
  },
  {
    id: "oa-grant-6",
    programme: "DOT SMART Grants",
    funder: "U.S. Department of Transportation",
    title: "Airport vertiport capacity planning toolkit",
    amountEur: 280000,
    status: "Under Review",
    owner: "Elena Vasquez liaison",
    submittedAt: "2026-03-28",
    deadline: "2026-06-30",
    region: "USA",
    coFundingPct: 35,
  },
];

/** Convenience bag of OA grant fixture structures. */
export const OA_GRANTS = {
  kpis: OA_GRANTS_KPIS,
  applications: OA_GRANT_APPLICATIONS,
  byStatus: OA_GRANTS_BY_STATUS,
  byProgramme: OA_GRANTS_BY_PROGRAMME,
  monthlySubmissions: OA_GRANTS_MONTHLY_SUBMISSIONS,
} as const;

// ---------------------------------------------------------------------------
// 7. BC dashboard summary tiles
// ---------------------------------------------------------------------------

function buildPipelineByStage(leads: CrmLead[]): OaBcDashboardSummary["pipelineByStage"] {
  const map = new Map<LeadStatus, { count: number; valueUsd: number }>();
  for (const item of leads) {
    const current = map.get(item.status) ?? { count: 0, valueUsd: 0 };
    current.count += 1;
    current.valueUsd += Number(item.estimatedValue) || 0;
    map.set(item.status, current);
  }
  return Array.from(map.entries()).map(([stage, stats]) => ({
    stage,
    count: stats.count,
    valueUsd: stats.valueUsd,
  }));
}

const pipelineValueUsd = OA_PIPELINE_LEADS.reduce(
  (sum, item) => sum + (Number(item.estimatedValue) || 0),
  0,
);

const commissionPipelineUsd = OA_PARTNER_COMMISSIONS.filter(
  (row) => row.status === "Outstanding" || row.status === "Upcoming",
).reduce((sum, row) => sum + row.amountEur, 0);

export const OA_BC_DASHBOARD_SUMMARY: OaBcDashboardSummary = {
  clientsCount: 3,
  activeClients: 3,
  arrUsd: 1_250_000,
  pipelineValueUsd,
  pipelineByStage: buildPipelineByStage(OA_PIPELINE_LEADS),
  discoveryCount: OA_DISCOVERY_MEETINGS.length,
  onboardingCount: OA_ONBOARDING_RECORDS.length,
  partnersCount: OA_PARTNERS.length,
  partnerRegions: [...new Set(OA_PARTNERS.map((p) => p.territory))],
  commissionPipelineUsd,
};

// ---------------------------------------------------------------------------
// 8. Clients dashboard charts (OA)
// ---------------------------------------------------------------------------

export const OA_CLIENTS_DASHBOARD_CHARTS: OaClientsDashboardCharts = {
  statusPie: [
    { name: "Active", value: 3 },
    { name: "Onboarding", value: 0 },
    { name: "Dormant", value: 0 },
    { name: "Archived", value: 0 },
  ],
  monthlyTrend: [
    { month: "Jan", clients: 1, active: 1 },
    { month: "Feb", clients: 1, active: 1 },
    { month: "Mar", clients: 2, active: 2 },
    { month: "Apr", clients: 2, active: 2 },
    { month: "May", clients: 3, active: 3 },
    { month: "Jun", clients: 3, active: 3 },
    { month: "Jul", clients: 3, active: 3 },
    { month: "Aug", clients: 3, active: 3 },
  ],
  segmentBars: [
    { segment: "Defense / DoD", count: 1 },
    { segment: "Healthcare logistics", count: 1 },
    { segment: "Gulf freight", count: 1 },
  ],
};

// ---------------------------------------------------------------------------
// Helpers / typed getters
// ---------------------------------------------------------------------------

/** True when browser surface is OnwardAir — callers use this to overlay fixtures. */
export function isOnwardAirBusinessCentralFixtures(): boolean {
  return isBrowserOnwardAirSurface();
}

export function getOaPipelineLeads(): CrmLead[] {
  return OA_PIPELINE_LEADS;
}

export function getOaDiscoveryMeetings(): OaDiscoveryMeeting[] {
  return OA_DISCOVERY_MEETINGS;
}

export function getOaOnboardingRecords(): ClientOnboardingRecord[] {
  return OA_ONBOARDING_RECORDS;
}

export function getOaConnections(): CrmConnection[] {
  return OA_CONNECTIONS;
}

export function getOaPartners(): Representative[] {
  return OA_PARTNERS;
}

export function getOaPartnerCommissions(): RepCommissionRow[] {
  return OA_PARTNER_COMMISSIONS;
}

export function getOaGrantApplications(): GrantApplication[] {
  return OA_GRANT_APPLICATIONS;
}

export function getOaGrantsKpis(): OaGrantKpi[] {
  return OA_GRANTS_KPIS;
}

export function getOaBcDashboardSummary(): OaBcDashboardSummary {
  return OA_BC_DASHBOARD_SUMMARY;
}

export function getOaClientsDashboardCharts(): OaClientsDashboardCharts {
  return OA_CLIENTS_DASHBOARD_CHARTS;
}
