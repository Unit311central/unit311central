import type { SocialWorkspacePackId } from "@/lib/marketing/permissions";

export type SocialSeoKeyword = {
  keyword: string;
  position: number;
  change: number;
  volume: string;
};

export type SocialPpcCampaign = {
  name: string;
  spend: string;
  clicks: number | string;
  ctr?: string;
  cpc?: string;
  conversions: number | string;
};

export type SocialPpcSummary = {
  spend: string;
  impressions: string;
  clicks: number | string;
  avgCpc: string;
  conversions: number | string;
  roas: string;
};

export type SocialWorkspaceSeoPack = {
  domain: string;
  avgPosition: string;
  top10: string;
  visibility: string;
  keywords: SocialSeoKeyword[];
  ppcCampaigns: SocialPpcCampaign[];
  ppcSummary: SocialPpcSummary;
};

const INTERNAL_PACK: SocialWorkspaceSeoPack = {
  domain: "unit311.com",
  avgPosition: "9.5",
  top10: "3 keywords",
  visibility: "+12%",
  keywords: [
    { keyword: "drone surveying barcelona", position: 4, change: 2, volume: "1.2K" },
    { keyword: "aerial inspection catalonia", position: 7, change: -1, volume: "880" },
    { keyword: "matrice 4t training spain", position: 11, change: 3, volume: "640" },
    { keyword: "orthomosaic drone services", position: 15, change: 0, volume: "520" },
    { keyword: "unit311", position: 1, change: 0, volume: "390" },
    { keyword: "thermal drone inspection port", position: 19, change: 4, volume: "310" },
  ],
  ppcCampaigns: [
    { name: "Survey leads — ES", spend: "€842", clicks: 312, ctr: "3.8%", cpc: "€2.70", conversions: 14 },
    { name: "Training courses", spend: "€516", clicks: 198, ctr: "4.1%", cpc: "€2.61", conversions: 9 },
    { name: "Inspection — retarget", spend: "€284", clicks: 94, ctr: "2.2%", cpc: "€3.02", conversions: 5 },
  ],
  ppcSummary: {
    spend: "€1,642",
    impressions: "28.4K",
    clicks: 604,
    avgCpc: "€2.72",
    conversions: 28,
    roas: "4.2x",
  },
};

const DEMO_PACK: SocialWorkspaceSeoPack = {
  domain: "northstar.demo",
  avgPosition: "7.5",
  top10: "4 keywords",
  visibility: "+18%",
  keywords: [
    { keyword: "industrial iot monitoring uk", position: 3, change: 1, volume: "2.4K" },
    { keyword: "edge controller manufacturing", position: 6, change: 2, volume: "1.1K" },
    { keyword: "northstar industrial technologies", position: 1, change: 0, volume: "720" },
    { keyword: "predictive maintenance sme", position: 8, change: -1, volume: "980" },
    { keyword: "ot remote monitoring platform", position: 12, change: 3, volume: "640" },
    { keyword: "factory telemetry dashboard", position: 15, change: 1, volume: "410" },
  ],
  ppcCampaigns: [
    { name: "IoT monitoring — UK", spend: "£1,240", clicks: 418, ctr: "4.4%", cpc: "£2.97", conversions: 22 },
    { name: "Manufacturing webinars", spend: "£680", clicks: 255, ctr: "3.9%", cpc: "£2.67", conversions: 14 },
    { name: "Retarget — case studies", spend: "£390", clicks: 128, ctr: "2.8%", cpc: "£3.05", conversions: 8 },
  ],
  ppcSummary: {
    spend: "£2,310",
    impressions: "41.2K",
    clicks: 801,
    avgCpc: "£2.88",
    conversions: 44,
    roas: "5.1x",
  },
};

const TALANTON_PACK: SocialWorkspaceSeoPack = {
  domain: "talantonimpact.com",
  avgPosition: "7.0",
  top10: "4 keywords",
  visibility: "+16%",
  keywords: [
    { keyword: "impact investing east africa", position: 5, change: 2, volume: "1.8K" },
    { keyword: "faith driven investing africa", position: 3, change: 1, volume: "920" },
    { keyword: "missing middle capital africa", position: 8, change: 3, volume: "740" },
    { keyword: "talanton impact", position: 1, change: 0, volume: "510" },
    { keyword: "job creation impact fund", position: 11, change: -1, volume: "680" },
    { keyword: "sme growth capital kenya", position: 14, change: 2, volume: "430" },
  ],
  ppcCampaigns: [
    { name: "LP awareness — Impact Fund", spend: "$1,180", clicks: 286, ctr: "3.6%", cpc: "$4.13", conversions: 12 },
    { name: "Faith-driven investor webinars", spend: "$740", clicks: 194, ctr: "4.2%", cpc: "$3.81", conversions: 9 },
    { name: "Portfolio stories — retarget", spend: "$420", clicks: 108, ctr: "2.9%", cpc: "$3.89", conversions: 6 },
  ],
  ppcSummary: {
    spend: "$2,340",
    impressions: "36.8K",
    clicks: 588,
    avgCpc: "$3.98",
    conversions: 27,
    roas: "4.8x",
  },
};

const ABHI_PACK: SocialWorkspaceSeoPack = {
  ...INTERNAL_PACK,
  domain: "abhi.org.uk",
};

const ONWARDAIR_PACK: SocialWorkspaceSeoPack = {
  ...INTERNAL_PACK,
  domain: "onwardair.com",
};

export function getSocialWorkspaceSeoConfig(packId: SocialWorkspacePackId): SocialWorkspaceSeoPack {
  switch (packId) {
    case "talanton":
      return TALANTON_PACK;
    case "demo":
      return DEMO_PACK;
    case "abhi":
      return ABHI_PACK;
    case "onwardair":
      return ONWARDAIR_PACK;
    case "internal":
    default:
      return INTERNAL_PACK;
  }
}
