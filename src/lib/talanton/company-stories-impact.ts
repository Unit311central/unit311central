/**
 * Portfolio company Stories & Impact submissions.
 * Seeds ARC Ride with realistic demo content; client edits persist in localStorage.
 * Approved / submitted payloads feed Impact Intelligence and Marketing surfaces.
 */

export type StoryStatus = "Draft" | "Submitted" | "Under Review" | "Approved";

export type ImpactCategory =
  | "Jobs & Livelihoods"
  | "Gender Inclusion"
  | "Youth Skills"
  | "Mobility Access"
  | "Climate & Air Quality"
  | "Community Wellbeing";

export type StoryMedia = {
  id: string;
  kind: "photo" | "video" | "attachment";
  name: string;
  url: string;
  caption?: string;
};

export type ImpactStory = {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  summary: string;
  fullStory: string;
  country: string;
  community: string;
  impactCategory: ImpactCategory;
  photos: StoryMedia[];
  videos: StoryMedia[];
  attachments: StoryMedia[];
  status: StoryStatus;
  submittedAt: string | null;
  updatedAt: string;
};

export type ImpactReportStatus = "Draft" | "Submitted" | "Under Review" | "Approved";

export type ImpactReport = {
  id: string;
  companyId: string;
  companyName: string;
  reportingPeriod: string;
  jobsCreated: number;
  jobsRetained: number;
  womenEmployed: number;
  youthEmployed: number;
  peopleServed: number;
  communitiesImpacted: number;
  countriesImpacted: number;
  additionalNotes: string;
  status: ImpactReportStatus;
  submittedAt: string | null;
  updatedAt: string;
};

export type CompanyStoriesImpactBundle = {
  companyId: string;
  stories: ImpactStory[];
  reports: ImpactReport[];
};

export const IMPACT_CATEGORIES: ImpactCategory[] = [
  "Jobs & Livelihoods",
  "Gender Inclusion",
  "Youth Skills",
  "Mobility Access",
  "Climate & Air Quality",
  "Community Wellbeing",
];

export const STORY_STATUSES: StoryStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
];

const ARC_ID = "ti-co-arc-ride";
const ARC_NAME = "ARC Ride";

const PHOTO = {
  fleet: {
    id: "ph-fleet",
    kind: "photo" as const,
    name: "ARC Ride electric fleet — Nairobi CBD",
    url: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
    caption: "Electric two-wheelers staged for morning dispatch in Nairobi.",
  },
  rider: {
    id: "ph-rider",
    kind: "photo" as const,
    name: "Woman rider — Westlands corridor",
    url: "https://images.unsplash.com/photo-1591637333184-19aa84b3e44f?auto=format&fit=crop&w=1200&q=80",
    caption: "ARC Ride partner rider completing a last-mile delivery.",
  },
  swap: {
    id: "ph-swap",
    kind: "photo" as const,
    name: "Battery swap hub — Kibera",
    url: "https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=80",
    caption: "Community battery swap technicians at the Kibera hub.",
  },
  street: {
    id: "ph-street",
    kind: "photo" as const,
    name: "First-mile connectivity — Eastlands",
    url: "https://images.unsplash.com/photo-1511910849309-0dffb508f4ce?auto=format&fit=crop&w=1200&q=80",
    caption: "Riders connecting informal settlements to formal transit nodes.",
  },
};

const VIDEO = {
  swapDemo: {
    id: "vid-swap",
    kind: "video" as const,
    name: "Battery swap in 90 seconds (field clip)",
    url: "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
    caption: "Field clip used for LP storytelling and newsletter embeds.",
  },
};

const ATTACHMENT = {
  factSheet: {
    id: "att-fact",
    kind: "attachment" as const,
    name: "ARC Ride Q2 Impact Fact Sheet.pdf",
    url: "#arc-ride-q2-impact-fact-sheet",
  },
  consent: {
    id: "att-consent",
    kind: "attachment" as const,
    name: "Story subject media consent — signed.pdf",
    url: "#arc-ride-media-consent",
  },
};

const ARC_SEED_STORIES: ImpactStory[] = [
  {
    id: "arc-story-001",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    title: "From Matatu Exhaust to Electric First Mile",
    summary:
      "How ARC Ride’s electric fleet cut commute time and diesel exposure for 12,400 daily riders across Nairobi’s Eastlands corridors.",
    fullStory:
      "Before ARC Ride opened its Eastlands first-mile corridors, many workers spent more than 90 minutes stitching together matatu hops and walking segments just to reach formal transit. In Q2 2026, ARC Ride partnered with three community savings groups to place 180 electric two-wheelers along Donholm, Kayole, and Embakasi feeder routes.\n\nRiders report average door-to-node times falling from 48 to 22 minutes. Air-quality sensors near the Kayole staging bay recorded a 19% drop in roadside NO₂ during peak dispatch windows. Beyond mobility, 64 new rider livelihoods were formalised with insurance, helmets, and weekly earnings guarantees.\n\nThis story is approved for Talanton LP narratives, the digital newsletter, and the portfolio media library.",
    country: "Kenya",
    community: "Eastlands, Nairobi",
    impactCategory: "Mobility Access",
    photos: [PHOTO.fleet, PHOTO.street],
    videos: [VIDEO.swapDemo],
    attachments: [ATTACHMENT.factSheet, ATTACHMENT.consent],
    status: "Approved",
    submittedAt: "2026-06-18",
    updatedAt: "2026-06-22",
  },
  {
    id: "arc-story-002",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    title: "Women Riders Leading Nairobi’s Night Economy",
    summary:
      "A cohort of 42 women riders now anchors late-shift hospital and pharmacy deliveries across Westlands and Parklands.",
    fullStory:
      "ARC Ride’s Women Night Corridor programme launched with safety escorts, lighted staging points, and preferential battery allocation between 7pm and 1am. Participants average KES 2,800 net per night shift — roughly 35% above daytime earnings — while hospitals in the corridor report a 28% faster fulfilment of urgent pharmacy restocks.\n\nThe programme also funds childcare vouchers for 18 riders with dependents under five. Impact category tagging: Gender Inclusion + Jobs & Livelihoods. Media package includes portrait stills and a short interview reel for Marketing & Stories.",
    country: "Kenya",
    community: "Westlands & Parklands, Nairobi",
    impactCategory: "Gender Inclusion",
    photos: [PHOTO.rider, PHOTO.fleet],
    videos: [],
    attachments: [ATTACHMENT.consent],
    status: "Under Review",
    submittedAt: "2026-07-09",
    updatedAt: "2026-07-21",
  },
  {
    id: "arc-story-003",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    title: "Youth Battery Swap Technicians in Kibera",
    summary:
      "Twenty-six youth technicians now run ARC Ride’s community battery swap hub, turning informal mechanics into certified green-skills workers.",
    fullStory:
      "The Kibera swap hub processes ~420 battery exchanges daily. Graduates of ARC Ride’s six-week technician pathway earn formal contracts, PPE, and pathway credits recognised by a local TVET partner. Six alumni have already spun up micro-repair kiosks supplying neighbouring estates.\n\nCommunity leaders cite reduced idle bike downtime and safer charging practices in residential courtyards. Submitted for Talanton review ahead of the Q3 board pack.",
    country: "Kenya",
    community: "Kibera, Nairobi",
    impactCategory: "Youth Skills",
    photos: [PHOTO.swap],
    videos: [VIDEO.swapDemo],
    attachments: [ATTACHMENT.factSheet],
    status: "Submitted",
    submittedAt: "2026-07-28",
    updatedAt: "2026-07-28",
  },
  {
    id: "arc-story-004",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    title: "Clean Air Days with School Shuttle Pilots",
    summary:
      "Draft narrative on a pilot shuttling 900 pupils away from high-emission roadside waiting zones near Thika Road.",
    fullStory:
      "Draft only — awaiting parent association quotes and final air-quality readings before submission. Pilot schools: two primary campuses along the Thika Road feeder. Anticipated metrics: pupil wait-time reduction and caregiver travel cost savings.",
    country: "Kenya",
    community: "Roysambu / Thika Road corridor",
    impactCategory: "Climate & Air Quality",
    photos: [PHOTO.street],
    videos: [],
    attachments: [],
    status: "Draft",
    submittedAt: null,
    updatedAt: "2026-07-30",
  },
];

const ARC_SEED_REPORTS: ImpactReport[] = [
  {
    id: "arc-impact-q1-2026",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    reportingPeriod: "Q1 2026",
    jobsCreated: 38,
    jobsRetained: 162,
    womenEmployed: 54,
    youthEmployed: 71,
    peopleServed: 186000,
    communitiesImpacted: 14,
    countriesImpacted: 1,
    additionalNotes:
      "First full quarter with Eastlands corridor live. Focused on rider onboarding and insurance enrolment.",
    status: "Approved",
    submittedAt: "2026-04-08",
    updatedAt: "2026-04-12",
  },
  {
    id: "arc-impact-q2-2026",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    reportingPeriod: "Q2 2026",
    jobsCreated: 52,
    jobsRetained: 171,
    womenEmployed: 61,
    youthEmployed: 79,
    peopleServed: 214500,
    communitiesImpacted: 17,
    countriesImpacted: 1,
    additionalNotes:
      "Women Night Corridor launched; Kibera swap hub reached 400+ daily exchanges. Figures aligned to Impact Intelligence scorecard definitions.",
    status: "Approved",
    submittedAt: "2026-07-06",
    updatedAt: "2026-07-10",
  },
  {
    id: "arc-impact-q3-2026",
    companyId: ARC_ID,
    companyName: ARC_NAME,
    reportingPeriod: "Q3 2026",
    jobsCreated: 64,
    jobsRetained: 178,
    womenEmployed: 68,
    youthEmployed: 88,
    peopleServed: 241000,
    communitiesImpacted: 19,
    countriesImpacted: 2,
    additionalNotes:
      "Uganda soft-launch corridor (Kampala–Entebbe) counted under countries impacted. Draft metrics pending final payroll lock; submitted for Talanton review.",
    status: "Submitted",
    submittedAt: "2026-08-01",
    updatedAt: "2026-08-01",
  },
];

const SEED_BY_COMPANY: Record<string, CompanyStoriesImpactBundle> = {
  [ARC_ID]: {
    companyId: ARC_ID,
    stories: ARC_SEED_STORIES,
    reports: ARC_SEED_REPORTS,
  },
};

const storageKey = (companyId: string) => `ti-stories-impact:v1:${companyId}`;

function emptyBundle(companyId: string): CompanyStoriesImpactBundle {
  return { companyId, stories: [], reports: [] };
}

function seedFor(companyId: string): CompanyStoriesImpactBundle {
  return SEED_BY_COMPANY[companyId]
    ? structuredClone(SEED_BY_COMPANY[companyId])
    : emptyBundle(companyId);
}

/** Server-safe seed read (no localStorage). */
export function getSeedStoriesImpact(companyId: string): CompanyStoriesImpactBundle {
  return seedFor(companyId);
}

export function loadStoriesImpactBundle(companyId: string): CompanyStoriesImpactBundle {
  const seed = seedFor(companyId);
  if (typeof window === "undefined") return seed;
  try {
    const raw = window.localStorage.getItem(storageKey(companyId));
    if (!raw) return seed;
    const parsed = JSON.parse(raw) as Partial<CompanyStoriesImpactBundle>;
    const userStories = Array.isArray(parsed.stories) ? parsed.stories : [];
    const userReports = Array.isArray(parsed.reports) ? parsed.reports : [];
    const seedStoryIds = new Set(seed.stories.map((s) => s.id));
    const seedReportIds = new Set(seed.reports.map((r) => r.id));
    // Prefer user overrides for seed ids; append purely new records.
    const stories = [
      ...seed.stories.map((s) => userStories.find((u) => u.id === s.id) ?? s),
      ...userStories.filter((u) => !seedStoryIds.has(u.id)),
    ];
    const reports = [
      ...seed.reports.map((r) => userReports.find((u) => u.id === r.id) ?? r),
      ...userReports.filter((u) => !seedReportIds.has(u.id)),
    ];
    return { companyId, stories, reports };
  } catch {
    return seed;
  }
}

function persistBundle(bundle: CompanyStoriesImpactBundle) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(bundle.companyId), JSON.stringify(bundle));
}

export function saveStory(companyId: string, story: ImpactStory): CompanyStoriesImpactBundle {
  const bundle = loadStoriesImpactBundle(companyId);
  const idx = bundle.stories.findIndex((s) => s.id === story.id);
  if (idx >= 0) bundle.stories[idx] = story;
  else bundle.stories = [story, ...bundle.stories];
  persistBundle(bundle);
  return bundle;
}

export function saveImpactReport(
  companyId: string,
  report: ImpactReport,
): CompanyStoriesImpactBundle {
  const bundle = loadStoriesImpactBundle(companyId);
  const idx = bundle.reports.findIndex((r) => r.id === report.id);
  if (idx >= 0) bundle.reports[idx] = report;
  else bundle.reports = [report, ...bundle.reports];
  persistBundle(bundle);
  return bundle;
}

export function listStoryHistory(companyId: string): ImpactStory[] {
  return loadStoriesImpactBundle(companyId).stories.slice().sort((a, b) => {
    const da = a.submittedAt ?? a.updatedAt;
    const db = b.submittedAt ?? b.updatedAt;
    return db.localeCompare(da);
  });
}

export function listImpactReportHistory(companyId: string): ImpactReport[] {
  return loadStoriesImpactBundle(companyId).reports.slice().sort((a, b) =>
    b.reportingPeriod.localeCompare(a.reportingPeriod),
  );
}

/** Latest submitted/approved report preferred for Impact Intelligence. */
export function getLatestImpactReportForIntelligence(
  companyId: string,
): ImpactReport | null {
  const ranked = ["Approved", "Submitted", "Under Review"] as const;
  const reports = getSeedStoriesImpact(companyId).reports;
  for (const status of ranked) {
    const match = reports
      .filter((r) => r.status === status)
      .sort((a, b) => b.reportingPeriod.localeCompare(a.reportingPeriod))[0];
    if (match) return match;
  }
  return null;
}

/** Client-aware variant (includes localStorage submissions). */
export function getLatestImpactReportClient(companyId: string): ImpactReport | null {
  const ranked = ["Approved", "Submitted", "Under Review"] as const;
  const reports = listImpactReportHistory(companyId);
  for (const status of ranked) {
    const match = reports.find((r) => r.status === status);
    if (match) return match;
  }
  return null;
}

export function impactReportTrendSeries(companyId: string): Array<{
  period: string;
  jobsCreated: number;
  peopleServed: number;
  womenEmployed: number;
  youthEmployed: number;
  communitiesImpacted: number;
}> {
  return listImpactReportHistory(companyId)
    .filter((r) => r.status !== "Draft")
    .slice()
    .reverse()
    .map((r) => ({
      period: r.reportingPeriod,
      jobsCreated: r.jobsCreated,
      peopleServed: r.peopleServed,
      womenEmployed: r.womenEmployed,
      youthEmployed: r.youthEmployed,
      communitiesImpacted: r.communitiesImpacted,
    }));
}

// ── Platform feeds (Marketing / Board / Intelligence) ──────────────────────

export type PortfolioStoryFeedItem = {
  id: string;
  companyId: string;
  companyName: string;
  title: string;
  summary: string;
  country: string;
  community: string;
  impactCategory: ImpactCategory;
  status: StoryStatus;
  submittedAt: string | null;
  heroImageUrl: string | null;
  feedTargets: Array<"marketing" | "portfolio-stories" | "media-library" | "newsletter">;
};

function feedTargetsFor(story: ImpactStory): PortfolioStoryFeedItem["feedTargets"] {
  if (story.status === "Approved") {
    return ["marketing", "portfolio-stories", "media-library", "newsletter"];
  }
  if (story.status === "Under Review" || story.status === "Submitted") {
    return ["portfolio-stories", "media-library"];
  }
  return [];
}

/** All seed + known company stories for staff Marketing & Stories. */
export function listPortfolioStoriesFeed(): PortfolioStoryFeedItem[] {
  return Object.values(SEED_BY_COMPANY)
    .flatMap((b) => b.stories)
    .filter((s) => s.status !== "Draft")
    .map((s) => ({
      id: s.id,
      companyId: s.companyId,
      companyName: s.companyName,
      title: s.title,
      summary: s.summary,
      country: s.country,
      community: s.community,
      impactCategory: s.impactCategory,
      status: s.status,
      submittedAt: s.submittedAt,
      heroImageUrl: s.photos[0]?.url ?? null,
      feedTargets: feedTargetsFor(s),
    }))
    .sort((a, b) => (b.submittedAt ?? "").localeCompare(a.submittedAt ?? ""));
}

export function listMediaLibraryFromStories(): StoryMedia[] {
  return Object.values(SEED_BY_COMPANY)
    .flatMap((b) => b.stories)
    .filter((s) => s.status === "Approved" || s.status === "Under Review")
    .flatMap((s) => [...s.photos, ...s.videos, ...s.attachments])
    .filter((m, i, arr) => arr.findIndex((x) => x.id === m.id) === i);
}

export function listNewsletterStoryPicks(): PortfolioStoryFeedItem[] {
  return listPortfolioStoriesFeed().filter(
    (s) => s.status === "Approved" && s.feedTargets.includes("newsletter"),
  );
}

export function newStoryId(): string {
  return `story-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function newReportId(): string {
  return `impact-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function blankStory(companyId: string, companyName: string): ImpactStory {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: newStoryId(),
    companyId,
    companyName,
    title: "",
    summary: "",
    fullStory: "",
    country: "Kenya",
    community: "",
    impactCategory: "Jobs & Livelihoods",
    photos: [],
    videos: [],
    attachments: [],
    status: "Draft",
    submittedAt: null,
    updatedAt: today,
  };
}

export function blankImpactReport(companyId: string, companyName: string): ImpactReport {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: newReportId(),
    companyId,
    companyName,
    reportingPeriod: "Q3 2026",
    jobsCreated: 0,
    jobsRetained: 0,
    womenEmployed: 0,
    youthEmployed: 0,
    peopleServed: 0,
    communitiesImpacted: 0,
    countriesImpacted: 1,
    additionalNotes: "",
    status: "Draft",
    submittedAt: null,
    updatedAt: today,
  };
}
