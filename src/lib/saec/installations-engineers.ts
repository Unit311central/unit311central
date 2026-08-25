import type { SaecEngineerFieldStatus } from "@/lib/saec/installations-types";

/** Fictional SAEC field engineers — linked to HR when seeded; demo-only names. */
export type SaecInstallationEngineer = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  department: string;
  defaultFieldStatus: SaecEngineerFieldStatus;
};

export const SAEC_INSTALLATION_ENGINEERS: SaecInstallationEngineer[] = [
  {
    id: "saec-eng-thabo",
    fullName: "Thabo Mokoena",
    email: "thabo.mokoena@saec.demo",
    phone: "+27 11 555 0101",
    department: "Installations & Service",
    defaultFieldStatus: "On Site",
  },
  {
    id: "saec-eng-johan",
    fullName: "Johan Smith",
    email: "johan.smith@saec.demo",
    phone: "+27 11 555 0102",
    department: "Installations & Service",
    defaultFieldStatus: "En Route",
  },
  {
    id: "saec-eng-david",
    fullName: "David Naidoo",
    email: "david.naidoo@saec.demo",
    phone: "+27 11 555 0103",
    department: "Installations & Service",
    defaultFieldStatus: "En Route",
  },
  {
    id: "saec-eng-lerato",
    fullName: "Lerato Dlamini",
    email: "lerato.dlamini@saec.demo",
    phone: "+27 11 555 0104",
    department: "Modernisation",
    defaultFieldStatus: "Available",
  },
  {
    id: "saec-eng-peter",
    fullName: "Peter van der Merwe",
    email: "peter.vdm@saec.demo",
    phone: "+27 11 555 0105",
    department: "Maintenance",
    defaultFieldStatus: "On Site",
  },
  {
    id: "saec-eng-zanele",
    fullName: "Zanele Khumalo",
    email: "zanele.khumalo@saec.demo",
    phone: "+27 11 555 0106",
    department: "Maintenance",
    defaultFieldStatus: "Available",
  },
];
