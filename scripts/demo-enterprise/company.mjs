/**
 * Northstar Industrial Technologies — Demo enterprise constants.
 * Demo workspace only. Never used to seed Internal.
 */

export const DEMO_ENTERPRISE_TAG = "[demo-enterprise]";
export const SEED_VERSION = "northstar-v1";

export const COMPANY = {
  legalName: "Northstar Industrial Technologies Ltd",
  tradingName: "Northstar Industrial Technologies",
  companyNumber: "NST-UK-104882",
  vatNumber: "GB104882901",
  website: "https://northstar.demo",
  email: "hello@northstar.demo",
  phone: "+44 161 555 0100",
  country: "United Kingdom",
  sic: "28990 — Manufacture of other special-purpose machinery",
  description:
    "Northstar Industrial Technologies designs and deploys industrial IoT edge controllers and remote monitoring platforms for mid-market manufacturers across the UK, Europe and the United States.",
  registeredAddress: "Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom",
  principalAddress: "Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom",
  domain: "northstar.demo",
  foundedYear: 2023,
  arrGbp: 4_800_000,
  cashGbp: 1_900_000,
  targetGmPct: 58,
  actualGmPct: 54,
};

export const OFFICES = [
  {
    id: "nst-office-man",
    city: "Manchester",
    country: "United Kingdom",
    region: "UK",
    address: "Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH",
    timezone: "Europe/London",
    headcountTarget: 12,
  },
  {
    id: "nst-office-bri",
    city: "Bristol",
    country: "United Kingdom",
    region: "UK",
    address: "14 Temple Quay, Bristol BS1 6DZ",
    timezone: "Europe/London",
    headcountTarget: 7,
  },
  {
    id: "nst-office-aus",
    city: "Austin",
    country: "United States",
    region: "US",
    address: "800 Brazos Street, Suite 400, Austin TX 78701",
    timezone: "America/Chicago",
    headcountTarget: 6,
  },
];

export const DEPARTMENTS = [
  "Executive",
  "Engineering",
  "Sales",
  "Customer Success",
  "Operations",
  "Finance",
  "HR",
  "Marketing",
];

export const NAMED_EXECUTIVES = [
  { first: "Elena", last: "Hart", role: "Chief Executive Officer", dept: "Executive" },
  { first: "James", last: "Okonkwo", role: "Chief Technology Officer", dept: "Engineering" },
  { first: "Priya", last: "Shah", role: "Chief Financial Officer", dept: "Finance" },
  { first: "Marcus", last: "Reed", role: "Chief Operating Officer", dept: "Operations" },
];

export const ANCHOR_CLIENT = {
  id: "nst-cli-001",
  companyName: "Meridian Packaging Group",
  contactFirst: "Claire",
  contactLast: "Whitfield",
  email: "claire.whitfield@meridianpackaging.example",
  region: "United Kingdom",
  city: "Leeds",
  arrShare: 0.22,
};

export const CHURNED_CLIENT = {
  companyName: "Harbor Forge Ltd",
  reason: "Integration failure on legacy MES bridge — lesson for onboarding playbook.",
};

export const FLAGSHIP_PROJECT = {
  name: "Atlas Monitoring Platform",
  clientId: "nst-cli-001",
  status: "delayed",
  overBudgetPct: 18,
};

export const PROBLEM_SUPPLIER = "Voltex Automation";

/** Standard GL chart codes — industrial SME template. */
export const GL_ACCOUNTS = [
  { code: "1000", name: "Wise USD", type: "asset" },
  { code: "1010", name: "Wise GBP", type: "asset" },
  { code: "1020", name: "Wise EUR", type: "asset" },
  { code: "1030", name: "Accounts Receivable", type: "asset" },
  { code: "1040", name: "Prepaid Expenses", type: "asset" },
  { code: "2000", name: "Accounts Payable", type: "liability" },
  { code: "2010", name: "Deferred Revenue", type: "liability" },
  { code: "2020", name: "Payroll Clearing", type: "liability" },
  { code: "2030", name: "Employer Payroll Tax Payable", type: "liability" },
  { code: "3000", name: "Share Capital", type: "equity" },
  { code: "3010", name: "Retained Earnings", type: "equity" },
  { code: "3020", name: "Share Premium", type: "equity" },
  { code: "4000", name: "Hardware Revenue", type: "income" },
  { code: "4010", name: "SaaS & Monitoring Revenue", type: "income" },
  { code: "4020", name: "Professional Services", type: "income" },
  { code: "5000", name: "Bank Fees", type: "expense" },
  { code: "5010", name: "Software Subscriptions", type: "expense" },
  { code: "5020", name: "Payroll Expense", type: "expense" },
  { code: "5030", name: "Travel & Entertainment", type: "expense" },
  { code: "5040", name: "Facilities", type: "expense" },
  { code: "5050", name: "Professional Fees", type: "expense" },
  { code: "5060", name: "Marketing", type: "expense" },
  { code: "5070", name: "Cost of Goods Sold", type: "expense" },
];

export const SUPPLIERS = [
  { name: "Voltex Automation", category: "Components" },
  { name: "Siemens Industrial", category: "Components" },
  { name: "Amazon Web Services", category: "Cloud" },
  { name: "Microsoft Azure", category: "Cloud" },
  { name: "RS Components", category: "Electronics" },
  { name: "DHL Supply Chain", category: "Logistics" },
  { name: "Ashford Lane LLP", category: "Legal" },
  { name: "Northbridge Advisory", category: "Accounting" },
  { name: "Hiscox Insurance", category: "Insurance" },
  { name: "BT Business", category: "Telecommunications" },
  { name: "Dell Technologies", category: "Hardware" },
  { name: "Atlassian", category: "Software" },
  { name: "HubSpot", category: "CRM" },
  { name: "CBRE Facilities", category: "Facilities" },
  { name: "Smart Manufacturing Expo", category: "Events" },
];

export const FIRST_NAMES = [
  "Elena", "James", "Priya", "Marcus", "Sophie", "Tom", "Aisha", "Daniel", "Laura", "Chris",
  "Hannah", "Oliver", "Mia", "Ethan", "Grace", "Noah", "Emily", "Leo", "Charlotte", "Jack",
  "Amelia", "Harry", "Isla", "Lucas", "Zoe",
];

export const LAST_NAMES = [
  "Hart", "Okonkwo", "Shah", "Reed", "Whitfield", "Barker", "Khan", "Foster", "Morgan", "Clarke",
  "Patel", "Brooks", "Hayes", "Coleman", "Reed", "Bailey", "Cooper", "Peterson", "Hughes", "Price",
  "Bennett", "Foster", "Kelly", "Sanders", "Powell",
];

export const CLIENT_INDUSTRIES = [
  "Packaging",
  "Food & Beverage",
  "Automotive",
  "Pharmaceuticals",
  "Aerospace",
  "Energy",
  "Chemicals",
  "Metals",
  "Plastics",
  "Industrial Equipment",
];

export const CLIENT_PREFIXES = [
  "Summit", "Apex", "Vertex", "Bright", "Prime", "Crest", "Harbor", "Silver",
  "Copper", "Iron", "Nova", "Pulse", "Quantum", "Solid", "True", "Unity",
];

export const CLIENT_SUFFIXES = [
  "Packaging", "Manufacturing", "Industries", "Group", "Systems", "Works",
  "Plastics", "Metals", "Foods", "Components", "Engineering",
];

export const FUNDING_ROUNDS = [
  { id: "seed-2023", label: "Seed", amountGbp: 750_000, year: 2023, lead: "Northern Tech Ventures" },
  { id: "series-a-2024", label: "Series A", amountGbp: 1_750_000, year: 2024, lead: "Northern Tech Ventures" },
  { id: "growth-2025", label: "Growth", amountGbp: 2_000_000, year: 2025, lead: "Cedar Bridge Capital" },
];

export const BOARD_DIRECTORS = [
  { id: "dir-ceo", name: "Elena Hart", role: "Chief Executive Officer", type: "Executive" },
  { id: "dir-cto", name: "James Okonkwo", role: "Chief Technology Officer", type: "Executive" },
  { id: "dir-chair", name: "Sarah Pemberton", role: "Chair", type: "Non-Executive" },
  { id: "dir-ned-1", name: "David Chen", role: "Non-Executive Director", type: "Investor" },
  { id: "dir-ned-2", name: "Amira Hassan", role: "Non-Executive Director", type: "Independent" },
];
