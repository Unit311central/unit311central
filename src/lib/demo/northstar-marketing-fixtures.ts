import type { MarketingBundleResponse } from "@/lib/marketing/client/marketing-api";
import type {
  Campaign,
  ExternalEvent,
  ManagedEvent,
  MediaAsset,
  MailingContact,
  Newsletter,
} from "@/lib/marketing/types";
import type { MarketingStoryRecord } from "@/lib/marketing/mappers";
import { getNorthstarMarketingKpis } from "@/lib/demo/northstar-api-fixtures";

const NOW = "2026-08-16T10:00:00.000Z";

const contacts: MailingContact[] = [
  {
    id: "nst-mkt-c1",
    name: "Tom Bradley",
    email: "t.bradley@sheffieldprecision.co.uk",
    organisation: "Sheffield Precision Engineering",
    segment: "Manufacturing",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-mkt-c2",
    name: "Helen Marsh",
    email: "h.marsh@midlandsfood.co.uk",
    organisation: "Midlands Food Processing Co",
    segment: "Food & beverage",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: "nst-mkt-c3",
    name: "Daniel Wright",
    email: "d.wright@peakbrew.co.uk",
    organisation: "Peak District Breweries",
    segment: "Prospect",
    status: "active",
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const newsletters: Newsletter[] = [
  {
    id: "nst-nl-1",
    title: "August industrial IoT briefing",
    subject: "How Northstar customers cut unplanned downtime by 34%",
    htmlBody: "<p>Case studies from Sheffield Precision and Peak District Breweries.</p>",
    status: "sent",
    scheduledAt: null,
    sentAt: "2026-08-01T09:00:00.000Z",
    recipientMode: "all",
    recipientIds: [],
    manualEmails: [],
    channels: { email: true, linkedin: true, twitter: false },
    metrics: { openRate: 42.5, clickRate: 8.2 },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const campaigns: Campaign[] = [
  {
    id: "nst-camp-1",
    subject: "Made Smarter webinar invite",
    body: "Join Northstar for a UK manufacturing digitalisation session.",
    status: "scheduled",
    recipientMode: "selected",
    recipientIds: ["nst-mkt-c1", "nst-mkt-c2"],
    manualEmails: [],
    scheduledAt: "2026-08-22T10:00:00.000Z",
    sentAt: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const externalEvents: ExternalEvent[] = [
  {
    id: "nst-ev-ext-1",
    name: "Smart Manufacturing Expo",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    city: "Birmingham",
    country: "United Kingdom",
    website: "https://northstar.demo/events/smart-mfg",
    owner: "Marcus Reed",
    status: "Confirmed",
    notes: "Stand B14 — edge controller demos",
    memberIds: [],
    calendarSynced: true,
  },
];

const managedEvents: ManagedEvent[] = [
  {
    id: "nst-ev-man-1",
    name: "Northstar customer roundtable",
    venue: "Manchester HQ",
    city: "Manchester",
    date: "2026-08-28",
    capacity: 60,
    registered: 48,
    budgetLabel: "£12k",
    stage: "Registration open",
    owner: "Elena Hart",
    status: "active",
  },
];

const media: MediaAsset[] = [
  {
    id: "nst-media-1",
    name: "Edge controller hero.jpg",
    mediaType: "image",
    caption: "Northstar edge controller on factory floor",
    uploadedAt: NOW,
  },
];

const portfolioStories: MarketingStoryRecord[] = [
  {
    id: "nst-story-1",
    storyKind: "portfolio",
    title: "Sheffield Precision — 34% less downtime",
    summary: "Predictive maintenance rollout across three production lines.",
    body: "Northstar Atlas monitoring platform deployment case study.",
    status: "published",
    extensionData: { client: "Sheffield Precision Engineering" },
    createdAt: NOW,
    updatedAt: NOW,
  },
];

export function getNorthstarMarketingBundle(): MarketingBundleResponse {
  return {
    contacts,
    newsletters,
    campaigns,
    externalEvents,
    managedEvents,
    media,
    portfolioStories,
    journeyStories: [],
    kpis: getNorthstarMarketingKpis(),
    abhiExtensions: { workingGroups: [], acceleratorCohorts: [] },
  };
}
