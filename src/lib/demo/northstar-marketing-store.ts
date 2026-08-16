/**
 * Northstar Demo — mutable Marketing & Events bundle (API + client hydration).
 */

import type { MarketingBundleResponse, MarketingResource } from "@/lib/marketing/client/marketing-api";
import type { MediaAsset } from "@/lib/marketing/types";
import { getNorthstarMarketingKpis } from "@/lib/demo/northstar-api-fixtures";

const STORAGE_KEY = "unit311-northstar-marketing-v2";
const GLOBAL_KEY = "__unit311_northstar_marketing_bundle__";

function nowIso() {
  return new Date().toISOString();
}

function seedBundle(): MarketingBundleResponse {
  const contacts = [
    {
      id: "nst-mkt-c1",
      name: "Tom Bradley",
      email: "t.bradley@sheffieldprecision.co.uk",
      organisation: "Sheffield Precision Engineering",
      segment: "Manufacturing",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "nst-mkt-c2",
      name: "Helen Marsh",
      email: "h.marsh@midlandsfood.co.uk",
      organisation: "Midlands Food Processing Co",
      segment: "Food & beverage",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "nst-mkt-c3",
      name: "Daniel Wright",
      email: "d.wright@peakbrew.co.uk",
      organisation: "Peak District Breweries",
      segment: "Prospect",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "nst-mkt-c4",
      name: "Amira Khan",
      email: "a.khan@voltex-automation.co.uk",
      organisation: "Voltex Automation",
      segment: "Partner",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "nst-mkt-c5",
      name: "Chris Okafor",
      email: "c.okafor@bristolcomposites.com",
      organisation: "Bristol Composites Ltd",
      segment: "Manufacturing",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
    {
      id: "nst-mkt-c6",
      name: "Laura Finch",
      email: "l.finch@midlandspharma.co.uk",
      organisation: "Midlands Pharma Packaging",
      segment: "Life sciences",
      status: "active" as const,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    },
  ];

  const newsletters = [
    {
      id: "nst-nl-aug-2026",
      title: "August industrial IoT briefing",
      subject: "How Northstar customers cut unplanned downtime by 34%",
      htmlBody:
        "<p>Case studies from Sheffield Precision and Peak District Breweries — edge monitoring, predictive maintenance, and Atlas programme updates.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-08-01T09:00:00.000Z",
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      metrics: { openRate: 42.5, clickRate: 8.2, responseRate: 3.1 },
      createdAt: "2026-07-28T10:00:00.000Z",
      updatedAt: "2026-08-01T09:05:00.000Z",
    },
    {
      id: "nst-nl-jul-2026",
      title: "July customer spotlight",
      subject: "Sheffield Precision — Atlas go-live milestone",
      htmlBody:
        "<p>Phase 2 gateway deployment complete. Executive QBR summary and margin recovery dashboard link.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-07-04T09:00:00.000Z",
      recipientMode: "selected" as const,
      recipientIds: ["nst-mkt-c1", "nst-mkt-c2"],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      metrics: { openRate: 39.8, clickRate: 7.4, responseRate: 2.8 },
      createdAt: "2026-06-30T10:00:00.000Z",
      updatedAt: "2026-07-04T09:05:00.000Z",
    },
    {
      id: "nst-nl-jun-2026",
      title: "June product release",
      subject: "Northstar Edge Controller v2.4 — what's new",
      htmlBody:
        "<p>Firmware v2.4 rollout, Siemens backup supplier programme, and US Austin expansion hiring update.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-06-06T09:00:00.000Z",
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: false, twitter: false },
      metrics: { openRate: 36.2, clickRate: 6.1, responseRate: 2.2 },
      createdAt: "2026-06-02T10:00:00.000Z",
      updatedAt: "2026-06-06T09:05:00.000Z",
    },
    {
      id: "nst-nl-may-2026",
      title: "May manufacturing digest",
      subject: "Made Smarter UK — Northstar webinar recap",
      htmlBody: "<p>Webinar replay, Smart Manufacturing Expo stand plan, and customer roundtable invite.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-05-09T09:00:00.000Z",
      recipientMode: "selected" as const,
      recipientIds: ["nst-mkt-c1", "nst-mkt-c3", "nst-mkt-c5"],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      metrics: { openRate: 41.0, clickRate: 9.0, responseRate: 4.1 },
      createdAt: "2026-05-05T10:00:00.000Z",
      updatedAt: "2026-05-09T09:05:00.000Z",
    },
    {
      id: "nst-nl-apr-2026",
      title: "April pipeline update",
      subject: "US expansion & EU partner programme",
      htmlBody: "<p>Austin sales pod forming, EU distributor MOU signed, and Atlas programme timeline.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-04-11T09:00:00.000Z",
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: false, twitter: true },
      metrics: { openRate: 38.4, clickRate: 5.8, responseRate: 1.9 },
      createdAt: "2026-04-08T10:00:00.000Z",
      updatedAt: "2026-04-11T09:05:00.000Z",
    },
    {
      id: "nst-nl-mar-2026",
      title: "March board & customer letter",
      subject: "Q1 results — margin recovery on track",
      htmlBody:
        "<p>Q1 trading update for key accounts: revenue ahead of plan, Atlas phased delivery, collections sprint.</p>",
      status: "sent" as const,
      scheduledAt: null,
      sentAt: "2026-03-14T09:00:00.000Z",
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      metrics: { openRate: 44.1, clickRate: 10.2, responseRate: 3.5 },
      createdAt: "2026-03-10T10:00:00.000Z",
      updatedAt: "2026-03-14T09:05:00.000Z",
    },
    {
      id: "nst-nl-sep-draft",
      title: "September newsletter (draft)",
      subject: "Smart Manufacturing Expo — meet us on stand B14",
      htmlBody: "<p>Draft — Birmingham expo preview, live edge controller demos, and customer roundtable follow-up.</p>",
      status: "draft" as const,
      scheduledAt: null,
      sentAt: null,
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      channels: { email: true, linkedin: true, twitter: false },
      metrics: { openRate: null, clickRate: null },
      createdAt: "2026-08-14T10:00:00.000Z",
      updatedAt: "2026-08-16T10:00:00.000Z",
    },
  ];

  const campaigns = [
    {
      id: "nst-camp-expo",
      subject: "Smart Manufacturing Expo — book a demo",
      body: "Join Northstar on stand B14, 10–12 September, Birmingham NEC.",
      status: "scheduled" as const,
      recipientMode: "selected" as const,
      recipientIds: ["nst-mkt-c1", "nst-mkt-c2", "nst-mkt-c5"],
      manualEmails: [],
      scheduledAt: "2026-08-22T10:00:00.000Z",
      sentAt: null,
      createdAt: "2026-08-10T10:00:00.000Z",
      updatedAt: "2026-08-10T10:00:00.000Z",
      extensionData: {
        name: "Smart Mfg Expo invite",
        purpose: "Event promotion",
        listName: "Manufacturing accounts Q3",
        lastSent: null,
      },
    },
    {
      id: "nst-camp-roundtable",
      subject: "Customer roundtable — Manchester 28 Aug",
      body: "Invitation to Northstar customer roundtable at Manchester HQ.",
      status: "sent" as const,
      recipientMode: "selected" as const,
      recipientIds: ["nst-mkt-c1", "nst-mkt-c3"],
      manualEmails: [],
      scheduledAt: null,
      sentAt: "2026-08-05T14:00:00.000Z",
      createdAt: "2026-07-30T10:00:00.000Z",
      updatedAt: "2026-08-05T14:05:00.000Z",
      extensionData: {
        name: "Manchester roundtable",
        purpose: "Customer engagement",
        listName: "Strategic accounts",
        lastSent: "2026-08-05T14:00:00.000Z",
      },
    },
    {
      id: "nst-camp-webinar",
      subject: "Made Smarter webinar replay",
      body: "Replay link and slides from the UK manufacturing digitalisation session.",
      status: "sent" as const,
      recipientMode: "all" as const,
      recipientIds: [],
      manualEmails: [],
      scheduledAt: null,
      sentAt: "2026-05-12T11:00:00.000Z",
      createdAt: "2026-05-10T10:00:00.000Z",
      updatedAt: "2026-05-12T11:05:00.000Z",
      extensionData: {
        name: "Made Smarter replay",
        purpose: "Lead nurture",
        listName: "All active subscribers",
        lastSent: "2026-05-12T11:00:00.000Z",
      },
    },
    {
      id: "nst-camp-atlas",
      subject: "Atlas programme update for partners",
      body: "Partner briefing on Atlas phased go-live and integration timeline.",
      status: "draft" as const,
      recipientMode: "selected" as const,
      recipientIds: ["nst-mkt-c4"],
      manualEmails: [],
      scheduledAt: null,
      sentAt: null,
      createdAt: "2026-08-12T10:00:00.000Z",
      updatedAt: "2026-08-12T10:00:00.000Z",
      extensionData: {
        name: "Atlas partner brief",
        purpose: "Partner comms",
        listName: "Technology partners",
        lastSent: null,
      },
    },
  ];

  const externalEvents = [
    {
      id: "nst-ev-ext-1",
      name: "Smart Manufacturing Expo",
      startDate: "2026-09-10",
      endDate: "2026-09-12",
      city: "Birmingham",
      country: "United Kingdom",
      website: "https://northstar.demo/events/smart-mfg",
      owner: "Marcus Reed",
      ownerId: "nst-staff-marcus",
      status: "Confirmed",
      notes: "Stand B14 — edge controller demos",
      memberIds: ["nst-mkt-c1", "nst-mkt-c5"],
      calendarSynced: true,
    },
    {
      id: "nst-ev-ext-2",
      name: "HANNOVER MESSE 2026",
      startDate: "2026-04-20",
      endDate: "2026-04-24",
      city: "Hannover",
      country: "Germany",
      website: "https://northstar.demo/events/hannover",
      owner: "Elena Hart",
      ownerId: "nst-staff-elena",
      status: "Completed",
      notes: "EU distributor meetings — 14 qualified leads",
      memberIds: [],
      calendarSynced: true,
    },
    {
      id: "nst-ev-ext-3",
      name: "Advanced Engineering UK",
      startDate: "2026-11-05",
      endDate: "2026-11-06",
      city: "Birmingham",
      country: "United Kingdom",
      website: "https://northstar.demo/events/advanced-eng",
      owner: "James Okonkwo",
      ownerId: "nst-staff-james",
      status: "Planning",
      notes: "Speaking slot — predictive maintenance panel",
      memberIds: [],
      calendarSynced: false,
    },
  ];

  const managedEvents = [
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
      extensionData: {
        leadName: "Elena Hart",
        startDate: "2026-08-28",
        endDate: "2026-08-28",
        country: "United Kingdom",
      },
    },
    {
      id: "nst-ev-man-2",
      name: "Atlas partner briefing",
      venue: "Bristol R&D Centre",
      city: "Bristol",
      date: "2026-09-04",
      capacity: 30,
      registered: 22,
      budgetLabel: "£4k",
      stage: "Planning",
      owner: "James Okonkwo",
      status: "active",
      extensionData: {
        leadName: "James Okonkwo",
        startDate: "2026-09-04",
        endDate: "2026-09-04",
        country: "United Kingdom",
      },
    },
  ];

  const portfolioStories = [
    {
      id: "nst-story-1",
      storyKind: "portfolio" as const,
      title: "Sheffield Precision — 34% less downtime",
      summary: "Predictive maintenance rollout across three production lines.",
      body: "Northstar Atlas monitoring platform deployment case study. Submitted via client portal by Tom Bradley.",
      status: "published",
      extensionData: {
        companyId: "nst-client-sheffield",
        companyName: "Sheffield Precision Engineering",
        country: "United Kingdom",
        submissionDate: "2026-06-15",
        status: "Published",
        impactCategory: "Jobs & Livelihoods",
        submittedBy: "Tom Bradley (client portal)",
        source: "client_portal",
        photos: [
          {
            id: "ph-1",
            name: "Line 3 gateway install",
            mediaType: "Image",
            caption: "Edge gateway deployment — Sheffield Line 3",
            url: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=960&q=80",
          },
        ],
        videos: [],
        attachments: [],
      },
      createdAt: "2026-06-15T10:00:00.000Z",
      updatedAt: "2026-06-20T10:00:00.000Z",
    },
    {
      id: "nst-story-2",
      storyKind: "portfolio" as const,
      title: "Peak District Breweries — energy savings",
      summary: "18% reduction in line energy consumption using edge analytics.",
      body: "Brewery packaging line optimisation with Northstar edge controllers.",
      status: "published",
      extensionData: {
        companyId: "nst-client-peak",
        companyName: "Peak District Breweries",
        country: "United Kingdom",
        submissionDate: "2026-05-20",
        status: "Published",
        impactCategory: "Climate & Environment",
        submittedBy: "Daniel Wright",
        source: "client_portal",
        photos: [
          {
            id: "ph-2",
            name: "Packaging line monitoring",
            mediaType: "Image",
            caption: "Energy analytics on the brewery packaging line",
            url: "https://images.unsplash.com/photo-1532635246-17e820acc59f?w=960&q=80",
          },
        ],
        videos: [],
        attachments: [],
      },
      createdAt: "2026-05-20T10:00:00.000Z",
      updatedAt: "2026-05-25T10:00:00.000Z",
    },
    {
      id: "nst-story-3",
      storyKind: "portfolio" as const,
      title: "Midlands Food — cold chain visibility",
      summary: "Real-time temperature monitoring across two distribution hubs.",
      body: "Cold chain compliance and alert routing for food processing client.",
      status: "Approved",
      extensionData: {
        companyId: "nst-client-midlands",
        companyName: "Midlands Food Processing Co",
        country: "United Kingdom",
        submissionDate: "2026-07-10",
        status: "Approved",
        impactCategory: "Health & Wellbeing",
        submittedBy: "Helen Marsh",
        source: "client_portal",
        photos: [
          {
            id: "ph-3",
            name: "Cold chain hub sensors",
            mediaType: "Image",
            caption: "Temperature monitoring at Midlands distribution hub",
            url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=960&q=80",
          },
        ],
        videos: [],
        attachments: [],
      },
      createdAt: "2026-07-10T10:00:00.000Z",
      updatedAt: "2026-07-18T10:00:00.000Z",
    },
    {
      id: "nst-story-4",
      storyKind: "portfolio" as const,
      title: "Bristol Composites — quality gate automation",
      summary: "Automated quality checks reduced rework by 22%.",
      body: "Composite layup inspection workflow integrated with MES.",
      status: "Under Review",
      extensionData: {
        companyId: "nst-client-bristol",
        companyName: "Bristol Composites Ltd",
        country: "United Kingdom",
        submissionDate: "2026-08-01",
        status: "Under Review",
        impactCategory: "Jobs & Livelihoods",
        submittedBy: "Chris Okafor",
        source: "client_portal",
        photos: [
          {
            id: "ph-4",
            name: "Composite layup inspection",
            mediaType: "Image",
            caption: "Automated quality gate on composite layup line",
            url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=960&q=80",
          },
        ],
        videos: [],
        attachments: [],
      },
      createdAt: "2026-08-01T10:00:00.000Z",
      updatedAt: "2026-08-08T10:00:00.000Z",
    },
  ];

  return {
    contacts,
    newsletters,
    campaigns,
    externalEvents,
    managedEvents,
    media: [
      {
        id: "nst-media-1",
        name: "Edge controller hero.jpg",
        mediaType: "image",
        caption: "Northstar edge controller on factory floor",
        uploadedAt: nowIso(),
      },
    ],
    portfolioStories,
    journeyStories: [],
    kpis: getNorthstarMarketingKpis(),
    abhiExtensions: { workingGroups: [], acceleratorCohorts: [] },
  };
}

function readServerBundle(): MarketingBundleResponse {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: MarketingBundleResponse };
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = seedBundle();
  return g[GLOBAL_KEY]!;
}

function readClientBundle(): MarketingBundleResponse | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MarketingBundleResponse;
  } catch {
    return null;
  }
}

function writeClientBundle(bundle: MarketingBundleResponse) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  } catch {
    /* ignore */
  }
}

export function getNorthstarMarketingBundle(): MarketingBundleResponse {
  if (typeof window !== "undefined") {
    return readClientBundle() ?? seedBundle();
  }
  return readServerBundle();
}

export function setNorthstarMarketingBundle(bundle: MarketingBundleResponse) {
  const g = globalThis as typeof globalThis & { [GLOBAL_KEY]?: MarketingBundleResponse };
  g[GLOBAL_KEY] = bundle;
  writeClientBundle(bundle);
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}`;
}

function upsertInList<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((row) => row.id === item.id);
  if (index >= 0) {
    const next = [...list];
    next[index] = item;
    return next;
  }
  return [item, ...list];
}

export function upsertNorthstarMarketingResource(
  resource: MarketingResource,
  payload: Record<string, unknown>,
): unknown {
  const bundle = getNorthstarMarketingBundle();
  const id = String(payload.id ?? nextId(`nst-${resource}`));
  const stamp = nowIso();

  switch (resource) {
    case "newsletters": {
      const item = {
        id,
        title: String(payload.title ?? "Untitled newsletter"),
        subject: String(payload.subject ?? ""),
        htmlBody: String(payload.htmlBody ?? ""),
        status: (payload.status as "draft" | "scheduled" | "sent") ?? "draft",
        scheduledAt: (payload.scheduledAt as string | null) ?? null,
        sentAt: (payload.sentAt as string | null) ?? null,
        recipientMode: (payload.recipientMode as "all" | "selected" | "manual") ?? "all",
        recipientIds: (payload.recipientIds as string[]) ?? [],
        manualEmails: (payload.manualEmails as string[]) ?? [],
        channels: (payload.channels as { email: boolean; linkedin: boolean; twitter: boolean }) ?? {
          email: true,
          linkedin: false,
          twitter: false,
        },
        metrics: (payload.metrics as { openRate: number; clickRate: number }) ?? {
          openRate: null,
          clickRate: null,
        },
        createdAt: String(payload.createdAt ?? stamp),
        updatedAt: stamp,
      };
      const next = { ...bundle, newsletters: upsertInList(bundle.newsletters, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "contacts": {
      const item = {
        id,
        name: String(payload.name ?? ""),
        email: String(payload.email ?? ""),
        organisation: String(payload.organisation ?? payload.name ?? ""),
        segment: String(payload.segment ?? "General"),
        status: (payload.status as "active") ?? "active",
        createdAt: String(payload.createdAt ?? stamp),
        updatedAt: stamp,
      };
      const next = { ...bundle, contacts: upsertInList(bundle.contacts, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "campaigns": {
      const item = {
        id,
        subject: String(payload.subject ?? ""),
        body: String(payload.body ?? ""),
        status: (payload.status as "draft" | "scheduled" | "sent") ?? "draft",
        recipientMode: (payload.recipientMode as "all" | "selected" | "manual") ?? "all",
        recipientIds: (payload.recipientIds as string[]) ?? [],
        manualEmails: (payload.manualEmails as string[]) ?? [],
        scheduledAt: (payload.scheduledAt as string | null) ?? null,
        sentAt: (payload.sentAt as string | null) ?? null,
        createdAt: String(payload.createdAt ?? stamp),
        updatedAt: stamp,
        extensionData: (payload.extensionData as Record<string, unknown>) ?? {},
      };
      const next = { ...bundle, campaigns: upsertInList(bundle.campaigns, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "external-events": {
      const item = {
        id,
        name: String(payload.name ?? ""),
        startDate: String(payload.startDate ?? ""),
        endDate: String(payload.endDate ?? payload.startDate ?? ""),
        city: String(payload.city ?? ""),
        country: String(payload.country ?? ""),
        website: String(payload.website ?? ""),
        owner: String(payload.owner ?? ""),
        ownerId: String(payload.ownerId ?? ""),
        status: String(payload.status ?? "Planning"),
        notes: String(payload.notes ?? ""),
        memberIds: (payload.memberIds as string[]) ?? [],
        calendarSynced: Boolean(payload.calendarSynced),
      };
      const next = { ...bundle, externalEvents: upsertInList(bundle.externalEvents, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "managed-events": {
      const item = {
        id,
        name: String(payload.name ?? ""),
        venue: String(payload.venue ?? "TBC"),
        city: String(payload.city ?? ""),
        date: String(payload.date ?? payload.startDate ?? ""),
        capacity: Number(payload.capacity ?? 100),
        registered: Number(payload.registered ?? 0),
        budgetLabel: String(payload.budgetLabel ?? ""),
        stage: String(payload.stage ?? "Planning"),
        owner: String(payload.owner ?? ""),
        status: String(payload.status ?? "Planning"),
        extensionData: (payload.extensionData as Record<string, unknown>) ?? {},
      };
      const next = { ...bundle, managedEvents: upsertInList(bundle.managedEvents, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "stories": {
      const item = {
        id,
        storyKind: (payload.storyKind as "portfolio" | "journey" | "generic") ?? "portfolio",
        title: String(payload.title ?? ""),
        summary: String(payload.summary ?? ""),
        body: String(payload.body ?? ""),
        status: String(payload.status ?? "draft"),
        extensionData: (payload.extensionData as Record<string, unknown>) ?? {},
        createdAt: String(payload.createdAt ?? stamp),
        updatedAt: stamp,
      };
      const next = { ...bundle, portfolioStories: upsertInList(bundle.portfolioStories, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    case "media": {
      const rawType = String(payload.mediaType ?? "image").toLowerCase();
      const mediaType: MediaAsset["mediaType"] =
        rawType === "video" || rawType === "document" || rawType === "other" ? rawType : "image";
      const item: MediaAsset = {
        id,
        name: String(payload.name ?? ""),
        mediaType,
        caption: String(payload.caption ?? ""),
        uploadedAt: stamp,
      };
      const next = { ...bundle, media: upsertInList(bundle.media, item) };
      setNorthstarMarketingBundle(next);
      return item;
    }
    default:
      return null;
  }
}

export function deleteNorthstarMarketingResource(resource: MarketingResource, id: string): boolean {
  const bundle = getNorthstarMarketingBundle();
  const keyMap: Record<MarketingResource, keyof MarketingBundleResponse> = {
    contacts: "contacts",
    newsletters: "newsletters",
    campaigns: "campaigns",
    "external-events": "externalEvents",
    "managed-events": "managedEvents",
    media: "media",
    stories: "portfolioStories",
  };
  const key = keyMap[resource];
  const list = bundle[key] as Array<{ id: string }>;
  const nextList = list.filter((row) => row.id !== id);
  if (nextList.length === list.length) return false;
  setNorthstarMarketingBundle({ ...bundle, [key]: nextList });
  return true;
}
