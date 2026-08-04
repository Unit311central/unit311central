/**
 * OnwardAir Marketing & Events — demo seed data (not ABHI).
 * Aviation / eVTOL brand surface for newsletter, events, mailing lists.
 */

export type OaNewsletterStatus = "draft" | "scheduled" | "sent";

export type OaNewsletter = {
  id: string;
  title: string;
  subject: string;
  status: OaNewsletterStatus;
  scheduledAt: string | null;
  sentAt: string | null;
  audience: string;
  openRate: number | null;
  clickRate: number | null;
  preview: string;
};

export type OaExternalEvent = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  website: string;
  owner: string;
  status: "Planning" | "Confirmed" | "Completed";
  notes: string;
};

export type OaManagedEvent = {
  id: string;
  name: string;
  date: string;
  venue: string;
  capacity: number;
  registered: number;
  budgetUsd: number;
  stage: "Concept" | "Booking" | "Live" | "Wrap-up";
  owner: string;
};

export type OaMailingList = {
  id: string;
  name: string;
  segment: string;
  subscribers: number;
  growth30d: number;
  lastCampaign: string;
  status: "Active" | "Paused";
};

export const OA_NEWSLETTERS: readonly OaNewsletter[] = [
  {
    id: "oa-nl-01",
    title: "Flight Path — July",
    subject: "Certification milestones & investor day preview",
    status: "sent",
    scheduledAt: null,
    sentAt: "2026-07-22T15:00:00.000Z",
    audience: "Investors + partners",
    openRate: 48.2,
    clickRate: 12.6,
    preview:
      "OnwardAir closed another FAA interaction cycle and confirmed the September investor day agenda in Austin.",
  },
  {
    id: "oa-nl-02",
    title: "Operator Brief — Supply chain",
    subject: "Battery pack partners & delivery windows",
    status: "scheduled",
    scheduledAt: "2026-08-12T14:00:00.000Z",
    sentAt: null,
    audience: "Operations stakeholders",
    openRate: null,
    clickRate: null,
    preview:
      "Update on dual-source battery packs, acceptance testing gates, and Q4 delivery commitments to flight ops.",
  },
  {
    id: "oa-nl-03",
    title: "Community update — Cities",
    subject: "Vertiport partners in Dallas & Phoenix",
    status: "draft",
    scheduledAt: null,
    sentAt: null,
    audience: "City partners",
    openRate: null,
    clickRate: null,
    preview:
      "Draft narrative on municipal partnership progress, noise envelope modelling, and public demo windows.",
  },
];

export const OA_EXTERNAL_EVENTS: readonly OaExternalEvent[] = [
  {
    id: "oa-ex-01",
    name: "eVTOL World Congress",
    startDate: "2026-09-08",
    endDate: "2026-09-10",
    city: "Montreal",
    country: "Canada",
    website: "https://example.com/evtol-world",
    owner: "Priya Nair",
    status: "Confirmed",
    notes: "Booth + keynote slot on autonomous flight assurance.",
  },
  {
    id: "oa-ex-02",
    name: "NBAA Business Aviation Convention",
    startDate: "2026-10-20",
    endDate: "2026-10-22",
    city: "Las Vegas",
    country: "USA",
    website: "https://example.com/nbaa",
    owner: "Marcus Webb",
    status: "Planning",
    notes: "Partner hospitality suite; focus on fleet operators.",
  },
  {
    id: "oa-ex-03",
    name: "Urban Air Mobility Summit Asia",
    startDate: "2026-11-04",
    endDate: "2026-11-05",
    city: "Singapore",
    country: "Singapore",
    website: "https://example.com/uam-asia",
    owner: "Elena Park",
    status: "Confirmed",
    notes: "Panel on regional certification pathways.",
  },
];

export const OA_MANAGED_EVENTS: readonly OaManagedEvent[] = [
  {
    id: "oa-me-01",
    name: "OnwardAir Investor Day 2026",
    date: "2026-09-18",
    venue: "Austin Convention Center — Hall B",
    capacity: 220,
    registered: 168,
    budgetUsd: 185000,
    stage: "Booking",
    owner: "Jordan Hale",
  },
  {
    id: "oa-me-02",
    name: "Pilot Partner Roundtable",
    date: "2026-08-28",
    venue: "OnwardAir HQ — Briefing Room",
    capacity: 40,
    registered: 34,
    budgetUsd: 12000,
    stage: "Live",
    owner: "Priya Nair",
  },
  {
    id: "oa-me-03",
    name: "Community Open Hangar",
    date: "2026-10-05",
    venue: "Flight Test Campus — Hangar 2",
    capacity: 300,
    registered: 96,
    budgetUsd: 45000,
    stage: "Concept",
    owner: "Elena Park",
  },
];

export const OA_MAILING_LISTS: readonly OaMailingList[] = [
  {
    id: "oa-ml-01",
    name: "Investor relations",
    segment: "Series A+ / family offices",
    subscribers: 412,
    growth30d: 18,
    lastCampaign: "Flight Path — July",
    status: "Active",
  },
  {
    id: "oa-ml-02",
    name: "City & airport partners",
    segment: "Municipal + airport authorities",
    subscribers: 267,
    growth30d: 9,
    lastCampaign: "Vertiport partnership brief",
    status: "Active",
  },
  {
    id: "oa-ml-03",
    name: "Media & analysts",
    segment: "Trade press / equity research",
    subscribers: 189,
    growth30d: 4,
    lastCampaign: "Certification milestone note",
    status: "Active",
  },
  {
    id: "oa-ml-04",
    name: "Alumni advisors",
    segment: "Former board / technical advisors",
    subscribers: 74,
    growth30d: 0,
    lastCampaign: "Q2 engineering digest",
    status: "Paused",
  },
];
