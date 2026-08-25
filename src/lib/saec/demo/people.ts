/**
 * Canonical SAEC demo people — directors, cap table, and cross-module identity.
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
    id: "saec-person-dewald-lassen",
    fullName: "Dewald Lassen",
    roleTitle: "Managing Director",
    department: "Management",
    email: "dewald.lassen@saec.biz",
    phone: "+27 12 460 7510",
    isDirector: true,
    capTablePct: 28,
  },
  {
    id: "saec-person-john-ligeti",
    fullName: "John Andrew Ligeti",
    roleTitle: "Founder & Director",
    department: "Management",
    email: "john.ligeti@saec.biz",
    phone: "+27 12 460 7511",
    isDirector: true,
    isFounder: true,
    capTablePct: 35,
  },
  {
    id: "saec-person-nomsa-dlamini",
    fullName: "Nomsa Dlamini",
    roleTitle: "Financial Director",
    department: "Finance",
    email: "nomsa.dlamini@saec.biz",
    phone: "+27 12 460 7512",
    isDirector: true,
    capTablePct: 12,
  },
  {
    id: "saec-person-pieter-vdm",
    fullName: "Pieter van der Merwe",
    roleTitle: "Technical Director",
    department: "Engineering",
    email: "pieter.vdm@saec.biz",
    phone: "+27 12 460 7513",
    isDirector: true,
    capTablePct: 10,
  },
  {
    id: "saec-person-lerato-nkosi",
    fullName: "Lerato Nkosi",
    roleTitle: "Operations Director",
    department: "Operations",
    email: "lerato.nkosi@saec.biz",
    phone: "+27 12 460 7514",
    isDirector: true,
    capTablePct: 15,
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
