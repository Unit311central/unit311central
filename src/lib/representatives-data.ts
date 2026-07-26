export type RepresentativeType = "Distributor" | "Agent" | "Reseller";

export type RepresentativeStatus = "Active" | "Onboarding" | "Inactive";

export type RepresentativeTerritory =
  | "Iberia"
  | "Southern Europe"
  | "UK & Ireland"
  | "Nordics"
  | "DACH"
  | "Middle East"
  | "Global";

export type Representative = {
  id: string;
  fullName: string;
  companyName: string;
  email: string;
  phone: string;
  territory: RepresentativeTerritory;
  repType: RepresentativeType;
  status: RepresentativeStatus;
  notes: string;
};

export const REPRESENTATIVE_TYPE_OPTIONS: RepresentativeType[] = [
  "Distributor",
  "Agent",
  "Reseller",
];

export const REPRESENTATIVE_STATUS_OPTIONS: RepresentativeStatus[] = [
  "Active",
  "Onboarding",
  "Inactive",
];

export const REPRESENTATIVE_TERRITORY_OPTIONS: RepresentativeTerritory[] = [
  "Iberia",
  "Southern Europe",
  "UK & Ireland",
  "Nordics",
  "DACH",
  "Middle East",
  "Global",
];

let representativeCounter = 4;

export function createRepresentativeId() {
  representativeCounter += 1;
  return `rep-${representativeCounter}`;
}

export function createInitialRepresentatives(): Representative[] {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserDemoSurface, getDemoEnterpriseFixtures } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        const fixtures = getDemoEnterpriseFixtures();
        return [
          {
            id: "rep-mag-1",
            fullName: "Priya Shah",
            companyName: "Ashford Lane LLP",
            email: "priya.shah@ashfordlane.demo",
            phone: "+44 20 7946 2201",
            territory: "UK & Ireland",
            repType: "Distributor",
            status: "Active",
            notes: `${fixtures.tag} Legal counsel network for ${fixtures.company.tradingName}.`,
          },
          {
            id: "rep-mag-2",
            fullName: "James Okonkwo",
            companyName: "Northbridge Advisory",
            email: "j.okonkwo@northbridge.demo",
            phone: "+44 20 7946 2210",
            territory: "Global",
            repType: "Distributor",
            status: "Active",
            notes: "Accounting and statutory filings partner.",
          },
          {
            id: "rep-mag-3",
            fullName: "Sofia Almeida",
            companyName: "Aether Risk Brokers",
            email: "sofia.almeida@aetherrisk.demo",
            phone: "+65 6123 8800",
            territory: "Middle East",
            repType: "Agent",
            status: "Active",
            notes: "Insurance brokerage for D&O and cyber programmes.",
          },
          {
            id: "rep-mag-4",
            fullName: "Marcus Wei",
            companyName: "Cascade IP Counsel",
            email: "marcus.wei@cascadeip.demo",
            phone: "+1 212 555 0198",
            territory: "Global",
            repType: "Reseller",
            status: "Onboarding",
            notes: "IP counsel engagement for Meridian Atlas brand portfolio.",
          },
        ];
      }
    } catch {
      // Fall through.
    }
  }

  return [
    {
      id: "rep-1",
      fullName: "Miguel Santos",
      companyName: "AeroDistribución Ibérica",
      email: "m.santos@aerodistribucion.es",
      phone: "+34 93 480 2200",
      territory: "Iberia",
      repType: "Distributor",
      status: "Active",
      notes: "Primary DJI Enterprise channel partner for Catalonia and Valencia.",
    },
    {
      id: "rep-2",
      fullName: "Ana Ribeiro",
      companyName: "Lusitania UAS Partners",
      email: "ana.ribeiro@lusitaniauas.pt",
      phone: "+351 21 794 3300",
      territory: "Southern Europe",
      repType: "Agent",
      status: "Active",
      notes: "Covers Portugal and southern Spain training referrals.",
    },
    {
      id: "rep-3",
      fullName: "Thomas Hartley",
      companyName: "Oxford Geo Resellers Ltd",
      email: "t.hartley@oxfordgeoresellers.co.uk",
      phone: "+44 1865 555 410",
      territory: "UK & Ireland",
      repType: "Reseller",
      status: "Onboarding",
      notes: "Heritage and campus mapping referrals — contract review in progress.",
    },
    {
      id: "rep-4",
      fullName: "Sven Lindqvist",
      companyName: "Nordic Flight Systems AB",
      email: "s.lindqvist@nordicflight.se",
      phone: "+46 8 505 692 00",
      territory: "Nordics",
      repType: "Distributor",
      status: "Inactive",
      notes: "Paused pending Q4 territory realignment.",
    },
  ];
}

export function createBlankRepresentative(): Representative {
  return {
    id: createRepresentativeId(),
    fullName: "",
    companyName: "",
    email: "",
    phone: "",
    territory: "Iberia",
    repType: "Agent",
    status: "Onboarding",
    notes: "",
  };
}

export function representativeStatusClass(status: RepresentativeStatus) {
  switch (status) {
    case "Active":
      return "border-emerald-400/40 bg-emerald-500/15 text-emerald-300";
    case "Onboarding":
      return "border-sky-400/40 bg-sky-500/15 text-sky-300";
    case "Inactive":
      return "border-white/20 bg-white/10 text-white/60";
  }
}
