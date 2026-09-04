/** Intelligence briefing content sourced from greendesert.tech */

export type GreenDesertIntelligenceRecord = {
  id: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  severity: "info" | "watch" | "priority";
};

export const GREENDESERT_COMPANY_INTELLIGENCE: GreenDesertIntelligenceRecord[] = [
  {
    id: "gd-intel-1",
    title: "Algae protein yield advantage",
    summary:
      "Green Desert algae cultivation produces 15× more protein per acre than traditional crops, supporting Saudi food security goals.",
    category: "Product",
    tags: ["food security", "protein", "Saudi Arabia"],
    severity: "priority",
  },
  {
    id: "gd-intel-2",
    title: "Water efficiency positioning",
    summary:
      "Algae requires 10× less water than comparable protein sources — critical for water-scarce regions including KSA.",
    category: "Operations",
    tags: ["water", "sustainability"],
    severity: "priority",
  },
  {
    id: "gd-intel-3",
    title: "Carbon-negative cultivation",
    summary:
      "Algae cultivation absorbs ~25 tonnes of CO₂ per hectare annually, reinforcing Green Desert's climate narrative.",
    category: "ESG",
    tags: ["carbon", "climate"],
    severity: "info",
  },
  {
    id: "gd-intel-4",
    title: "Jeddah Technologies pilot",
    summary:
      "Phase 1 deployment with Jeddah Technologies — IoT-controlled photobioreactors and client telemetry integration.",
    category: "Commercial",
    tags: ["Jeddah", "pilot", "client"],
    severity: "watch",
  },
];

export const GREENDESERT_MARKET_INTELLIGENCE: GreenDesertIntelligenceRecord[] = [
  {
    id: "gd-market-1",
    title: "Saudi protein import dependency",
    summary:
      "KSA reliance on imported protein creates strategic opening for local algae-based alternatives.",
    category: "Market",
    tags: ["Saudi Arabia", "imports", "protein"],
    severity: "priority",
  },
  {
    id: "gd-market-2",
    title: "Regenerative agriculture momentum",
    summary:
      "Regional investors prioritising sustainable agriculture and circular food systems in the GCC.",
    category: "Investment",
    tags: ["GCC", "agritech"],
    severity: "watch",
  },
  {
    id: "gd-market-3",
    title: "RedSea & Cambridge leadership bench",
    summary:
      "Executive team combines RedSea R&D, McKinsey, Bain, MIT, and Cambridge credentials — strong for institutional fundraising.",
    category: "Leadership",
    tags: ["team", "credentials"],
    severity: "info",
  },
];

export const GREENDESERT_CLIENT_INTELLIGENCE: GreenDesertIntelligenceRecord[] = [
  {
    id: "gd-client-1",
    title: "Jeddah Technologies engagement",
    summary:
      "Active client portal for project files, reactor telemetry, and support — anchor customer for KSA rollout.",
    category: "Client",
    tags: ["Jeddah Technologies", "portal"],
    severity: "priority",
  },
  {
    id: "gd-client-2",
    title: "Board governance cadence",
    summary:
      "Board portal tracks meetings, risk register, and investor updates for Green Desert directors.",
    category: "Governance",
    tags: ["board", "governance"],
    severity: "info",
  },
];
