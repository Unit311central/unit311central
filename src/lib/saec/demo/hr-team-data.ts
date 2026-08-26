/**
 * SAEC HR team seed records — inserted into hr_employees via ensureSaecHrEmployeesSeeded.
 */

import { SAEC_PRIMARY_CURRENCY } from "@/lib/saec/demo/company";
import { SAEC_DIRECTORS } from "@/lib/saec/demo/people";

export type SaecHrTeamMemberSeed = {
  fullName: string;
  preferredName?: string;
  email: string;
  phone: string;
  address: string;
  nationality: string;
  employmentStatus: "active" | "archived";
  employmentType: "permanent" | "contract" | "temporary";
  dateJoined: string;
  location: string;
  role: string;
  department: string;
  manager?: string;
  currency: string;
  payFrequency: "monthly";
  salaryCurrent: number;
  salaryPrevious: number;
  bonus: number;
  holidayCalendar: string;
  vacationDaysPerYear: number;
  vacationDaysTaken: number;
};

const ZAR = SAEC_PRIMARY_CURRENCY;

type SaecHrMemberInput = {
  fullName: string;
  email: string;
  phone: string;
  role: string;
  department: string;
} & Partial<SaecHrTeamMemberSeed>;

function member(partial: SaecHrMemberInput): SaecHrTeamMemberSeed {
  return {
    employmentStatus: "active",
    employmentType: "permanent",
    currency: ZAR,
    payFrequency: "monthly",
    bonus: 0,
    holidayCalendar: "South Africa",
    vacationDaysPerYear: 15,
    vacationDaysTaken: 0,
    address: "Pretoria, Gauteng",
    nationality: "South African",
    dateJoined: "2018-01-01",
    location: "Pretoria",
    manager: "Dewald Lassen",
    salaryCurrent: 480_000,
    salaryPrevious: 450_000,
    ...partial,
  };
}

const directorSeeds: SaecHrTeamMemberSeed[] = SAEC_DIRECTORS.map((person) =>
  member({
    fullName: person.fullName,
    email: person.email,
    phone: person.phone,
    address: "Pretoria, Gauteng",
    nationality: "South African",
    dateJoined: person.isFounder ? "2012-03-01" : "2016-01-15",
    location: "Pretoria",
    role: person.roleTitle,
    department: person.department,
    manager: person.isFounder ? "" : "Dewald Lassen",
    salaryCurrent: person.department === "Management" ? 1_850_000 : 1_200_000,
    salaryPrevious: person.department === "Management" ? 1_750_000 : 1_100_000,
    vacationDaysTaken: 4,
  }),
);

const salesTeam: SaecHrTeamMemberSeed[] = [
  member({
    fullName: "Thabo Mokoena",
    email: "thabo.mokoena@omnitransit.com",
    phone: "+27 11 944 6501",
    address: "Sandton, Gauteng",
    nationality: "South African",
    dateJoined: "2019-04-01",
    location: "Johannesburg",
    role: "Regional Sales Manager",
    department: "Sales",
    manager: "Dewald Lassen",
    salaryCurrent: 780_000,
    salaryPrevious: 720_000,
    vacationDaysTaken: 3,
  }),
  member({
    fullName: "Annelize Fourie",
    email: "annelize.fourie@omnitransit.com",
    phone: "+27 21 408 7601",
    address: "Cape Town, Western Cape",
    nationality: "South African",
    dateJoined: "2020-02-10",
    location: "Cape Town",
    role: "Sales Executive — Western Cape",
    department: "Sales",
    manager: "Thabo Mokoena",
    salaryCurrent: 620_000,
    salaryPrevious: 580_000,
    vacationDaysTaken: 2,
  }),
  member({
    fullName: "Sipho Maseko",
    email: "sipho.maseko@omnitransit.com",
    phone: "+27 31 555 1201",
    address: "Durban, KwaZulu-Natal",
    nationality: "South African",
    dateJoined: "2018-08-15",
    location: "Durban",
    role: "Sales Executive — KZN",
    department: "Sales",
    manager: "Thabo Mokoena",
    salaryCurrent: 610_000,
    salaryPrevious: 590_000,
    vacationDaysTaken: 5,
  }),
  member({
    fullName: "Zanele Mthembu",
    email: "zanele.mthembu@omnitransit.com",
    phone: "+27 11 643 1801",
    address: "Johannesburg, Gauteng",
    nationality: "South African",
    dateJoined: "2021-06-01",
    location: "Johannesburg",
    role: "Commercial Account Manager",
    department: "Sales",
    manager: "Thabo Mokoena",
    salaryCurrent: 540_000,
    salaryPrevious: 500_000,
    vacationDaysTaken: 1,
  }),
  member({
    fullName: "Francois du Plessis",
    email: "francois.duplessis@omnitransit.com",
    phone: "+27 12 460 7520",
    address: "Centurion, Gauteng",
    nationality: "South African",
    dateJoined: "2022-01-10",
    location: "Pretoria",
    role: "Sales Coordinator",
    department: "Sales",
    manager: "Thabo Mokoena",
    salaryCurrent: 420_000,
    salaryPrevious: 400_000,
    vacationDaysTaken: 0,
  }),
];

const fieldEngineers: SaecHrTeamMemberSeed[] = [
  "Tshepo Modise",
  "Riaan Pretorius",
  "Kagiso Mohapi",
  "Linda van Wyk",
  "David Khumalo",
  "Mpho Sebata",
  "Johan Steyn",
  "Sarah Daniels",
].map((name, index) =>
  member({
    fullName: name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@omnitransit.com`,
    phone: `+27 12 460 75${30 + index}`,
    address: "Gauteng",
    nationality: "South African",
    dateJoined: `20${14 + index}-05-01`,
    location: index % 2 === 0 ? "Johannesburg" : "Pretoria",
    role: "Field Service Engineer",
    department: "Service / Maintenance",
    manager: "Lerato Nkosi",
    salaryCurrent: 480_000,
    salaryPrevious: 450_000,
    vacationDaysTaken: index % 4,
  }),
);

const installers: SaecHrTeamMemberSeed[] = [
  "Andile Nkosi",
  "Willem Botha",
  "Blessing Ndlovu",
  "Henri Coetzee",
  "Naledi Khumalo",
  "Chris van Rooyen",
  "Sibusiso Dlamini",
  "Emily van der Berg",
].map((name, index) =>
  member({
    fullName: name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@omnitransit.com`,
    phone: `+27 12 460 76${10 + index}`,
    address: "Gauteng",
    nationality: "South African",
    dateJoined: `20${16 + index}-03-15`,
    location: index % 3 === 0 ? "Cape Town" : "Pretoria",
    role: "Installation Technician",
    department: "Installation",
    manager: "Pieter van der Merwe",
    salaryCurrent: 420_000,
    salaryPrevious: 400_000,
    vacationDaysTaken: index % 3,
  }),
);

const supportFunctions: SaecHrTeamMemberSeed[] = [
  member({
    fullName: "Refilwe Motsepe",
    email: "refilwe.motsepe@omnitransit.com",
    phone: "+27 12 460 7625",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2017-09-01",
    location: "Pretoria",
    role: "HR Manager",
    department: "Human Resources",
    manager: "Dewald Lassen",
    salaryCurrent: 680_000,
    salaryPrevious: 650_000,
    vacationDaysTaken: 4,
  }),
  member({
    fullName: "Daniel Kruger",
    email: "daniel.kruger@omnitransit.com",
    phone: "+27 12 460 7626",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2018-11-01",
    location: "Pretoria",
    role: "Finance Manager",
    department: "Finance",
    manager: "Nomsa Dlamini",
    salaryCurrent: 720_000,
    salaryPrevious: 690_000,
    vacationDaysTaken: 2,
  }),
  member({
    fullName: "Ayanda Zulu",
    email: "ayanda.zulu@omnitransit.com",
    phone: "+27 12 460 7627",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2019-07-01",
    location: "Pretoria",
    role: "Procurement Lead",
    department: "Procurement",
    manager: "Nomsa Dlamini",
    salaryCurrent: 560_000,
    salaryPrevious: 530_000,
    vacationDaysTaken: 1,
  }),
  member({
    fullName: "Charlene Pretorius",
    email: "charlene.pretorius@omnitransit.com",
    phone: "+27 12 460 7628",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2020-04-01",
    location: "Pretoria",
    role: "QMS Coordinator",
    department: "QMS",
    manager: "Lerato Nkosi",
    salaryCurrent: 520_000,
    salaryPrevious: 500_000,
    vacationDaysTaken: 3,
  }),
  member({
    fullName: "Marcus Engelbrecht",
    email: "marcus.engelbrecht@omnitransit.com",
    phone: "+27 12 460 7629",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2019-01-15",
    location: "Pretoria",
    role: "IT Systems Administrator",
    department: "IT / Technology",
    manager: "Pieter van der Merwe",
    salaryCurrent: 580_000,
    salaryPrevious: 550_000,
    vacationDaysTaken: 2,
  }),
  member({
    fullName: "Grace Mokoena",
    email: "grace.mokoena@omnitransit.com",
    phone: "+27 12 460 7630",
    address: "Pretoria",
    nationality: "South African",
    dateJoined: "2021-02-01",
    location: "Pretoria",
    role: "Office Administrator",
    department: "Administration",
    manager: "Dewald Lassen",
    salaryCurrent: 380_000,
    salaryPrevious: 360_000,
    vacationDaysTaken: 0,
  }),
];

const engineeringStaff: SaecHrTeamMemberSeed[] = [
  "Elaine Fourie",
  "Bongani Cele",
  "Stefan Marais",
  "Nadia Govender",
  "Hendrik Smit",
  "Portia Mabaso",
].map((name, index) =>
  member({
    fullName: name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@omnitransit.com`,
    phone: `+27 12 460 76${40 + index}`,
    address: "Pretoria",
    nationality: "South African",
    dateJoined: `20${15 + index}-06-01`,
    location: "Pretoria",
    role: index < 2 ? "Design Engineer" : "Project Engineer",
    department: "Engineering",
    manager: "Pieter van der Merwe",
    salaryCurrent: 650_000,
    salaryPrevious: 620_000,
    vacationDaysTaken: index % 2,
  }),
);

/** ~50 SAEC demo employees across departments. */
const operationsAndAdmin: SaecHrTeamMemberSeed[] = [
  "Patricia van Wyk",
  "Obakeng Molefe",
  "Jan de Villiers",
  "Lungile Mthembu",
  "Rachel Naidoo",
  "Simon Govender",
  "Elize du Toit",
  "Themba Ncube",
  "Fatima Patel",
  "Gerhard Venter",
  "Nomvula Sithole",
  "Ian Robertson",
  "Catherine Botha",
  "Victor Maseko",
  "Amanda Schoeman",
  "Peter Khoza",
  "Liezel van Jaarsveld",
  "James Okonkwo",
  "Rethabile Mokoena",
  "Gert van der Walt",
  "Yolanda Petersen",
  "Shaun Reddy",
  "Michelle Jacobs",
].map((name, index) =>
  member({
    fullName: name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@omnitransit.com`,
    phone: `+27 12 460 77${10 + index}`,
    address: index % 4 === 0 ? "Cape Town" : "Pretoria",
    nationality: "South African",
    dateJoined: `20${17 + (index % 6)}-0${1 + (index % 9)}-01`,
    location: index % 4 === 0 ? "Cape Town" : index % 3 === 0 ? "Johannesburg" : "Pretoria",
    role:
      index % 5 === 0
        ? "Warehouse Supervisor"
        : index % 4 === 0
          ? "Dispatch Coordinator"
          : "Operations Coordinator",
    department: index % 6 === 0 ? "Administration" : "Operations",
    manager: index % 6 === 0 ? "Dewald Lassen" : "Lerato Nkosi",
    salaryCurrent: 400_000 + index * 5_000,
    salaryPrevious: 380_000 + index * 5_000,
    vacationDaysTaken: index % 4,
  }),
);

export const SAEC_HR_TEAM_EMPLOYEES: SaecHrTeamMemberSeed[] = [
  ...directorSeeds,
  ...salesTeam,
  ...fieldEngineers,
  ...installers,
  ...supportFunctions,
  ...engineeringStaff,
  ...operationsAndAdmin,
];
