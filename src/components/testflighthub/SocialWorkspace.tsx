"use client";

import { useEffect, useRef, useState } from "react";

import { ABHI_LINKEDIN_URL, ABHI_X_URL, isBrowserAbhiSurface } from "@/lib/abhi-surface";
import { isBrowserTalantonImpactSurface } from "@/lib/talanton-surface";
import { cn } from "@/lib/utils";
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  Eye,
  Heart,
  ImagePlus,
  MessageCircle,
  MousePointerClick,
  PenLine,
  Repeat2,
  Search,
  Send,
  Share2,
  Target,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

type PostMode = "create" | "schedule";
type ComposerStep = "compose" | "preview";

type PostStat = {
  label: string;
  value: string;
  icon: React.ReactNode;
};

type LastPost = {
  date: string;
  preview: string;
  stats: PostStat[];
};

type PlatformConfig = {
  id: "linkedin" | "instagram" | "twitter";
  name: string;
  handle: string;
  /** External profile URL — when set, the handle links out instead of being static text. */
  href?: string;
  /** Display name shown on the mocked post preview card. */
  displayName: string;
  /** "wide" mimics a LinkedIn/X feed post; "square" mimics an Instagram grid post. */
  layout: "wide" | "square";
  avatarLabel: string;
  avatarClassName: string;
  accent: string;
  accentBorder: string;
  icon: React.ReactNode;
  lastPost: LastPost;
};

const INTERNAL_PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "@bcndrone",
    displayName: "BCN Drone",
    layout: "wide",
    avatarLabel: "BC",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "12 Mar 2026 · 09:15",
      preview:
        "Precision aerial surveying across Catalonia — Matrice 4T fleet delivering orthomosaics and DSM layers for infrastructure clients.",
      stats: [
        { label: "Impressions", value: "4.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "86", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "14", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "9", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@bcndrone",
    displayName: "@bcndrone",
    layout: "square",
    avatarLabel: "IG",
    avatarClassName: "rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "10 Mar 2026 · 18:40",
      preview:
        "Golden hour over the port — FPV reel from this week's coastal inspection mission. Full case study on the blog.",
      stats: [
        { label: "Reach", value: "6.8K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "312", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "28", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "47", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const DEMO_PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "@meridianatlas",
    displayName: "Meridian Atlas",
    layout: "wide",
    avatarLabel: "MA",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "18 Jul 2026 · 10:05",
      preview:
        "How Meridian Atlas helps global enterprises modernise cloud estates and operating models — new case study from our London practice.",
      stats: [
        { label: "Impressions", value: "9.1K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "214", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "31", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "22", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@meridianatlas",
    displayName: "@meridianatlas",
    layout: "square",
    avatarLabel: "IG",
    avatarClassName: "rounded-full bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold",
    accent: "from-fuchsia-500/20 via-pink-500/15 to-amber-500/10",
    accentBorder: "border-pink-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-fuchsia-500 via-pink-500 to-amber-400 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "14 Jul 2026 · 16:20",
      preview:
        "Behind the scenes at Bishopsgate — strategy workshop with our APAC leadership cohort.",
      stats: [
        { label: "Reach", value: "5.4K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "268", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "19", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "41", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const ABHI_PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "ABHI",
    href: ABHI_LINKEDIN_URL,
    displayName: "ABHI",
    layout: "wide",
    avatarLabel: "AB",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "22 Jul 2026 · 11:00",
      preview:
        "ABHI members are heading to WHX Dubai 2027 — early bird registration is now open for the UK pavilion.",
      stats: [
        { label: "Impressions", value: "7.6K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "164", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "21", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "18", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "twitter",
    name: "X (Twitter)",
    handle: "@UK_ABHI",
    href: ABHI_X_URL,
    displayName: "ABHI",
    layout: "wide",
    avatarLabel: "X",
    avatarClassName: "rounded-full border border-white/15 bg-black text-sm font-bold",
    accent: "from-white/15 to-white/5",
    accentBorder: "border-white/25",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
        X
      </span>
    ),
    lastPost: {
      date: "19 Jul 2026 · 09:30",
      preview:
        "350 member companies and counting — thank you to everyone driving UK HealthTech growth this year. 🚀",
      stats: [
        { label: "Impressions", value: "5.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "98", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Replies", value: "12", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "27", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const TALANTON_PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "Talanton Impact",
    href: "https://www.linkedin.com/company/talantonimpact",
    displayName: "Talanton Impact",
    layout: "wide",
    avatarLabel: "TI",
    avatarClassName: "rounded-full border border-white/15 bg-[#0A66C2]/80 text-xs font-bold",
    accent: "from-[#0A66C2]/20 to-[#0A66C2]/5",
    accentBorder: "border-[#0A66C2]/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "28 Jul 2026 · 09:40",
      preview:
        "Across our African portfolio, jobs created and people served remain the north star — Impact Health holds steady as we prepare the August board pack.",
      stats: [
        { label: "Impressions", value: "5.1K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "128", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "19", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "11", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

const ONWARDAIR_PLATFORMS: PlatformConfig[] = [
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "OnwardAir",
    href: "https://www.linkedin.com/company/onwardair",
    displayName: "OnwardAir",
    layout: "wide",
    avatarLabel: "OA",
    avatarClassName: "rounded-full border border-sky-400/40 bg-sky-500/30 text-xs font-bold",
    accent: "from-sky-500/20 to-cyan-500/5",
    accentBorder: "border-sky-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-[#0A66C2] text-[10px] font-bold text-white">
        in
      </span>
    ),
    lastPost: {
      date: "29 Jul 2026 · 14:10",
      preview:
        "Another FAA interaction cycle complete — next stop: investor day in Austin and dual-source battery pack acceptance tests.",
      stats: [
        { label: "Impressions", value: "11.2K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Reactions", value: "326", icon: <ThumbsUp className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "41", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "28", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "instagram",
    name: "Instagram",
    handle: "@onwardair",
    displayName: "@onwardair",
    layout: "square",
    avatarLabel: "OA",
    avatarClassName:
      "rounded-full bg-gradient-to-br from-sky-400 via-cyan-500 to-indigo-500 text-[10px] font-bold",
    accent: "from-sky-500/20 via-cyan-500/15 to-indigo-500/10",
    accentBorder: "border-cyan-400/35",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-gradient-to-br from-sky-400 via-cyan-500 to-indigo-500 text-[10px] font-bold text-white">
        IG
      </span>
    ),
    lastPost: {
      date: "26 Jul 2026 · 17:45",
      preview:
        "Golden-hour taxi tests on the flight campus — certification cameras rolling. Full reel in stories.",
      stats: [
        { label: "Reach", value: "18.6K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "1.1K", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Comments", value: "64", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Saves", value: "89", icon: <Share2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
  {
    id: "twitter",
    name: "X",
    handle: "@OnwardAir",
    displayName: "OnwardAir",
    layout: "wide",
    avatarLabel: "X",
    avatarClassName: "rounded-full border border-white/20 bg-black text-xs font-bold",
    accent: "from-white/10 to-white/5",
    accentBorder: "border-white/20",
    icon: (
      <span className="flex h-5 w-5 items-center justify-center rounded-sm bg-black text-[10px] font-bold text-white">
        𝕏
      </span>
    ),
    lastPost: {
      date: "30 Jul 2026 · 09:05",
      preview:
        "Vertiport partnership talks advancing in Dallas & Phoenix. Quiet skies, dense networks — city-first design.",
      stats: [
        { label: "Impressions", value: "7.8K", icon: <Eye className="h-3.5 w-3.5" /> },
        { label: "Likes", value: "194", icon: <Heart className="h-3.5 w-3.5" /> },
        { label: "Replies", value: "22", icon: <MessageCircle className="h-3.5 w-3.5" /> },
        { label: "Reposts", value: "37", icon: <Repeat2 className="h-3.5 w-3.5" /> },
      ],
    },
  },
];

function resolveSocialPlatforms(): PlatformConfig[] {
  if (typeof window === "undefined") return INTERNAL_PLATFORMS;
  if (isBrowserAbhiSurface()) return ABHI_PLATFORMS;
  if (isBrowserTalantonImpactSurface()) return TALANTON_PLATFORMS;
  try {
    const { isBrowserOnwardAirSurface } =
      require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
    if (isBrowserOnwardAirSurface()) return ONWARDAIR_PLATFORMS;
  } catch {
    // fall through
  }
  try {
    const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    if (isBrowserDemoSurface()) return DEMO_PLATFORMS;
  } catch {
    // fall through
  }
  return INTERNAL_PLATFORMS;
}

const INTERNAL_SEO_KEYWORDS = [
  { keyword: "drone surveying barcelona", position: 4, change: 2, volume: "1.2K" },
  { keyword: "aerial inspection catalonia", position: 7, change: -1, volume: "880" },
  { keyword: "matrice 4t training spain", position: 11, change: 3, volume: "640" },
  { keyword: "orthomosaic drone services", position: 15, change: 0, volume: "520" },
  { keyword: "unit311", position: 1, change: 0, volume: "390" },
  { keyword: "thermal drone inspection port", position: 19, change: 4, volume: "310" },
] as const;

const DEMO_SEO_KEYWORDS = [
  { keyword: "enterprise cloud consulting", position: 3, change: 1, volume: "2.4K" },
  { keyword: "operating model transformation", position: 6, change: 2, volume: "1.1K" },
  { keyword: "meridian atlas group", position: 1, change: 0, volume: "720" },
  { keyword: "platform modernisation uk", position: 8, change: -1, volume: "980" },
  { keyword: "sap s4 migration partner", position: 12, change: 3, volume: "640" },
  { keyword: "board pack automation", position: 15, change: 1, volume: "410" },
] as const;

const TALANTON_SEO_KEYWORDS = [
  { keyword: "impact investing east africa", position: 5, change: 2, volume: "1.8K" },
  { keyword: "faith driven investing africa", position: 3, change: 1, volume: "920" },
  { keyword: "missing middle capital africa", position: 8, change: 3, volume: "740" },
  { keyword: "talanton impact", position: 1, change: 0, volume: "510" },
  { keyword: "job creation impact fund", position: 11, change: -1, volume: "680" },
  { keyword: "sme growth capital kenya", position: 14, change: 2, volume: "430" },
] as const;

const INTERNAL_PPC_CAMPAIGNS = [
  { name: "Survey leads — ES", spend: "€842", clicks: 312, ctr: "3.8%", cpc: "€2.70", conversions: 14 },
  { name: "Training courses", spend: "€516", clicks: 198, ctr: "4.1%", cpc: "€2.61", conversions: 9 },
  { name: "Inspection — retarget", spend: "€284", clicks: 94, ctr: "2.2%", cpc: "€3.02", conversions: 5 },
] as const;

const DEMO_PPC_CAMPAIGNS = [
  { name: "Cloud advisory — UK", spend: "£1,240", clicks: 418, ctr: "4.4%", cpc: "£2.97", conversions: 22 },
  { name: "Transformation webinars", spend: "£680", clicks: 255, ctr: "3.9%", cpc: "£2.67", conversions: 14 },
  { name: "Retarget — case studies", spend: "£390", clicks: 128, ctr: "2.8%", cpc: "£3.05", conversions: 8 },
] as const;

const TALANTON_PPC_CAMPAIGNS = [
  { name: "LP awareness — Impact Fund", spend: "$1,180", clicks: 286, ctr: "3.6%", cpc: "$4.13", conversions: 12 },
  { name: "Faith-driven investor webinars", spend: "$740", clicks: 194, ctr: "4.2%", cpc: "$3.81", conversions: 9 },
  { name: "Portfolio stories — retarget", spend: "$420", clicks: 108, ctr: "2.9%", cpc: "$3.89", conversions: 6 },
] as const;

const INTERNAL_PPC_SUMMARY = {
  spend: "€1,642",
  impressions: "28.4K",
  clicks: 604,
  avgCpc: "€2.72",
  conversions: 28,
  roas: "4.2x",
} as const;

const DEMO_PPC_SUMMARY = {
  spend: "£2,310",
  impressions: "41.2K",
  clicks: 801,
  avgCpc: "£2.88",
  conversions: 44,
  roas: "5.1x",
} as const;

const TALANTON_PPC_SUMMARY = {
  spend: "$2,340",
  impressions: "36.8K",
  clicks: 588,
  avgCpc: "$3.98",
  conversions: 27,
  roas: "4.6x",
} as const;

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-[10px] font-medium uppercase tracking-[0.12em] text-white/45">
      {children}
    </label>
  );
}

function inputClassName() {
  return "mt-1.5 w-full rounded-xl border border-white/10 bg-[#0b1524] px-3 py-2 text-sm text-white outline-none transition-colors focus:border-sky-400/50 placeholder:text-white/30";
}

function panelShellClassName() {
  return "overflow-hidden rounded-2xl border border-white/15 bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl";
}

function isDemoSocialSurface() {
  if (typeof window === "undefined") return false;
  try {
    const { isBrowserDemoSurface } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
    return isBrowserDemoSurface();
  } catch {
    return false;
  }
}

function SeoRankingsPanel() {
  const isDemo = isDemoSocialSurface();
  const isTalanton = typeof window !== "undefined" && isBrowserTalantonImpactSurface();
  const keywords = isTalanton
    ? TALANTON_SEO_KEYWORDS
    : isDemo
      ? DEMO_SEO_KEYWORDS
      : INTERNAL_SEO_KEYWORDS;
  const domain = isTalanton
    ? "talantonimpact.com"
    : isDemo
      ? "meridianatlas.demo"
      : "unit311.com";
  const avgPosition = isTalanton ? "7.0" : isDemo ? "7.5" : "9.5";
  const top10 = isTalanton ? "4 keywords" : isDemo ? "4 keywords" : "3 keywords";
  const visibility = isTalanton ? "+16%" : isDemo ? "+18%" : "+12%";

  return (
    <article className={panelShellClassName()}>
      <div className="border-b border-white/10 bg-gradient-to-r from-emerald-500/15 to-teal-500/5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-200">
            <Search className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">SEO rankings</h3>
            <p className="text-xs text-white/50">Google positions · {domain}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 border-b border-white/10 p-4 sm:p-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Avg. position</p>
          <p className="mt-1 text-lg font-semibold text-white">{avgPosition}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Top 10</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">{top10}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Visibility</p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-white">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            {visibility}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Tracked keywords
        </p>
        <ul className="mt-3 space-y-2">
          {keywords.map((row) => {
            const improved = row.change > 0;
            const declined = row.change < 0;

            return (
              <li
                key={row.keyword}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-white/85">{row.keyword}</p>
                  <p className="text-[10px] text-white/40">{row.volume} monthly searches</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-white">#{row.position}</p>
                  <p
                    className={cn(
                      "flex items-center justify-end gap-0.5 text-[10px] font-medium",
                      improved
                        ? "text-emerald-300"
                        : declined
                          ? "text-rose-300"
                          : "text-white/40",
                    )}
                  >
                    {improved ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : declined ? (
                      <ArrowDownRight className="h-3 w-3" />
                    ) : null}
                    {row.change === 0 ? "—" : `${Math.abs(row.change)} pos`}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-4 text-center text-[11px] text-white/35">
          Mock SEO data — connect Search Console for live rankings.
        </p>
      </div>
    </article>
  );
}

function PpcStatsPanel() {
  const isDemo = isDemoSocialSurface();
  const isTalanton = typeof window !== "undefined" && isBrowserTalantonImpactSurface();
  const summary = isTalanton
    ? TALANTON_PPC_SUMMARY
    : isDemo
      ? DEMO_PPC_SUMMARY
      : INTERNAL_PPC_SUMMARY;
  const campaigns = isTalanton
    ? TALANTON_PPC_CAMPAIGNS
    : isDemo
      ? DEMO_PPC_CAMPAIGNS
      : INTERNAL_PPC_CAMPAIGNS;
  return (
    <article className={panelShellClassName()}>
      <div className="border-b border-white/10 bg-gradient-to-r from-amber-500/15 to-orange-500/5 px-4 py-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-400/30 bg-amber-500/10 text-amber-200">
            <MousePointerClick className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">Pay per click</h3>
            <p className="text-xs text-white/50">Google Ads · last 30 days</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 border-b border-white/10 p-4 sm:grid-cols-3 sm:p-5">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Spend</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.spend}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Clicks</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.clicks}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Avg. CPC</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.avgCpc}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Impressions</p>
          <p className="mt-1 text-lg font-semibold text-white">{summary.impressions}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">Conversions</p>
          <p className="mt-1 text-lg font-semibold text-emerald-300">{summary.conversions}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-white/40">ROAS</p>
          <p className="mt-1 flex items-center gap-1 text-lg font-semibold text-white">
            <Target className="h-4 w-4 text-amber-300" />
            {summary.roas}
          </p>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Active campaigns
        </p>
        <ul className="mt-3 space-y-2">
          {campaigns.map((campaign) => (
            <li
              key={campaign.name}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-white">{campaign.name}</p>
                <p className="text-sm font-semibold text-white">{campaign.spend}</p>
              </div>
              <div className="mt-2 grid grid-cols-4 gap-2 text-[10px] text-white/45">
                <span>{campaign.clicks} clicks</span>
                <span>{campaign.ctr} CTR</span>
                <span>{campaign.cpc} CPC</span>
                <span className="text-emerald-300/90">{campaign.conversions} conv.</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-center text-[11px] text-white/35">
          Mock PPC data — connect Google Ads for live stats.
        </p>
      </div>
    </article>
  );
}

function LastPostCard({ platform }: { platform: PlatformConfig }) {
  return (
    <div className="border-t border-white/10 bg-black/20 p-4 sm:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
        Last post
      </p>
      <p className="mt-1 text-xs text-white/45">{platform.lastPost.date}</p>
      <p className="mt-2 text-sm leading-relaxed text-white/75">{platform.lastPost.preview}</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {platform.lastPost.stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-2.5 py-2"
          >
            <div className="flex items-center gap-1.5 text-white/40">
              {stat.icon}
              <span className="text-[10px] uppercase tracking-wide">{stat.label}</span>
            </div>
            <p className="mt-1 text-base font-semibold text-white">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function formatScheduleLabel(date: string, time: string) {
  if (!date) return null;
  try {
    const iso = `${date}T${time || "09:00"}:00`;
    const parsed = new Date(iso);
    if (Number.isNaN(parsed.getTime())) return `${date} · ${time || "09:00"}`;
    return parsed.toLocaleString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return `${date} · ${time || "09:00"}`;
  }
}

function PostPreviewCard({
  platform,
  text,
  imageUrl,
  imageName,
  mode,
  scheduleDate,
  scheduleTime,
}: {
  platform: PlatformConfig;
  text: string;
  imageUrl: string | null;
  imageName: string | null;
  mode: PostMode;
  scheduleDate: string;
  scheduleTime: string;
}) {
  const scheduleLabel = mode === "schedule" ? formatScheduleLabel(scheduleDate, scheduleTime) : null;
  const isWide = platform.layout === "wide";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
          Preview · how it will look
        </p>
        {scheduleLabel ? (
          <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-100">
            Scheduled · {scheduleLabel}
          </span>
        ) : (
          <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-100">
            Publishing now
          </span>
        )}
      </div>

      <div
        className={cn(
          "overflow-hidden border border-white/12 bg-[#0b1524]",
          isWide ? "rounded-xl" : "rounded-2xl",
        )}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-3.5 py-3">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center text-white",
              platform.avatarClassName,
            )}
          >
            {platform.avatarLabel}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {isWide ? platform.displayName : platform.handle}
            </p>
            <p className="text-[11px] text-white/45">
              {isWide ? `${platform.handle} · Just now` : "Just now"}
            </p>
          </div>
          {platform.icon}
        </div>

        {!isWide && imageUrl ? (
          <div className="aspect-square w-full bg-black/40">
            <img src={imageUrl} alt={imageName ?? "Post image preview"} className="h-full w-full object-cover" />
          </div>
        ) : null}

        <div className="px-3.5 py-3">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/85">
            {text.trim() || "Your post text will appear here."}
          </p>
        </div>

        {isWide && imageUrl ? (
          <div className="border-t border-white/10 bg-black/30">
            <img
              src={imageUrl}
              alt={imageName ?? "Post image preview"}
              className="max-h-64 w-full object-cover"
            />
          </div>
        ) : null}

        {!imageUrl && imageName ? (
          <div className="border-t border-white/10 px-3.5 py-2 text-[11px] text-white/40">
            Image attached: {imageName}
          </div>
        ) : null}

        <div className="flex items-center gap-4 border-t border-white/10 px-3.5 py-2.5 text-white/35">
          {isWide ? (
            <>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <ThumbsUp className="h-3.5 w-3.5" /> Like
              </span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <MessageCircle className="h-3.5 w-3.5" /> Comment
              </span>
              <span className="inline-flex items-center gap-1 text-[11px]">
                <Repeat2 className="h-3.5 w-3.5" /> Repost
              </span>
            </>
          ) : (
            <>
              <Heart className="h-4 w-4" />
              <MessageCircle className="h-4 w-4" />
              <Share2 className="h-4 w-4" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlatformColumn({ platform }: { platform: PlatformConfig }) {
  const [mode, setMode] = useState<PostMode>("create");
  const [step, setStep] = useState<ComposerStep>("compose");
  const [text, setText] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [imageName, setImageName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  function clearImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    setImageUrl(null);
    setImageName(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    if (!file) {
      setImageName(null);
      setImageUrl(null);
      return;
    }
    setImageName(file.name);
    setImageUrl(URL.createObjectURL(file));
  }

  function switchMode(next: PostMode) {
    setMode(next);
    setStep("compose");
    setStatusMessage(null);
  }

  function canPreview() {
    if (!text.trim()) return false;
    if (mode === "schedule" && !scheduleDate) return false;
    return true;
  }

  function confirmPost() {
    setStatusMessage(
      mode === "create"
        ? `Mock published to ${platform.name}.`
        : `Mock scheduled on ${platform.name} for ${formatScheduleLabel(scheduleDate, scheduleTime)}.`,
    );
    setText("");
    setScheduleDate("");
    setScheduleTime("09:00");
    clearImage();
    setStep("compose");
  }

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border bg-white/[0.04] shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-xl",
        platform.accentBorder,
      )}
    >
      <div
        className={cn(
          "border-b border-white/10 bg-gradient-to-r px-4 py-4 sm:px-5",
          platform.accent,
        )}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-black/30 text-white">
            {platform.icon}
          </div>
          <div>
            <h3 className="text-base font-semibold text-white sm:text-lg">{platform.name}</h3>
            {platform.href ? (
              <a
                href={platform.href}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-sky-300/90 hover:text-sky-200 hover:underline"
              >
                {platform.handle}
              </a>
            ) : (
              <p className="text-xs text-white/50">{platform.handle}</p>
            )}
          </div>
        </div>
      </div>

      <div className="border-b border-white/10 p-3 sm:p-4">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => switchMode("create")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
              mode === "create"
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/75",
            )}
          >
            <PenLine className="h-3.5 w-3.5 shrink-0" />
            Create new post
          </button>
          <button
            type="button"
            onClick={() => switchMode("schedule")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors sm:text-sm",
              mode === "schedule"
                ? "border-sky-400/40 bg-sky-500/15 text-sky-100"
                : "border-white/10 bg-white/[0.03] text-white/55 hover:border-white/20 hover:text-white/75",
            )}
          >
            <CalendarClock className="h-3.5 w-3.5 shrink-0" />
            Schedule new post
          </button>
        </div>
      </div>

      {step === "compose" ? (
        <form
          className="space-y-4 p-4 sm:p-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canPreview()) return;
            setStatusMessage(null);
            setStep("preview");
          }}
        >
          <div>
            <FieldLabel>Post text</FieldLabel>
            <textarea
              rows={5}
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={`What would you like to share on ${platform.name}?`}
              className={cn(inputClassName(), "resize-none")}
            />
          </div>

          <div>
            <FieldLabel>Add image</FieldLabel>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="mt-1.5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-[#0b1524]/60 px-4 py-8 text-center transition-colors hover:border-sky-400/40 hover:bg-[#0b1524]"
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={imageName ?? "Selected image"}
                  className="h-28 w-full rounded-lg object-cover"
                />
              ) : (
                <ImagePlus className="h-8 w-8 text-white/35" />
              )}
              <span className="text-sm font-medium text-white/70">
                {imageName ? imageName : "Click to upload an image"}
              </span>
              <span className="text-xs text-white/35">PNG, JPG up to 10 MB</span>
            </button>
            {imageName ? (
              <button
                type="button"
                onClick={clearImage}
                className="mt-2 text-xs text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
              >
                Remove image
              </button>
            ) : null}
          </div>

          {mode === "schedule" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <FieldLabel>Choose date</FieldLabel>
                <input
                  type="date"
                  value={scheduleDate}
                  onChange={(event) => setScheduleDate(event.target.value)}
                  className={inputClassName()}
                />
              </div>
              <div>
                <FieldLabel>Choose time</FieldLabel>
                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(event) => setScheduleTime(event.target.value)}
                  className={inputClassName()}
                />
              </div>
            </div>
          ) : null}

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8] disabled:opacity-50"
            disabled={!canPreview()}
          >
            <Eye className="h-4 w-4" />
            Preview post
          </button>

          {statusMessage ? (
            <p className="text-center text-[12px] text-emerald-300/90">{statusMessage}</p>
          ) : (
            <p className="text-center text-[11px] text-white/35">
              Preview your post before publishing to {platform.name}.
            </p>
          )}
        </form>
      ) : (
        <div className="space-y-4 p-4 sm:p-5">
          <PostPreviewCard
            platform={platform}
            text={text}
            imageUrl={imageUrl}
            imageName={imageName}
            mode={mode}
            scheduleDate={scheduleDate}
            scheduleTime={scheduleTime}
          />

          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setStep("compose")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/25 hover:bg-white/[0.07]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to edit
            </button>
            <button
              type="button"
              onClick={confirmPost}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#1d4ed8]"
            >
              {mode === "create" ? (
                <>
                  <Send className="h-4 w-4" />
                  Publish now
                </>
              ) : (
                <>
                  <CalendarClock className="h-4 w-4" />
                  Confirm schedule
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[11px] text-white/35">
            Mockup only — posts are not published to {platform.name}.
          </p>
        </div>
      )}

      <LastPostCard platform={platform} />
    </article>
  );
}

export default function SocialWorkspace() {
  const platforms = resolveSocialPlatforms();
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        {platforms.map((platform) => (
          <PlatformColumn key={platform.id} platform={platform} />
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
        <SeoRankingsPanel />
        <PpcStatsPanel />
      </div>
    </div>
  );
}
