/**
 * Talanton Marketing & Stories — client mock store.
 * Portfolio companies submit stories via company portal; approved content flows to
 * Portfolio Stories, Media Library, and Newsletter Content.
 */

import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";
import {
  emptyGreenDesertMarketingState,
  isGreenDesertMarketingSurface,
  loadGreenDesertMarketingState,
  persistGreenDesertMarketingState,
} from "@/lib/greendesert/greendesert-marketing-persistence";

type Listener = () => void;

export type StoryStatus = "Draft" | "Submitted" | "Under Review" | "Approved" | "Published";
export type ImpactCategory =
  | "Jobs & Livelihoods"
  | "Women & Youth"
  | "Community Development"
  | "Climate & Environment"
  | "Financial Inclusion"
  | "Health & Wellbeing"
  | "Faith & Dignity of Work";

export type MediaType = "Image" | "Video" | "Document";

export type StoryMediaAsset = {
  id: string;
  name: string;
  mediaType: MediaType;
  /** Display placeholder / caption — no binary blobs in the mock. */
  caption: string;
  /** Optional preview image URL (demo / portal submissions). */
  url?: string;
};

export type PortfolioStory = {
  id: string;
  title: string;
  summary: string;
  fullStory: string;
  companyId: string;
  companyName: string;
  country: string;
  submissionDate: string;
  status: StoryStatus;
  impactCategory: ImpactCategory;
  photos: StoryMediaAsset[];
  videos: StoryMediaAsset[];
  attachments: StoryMediaAsset[];
  submittedBy: string;
  updatedAt: string;
};

export type MediaLibraryItem = {
  id: string;
  name: string;
  mediaType: MediaType;
  sourceCompanyId: string;
  sourceCompanyName: string;
  uploadDate: string;
  caption: string;
  /** Story that sourced this asset when applicable. */
  storyId: string | null;
  storyTitle: string | null;
  /** Journey Stories tagging (optional). */
  journeyStoryId?: string | null;
  journeyTitle?: string | null;
  country?: string | null;
  author?: string | null;
};

export type NewsletterStatus = "draft" | "scheduled" | "sent";
export type RecipientMode = "all" | "selected" | "manual";

export type StoriesNewsletter = {
  id: string;
  title: string;
  subject: string;
  htmlBody: string;
  status: NewsletterStatus;
  selectedStoryIds: string[];
  /** Journey Stories selected as newsletter sources. */
  selectedJourneyStoryIds?: string[];
  recipientMode: RecipientMode;
  recipientContactIds: string[];
  manualEmails: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MailingContact = {
  id: string;
  name: string;
  organisation: string;
  email: string;
  segment: "Investor" | "LP" | "Supporter" | "Partner" | "Media";
};

export type MailingCampaign = {
  id: string;
  subject: string;
  body: string;
  status: NewsletterStatus;
  recipientMode: RecipientMode;
  recipientContactIds: string[];
  manualEmails: string[];
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
};

export type MarketingStoriesState = {
  stories: PortfolioStory[];
  media: MediaLibraryItem[];
  newsletters: StoriesNewsletter[];
  contacts: MailingContact[];
  campaigns: MailingCampaign[];
};

function nowIso() {
  return new Date().toISOString();
}

function asset(
  id: string,
  name: string,
  mediaType: MediaType,
  caption: string,
): StoryMediaAsset {
  return { id, name, mediaType, caption };
}

function company(id: string) {
  return TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)!;
}

const SEED_STORIES: PortfolioStory[] = [
  {
    id: "story-arc-riders",
    title: "From Matatu Exhaust to Electric First Mile",
    summary:
      "ARC Ride’s electric fleet cut commute time and diesel exposure for 12,400 daily riders across Nairobi’s Eastlands corridors.",
    fullStory:
      "Before ARC Ride opened its Eastlands first-mile corridors, many workers spent more than 90 minutes stitching together matatu hops and walking segments just to reach formal transit. In Q2 2026, ARC Ride partnered with three community savings groups to place 180 electric two-wheelers along Donholm, Kayole, and Embakasi feeder routes.\n\nRiders report average door-to-node times falling from 48 to 22 minutes. Air-quality sensors near the Kayole staging bay recorded a 19% drop in roadside NO₂ during peak dispatch windows. Beyond mobility, 64 new rider livelihoods were formalised with insurance, helmets, and weekly earnings guarantees.\n\nApproved for Talanton LP narratives, the digital newsletter, and the portfolio media library.",
    companyId: "ti-co-arc-ride",
    companyName: "ARC Ride",
    country: "Kenya",
    submissionDate: "2026-06-18",
    status: "Published",
    impactCategory: "Jobs & Livelihoods",
    photos: [
      asset(
        "ph-arc-1",
        "ARC Ride electric fleet — Nairobi CBD.jpg",
        "Image",
        "Electric two-wheelers staged for morning dispatch in Nairobi",
      ),
      asset(
        "ph-arc-2",
        "First-mile connectivity — Eastlands.jpg",
        "Image",
        "Riders connecting informal settlements to formal transit nodes",
      ),
    ],
    videos: [
      asset("vid-arc-1", "Battery swap in 90 seconds.mp4", "Video", "Field clip for LP storytelling"),
    ],
    attachments: [
      asset("att-arc-1", "ARC Ride Q2 Impact Fact Sheet.pdf", "Document", "Impact metrics for LP update"),
      asset("att-arc-1b", "Story subject media consent.pdf", "Document", "Signed media consent"),
    ],
    submittedBy: "James Kariuki",
    updatedAt: "2026-06-22T10:00:00.000Z",
  },
  {
    id: "story-arc-women-night",
    title: "Women Riders Leading Nairobi’s Night Economy",
    summary:
      "A cohort of 42 women riders now anchors late-shift hospital and pharmacy deliveries across Westlands and Parklands.",
    fullStory:
      "ARC Ride’s Women Night Corridor programme launched with safety escorts, lighted staging points, and preferential battery allocation between 7pm and 1am. Participants average KES 2,800 net per night shift — roughly 35% above daytime earnings — while hospitals in the corridor report a 28% faster fulfilment of urgent pharmacy restocks.\n\nThe programme also funds childcare vouchers for 18 riders with dependents under five.",
    companyId: "ti-co-arc-ride",
    companyName: "ARC Ride",
    country: "Kenya",
    submissionDate: "2026-07-09",
    status: "Under Review",
    impactCategory: "Women & Youth",
    photos: [
      asset(
        "ph-arc-3",
        "Woman rider — Westlands corridor.jpg",
        "Image",
        "ARC Ride partner rider completing a last-mile delivery",
      ),
    ],
    videos: [],
    attachments: [
      asset("att-arc-2", "Night corridor media consent.pdf", "Document", "Signed media consent"),
    ],
    submittedBy: "James Kariuki",
    updatedAt: "2026-07-21T09:00:00.000Z",
  },
  {
    id: "story-arc-kibera-youth",
    title: "Youth Battery Swap Technicians in Kibera",
    summary:
      "Twenty-six youth technicians now run ARC Ride’s community battery swap hub, turning informal mechanics into certified green-skills workers.",
    fullStory:
      "The Kibera swap hub processes ~420 battery exchanges daily. Graduates of ARC Ride’s six-week technician pathway earn formal contracts, PPE, and pathway credits recognised by a local TVET partner. Six alumni have already spun up micro-repair kiosks supplying neighbouring estates.\n\nCommunity leaders cite reduced idle bike downtime and safer charging practices in residential courtyards.",
    companyId: "ti-co-arc-ride",
    companyName: "ARC Ride",
    country: "Kenya",
    submissionDate: "2026-07-28",
    status: "Submitted",
    impactCategory: "Women & Youth",
    photos: [
      asset(
        "ph-arc-4",
        "Battery swap hub — Kibera.jpg",
        "Image",
        "Community battery swap technicians at the Kibera hub",
      ),
    ],
    videos: [
      asset("vid-arc-2", "Kibera hub walkthrough.mp4", "Video", "Hub operations overview"),
    ],
    attachments: [
      asset("att-arc-3", "Technician pathway brief.pdf", "Document", "TVET pathway overview"),
    ],
    submittedBy: "James Kariuki",
    updatedAt: "2026-07-28T14:00:00.000Z",
  },
  {
    id: "story-ethical-apparel",
    title: "Women Leading the Line at Ethical Apparel Africa",
    summary:
      "More than 60% of Ethical Apparel Africa’s Accra floor supervisors are women — a milestone for dignified manufacturing employment.",
    fullStory:
      "Ethical Apparel Africa has promoted a new cohort of women supervisors across its Accra cut-make-trim floors. Combined with living-wage pathways and on-site childcare support, the programme is reshaping who leads production decisions. Export offtake to European buyers remains strong, and the company is documenting labour standards for upcoming fair-trade audits. This story is cleared for investor newsletters and website features.",
    companyId: "ti-co-ethical-apparel-africa",
    companyName: "Ethical Apparel Africa",
    country: "Ghana",
    submissionDate: "2026-06-28",
    status: "Approved",
    impactCategory: "Women & Youth",
    photos: [
      asset("ph-eaa-1", "Supervisor cohort.jpg", "Image", "Newly promoted supervisors on the floor"),
    ],
    videos: [],
    attachments: [
      asset("att-eaa-1", "Labour standards snapshot.docx", "Document", "Internal standards summary"),
    ],
    submittedBy: "Ama Mensah",
    updatedAt: "2026-07-20T14:30:00.000Z",
  },
  {
    id: "story-pezesha",
    title: "MSME Credit Reaches Informal Traders in Kisumu",
    summary:
      "Pezesha disbursed working-capital facilities to 850 informal traders in Kisumu, with church savings-group partners aiding responsible origination.",
    fullStory:
      "Pezesha’s Kisumu expansion paired digital credit scoring with savings-group referrals from faith-based community partners. Average ticket sizes remain modest, but repayment quality has held above underwriting targets. Traders cite stock replenishment and school-fee smoothing as primary uses of capital. The narrative is under editorial review for the next investor update.",
    companyId: "ti-co-pezesha",
    companyName: "Pezesha",
    country: "Kenya",
    submissionDate: "2026-07-18",
    status: "Under Review",
    impactCategory: "Financial Inclusion",
    photos: [
      asset("ph-pez-1", "Kisumu market traders.jpg", "Image", "Traders at Kibuye market"),
    ],
    videos: [],
    attachments: [],
    submittedBy: "Brian Ouma",
    updatedAt: "2026-07-22T09:15:00.000Z",
  },
  {
    id: "story-kijani",
    title: "Kijani Forestry Plants One Million Trees with Smallholders",
    summary:
      "Kijani crossed one million trees planted with Kenyan smallholder partners, linking climate outcomes to long-term timber income.",
    fullStory:
      "Kijani Forestry’s smallholder programme reached one million trees planted across partner farms in western Kenya. Farmers receive seedling support, extension visits, and a clear offtake pathway. Carbon co-benefit measurement is underway with an independent verifier. Approved for climate-focused LP communications.",
    companyId: "ti-co-kijani-forestry",
    companyName: "Kijani Forestry",
    country: "Kenya",
    submissionDate: "2026-05-30",
    status: "Published",
    impactCategory: "Climate & Environment",
    photos: [
      asset("ph-kij-1", "Tree planting day.jpg", "Image", "Community planting morning"),
      asset("ph-kij-2", "Nursery seedlings.jpg", "Image", "Seedling nursery trays"),
    ],
    videos: [
      asset("vid-kij-1", "Million trees milestone.mp4", "Video", "Founder milestone message"),
    ],
    attachments: [
      asset("att-kij-1", "Planting verification memo.pdf", "Document", "Verification methodology note"),
    ],
    submittedBy: "Amina Otieno",
    updatedAt: "2026-06-15T11:00:00.000Z",
  },
  {
    id: "story-pharmakina",
    title: "Local Quinine Supply Strengthens Community Health Access",
    summary:
      "Pharmakina’s Bukavu operations expanded local quinine supply chains supporting malaria treatment availability in eastern DRC.",
    fullStory:
      "Pharmakina reinforced local processing capacity in Bukavu, improving reliability of quinine supply for regional health partners. Community clinics report fewer stock-out weeks compared with the prior season. Employment at the plant includes a growing share of women technicians. Story submitted pending IC communications review.",
    companyId: "ti-co-pharmakina",
    companyName: "Pharmakina",
    country: "DRC",
    submissionDate: "2026-07-25",
    status: "Submitted",
    impactCategory: "Health & Wellbeing",
    photos: [
      asset("ph-pha-1", "Bukavu plant floor.jpg", "Image", "Processing line overview"),
    ],
    videos: [],
    attachments: [],
    submittedBy: "Jean Mukendi",
    updatedAt: "2026-07-25T16:40:00.000Z",
  },
  {
    id: "story-long-miles",
    title: "Long Miles Coffee Builds Farmer Washing Stations",
    summary:
      "New washing stations in Burundi lift cherry quality and farmer premiums while deepening community partnership structures.",
    fullStory:
      "Long Miles Coffee commissioned two community washing stations that shorten transport times for smallholder cherry. Early quality cupping results show improved consistency, supporting premium pricing. Farmer committees participate in station governance — a model aligned with Talanton’s faith-driven dignity-of-work posture.",
    companyId: "ti-co-long-miles-coffee",
    companyName: "Long Miles Coffee",
    country: "Burundi",
    submissionDate: "2026-06-10",
    status: "Approved",
    impactCategory: "Community Development",
    photos: [
      asset("ph-lmc-1", "Washing station dawn.jpg", "Image", "Morning intake at new station"),
    ],
    videos: [],
    attachments: [
      asset("att-lmc-1", "Farmer premium note.pdf", "Document", "Premium calculation overview"),
    ],
    submittedBy: "Grace Ndayishimiye",
    updatedAt: "2026-07-01T08:20:00.000Z",
  },
  {
    id: "story-burn",
    title: "Clean Cookstoves Reach Rural Households in Kenya",
    summary:
      "Burn Manufacturing shipped a new wave of clean cookstoves to rural distributors, reducing household smoke exposure.",
    fullStory:
      "Burn Manufacturing’s latest distribution push reached rural retailers across western Kenya. Households adopting clean cookstoves report lower fuel spend and reduced kitchen smoke. The company is drafting a photo essay for Talanton’s media library while finalising the draft story narrative.",
    companyId: "ti-co-burn-manufacturing",
    companyName: "Burn Manufacturing",
    country: "Kenya",
    submissionDate: "2026-07-30",
    status: "Draft",
    impactCategory: "Climate & Environment",
    photos: [],
    videos: [],
    attachments: [],
    submittedBy: "Wanjiru Otieno",
    updatedAt: "2026-07-30T12:00:00.000Z",
  },
  {
    id: "story-kivu-tilapia",
    title: "Kivu Tilapia Expands Youth Hatchery Training",
    summary:
      "Kivu Tilapia Farm trained 45 youth technicians in hatchery operations on Lake Kivu, creating skilled aquaculture careers.",
    fullStory:
      "Kivu Tilapia Farm Ltd opened a youth hatchery training track in Rubavu. Trainees learn water-quality monitoring, feeding protocols, and harvest logistics. Graduates are being absorbed into farm operations and neighbouring aquaculture SMEs. Cleared for newsletter feature alongside aquaculture sector notes.",
    companyId: "ti-co-kivu-tilapia-farm-ltd",
    companyName: "Kivu Tilapia Farm Ltd",
    country: "Rwanda",
    submissionDate: "2026-07-05",
    status: "Published",
    impactCategory: "Women & Youth",
    photos: [
      asset("ph-ktf-1", "Hatchery trainees.jpg", "Image", "Youth cohort at tanks"),
    ],
    videos: [
      asset("vid-ktf-1", "Hatchery training overview.mp4", "Video", "Training programme overview"),
    ],
    attachments: [],
    submittedBy: "Eric Habimana",
    updatedAt: "2026-07-14T13:45:00.000Z",
  },
  {
    id: "story-poa",
    title: "poa! Internet Connects Secondary Schools in Nairobi Estates",
    summary:
      "Affordable community Wi-Fi from poa! Internet now serves five additional Nairobi estate schools for after-hours learning.",
    fullStory:
      "poa! Internet partnered with estate schools to extend after-hours connectivity for students without home broadband. Teachers report higher homework completion where campus Wi-Fi is available. The story awaits final fact-check before approval.",
    companyId: "ti-co-poa-internet",
    companyName: "poa! Internet",
    country: "Kenya",
    submissionDate: "2026-07-21",
    status: "Under Review",
    impactCategory: "Community Development",
    photos: [
      asset("ph-poa-1", "School Wi-Fi launch.jpg", "Image", "Students using campus hotspot"),
    ],
    videos: [],
    attachments: [],
    submittedBy: "Nancy Wanjiku",
    updatedAt: "2026-07-23T17:10:00.000Z",
  },
  {
    id: "story-enda",
    title: "Enda Sportswear Athletes Carry Made-in-Kenya Globally",
    summary:
      "Enda’s Eldoret factory athletes competed internationally in Kenyan-made running shoes — a dignity-of-work story for supporters.",
    fullStory:
      "Enda Sportswear athletes racing in Kenyan-made footwear brought global attention to Eldoret’s manufacturing capability. Factory teams hosted school visits to show youth pathways into skilled production roles. Published for supporter and church-partner channels.",
    companyId: "ti-co-enda-sportswear",
    companyName: "Enda Sportswear",
    country: "Kenya",
    submissionDate: "2026-04-18",
    status: "Published",
    impactCategory: "Faith & Dignity of Work",
    photos: [
      asset("ph-enda-1", "Factory floor run day.jpg", "Image", "Athletes visiting production line"),
    ],
    videos: [],
    attachments: [
      asset("att-enda-1", "Supporter story one-pager.pdf", "Document", "One-pager for mailing list"),
    ],
    submittedBy: "Michael Kiprop",
    updatedAt: "2026-05-02T09:00:00.000Z",
  },
];

const SEED_CONTACTS: MailingContact[] = [
  {
    id: "ml-harry",
    name: "Harry Turner",
    organisation: "Talanton Impact",
    email: "harry@talantonimpact.com",
    segment: "Investor",
  },
  {
    id: "ml-lp-nordic",
    name: "Ingrid Bergström",
    organisation: "Nordic Faith Capital",
    email: "ingrid@nordicfaith.example",
    segment: "LP",
  },
  {
    id: "ml-lp-steward",
    name: "David Okonkwo",
    organisation: "Stewardship Partners SSA",
    email: "david@stewardship.example",
    segment: "LP",
  },
  {
    id: "ml-supporter-church",
    name: "Rev. Miriam Wekesa",
    organisation: "Nairobi Marketplace Network",
    email: "miriam@marketplace.example",
    segment: "Supporter",
  },
  {
    id: "ml-partner-dfi",
    name: "Sophie Laurent",
    organisation: "Development Finance Partner",
    email: "sophie.laurent@dfi.example",
    segment: "Partner",
  },
  {
    id: "ml-media-impact",
    name: "Kwame Asante",
    organisation: "Africa Impact Review",
    email: "kwame@aireview.example",
    segment: "Media",
  },
  {
    id: "ml-lp-uk",
    name: "Helen Cartwright",
    organisation: "Kingdom Ventures UK",
    email: "helen@kingdomventures.example",
    segment: "LP",
  },
  {
    id: "ml-supporter-us",
    name: "Pastor James Cole",
    organisation: "Faith & Work Coalition",
    email: "james@faithwork.example",
    segment: "Supporter",
  },
];

function buildMediaFromStories(stories: PortfolioStory[]): MediaLibraryItem[] {
  const items: MediaLibraryItem[] = [];
  for (const story of stories) {
    if (story.status !== "Approved" && story.status !== "Published") continue;
    const all = [...story.photos, ...story.videos, ...story.attachments];
    for (const a of all) {
      items.push({
        id: `media-${a.id}`,
        name: a.name,
        mediaType: a.mediaType,
        sourceCompanyId: story.companyId,
        sourceCompanyName: story.companyName,
        uploadDate: story.submissionDate,
        caption: a.caption,
        storyId: story.id,
        storyTitle: story.title,
      });
    }
  }
  // Standalone media uploads from portfolio portals
  items.push(
    {
      id: "media-standalone-1",
      name: "Masaka Farms harvest panorama.jpg",
      mediaType: "Image",
      sourceCompanyId: "ti-co-masaka-farms",
      sourceCompanyName: "Masaka Farms",
      uploadDate: "2026-07-08",
      caption: "Seasonal harvest with smallholder partners",
      storyId: null,
      storyTitle: null,
    },
    {
      id: "media-standalone-2",
      name: "OWP clinic outreach.mp4",
      mediaType: "Video",
      sourceCompanyId: "ti-co-owp-pharmaceuticals",
      sourceCompanyName: "OWP Pharmaceuticals",
      uploadDate: "2026-06-22",
      caption: "Community clinic medicine outreach day",
      storyId: null,
      storyTitle: null,
    },
    {
      id: "media-standalone-3",
      name: "Taraji Afrika offtake agreement summary.pdf",
      mediaType: "Document",
      sourceCompanyId: "ti-co-taraji-afrika",
      sourceCompanyName: "Taraji Afrika",
      uploadDate: "2026-07-02",
      caption: "Redacted offtake summary for communications use",
      storyId: null,
      storyTitle: null,
    },
  );
  return items.sort((a, b) => Date.parse(b.uploadDate) - Date.parse(a.uploadDate));
}

function seedNewsletters(): StoriesNewsletter[] {
  return [
    {
      id: "nl-q3-investor",
      title: "Q3 Investor Impact Update",
      subject: "Talanton Impact — Q3 portfolio stories from Kenya, Ghana & Rwanda",
      htmlBody:
        "<p>Dear partners,</p><p>This quarter we share approved stories from ARC Ride, Ethical Apparel Africa, and Kivu Tilapia — evidence of faith-driven enterprise creating jobs, inclusion, and community outcomes across Sub-Saharan Africa.</p>",
      status: "draft",
      selectedStoryIds: ["story-arc-riders", "story-ethical-apparel", "story-kivu-tilapia"],
      recipientMode: "all",
      recipientContactIds: [],
      manualEmails: [],
      scheduledAt: null,
      sentAt: null,
      createdAt: "2026-07-28T08:00:00.000Z",
      updatedAt: "2026-08-01T10:00:00.000Z",
    },
    {
      id: "nl-climate",
      title: "Climate & Livelihoods Round-Up",
      subject: "One million trees and cleaner cookstoves — Talanton climate stories",
      htmlBody:
        "<p>Highlighting Kijani Forestry’s million-tree milestone and related climate outcomes across the portfolio.</p>",
      status: "sent",
      selectedStoryIds: ["story-kijani"],
      recipientMode: "selected",
      recipientContactIds: ["ml-lp-nordic", "ml-lp-steward", "ml-partner-dfi"],
      manualEmails: [],
      scheduledAt: null,
      sentAt: "2026-06-20T09:30:00.000Z",
      createdAt: "2026-06-10T08:00:00.000Z",
      updatedAt: "2026-06-20T09:30:00.000Z",
    },
  ];
}

function seedCampaigns(): MailingCampaign[] {
  return [
    {
      id: "camp-supporter",
      subject: "Pray with us — dignity of work across the portfolio",
      body: "Thank you for standing with Talanton. This month we celebrate Enda Sportswear and Ethical Apparel Africa stories of dignified employment.",
      status: "sent",
      recipientMode: "selected",
      recipientContactIds: ["ml-supporter-church", "ml-supporter-us"],
      manualEmails: [],
      scheduledAt: null,
      sentAt: "2026-05-15T11:00:00.000Z",
      createdAt: "2026-05-10T08:00:00.000Z",
    },
    {
      id: "camp-lp-brief",
      subject: "LP brief — stories cleared for Q3 reporting",
      body: "Attached conceptually: approved portfolio stories ready for your LP packs. Reply if you need high-resolution media from the Media Library.",
      status: "draft",
      recipientMode: "selected",
      recipientContactIds: ["ml-lp-nordic", "ml-lp-steward", "ml-lp-uk"],
      manualEmails: [],
      scheduledAt: null,
      sentAt: null,
      createdAt: "2026-07-29T08:00:00.000Z",
    },
  ];
}

function createInitialState(): MarketingStoriesState {
  if (typeof window !== "undefined" && isGreenDesertMarketingSurface()) {
    return loadGreenDesertMarketingState() ?? emptyGreenDesertMarketingState();
  }
  const stories = SEED_STORIES.map((s) => ({ ...s }));
  return {
    stories,
    media: buildMediaFromStories(stories),
    newsletters: seedNewsletters(),
    contacts: SEED_CONTACTS.map((c) => ({ ...c })),
    campaigns: seedCampaigns(),
  };
}

export function buildTalantonMarketingStoriesSeedState(): MarketingStoriesState {
  return createInitialState();
}

let state: MarketingStoriesState = createInitialState();
const listeners = new Set<Listener>();

function emit() {
  if (isGreenDesertMarketingSurface()) {
    persistGreenDesertMarketingState(state);
  }
  for (const listener of listeners) listener();
}

function refreshMediaFromStories() {
  const standalone = state.media.filter((m) => !m.storyId);
  const fromStories = buildMediaFromStories(state.stories).filter((m) => m.storyId);
  state = { ...state, media: [...fromStories, ...standalone].sort((a, b) => Date.parse(b.uploadDate) - Date.parse(a.uploadDate)) };
}

export function subscribeTalantonMarketingStoriesStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getTalantonMarketingStoriesSnapshot(): MarketingStoriesState {
  return state;
}

export function replaceTalantonMarketingStoriesState(next: MarketingStoriesState) {
  state = next;
  refreshMediaFromStories();
  emit();
}

export async function hydrateTalantonMarketingStoriesFromCentralApi(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (isGreenDesertMarketingSurface()) {
    state = loadGreenDesertMarketingState() ?? emptyGreenDesertMarketingState();
    emit();
    return true;
  }
  const { fetchMarketingBundle } = await import("@/lib/marketing/client/marketing-api");
  const { mapBundleToTalantonMarketingStoriesState } = await import(
    "@/lib/marketing/client/store-hydration"
  );
  const bundle = await fetchMarketingBundle();
  if (!bundle) return false;
  replaceTalantonMarketingStoriesState(mapBundleToTalantonMarketingStoriesState(bundle));
  return true;
}

export function resetTalantonMarketingStoriesStore() {
  state = createInitialState();
  emit();
}

export function listApprovedStoriesForNewsletter(): PortfolioStory[] {
  return state.stories
    .filter((s) => s.status === "Approved" || s.status === "Published")
    .sort((a, b) => Date.parse(b.submissionDate) - Date.parse(a.submissionDate));
}

export function updateStoryStatus(storyId: string, status: StoryStatus) {
  state = {
    ...state,
    stories: state.stories.map((s) =>
      s.id === storyId ? { ...s, status, updatedAt: nowIso() } : s,
    ),
  };
  refreshMediaFromStories();
  emit();
  const story = state.stories.find((s) => s.id === storyId);
  if (story) {
    void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonPortfolioStory }) =>
      syncTalantonPortfolioStory(story),
    );
  }
}

/**
 * Ingest a story submitted from a portfolio company portal into Marketing & Stories.
 * Feeds Portfolio Stories, Media Library (once approved/published), and Newsletter picks.
 */
export function ingestCompanyPortalStory(input: {
  id: string;
  title: string;
  summary: string;
  fullStory: string;
  companyId: string;
  companyName: string;
  country: string;
  impactCategory?: ImpactCategory;
  status: Exclude<StoryStatus, "Published">;
  submissionDate: string | null;
  photos?: StoryMediaAsset[];
  videos?: StoryMediaAsset[];
  attachments?: StoryMediaAsset[];
  submittedBy?: string;
}): PortfolioStory {
  const next: PortfolioStory = {
    id: input.id,
    title: input.title,
    summary: input.summary,
    fullStory: input.fullStory,
    companyId: input.companyId,
    companyName: input.companyName,
    country: input.country,
    submissionDate: input.submissionDate ?? nowIso().slice(0, 10),
    status: input.status,
    impactCategory: input.impactCategory ?? "Jobs & Livelihoods",
    photos: input.photos ?? [],
    videos: input.videos ?? [],
    attachments: input.attachments ?? [],
    submittedBy: input.submittedBy ?? "Company portal",
    updatedAt: nowIso(),
  };
  const existing = state.stories.find((s) => s.id === next.id);
  state = {
    ...state,
    stories: existing
      ? state.stories.map((s) => (s.id === next.id ? next : s))
      : [next, ...state.stories],
  };
  refreshMediaFromStories();
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonPortfolioStory }) =>
    syncTalantonPortfolioStory(next),
  );
  return next;
}

/** Push Journey Story media into Media Library with journey tags. */
export function ingestJourneyMediaToLibrary(input: {
  journeyStoryId: string;
  journeyTitle: string;
  country: string;
  author: string;
  companyId: string;
  companyName: string;
  uploadDate: string;
  assets: Array<{
    id: string;
    name: string;
    mediaType: MediaType;
    caption: string;
  }>;
}) {
  const existingIds = new Set(
    state.media.filter((m) => m.journeyStoryId === input.journeyStoryId).map((m) => m.id),
  );
  const incoming: MediaLibraryItem[] = input.assets.map((a) => ({
    id: `journey-media-${a.id}`,
    name: a.name,
    mediaType: a.mediaType,
    sourceCompanyId: input.companyId,
    sourceCompanyName: input.companyName,
    uploadDate: input.uploadDate,
    caption: a.caption,
    storyId: null,
    storyTitle: null,
    journeyStoryId: input.journeyStoryId,
    journeyTitle: input.journeyTitle,
    country: input.country,
    author: input.author,
  }));
  const withoutPrior = state.media.filter((m) => m.journeyStoryId !== input.journeyStoryId);
  const merged = [...incoming, ...withoutPrior].sort(
    (a, b) => Date.parse(b.uploadDate) - Date.parse(a.uploadDate),
  );
  // Keep non-journey media and refreshed journey set
  void existingIds;
  state = { ...state, media: merged };
  emit();
}

export function addJourneyStoryToNewsletter(journeyStoryId: string, newsletterId?: string) {
  const target =
    state.newsletters.find((n) => n.id === newsletterId) ??
    state.newsletters.find((n) => n.status === "draft") ??
    state.newsletters[0];
  if (!target) return null;
  const ids = new Set(target.selectedJourneyStoryIds ?? []);
  ids.add(journeyStoryId);
  const next: StoriesNewsletter = {
    ...target,
    selectedJourneyStoryIds: [...ids],
    updatedAt: nowIso(),
  };
  state = {
    ...state,
    newsletters: state.newsletters.map((n) => (n.id === next.id ? next : n)),
  };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonNewsletter }) =>
    syncTalantonNewsletter(next),
  );
  return next;
}

export function upsertNewsletter(input: Omit<StoriesNewsletter, "createdAt" | "updatedAt"> & { createdAt?: string }) {
  const existing = state.newsletters.find((n) => n.id === input.id);
  const next: StoriesNewsletter = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
    updatedAt: nowIso(),
  };
  state = {
    ...state,
    newsletters: existing
      ? state.newsletters.map((n) => (n.id === next.id ? next : n))
      : [next, ...state.newsletters],
  };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonNewsletter }) =>
    syncTalantonNewsletter(next),
  );
  return next;
}

export function sendNewsletterNow(id: string) {
  const item = state.newsletters.find((n) => n.id === id);
  if (!item) return null;
  const next = { ...item, status: "sent" as const, sentAt: nowIso(), scheduledAt: null, updatedAt: nowIso() };
  state = { ...state, newsletters: state.newsletters.map((n) => (n.id === id ? next : n)) };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonNewsletter }) =>
    syncTalantonNewsletter(next),
  );
  return next;
}

export function deleteNewsletter(id: string) {
  state = { ...state, newsletters: state.newsletters.filter((n) => n.id !== id) };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ deleteTalantonNewsletter }) =>
    deleteTalantonNewsletter(id),
  );
}

export function addMailingContact(contact: Omit<MailingContact, "id"> & { id?: string }) {
  const next: MailingContact = {
    id: contact.id ?? `ml-${Math.random().toString(36).slice(2, 9)}`,
    name: contact.name,
    organisation: contact.organisation,
    email: contact.email,
    segment: contact.segment,
  };
  state = { ...state, contacts: [next, ...state.contacts] };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonMailingContact }) =>
    syncTalantonMailingContact(next),
  );
  return next;
}

export function updateMailingContact(id: string, patch: Partial<Omit<MailingContact, "id">>) {
  const existing = state.contacts.find((c) => c.id === id);
  if (!existing) return;
  const next = { ...existing, ...patch };
  state = {
    ...state,
    contacts: state.contacts.map((c) => (c.id === id ? next : c)),
  };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonMailingContact }) =>
    syncTalantonMailingContact(next),
  );
}

export function deleteMailingContact(id: string) {
  state = { ...state, contacts: state.contacts.filter((c) => c.id !== id) };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ deleteTalantonMailingContact }) =>
    deleteTalantonMailingContact(id),
  );
}

export function upsertMailingCampaign(
  input: Omit<MailingCampaign, "createdAt"> & { createdAt?: string },
) {
  const existing = state.campaigns.find((c) => c.id === input.id);
  const next: MailingCampaign = {
    ...input,
    createdAt: existing?.createdAt ?? input.createdAt ?? nowIso(),
  };
  state = {
    ...state,
    campaigns: existing
      ? state.campaigns.map((c) => (c.id === next.id ? next : c))
      : [next, ...state.campaigns],
  };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonMailingCampaign }) =>
    syncTalantonMailingCampaign(next),
  );
  return next;
}

export function sendMailingCampaignNow(id: string) {
  const item = state.campaigns.find((c) => c.id === id);
  if (!item) return null;
  const next = { ...item, status: "sent" as const, sentAt: nowIso(), scheduledAt: null };
  state = { ...state, campaigns: state.campaigns.map((c) => (c.id === id ? next : c)) };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ syncTalantonMailingCampaign }) =>
    syncTalantonMailingCampaign(next),
  );
  return next;
}

export function deleteMailingCampaign(id: string) {
  state = { ...state, campaigns: state.campaigns.filter((c) => c.id !== id) };
  emit();
  void import("@/lib/marketing/client/talanton-central-sync").then(({ deleteTalantonMailingCampaign }) =>
    deleteTalantonMailingCampaign(id),
  );
}

export const IMPACT_CATEGORIES: ImpactCategory[] = [
  "Jobs & Livelihoods",
  "Women & Youth",
  "Community Development",
  "Climate & Environment",
  "Financial Inclusion",
  "Health & Wellbeing",
  "Faith & Dignity of Work",
];

export const STORY_STATUSES: StoryStatus[] = [
  "Draft",
  "Submitted",
  "Under Review",
  "Approved",
  "Published",
];

/** Ensure company ids in seeds resolve (dev sanity). */
export function assertStoryCompaniesExist() {
  for (const s of SEED_STORIES) {
    if (!company(s.companyId)) {
      console.warn(`[marketing-stories] unknown company ${s.companyId} for ${s.id}`);
    }
  }
}
