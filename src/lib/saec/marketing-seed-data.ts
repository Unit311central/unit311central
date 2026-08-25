import type { MarketingDashboardKpis } from "@/lib/marketing/types";

export const SAEC_MARKETING_NEWSLETTERS = [
  {
    id: "saec-nl-001",
    title: "August mall modernisation update",
    subject: "SAEC — Centurion & Killarney programme progress",
    preview: "Commissioning milestones, safety briefings, and client spotlight.",
    status: "sent",
    audience: "Property & retail clients",
    scheduledAt: "2026-08-08T09:00:00.000Z",
    sentAt: "2026-08-08T09:15:00.000Z",
    openRate: 38.2,
    clickRate: 12.4,
  },
  {
    id: "saec-nl-002",
    title: "Q3 engineering competency bulletin",
    subject: "KLK range training cohort — results & field readiness",
    preview: "Engineering certification outcomes and installation quality metrics.",
    status: "scheduled",
    audience: "Internal engineering",
    scheduledAt: "2026-08-28T08:00:00.000Z",
    sentAt: null,
    openRate: null,
    clickRate: null,
  },
];

export const SAEC_MARKETING_MAILING_LISTS = [
  {
    id: "saec-ml-clients",
    name: "Retail & property portfolio contacts",
    segment: "Clients",
    subscribers: 842,
    growth30d: 28,
    lastCampaign: "August mall modernisation update",
    status: "Active",
  },
  {
    id: "saec-ml-prospects",
    name: "Healthcare & infrastructure prospects",
    segment: "Prospects",
    subscribers: 312,
    growth30d: 14,
    lastCampaign: "Centurion Mall case study",
    status: "Active",
  },
];

export const SAEC_EXTERNAL_EVENTS = [
  {
    id: "saec-ev-001",
    name: "SA Elevator & Escalator Summit",
    startDate: "2026-09-18",
    endDate: "2026-09-19",
    city: "Johannesburg",
    country: "South Africa",
    website: "https://elevator-summit.demo",
    owner: "Commercial team",
    status: "confirmed",
    notes: "Hyprop and Growthpoint meetings pre-booked.",
  },
  {
    id: "saec-ev-002",
    name: "Facilities Management Expo Cape Town",
    startDate: "2026-10-02",
    endDate: "2026-10-03",
    city: "Cape Town",
    country: "South Africa",
    website: "https://fm-expo.demo",
    owner: "Marketing",
    status: "planning",
    notes: "V&A Waterfront case study on stand.",
  },
];

export const SAEC_MANAGED_EVENTS = [
  {
    id: "saec-me-001",
    name: "SAEC client technical briefing — KLK range",
    venue: "Johannesburg HQ auditorium",
    date: "2026-09-05",
    capacity: 48,
    registered: 36,
    budgetZar: 185_000,
    status: "registration_open",
  },
];

export function getSaecMarketingKpis(): MarketingDashboardKpis {
  return {
    newsletterOpenRate: 38.2,
    sentNewsletterCount: 4,
    mailingSubscribers: 1_150,
    mailingGrowth30d: 42,
    externalEventsConfirmed: 1,
    externalEventsTotal: 2,
    managedEventRegistered: 36,
    managedEventCapacity: 48,
    managedEventCount: 1,
  };
}
