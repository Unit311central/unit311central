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
  score: number;
  band: OpportunityBand;
  postureReason: string;
  healthText: string;
  pipelineDepth: number;
  highConviction: number;
  sectorsCovered: number;
  regionsCovered: number;
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

export function buildOpportunityBriefing(): OpportunityBriefing {
  const potentialCompanies = withCardTextCompanies().sort(
    (a, b) => b.opportunityScore - a.opportunityScore,
  );
  const sectors = withCardTextSectors();
  const regions = withCardTextRegions();
  const strategic = withCardTextStrategic();

  const highConviction = potentialCompanies.filter((c) => c.opportunityScore >= 82).length;
  const avgScore = Math.round(
    potentialCompanies.reduce((s, c) => s + c.opportunityScore, 0) / Math.max(potentialCompanies.length, 1),
  );

  const band: OpportunityBand =
    highConviction >= 4 && avgScore >= 80
      ? "Strong"
      : avgScore >= 75
        ? "Healthy"
        : avgScore >= 65
          ? "Watch"
          : "Thin";

  const health: OpportunityHealth = {
    score: avgScore,
    band,
    postureReason:
      band === "Strong"
        ? "Pipeline depth and conviction are healthy across agri, inclusion, healthcare, and energy — suitable for active IC investigation this quarter."
        : band === "Healthy"
          ? "Solid opportunity set aligned to Talanton’s faith-driven SSA mandate, with a few high-conviction names ready for deeper diligence."
          : band === "Watch"
            ? "Opportunity flow exists but conviction is uneven. Tighten sourcing filters before committing leadership time."
            : "Pipeline is too thin relative to Talanton’s deployment goals. Escalate ecosystem outreach and DFI partnership work.",
    healthText: "",
    pipelineDepth: potentialCompanies.length,
    highConviction,
    sectorsCovered: sectors.length,
    regionsCovered: regions.length,
  };
  health.healthText = [
    "Opportunity Health Score",
    `Score: ${health.score}/100 · ${health.band}`,
    health.postureReason,
    `Pipeline depth: ${health.pipelineDepth}`,
    `High-conviction (≥82): ${health.highConviction}`,
    `Sectors covered: ${health.sectorsCovered}`,
    `Regions covered: ${health.regionsCovered}`,
  ].join("\n");

  const emergingOpportunities = [
    `${potentialCompanies[0].companyName} (${potentialCompanies[0].country}) leads the pipeline at ${potentialCompanies[0].opportunityScore}/100 — ${potentialCompanies[0].thesisFit}.`,
    `${highConviction} names score ≥82 and warrant IC-level investigation before quarter end.`,
    "Agriculture offtake, MSME inclusion credit, and C&I solar remain the densest themes for faith-aligned impact with commercial realism.",
    "Manufacturing and education remain selective — pursue only where offtake or contracted revenue reduces binary risk.",
  ];

  const sectorDevelopments = [
    "Agriculture: climate-smart offtake and cold chain accelerating in Zambia and Rwanda.",
    "Financial inclusion: MSME credit expanding in Uganda with community-based distribution options.",
    "Healthcare: diagnostics and last-mile services steady in Kenya/Ghana; reimbursement diligence is the bottleneck.",
    "Mobility: EV battery networks in Kenya create adjacency to existing portfolio learning (ARC Ride).",
  ];

  const regionalDevelopments = [
    "Kenya remains the deepest market — compete on conviction and speed, not volume.",
    "Uganda and Zambia offer earlier-stage tickets with strong rural/MSME impact narratives.",
    "Tanzania C&I energy and Rwanda regional-hub models are less crowded but need patient structures.",
    "Ghana manufacturing adjacency should be diligenced against Ethical Apparel Africa overlap.",
  ];

  const strategicOpportunitiesNarrative = strategic.map(
    (s) => `${s.category}: ${s.title} (${s.owner}, ${s.urgency}).`,
  );

  const risksAndChallenges = [
    "FX and working-capital stress can erase paper returns in manufacturing and agri offtake — underwrite local currency cash flows.",
    "Crowded Kenya fintech/mobility markets risk adverse selection if Talanton chases momentum without thesis filters.",
    "Education and NGO-heavy models may over-index impact and under-deliver commercial sustainability.",
    "DFI processes can slow closes — start parallel conversations early on capital-intensive solar and cold-chain deals.",
  ];

  const recommendedInvestigations = [
    `Open IC memo workstreams on ${potentialCompanies
      .slice(0, 3)
      .map((c) => c.companyName)
      .join(", ")}.`,
    "Commission labour-standards pre-diligence for CoastWeave Apparel before management meeting.",
    "Map DFI co-invest appetite for Mwanzo Renewables C&I solar within 30 days.",
    "Validate HustlePay collections quality and consumer-protection posture with two reference lenders.",
  ];

  const recommendedActions: OpportunityRecommendedAction[] = [
    {
      id: "opp-act-1",
      title: "Schedule management calls — top three opportunities",
      rationale: `${potentialCompanies
        .slice(0, 3)
        .map((c) => c.companyName)
        .join(", ")} are highest scoring. Confirm data room access and theory of change metrics.`,
      owner: "Harry Turner",
      urgency: "This week",
      cardText: "",
    },
    {
      id: "opp-act-2",
      title: "Advance DFI conversation for C&I solar",
      rationale:
        "Mwanzo Renewables-class tickets need blended capital. Start term-sheet framing with Impact Director this month.",
      owner: "Impact Director",
      urgency: "This month",
      cardText: "",
    },
    {
      id: "opp-act-3",
      title: "Tighten Kenya sourcing filter",
      rationale:
        "Avoid crowded late processes. Prioritise healthcare diagnostics and mobility networks with clear rider/patient outcomes.",
      owner: "Portfolio Ops",
      urgency: "This week",
      cardText: "",
    },
    {
      id: "opp-act-4",
      title: "Pilot faith-based MSME distribution partnership",
      rationale:
        "Test church/savings-group origination for inclusion credit without compromising underwriting standards.",
      owner: "Harry Turner",
      urgency: "Today",
      cardText: "",
    },
  ];
  for (const a of recommendedActions) {
    a.cardText = [
      `Recommended Action — ${a.title}`,
      `Owner: ${a.owner}`,
      `Urgency: ${a.urgency}`,
      "",
      a.rationale,
    ].join("\n");
  }

  const briefingText = [
    "AI Opportunity Executive Briefing — Talanton Impact",
    `As of ${todayIso()} · Prepared for Harry Turner / Talanton leadership`,
    "Mandate: faith-driven impact investing across Sub-Saharan Africa",
    "",
    "Emerging opportunities",
    ...emergingOpportunities.map((x) => `• ${x}`),
    "",
    "Sector developments",
    ...sectorDevelopments.map((x) => `• ${x}`),
    "",
    "Regional developments",
    ...regionalDevelopments.map((x) => `• ${x}`),
    "",
    "Strategic opportunities",
    ...strategicOpportunitiesNarrative.map((x) => `• ${x}`),
    "",
    "Risks and challenges",
    ...risksAndChallenges.map((x) => `• ${x}`),
    "",
    "Recommended investigations",
    ...recommendedInvestigations.map((x, i) => `${i + 1}. ${x}`),
  ].join("\n");

  return {
    asOf: todayIso(),
    preparedFor: "Harry Turner and Talanton leadership",
    health,
    emergingOpportunities,
    sectorDevelopments,
    regionalDevelopments,
    strategicOpportunitiesNarrative,
    risksAndChallenges,
    recommendedInvestigations,
    potentialCompanies,
    sectors,
    regions,
    strategic,
    recommendedActions,
    briefingText,
    healthSummaryText: health.healthText,
    pipelineText: [
      "Potential Portfolio Companies",
      ...potentialCompanies.map(
        (c) =>
          `• ${c.companyName} (${c.country}, ${c.sector}) — score ${c.opportunityScore}; impact ${c.impactPotential}; invest ${c.investmentAttractiveness}`,
      ),
    ].join("\n"),
    sectorsText: ["Sector Intelligence", ...sectors.map((s) => `• ${s.sector}: ${s.trend}, ${s.opportunityRating} — ${s.growthOutlook}`)].join(
      "\n",
    ),
    regionsText: [
      "Regional Intelligence",
      ...regions.map((r) => `• ${r.region}: ${r.opportunityRating} — ${r.economicOutlook}`),
    ].join("\n"),
    strategicText: [
      "Strategic Opportunities",
      ...strategic.map((s) => `• [${s.category}] ${s.title} — ${s.owner} (${s.urgency})`),
    ].join("\n"),
    actionsText: [
      "Recommended Opportunity Actions",
      ...recommendedActions.map((a) => `• ${a.title} — ${a.owner} (${a.urgency}): ${a.rationale}`),
    ].join("\n"),
  };
}
