/**
 * Opportunity Intelligence — faith-driven impact investing pipeline for Talanton.
 * Executive fixtures for Sub-Saharan Africa sourcing (not CRM / deal-room records).
 */

export type OpportunityBand = "Strong" | "Healthy" | "Watch" | "Thin";
export type SectorTrend = "Accelerating" | "Steady" | "Cooling";
export type Rating = "High" | "Medium" | "Selective";

export type PotentialPortfolioCompany = {
  id: string;
  companyName: string;
  country: string;
  sector: string;
  opportunityScore: number;
  impactPotential: Rating;
  investmentAttractiveness: Rating;
  stageHint: string;
  thesisFit: string;
  aiCommentary: string;
  cardText: string;
};

export type SectorIntelligence = {
  id: string;
  sector: string;
  trend: SectorTrend;
  opportunityRating: Rating;
  growthOutlook: string;
  commentary: string;
  cardText: string;
};

export type RegionalIntelligence = {
  id: string;
  region: string;
  economicOutlook: string;
  opportunityRating: Rating;
  aiCommentary: string;
  cardText: string;
};

export type StrategicOpportunity = {
  id: string;
  category: string;
  title: string;
  detail: string;
  urgency: "This week" | "This month" | "This quarter";
  owner: string;
  cardText: string;
};

export type OpportunityRecommendedAction = {
  id: string;
  title: string;
  rationale: string;
  owner: string;
  urgency: "Today" | "This week" | "This month";
  cardText: string;
};

export type OpportunityHealth = {
  score: number | null;
  scoreUnavailable: boolean;
  band: OpportunityBand | "Unavailable";
  postureReason: string;
  healthText: string;
  pipelineDepth: number | null;
  highConviction: number | null;
  sectorsCovered: number | null;
  regionsCovered: number | null;
};

export type OpportunityBriefing = {
  asOf: string;
  preparedFor: string;
  health: OpportunityHealth;
  emergingOpportunities: string[];
  sectorDevelopments: string[];
  regionalDevelopments: string[];
  strategicOpportunitiesNarrative: string[];
  risksAndChallenges: string[];
  recommendedInvestigations: string[];
  potentialCompanies: PotentialPortfolioCompany[];
  sectors: SectorIntelligence[];
  regions: RegionalIntelligence[];
  strategic: StrategicOpportunity[];
  recommendedActions: OpportunityRecommendedAction[];
  briefingText: string;
  healthSummaryText: string;
  pipelineText: string;
  sectorsText: string;
  regionsText: string;
  strategicText: string;
  actionsText: string;
  /** No Supabase-backed opportunity/pipeline table exists in this workspace. */
  pipelineDataAvailable: boolean;
  pipelineUnavailableReason: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function ratingLabel(r: Rating) {
  return r;
}

const POTENTIAL_COMPANIES: Omit<PotentialPortfolioCompany, "cardText">[] = [
  {
    id: "opp-co-sunharvest",
    companyName: "SunHarvest Agro",
    country: "Zambia",
    sector: "Agriculture",
    opportunityScore: 88,
    impactPotential: "High",
    investmentAttractiveness: "High",
    stageHint: "Series A · offtake-backed",
    thesisFit: "Smallholder incomes · food security · faith-aligned rural enterprise",
    aiCommentary:
      "Zambian offtake model linking smallholder maize and soy to formal millers. Strong jobs and community reach potential; diligence should pressure-test working-capital cycle and FX exposure on inputs.",
  },
  {
    id: "opp-co-afyacare",
    companyName: "AfyaCare Diagnostics",
    country: "Kenya",
    sector: "Healthcare",
    opportunityScore: 85,
    impactPotential: "High",
    investmentAttractiveness: "Medium",
    stageHint: "Seed+ · clinic network",
    thesisFit: "Affordable diagnostics · women & youth employment in health services",
    aiCommentary:
      "Nairobi-anchored diagnostics expanding to secondary cities. Impact thesis is clear; investment case hinges on reimbursement mix and path to cash-flow break-even before next raise.",
  },
  {
    id: "opp-co-hustlepay",
    companyName: "HustlePay",
    country: "Uganda",
    sector: "Financial Inclusion",
    opportunityScore: 82,
    impactPotential: "High",
    investmentAttractiveness: "High",
    stageHint: "Series A · MSME credit",
    thesisFit: "MSME working capital · dignity of work · responsible credit",
    aiCommentary:
      "Asset-light credit for informal traders with church and savings-group distribution partners. Attractive for Talanton’s inclusion mandate; underwrite portfolio quality and collections discipline carefully.",
  },
  {
    id: "opp-co-learnbright",
    companyName: "LearnBright Africa",
    country: "Rwanda",
    sector: "Education",
    opportunityScore: 79,
    impactPotential: "High",
    investmentAttractiveness: "Selective",
    stageHint: "Seed · B2G + B2B",
    thesisFit: "Skills for youth employment · values-based education content",
    aiCommentary:
      "Kinyarwanda/English vocational content for TVET partners. High mission fit; unit economics depend on government and NGO contract concentration — investigate pipeline durability.",
  },
  {
    id: "opp-co-bodaenergy",
    companyName: "BodaEnergy Mobility",
    country: "Kenya",
    sector: "Mobility",
    opportunityScore: 81,
    impactPotential: "Medium",
    investmentAttractiveness: "High",
    stageHint: "Series A · EV battery swap",
    thesisFit: "Clean mobility · rider incomes · urban air quality",
    aiCommentary:
      "Battery-swap network for electric boda fleets in Nairobi and Kisumu. Complements ARC Ride learnings; diligence on battery lifecycle costs and rider take-home vs petrol baseline.",
  },
  {
    id: "opp-co-ghanaweave",
    companyName: "CoastWeave Apparel",
    country: "Ghana",
    sector: "Manufacturing",
    opportunityScore: 77,
    impactPotential: "High",
    investmentAttractiveness: "Medium",
    stageHint: "Growth · export light manufacturing",
    thesisFit: "Women’s employment · ethical apparel · AGOA / EU offtake",
    aiCommentary:
      "Accra-based cut-make-trim with strong female workforce share. Adjacent to Ethical Apparel Africa; explore co-investment vs competitive overlap and labour-standards readiness.",
  },
  {
    id: "opp-co-mwanzo",
    companyName: "Mwanzo Renewables",
    country: "Tanzania",
    sector: "Clean Energy",
    opportunityScore: 84,
    impactPotential: "High",
    investmentAttractiveness: "High",
    stageHint: "Series A · C&I solar",
    thesisFit: "Reliable power for SMEs · jobs · climate co-benefits",
    aiCommentary:
      "Commercial & industrial solar + storage for manufacturers around Dar and Arusha. Strong development-finance co-invest potential; map tariff and forex risks early.",
  },
  {
    id: "opp-co-ubuhinzi",
    companyName: "Ubuhinzi Fresh",
    country: "Rwanda",
    sector: "Agriculture",
    opportunityScore: 76,
    impactPotential: "High",
    investmentAttractiveness: "Selective",
    stageHint: "Seed · cold-chain horticulture",
    thesisFit: "Farmer incomes · nutrition · regional trade",
    aiCommentary:
      "Cold-chain for horticulture exports to Kenya/Uganda. Impact is compelling; capital intensity of cold storage requires patient structures — DFI blend may be required.",
  },
];

const SECTORS: Omit<SectorIntelligence, "cardText">[] = [
  {
    id: "sec-agri",
    sector: "Agriculture",
    trend: "Accelerating",
    opportunityRating: "High",
    growthOutlook: "Strong demand for climate-smart offtake, cold chain, and input finance across Zambia, Rwanda, and Uganda.",
    commentary:
      "Talanton’s existing agri holdings create pattern recognition for diligence. Prioritise offtake-backed models with measurable smallholder income lift.",
  },
  {
    id: "sec-health",
    sector: "Healthcare",
    trend: "Steady",
    opportunityRating: "High",
    growthOutlook: "Diagnostics, last-mile pharma distribution, and maternal health services remain under-served outside capitals.",
    commentary:
      "Mission alignment is high; underwrite reimbursement and regulatory pathways before cheque size. Kenya and Ghana show denser operator quality.",
  },
  {
    id: "sec-fin",
    sector: "Financial Inclusion",
    trend: "Accelerating",
    opportunityRating: "High",
    growthOutlook: "MSME credit and savings-group rails expanding; competition rising in Kenya, earlier stage in Uganda/Tanzania.",
    commentary:
      "Complement Pezesha learnings. Prefer responsible credit with clear consumer protection and church/community distribution that fits faith-driven posture.",
  },
  {
    id: "sec-edu",
    sector: "Education",
    trend: "Steady",
    opportunityRating: "Medium",
    growthOutlook: "TVET and employability platforms growing where governments and NGOs fund outcomes.",
    commentary:
      "High impact, selective returns. Pursue only where contracts are diversified and content reinforces dignity-of-work outcomes.",
  },
  {
    id: "sec-mob",
    sector: "Mobility",
    trend: "Accelerating",
    opportunityRating: "Medium",
    growthOutlook: "EV two/three-wheelers and logistics platforms scaling in Kenya; infrastructure and battery economics remain the hinge.",
    commentary:
      "Synergy with ARC Ride. Avoid pure hardware plays; prefer networks with recurring swap/usage revenue and rider income proof.",
  },
  {
    id: "sec-mfg",
    sector: "Manufacturing",
    trend: "Steady",
    opportunityRating: "Medium",
    growthOutlook: "Light manufacturing and import substitution supported by regional trade pacts; labour standards diligence is non-negotiable.",
    commentary:
      "Align with Ethical Apparel / Auto Springs experience. Women employment and export offtake are the impact anchors.",
  },
];

const REGIONS: Omit<RegionalIntelligence, "cardText">[] = [
  {
    id: "reg-ke",
    region: "Kenya",
    economicOutlook: "Diversified services and tech-enabled SMEs; FX and rate volatility remain watch items for 2026.",
    opportunityRating: "High",
    aiCommentary:
      "Deepest operator density for Talanton. Best for healthcare, fintech, and mobility follow-ons — but competition for quality deals is intense; move with conviction, not FOMO.",
  },
  {
    id: "reg-ug",
    region: "Uganda",
    economicOutlook: "Agriculture and MSME credit expanding; infrastructure and energy access constrain some manufacturing plays.",
    opportunityRating: "High",
    aiCommentary:
      "Attractive for financial inclusion and agri offtake. Relationship capital with Kampala ecosystems can unlock earlier-stage tickets with strong impact.",
  },
  {
    id: "reg-tz",
    region: "Tanzania",
    economicOutlook: "Industrialisation and C&I energy demand rising; deal flow thinner than Kenya but less crowded.",
    opportunityRating: "Medium",
    aiCommentary:
      "C&I solar and agri processing look promising. Diligence should emphasise local partnerships and patient capital structures.",
  },
  {
    id: "reg-rw",
    region: "Rwanda",
    economicOutlook: "Policy predictability and services growth; market size limits pure consumer scale stories.",
    opportunityRating: "Medium",
    aiCommentary:
      "Ideal for education, horticulture, and regional hub models. Prefer companies that can expand into EAC corridors.",
  },
  {
    id: "reg-zm",
    region: "Zambia",
    economicOutlook: "Agri and mining-adjacent services; macro stabilisation improving investment timing for offtake platforms.",
    opportunityRating: "High",
    aiCommentary:
      "SunHarvest-style agri offtake fits Talanton’s rural impact mandate. Pair commercial diligence with community livelihood metrics from day one.",
  },
  {
    id: "reg-gh",
    region: "Ghana",
    economicOutlook: "Manufacturing and health services opportunity with coastal trade links; currency management critical.",
    opportunityRating: "Medium",
    aiCommentary:
      "Ethical apparel and diagnostics adjacency is real. Underwrite FX and working capital tightly; leverage Accra networks for labour-standards diligence.",
  },
];

const STRATEGIC: Omit<StrategicOpportunity, "cardText">[] = [
  {
    id: "str-1",
    category: "Partnerships",
    title: "Faith-based distribution partnerships for MSME credit",
    detail:
      "Explore structured partnerships with church and savings-group networks in Uganda and Kenya to originate responsible credit while reinforcing dignity-of-work outcomes.",
    urgency: "This month",
    owner: "Harry Turner",
  },
  {
    id: "str-2",
    category: "Development Finance",
    title: "DFI co-invest for C&I solar in Tanzania",
    detail:
      "Blend Talanton equity with development finance for Mwanzo Renewables-class C&I solar to extend ticket size and de-risk infrastructure capital intensity.",
    urgency: "This quarter",
    owner: "Impact Director",
  },
  {
    id: "str-3",
    category: "Grant Opportunities",
    title: "Climate adaptation grants for smallholder offtake",
    detail:
      "Map grant windows that can fund farmer training and climate-smart practices alongside equity — improving impact additionality without diluting returns thesis.",
    urgency: "This month",
    owner: "Portfolio Ops",
  },
  {
    id: "str-4",
    category: "NGO Collaboration",
    title: "TVET / NGO content partnership for LearnBright",
    detail:
      "Pilot NGO-funded cohorts for youth skills programmes in Rwanda to validate education unit economics before a larger cheque.",
    urgency: "This quarter",
    owner: "Impact Director",
  },
  {
    id: "str-5",
    category: "Government Programmes",
    title: "Align manufacturing diligence with Ghana export incentives",
    detail:
      "Track AGOA / EU preferential trade windows relevant to CoastWeave and peer manufacturers; use as diligence input, not the sole investment thesis.",
    urgency: "This week",
    owner: "Portfolio Ops",
  },
];

function withCardTextCompanies(): PotentialPortfolioCompany[] {
  return POTENTIAL_COMPANIES.map((c) => ({
    ...c,
    cardText: [
      `${c.companyName} — Potential Portfolio Company`,
      `Country: ${c.country}`,
      `Sector: ${c.sector}`,
      `Opportunity score: ${c.opportunityScore}/100`,
      `Impact potential: ${ratingLabel(c.impactPotential)}`,
      `Investment attractiveness: ${ratingLabel(c.investmentAttractiveness)}`,
      `Stage: ${c.stageHint}`,
      `Thesis fit: ${c.thesisFit}`,
      "",
      "AI Commentary",
      c.aiCommentary,
    ].join("\n"),
  }));
}

function withCardTextSectors(): SectorIntelligence[] {
  return SECTORS.map((s) => ({
    ...s,
    cardText: [
      `Sector Intelligence — ${s.sector}`,
      `Trend: ${s.trend}`,
      `Opportunity rating: ${s.opportunityRating}`,
      `Growth outlook: ${s.growthOutlook}`,
      "",
      s.commentary,
    ].join("\n"),
  }));
}

function withCardTextRegions(): RegionalIntelligence[] {
  return REGIONS.map((r) => ({
    ...r,
    cardText: [
      `Regional Intelligence — ${r.region}`,
      `Opportunity rating: ${r.opportunityRating}`,
      `Economic outlook: ${r.economicOutlook}`,
      "",
      "AI Commentary",
      r.aiCommentary,
    ].join("\n"),
  }));
}

function withCardTextStrategic(): StrategicOpportunity[] {
  return STRATEGIC.map((s) => ({
    ...s,
    cardText: [
      `Strategic Opportunity — ${s.category}`,
      s.title,
      `Owner: ${s.owner}`,
      `Urgency: ${s.urgency}`,
      "",
      s.detail,
    ].join("\n"),
  }));
}

const PIPELINE_UNAVAILABLE_REASON =
  "No Supabase-backed opportunity or pipeline table is configured for Talanton Impact. Configured prospect fixtures are not shown as live intelligence.";

export function buildOpportunityBriefing(): OpportunityBriefing {
  const potentialCompanies: PotentialPortfolioCompany[] = [];
  const sectors: SectorIntelligence[] = [];
  const regions: RegionalIntelligence[] = [];
  const strategic: StrategicOpportunity[] = [];

  const health: OpportunityHealth = {
    score: null,
    scoreUnavailable: true,
    band: "Unavailable",
    postureReason: PIPELINE_UNAVAILABLE_REASON,
    healthText: [
      "Opportunity pipeline",
      "Data unavailable — no database-backed pipeline records.",
      PIPELINE_UNAVAILABLE_REASON,
    ].join("\n"),
    pipelineDepth: null,
    highConviction: null,
    sectorsCovered: null,
    regionsCovered: null,
  };

  const briefingText = [
    "Opportunity Executive Briefing — Talanton Impact",
    `As of ${todayIso()} · Prepared for Harry Turner / Talanton leadership`,
    "",
    PIPELINE_UNAVAILABLE_REASON,
  ].join("\n");

  return {
    asOf: todayIso(),
    preparedFor: "Harry Turner and Talanton leadership",
    health,
    emergingOpportunities: [],
    sectorDevelopments: [],
    regionalDevelopments: [],
    strategicOpportunitiesNarrative: [],
    risksAndChallenges: [],
    recommendedInvestigations: [],
    potentialCompanies,
    sectors,
    regions,
    strategic,
    recommendedActions: [],
    briefingText,
    healthSummaryText: health.healthText,
    pipelineText: "Potential Portfolio Companies\nData unavailable.",
    sectorsText: "Sector Intelligence\nData unavailable.",
    regionsText: "Regional Intelligence\nData unavailable.",
    strategicText: "Strategic Opportunities\nData unavailable.",
    actionsText: "Recommended Opportunity Actions\nData unavailable.",
    pipelineDataAvailable: false,
    pipelineUnavailableReason: PIPELINE_UNAVAILABLE_REASON,
  };
}
