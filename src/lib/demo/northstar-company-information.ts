/**
 * Northstar Demo — company information profile (local editable SSOT seed).
 */

export type NorthstarDepartmentEmail = {
  id: string;
  label: string;
  email: string;
  notes?: string;
};

export type NorthstarCompanyInformation = {
  legalName: string;
  tradingName: string;
  registeredOfficeAddress: string;
  principalBusinessAddress: string;
  companyNumber: string;
  vatNumber: string;
  dunsNumber: string;
  dateOfIncorporation: string;
  countryOfRegistration: string;
  sicClassification: string;
  website: string;
  primaryTelephone: string;
  primaryEmail: string;
  companyDescription: string;
  departmentEmails: NorthstarDepartmentEmail[];
};

export const NORTHSTAR_COMPANY_INFO_STORAGE_KEY = "northstar-company-information-v1";

export function buildDefaultNorthstarCompanyInformation(): NorthstarCompanyInformation {
  return {
    legalName: "Northstar Industrial Technologies Ltd",
    tradingName: "Northstar Industrial Technologies",
    registeredOfficeAddress:
      "Unit 4, Trafford Park Industrial Estate\nManchester M17 1HH\nUnited Kingdom",
    principalBusinessAddress:
      "Unit 4, Trafford Park Industrial Estate\nManchester M17 1HH\nUnited Kingdom",
    companyNumber: "10488291",
    vatNumber: "GB 104 8829 01",
    dunsNumber: "23-456-7890",
    dateOfIncorporation: "2023-04-12",
    countryOfRegistration: "United Kingdom",
    sicClassification: "28990 — Manufacture of other special-purpose machinery",
    website: "https://northstar.demo",
    primaryTelephone: "+44 161 555 0100",
    primaryEmail: "hello@northstar.demo",
    companyDescription:
      "Industrial IoT edge controllers and remote monitoring platforms for mid-market manufacturers across the UK, Europe and the United States.",
    departmentEmails: [
      { id: "de-support", label: "Support", email: "support@northstar.demo", notes: "Customer & platform support" },
      { id: "de-finance", label: "Finance", email: "finance@northstar.demo", notes: "AP, AR, treasury" },
      { id: "de-hr", label: "Human Resources", email: "hr@northstar.demo", notes: "People & payroll" },
      { id: "de-logistics", label: "Logistics", email: "logistics@northstar.demo", notes: "Shipping & field hardware" },
      { id: "de-sales", label: "Sales", email: "sales@northstar.demo", notes: "Commercial enquiries" },
      { id: "de-legal", label: "Legal", email: "legal@northstar.demo", notes: "Contracts & compliance" },
      { id: "de-security", label: "Security", email: "security@northstar.demo", notes: "InfoSec & incident response" },
    ],
  };
}

export function loadNorthstarCompanyInformation(): NorthstarCompanyInformation {
  if (typeof window === "undefined") return buildDefaultNorthstarCompanyInformation();
  try {
    const raw = localStorage.getItem(NORTHSTAR_COMPANY_INFO_STORAGE_KEY);
    if (!raw) return buildDefaultNorthstarCompanyInformation();
    const parsed = JSON.parse(raw) as NorthstarCompanyInformation;
    if (!parsed?.legalName) return buildDefaultNorthstarCompanyInformation();
    return parsed;
  } catch {
    return buildDefaultNorthstarCompanyInformation();
  }
}

export function saveNorthstarCompanyInformation(data: NorthstarCompanyInformation) {
  if (typeof window === "undefined") return;
  localStorage.setItem(NORTHSTAR_COMPANY_INFO_STORAGE_KEY, JSON.stringify(data));
}
