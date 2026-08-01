/**
 * Talanton Impact — portfolio, compliance training, governance & reporting fixtures.
 * Client-side seed only; scoped to the Talanton host via surface helpers.
 */

export type RiskRating = "Low" | "Medium" | "High" | "Critical";

export type PortfolioCompany = {
  id: string;
  name: string;
  country: string;
  sector: string;
  employeeCount: number;
  compliancePct: number;
  outstandingTraining: number;
  riskRating: RiskRating;
  usersEnrolled: number;
  coursesAssigned: number;
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

const RISK_CYCLE: RiskRating[] = ["Low", "Medium", "High", "Medium", "Low", "Critical", "Medium"];

/** Exact portfolio list approved for Talanton Impact. */
const COMPANY_SEEDS: Array<{
  name: string;
  country: string;
  sector: string;
  employees: number;
}> = [
  { name: "Ethical Apparel Africa", country: "Ghana", sector: "Apparel & Manufacturing", employees: 420 },
  { name: "ARC Ride", country: "Kenya", sector: "Mobility & Logistics", employees: 185 },
  { name: "Burn Manufacturing", country: "Kenya", sector: "Clean Energy", employees: 310 },
  { name: "Kentegra Biotechnology", country: "Kenya", sector: "Agri-biotech", employees: 96 },
  { name: "Long Miles Coffee", country: "Burundi", sector: "Agriculture & Food", employees: 140 },
  { name: "Pharmakina", country: "DRC", sector: "Healthcare & Pharma", employees: 520 },
  { name: "Moko Home + Living", country: "Kenya", sector: "Consumer Goods", employees: 210 },
  { name: "Power Resources International", country: "Uganda", sector: "Energy Infrastructure", employees: 78 },
  { name: "Auto Springs East Africa PLC", country: "Ethiopia", sector: "Automotive Manufacturing", employees: 640 },
  { name: "BioFarms Limited", country: "Uganda", sector: "Agriculture & Food", employees: 155 },
  { name: "Enda Sportswear", country: "Kenya", sector: "Apparel & Manufacturing", employees: 88 },
  { name: "Kijani Forestry", country: "Kenya", sector: "Forestry & Climate", employees: 62 },
  { name: "Kivu Tilapia Farm Ltd", country: "Rwanda", sector: "Aquaculture", employees: 74 },
  { name: "Masaka Farms", country: "Uganda", sector: "Agriculture & Food", employees: 118 },
  { name: "OWP Pharmaceuticals", country: "Kenya", sector: "Healthcare & Pharma", employees: 245 },
  { name: "Pezesha", country: "Kenya", sector: "Fintech & Inclusion", employees: 92 },
  { name: "poa! Internet", country: "Kenya", sector: "Connectivity & Telecom", employees: 268 },
  { name: "Rabboni Group", country: "Kenya", sector: "Manufacturing & Distribution", employees: 330 },
  { name: "Taraji Afrika", country: "Tanzania", sector: "Agriculture & Food", employees: 104 },
];

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const TALANTON_PORTFOLIO_COMPANIES: PortfolioCompany[] = COMPANY_SEEDS.map((seed, index) => {
  const compliancePct = Math.min(98, Math.max(62, 88 - (index % 7) * 3 + (index % 3)));
  const outstandingTraining = Math.max(0, Math.round((100 - compliancePct) / 4) + (index % 5));
  const usersEnrolled = Math.max(12, Math.round(seed.employees * 0.35) + (index % 9));
  return {
    id: `ti-co-${slugify(seed.name)}`,
    name: seed.name,
    country: seed.country,
    sector: seed.sector,
    employeeCount: seed.employees,
    compliancePct,
    outstandingTraining,
    riskRating: RISK_CYCLE[index % RISK_CYCLE.length]!,
    usersEnrolled,
    coursesAssigned: 11,
    lastReview: `2026-0${(index % 6) + 1}-${String(10 + (index % 18)).padStart(2, "0")}`,
  };
});

export const TALANTON_COMPLIANCE_COURSES: ComplianceCourse[] = [
  {
    id: "ti-course-abc",
    title: "Anti-Bribery & Corruption",
    category: "Ethics & Integrity",
    durationMinutes: 45,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 78,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-aml",
    title: "AML",
    category: "Financial Crime",
    durationMinutes: 40,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 74,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-conduct",
    title: "Code of Conduct & Ethics",
    category: "Ethics & Integrity",
    durationMinutes: 35,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 86,
    renewEveryMonths: 24,
  },
  {
    id: "ti-course-coi",
    title: "Conflicts of Interest",
    category: "Ethics & Integrity",
    durationMinutes: 30,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 81,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-infosec",
    title: "Information Security & Data Privacy",
    category: "Cyber & Privacy",
    durationMinutes: 50,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 72,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-whistle",
    title: "Whistleblowing & Speak Up",
    category: "Ethics & Integrity",
    durationMinutes: 25,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 83,
    renewEveryMonths: 24,
  },
  {
    id: "ti-course-dei",
    title: "DEI & Equal Opportunities",
    category: "People & Culture",
    durationMinutes: 40,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 77,
    renewEveryMonths: 24,
  },
  {
    id: "ti-course-harassment",
    title: "Harassment & Bullying Prevention",
    category: "People & Culture",
    durationMinutes: 35,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 80,
    renewEveryMonths: 24,
  },
  {
    id: "ti-course-procurement",
    title: "Procurement, Gifts & Hospitality",
    category: "Procurement",
    durationMinutes: 30,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 69,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-hs",
    title: "Health & Safety",
    category: "Operations",
    durationMinutes: 45,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 85,
    renewEveryMonths: 12,
  },
  {
    id: "ti-course-slavery",
    title: "Modern Slavery & Human Rights",
    category: "Human Rights",
    durationMinutes: 40,
    mandatory: true,
    assignedCompanies: 19,
    completionPct: 71,
    renewEveryMonths: 12,
  },
];

export const TALANTON_POLICIES: GovernancePolicy[] = [
  {
    id: "ti-pol-abc",
    title: "Anti-Bribery & Corruption Policy",
    owner: "Head of Compliance",
    version: "2.1",
    status: "Published",
    lastReviewed: "2026-01-15",
    nextReview: "2027-01-15",
  },
  {
    id: "ti-pol-aml",
    title: "AML & Sanctions Policy",
    owner: "Head of Compliance",
    version: "1.4",
    status: "Published",
    lastReviewed: "2025-11-02",
    nextReview: "2026-11-02",
  },
  {
    id: "ti-pol-speakup",
    title: "Speak Up / Whistleblowing Policy",
    owner: "General Counsel",
    version: "1.2",
    status: "Published",
    lastReviewed: "2026-02-20",
    nextReview: "2027-02-20",
  },
  {
    id: "ti-pol-data",
    title: "Data Protection & Privacy Policy",
    owner: "Data Protection Officer",
    version: "3.0",
    status: "In Review",
    lastReviewed: "2025-09-10",
    nextReview: "2026-09-10",
  },
  {
    id: "ti-pol-esg",
    title: "Portfolio ESG & Human Rights Policy",
    owner: "Impact Director",
    version: "1.0",
    status: "Published",
    lastReviewed: "2026-03-01",
    nextReview: "2027-03-01",
  },
  {
    id: "ti-pol-gifts",
    title: "Gifts & Hospitality Policy",
    owner: "Head of Compliance",
    version: "1.1",
    status: "Draft",
    lastReviewed: "2026-04-12",
    nextReview: "2026-10-12",
  },
];

export const TALANTON_RISKS: RiskRegisterItem[] = [
  {
    id: "ti-risk-1",
    title: "Supply-chain labour standards gaps",
    companyId: "ti-co-ethical-apparel-africa",
    category: "Human Rights",
    likelihood: "Medium",
    impact: "High",
    rating: "High",
    owner: "Impact Director",
    status: "Mitigating",
    dueDate: "2026-09-30",
  },
  {
    id: "ti-risk-2",
    title: "Incomplete AML refresher coverage",
    companyId: "ti-co-pezesha",
    category: "Financial Crime",
    likelihood: "Medium",
    impact: "Medium",
    rating: "Medium",
    owner: "Head of Compliance",
    status: "Open",
    dueDate: "2026-08-15",
  },
  {
    id: "ti-risk-3",
    title: "Cybersecurity controls maturity",
    companyId: "ti-co-poa-internet",
    category: "Cyber & Privacy",
    likelihood: "High",
    impact: "High",
    rating: "Critical",
    owner: "Technology Risk Lead",
    status: "Mitigating",
    dueDate: "2026-08-01",
  },
  {
    id: "ti-risk-4",
    title: "Health & safety incident reporting lag",
    companyId: "ti-co-burn-manufacturing",
    category: "Operations",
    likelihood: "Medium",
    impact: "High",
    rating: "High",
    owner: "Portfolio Ops",
    status: "Open",
    dueDate: "2026-09-01",
  },
  {
    id: "ti-risk-5",
    title: "Conflicts of interest disclosures overdue",
    companyId: null,
    category: "Ethics & Integrity",
    likelihood: "Low",
    impact: "Medium",
    rating: "Medium",
    owner: "General Counsel",
    status: "Open",
    dueDate: "2026-08-20",
  },
  {
    id: "ti-risk-6",
    title: "Modern slavery due-diligence depth",
    companyId: "ti-co-auto-springs-east-africa-plc",
    category: "Human Rights",
    likelihood: "Medium",
    impact: "High",
    rating: "High",
    owner: "Impact Director",
    status: "Mitigating",
    dueDate: "2026-10-15",
  },
];

export const TALANTON_ACTIONS: GovernanceAction[] = [
  {
    id: "ti-act-1",
    title: "Close outstanding Modern Slavery modules at Auto Springs",
    companyId: "ti-co-auto-springs-east-africa-plc",
    owner: "Portfolio Ops",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-08-10",
    source: "Compliance Dashboard",
  },
  {
    id: "ti-act-2",
    title: "Publish updated Gifts & Hospitality Policy",
    companyId: null,
    owner: "Head of Compliance",
    priority: "Medium",
    status: "Open",
    dueDate: "2026-08-25",
    source: "Policies",
  },
  {
    id: "ti-act-3",
    title: "Complete infosec remediation plan with poa! Internet",
    companyId: "ti-co-poa-internet",
    owner: "Technology Risk Lead",
    priority: "High",
    status: "In Progress",
    dueDate: "2026-08-01",
    source: "Risk Register",
  },
  {
    id: "ti-act-4",
    title: "Schedule Q3 portfolio compliance board pack",
    companyId: null,
    owner: "Impact Director",
    priority: "Medium",
    status: "Open",
    dueDate: "2026-09-05",
    source: "Reporting",
  },
  {
    id: "ti-act-5",
    title: "Follow up overdue AML assignments at Pezesha",
    companyId: "ti-co-pezesha",
    owner: "Head of Compliance",
    priority: "High",
    status: "Open",
    dueDate: "2026-08-05",
    source: "My Training",
  },
  {
    id: "ti-act-6",
    title: "Archive closed Speak Up investigation actions",
    companyId: null,
    owner: "General Counsel",
    priority: "Low",
    status: "Done",
    dueDate: "2026-07-15",
    source: "Action Tracking",
  },
];

const LEARNER_NAMES = [
  "Amina Otieno",
  "Kwame Mensah",
  "Grace Uwimana",
  "Daniel Okello",
  "Fatima Diallo",
  "James Kariuki",
  "Sarah Nalwanga",
  "Michael Abebe",
];

export const TALANTON_MY_TRAINING: MyTrainingRow[] = TALANTON_COMPLIANCE_COURSES.flatMap(
  (course, courseIndex) => {
    const company = TALANTON_PORTFOLIO_COMPANIES[courseIndex % TALANTON_PORTFOLIO_COMPANIES.length]!;
    const statuses: MyTrainingRow["status"][] = [
      "Completed",
      "In Progress",
      "Overdue",
      "Not Started",
    ];
    const status = statuses[courseIndex % statuses.length]!;
    const progress =
      status === "Completed" ? 100 : status === "In Progress" ? 55 : status === "Overdue" ? 20 : 0;
    return [
      {
        id: `ti-mt-${course.id}`,
        courseId: course.id,
        companyId: company.id,
        learnerName: LEARNER_NAMES[courseIndex % LEARNER_NAMES.length]!,
        status,
        progress,
        dueDate: `2026-0${(courseIndex % 3) + 7}-${String(5 + courseIndex).padStart(2, "0")}`,
      },
    ];
  },
);

export function companyNameById(id: string | null): string {
  if (!id) return "Portfolio-wide";
  return TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? "Unknown";
}

export function courseTitleById(id: string): string {
  return TALANTON_COMPLIANCE_COURSES.find((c) => c.id === id)?.title ?? id;
}

export function portfolioComplianceSummary() {
  const companies = TALANTON_PORTFOLIO_COMPANIES;
  const avgCompliance = Math.round(
    companies.reduce((sum, c) => sum + c.compliancePct, 0) / companies.length,
  );
  const outstanding = companies.reduce((sum, c) => sum + c.outstandingTraining, 0);
  const highRisk = companies.filter(
    (c) => c.riskRating === "High" || c.riskRating === "Critical",
  ).length;
  const openActions = TALANTON_ACTIONS.filter((a) => a.status !== "Done").length;
  return {
    companyCount: companies.length,
    avgCompliance,
    outstanding,
    highRisk,
    openActions,
    courseCount: TALANTON_COMPLIANCE_COURSES.length,
  };
}
