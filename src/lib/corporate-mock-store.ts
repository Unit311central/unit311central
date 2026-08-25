/**
 * Client-side Corporate Information mock store for demos.
 * Future: swap selectors/mutations for GET/POST /api/corporate/... endpoints.
 */

import type {
  CorporateActivityItem,
  CorporateAdvisor,
  CorporateBankAccount,
  CorporateCapital,
  CorporateContract,
  CorporateLicence,
  CorporateOffice,
  CorporateOptionPool,
  CorporateShareholder,
} from "@/lib/corporate-data";
import { daysUntil, isWithinDays } from "@/lib/corporate-data";
import { ABHI_CASH_BALANCE_GBP } from "@/lib/abhi-financials";
import { CORPCENTRE_BANK_BALANCES_AUD } from "@/lib/corpcentre-financials";

type Listener = () => void;

export type CorporateMockState = {
  offices: CorporateOffice[];
  banks: CorporateBankAccount[];
  advisors: CorporateAdvisor[];
  contracts: CorporateContract[];
  shareholders: CorporateShareholder[];
  optionPool: CorporateOptionPool;
  capital: CorporateCapital;
  licences: CorporateLicence[];
  activity: CorporateActivityItem[];
};

export function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

function contractStatusFromExpiry(expiryDate: string, current: CorporateContract["status"]) {
  if (current === "archived" || current === "draft") return current;
  const days = daysUntil(expiryDate);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring";
  return "active";
}

function licenceStatusFromRenewal(renewalDate: string, current: CorporateLicence["status"]) {
  if (current === "archived") return current;
  const days = daysUntil(renewalDate);
  if (days < 0) return "expired";
  if (days <= 60) return "expiring";
  return "active";
}

function seedCorpCentreState(): CorporateMockState {
  const offices: CorporateOffice[] = [
    {
      id: "cc-office-alexandria",
      name: "Alexandria HQ",
      country: "Australia",
      city: "Alexandria",
      address: "42 Bourke Road, Alexandria NSW 2015",
      manager: "Peter",
      employees: 28,
      status: "active",
      phone: "+61 2 8399 3100",
      timezone: "Australia/Sydney",
    },
    {
      id: "cc-office-melbourne",
      name: "Melbourne Office",
      country: "Australia",
      city: "Melbourne",
      address: "120 Collins Street, Melbourne VIC 3000",
      manager: "Daniel",
      employees: 12,
      status: "active",
      phone: "+61 3 9650 1800",
      timezone: "Australia/Melbourne",
    },
    {
      id: "cc-office-brisbane",
      name: "Brisbane Office",
      country: "Australia",
      city: "Brisbane",
      address: "200 Mary Street, Brisbane QLD 4000",
      manager: "John",
      employees: 8,
      status: "active",
      phone: "+61 7 3003 4100",
      timezone: "Australia/Brisbane",
    },
  ];

  const banks: CorporateBankAccount[] = [
    {
      id: "cc-bank-cba",
      bank: "Commonwealth Bank of Australia",
      accountName: "CorpCentre Operating AUD",
      currency: "AUD",
      country: "Australia",
      accountType: "Current",
      status: "active",
      primary: true,
      balance: CORPCENTRE_BANK_BALANCES_AUD.cbaOperating,
      iban: "",
      swift: "CTBAAU2S",
      routing: "062-000",
      branch: "Sydney Martin Place",
      accountHolder: "CorpCentre Pty Ltd",
      notes: "Primary operating account · Sydney CBD · BSB 062-000 · Acc 10234589 · AU$1.20M",
    },
    {
      id: "cc-bank-westpac",
      bank: "Westpac Banking Corporation",
      accountName: "CorpCentre Client Receipts AUD",
      currency: "AUD",
      country: "Australia",
      accountType: "Current",
      status: "active",
      primary: false,
      balance: CORPCENTRE_BANK_BALANCES_AUD.westpacReceipts,
      iban: "",
      swift: "WPACAU2S",
      routing: "032-000",
      branch: "Sydney George Street",
      accountHolder: "CorpCentre Pty Ltd",
      notes: "Client invoicing · Sydney · BSB 032-000 · Acc 44812203 · AU$450k",
    },
    {
      id: "cc-bank-anz",
      bank: "ANZ Banking Group",
      accountName: "CorpCentre Treasury AUD",
      currency: "AUD",
      country: "Australia",
      accountType: "Savings",
      status: "active",
      primary: false,
      balance: CORPCENTRE_BANK_BALANCES_AUD.anzTreasury,
      iban: "",
      swift: "ANZBAU3M",
      routing: "012-003",
      branch: "Sydney Pitt Street",
      accountHolder: "CorpCentre Pty Ltd",
      notes: "Cash reserve · Sydney · BSB 012-003 · Acc 77301194 · AU$350k",
    },
  ];

  const advisors: CorporateAdvisor[] = [
    {
      id: "cc-adv-allens",
      company: "Allens",
      contact: "Rebecca Walsh (Partner)",
      category: "Lawyers",
      country: "Australia",
      phone: "+61 2 9230 4000",
      email: "rebecca.walsh@allens.com.au",
      retainer: "AU$6,500 / month",
      status: "active",
      notes: "Corporate, commercial, and employment counsel · Sydney",
    },
    {
      id: "cc-adv-pwc",
      company: "PwC Australia",
      contact: "Michael Chen",
      category: "Accountants",
      country: "Australia",
      phone: "+61 2 8266 0000",
      email: "michael.chen@pwc.com.au",
      retainer: "AU$4,200 / month",
      status: "active",
      notes: "Management accounts, BAS, and payroll tax · Sydney",
    },
    {
      id: "cc-adv-kpmg",
      company: "KPMG Australia",
      contact: "Sophie Grant",
      category: "Auditors",
      country: "Australia",
      phone: "+61 2 9335 7000",
      email: "sophie.grant@kpmg.com.au",
      retainer: "Annual audit fee AU$28,000",
      status: "active",
      notes: "Statutory audit · Sydney engagement team",
    },
  ];

  const contracts: CorporateContract[] = [
    {
      id: "cc-contract-aws",
      name: "AWS Australia Enterprise Agreement",
      supplier: "Amazon Web Services Australia Pty Ltd",
      type: "MSA",
      owner: "Daniel",
      startDate: isoDaysFromNow(-400),
      expiryDate: isoDaysFromNow(95),
      value: "AU$96,000 / year",
      status: "active",
      summary: "Cloud hosting for CorpCentre customer platforms across Sydney region.",
      parties: "CorpCentre Pty Ltd · Amazon Web Services Australia Pty Ltd",
      renewalNotes: "Review committed spend before FY renewal.",
      documents: "AWS_AU_EA_2025.pdf",
      notes: "Billing currency AUD",
    },
    {
      id: "cc-contract-lease",
      name: "Alexandria HQ Office Lease",
      supplier: "Bourke Road Property Trust",
      type: "Lease",
      owner: "Peter",
      startDate: isoDaysFromNow(-600),
      expiryDate: isoDaysFromNow(40),
      value: "AU$210,000 / year",
      status: "expiring",
      summary: "Level 3 · 42 Bourke Road, Alexandria NSW 2015.",
      parties: "CorpCentre Pty Ltd · Bourke Road Property Trust",
      renewalNotes: "Landlord offered 3-year extension at CPI +2%.",
      documents: "Alexandria_Lease_2024.pdf",
      notes: "Break clause at month 36",
    },
    {
      id: "cc-contract-do",
      name: "Directors & Officers Liability (AU)",
      supplier: "QBE Insurance (Australia)",
      type: "Insurance",
      owner: "Peter",
      startDate: isoDaysFromNow(-90),
      expiryDate: isoDaysFromNow(275),
      value: "AU$18,500 / year",
      status: "active",
      summary: "AU$5M D&O cover for directors and officers.",
      parties: "CorpCentre Pty Ltd · QBE Insurance (Australia) Limited",
      renewalNotes: "",
      documents: "QBE_DO_2026.pdf",
      notes: "Broker: Marsh Australia",
    },
    {
      id: "cc-contract-telstra",
      name: "Telstra Enterprise Connectivity",
      supplier: "Telstra Corporation Limited",
      type: "Supplier",
      owner: "Mick",
      startDate: isoDaysFromNow(-200),
      expiryDate: isoDaysFromNow(165),
      value: "AU$48,000 / year",
      status: "active",
      summary: "NBN enterprise fibre and SD-WAN for Australian offices.",
      parties: "CorpCentre Pty Ltd · Telstra Corporation Limited",
      renewalNotes: "",
      documents: "Telstra_Enterprise_2025.pdf",
      notes: "",
    },
    {
      id: "cc-contract-nda",
      name: "NSW Government Supplier NDA",
      supplier: "NSW Department of Customer Service",
      type: "NDA",
      owner: "Daniel",
      startDate: isoDaysFromNow(-120),
      expiryDate: isoDaysFromNow(245),
      value: "—",
      status: "active",
      summary: "Mutual NDA for digital services procurement discussions.",
      parties: "CorpCentre Pty Ltd · NSW Department of Customer Service",
      renewalNotes: "",
      documents: "NSW_NDA_2026.pdf",
      notes: "",
    },
  ];

  const shareholders: CorporateShareholder[] = [
    {
      id: "cc-sh-peter",
      company: "CorpCentre Pty Ltd",
      shareholder: "Peter",
      shareClass: "Ordinary",
      shares: 500_000,
      price: "AU$1.00",
      issueDate: isoDaysFromNow(-900),
      notes: "Founder · 50% shareholding",
    },
    {
      id: "cc-sh-daniel",
      company: "CorpCentre Pty Ltd",
      shareholder: "Daniel",
      shareClass: "Ordinary",
      shares: 500_000,
      price: "AU$1.00",
      issueDate: isoDaysFromNow(-900),
      notes: "Founder · 50% shareholding",
    },
  ];

  const licences: CorporateLicence[] = [
    {
      id: "cc-lic-m365",
      software: "Microsoft 365 Business Premium",
      vendor: "Microsoft",
      licenceType: "Per user",
      seats: 45,
      renewalDate: isoDaysFromNow(52),
      cost: "AU$11,880 / year",
      owner: "Peter",
      status: "active",
    },
    {
      id: "cc-lic-atlassian",
      software: "Atlassian Cloud Premium",
      vendor: "Atlassian",
      licenceType: "Named",
      seats: 30,
      renewalDate: isoDaysFromNow(7),
      cost: "AU$5,040 / year",
      owner: "Daniel",
      status: "expiring",
    },
    {
      id: "cc-lic-salesforce",
      software: "Salesforce Sales Cloud",
      vendor: "Salesforce",
      licenceType: "Named",
      seats: 18,
      renewalDate: isoDaysFromNow(128),
      cost: "AU$19,440 / year",
      owner: "Peter",
      status: "active",
    },
    {
      id: "cc-lic-aws",
      software: "AWS Business Support",
      vendor: "Amazon Web Services",
      licenceType: "Unlimited",
      seats: 1,
      renewalDate: isoDaysFromNow(6),
      cost: "AU$25,200 / year",
      owner: "Daniel",
      status: "expiring",
    },
    {
      id: "cc-lic-xero",
      software: "Xero Organisations",
      vendor: "Xero",
      licenceType: "Named",
      seats: 5,
      renewalDate: isoDaysFromNow(68),
      cost: "AU$2,100 / year",
      owner: "Peter",
      status: "active",
    },
  ];

  return {
    offices,
    banks,
    advisors,
    contracts,
    shareholders,
    optionPool: {
      authorised: 0,
      issued: 0,
      reserved: 0,
      lastUpdated: isoDaysFromNow(-30),
    },
    capital: {
      authorisedShareCapital: "AU$1,000,000",
      issuedShareCapital: "AU$1,000,000",
      currency: "AUD",
    },
    licences,
    activity: [
      {
        id: "cc-act-1",
        at: isoDaysFromNow(0),
        label: "CorpCentre profile loaded",
        detail: "Australian corporate fixtures · Alexandria HQ",
      },
      {
        id: "cc-act-2",
        at: isoDaysFromNow(-1),
        label: "Cap table updated",
        detail: "Peter and Daniel · 50/50 ordinary shares",
      },
      {
        id: "cc-act-3",
        at: isoDaysFromNow(-2),
        label: "Bank accounts refreshed",
        detail: "CBA, Westpac, and ANZ · Sydney branches",
      },
    ],
  };
}

/** ABHI — UK offices, GBP banking, London-focused corporate records. */
function seedAbhiState(): CorporateMockState {
  const offices: CorporateOffice[] = [
    {
      id: "abhi-office-london-hq",
      name: "London HQ",
      country: "United Kingdom",
      city: "London",
      address: "107 Gray's Inn Road, London WC1X 8TZ",
      manager: "Jane Lewis",
      employees: 24,
      status: "active",
      phone: "+44 20 7960 4360",
      timezone: "Europe/London",
    },
    {
      id: "abhi-office-cambridge",
      name: "Cambridge Innovation Desk",
      country: "United Kingdom",
      city: "Cambridge",
      address: "Hauser Forum, 3 Charles Babbage Road, Cambridge CB3 0GT",
      manager: "Richard Phillips",
      employees: 4,
      status: "active",
      phone: "+44 1223 766 900",
      timezone: "Europe/London",
    },
    {
      id: "abhi-office-manchester",
      name: "Manchester Northern Hub",
      country: "United Kingdom",
      city: "Manchester",
      address: "One St Peter's Square, Manchester M2 3DE",
      manager: "Sarah Chen",
      employees: 3,
      status: "active",
      phone: "+44 161 228 2200",
      timezone: "Europe/London",
    },
  ];

  const banks: CorporateBankAccount[] = [
    {
      id: "abhi-bank-barclays-ops",
      bank: "Barclays",
      accountName: "ABHI Operating GBP",
      currency: "GBP",
      country: "United Kingdom",
      accountType: "Current",
      status: "active",
      primary: true,
      balance: ABHI_CASH_BALANCE_GBP,
      iban: "GB29 BARC 2000 0031 9268 19",
      swift: "BARCGB22",
      routing: "20-00-00",
      branch: "London Victoria",
      accountHolder: "Association of British HealthTech Industries",
      notes: "Primary operating account · membership receipts and supplier payments · £4.24M",
    },
    {
      id: "abhi-bank-natwest-events",
      bank: "NatWest",
      accountName: "ABHI Events & Conferences GBP",
      currency: "GBP",
      country: "United Kingdom",
      accountType: "Current",
      status: "active",
      primary: false,
      iban: "GB82 NWBK 6016 1331 9268 19",
      swift: "NWBKGB2L",
      routing: "60-16-13",
      branch: "London City",
      accountHolder: "Association of British HealthTech Industries",
      notes: "WHX / Hospitalar event deposits and exhibitor receipts",
    },
    {
      id: "abhi-bank-barclays-reserve",
      bank: "Barclays",
      accountName: "ABHI Reserves GBP",
      currency: "GBP",
      country: "United Kingdom",
      accountType: "Savings",
      status: "review",
      primary: false,
      iban: "GB33 BARC 2004 1533 1122 00",
      swift: "BARCGB22",
      routing: "20-04-15",
      branch: "London Victoria",
      accountHolder: "Association of British HealthTech Industries",
      notes: "Cash reserve · annual KYC refresh pending",
    },
  ];

  const advisors: CorporateAdvisor[] = [
    {
      id: "abhi-adv-dac",
      company: "DAC Beachcroft LLP",
      contact: "Helen Marsh (Partner)",
      category: "Lawyers",
      country: "United Kingdom",
      phone: "+44 20 7894 6000",
      email: "helen.marsh@dacbeachcroft.com",
      retainer: "£4,200 / month",
      status: "active",
      notes: "Corporate, employment, and membership governance counsel · London",
    },
    {
      id: "abhi-adv-kpmg",
      company: "KPMG UK",
      contact: "James Okafor",
      category: "Accountants",
      country: "United Kingdom",
      phone: "+44 20 7311 1000",
      email: "james.okafor@kpmg.co.uk",
      retainer: "£3,100 / month",
      status: "active",
      notes: "Management accounts, VAT, and Companies House filings · London",
    },
    {
      id: "abhi-adv-bdo",
      company: "BDO LLP",
      contact: "Priya Shah",
      category: "Auditors",
      country: "United Kingdom",
      phone: "+44 20 7486 5888",
      email: "priya.shah@bdo.co.uk",
      retainer: "Annual audit fee £22,000",
      status: "active",
      notes: "Statutory audit · FY2025/26 fieldwork scheduled Q4",
    },
    {
      id: "abhi-adv-hiscox",
      company: "Hiscox Insurance",
      contact: "Tom Bradley",
      category: "Insurance Brokers",
      country: "United Kingdom",
      phone: "+44 20 7448 6000",
      email: "tom.bradley@hiscox.com",
      retainer: "Broker fee on placement",
      status: "active",
      notes: "PI, cyber, and office contents · London",
    },
  ];

  const contracts: CorporateContract[] = [
    {
      id: "abhi-contract-aws",
      name: "AWS UK Cloud Services",
      supplier: "Amazon Web Services UK Ltd",
      type: "MSA",
      owner: "Jane Lewis",
      startDate: isoDaysFromNow(-540),
      expiryDate: isoDaysFromNow(42),
      value: "£72,000 / year",
      status: "expiring",
      summary: "Membership portal hosting, analytics, and event microsites (London region).",
      parties: "Association of British HealthTech Industries · Amazon Web Services UK Ltd",
      renewalNotes: "Renew before board finance committee in September.",
      documents: "AWS_UK_MSA_2025_signed.pdf",
      notes: "Committed spend ~£6k/month · eu-west-2",
    },
    {
      id: "abhi-contract-london-lease",
      name: "London HQ Office Lease",
      supplier: "Gray's Inn Estates Ltd",
      type: "Lease",
      owner: "Jane Lewis",
      startDate: isoDaysFromNow(-730),
      expiryDate: isoDaysFromNow(28),
      value: "£186,000 / year",
      status: "expiring",
      summary: "Gray's Inn Road HQ · 2 floors · 40 desks · member meeting suites.",
      parties: "Association of British HealthTech Industries · Gray's Inn Estates Ltd",
      renewalNotes: "Landlord offered 5-year extension at RPI +1%.",
      documents: "",
      notes: "Break clause at month 36 — retained",
    },
    {
      id: "abhi-contract-insurance",
      name: "Professional Indemnity & Cyber",
      supplier: "Hiscox Insurance",
      type: "Insurance",
      owner: "Richard Phillips",
      startDate: isoDaysFromNow(-120),
      expiryDate: isoDaysFromNow(245),
      value: "£18,400 / year",
      status: "active",
      summary: "£5M PI and cyber cover for association operations and member events.",
      parties: "Association of British HealthTech Industries · Hiscox Insurance Company Ltd",
      renewalNotes: "",
      documents: "Hiscox_PI_Cyber_2026.pdf",
      notes: "Broker: Hiscox London",
    },
    {
      id: "abhi-contract-m365",
      name: "Microsoft 365 E5 Enterprise",
      supplier: "Microsoft UK",
      type: "Supplier",
      owner: "Sarah Chen",
      startDate: isoDaysFromNow(-365),
      expiryDate: isoDaysFromNow(28),
      value: "£28,800 / year",
      status: "expiring",
      summary: "Enterprise productivity suite for ABHI staff and board collaborators.",
      parties: "Association of British HealthTech Industries · Microsoft Ltd",
      renewalNotes: "",
      documents: "M365_E5_Order_2025.pdf",
      notes: "32 seats · UK billing",
    },
    {
      id: "abhi-contract-excel",
      name: "ExCeL London Venue Framework",
      supplier: "ExCeL London",
      type: "Supplier",
      owner: "Jane Lewis",
      startDate: isoDaysFromNow(-200),
      expiryDate: isoDaysFromNow(160),
      value: "£95,000 / year",
      status: "active",
      summary: "Preferred venue rates for ABHI member conferences and working-group summits.",
      parties: "Association of British HealthTech Industries · ExCeL London",
      renewalNotes: "",
      documents: "ExCeL_Framework_2026.pdf",
      notes: "London Docklands",
    },
  ];

  const licences: CorporateLicence[] = [
    {
      id: "abhi-lic-m365",
      software: "Microsoft 365 E5",
      vendor: "Microsoft UK",
      licenceType: "Enterprise subscription",
      seats: 32,
      renewalDate: isoDaysFromNow(28),
      cost: "£28,800 / year",
      owner: "Sarah Chen",
      status: "expiring",
    },
    {
      id: "abhi-lic-figma",
      software: "Figma Organization",
      vendor: "Figma Inc.",
      licenceType: "Org plan",
      seats: 8,
      renewalDate: isoDaysFromNow(11),
      cost: "£2,880 / year",
      owner: "Sarah Chen",
      status: "expiring",
    },
    {
      id: "abhi-lic-github",
      software: "GitHub Team",
      vendor: "GitHub",
      licenceType: "Team",
      seats: 12,
      renewalDate: isoDaysFromNow(48),
      cost: "£2,400 / year",
      owner: "Richard Phillips",
      status: "expiring",
    },
    {
      id: "abhi-lic-zoom",
      software: "Zoom Workplace",
      vendor: "Zoom",
      licenceType: "Annual",
      seats: 40,
      renewalDate: isoDaysFromNow(165),
      cost: "£4,800 / year",
      owner: "Jane Lewis",
      status: "active",
    },
  ];

  const shareholders: CorporateShareholder[] = [];
  const optionPool: CorporateOptionPool = {
    authorised: 0,
    issued: 0,
    reserved: 0,
    lastUpdated: isoDaysFromNow(0),
  };
  const capital: CorporateCapital = {
    authorisedShareCapital: "Limited by guarantee",
    issuedShareCapital: "—",
    currency: "GBP",
  };

  const activity: CorporateActivityItem[] = [
    {
      id: "abhi-act-1",
      at: isoDaysFromNow(0),
      label: "Bank account updated",
      detail: "Barclays ABHI Reserves GBP — KYC refresh flagged for review",
    },
    {
      id: "abhi-act-2",
      at: isoDaysFromNow(-1),
      label: "Contract renewal due",
      detail: "London HQ Office Lease — Gray's Inn Estates Ltd",
    },
    {
      id: "abhi-act-3",
      at: isoDaysFromNow(-3),
      label: "Licence renewal due",
      detail: "Figma Organization — renewal in 11 days",
    },
    {
      id: "abhi-act-4",
      at: isoDaysFromNow(-5),
      label: "Office record updated",
      detail: "Cambridge Innovation Desk — headcount set to 4",
    },
    {
      id: "abhi-act-5",
      at: isoDaysFromNow(-8),
      label: "Advisor retained",
      detail: "DAC Beachcroft LLP — London corporate counsel",
    },
    {
      id: "abhi-act-6",
      at: isoDaysFromNow(-12),
      label: "Contract renewed",
      detail: "Professional Indemnity & Cyber — Hiscox Insurance",
    },
  ];

  return {
    offices,
    banks,
    advisors,
    contracts,
    shareholders,
    optionPool,
    capital,
    licences,
    activity,
  };
}

/** Projected pre-seed layout for OnwardAir — estimated FD of 10M shares, ~$1.7M raised. */
function seedOnwardAirState(): CorporateMockState {
  const company = "OnwardAir";
  const issueDate = isoDaysFromNow(-180);
  const shareholders: CorporateShareholder[] = [
    {
      id: "oa-sh-founders",
      company,
      shareholder: "Founding Team (Dr. Scott Parazynski & Core Team)",
      shareClass: "Ordinary",
      shares: 6_000_000,
      price: "—",
      issueDate,
      notes: "Common Stock (Vesting) · ~60% FD · CEO retains voting control through early FAA prototype testing",
    },
    {
      id: "oa-sh-1588",
      company,
      shareholder: "1588 Ventures (Rick Perez)",
      shareClass: "Preference",
      shares: 1_000_000,
      price: "~$0.75",
      issueDate,
      notes: "Preferred / Seed Common · ~10% FD · Lead strategic ~$750k · anchor advisory role",
    },
    {
      id: "oa-sh-burr",
      company,
      shareholder: "Cameron Burr",
      shareClass: "Ordinary",
      shares: 400_000,
      price: "~$0.625",
      issueDate,
      notes: "Angel Common · ~4% FD · Aviation angel ~$250k",
    },
    {
      id: "oa-sh-taylor",
      company,
      shareholder: "Dylan Taylor",
      shareClass: "Ordinary",
      shares: 400_000,
      price: "~$0.625",
      issueDate,
      notes: "Angel Common · ~4% FD · Aviation angel ~$250k",
    },
    {
      id: "oa-sh-network",
      company,
      shareholder: "Other Network / Advisory Notes",
      shareClass: "Preference",
      shares: 700_000,
      price: "—",
      issueDate,
      notes: "Convertible / Advisory · ~7% FD · network + advisory capital in pre-seed footprint",
    },
    {
      id: "oa-sh-esop",
      company,
      shareholder: "Employee Option Pool (ESOP)",
      shareClass: "Options",
      shares: 1_500_000,
      price: "—",
      issueDate,
      notes: "Unissued Options · ~15% FD · reserved for flight controls, aero, and defense-logistics hires",
    },
  ];

  return {
    offices: [
      {
        id: "oa-office-houston",
        name: "OnwardAir HQ",
        country: "United States",
        city: "Houston",
        address: "5207 Morningside Drive, Houston, TX 77005",
        manager: "Dr. Scott Parazynski",
        employees: 12,
        status: "active",
        phone: "",
        timezone: "America/Chicago",
      },
    ],
    banks: [],
    advisors: [
      {
        id: "oa-adv-vh",
        company: "Vinson & Elkins LLP",
        contact: "Amanda Reyes (Partner)",
        category: "Lawyers",
        country: "United States",
        phone: "+1 713 758 2222",
        email: "areyes@velaw.com",
        retainer: "$8,500 / month",
        status: "active",
        notes: "Corporate, financing, and aviation regulatory counsel · Houston",
      },
      {
        id: "oa-adv-pwc",
        company: "PwC US",
        contact: "David Okonkwo",
        category: "Accountants",
        country: "United States",
        phone: "+1 713 356 4000",
        email: "david.okonkwo@pwc.com",
        retainer: "$4,800 / month",
        status: "active",
        notes: "Management accounts, US tax filings, and audit readiness · Houston",
      },
      {
        id: "oa-adv-gt",
        company: "Grant Thornton LLP",
        contact: "Sarah Kim",
        category: "Auditors",
        country: "United States",
        phone: "+1 832 476 3600",
        email: "sarah.kim@us.gt.com",
        retainer: "Engagement-based",
        status: "active",
        notes: "Independent audit and assurance · Houston",
      },
      {
        id: "oa-adv-fish",
        company: "Fish & Richardson P.C.",
        contact: "Michael Torres",
        category: "IP Lawyers",
        country: "United States",
        phone: "+1 713 654 5300",
        email: "torres@fr.com",
        retainer: "$6,200 / month",
        status: "active",
        notes: "Vertex VTOL™ and FLEX Pod™ patent portfolio · Houston / national",
      },
      {
        id: "oa-adv-aon",
        company: "Aon Risk Services",
        contact: "Lauren Brooks",
        category: "Insurance Brokers",
        country: "United States",
        phone: "+1 713 968 2000",
        email: "lauren.brooks@aon.com",
        retainer: "Commission-based",
        status: "active",
        notes: "Aviation, D&O, and product liability programmes",
      },
    ],
    contracts: [
      {
        id: "oa-contract-lease",
        name: "Houston HQ Office Lease",
        supplier: "Morningside Drive Properties LLC",
        type: "Lease",
        owner: "Dr. Scott Parazynski",
        startDate: isoDaysFromNow(-400),
        expiryDate: isoDaysFromNow(320),
        value: "$84,000 / year",
        status: "active",
        summary:
          "Registered office and primary engineering workspace at 5207 Morningside Drive, Houston, TX 77005.",
        parties: "OnwardAir · Morningside Drive Properties LLC",
        renewalNotes: "Review option to renew 90 days before expiry.",
        documents: "OA_Houston_Lease_2025.pdf",
        notes: "Supports HQ operations and board meetings",
      },
      {
        id: "oa-contract-aws",
        name: "AWS Cloud Infrastructure MSA",
        supplier: "Amazon Web Services, Inc.",
        type: "MSA",
        owner: "Rick Perez",
        startDate: isoDaysFromNow(-280),
        expiryDate: isoDaysFromNow(85),
        value: "$48,000 / year",
        status: "active",
        summary:
          "Cloud hosting for engineering simulation, investor data rooms, and Unit311 tenant workloads (us-east-1).",
        parties: "OnwardAir · Amazon Web Services, Inc.",
        renewalNotes: "Align committed spend with Seed raise runway review.",
        documents: "AWS_OA_MSA_2026.pdf",
        notes: "Billing currency USD",
      },
      {
        id: "oa-contract-faa",
        name: "FAA Certification Counsel Engagement",
        supplier: "AeroLaw Partners PLLC",
        type: "Other",
        owner: "GEN Duncan McNabb",
        startDate: isoDaysFromNow(-120),
        expiryDate: isoDaysFromNow(245),
        value: "$180,000 / engagement",
        status: "active",
        summary:
          "Scoped engagement for Vertex VTOL experimental / type certification pathway advisory and FAA interactions.",
        parties: "OnwardAir · AeroLaw Partners PLLC",
        renewalNotes: "Board to reassess scope after first hover demo.",
        documents: "OA_FAA_Counsel_SOW_2026.pdf",
        notes: "Approved at Q4 2025 board",
      },
    ],
    shareholders,
    optionPool: {
      authorised: 1_500_000,
      issued: 0,
      reserved: 1_500_000,
      lastUpdated: isoDaysFromNow(0),
    },
    capital: {
      authorisedShareCapital: "10,000,000 shares (projected FD)",
      issuedShareCapital: "8,500,000 allotted · 1,500,000 ESOP unissued",
      currency: "USD",
    },
    licences: [],
    activity: [
      {
        id: "oa-act-cap-1",
        at: isoDaysFromNow(0),
        label: "Share capital updated",
        detail:
          "Projected pre-seed cap table loaded — $1.7M raised to date · 10,000,000 authorised FD shares (estimated).",
      },
      {
        id: "oa-act-cap-2",
        at: isoDaysFromNow(0),
        label: "Option pool updated",
        detail: "ESOP reserved at 1,500,000 shares (15% fully diluted).",
      },
      {
        id: "oa-act-cap-3",
        at: isoDaysFromNow(0),
        label: "Shareholder added",
        detail: "Founding Team — 6,000,000 Ordinary (vesting).",
      },
      {
        id: "oa-act-adv-1",
        at: isoDaysFromNow(0),
        label: "Advisor added",
        detail: "Vinson & Elkins LLP — Lawyers",
      },
      {
        id: "oa-act-contract-1",
        at: isoDaysFromNow(0),
        label: "Contract added",
        detail: "Houston HQ Office Lease — Morningside Drive Properties LLC",
      },
    ],
  };
}

function seedTalantonState(): CorporateMockState {
  const advisors: CorporateAdvisor[] = [
    {
      id: "ti-adv-bowmans",
      company: "Bowmans Kenya LLP",
      contact: "Grace Wanjiru (Partner)",
      category: "Lawyers",
      country: "Kenya",
      phone: "+254 20 289 9000",
      email: "grace.wanjiru@bowmanslaw.com",
      retainer: "$4,800 / month",
      status: "active",
      notes: "Fund documentation, portfolio company governance, and East Africa regulatory counsel.",
    },
    {
      id: "ti-adv-deloitte",
      company: "Deloitte East Africa",
      contact: "James Mwangi",
      category: "Accountants",
      country: "Kenya",
      phone: "+254 20 288 6000",
      email: "james.mwangi@deloitte.com",
      retainer: "$3,600 / month",
      status: "active",
      notes: "Management accounts, fund reporting, and portfolio company finance support · Nairobi.",
    },
    {
      id: "ti-adv-kpmg",
      company: "KPMG Kenya",
      contact: "Sarah Ochieng",
      category: "Auditors",
      country: "Kenya",
      phone: "+254 20 327 0000",
      email: "sarah.ochieng@kpmg.co.ke",
      retainer: "Annual audit fee $38,000",
      status: "active",
      notes: "Talanton Impact Fund I statutory audit · FY2025 fieldwork scheduled Q4.",
    },
    {
      id: "ti-adv-marsh",
      company: "Marsh East Africa",
      contact: "David Simms",
      category: "Insurance Brokers",
      country: "United States",
      phone: "+1 610 293 4100",
      email: "david.simms@marsh.com",
      retainer: "Broker fee on placement",
      status: "active",
      notes: "D&O, PI, and cyber cover for fund manager and portfolio operations · USD policy.",
    },
    {
      id: "ti-adv-pkf",
      company: "PKF Kenya",
      contact: "Peter Kamau",
      category: "Tax Advisors",
      country: "Kenya",
      phone: "+254 20 271 4000",
      email: "peter.kamau@pkf.co.ke",
      retainer: "$2,200 / quarter",
      status: "active",
      notes: "Cross-border tax structuring for portfolio exits and LP distributions.",
    },
  ];

  const contracts: CorporateContract[] = [
    {
      id: "ti-contract-nairobi-lease",
      name: "Nairobi Office Lease",
      supplier: "Longonot Place Properties Ltd",
      type: "Lease",
      owner: "Kenneth Muchina",
      startDate: isoDaysFromNow(-540),
      expiryDate: isoDaysFromNow(56),
      value: "$96,000 / year",
      status: "expiring",
      summary: "East Africa office · 12 desks · portfolio support and local deal team.",
      parties: "Talanton Impact · Longonot Place Properties Ltd",
      renewalNotes: "Landlord offered 3-year extension with 4% annual uplift.",
      documents: "TI_Nairobi_Lease_2024_signed.pdf",
      notes: "Break clause at month 36 · USD-equivalent billing",
    },
    {
      id: "ti-contract-m365",
      name: "Microsoft 365 Enterprise",
      supplier: "Microsoft Corporation",
      type: "MSA",
      owner: "David Simms",
      startDate: isoDaysFromNow(-365),
      expiryDate: isoDaysFromNow(120),
      value: "$18,600 / year",
      status: "active",
      summary: "Email, Teams, SharePoint, and security for fund and portfolio collaboration.",
      parties: "Talanton Impact · Microsoft Corporation",
      renewalNotes: "Annual true-up in October.",
      documents: "Microsoft_EA_Talanton_2025.pdf",
      notes: "~85 seats across Philadelphia and Nairobi",
    },
    {
      id: "ti-contract-aws",
      name: "AWS Cloud & Data Platform",
      supplier: "Amazon Web Services",
      type: "MSA",
      owner: "Kenneth Muchina",
      startDate: isoDaysFromNow(-420),
      expiryDate: isoDaysFromNow(200),
      value: "$42,000 / year",
      status: "active",
      summary: "Portfolio intelligence, document rooms, and impact reporting infrastructure.",
      parties: "Talanton Impact · Amazon Web Services",
      renewalNotes: "Committed spend review with CTO in Q1.",
      documents: "AWS_Enterprise_Discount_Talanton.pdf",
      notes: "Primary region us-east-1 · portfolio analytics workloads",
    },
    {
      id: "ti-contract-salesforce",
      name: "Salesforce Impact CRM",
      supplier: "Salesforce.com Inc",
      type: "Supplier",
      owner: "Harry Turner",
      startDate: isoDaysFromNow(-180),
      expiryDate: isoDaysFromNow(310),
      value: "$28,800 / year",
      status: "active",
      summary: "Pipeline, LP relations, and portfolio company engagement tracking.",
      parties: "Talanton Impact · Salesforce.com Inc",
      renewalNotes: "Non-profit / impact pricing tier locked for 24 months.",
      documents: "",
      notes: "Integrated with marketing & stories newsletter module",
    },
    {
      id: "ti-contract-legal-retainer",
      name: "Fund Legal Retainer — Bowmans",
      supplier: "Bowmans Kenya LLP",
      type: "Other",
      owner: "Harry Turner",
      startDate: isoDaysFromNow(-90),
      expiryDate: isoDaysFromNow(275),
      value: "$57,600 / year",
      status: "active",
      summary: "Ongoing fund counsel for investments, side letters, and board governance.",
      parties: "Talanton Impact · Bowmans Kenya LLP",
      renewalNotes: "Includes quarterly portfolio legal health review.",
      documents: "Bowmans_Fund_Retainer_2026.pdf",
      notes: "Billed monthly in USD",
    },
  ];

  return {
    offices: [
      {
        id: "ti-office-hq",
        name: "Talanton Impact HQ",
        country: "United States",
        city: "Newtown Square",
        address: "Newtown Square, PA",
        manager: "David Simms",
        employees: 15,
        status: "active",
        phone: "+1 610 293 4100",
        timezone: "America/New_York",
      },
      {
        id: "ti-office-nairobi",
        name: "East Africa Office",
        country: "Kenya",
        city: "Nairobi",
        address: "Longonot Place, Nairobi",
        manager: "Kenneth Muchina",
        employees: 8,
        status: "active",
        phone: "+254 20 289 9000",
        timezone: "Africa/Nairobi",
      },
    ],
    banks: [],
    advisors,
    contracts,
    shareholders: [],
    optionPool: {
      authorised: 0,
      issued: 0,
      reserved: 0,
      lastUpdated: new Date().toISOString().slice(0, 10),
    },
    capital: {
      authorisedShareCapital: "0",
      issuedShareCapital: "0",
      currency: "USD",
    },
    licences: [],
    activity: [
      {
        id: "ti-act-1",
        at: new Date().toISOString(),
        label: "Professional advisors loaded",
        detail: "Bowmans, Deloitte East Africa, KPMG Kenya, Marsh, and PKF on retainer.",
      },
      {
        id: "ti-act-2",
        at: isoDaysFromNow(-2),
        label: "Contract added",
        detail: "Nairobi Office Lease — Longonot Place Properties Ltd",
      },
    ],
  };
}

function seedCustomerWorkspaceEmptyState(): CorporateMockState {
  return {
    offices: [],
    banks: [],
    advisors: [],
    contracts: [],
    shareholders: [],
    optionPool: {
      authorised: 0,
      issued: 0,
      reserved: 0,
      lastUpdated: isoDaysFromNow(0),
    },
    capital: {
      authorisedShareCapital: "0",
      issuedShareCapital: "0",
      currency: "USD",
    },
    licences: [],
    activity: [],
  };
}

function seedState(): CorporateMockState {
  if (typeof window !== "undefined") {
    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (isBrowserAbhiSurface()) {
        return seedAbhiState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (isBrowserOnwardAirSurface()) {
        return seedOnwardAirState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserTalantonImpactSurface } =
        require("@/lib/talanton-surface") as typeof import("@/lib/talanton-surface");
      if (isBrowserTalantonImpactSurface()) {
        return seedTalantonState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCorpCentreSurface } =
        require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
      if (isBrowserCorpCentreSurface()) {
        return seedCorpCentreState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserDemoSurface, getDemoEnterpriseFixtures } = require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (isBrowserDemoSurface()) {
        const fixtures = getDemoEnterpriseFixtures();
        const offices: CorporateOffice[] = fixtures.offices.map((office) => ({
          id: office.id,
          name: `${office.city} Office`,
          country: office.country,
          city: office.city,
          address: office.address,
          manager: "Leadership Team",
          employees: office.headcountTarget,
          status: "active",
          phone: fixtures.company.phone,
          timezone: office.timezone,
        }));
        const banks: CorporateBankAccount[] = fixtures.wise.balances.map((balance, index) => ({
          id: `bank-${balance.currency.toLowerCase()}-${balance.id}`,
          bank: "Wise Business (simulated)",
          accountName: balance.name,
          currency: balance.currency,
          country: balance.regionLabel,
          accountType: balance.type === "SAVINGS" ? "Savings" : "Current",
          status: "active",
          primary: index === 0,
          iban: balance.accountRef,
          swift: "TRWIGB2L",
          routing: "",
          branch: balance.regionLabel,
          accountHolder: fixtures.company.legalName,
          notes: "Demo simulated Northstar treasury balance",
        }));
        const advisors: CorporateAdvisor[] = (
          require("@/lib/demo/northstar-corporate-advisors") as typeof import("@/lib/demo/northstar-corporate-advisors")
        ).NORTHSTAR_CORPORATE_ADVISORS.map((row) => ({ ...row }));
        const contracts: CorporateContract[] = (
          require("@/lib/demo/northstar-corporate-contracts") as typeof import("@/lib/demo/northstar-corporate-contracts")
        ).NORTHSTAR_CORPORATE_CONTRACTS.map((row) => ({ ...row }));
        const licences: CorporateLicence[] = (fixtures.licences ?? []).map((row) => ({
          id: row.id,
          software: row.name,
          vendor: row.vendor,
          licenceType: "Subscription",
          seats: row.seats,
          renewalDate: row.renewalDate,
          cost: row.cost,
          owner: row.owner,
          status: licenceStatusFromRenewal(
            row.renewalDate,
            row.status as CorporateLicence["status"],
          ),
        }));
        const shareholders: CorporateShareholder[] = (fixtures.shareholders ?? []).map((row) => ({
          id: row.id,
          company: fixtures.company.legalName,
          shareholder: row.name,
          shareClass: (row.class.includes("Preferred")
            ? "Preference"
            : row.class.includes("Option")
              ? "Options"
              : "Ordinary") as CorporateShareholder["shareClass"],
          shares: row.shares,
          price: "£1.00",
          issueDate: isoDaysFromNow(-800),
          notes: `${row.type} · ${row.percent}%`,
        }));
        return {
          offices,
          banks,
          advisors,
          contracts,
          shareholders,
          optionPool: {
            authorised: 10_000_000,
            issued: 6_400_000,
            reserved: 1_200_000,
            lastUpdated: new Date().toISOString().slice(0, 10),
          },
          capital: {
            authorisedShareCapital: "10,000,000",
            issuedShareCapital: "6,400,000",
            currency: "GBP",
          },
          licences,
          activity: [
            {
              id: "act-demo-1",
              at: new Date().toISOString(),
              label: "Demo company loaded",
              detail: `${fixtures.company.tradingName} corporate profile (Demo workspace fixtures).`,
            },
            {
              id: "act-demo-2",
              at: isoDaysFromNow(-1),
              label: "Bank account synced",
              detail: "Wise simulated balances refreshed for Northstar treasury.",
            },
          ],
        };
      }
    } catch {
      // Fall through to Internal mock seed when Demo fixtures unavailable.
    }

    try {
      const { isBrowserSaecSurface } =
        require("@/lib/saec-surface") as typeof import("@/lib/saec-surface");
      if (isBrowserSaecSurface()) {
        const { buildSaecCorporateMockState } =
          require("@/lib/saec/demo/corporate-state") as typeof import("@/lib/saec/demo/corporate-state");
        return buildSaecCorporateMockState();
      }
    } catch {
      // Fall through.
    }

    try {
      const { isBrowserCustomerWorkspaceSurface } =
        require("@/lib/customer-workspace-surface") as typeof import("@/lib/customer-workspace-surface");
      if (isBrowserCustomerWorkspaceSurface()) {
        return seedCustomerWorkspaceEmptyState();
      }
    } catch {
      // Fall through to legacy default seed.
    }
  }

  const offices: CorporateOffice[] = [
    {
      id: "office-bcn-hq",
      name: "Barcelona HQ",
      country: "Spain",
      city: "Barcelona",
      address: "Carrer de Pallars 108, 08018 Barcelona",
      manager: "Paul Fotheringham",
      employees: 18,
      status: "active",
      phone: "+34 932 123 456",
      timezone: "Europe/Madrid",
    },
    {
      id: "office-mad-sales",
      name: "Madrid Sales Hub",
      country: "Spain",
      city: "Madrid",
      address: "Paseo de la Castellana 95, 28046 Madrid",
      manager: "Ashley Cole",
      employees: 6,
      status: "active",
      phone: "+34 915 234 567",
      timezone: "Europe/Madrid",
    },
    {
      id: "office-lon-rep",
      name: "London Representative Office",
      country: "United Kingdom",
      city: "London",
      address: "30 St Mary Axe, London EC3A 8BF",
      manager: "Saffin Khan",
      employees: 3,
      status: "active",
      phone: "+44 20 7123 4567",
      timezone: "Europe/London",
    },
    {
      id: "office-valencia-old",
      name: "Valencia Satellite (closed)",
      country: "Spain",
      city: "Valencia",
      address: "Calle Colón 12, 46004 Valencia",
      manager: "",
      employees: 0,
      status: "archived",
      phone: "",
      timezone: "Europe/Madrid",
    },
  ];

  const banks: CorporateBankAccount[] = [
    {
      id: "bank-caixa-eur",
      bank: "CaixaBank",
      accountName: "Unit311 Operations EUR",
      currency: "EUR",
      country: "Spain",
      accountType: "Current",
      status: "active",
      primary: true,
      iban: "ES91 2100 0418 4502 0005 1332",
      swift: "CAIXESBBXXX",
      routing: "",
      branch: "Barcelona Diagonal",
      accountHolder: "Nakama Ventures SL",
      notes: "Primary operating account · payroll and supplier payments",
    },
    {
      id: "bank-barclays-gbp",
      bank: "Barclays",
      accountName: "Unit311 UK Client Receipts",
      currency: "GBP",
      country: "United Kingdom",
      accountType: "Multi-currency",
      status: "active",
      primary: false,
      iban: "GB29 NWBK 6016 1331 9268 19",
      swift: "BARCGB22",
      routing: "20-00-00",
      branch: "London Canary Wharf",
      accountHolder: "Unit311 UK Ltd",
      notes: "GBP client invoicing and UK payroll",
    },
    {
      id: "bank-jpm-usd",
      bank: "J.P. Morgan",
      accountName: "Unit311 Treasury USD",
      currency: "USD",
      country: "United States",
      accountType: "Treasury",
      status: "review",
      primary: false,
      iban: "",
      swift: "CHASUS33",
      routing: "021000021",
      branch: "New York Corporate",
      accountHolder: "Nakama Ventures SL",
      notes: "Annual KYC refresh pending · US vendor settlements",
    },
    {
      id: "bank-santander-eur",
      bank: "Banco Santander",
      accountName: "Nakama Reserves EUR",
      currency: "EUR",
      country: "Spain",
      accountType: "Savings",
      status: "active",
      primary: false,
      iban: "ES76 0049 0001 5023 4567 8900",
      swift: "BSCHESMMXXX",
      routing: "",
      branch: "Madrid Castellana",
      accountHolder: "Nakama Ventures SL",
      notes: "Cash reserve · 3-month notice on large withdrawals",
    },
  ];

  const advisors: CorporateAdvisor[] = [
    {
      id: "adv-cuatrecasas",
      company: "Cuatrecasas",
      contact: "Laura Mendoza (Partner)",
      category: "Lawyers",
      country: "Spain",
      phone: "+34 934 032 000",
      email: "l.mendoza@cuatrecasas.com",
      retainer: "€4,500 / month",
      status: "active",
      notes: "Corporate, employment, and commercial contracts",
    },
    {
      id: "adv-bdo",
      company: "BDO Spain",
      contact: "Marc Vidal",
      category: "Accountants",
      country: "Spain",
      phone: "+34 934 424 200",
      email: "marc.vidal@bdo.es",
      retainer: "€2,800 / month",
      status: "active",
      notes: "Monthly management accounts and VAT filings",
    },
    {
      id: "adv-kpmg",
      company: "KPMG Abogados",
      contact: "Elena Sánchez",
      category: "Auditors",
      country: "Spain",
      phone: "+34 915 663 100",
      email: "elena.sanchez@kpmg.es",
      retainer: "Annual audit fee €18,000",
      status: "active",
      notes: "Statutory audit · FY2025 fieldwork scheduled Q4",
    },
    {
      id: "adv-grant-thornton",
      company: "Grant Thornton",
      contact: "David Puig",
      category: "Tax Advisors",
      country: "Spain",
      phone: "+34 932 688 400",
      email: "david.puig@gt.es",
      retainer: "€1,200 / quarter",
      status: "active",
      notes: "Transfer pricing and cross-border tax planning",
    },
    {
      id: "adv-marsh",
      company: "Marsh España",
      contact: "Isabel Romero",
      category: "Insurance Brokers",
      country: "Spain",
      phone: "+34 915 724 000",
      email: "isabel.romero@marsh.com",
      retainer: "Broker fee on placement",
      status: "active",
      notes: "D&O, cyber, and office contents policies",
    },
    {
      id: "adv-cosec",
      company: "Iberian Company Secretarial",
      contact: "James Whitfield",
      category: "Corporate Secretaries",
      country: "United Kingdom",
      phone: "+44 20 7946 0958",
      email: "j.whitfield@iberiancosec.co.uk",
      retainer: "£650 / month",
      status: "inactive",
      notes: "Former UK subsidiary filings · retained for archive access",
    },
  ];

  const contracts: CorporateContract[] = [
    {
      id: "contract-aws-msa",
      name: "AWS Enterprise Discount Program",
      supplier: "Amazon Web Services EMEA",
      type: "MSA",
      owner: "Hannes Weber",
      startDate: isoDaysFromNow(-540),
      expiryDate: isoDaysFromNow(42),
      value: "€84,000 / year",
      status: "expiring",
      summary: "Cloud infrastructure hosting for Unit311 platform and staging environments.",
      parties: "Nakama Ventures SL · AWS EMEA SARL",
      renewalNotes: "Negotiate 12-month EDP renewal before August committee.",
      documents: "AWS_EDP_2024_signed.pdf",
      notes: "Committed spend €7k/month",
    },
    {
      id: "contract-bcn-lease",
      name: "Barcelona HQ Office Lease",
      supplier: "Pallars 108 Properties SL",
      type: "Lease",
      owner: "Paul Fotheringham",
      startDate: isoDaysFromNow(-730),
      expiryDate: isoDaysFromNow(28),
      value: "€18,600 / year",
      status: "expiring",
      summary: "3rd floor flex office · 24 desks · break-out room included.",
      parties: "Nakama Ventures SL · Pallars 108 Properties SL",
      renewalNotes: "Landlord offered 3-year extension at +4% CPI.",
      documents: "",
      notes: "Break clause at 24 months — exercised option retained",
    },
    {
      id: "contract-dno-insurance",
      name: "Directors & Officers Liability",
      supplier: "Zurich Insurance",
      type: "Insurance",
      owner: "Stefan Braun",
      startDate: isoDaysFromNow(-120),
      expiryDate: isoDaysFromNow(245),
      value: "€12,400 / year",
      status: "active",
      summary: "€2M D&O cover for board and senior management.",
      parties: "Nakama Ventures SL · Zurich Insurance plc",
      renewalNotes: "",
      documents: "Zurich_DO_Policy_2026.pdf",
      notes: "Broker: Marsh España",
    },
    {
      id: "contract-hubspot",
      name: "HubSpot CRM Platform",
      supplier: "HubSpot Ireland Ltd",
      type: "Supplier",
      owner: "Ashley Cole",
      startDate: isoDaysFromNow(-365),
      expiryDate: isoDaysFromNow(180),
      value: "€14,400 / year",
      status: "active",
      summary: "Sales Hub Professional · 10 seats · marketing add-on.",
      parties: "Nakama Ventures SL · HubSpot Ireland Ltd",
      renewalNotes: "",
      documents: "HubSpot_Order_Form_2025.pdf",
      notes: "",
    },
    {
      id: "contract-ms-nda",
      name: "Microsoft Partner NDA",
      supplier: "Microsoft Ireland Operations Ltd",
      type: "NDA",
      owner: "Hannes Weber",
      startDate: isoDaysFromNow(-400),
      expiryDate: isoDaysFromNow(-18),
      value: "—",
      status: "expired",
      summary: "Mutual NDA for Azure marketplace co-sell discussions.",
      parties: "Nakama Ventures SL · Microsoft Ireland Operations Ltd",
      renewalNotes: "Legal to re-issue before next partner review.",
      documents: "MS_NDA_2024.pdf",
      notes: "",
    },
    {
      id: "contract-employment-template",
      name: "Standard Employment Agreement Template",
      supplier: "Cuatrecasas (internal)",
      type: "Employment",
      owner: "Ana Torres",
      startDate: isoDaysFromNow(-30),
      expiryDate: isoDaysFromNow(335),
      value: "—",
      status: "draft",
      summary: "Updated Spanish employment contract template for 2026 hires.",
      parties: "Nakama Ventures SL",
      renewalNotes: "Awaiting final HR and legal sign-off.",
      documents: "",
      notes: "Replaces 2023 template",
    },
  ];

  const shareholders: CorporateShareholder[] = [
    {
      id: "sh-paul",
      company: "Nakama Ventures SL",
      shareholder: "Paul Fotheringham",
      shareClass: "Ordinary",
      shares: 450_000,
      price: "€0.85",
      issueDate: isoDaysFromNow(-1825),
      notes: "Founder · CEO",
    },
    {
      id: "sh-hannes",
      company: "Nakama Ventures SL",
      shareholder: "Hannes Weber",
      shareClass: "Ordinary",
      shares: 300_000,
      price: "€0.85",
      issueDate: isoDaysFromNow(-1825),
      notes: "Founder · CTO",
    },
    {
      id: "sh-ashley",
      company: "Nakama Ventures SL",
      shareholder: "Ashley Cole",
      shareClass: "Ordinary",
      shares: 100_000,
      price: "€1.20",
      issueDate: isoDaysFromNow(-540),
      notes: "Seed investor · board observer",
    },
    {
      id: "sh-stefan",
      company: "Nakama Ventures SL",
      shareholder: "Stefan Braun Holdings SL",
      shareClass: "Preference",
      shares: 100_000,
      price: "€2.50",
      issueDate: isoDaysFromNow(-365),
      notes: "Series Seed · 1× non-participating preference",
    },
    {
      id: "sh-esop",
      company: "Nakama Ventures SL",
      shareholder: "Employee Option Pool",
      shareClass: "Options",
      shares: 50_000,
      price: "€0.85",
      issueDate: isoDaysFromNow(-730),
      notes: "Unallocated ESOP reserve on cap table",
    },
  ];

  const optionPool: CorporateOptionPool = {
    authorised: 150_000,
    issued: 45_000,
    reserved: 85_000,
    lastUpdated: isoDaysFromNow(-5),
  };

  const capital: CorporateCapital = {
    authorisedShareCapital: "€1,000,000",
    issuedShareCapital: "€850,000",
    currency: "EUR",
  };

  const licences: CorporateLicence[] = [
    {
      id: "lic-m365",
      software: "Microsoft 365 E5",
      vendor: "Microsoft",
      licenceType: "Enterprise subscription",
      seats: 32,
      renewalDate: isoDaysFromNow(28),
      cost: "€9,600 / year",
      owner: "Hannes Weber",
      status: "expiring",
    },
    {
      id: "lic-figma",
      software: "Figma Organization",
      vendor: "Figma Inc.",
      licenceType: "Org plan",
      seats: 12,
      renewalDate: isoDaysFromNow(11),
      cost: "€4,320 / year",
      owner: "Lucía Fernández",
      status: "expiring",
    },
    {
      id: "lic-github",
      software: "GitHub Enterprise Cloud",
      vendor: "GitHub",
      licenceType: "Enterprise",
      seats: 24,
      renewalDate: isoDaysFromNow(48),
      cost: "€7,200 / year",
      owner: "Hannes Weber",
      status: "expiring",
    },
    {
      id: "lic-slack",
      software: "Slack Business+",
      vendor: "Salesforce",
      licenceType: "Annual",
      seats: 28,
      renewalDate: isoDaysFromNow(165),
      cost: "€5,040 / year",
      owner: "Paul Fotheringham",
      status: "active",
    },
    {
      id: "lic-adobe",
      software: "Adobe Creative Cloud Teams",
      vendor: "Adobe",
      licenceType: "Teams",
      seats: 6,
      renewalDate: isoDaysFromNow(-12),
      cost: "€2,160 / year",
      owner: "Lucía Fernández",
      status: "expired",
    },
  ];

  const activity: CorporateActivityItem[] = [
    {
      id: "act-1",
      at: isoDaysFromNow(0),
      label: "Bank account updated",
      detail: "J.P. Morgan USD — KYC refresh flagged for review",
    },
    {
      id: "act-2",
      at: isoDaysFromNow(-1),
      label: "Contract added",
      detail: "Employment Agreement Template — draft",
    },
    {
      id: "act-3",
      at: isoDaysFromNow(-3),
      label: "Licence renewal due",
      detail: "Figma Organization — renewal in 11 days",
    },
    {
      id: "act-4",
      at: isoDaysFromNow(-5),
      label: "Shareholder record updated",
      detail: "Stefan Braun Holdings SL — Preference shares",
    },
    {
      id: "act-5",
      at: isoDaysFromNow(-8),
      label: "Office archived",
      detail: "Valencia Satellite — lease ended",
    },
    {
      id: "act-6",
      at: isoDaysFromNow(-12),
      label: "Advisor added",
      detail: "Grant Thornton — Tax Advisors",
    },
    {
      id: "act-7",
      at: isoDaysFromNow(-18),
      label: "Contract renewed",
      detail: "Directors & Officers Liability — Zurich Insurance",
    },
  ];

  return {
    offices,
    banks,
    advisors,
    contracts,
    shareholders,
    optionPool,
    capital,
    licences,
    activity,
  };
}

let state: CorporateMockState = seedState();
let seededHost: string | null = typeof window !== "undefined" ? window.location.hostname : "ssr";
const listeners = new Set<Listener>();

function currentHostKey() {
  if (typeof window === "undefined") return "ssr";
  return window.location.hostname || "browser";
}

function ensureState(): CorporateMockState {
  const hostKey = currentHostKey();
  if (typeof window !== "undefined" && seededHost !== hostKey) {
    state = seedState();
    seededHost = hostKey;
  } else if (typeof window !== "undefined") {
    // SSR can initialize Internal mock; reseed once we detect Demo/CorpCentre/ABHI host leakage.
    try {
      const { isBrowserCorpCentreSurface } =
        require("@/lib/corpcentre-surface") as typeof import("@/lib/corpcentre-surface");
      if (
        isBrowserCorpCentreSurface() &&
        (state.banks.some((bank) => /unit311|nakama/i.test(`${bank.accountName} ${bank.accountHolder}`)) ||
          state.banks.every((bank) => bank.balance == null))
      ) {
        state = seedState();
        seededHost = hostKey;
      }
    } catch {
      /* ignore */
    }
    try {
      const { isBrowserDemoSurface } =
        require("@/lib/demo-enterprise") as typeof import("@/lib/demo-enterprise");
      if (
        isBrowserDemoSurface() &&
        state.banks.some((bank) => /unit311|nakama/i.test(`${bank.accountName} ${bank.accountHolder}`))
      ) {
        state = seedState();
        seededHost = hostKey;
      }
    } catch {
      /* ignore */
    }
    try {
      const { isBrowserAbhiSurface } =
        require("@/lib/abhi-surface") as typeof import("@/lib/abhi-surface");
      if (
        isBrowserAbhiSurface() &&
        (state.offices.some((office) => /barcelona|madrid|spain/i.test(`${office.city} ${office.country}`)) ||
          state.banks.some((bank) =>
            /unit311|nakama|usd|eur|j\.?\s*p\.?\s*morgan|caixabank/i.test(
              `${bank.accountName} ${bank.accountHolder} ${bank.bank} ${bank.currency}`,
            ),
          ))
      ) {
        state = seedState();
        seededHost = hostKey;
      }
    } catch {
      /* ignore */
    }
    try {
      const { isBrowserOnwardAirSurface } =
        require("@/lib/onwardair-surface") as typeof import("@/lib/onwardair-surface");
      if (
        isBrowserOnwardAirSurface() &&
        (state.shareholders.some((row) =>
          /nakama|paul fotheringham|hannes weber|meridian|ashley cole|stefan braun/i.test(
            `${row.company} ${row.shareholder}`,
          ),
        ) ||
          (state.shareholders.length > 0 &&
            !state.shareholders.some((row) => String(row.id).startsWith("oa-sh-"))) ||
          state.advisors.length === 0 ||
          state.contracts.length === 0 ||
          !state.offices.some((office) => /morningside/i.test(office.address)))
      ) {
        state = seedState();
        seededHost = hostKey;
      }
    } catch {
      /* ignore */
    }
    try {
      const { isBrowserCustomerWorkspaceSurface } =
        require("@/lib/customer-workspace-surface") as typeof import("@/lib/customer-workspace-surface");
      if (
        isBrowserCustomerWorkspaceSurface() &&
        (state.shareholders.some((row) =>
          /nakama|paul fotheringham|hannes weber|stefan braun|ashley cole/i.test(
            `${row.company} ${row.shareholder}`,
          ),
        ) ||
          state.capital.currency === "EUR" ||
          state.offices.some((office) => /barcelona|madrid|valencia/i.test(`${office.city} ${office.country}`)))
      ) {
        state = seedState();
        seededHost = hostKey;
      }
    } catch {
      /* ignore */
    }
  }
  return state;
}

function emit() {
  for (const listener of listeners) listener();
}

function pushActivity(label: string, detail: string) {
  ensureState();
  state = {
    ...state,
    activity: [
      { id: uid("act"), at: isoDaysFromNow(0), label, detail },
      ...state.activity,
    ].slice(0, 40),
  };
}

export function subscribeCorporateMockStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getCorporateMockSnapshot(): CorporateMockState {
  return ensureState();
}

export function resetCorporateMockStore() {
  state = seedState();
  seededHost = currentHostKey();
  emit();
}

export function listCorporateActivity() {
  return ensureState().activity;
}

/* —— Offices —— */

export function upsertOffice(input: Partial<CorporateOffice> & { id?: string }) {
  const existing = input.id ? state.offices.find((item) => item.id === input.id) : null;
  const next: CorporateOffice = {
    id: existing?.id ?? uid("office"),
    name: input.name ?? existing?.name ?? "New office",
    country: input.country ?? existing?.country ?? "Spain",
    city: input.city ?? existing?.city ?? "Barcelona",
    address: input.address ?? existing?.address ?? "",
    manager: input.manager ?? existing?.manager ?? "",
    employees: input.employees ?? existing?.employees ?? 0,
    status: input.status ?? existing?.status ?? "active",
    phone: input.phone ?? existing?.phone ?? "",
    timezone: input.timezone ?? existing?.timezone ?? "Europe/Madrid",
  };
  state = {
    ...state,
    offices: existing
      ? state.offices.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.offices],
  };
  pushActivity(existing ? "Office updated" : "Office added", `${next.name} — ${next.city}`);
  emit();
  return next;
}

export function archiveOffice(id: string) {
  state = {
    ...state,
    offices: state.offices.map((office) =>
      office.id === id ? { ...office, status: "archived" } : office,
    ),
  };
  const office = state.offices.find((item) => item.id === id);
  if (office) pushActivity("Office archived", `${office.name} — ${office.city}`);
  emit();
}

export function deleteOffice(id: string) {
  const office = state.offices.find((item) => item.id === id);
  state = { ...state, offices: state.offices.filter((item) => item.id !== id) };
  if (office) pushActivity("Office deleted", `${office.name} — ${office.city}`);
  emit();
}

/* —— Banks —— */

export function upsertBankAccount(input: Partial<CorporateBankAccount> & { id?: string }) {
  const existing = input.id ? state.banks.find((item) => item.id === input.id) : null;
  const next: CorporateBankAccount = {
    id: existing?.id ?? uid("bank"),
    bank: input.bank ?? existing?.bank ?? "Bank",
    accountName: input.accountName ?? existing?.accountName ?? "New account",
    currency: input.currency ?? existing?.currency ?? "EUR",
    country: input.country ?? existing?.country ?? "Spain",
    accountType: input.accountType ?? existing?.accountType ?? "Current",
    status: input.status ?? existing?.status ?? "active",
    primary: input.primary ?? existing?.primary ?? false,
    iban: input.iban ?? existing?.iban ?? "",
    swift: input.swift ?? existing?.swift ?? "",
    routing: input.routing ?? existing?.routing ?? "",
    branch: input.branch ?? existing?.branch ?? "",
    accountHolder: input.accountHolder ?? existing?.accountHolder ?? "Nakama Ventures SL",
    notes: input.notes ?? existing?.notes ?? "",
    balance: input.balance !== undefined ? input.balance : (existing?.balance ?? null),
  };
  state = {
    ...state,
    banks: existing
      ? state.banks.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.banks],
  };
  pushActivity(
    existing ? "Bank account updated" : "Bank account added",
    `${next.accountName} · ${next.currency}`,
  );
  emit();
  return next;
}

export function deleteBankAccount(id: string) {
  const bank = state.banks.find((item) => item.id === id);
  state = { ...state, banks: state.banks.filter((item) => item.id !== id) };
  if (bank) pushActivity("Bank account deleted", `${bank.accountName} · ${bank.bank}`);
  emit();
}

export function archiveBankAccount(id: string) {
  state = {
    ...state,
    banks: state.banks.map((bank) =>
      bank.id === id ? { ...bank, status: "archived", primary: false } : bank,
    ),
  };
  const bank = state.banks.find((item) => item.id === id);
  if (bank) pushActivity("Bank account archived", `${bank.accountName} · ${bank.currency}`);
  emit();
}

export function markPrimaryBankAccount(id: string) {
  state = {
    ...state,
    banks: state.banks.map((bank) => ({
      ...bank,
      primary: bank.id === id,
    })),
  };
  const bank = state.banks.find((item) => item.id === id);
  if (bank) pushActivity("Primary bank account set", `${bank.accountName} · ${bank.currency}`);
  emit();
}

/* —— Advisors —— */

export function upsertAdvisor(input: Partial<CorporateAdvisor> & { id?: string }) {
  const existing = input.id ? state.advisors.find((item) => item.id === input.id) : null;
  const next: CorporateAdvisor = {
    id: existing?.id ?? uid("adv"),
    company: input.company ?? existing?.company ?? "Advisor firm",
    contact: input.contact ?? existing?.contact ?? "",
    category: input.category ?? existing?.category ?? "Consultants",
    country: input.country ?? existing?.country ?? "Spain",
    phone: input.phone ?? existing?.phone ?? "",
    email: input.email ?? existing?.email ?? "",
    retainer: input.retainer ?? existing?.retainer ?? "",
    status: input.status ?? existing?.status ?? "active",
    notes: input.notes ?? existing?.notes ?? "",
  };
  state = {
    ...state,
    advisors: existing
      ? state.advisors.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.advisors],
  };
  pushActivity(
    existing ? "Advisor updated" : "Advisor added",
    `${next.company} — ${next.category}`,
  );
  emit();
  return next;
}

export function deleteAdvisor(id: string) {
  const advisor = state.advisors.find((item) => item.id === id);
  state = { ...state, advisors: state.advisors.filter((item) => item.id !== id) };
  if (advisor) pushActivity("Advisor removed", `${advisor.company} — ${advisor.category}`);
  emit();
}

/* —— Contracts —— */

export function upsertContract(input: Partial<CorporateContract> & { id?: string }) {
  const existing = input.id ? state.contracts.find((item) => item.id === input.id) : null;
  const expiryDate = input.expiryDate ?? existing?.expiryDate ?? isoDaysFromNow(365);
  const draftStatus = input.status ?? existing?.status ?? "draft";
  const next: CorporateContract = {
    id: existing?.id ?? uid("contract"),
    name: input.name ?? existing?.name ?? "New contract",
    supplier: input.supplier ?? existing?.supplier ?? "",
    type: input.type ?? existing?.type ?? "Other",
    owner: input.owner ?? existing?.owner ?? "",
    startDate: input.startDate ?? existing?.startDate ?? isoDaysFromNow(0),
    expiryDate,
    value: input.value ?? existing?.value ?? "",
    status: contractStatusFromExpiry(expiryDate, draftStatus),
    summary: input.summary ?? existing?.summary ?? "",
    parties: input.parties ?? existing?.parties ?? "",
    renewalNotes: input.renewalNotes ?? existing?.renewalNotes ?? "",
    documents: input.documents ?? existing?.documents ?? "",
    notes: input.notes ?? existing?.notes ?? "",
  };
  state = {
    ...state,
    contracts: existing
      ? state.contracts.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.contracts],
  };
  pushActivity(
    existing ? "Contract updated" : "Contract added",
    `${next.name} — ${next.supplier || next.type}`,
  );
  emit();
  return next;
}

export function deleteContract(id: string) {
  const contract = state.contracts.find((item) => item.id === id);
  state = { ...state, contracts: state.contracts.filter((item) => item.id !== id) };
  if (contract) pushActivity("Contract deleted", `${contract.name} — ${contract.supplier}`);
  emit();
}

export function archiveContract(id: string) {
  state = {
    ...state,
    contracts: state.contracts.map((contract) =>
      contract.id === id ? { ...contract, status: "archived" } : contract,
    ),
  };
  const contract = state.contracts.find((item) => item.id === id);
  if (contract) pushActivity("Contract archived", `${contract.name} — ${contract.supplier}`);
  emit();
}

export function renewContract(id: string) {
  state = {
    ...state,
    contracts: state.contracts.map((contract) => {
      if (contract.id !== id) return contract;
      const expiryDate = isoDaysFromNow(365);
      return {
        ...contract,
        expiryDate,
        status: contractStatusFromExpiry(expiryDate, "active"),
        renewalNotes: contract.renewalNotes
          ? `${contract.renewalNotes} · Renewed ${isoDaysFromNow(0)}`
          : `Renewed ${isoDaysFromNow(0)}`,
      };
    }),
  };
  const contract = state.contracts.find((item) => item.id === id);
  if (contract) {
    pushActivity("Contract renewed", `${contract.name} — expires ${contract.expiryDate}`);
  }
  emit();
}

/* —— Shareholders —— */

export function upsertShareholder(input: Partial<CorporateShareholder> & { id?: string }) {
  const existing = input.id ? state.shareholders.find((item) => item.id === input.id) : null;
  const next: CorporateShareholder = {
    id: existing?.id ?? uid("sh"),
    company: input.company ?? existing?.company ?? "Nakama Ventures SL",
    shareholder: input.shareholder ?? existing?.shareholder ?? "Shareholder",
    shareClass: input.shareClass ?? existing?.shareClass ?? "Ordinary",
    shares: input.shares ?? existing?.shares ?? 0,
    price: input.price ?? existing?.price ?? "",
    issueDate: input.issueDate ?? existing?.issueDate ?? isoDaysFromNow(0),
    notes: input.notes ?? existing?.notes ?? "",
  };
  state = {
    ...state,
    shareholders: existing
      ? state.shareholders.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.shareholders],
  };
  pushActivity(
    existing ? "Shareholder updated" : "Shareholder added",
    `${next.shareholder} — ${next.shares.toLocaleString()} ${next.shareClass}`,
  );
  emit();
  return next;
}

export function deleteShareholder(id: string) {
  const shareholder = state.shareholders.find((item) => item.id === id);
  state = { ...state, shareholders: state.shareholders.filter((item) => item.id !== id) };
  if (shareholder) {
    pushActivity("Shareholder removed", `${shareholder.shareholder} — ${shareholder.shareClass}`);
  }
  emit();
}

export function transferShares(fromId: string, toId: string, shares: number) {
  if (shares <= 0) return;
  const from = state.shareholders.find((item) => item.id === fromId);
  const to = state.shareholders.find((item) => item.id === toId);
  if (!from || !to || from.shares < shares) return;

  state = {
    ...state,
    shareholders: state.shareholders.map((row) => {
      if (row.id === fromId) return { ...row, shares: row.shares - shares };
      if (row.id === toId) return { ...row, shares: row.shares + shares };
      return row;
    }),
  };
  pushActivity(
    "Share transfer",
    `${from.shareholder} → ${to.shareholder} · ${shares.toLocaleString()} shares`,
  );
  emit();
}

/* —— Option pool & capital —— */

export function updateOptionPool(patch: Partial<CorporateOptionPool>) {
  state = {
    ...state,
    optionPool: {
      ...state.optionPool,
      ...patch,
      lastUpdated: isoDaysFromNow(0),
    },
  };
  pushActivity(
    "Option pool updated",
    `Authorised ${state.optionPool.authorised.toLocaleString()} · Issued ${state.optionPool.issued.toLocaleString()}`,
  );
  emit();
}

export function updateCapital(patch: Partial<CorporateCapital>) {
  state = {
    ...state,
    capital: { ...state.capital, ...patch },
  };
  pushActivity(
    "Share capital updated",
    `Issued ${state.capital.issuedShareCapital} · ${state.capital.currency}`,
  );
  emit();
}

/* —— Licences —— */

export function upsertLicence(input: Partial<CorporateLicence> & { id?: string }) {
  const existing = input.id ? state.licences.find((item) => item.id === input.id) : null;
  const renewalDate = input.renewalDate ?? existing?.renewalDate ?? isoDaysFromNow(365);
  const draftStatus = input.status ?? existing?.status ?? "active";
  const next: CorporateLicence = {
    id: existing?.id ?? uid("lic"),
    software: input.software ?? existing?.software ?? "Software",
    vendor: input.vendor ?? existing?.vendor ?? "",
    licenceType: input.licenceType ?? existing?.licenceType ?? "Subscription",
    seats: input.seats ?? existing?.seats ?? 1,
    renewalDate,
    cost: input.cost ?? existing?.cost ?? "",
    owner: input.owner ?? existing?.owner ?? "",
    status: licenceStatusFromRenewal(renewalDate, draftStatus),
  };
  state = {
    ...state,
    licences: existing
      ? state.licences.map((item) => (item.id === existing.id ? next : item))
      : [next, ...state.licences],
  };
  pushActivity(
    existing ? "Licence updated" : "Licence added",
    `${next.software} — ${next.vendor || next.licenceType}`,
  );
  emit();
  return next;
}

export function deleteLicence(id: string) {
  const licence = state.licences.find((item) => item.id === id);
  state = { ...state, licences: state.licences.filter((item) => item.id !== id) };
  if (licence) pushActivity("Licence deleted", `${licence.software} — ${licence.vendor}`);
  emit();
}

export function renewLicence(id: string) {
  state = {
    ...state,
    licences: state.licences.map((licence) => {
      if (licence.id !== id) return licence;
      const renewalDate = isoDaysFromNow(365);
      return {
        ...licence,
        renewalDate,
        status: licenceStatusFromRenewal(renewalDate, "active"),
      };
    }),
  };
  const licence = state.licences.find((item) => item.id === id);
  if (licence) {
    pushActivity("Licence renewed", `${licence.software} — renewal ${licence.renewalDate}`);
  }
  emit();
}

export function archiveLicence(id: string) {
  state = {
    ...state,
    licences: state.licences.map((licence) =>
      licence.id === id ? { ...licence, status: "archived" } : licence,
    ),
  };
  const licence = state.licences.find((item) => item.id === id);
  if (licence) pushActivity("Licence archived", `${licence.software} — ${licence.vendor}`);
  emit();
}

/** Recompute contract/licence expiry statuses from dates (e.g. after day rollover). */
export function refreshCorporateExpiryStatuses() {
  state = {
    ...state,
    contracts: state.contracts.map((contract) => ({
      ...contract,
      status: contractStatusFromExpiry(contract.expiryDate, contract.status),
    })),
    licences: state.licences.map((licence) => ({
      ...licence,
      status: licenceStatusFromRenewal(licence.renewalDate, licence.status),
    })),
  };
  emit();
}

export function listExpiringContracts(withinDays = 60) {
  return state.contracts.filter(
    (contract) =>
      contract.status !== "archived" &&
      contract.status !== "draft" &&
      isWithinDays(contract.expiryDate, withinDays),
  );
}

export function listExpiringLicences(withinDays = 60) {
  return state.licences.filter(
    (licence) =>
      licence.status !== "archived" && isWithinDays(licence.renewalDate, withinDays),
  );
}
