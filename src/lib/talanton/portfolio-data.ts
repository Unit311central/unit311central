/**
 * Unified Talanton Impact portfolio company entity.
 * Same 19 companies power Portfolio Companies, Training, and company portals.
 * They are investments — not Business Central clients (Client Directory hides ti-cli-* rows).
 */

export type RiskRating = "Low" | "Medium" | "High" | "Critical";

export type PortfolioCompany = {
  id: string;
  /** Stable client-directory id used when seeding internal_clients */
  clientId: string;
  name: string;
  country: string;
  sector: string;
  region: string;
  employeeCount: number;
  investmentAmountUsd: number;
  ownershipPct: number;
  annualRevenueUsd: number;
  revenueGrowthPct: number;
  burnRateUsdMonthly: number;
  compliancePct: number;
  riskRating: RiskRating;
  roiMoic: number;
  lastQuarterlyReportDate: string;
  outstandingTraining: number;
  usersEnrolled: number;
  coursesAssigned: number;
  overview: string;
  primaryContact: string;
  email: string;
  phone: string;
  city: string;
  lastReview: string;
};

export type ComplianceCourse = {
  id: string;
  title: string;
  category: string;
  durationMinutes: number;
  mandatory: boolean;
  assignedCompanies: number;
  completionPct: number;
  renewEveryMonths: number;
};

export type GovernancePolicy = {
  id: string;
  title: string;
  owner: string;
  version: string;
  status: "Published" | "In Review" | "Draft";
  lastReviewed: string;
  nextReview: string;
};

export type RiskRegisterItem = {
  id: string;
  title: string;
  companyId: string | null;
  category: string;
  likelihood: "Low" | "Medium" | "High";
  impact: "Low" | "Medium" | "High";
  rating: RiskRating;
  owner: string;
  status: "Open" | "Mitigating" | "Closed";
  dueDate: string;
};

export type GovernanceAction = {
  id: string;
  title: string;
  companyId: string | null;
  owner: string;
  priority: "Low" | "Medium" | "High";
  status: "Open" | "In Progress" | "Done";
  dueDate: string;
  source: string;
};

export type MyTrainingRow = {
  id: string;
  courseId: string;
  companyId: string;
  learnerName: string;
  status: "Not Started" | "In Progress" | "Completed" | "Overdue";
  progress: number;
  dueDate: string;
};

export type QuarterlyReportRow = {
  id: string;
  companyId: string;
  period: string;
  status: "Submitted" | "Overdue" | "Due Soon" | "Not Started";
  lastSubmitted: string | null;
  nextDue: string;
  score: number;
};

export type CompanyContact = {
  name: string;
  role: string;
  email: string;
};

export type CompanyDocument = {
  name: string;
  kind: string;
  updatedAt: string;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const RISK_CYCLE: RiskRating[] = ["Low", "Medium", "High", "Medium", "Low", "Critical", "Medium"];

type Seed = {
  name: string;
  country: string;
  sector: string;
  city: string;
  employees: number;
  investmentM: number;
  ownership: number;
  revenueM: number;
  growth: number;
  burnK: number;
  moic: number;
  contact: string;
};

/** Canonical 19 portfolio companies — single source of truth. */
const COMPANY_SEEDS: Seed[] = [
  { name: "Ethical Apparel Africa", country: "Ghana", city: "Accra", sector: "Apparel & Manufacturing", employees: 420, investmentM: 4.2, ownership: 22, revenueM: 11.4, growth: 18, burnK: 95, moic: 1.6, contact: "Ama Mensah" },
  { name: "ARC Ride", country: "Kenya", city: "Nairobi", sector: "Mobility & Logistics", employees: 185, investmentM: 3.1, ownership: 18, revenueM: 6.8, growth: 24, burnK: 110, moic: 1.4, contact: "James Kariuki" },
  { name: "Burn Manufacturing", country: "Kenya", city: "Nairobi", sector: "Clean Energy", employees: 310, investmentM: 5.5, ownership: 15, revenueM: 14.2, growth: 12, burnK: 140, moic: 1.9, contact: "Wanjiru Otieno" },
  { name: "Kentegra Biotechnology", country: "Kenya", city: "Nairobi", sector: "Agri-biotech", employees: 96, investmentM: 2.8, ownership: 20, revenueM: 4.1, growth: 31, burnK: 75, moic: 1.3, contact: "Daniel Okello" },
  { name: "Long Miles Coffee", country: "Burundi", city: "Bujumbura", sector: "Agriculture & Food", employees: 140, investmentM: 2.2, ownership: 25, revenueM: 5.6, growth: 9, burnK: 40, moic: 1.7, contact: "Grace Ndayishimiye" },
  { name: "Pharmakina", country: "DRC", city: "Bukavu", sector: "Healthcare & Pharma", employees: 520, investmentM: 6.0, ownership: 12, revenueM: 18.5, growth: 7, burnK: 160, moic: 2.1, contact: "Jean Mukendi" },
  { name: "Moko Home + Living", country: "Kenya", city: "Nairobi", sector: "Consumer Goods", employees: 210, investmentM: 3.4, ownership: 19, revenueM: 8.9, growth: 16, burnK: 85, moic: 1.5, contact: "Faith Wambui" },
  { name: "Power Resources International", country: "Uganda", city: "Kampala", sector: "Energy Infrastructure", employees: 78, investmentM: 4.8, ownership: 16, revenueM: 7.2, growth: 21, burnK: 120, moic: 1.2, contact: "Peter Okello" },
  { name: "Auto Springs East Africa PLC", country: "Ethiopia", city: "Addis Ababa", sector: "Automotive Manufacturing", employees: 640, investmentM: 7.5, ownership: 10, revenueM: 22.0, growth: 11, burnK: 180, moic: 1.8, contact: "Helen Bekele" },
  { name: "BioFarms Limited", country: "Uganda", city: "Kampala", sector: "Agriculture & Food", employees: 155, investmentM: 2.6, ownership: 23, revenueM: 5.1, growth: 14, burnK: 55, moic: 1.4, contact: "Sarah Nalwanga" },
  { name: "Enda Sportswear", country: "Kenya", city: "Eldoret", sector: "Apparel & Manufacturing", employees: 88, investmentM: 1.9, ownership: 28, revenueM: 3.4, growth: 27, burnK: 48, moic: 1.3, contact: "Michael Kiprop" },
  { name: "Kijani Forestry", country: "Kenya", city: "Nairobi", sector: "Forestry & Climate", employees: 62, investmentM: 3.6, ownership: 21, revenueM: 2.8, growth: 35, burnK: 70, moic: 1.1, contact: "Amina Otieno" },
  { name: "Kivu Tilapia Farm Ltd", country: "Rwanda", city: "Rubavu", sector: "Aquaculture", employees: 74, investmentM: 2.1, ownership: 26, revenueM: 3.9, growth: 19, burnK: 42, moic: 1.5, contact: "Eric Habimana" },
  { name: "Masaka Farms", country: "Uganda", city: "Masaka", sector: "Agriculture & Food", employees: 118, investmentM: 2.4, ownership: 24, revenueM: 4.6, growth: 13, burnK: 38, moic: 1.6, contact: "Joseph Ssekandi" },
  { name: "OWP Pharmaceuticals", country: "Kenya", city: "Nairobi", sector: "Healthcare & Pharma", employees: 245, investmentM: 5.2, ownership: 14, revenueM: 12.7, growth: 15, burnK: 130, moic: 1.7, contact: "Fatima Diallo" },
  { name: "Pezesha", country: "Kenya", city: "Nairobi", sector: "Fintech & Inclusion", employees: 92, investmentM: 3.0, ownership: 17, revenueM: 5.8, growth: 29, burnK: 90, moic: 1.4, contact: "Brian Ouma" },
  { name: "poa! Internet", country: "Kenya", city: "Nairobi", sector: "Connectivity & Telecom", employees: 268, investmentM: 6.4, ownership: 13, revenueM: 15.3, growth: 22, burnK: 175, moic: 1.9, contact: "Nancy Wanjiku" },
  { name: "Rabboni Group", country: "Kenya", city: "Nairobi", sector: "Manufacturing & Distribution", employees: 330, investmentM: 4.0, ownership: 18, revenueM: 10.6, growth: 10, burnK: 100, moic: 1.5, contact: "Samuel Mwangi" },
  { name: "Taraji Afrika", country: "Tanzania", city: "Dar es Salaam", sector: "Agriculture & Food", employees: 104, investmentM: 2.0, ownership: 27, revenueM: 3.7, growth: 17, burnK: 45, moic: 1.3, contact: "Asha Juma" },
];

export const TALANTON_PORTFOLIO_COMPANIES: PortfolioCompany[] = COMPANY_SEEDS.map((seed, index) => {
  const slug = slugify(seed.name);
  const compliancePct = Math.min(98, Math.max(62, 88 - (index % 7) * 3 + (index % 3)));
  const outstandingTraining = Math.max(0, Math.round((100 - compliancePct) / 4) + (index % 5));
  const month = String((index % 6) + 1).padStart(2, "0");
  const day = String(10 + (index % 18)).padStart(2, "0");
  return {
    id: `ti-co-${slug}`,
    clientId: `ti-cli-${slug}`,
    name: seed.name,
    country: seed.country,
    sector: seed.sector,
    region: seed.country === "Ghana" ? "West Africa" : "East Africa",
    employeeCount: seed.employees,
    investmentAmountUsd: Math.round(seed.investmentM * 1_000_000),
    ownershipPct: seed.ownership,
    annualRevenueUsd: Math.round(seed.revenueM * 1_000_000),
    revenueGrowthPct: seed.growth,
    burnRateUsdMonthly: seed.burnK * 1000,
    compliancePct,
    riskRating: RISK_CYCLE[index % RISK_CYCLE.length]!,
    roiMoic: seed.moic,
    lastQuarterlyReportDate: `2026-${month}-${day}`,
    outstandingTraining,
    usersEnrolled: Math.max(12, Math.round(seed.employees * 0.35) + (index % 9)),
    coursesAssigned: 11,
    overview: `${seed.name} is a Talanton Impact portfolio company in ${seed.sector}, based in ${seed.city}, ${seed.country}. The investment supports growth, governance and measurable impact across the region.`,
    primaryContact: seed.contact,
    email: `${slugify(seed.contact)}@${slug}.impact`,
    phone: `+254 700 ${String(100000 + index * 137).slice(0, 6)}`,
    city: seed.city,
    lastReview: `2026-${month}-${day}`,
  };
});

export const TALANTON_COMPLIANCE_COURSES: ComplianceCourse[] = [
  { id: "ti-course-abc", title: "Anti-Bribery & Corruption", category: "Ethics & Integrity", durationMinutes: 45, mandatory: true, assignedCompanies: 19, completionPct: 78, renewEveryMonths: 12 },
  { id: "ti-course-aml", title: "AML", category: "Financial Crime", durationMinutes: 40, mandatory: true, assignedCompanies: 19, completionPct: 74, renewEveryMonths: 12 },
  { id: "ti-course-conduct", title: "Code of Conduct", category: "Ethics & Integrity", durationMinutes: 35, mandatory: true, assignedCompanies: 19, completionPct: 86, renewEveryMonths: 24 },
  { id: "ti-course-coi", title: "Conflicts of Interest", category: "Ethics & Integrity", durationMinutes: 30, mandatory: true, assignedCompanies: 19, completionPct: 81, renewEveryMonths: 12 },
  { id: "ti-course-infosec", title: "Information Security", category: "Cyber & Privacy", durationMinutes: 50, mandatory: true, assignedCompanies: 19, completionPct: 72, renewEveryMonths: 12 },
  { id: "ti-course-whistle", title: "Whistleblowing", category: "Ethics & Integrity", durationMinutes: 25, mandatory: true, assignedCompanies: 19, completionPct: 83, renewEveryMonths: 24 },
  { id: "ti-course-dei", title: "DEI", category: "People & Culture", durationMinutes: 40, mandatory: true, assignedCompanies: 19, completionPct: 77, renewEveryMonths: 24 },
  { id: "ti-course-harassment", title: "Harassment Prevention", category: "People & Culture", durationMinutes: 35, mandatory: true, assignedCompanies: 19, completionPct: 80, renewEveryMonths: 24 },
  { id: "ti-course-procurement", title: "Procurement / Gifts & Hospitality", category: "Procurement", durationMinutes: 30, mandatory: true, assignedCompanies: 19, completionPct: 69, renewEveryMonths: 12 },
  { id: "ti-course-hs", title: "Health & Safety", category: "Operations", durationMinutes: 45, mandatory: true, assignedCompanies: 19, completionPct: 85, renewEveryMonths: 12 },
  { id: "ti-course-slavery", title: "Modern Slavery", category: "Human Rights", durationMinutes: 40, mandatory: true, assignedCompanies: 19, completionPct: 71, renewEveryMonths: 12 },
];

export const TALANTON_POLICIES: GovernancePolicy[] = [
  { id: "ti-pol-abc", title: "Anti-Bribery & Corruption Policy", owner: "Head of Compliance", version: "2.1", status: "Published", lastReviewed: "2026-01-15", nextReview: "2027-01-15" },
  { id: "ti-pol-aml", title: "AML & Sanctions Policy", owner: "Head of Compliance", version: "1.4", status: "Published", lastReviewed: "2025-11-02", nextReview: "2026-11-02" },
  { id: "ti-pol-speakup", title: "Speak Up / Whistleblowing Policy", owner: "General Counsel", version: "1.2", status: "Published", lastReviewed: "2026-02-20", nextReview: "2027-02-20" },
  { id: "ti-pol-data", title: "Data Protection & Privacy Policy", owner: "Data Protection Officer", version: "3.0", status: "In Review", lastReviewed: "2025-09-10", nextReview: "2026-09-10" },
  { id: "ti-pol-esg", title: "Portfolio ESG & Human Rights Policy", owner: "Impact Director", version: "1.0", status: "Published", lastReviewed: "2026-03-01", nextReview: "2027-03-01" },
  { id: "ti-pol-gifts", title: "Gifts & Hospitality Policy", owner: "Head of Compliance", version: "1.1", status: "Draft", lastReviewed: "2026-04-12", nextReview: "2026-10-12" },
];

export const TALANTON_RISKS: RiskRegisterItem[] = [
  { id: "ti-risk-1", title: "Supply-chain labour standards gaps", companyId: "ti-co-ethical-apparel-africa", category: "Human Rights", likelihood: "Medium", impact: "High", rating: "High", owner: "Impact Director", status: "Mitigating", dueDate: "2026-09-30" },
  { id: "ti-risk-2", title: "Incomplete AML refresher coverage", companyId: "ti-co-pezesha", category: "Financial Crime", likelihood: "Medium", impact: "Medium", rating: "Medium", owner: "Head of Compliance", status: "Open", dueDate: "2026-08-15" },
  { id: "ti-risk-3", title: "Cybersecurity controls maturity", companyId: "ti-co-poa-internet", category: "Cyber & Privacy", likelihood: "High", impact: "High", rating: "Critical", owner: "Technology Risk Lead", status: "Mitigating", dueDate: "2026-08-01" },
  { id: "ti-risk-4", title: "Health & safety incident reporting lag", companyId: "ti-co-burn-manufacturing", category: "Operations", likelihood: "Medium", impact: "High", rating: "High", owner: "Portfolio Ops", status: "Open", dueDate: "2026-09-01" },
  { id: "ti-risk-5", title: "Conflicts of interest disclosures overdue", companyId: null, category: "Ethics & Integrity", likelihood: "Low", impact: "Medium", rating: "Medium", owner: "General Counsel", status: "Open", dueDate: "2026-08-20" },
  { id: "ti-risk-6", title: "Modern slavery due-diligence depth", companyId: "ti-co-auto-springs-east-africa-plc", category: "Human Rights", likelihood: "Medium", impact: "High", rating: "High", owner: "Impact Director", status: "Mitigating", dueDate: "2026-10-15" },
];

export const TALANTON_ACTIONS: GovernanceAction[] = [
  { id: "ti-act-1", title: "Close outstanding Modern Slavery modules at Auto Springs", companyId: "ti-co-auto-springs-east-africa-plc", owner: "Portfolio Ops", priority: "High", status: "In Progress", dueDate: "2026-08-10", source: "Compliance Dashboard" },
  { id: "ti-act-2", title: "Publish updated Gifts & Hospitality Policy", companyId: null, owner: "Head of Compliance", priority: "Medium", status: "Open", dueDate: "2026-08-25", source: "Policies" },
  { id: "ti-act-3", title: "Complete infosec remediation plan with poa! Internet", companyId: "ti-co-poa-internet", owner: "Technology Risk Lead", priority: "High", status: "In Progress", dueDate: "2026-08-01", source: "Risk Register" },
  { id: "ti-act-4", title: "Schedule Q3 portfolio compliance board pack", companyId: null, owner: "Impact Director", priority: "Medium", status: "Open", dueDate: "2026-09-05", source: "Reporting" },
  { id: "ti-act-5", title: "Follow up overdue AML assignments at Pezesha", companyId: "ti-co-pezesha", owner: "Head of Compliance", priority: "High", status: "Open", dueDate: "2026-08-05", source: "My Training" },
  { id: "ti-act-6", title: "Archive closed Speak Up investigation actions", companyId: null, owner: "General Counsel", priority: "Low", status: "Done", dueDate: "2026-07-15", source: "Action Tracking" },
];

const LEARNER_NAMES = ["Amina Otieno", "Kwame Mensah", "Grace Uwimana", "Daniel Okello", "Fatima Diallo", "James Kariuki", "Sarah Nalwanga", "Michael Abebe"];

export const TALANTON_MY_TRAINING: MyTrainingRow[] = TALANTON_COMPLIANCE_COURSES.map((course, courseIndex) => {
  const company = TALANTON_PORTFOLIO_COMPANIES[courseIndex % TALANTON_PORTFOLIO_COMPANIES.length]!;
  const statuses: MyTrainingRow["status"][] = ["Completed", "In Progress", "Overdue", "Not Started"];
  const status = statuses[courseIndex % statuses.length]!;
  const progress = status === "Completed" ? 100 : status === "In Progress" ? 55 : status === "Overdue" ? 20 : 0;
  return {
    id: `ti-mt-${course.id}`,
    courseId: course.id,
    companyId: company.id,
    learnerName: LEARNER_NAMES[courseIndex % LEARNER_NAMES.length]!,
    status,
    progress,
    dueDate: `2026-0${(courseIndex % 3) + 7}-${String(5 + courseIndex).padStart(2, "0")}`,
  };
});

export const TALANTON_QUARTERLY_REPORTS: QuarterlyReportRow[] = TALANTON_PORTFOLIO_COMPANIES.map((c, i) => {
  const statuses: QuarterlyReportRow["status"][] = ["Submitted", "Overdue", "Due Soon", "Not Started", "Submitted"];
  const status = statuses[i % statuses.length]!;
  return {
    id: `ti-qr-${c.id}`,
    companyId: c.id,
    period: "Q2 2026",
    status,
    lastSubmitted: status === "Submitted" ? c.lastQuarterlyReportDate : status === "Overdue" ? null : c.lastQuarterlyReportDate,
    nextDue: "2026-10-15",
    score: status === "Submitted" ? Math.min(98, 70 + (i % 25)) : status === "Due Soon" ? 55 : status === "Overdue" ? 28 : 10,
  };
});

export function companyById(id: string | null | undefined): PortfolioCompany | undefined {
  if (!id) return undefined;
  return TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id || c.clientId === id);
}

export function companyNameById(id: string | null): string {
  if (!id) return "Portfolio-wide";
  return companyById(id)?.name ?? "Unknown";
}

export function courseTitleById(id: string): string {
  return TALANTON_COMPLIANCE_COURSES.find((c) => c.id === id)?.title ?? id;
}

export function companyContacts(company: PortfolioCompany): CompanyContact[] {
  return [
    { name: company.primaryContact, role: "Primary Contact", email: company.email },
    { name: "Finance Lead", role: "Finance", email: `finance@${slugify(company.name)}.impact` },
    { name: "Compliance Lead", role: "Compliance", email: `compliance@${slugify(company.name)}.impact` },
  ];
}

export function companyDocuments(company: PortfolioCompany): CompanyDocument[] {
  return [
    { name: `${company.name} — Investment Memo`, kind: "Investment", updatedAt: company.lastReview },
    { name: `Q2 2026 Quarterly Pack`, kind: "Quarterly Report", updatedAt: company.lastQuarterlyReportDate },
    { name: `Compliance certificate`, kind: "Compliance", updatedAt: company.lastReview },
  ];
}

export function portfolioComplianceSummary() {
  const companies = TALANTON_PORTFOLIO_COMPANIES;
  const avgCompliance = Math.round(
    companies.reduce((sum, c) => sum + c.compliancePct, 0) / companies.length,
  );
  const outstanding = companies.reduce((sum, c) => sum + c.outstandingTraining, 0);
  const highRisk = companies.filter((c) => c.riskRating === "High" || c.riskRating === "Critical").length;
  const openActions = TALANTON_ACTIONS.filter((a) => a.status !== "Done").length;
  const totalInvested = companies.reduce((sum, c) => sum + c.investmentAmountUsd, 0);
  const avgMoic =
    Math.round((companies.reduce((sum, c) => sum + c.roiMoic, 0) / companies.length) * 100) / 100;
  return {
    companyCount: companies.length,
    avgCompliance,
    outstanding,
    highRisk,
    openActions,
    courseCount: TALANTON_COMPLIANCE_COURSES.length,
    totalInvested,
    avgMoic,
  };
}

export function portfolioTrainingDashboardSummary() {
  const companies = TALANTON_PORTFOLIO_COMPANIES;
  const avgCompletion = Math.round(
    companies.reduce((sum, c) => sum + c.compliancePct, 0) / companies.length,
  );
  const outstandingItems = companies.reduce((sum, c) => sum + c.outstandingTraining, 0);
  const outstandingUsers = companies.reduce(
    (sum, c) => sum + Math.max(0, Math.round((c.usersEnrolled * (100 - c.compliancePct)) / 100)),
    0,
  );
  return {
    companyCount: companies.length,
    avgCompletion,
    above90: companies.filter((c) => c.compliancePct >= 90).length,
    between70And90: companies.filter((c) => c.compliancePct >= 70 && c.compliancePct < 90).length,
    below70: companies.filter((c) => c.compliancePct < 70).length,
    outstandingItems,
    outstandingUsers,
  };
}

export function companyTrainingDetail(company: PortfolioCompany) {
  const assignedCourses = TALANTON_COMPLIANCE_COURSES.length;
  const completedCourses = Math.round((assignedCourses * company.compliancePct) / 100);
  const outstandingCourses = Math.max(0, assignedCourses - completedCourses);
  const assignedUsers = company.usersEnrolled;
  const completedUsers = Math.round((assignedUsers * company.compliancePct) / 100);
  const outstandingUsers = Math.max(0, assignedUsers - completedUsers);
  const status =
    company.compliancePct >= 90 ? "On track" : company.compliancePct >= 70 ? "Watch" : "At risk";
  return {
    assignedCourses,
    completedCourses,
    outstandingCourses,
    assignedUsers,
    completedUsers,
    outstandingUsers,
    status,
    lastTrainingActivity: company.lastReview,
  };
}

export function formatUsd(amount: number): string {
  if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `$${Math.round(amount / 1_000)}k`;
  return `$${amount}`;
}

/** Investment team + board from talantonimpact.com/about/our-team (for HR/user seed). */
export const TALANTON_TEAM_MEMBERS = [
  { fullName: "David Simms", role: "Managing Partner and Founder", department: "Leadership", manager: "", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: true },
  { fullName: "Harry Turner", role: "Partner", department: "Leadership", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Jon Halverson", role: "Partner", department: "Leadership", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Iris Liang", role: "Associate Partner", department: "Investments", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Andy Moore", role: "Associate Partner & CFO", department: "Finance", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Michelle Ochieng", role: "VP Investor Relations", department: "Investor Relations", manager: "David Simms", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Kenneth Muchina", role: "Senior VP East Africa", department: "East Africa", manager: "David Simms", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Desiree Latu", role: "VP Marketing & Administration", department: "Marketing", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Cynthia Omondi", role: "VP Investments", department: "Investments", manager: "Iris Liang", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Mercy Nelima", role: "Senior Manager Finance", department: "Finance", manager: "Andy Moore", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Carol Rubiro", role: "Manager Fund Operations", department: "Fund Operations", manager: "Andy Moore", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Paul Cherry", role: "Business Assessment", department: "Investments", manager: "Cynthia Omondi", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Linda Kiraithe, CFA", role: "Senior Analyst", department: "Investments", manager: "Cynthia Omondi", country: "Kenya", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Julie Turner", role: "Manager, Special Events", department: "Marketing", manager: "Desiree Latu", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Brooke Wyman", role: "Executive Assistant", department: "Administration", manager: "David Simms", country: "United States", employmentType: "full_time", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Kathy Drake", role: "Board Chair", department: "Board", manager: "", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Christian Hilliard", role: "Board Vice Chair", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Dave Tolmie", role: "Board Member, Vice Chair Investment Committee", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Dana Wichterman", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Herve Sarteau", role: "Board Member, Chair Investment Committee", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Jeff Meyer", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Peter Thorrington", role: "Founding Board Chair", department: "Board", manager: "Kathy Drake", country: "United States", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
  { fullName: "Sam Mwale", role: "Board Member", department: "Board", manager: "Kathy Drake", country: "Kenya", employmentType: "contractor", employmentStatus: "active", isEmployee: true, isOwner: false },
] as const;
