/**
 * Canonical OmniTransit demo people — directors, cap table, and cross-module identity.
 */

export type SaecDemoPerson = {
  id: string;
  fullName: string;
  roleTitle: string;
  department: string;
  email: string;
  phone: string;
  isDirector: boolean;
  isFounder?: boolean;
  capTablePct?: number;
  demoFictitious?: boolean;
};

export const SAEC_DIRECTORS: SaecDemoPerson[] = [
  {
    id: "saec-person-sipho-ndlovu",
    fullName: "Sipho Ndlovu",
    roleTitle: "Chief Executive Officer",
    department: "Executive",
    email: "sipho.ndlovu@omnitransit.co.za",
    phone: "+27 11 234 5601",
    isDirector: true,
    capTablePct: 22,
  },
  {
    id: "saec-person-thandiwe-mkhize",
    fullName: "Thandiwe Mkhize",
    roleTitle: "Chief Financial Officer",
    department: "Finance",
    email: "thandiwe.mkhize@omnitransit.co.za",
    phone: "+27 11 234 5602",
    isDirector: true,
    capTablePct: 14,
  },
  {
    id: "saec-person-johan-ferreira",
    fullName: "Johan Ferreira",
    roleTitle: "Chief Operating Officer",
    department: "Operations",
    email: "johan.ferreira@omnitransit.co.za",
    phone: "+27 11 234 5603",
    isDirector: true,
    capTablePct: 18,
  },
  {
    id: "saec-person-naledi-khumalo",
    fullName: "Naledi Khumalo",
    roleTitle: "Technical Director",
    department: "Engineering",
    email: "naledi.khumalo@omnitransit.co.za",
    phone: "+27 11 234 5604",
    isDirector: true,
    capTablePct: 12,
  },
  {
    id: "saec-person-willem-botha",
    fullName: "Willem Botha",
    roleTitle: "Non-Executive Director",
    department: "Board",
    email: "willem.botha@omnitransit.co.za",
    phone: "+27 11 234 5605",
    isDirector: true,
    capTablePct: 8,
  },
];

export const SAEC_DEMO_INVESTORS = [
  {
    id: "saec-inv-veld-partners",
    name: "Veld Capital Partners",
    city: "Johannesburg",
    type: "Private equity",
    demoFictitious: true,
  },
  {
    id: "saec-inv-karoo-growth",
    name: "Karoo Growth Fund",
    city: "Cape Town",
    type: "Growth equity",
    demoFictitious: true,
  },
  {
    id: "saec-inv-pretoria-industrial",
    name: "Pretoria Industrial Holdings",
    city: "Pretoria",
    type: "Industrial investor",
    demoFictitious: true,
  },
  {
    id: "saec-inv-coastal-ventures",
    name: "Coastal Ventures SA",
    city: "Durban",
    type: "Venture capital",
    demoFictitious: true,
  },
  {
    id: "saec-inv-highveld-family",
    name: "Highveld Family Office",
    city: "Sandton",
    type: "Family office",
    demoFictitious: true,
  },
] as const;
