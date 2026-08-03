/**
 * Talanton Journey Stories — guided capture from portfolio company visits.
 * Not a blog CMS: field insights → AI content packs → Marketing / Board / Newsletter / investors.
 */

import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";

type Listener = () => void;

export type JourneyPublishStatus =
  | "Draft"
  | "Review"
  | "Approved"
  | "Published"
  | "Archived";

export type JourneyDistributionTarget =
  | "marketing-stories"
  | "digital-newsletter"
  | "board-portal"
  | "portfolio-company-portals"
  | "investor-email-updates"
  | "website-news";

export type JourneyMediaKind = "photo" | "video" | "document" | "pdf";

export type JourneyMediaAsset = {
  id: string;
  kind: JourneyMediaKind;
  name: string;
  url: string;
  caption: string;
  previewUrl?: string;
};

export type GuidedJourneyAnswers = {
  encouragedMost: string;
  impactWitnessed: string;
  challengesObserved: string;
  opportunitiesEmerged: string;
  conversationsStoodOut: string;
  companyProgress: string;
  investorsShouldKnow: string;
  prayFor: string;
  additionalNotes: string;
};

export type JourneyGeneratedContent = {
  journeyStory: string;
  executiveSummary: string;
  boardSummary: string;
  investorUpdate: string;
  newsletterArticle: string;
  linkedInPost: string;
  impactHighlights: string;
};

export type InvestorAudience =
  | "all-investors"
  | "impact-fund"
  | "momentum-fund"
  | "stewards-fund"
  | "custom";

export type JourneyStory = {
  id: string;
  title: string;
  country: string;
  region: string;
  city: string;
  startDate: string;
  endDate: string;
  author: string;
  teamMembers: string[];
  companyIds: string[];
  companyNames: string[];
  sector: string;
  purpose: string;
  media: JourneyMediaAsset[];
  answers: GuidedJourneyAnswers;
  generated: JourneyGeneratedContent;
  status: JourneyPublishStatus;
  distributionTargets: JourneyDistributionTarget[];
  investorAudience: InvestorAudience;
  customInvestorEmails: string[];
  createdAt: string;
  updatedAt: string;
};

export type JourneyStoriesState = {
  stories: JourneyStory[];
};

export const JOURNEY_PUBLISH_STATUSES: JourneyPublishStatus[] = [
  "Draft",
  "Review",
  "Approved",
  "Published",
  "Archived",
];

export const JOURNEY_DISTRIBUTION_TARGETS: {
  id: JourneyDistributionTarget;
  label: string;
}[] = [
  { id: "marketing-stories", label: "Marketing & Stories" },
  { id: "digital-newsletter", label: "Digital Newsletter" },
  { id: "board-portal", label: "Board Portal" },
  { id: "portfolio-company-portals", label: "Portfolio Company Portals" },
  { id: "investor-email-updates", label: "Investor Email Updates" },
  { id: "website-news", label: "Website News" },
];

export const GUIDED_QUESTION_FIELDS: {
  key: keyof GuidedJourneyAnswers;
  label: string;
  hint: string;
}[] = [
  {
    key: "encouragedMost",
    label: "What encouraged you most on this journey?",
    hint: "Moments of hope, faithfulness, or stewardship that lifted the team.",
  },
  {
    key: "impactWitnessed",
    label: "What impact did you personally witness?",
    hint: "Jobs, communities, dignity of work, or lives changed on the ground.",
  },
  {
    key: "challengesObserved",
    label: "What challenges did you observe?",
    hint: "Operational, market, or spiritual pressures founders are navigating.",
  },
  {
    key: "opportunitiesEmerged",
    label: "What opportunities emerged?",
    hint: "Follow-on capital, partnerships, or programme openings.",
  },
  {
    key: "conversationsStoodOut",
    label: "What conversations stood out?",
    hint: "Founder, employee, or community dialogues worth remembering.",
  },
  {
    key: "companyProgress",
    label: "What progress did the portfolio companies make?",
    hint: "Commercial and impact milestones since the last visit.",
  },
  {
    key: "investorsShouldKnow",
    label: "What should investors and supporters know?",
    hint: "Truthful stewardship updates for LPs and prayer partners.",
  },
  {
    key: "prayFor",
    label: "What should we pray for?",
    hint: "Specific people, decisions, and communities to hold before God.",
  },
  {
    key: "additionalNotes",
    label: "Additional Notes",
    hint: "Logistics, follow-ups, or sensitive context for the investment team.",
  },
];

const PHOTO = {
  nairobi:
    "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1200&q=80",
  kampala:
    "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1200&q=80",
  dar:
    "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1200&q=80",
  accra:
    "https://images.unsplash.com/photo-1596005554384-d293674c91d7?auto=format&fit=crop&w=1200&q=80",
  factory:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80",
  community:
    "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=1200&q=80",
  founder:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=80",
  field:
    "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80",
};

function companyNames(ids: string[]) {
  return ids.map((id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id);
}

function emptyAnswers(): GuidedJourneyAnswers {
  return {
    encouragedMost: "",
    impactWitnessed: "",
    challengesObserved: "",
    opportunitiesEmerged: "",
    conversationsStoodOut: "",
    companyProgress: "",
    investorsShouldKnow: "",
    prayFor: "",
    additionalNotes: "",
  };
}

function emptyGenerated(): JourneyGeneratedContent {
  return {
    journeyStory: "",
    executiveSummary: "",
    boardSummary: "",
    investorUpdate: "",
    newsletterArticle: "",
    linkedInPost: "",
    impactHighlights: "",
  };
}

/** Deterministic AI-style pack from guided answers + journey metadata. */
export function generateJourneyContent(story: JourneyStory): JourneyGeneratedContent {
  const companies = story.companyNames.join(", ") || "portfolio companies";
  const period =
    story.startDate === story.endDate
      ? story.startDate
      : `${story.startDate} – ${story.endDate}`;
  const a = story.answers;

  const journeyStory = [
    `${story.title}`,
    "",
    `${story.author} · ${story.city}, ${story.country} · ${period}`,
    `Portfolio companies: ${companies}`,
    `Purpose: ${story.purpose}`,
    "",
    "A journey of stewardship",
    a.encouragedMost ||
      `This visit to ${story.country} renewed our conviction that faith-driven enterprise can deliver both commercial resilience and community flourishing.`,
    "",
    "Impact witnessed",
    a.impactWitnessed ||
      `Across ${companies}, we saw jobs retained, youth pathways opening, and communities touched through everyday operations — not slogans.`,
    "",
    "Challenges on the ground",
    a.challengesObserved ||
      "Founders continue to navigate FX pressure, talent depth, and the discipline of measuring impact with the same seriousness as revenue.",
    "",
    "Opportunities ahead",
    a.opportunitiesEmerged ||
      "Clear openings emerged for follow-on support, local partnerships, and sharper LP storytelling rooted in verified field evidence.",
    "",
    "Conversations that mattered",
    a.conversationsStoodOut ||
      "Founder and team dialogues returned again and again to dignity of work, customer trust, and patient capital.",
    "",
    "Progress since last engagement",
    a.companyProgress ||
      `${companies} showed tangible operating progress — hiring, product reach, and governance cadence worthy of Talanton’s stewardship posture.`,
    "",
    "For investors and supporters",
    a.investorsShouldKnow ||
      "Capital is being stewarded toward durable livelihoods. The stories from this journey belong in LP packs and prayer letters alike.",
    "",
    "Prayer",
    a.prayFor ||
      `Pray for wisdom for founders in ${story.country}, protection for teams serving communities, and discernment for Talanton’s next capital decisions.`,
    a.additionalNotes ? `\nNotes\n${a.additionalNotes}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const executiveSummary = [
    `${story.title} — Executive Summary`,
    `${story.author} visited ${companies} in ${story.city}, ${story.country} (${period}).`,
    a.impactWitnessed
      ? `Impact: ${a.impactWitnessed.slice(0, 220)}${a.impactWitnessed.length > 220 ? "…" : ""}`
      : `Purpose: ${story.purpose}`,
    a.opportunitiesEmerged
      ? `Opportunity: ${a.opportunitiesEmerged.slice(0, 180)}${a.opportunitiesEmerged.length > 180 ? "…" : ""}`
      : "Recommend IC follow-up on field evidence for the next board pack.",
  ].join("\n");

  const boardSummary = [
    `Board Journey Brief — ${story.title}`,
    `Country: ${story.country} · Companies: ${companies} · ${period}`,
    "",
    "Witnessed impact",
    a.impactWitnessed || "Field teams confirmed jobs, community reach, and operational discipline.",
    "",
    "Risks / challenges",
    a.challengesObserved || "Watch FX, talent, and impact measurement cadence.",
    "",
    "Board ask",
    a.investorsShouldKnow ||
      "Endorse continued stewardship narrative for LP reporting and approve use of field media in the board pack.",
    "",
    "Prayer focus",
    a.prayFor || "Founders, employees, and communities served.",
  ].join("\n");

  const investorUpdate = [
    `Investor Update — ${story.title}`,
    `Dear partners,`,
    "",
    `Harry and the investment team recently completed a portfolio journey in ${story.country}, visiting ${companies}.`,
    "",
    a.companyProgress ||
      "Founders demonstrated measurable progress on both commercial and impact milestones.",
    "",
    a.investorsShouldKnow ||
      "We remain committed to transparent stewardship — sharing what we see in the field, not only what fits a slide.",
    "",
    "Impact highlights",
    a.impactWitnessed || "Jobs, livelihoods, and community outcomes observed first-hand.",
    "",
    "With gratitude,",
    story.author,
    "Talanton Impact",
  ].join("\n");

  const newsletterArticle = [
    `${story.title}`,
    "",
    `From ${story.city}, ${story.country} — ${story.author} shares what the Talanton team witnessed among ${companies}.`,
    "",
    a.encouragedMost || "Encouragement came from founders who hold faith and excellence together.",
    "",
    a.impactWitnessed || "Impact was visible in workplaces, communities, and quiet acts of stewardship.",
    "",
    "Read more in Marketing & Stories, and pray with us for the road ahead.",
  ].join("\n");

  const linkedInPost = [
    `Just returned from ${story.country} with the Talanton Impact team.`,
    "",
    `Visiting ${companies} reminded us why patient, faith-driven capital matters: ${
      a.impactWitnessed?.slice(0, 140) || "jobs, dignity of work, and communities flourishing."
    }`,
    "",
    "Grateful for founders who steward both enterprise and people.",
    "",
    "#ImpactInvesting #Africa #FaithAndWork #TalantonImpact",
  ].join("\n");

  const impactHighlights = [
    `• Journey: ${story.title} (${story.country})`,
    `• Companies: ${companies}`,
    `• Dates: ${period}`,
    `• Author: ${story.author}`,
    a.impactWitnessed ? `• Impact: ${a.impactWitnessed.slice(0, 160)}` : "• Impact: Field outcomes observed",
    a.companyProgress ? `• Progress: ${a.companyProgress.slice(0, 160)}` : "• Progress: Operating milestones confirmed",
    a.opportunitiesEmerged
      ? `• Opportunity: ${a.opportunitiesEmerged.slice(0, 160)}`
      : "• Opportunity: Follow-on stewardship pathways",
    a.prayFor ? `• Prayer: ${a.prayFor.slice(0, 120)}` : "• Prayer: Founders and communities",
  ].join("\n");

  return {
    journeyStory,
    executiveSummary,
    boardSummary,
    investorUpdate,
    newsletterArticle,
    linkedInPost,
    impactHighlights,
  };
}

function media(
  id: string,
  kind: JourneyMediaKind,
  name: string,
  url: string,
  caption: string,
): JourneyMediaAsset {
  return { id, kind, name, url, caption, previewUrl: kind === "photo" ? url : undefined };
}

const SEED_RAW = [
  {
    id: "journey-kenya-founder-2026",
    title: "Kenya Founder Visit — Nairobi Corridor",
    country: "Kenya",
    region: "Nairobi Metropolitan",
    city: "Nairobi",
    startDate: "2026-06-10",
    endDate: "2026-06-14",
    author: "Harry Turner",
    teamMembers: ["Harry Turner", "Investment Associate — East Africa"],
    companyIds: ["ti-co-arc-ride", "ti-co-burn-manufacturing", "ti-co-pezesha"],
    companyNames: companyNames(["ti-co-arc-ride", "ti-co-burn-manufacturing", "ti-co-pezesha"]),
    sector: "Mobility, Clean Energy & Fintech",
    purpose: "Founder check-ins, impact verification, and LP storytelling capture",
    media: [
      media("jm-ke-1", "photo", "ARC Ride morning dispatch.jpg", PHOTO.nairobi, "Electric fleet staging — Eastlands"),
      media("jm-ke-2", "photo", "Burn cookstove warehouse.jpg", PHOTO.factory, "Clean cookstove inventory — Nairobi"),
      media("jm-ke-3", "photo", "Founder roundtable.jpg", PHOTO.founder, "Founder prayer and operating review"),
      media(
        "jm-ke-4",
        "video",
        "Kenya corridor field reel.mp4",
        "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        "Two-minute journey reel for newsletter",
      ),
      media(
        "jm-ke-5",
        "pdf",
        "Kenya visit impact notes.pdf",
        "#kenya-founder-visit-notes",
        "Field notes for IC pack",
      ),
    ],
    answers: {
      encouragedMost:
        "Watching ARC Ride women night-corridor riders pray before a hospital run — commerce and care held together without apology.",
      impactWitnessed:
        "Battery-swap technicians in Kibera formalising green skills; Burn distributors cutting household smoke; Pezesha traders restocking with dignity.",
      challengesObserved:
        "FX squeezes on imported components, and the ongoing work of turning anecdotal impact into board-ready metrics.",
      opportunitiesEmerged:
        "A shared media day for LP packs, and a youth technician pathway Talanton can amplify across mobility holdings.",
      conversationsStoodOut:
        "James Kariuki on stewardship of rider livelihoods; Burn’s team on rural last-mile trust; Pezesha on church savings-group origination.",
      companyProgress:
        "ARC Ride corridor utilisation up; Burn rural shipments ahead of plan; Pezesha Kisumu book quality holding above underwriting targets.",
      investorsShouldKnow:
        "These are not vanity visits — field evidence supports jobs, cleaner kitchens, and MSME credit reaching informal traders.",
      prayFor:
        "Wisdom for founders under FX pressure, safety for night riders, and discernment for Talanton’s follow-on capital timing.",
      additionalNotes: "Media consents collected for three photo subjects. Soft-copy notes in Media Library.",
    },
    generated: emptyGenerated(),
    status: "Published",
    distributionTargets: [
      "marketing-stories",
      "digital-newsletter",
      "board-portal",
      "portfolio-company-portals",
      "investor-email-updates",
      "website-news",
    ],
    investorAudience: "all-investors",
    customInvestorEmails: [],
    createdAt: "2026-06-15T10:00:00.000Z",
    updatedAt: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "journey-uganda-review-2026",
    title: "Uganda Portfolio Review — Kampala Soft Launch",
    country: "Uganda",
    region: "Central Region",
    city: "Kampala",
    startDate: "2026-07-02",
    endDate: "2026-07-05",
    author: "Harry Turner",
    teamMembers: ["Harry Turner", "Portfolio Ops Lead"],
    companyIds: ["ti-co-arc-ride"],
    companyNames: companyNames(["ti-co-arc-ride"]),
    sector: "Mobility & Logistics",
    purpose: "Review ARC Ride Uganda soft-launch corridor and community readiness",
    media: [
      media("jm-ug-1", "photo", "Kampala corridor scout.jpg", PHOTO.kampala, "Entebbe feeder route observation"),
      media("jm-ug-2", "photo", "Community briefing.jpg", PHOTO.community, "Local partner briefing"),
      media(
        "jm-ug-3",
        "document",
        "Uganda soft-launch checklist.docx",
        "#uganda-soft-launch-checklist",
        "Operating checklist for soft launch",
      ),
    ],
    answers: {
      encouragedMost:
        "Local partners spoke of dignity and safety before scale — the right order for a stewardship-minded expansion.",
      impactWitnessed:
        "Early rider interest and community openness to electric first-mile options near informal settlements.",
      challengesObserved:
        "Battery logistics across the border and the need for clearer county-level impact baselines before LP claims.",
      opportunitiesEmerged:
        "TVET pairing for technicians and a shared prayer network with Kampala marketplace churches.",
      conversationsStoodOut:
        "A county official asking how youth can own the skills pathway — not only ride for wages.",
      companyProgress:
        "Soft-launch staging points identified; insurance conversations underway; community liaison appointed.",
      investorsShouldKnow:
        "Uganda is measured and measured twice — Talanton will not overclaim reach before operations settle.",
      prayFor:
        "Favour with regulators, safety for early riders, and unity between Nairobi and Kampala operating teams.",
      additionalNotes: "Board should see this before Q3 pack lock.",
    },
    generated: emptyGenerated(),
    status: "Approved",
    distributionTargets: ["board-portal", "marketing-stories", "investor-email-updates"],
    investorAudience: "impact-fund",
    customInvestorEmails: [],
    createdAt: "2026-07-06T11:00:00.000Z",
    updatedAt: "2026-07-08T08:00:00.000Z",
  },
  {
    id: "journey-tanzania-impact-2026",
    title: "Tanzania Impact Journey — Dar & Coastal Partners",
    country: "Tanzania",
    region: "Coastal Zone",
    city: "Dar es Salaam",
    startDate: "2026-05-12",
    endDate: "2026-05-16",
    author: "Investment Associate — East Africa",
    teamMembers: ["Investment Associate — East Africa", "Impact Director"],
    companyIds: ["ti-co-long-miles-coffee"],
    companyNames: companyNames(["ti-co-long-miles-coffee"]),
    sector: "Agriculture & Food Systems",
    purpose: "Impact learning journey with agriculture partners and community washing-station peers",
    media: [
      media("jm-tz-1", "photo", "Coastal market morning.jpg", PHOTO.dar, "Market walk with local partners"),
      media("jm-tz-2", "photo", "Smallholder conversation.jpg", PHOTO.field, "Farm-gate dialogue"),
      media(
        "jm-tz-3",
        "video",
        "Tanzania journey highlights.mp4",
        "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
        "Journey highlight reel",
      ),
    ],
    answers: {
      encouragedMost:
        "Farmers describing washing-station governance as shared stewardship — not a top-down NGO project.",
      impactWitnessed:
        "Premium pathways tied to quality cupping; women participating in station committees; youth learning post-harvest skills.",
      challengesObserved:
        "Transport costs and climate variability still threaten consistency of cherry quality.",
      opportunitiesEmerged:
        "Cross-border learning with Burundi Long Miles practices and a supporter prayer letter with farmer names (consented).",
      conversationsStoodOut:
        "A station chair praying for fair prices and honest weighing — faith woven into daily trade.",
      companyProgress:
        "Peer learning notes captured for Long Miles operating playbooks; media cleared for newsletter.",
      investorsShouldKnow:
        "Agricultural impact compounds slowly — patience is part of stewardship, not a delay tactic.",
      prayFor:
        "Rain in season, honest markets, and protection for families dependent on cherry income.",
      additionalNotes: "",
    },
    generated: emptyGenerated(),
    status: "Published",
    distributionTargets: [
      "digital-newsletter",
      "marketing-stories",
      "website-news",
      "portfolio-company-portals",
    ],
    investorAudience: "stewards-fund",
    customInvestorEmails: [],
    createdAt: "2026-05-18T09:00:00.000Z",
    updatedAt: "2026-05-20T12:00:00.000Z",
  },
  {
    id: "journey-ghana-growth-2026",
    title: "Ghana Growth Visit — Accra Manufacturing Floor",
    country: "Ghana",
    region: "Greater Accra",
    city: "Accra",
    startDate: "2026-07-20",
    endDate: "2026-07-23",
    author: "Harry Turner",
    teamMembers: ["Harry Turner", "Momentum Fund Lead"],
    companyIds: ["ti-co-ethical-apparel-africa"],
    companyNames: companyNames(["ti-co-ethical-apparel-africa"]),
    sector: "Apparel & Manufacturing",
    purpose: "Growth review, women supervisor cohort celebration, and Momentum LP narrative capture",
    media: [
      media("jm-gh-1", "photo", "Accra floor supervisors.jpg", PHOTO.accra, "Women supervisor cohort"),
      media("jm-gh-2", "photo", "Cut-make-trim line.jpg", PHOTO.factory, "Production line excellence"),
      media(
        "jm-gh-3",
        "pdf",
        "Ghana growth visit brief.pdf",
        "#ghana-growth-visit-brief",
        "Visit brief for Momentum investors",
      ),
    ],
    answers: {
      encouragedMost:
        "More than 60% of floor supervisors are women — leadership that models dignity of work for the whole plant.",
      impactWitnessed:
        "Living-wage pathways, on-site childcare support, and export offtake that funds stable shifts.",
      challengesObserved:
        "Buyer payment timing and the cost of continuous skills upgrading on the line.",
      opportunitiesEmerged:
        "A Momentum Fund investor visit day and a faith-and-work curriculum for shift leads.",
      conversationsStoodOut:
        "Ama Mensah on stewarding promotion pathways so talent stays in Accra rather than migrating without choice.",
      companyProgress:
        "Supervisor cohort graduated; fair-trade audit prep on track; Q2 utilisation healthy.",
      investorsShouldKnow:
        "Momentum capital is meeting a business that already treats people as image-bearers — growth here multiplies dignity.",
      prayFor:
        "Buyer relationships, safety on the floor, and wisdom for Ama’s leadership team.",
      additionalNotes: "Draft for Momentum Fund email — await Harry’s final review.",
    },
    generated: emptyGenerated(),
    status: "Review",
    distributionTargets: ["investor-email-updates", "marketing-stories", "board-portal"],
    investorAudience: "momentum-fund",
    customInvestorEmails: [],
    createdAt: "2026-07-24T10:00:00.000Z",
    updatedAt: "2026-07-25T15:00:00.000Z",
  },
].map((s) => ({ ...s, generated: generateJourneyContent(s as JourneyStory) })) as JourneyStory[];

const SEED: JourneyStory[] = SEED_RAW;

const listeners = new Set<Listener>();
let state: JourneyStoriesState = { stories: SEED.map((s) => ({ ...s })) };

function emit() {
  for (const l of listeners) l();
}

export function subscribeTalantonJourneyStoriesStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTalantonJourneyStoriesSnapshot(): JourneyStoriesState {
  return state;
}

export function resetTalantonJourneyStoriesStore() {
  state = { stories: SEED.map((s) => ({ ...s })) };
  emit();
}

export function listJourneyStories(): JourneyStory[] {
  return state.stories
    .slice()
    .sort((a, b) => Date.parse(b.startDate) - Date.parse(a.startDate));
}

export function listPublishedJourneyStories(): JourneyStory[] {
  return listJourneyStories().filter(
    (s) =>
      s.status === "Published" &&
      (s.distributionTargets.includes("board-portal") ||
        s.distributionTargets.includes("portfolio-company-portals") ||
        s.distributionTargets.includes("marketing-stories") ||
        s.distributionTargets.includes("website-news")),
  );
}

export function listJourneyStoriesForBoard(): JourneyStory[] {
  return listJourneyStories().filter(
    (s) =>
      (s.status === "Published" || s.status === "Approved") &&
      s.distributionTargets.includes("board-portal"),
  );
}

export function listJourneyStoriesForCompanyPortal(): JourneyStory[] {
  return listJourneyStories().filter(
    (s) =>
      s.status === "Published" &&
      s.distributionTargets.includes("portfolio-company-portals"),
  );
}

export function listJourneyStoriesForNewsletter(): JourneyStory[] {
  return listJourneyStories().filter(
    (s) =>
      (s.status === "Published" || s.status === "Approved") &&
      s.distributionTargets.includes("digital-newsletter"),
  );
}

export function getJourneyStory(id: string): JourneyStory | undefined {
  return state.stories.find((s) => s.id === id);
}

export function journeyStoriesDashboardMetrics() {
  const stories = state.stories;
  const countries = new Set(stories.map((s) => s.country));
  const companies = new Set(stories.flatMap((s) => s.companyIds));
  const photos = stories.reduce(
    (n, s) => n + s.media.filter((m) => m.kind === "photo").length,
    0,
  );
  const videos = stories.reduce(
    (n, s) => n + s.media.filter((m) => m.kind === "video").length,
    0,
  );
  const published = stories.filter((s) => s.status === "Published").length;
  return {
    total: stories.length,
    countriesVisited: countries.size,
    companiesVisited: companies.size,
    photosUploaded: photos,
    videosUploaded: videos,
    publishedStories: published,
  };
}

export function blankJourneyStory(): JourneyStory {
  const today = new Date().toISOString().slice(0, 10);
  return {
    id: `journey-${Date.now().toString(36)}`,
    title: "",
    country: "Kenya",
    region: "",
    city: "",
    startDate: today,
    endDate: today,
    author: "Harry Turner",
    teamMembers: ["Harry Turner"],
    companyIds: [],
    companyNames: [],
    sector: "",
    purpose: "",
    media: [],
    answers: emptyAnswers(),
    generated: emptyGenerated(),
    status: "Draft",
    distributionTargets: ["marketing-stories"],
    investorAudience: "all-investors",
    customInvestorEmails: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export function upsertJourneyStory(story: JourneyStory): JourneyStory {
  const names =
    story.companyNames.length > 0
      ? story.companyNames
      : companyNames(story.companyIds);
  const next: JourneyStory = {
    ...story,
    companyNames: names,
    updatedAt: new Date().toISOString(),
  };
  const existing = state.stories.find((s) => s.id === next.id);
  state = {
    stories: existing
      ? state.stories.map((s) => (s.id === next.id ? next : s))
      : [next, ...state.stories],
  };
  emit();
  return next;
}

export function regenerateJourneyContent(id: string): JourneyStory | null {
  const story = state.stories.find((s) => s.id === id);
  if (!story) return null;
  const next = { ...story, generated: generateJourneyContent(story), updatedAt: new Date().toISOString() };
  state = { stories: state.stories.map((s) => (s.id === id ? next : s)) };
  emit();
  return next;
}

export function updateJourneyStatus(id: string, status: JourneyPublishStatus): JourneyStory | null {
  const story = state.stories.find((s) => s.id === id);
  if (!story) return null;
  const next = { ...story, status, updatedAt: new Date().toISOString() };
  state = { stories: state.stories.map((s) => (s.id === id ? next : s)) };
  emit();
  return next;
}

export function addDemoMediaToJourney(
  id: string,
  kind: JourneyMediaKind,
): JourneyStory | null {
  const story = state.stories.find((s) => s.id === id);
  if (!story) return null;
  const urls = [PHOTO.nairobi, PHOTO.kampala, PHOTO.dar, PHOTO.accra, PHOTO.community];
  const url = urls[story.media.length % urls.length]!;
  const asset = media(
    `jm-upload-${Date.now().toString(36)}`,
    kind,
    kind === "photo"
      ? `Field photo ${story.media.length + 1}.jpg`
      : kind === "video"
        ? `Field video ${story.media.length + 1}.mp4`
        : kind === "pdf"
          ? `Journey document ${story.media.length + 1}.pdf`
          : `Journey attachment ${story.media.length + 1}.docx`,
    kind === "photo" ? url : kind === "video" ? "https://www.youtube.com/watch?v=aqz-KE-bpKQ" : `#doc-${id}`,
    `${kind} captured on ${story.title || "journey"}`,
  );
  const next = {
    ...story,
    media: [...story.media, asset],
    updatedAt: new Date().toISOString(),
  };
  state = { stories: state.stories.map((s) => (s.id === id ? next : s)) };
  emit();
  return next;
}

export function filterJourneyStories(opts: {
  query?: string;
  country?: string;
  companyId?: string;
  author?: string;
  status?: JourneyPublishStatus | "all";
  dateFrom?: string;
  dateTo?: string;
}): JourneyStory[] {
  const q = (opts.query ?? "").trim().toLowerCase();
  return listJourneyStories().filter((s) => {
    if (opts.country && opts.country !== "all" && s.country !== opts.country) return false;
    if (opts.companyId && opts.companyId !== "all" && !s.companyIds.includes(opts.companyId)) {
      return false;
    }
    if (opts.author && opts.author !== "all" && s.author !== opts.author) return false;
    if (opts.status && opts.status !== "all" && s.status !== opts.status) return false;
    if (opts.dateFrom && s.startDate < opts.dateFrom) return false;
    if (opts.dateTo && s.endDate > opts.dateTo) return false;
    if (!q) return true;
    const hay = [
      s.title,
      s.country,
      s.city,
      s.author,
      s.purpose,
      s.sector,
      ...s.companyNames,
      ...s.teamMembers,
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}

export function buildInvestorEmailDraft(story: JourneyStory): string {
  const audienceLabel =
    story.investorAudience === "impact-fund"
      ? "Impact Fund investors"
      : story.investorAudience === "momentum-fund"
        ? "Momentum Fund investors"
        : story.investorAudience === "stewards-fund"
          ? "Stewards Fund investors"
          : story.investorAudience === "custom"
            ? `custom recipients (${story.customInvestorEmails.join(", ") || "none selected"})`
            : "all Talanton investors";
  return [
    `To: ${audienceLabel}`,
    `Subject: Talanton Impact — ${story.title}`,
    "",
    story.generated.investorUpdate || generateJourneyContent(story).investorUpdate,
  ].join("\n");
}
