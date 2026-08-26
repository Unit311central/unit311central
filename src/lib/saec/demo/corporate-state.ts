import type { CorporateMockState } from "@/lib/corporate-mock-store";
import { isoDaysFromNow, uid } from "@/lib/corporate-mock-store";
import {
  SAEC_HEAD_OFFICE,
  SAEC_HISTORICAL_SEED_ROUND,
  SAEC_LEGAL_NAME,
  SAEC_PRIMARY_CURRENCY,
} from "@/lib/saec/demo/company";
import { SAEC_DIRECTORS } from "@/lib/saec/demo/people";

export function buildSaecCorporateMockState(): CorporateMockState {
  const offices = [
    {
      id: SAEC_HEAD_OFFICE.id,
      name: SAEC_HEAD_OFFICE.name,
      country: SAEC_HEAD_OFFICE.country,
      city: SAEC_HEAD_OFFICE.city,
      address: `${SAEC_HEAD_OFFICE.addressLine}, ${SAEC_HEAD_OFFICE.city}`,
      manager: "Dewald Lassen",
      employees: 52,
      status: "active" as const,
      phone: SAEC_HEAD_OFFICE.phone,
      timezone: SAEC_HEAD_OFFICE.timezone,
    },
  ];

  const banks = [
    {
      id: "saec-bank-fnb",
      bank: "First National Bank",
      accountName: "OmniTransit Operating Account",
      currency: SAEC_PRIMARY_CURRENCY,
      country: SAEC_HEAD_OFFICE.country,
      accountType: "Current" as const,
      status: "active" as const,
      primary: true,
      balance: 18_400_000,
      iban: "",
      swift: "FIRNZAJJ",
      routing: "250655",
      branch: "Menlyn, Pretoria",
      accountHolder: SAEC_LEGAL_NAME,
      notes: "Primary ZAR operating account",
    },
    {
      id: "saec-bank-absa",
      bank: "ABSA Bank",
      accountName: "OmniTransit Client Receipts",
      currency: SAEC_PRIMARY_CURRENCY,
      country: SAEC_HEAD_OFFICE.country,
      accountType: "Current" as const,
      status: "active" as const,
      primary: false,
      balance: 6_200_000,
      iban: "",
      swift: "ABSAZAJJ",
      routing: "632005",
      branch: "Brooklyn, Pretoria",
      accountHolder: SAEC_LEGAL_NAME,
      notes: "Client collections and instalment receipts",
    },
  ];

  const shareholders = SAEC_DIRECTORS.map((person) => ({
    id: `saec-sh-${person.id}`,
    company: SAEC_LEGAL_NAME,
    shareholder: person.fullName,
    shareClass: "Ordinary" as const,
    shares: (person.capTablePct ?? 0) * 42_000,
    price: "R 1.00",
    issueDate: person.isFounder ? "2012-03-01" : "2016-01-15",
    notes: `${person.roleTitle} · ${person.capTablePct ?? 0}%`,
  }));

  return {
    offices,
    banks,
    advisors: [
      {
        id: "saec-adv-pwc",
        company: "PwC South Africa",
        contact: "Andries van Niekerk",
        category: "Auditors" as const,
        country: SAEC_HEAD_OFFICE.country,
        phone: "+27 11 797 5000",
        email: "andries.vanniekerk@pwc.com",
        retainer: "R 420 000 / year",
        status: "active" as const,
        notes: "Annual audit and IFRS reporting",
      },
      {
        id: "saec-adv-cliffe",
        company: "Cliffe Dekker Hofmeyr",
        contact: "Sipho Ndlovu",
        category: "Lawyers" as const,
        country: SAEC_HEAD_OFFICE.country,
        phone: "+27 11 562 1000",
        email: "sipho.ndlovu@cdh.co.za",
        retainer: "R 280 000 / year",
        status: "active" as const,
        notes: "Commercial contracts and property leases",
      },
    ],
    contracts: [
      {
        id: "saec-contract-growthpoint",
        name: "Growthpoint framework maintenance",
        supplier: "Growthpoint Properties",
        type: "MSA" as const,
        owner: "Thabo Mokoena",
        startDate: "2024-01-01",
        expiryDate: isoDaysFromNow(180),
        value: "R 12.4M / year",
        status: "active" as const,
        summary: "Portfolio lift and escalator maintenance SLA",
        parties: "OmniTransit · Growthpoint Properties",
        renewalNotes: "Annual SLA review in Q4",
        documents: "growthpoint-msa-2024.pdf",
        notes: "Covers Gauteng retail portfolio",
      },
      {
        id: "saec-contract-hyprop",
        name: "Hyprop mall installation programme",
        supplier: "Hyprop Investments",
        type: "Supplier" as const,
        owner: "Annelize Fourie",
        startDate: "2025-06-01",
        expiryDate: isoDaysFromNow(320),
        value: "R 8.6M",
        status: "active" as const,
        summary: "Centurion Mall KLK installation phases",
        parties: "OmniTransit · Hyprop Investments",
        renewalNotes: "",
        documents: "hyprop-install-schedule.pdf",
        notes: "Phased delivery through 2027",
      },
    ],
    shareholders,
    optionPool: {
      authorised: 1_000_000,
      issued: 120_000,
      reserved: 80_000,
      lastUpdated: isoDaysFromNow(0),
    },
    capital: {
      authorisedShareCapital: "10 000 000 ordinary shares",
      issuedShareCapital: "4 200 000 ordinary shares",
      currency: SAEC_PRIMARY_CURRENCY,
    },
    licences: [
      {
        id: "saec-lic-lift",
        software: "Lift/Escalator Contractor Registration",
        vendor: "Department of Employment and Labour",
        licenceType: "National contractor",
        seats: 1,
        renewalDate: isoDaysFromNow(95),
        cost: "R 18 500 / year",
        owner: "Lerato Nkosi",
        status: "active" as const,
      },
    ],
    activity: [
      {
        id: uid("saec-act"),
        at: isoDaysFromNow(-12),
        label: "Framework agreement renewed",
        detail: "Redefine Properties portfolio maintenance",
      },
      {
        id: uid("saec-act2"),
        at: isoDaysFromNow(-45),
        label: SAEC_HISTORICAL_SEED_ROUND.label,
        detail: SAEC_HISTORICAL_SEED_ROUND.displayLabel,
      },
    ],
  };
}
