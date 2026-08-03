/**
 * Talanton Phase 2 — Learning & portfolio training fixtures.
 * Executive demo data for staff + portfolio company engagement.
 */

import {
  TALANTON_COMPLIANCE_COURSES,
  TALANTON_PORTFOLIO_COMPANIES,
  companyTrainingDetail,
  portfolioTrainingDashboardSummary,
  type PortfolioCompany,
} from "@/lib/talanton/portfolio-data";
import { TALANTON_COMPANY_PORTAL_ROUTES } from "@/lib/talanton/company-portal-routes";

export type LearningCategory =
  | "Governance"
  | "Leadership"
  | "Financial Management"
  | "Impact Measurement"
  | "ESG"
  | "Operations"
  | "Growth & Scaling";

export type LibraryCourse = {
  id: string;
  title: string;
  category: LearningCategory;
  durationHours: number;
  level: "Foundation" | "Intermediate" | "Advanced";
  audience: "Internal Staff" | "Portfolio Companies" | "Both";
  summary: string;
  modules: number;
  certification: boolean;
  popularity: number;
};

export type CertificationRecord = {
  id: string;
  holderName: string;
  holderType: "Internal Staff" | "Portfolio Company";
  companyId: string | null;
  companyName: string | null;
  courseTitle: string;
  issuedOn: string;
  expiresOn: string;
  progressPct: number;
  status: "Active" | "Expiring" | "Expired" | "In Progress";
};

export const LEARNING_LIBRARY: LibraryCourse[] = [
  {
    id: "lib-gov-board",
    title: "Board Governance for Impact Investors",
    category: "Governance",
    durationHours: 4,
    level: "Advanced",
    audience: "Internal Staff",
    summary: "Fiduciary duties, IC cadence, and minutes discipline for faith-driven funds.",
    modules: 6,
    certification: true,
    popularity: 92,
  },
  {
    id: "lib-gov-ethics",
    title: "Ethics, Conflicts & Speak Up",
    category: "Governance",
    durationHours: 2,
    level: "Foundation",
    audience: "Both",
    summary: "Conflicts disclosure, gifts policy and whistleblowing pathways across the portfolio.",
    modules: 4,
    certification: true,
    popularity: 88,
  },
  {
    id: "lib-lead-servant",
    title: "Servant Leadership in SSA Enterprises",
    category: "Leadership",
    durationHours: 3,
    level: "Intermediate",
    audience: "Portfolio Companies",
    summary: "Dignity-of-work leadership practices for founders and supervisors.",
    modules: 5,
    certification: true,
    popularity: 85,
  },
  {
    id: "lib-fin-unit",
    title: "Unit Economics for Growth-Stage Holdings",
    category: "Financial Management",
    durationHours: 3.5,
    level: "Intermediate",
    audience: "Portfolio Companies",
    summary: "Contribution margin, working capital and FX-aware forecasting for SSA operators.",
    modules: 5,
    certification: true,
    popularity: 90,
  },
  {
    id: "lib-fin-lp",
    title: "LP Reporting & Capital Call Readiness",
    category: "Financial Management",
    durationHours: 2.5,
    level: "Advanced",
    audience: "Internal Staff",
    summary: "Prepare investor-grade packs aligned to Talanton LP expectations.",
    modules: 4,
    certification: false,
    popularity: 78,
  },
  {
    id: "lib-impact-jobs",
    title: "Measuring Jobs, Inclusion & Community Reach",
    category: "Impact Measurement",
    durationHours: 3,
    level: "Intermediate",
    audience: "Both",
    summary: "Practical metrics for jobs created/retained, women & youth employment, and communities served.",
    modules: 5,
    certification: true,
    popularity: 94,
  },
  {
    id: "lib-esg-labour",
    title: "Labour Standards & Human Rights Diligence",
    category: "ESG",
    durationHours: 2.5,
    level: "Intermediate",
    audience: "Both",
    summary: "Manufacturing and agri labour standards aligned to Talanton ESG policy.",
    modules: 4,
    certification: true,
    popularity: 86,
  },
  {
    id: "lib-esg-climate",
    title: "Climate Co-Benefits for Portfolio Operators",
    category: "ESG",
    durationHours: 2,
    level: "Foundation",
    audience: "Portfolio Companies",
    summary: "Track climate outcomes alongside commercial KPIs for energy and agri holdings.",
    modules: 3,
    certification: false,
    popularity: 81,
  },
  {
    id: "lib-ops-hse",
    title: "Health, Safety & Operational Excellence",
    category: "Operations",
    durationHours: 2,
    level: "Foundation",
    audience: "Portfolio Companies",
    summary: "Incident reporting, floor safety and ops cadence for manufacturing and logistics.",
    modules: 4,
    certification: true,
    popularity: 83,
  },
  {
    id: "lib-ops-cyber",
    title: "Cyber Hygiene for Digital Holdings",
    category: "Operations",
    durationHours: 2,
    level: "Intermediate",
    audience: "Both",
    summary: "Controls maturity for fintech and connectivity portfolio companies.",
    modules: 4,
    certification: true,
    popularity: 87,
  },
  {
    id: "lib-growth-scale",
    title: "Scaling with Integrity Across East Africa",
    category: "Growth & Scaling",
    durationHours: 3,
    level: "Advanced",
    audience: "Portfolio Companies",
    summary: "Expansion playbooks that protect culture, compliance and impact additionality.",
    modules: 5,
    certification: true,
    popularity: 89,
  },
  {
    id: "lib-growth-offtake",
    title: "Offtake & Distribution Partnerships",
    category: "Growth & Scaling",
    durationHours: 2,
    level: "Intermediate",
    audience: "Portfolio Companies",
    summary: "Structure offtake and faith-aligned distribution without diluting underwriting.",
    modules: 3,
    certification: false,
    popularity: 80,
  },
];

const STAFF_NAMES = [
  "Harry Turner",
  "David Simms",
  "Michelle Ochieng",
  "Andy Moore",
  "Iris Liang",
  "Cynthia Omondi",
  "Kenneth Muchina",
];

export function buildCertificationRecords(): CertificationRecord[] {
  const records: CertificationRecord[] = [];
  let i = 0;
  for (const name of STAFF_NAMES) {
    const course = LEARNING_LIBRARY[i % LEARNING_LIBRARY.length]!;
    const month = String((i % 6) + 1).padStart(2, "0");
    records.push({
      id: `cert-staff-${i}`,
      holderName: name,
      holderType: "Internal Staff",
      companyId: null,
      companyName: null,
      courseTitle: course.title,
      issuedOn: `2025-${month}-15`,
      expiresOn: i % 5 === 0 ? "2026-08-20" : `2027-${month}-15`,
      progressPct: 100,
      status: i % 5 === 0 ? "Expiring" : "Active",
    });
    i++;
  }
  TALANTON_PORTFOLIO_COMPANIES.forEach((c, idx) => {
    const course = LEARNING_LIBRARY[(idx + 2) % LEARNING_LIBRARY.length]!;
    const detail = companyTrainingDetail(c);
    const progress = c.compliancePct;
    let status: CertificationRecord["status"] =
      progress >= 90 ? "Active" : progress >= 50 ? "In Progress" : idx % 7 === 0 ? "Expired" : "In Progress";
    if (idx % 9 === 0) status = "Expiring";
    records.push({
      id: `cert-co-${c.id}`,
      holderName: c.primaryContact,
      holderType: "Portfolio Company",
      companyId: c.id,
      companyName: c.name,
      courseTitle: course.certification ? course.title : TALANTON_COMPLIANCE_COURSES[idx % TALANTON_COMPLIANCE_COURSES.length]!.title,
      issuedOn: c.lastReview,
      expiresOn: status === "Expired" ? "2026-03-01" : status === "Expiring" ? "2026-08-15" : "2027-06-30",
      progressPct: progress,
      status,
    });
    void detail;
  });
  return records;
}

export type CompanyLearningRow = {
  company: PortfolioCompany;
  assigned: number;
  completed: number;
  inProgress: number;
  completionPct: number;
  certifications: number;
  lastActivity: string;
  status: "On track" | "Watch" | "At risk";
  recommended: string[];
};

export function buildCompanyLearningRows(): CompanyLearningRow[] {
  return TALANTON_PORTFOLIO_COMPANIES.map((company, idx) => {
    const detail = companyTrainingDetail(company);
    const inProgress = Math.max(1, Math.round(detail.outstandingCourses * 0.45));
    const certs = buildCertificationRecords().filter(
      (c) => c.companyId === company.id && (c.status === "Active" || c.status === "Expiring"),
    ).length;
    const recommended = LEARNING_LIBRARY.filter((l) => l.audience !== "Internal Staff")
      .sort((a, b) => b.popularity - a.popularity)
      .slice(idx % 3, (idx % 3) + 2)
      .map((l) => l.title);
    return {
      company,
      assigned: detail.assignedCourses,
      completed: detail.completedCourses,
      inProgress,
      completionPct: company.compliancePct,
      certifications: certs,
      lastActivity: detail.lastTrainingActivity,
      status: detail.status as CompanyLearningRow["status"],
      recommended,
    };
  }).sort((a, b) => a.completionPct - b.completionPct);
}

export function buildTrainingExecutiveSummary() {
  const dash = portfolioTrainingDashboardSummary();
  const rows = buildCompanyLearningRows();
  const certs = buildCertificationRecords();
  const activeLearners = TALANTON_PORTFOLIO_COMPANIES.reduce((s, c) => s + c.usersEnrolled, 0);
  const staffCompletion = 86;
  return {
    portfolioCompanies: dash.companyCount,
    activeLearners,
    coursesAssigned: TALANTON_COMPLIANCE_COURSES.length * dash.companyCount,
    coursesCompleted: rows.reduce((s, r) => s + r.completed, 0),
    certificationsEarned: certs.filter((c) => c.status === "Active" || c.status === "Expiring").length,
    staffCompletion,
    mandatoryOpen: dash.outstandingItems,
    upcomingStaff: 4,
    companiesRequiringAttention: dash.below70,
    popularCourses: [...LEARNING_LIBRARY].sort((a, b) => b.popularity - a.popularity).slice(0, 5),
    avgPortfolioCompletion: dash.avgCompletion,
    above90: dash.above90,
    between70And90: dash.between70And90,
    below70: dash.below70,
  };
}

export type PortalManagementRow = {
  companyName: string;
  companyId: string;
  portalUrl: string;
  lastAccess: string;
  portalStatus: "Active" | "Invited" | "Inactive";
  assignedCourses: number;
  learningProgress: number;
  path: string;
};

export function buildPortalManagementRows(): PortalManagementRow[] {
  return TALANTON_COMPANY_PORTAL_ROUTES.filter((r) => r.portalKind !== "board" && r.companyId).map(
    (route, idx) => {
      const company = TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === route.companyId);
      const progress = company?.compliancePct ?? 70;
      const day = String(10 + (idx % 18)).padStart(2, "0");
      const month = String((idx % 6) + 2).padStart(2, "0");
      return {
        companyName: route.displayName,
        companyId: route.companyId,
        portalUrl: `https://talantonimpact.unit311central.com/${route.path}`,
        lastAccess: `2026-${month}-${day}`,
        portalStatus: (idx % 11 === 0 ? "Invited" : idx % 13 === 0 ? "Inactive" : "Active") as PortalManagementRow["portalStatus"],
        assignedCourses: TALANTON_COMPLIANCE_COURSES.length,
        learningProgress: progress,
        path: route.path,
      };
    },
  );
}

export const LEARNING_CATEGORIES: LearningCategory[] = [
  "Governance",
  "Leadership",
  "Financial Management",
  "Impact Measurement",
  "ESG",
  "Operations",
  "Growth & Scaling",
];
