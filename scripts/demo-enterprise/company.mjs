/**
 * Meridian Atlas Group — Demo enterprise constants.
 * Demo workspace only. Never used to seed Internal.
 */

export const DEMO_ENTERPRISE_TAG = "[demo-enterprise]";
export const COMPANY = {
  legalName: "Meridian Atlas Group Ltd",
  tradingName: "Meridian Atlas Group",
  companyNumber: "MAG-UK-884421",
  vatNumber: "GB884421001",
  website: "https://meridianatlas.demo",
  email: "hello@meridianatlas.demo",
  phone: "+44 20 7946 0100",
  country: "United Kingdom",
  sic: "62020 — Information technology consultancy activities",
  description:
    "Meridian Atlas Group is an international technology and management consulting firm helping enterprises modernise platforms, cloud estates, and operating models across EMEA and APAC.",
  registeredAddress: "120 Bishopsgate, London EC2N 4AG, United Kingdom",
  principalAddress: "120 Bishopsgate, London EC2N 4AG, United Kingdom",
  domain: "meridianatlas.demo",
};

export const OFFICES = [
  {
    id: "mag-office-lon",
    city: "London",
    country: "United Kingdom",
    region: "EMEA",
    address: "120 Bishopsgate, London EC2N 4AG",
    timezone: "Europe/London",
    headcountTarget: 34,
  },
  {
    id: "mag-office-nyc",
    city: "New York",
    country: "United States",
    region: "Americas",
    address: "200 Park Avenue, New York NY 10166",
    timezone: "America/New_York",
    headcountTarget: 22,
  },
  {
    id: "mag-office-ber",
    city: "Berlin",
    country: "Germany",
    region: "EMEA",
    address: "Friedrichstraße 88, 10117 Berlin",
    timezone: "Europe/Berlin",
    headcountTarget: 16,
  },
  {
    id: "mag-office-sin",
    city: "Singapore",
    country: "Singapore",
    region: "APAC",
    address: "1 Raffles Place, Singapore 048616",
    timezone: "Asia/Singapore",
    headcountTarget: 14,
  },
  {
    id: "mag-office-syd",
    city: "Sydney",
    country: "Australia",
    region: "APAC",
    address: "1 Macquarie Place, Sydney NSW 2000",
    timezone: "Australia/Sydney",
    headcountTarget: 14,
  },
];

export const DEPARTMENTS = [
  "Executive",
  "Engineering",
  "Cloud",
  "Security",
  "Consulting",
  "Project Management",
  "Business Analysis",
  "Customer Success",
  "Sales",
  "Marketing",
  "Finance",
  "HR",
  "Operations",
  "Procurement",
  "Support",
  "Administration",
];

/** Standard GL chart codes (config template — not copied from Internal business rows). */
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
  { code: "3000", name: "Owner Equity", type: "equity" },
  { code: "3010", name: "Retained Earnings", type: "equity" },
  { code: "4000", name: "Subscription Revenue", type: "income" },
  { code: "4010", name: "Professional Services", type: "income" },
  { code: "5000", name: "Bank Fees", type: "expense" },
  { code: "5010", name: "Software Subscriptions", type: "expense" },
  { code: "5020", name: "Payroll Expense", type: "expense" },
  { code: "5030", name: "Travel & Entertainment", type: "expense" },
  { code: "5040", name: "Facilities", type: "expense" },
  { code: "5050", name: "Professional Fees", type: "expense" },
  { code: "5060", name: "Marketing", type: "expense" },
];

export const SUPPLIERS = [
  { name: "Amazon Web Services", category: "Cloud" },
  { name: "Microsoft Azure", category: "Cloud" },
  { name: "Google Cloud", category: "Cloud" },
  { name: "Office Depot EU", category: "Office" },
  { name: "Robert Half", category: "Recruitment" },
  { name: "Clifford Chance LLP", category: "Legal" },
  { name: "Deloitte Advisory", category: "Accounting" },
  { name: "Hiscox Insurance", category: "Insurance" },
  { name: "Expedia Business Travel", category: "Travel" },
  { name: "BT Business", category: "Telecommunications" },
  { name: "Dell Technologies", category: "Hardware" },
  { name: "Atlassian", category: "Software" },
  { name: "PluralSight Business", category: "Training" },
  { name: "CBRE Facilities", category: "Facilities" },
  { name: "CleanCo International", category: "Cleaning" },
];

export const FIRST_NAMES = [
  "Alex", "Jordan", "Sam", "Taylor", "Morgan", "Casey", "Riley", "Avery", "Quinn", "Jamie",
  "Cameron", "Drew", "Harper", "Logan", "Parker", "Reese", "Skyler", "Rowan", "Finley", "Hayden",
  "Oliver", "Amelia", "Noah", "Isla", "Leo", "Mia", "Ethan", "Sophia", "Lucas", "Grace",
  "Henry", "Chloe", "Jack", "Emily", "Harry", "Olivia", "Thomas", "Charlotte", "James", "Eva",
  "Daniel", "Sophie", "Benjamin", "Lily", "William", "Ella", "Michael", "Hannah", "David", "Zoe",
];

export const LAST_NAMES = [
  "Bennett", "Hayes", "Coleman", "Foster", "Reed", "Bailey", "Cooper", "Morgan", "Peterson", "Hughes",
  "Price", "Brooks", "Kelly", "Sanders", "Powell", "Long", "Patterson", "Jenkins", "Flores", "Washington",
  "Butler", "Simmons", "Foster", "Bryant", "Alexander", "Russell", "Griffin", "Diaz", "Hayes", "Myers",
  "Ford", "Hamilton", "Graham", "Sullivan", "Wallace", "Woods", "Cole", "West", "Jordan", "Owens",
  "Reynolds", "Fisher", "Ellis", "Harrison", "Gibson", "Mcdonald", "Cruz", "Marshall", "Ortiz", "Gomez",
];

export const CLIENT_INDUSTRIES = [
  "Enterprise Technology",
  "Financial Services",
  "Healthcare",
  "Manufacturing",
  "Energy",
  "Retail",
  "Government",
  "Education",
  "Telecommunications",
  "Logistics",
  "Insurance",
  "Media",
];

export const CLIENT_PREFIXES = [
  "North", "Summit", "Apex", "Vertex", "Bright", "Prime", "Atlas", "Crest", "Harbor", "Silver",
  "Copper", "Iron", "Nova", "Pulse", "Quantum", "Rapid", "Solid", "True", "Unity", "Vivid",
];

export const CLIENT_SUFFIXES = [
  "Systems", "Partners", "Holdings", "Industries", "Group", "Solutions", "Dynamics", "Networks",
  "Labs", "Works", "Capital", "Health", "Energy", "Retail", "Logistics", "Advisory",
];
