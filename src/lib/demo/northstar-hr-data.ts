/**
 * Northstar demo HR fixtures — 25 employees, leave, recruitment, payroll, reports.
 */

import { getDemoEnterpriseFixtures } from "@/lib/demo-enterprise";
import { NORTHSTAR_OFFICE_MAP_MARKERS } from "@/lib/demo/northstar-office-map-data";
import {
  emptyOffboarding,
  type HrCompensationHistoryEntry,
  type HrEmployee,
  type HrEmployeeDetail,
  type HrEmployeeDocument,
  type HrEmployeeNote,
  type HrEmploymentHistoryEntry,
  type HrTimelineEvent,
} from "@/lib/hr-data";
import type { HrAttentionItem } from "@/lib/hr-dashboard-data";
import type { HrLeaveBalance, HrLeaveRequest } from "@/lib/hr-leave-data";
import { blankCompetencyScores, blankQuestionResponses } from "@/lib/hr-performance-data";
import type { HrPerformanceObjective, HrPerformanceReview } from "@/lib/hr-performance-data";
import {
  emptyInterview,
  emptyOfferDetails,
  type HrCandidate,
  type HrVacancy,
} from "@/lib/hr-recruitment-data";
import {
  emptyHrReportFilters,
  type HrSavedReport,
} from "@/lib/hr-reports-data";
import { calculateEmployeePayroll, nextBonusPayDate, prorateAnnualBonus } from "@/lib/payroll/engine";
import type {
  PayrollDashboardSnapshot,
  PayrollEmployeeProfile,
  PayrollRun,
  PayrollSettings,
} from "@/lib/payroll/types";
import { DEFAULT_PAYROLL_SETTINGS } from "@/lib/payroll/types";

export type NorthstarHrEmployee = HrEmployee & {
  profilePhotoUrl: string;
  dateOfBirth: string | null;
};

export type NorthstarFlightRisk = {
  id: string;
  name: string;
  role: string;
  detail: string;
};

const EXTRA_DIRECTORY_ROW = {
  id: "mag-dir-25",
  fullName: "Rachel Nguyen",
  email: "rachel.nguyen@northstar.demo",
  role: "HR Business Partner",
  department: "Human Resources",
  status: "Active",
} as const;

/** mag-dir-* → office city */
const LOCATION_BY_ID: Record<string, string> = {
  "mag-dir-1": "Manchester",
  "mag-dir-2": "Manchester",
  "mag-dir-3": "Manchester",
  "mag-dir-4": "Manchester",
  "mag-dir-5": "Bristol",
  "mag-dir-6": "Bristol",
  "mag-dir-7": "Bristol",
  "mag-dir-8": "Bristol",
  "mag-dir-9": "Bristol",
  "mag-dir-10": "Bristol",
  "mag-dir-11": "Bristol",
  "mag-dir-12": "Austin",
  "mag-dir-13": "Manchester",
  "mag-dir-14": "Manchester",
  "mag-dir-15": "Austin",
  "mag-dir-16": "Austin",
  "mag-dir-17": "Austin",
  "mag-dir-18": "Austin",
  "mag-dir-19": "Austin",
  "mag-dir-20": "Manchester",
  "mag-dir-21": "Manchester",
  "mag-dir-22": "Manchester",
  "mag-dir-23": "Manchester",
  "mag-dir-24": "Manchester",
  "mag-dir-25": "Manchester",
};

/** mag-dir-* → manager employee id */
const MANAGER_BY_ID: Record<string, string | null> = {
  "mag-dir-1": null,
  "mag-dir-2": "mag-dir-1",
  "mag-dir-3": "mag-dir-1",
  "mag-dir-4": "mag-dir-1",
  "mag-dir-5": "mag-dir-4",
  "mag-dir-6": "mag-dir-5",
  "mag-dir-7": "mag-dir-5",
  "mag-dir-8": "mag-dir-5",
  "mag-dir-9": "mag-dir-5",
  "mag-dir-10": "mag-dir-5",
  "mag-dir-11": "mag-dir-5",
  "mag-dir-12": "mag-dir-5",
  "mag-dir-13": "mag-dir-2",
  "mag-dir-14": "mag-dir-13",
  "mag-dir-15": "mag-dir-13",
  "mag-dir-16": "mag-dir-13",
  "mag-dir-17": "mag-dir-13",
  "mag-dir-18": "mag-dir-17",
  "mag-dir-19": "mag-dir-17",
  "mag-dir-20": "mag-dir-2",
  "mag-dir-21": "mag-dir-20",
  "mag-dir-22": "mag-dir-20",
  "mag-dir-23": "mag-dir-3",
  "mag-dir-24": "mag-dir-3",
  "mag-dir-25": "mag-dir-1",
};

const DATE_OF_BIRTH_BY_ID: Record<string, string> = {
  "mag-dir-2": "1981-09-04",
  "mag-dir-5": "1986-10-18",
  "mag-dir-24": "1993-08-29",
};

const PROBATION_END_BY_ID: Record<string, string> = {
  "mag-dir-9": isoDaysFromNow(14),
  "mag-dir-10": isoDaysFromNow(28),
};

const CONTRACT_END_BY_ID: Record<string, string> = {
  "mag-dir-7": isoDaysFromNow(45),
  "mag-dir-22": isoDaysFromNow(32),
};

const SALARY_BASE = 48_000;

export function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function northstarEmployeePhotoUrl(fullName: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0f766e&color=fff&size=128&bold=true`;
}

let cachedEmployees: NorthstarHrEmployee[] | null = null;

export function getNorthstarHrEmployees(): NorthstarHrEmployee[] {
  if (cachedEmployees) return cachedEmployees;
  const fixtures = getDemoEnterpriseFixtures();
  const directory = [...fixtures.directory, EXTRA_DIRECTORY_ROW];
  const byId = new Map(directory.map((row) => [row.id, row]));

  cachedEmployees = directory.map((row, index) => {
    const managerId = MANAGER_BY_ID[row.id] ?? null;
    const managerRow = managerId ? byId.get(managerId) : null;
    const location = LOCATION_BY_ID[row.id] ?? "Manchester";
    const probationEnd = PROBATION_END_BY_ID[row.id] ?? null;
    const contractEnd = CONTRACT_END_BY_ID[row.id] ?? null;
    const onProbation = Boolean(probationEnd);

    return {
      id: row.id,
      employeeNumber: `NST-${String(index + 1).padStart(3, "0")}`,
      fullName: row.fullName,
      preferredName: row.fullName.split(" ")[0] ?? row.fullName,
      email: row.email,
      phone: location === "Austin" ? "+1 512 555 0100" : "+44 161 555 0100",
      address:
        location === "Austin"
          ? "800 Brazos Street, Austin TX 78701"
          : location === "Bristol"
            ? "14 Temple Quay, Bristol BS1 6DZ"
            : "Unit 4, Trafford Park, Manchester M17 1HH",
      suburb: location,
      emergencyContactName: "Emergency Contact",
      emergencyContactPhone: location === "Austin" ? "+1 512 555 0199" : "+44 161 555 0199",
      emergencyContactRelationship: "Partner",
      nationality: location === "Austin" ? "American" : "British",
      employmentStatus: onProbation ? "probation" : "active",
      employmentType: "full_time",
      dateJoined: index < 4 ? "2022-01-15" : `2024-${String((index % 12) + 1).padStart(2, "0")}-01`,
      location,
      officeId:
        location === "Manchester"
          ? "nst-office-man"
          : location === "Bristol"
            ? "nst-office-bri"
            : "nst-office-aus",
      role: row.role,
      department: row.department,
      manager: managerRow?.fullName ?? (managerId ? "Manager" : "Board"),
      managerEmployeeId: managerId,
      probationEndDate: probationEnd,
      endDate: contractEnd,
      currency: "GBP",
      payFrequency: "monthly",
      salaryCurrent: SALARY_BASE + index * 2_400,
      salaryPrevious: SALARY_BASE - 4_000 + index * 2_200,
      salaryIncreaseDate: "2026-04-01",
      salaryIncreaseAmount: 4_000,
      bonus: index % 4 === 0 ? 3_500 : 0,
      holidayCalendar: location === "Austin" ? "United States" : "United Kingdom",
      vacationDaysPerYear: 25,
      vacationDaysTaken: 6 + (index % 7),
      offboarding: emptyOffboarding(),
      archivedAt: null,
      profilePhotoUrl: northstarEmployeePhotoUrl(row.fullName),
      dateOfBirth: DATE_OF_BIRTH_BY_ID[row.id] ?? null,
    };
  });

  return cachedEmployees;
}

export function getNorthstarEmployeeDetail(id: string): HrEmployeeDetail | null {
  const employee = getNorthstarHrEmployees().find((row) => row.id === id);
  if (!employee) return null;

  const joined = employee.dateJoined;
  return {
    ...employee,
    compensationHistory: [
      {
        id: `comp-${id}-1`,
        employeeId: id,
        category: "salary",
        effectiveDate: joined,
        amount: employee.salaryPrevious,
        currency: employee.currency,
        reason: "Starting salary",
        approvedBy: "Rachel Nguyen",
        terms: "",
        createdAt: joined,
        supersededAt: null,
      },
      {
        id: `comp-${id}-2`,
        employeeId: id,
        category: "salary",
        effectiveDate: employee.salaryIncreaseDate ?? joined,
        amount: employee.salaryCurrent,
        currency: employee.currency,
        reason: "Annual review increase",
        approvedBy: "Rachel Nguyen",
        terms: "",
        createdAt: employee.salaryIncreaseDate ?? joined,
        supersededAt: null,
      },
    ] satisfies HrCompensationHistoryEntry[],
    documents: [
      {
        id: `doc-${id}-1`,
        employeeId: id,
        documentType: "employment_contract",
        title: "Employment contract",
        fileName: `${employee.preferredName}-contract.pdf`,
        storagePath: null,
        mimeType: "application/pdf",
        sizeBytes: 245_000,
        uploadedBy: "Rachel Nguyen",
        uploadedAt: joined,
        expiresAt: employee.endDate,
        notes: "Signed copy on file",
      },
      {
        id: `doc-${id}-2`,
        employeeId: id,
        documentType: "right_to_work",
        title: "Right to work",
        fileName: `${employee.preferredName}-rtw.pdf`,
        storagePath: null,
        mimeType: "application/pdf",
        sizeBytes: 128_000,
        uploadedBy: "Rachel Nguyen",
        uploadedAt: joined,
        expiresAt: null,
        notes: null,
      },
    ] satisfies HrEmployeeDocument[],
    notes: [
      {
        id: `note-${id}-1`,
        employeeId: id,
        body: `${employee.preferredName} onboarded successfully — Northstar demo record.`,
        createdBy: "Rachel Nguyen",
        createdAt: joined,
      },
    ] satisfies HrEmployeeNote[],
    timeline: [
      {
        id: `tl-${id}-1`,
        employeeId: id,
        eventType: "joined",
        occurredAt: joined,
        title: "Joined Northstar",
        detail: `${employee.role} · ${employee.department}`,
        source: "hr",
        createdAt: joined,
      },
    ] satisfies HrTimelineEvent[],
    employmentHistory: [
      {
        id: `eh-${id}-1`,
        employeeId: id,
        effectiveDate: joined,
        department: employee.department,
        role: employee.role,
        location: employee.location,
        officeId: employee.officeId,
        managerEmployeeId: employee.managerEmployeeId,
        reason: "Hire",
        createdAt: joined,
      },
    ] satisfies HrEmploymentHistoryEntry[],
  };
}

export function getNorthstarFlightRisks(): NorthstarFlightRisk[] {
  return [
    {
      id: "fr-1",
      name: "Jack Bennett",
      role: "Graduate Engineer",
      detail: "Repeated overtime on Atlas release; competing offer from Bristol SaaS firm.",
    },
    {
      id: "fr-2",
      name: "Elena Hughes",
      role: "Sales Development Rep",
      detail: "High performer — recruiter contact last week; retention review booked.",
    },
  ];
}

export function getNorthstarPeopleByLocation() {
  return NORTHSTAR_OFFICE_MAP_MARKERS.map((office) => ({
    location: office.city,
    region: office.region,
    count: office.employees,
    share: office.employees / 25,
  }));
}

export function getNorthstarPeopleByDepartment() {
  const counts = new Map<string, number>();
  for (const employee of getNorthstarHrEmployees()) {
    counts.set(employee.department, (counts.get(employee.department) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count, share: count / 25 }))
    .sort((a, b) => b.count - a.count);
}

export function buildNorthstarLeaveRequests(): HrLeaveRequest[] {
  const employees = getNorthstarHrEmployees();
  const byName = new Map(employees.map((row) => [row.fullName, row]));
  const pick = (name: string) => byName.get(name)!;

  const sophie = pick("Sophie Powell");
  const chris = pick("Chris Barker");
  const jack = pick("Jack Bennett");
  const laura = pick("Laura Hart");
  const ethan = pick("Ethan Whitfield");

  return [
    {
      id: "nst-leave-1",
      employeeId: sophie.id,
      employeeName: sophie.fullName,
      department: sophie.department,
      location: sophie.location,
      role: sophie.role,
      managerName: sophie.manager,
      type: "annual",
      startDate: isoDaysFromNow(-2),
      endDate: isoDaysFromNow(5),
      days: 6,
      status: "approved",
      notes: "Summer break",
      requestedAt: isoDaysFromNow(-14),
      decidedAt: isoDaysFromNow(-10),
    },
    {
      id: "nst-leave-2",
      employeeId: chris.id,
      employeeName: chris.fullName,
      department: chris.department,
      location: chris.location,
      role: chris.role,
      managerName: chris.manager,
      type: "sick",
      startDate: isoDaysFromNow(-1),
      endDate: isoDaysFromNow(2),
      days: 3,
      status: "approved",
      notes: "Medical certificate received",
      requestedAt: isoDaysFromNow(-1),
      decidedAt: isoDaysFromNow(-1),
    },
    {
      id: "nst-leave-3",
      employeeId: jack.id,
      employeeName: jack.fullName,
      department: jack.department,
      location: jack.location,
      role: jack.role,
      managerName: jack.manager,
      type: "maternity_paternity",
      startDate: isoDaysFromNow(-3),
      endDate: isoDaysFromNow(11),
      days: 14,
      status: "approved",
      notes: "Paternity leave",
      requestedAt: isoDaysFromNow(-20),
      decidedAt: isoDaysFromNow(-18),
    },
    {
      id: "nst-leave-4",
      employeeId: laura.id,
      employeeName: laura.fullName,
      department: laura.department,
      location: laura.location,
      role: laura.role,
      managerName: laura.manager,
      type: "training",
      startDate: isoDaysFromNow(0),
      endDate: isoDaysFromNow(0),
      days: 1,
      status: "approved",
      notes: "Firmware safety certification",
      requestedAt: isoDaysFromNow(-7),
      decidedAt: isoDaysFromNow(-5),
    },
    {
      id: "nst-leave-5",
      employeeId: ethan.id,
      employeeName: ethan.fullName,
      department: ethan.department,
      location: ethan.location,
      role: ethan.role,
      managerName: ethan.manager,
      type: "remote",
      startDate: isoDaysFromNow(0),
      endDate: isoDaysFromNow(0),
      days: 1,
      status: "approved",
      notes: "Working remotely today",
      requestedAt: isoDaysFromNow(-2),
      decidedAt: isoDaysFromNow(-2),
    },
  ];
}

function buildNorthstarLeaveBalances(): HrLeaveBalance[] {
  return getNorthstarHrEmployees().slice(0, 12).map((employee, index) => ({
    employeeId: employee.id,
    employeeName: employee.fullName,
    department: employee.department,
    location: employee.location,
    annualAllocated: 25,
    annualTaken: 4 + (index % 6),
    sickTaken: index % 5 === 0 ? 2 : 0,
    trainingTaken: index % 7 === 0 ? 1 : 0,
  }));
}

export function buildNorthstarRecruitmentVacancies(): HrVacancy[] {
  return [
    {
      id: "nst-vac-1",
      title: "Senior Firmware Engineer",
      department: "Engineering",
      location: "Bristol",
      employmentType: "Full time",
      hiringManager: "Mia Bennett",
      status: "open",
      openedAt: isoDaysFromNow(-18),
      targetStartDate: isoDaysFromNow(60),
      closingDate: isoDaysFromNow(45),
      headcount: 1,
      salaryBand: "£55k – £68k",
      description: "Lead embedded firmware for Atlas edge devices.",
      requirements: "5+ years C/C++, RTOS, and industrial IoT experience.",
    },
    {
      id: "nst-vac-2",
      title: "Enterprise Account Executive",
      department: "Sales",
      location: "Austin",
      employmentType: "Full time",
      hiringManager: "Emily Hughes",
      status: "open",
      openedAt: isoDaysFromNow(-12),
      targetStartDate: isoDaysFromNow(50),
      closingDate: isoDaysFromNow(38),
      headcount: 1,
      salaryBand: "$95k OTE",
      description: "Own mid-market manufacturing accounts across Texas.",
      requirements: "B2B SaaS or industrial software sales track record.",
    },
    {
      id: "nst-vac-3",
      title: "Customer Success Manager",
      department: "Customer Success",
      location: "Austin",
      employmentType: "Full time",
      hiringManager: "Aisha Bailey",
      status: "open",
      openedAt: isoDaysFromNow(-8),
      targetStartDate: isoDaysFromNow(55),
      closingDate: isoDaysFromNow(42),
      headcount: 1,
      salaryBand: "$72k – $82k",
      description: "Post-sale adoption for Northstar Atlas deployments.",
      requirements: "Manufacturing or OT customer success background.",
    },
  ];
}

const CANDIDATE_NAMES = [
  "Priya Sharma",
  "Tom Richardson",
  "Amelia Brooks",
  "Jordan Lee",
  "Fatima Okonkwo",
  "Connor Walsh",
  "Nina Petrov",
  "Ryan O'Connor",
  "Sofia Mendez",
  "Ben Harper",
  "Leila Hassan",
  "Marcus Webb",
] as const;

export function buildNorthstarRecruitmentCandidates(): HrCandidate[] {
  const vacancies = buildNorthstarRecruitmentVacancies();
  const stages = [
    "applications",
    "applications",
    "screening",
    "screening",
    "interview",
    "interview",
    "offer",
    "onboarding",
  ] as const;

  return CANDIDATE_NAMES.map((name, index) => {
    const vacancy = vacancies[index % vacancies.length]!;
    const stage = stages[index % stages.length]!;
    const interview =
      stage === "interview" || stage === "offer"
        ? emptyInterview({
            id: `nst-int-${index + 1}`,
            scheduledAt: `${isoDaysFromNow(index % 5 + 1)}T${10 + (index % 4)}:${index % 2 === 0 ? "00" : "30"}:00`,
            type: index % 3 === 0 ? "onsite" : "video",
            interviewer: vacancy.hiringManager,
            interviewers: vacancy.hiringManager,
            status: "scheduled",
            outcome: "pending",
            notes: "",
            meetingUrl: `https://teams.microsoft.com/l/meetup-join/northstar-demo-${index + 1}`,
          })
        : emptyInterview();

    return {
      id: `nst-cand-${index + 1}`,
      name,
      email: `${name.toLowerCase().replace(/[^a-z]/g, ".")}@talent.northstar.demo`,
      phone: index % 2 === 0 ? "+44 7700 900" + String(100 + index) : "+1 512 555 12" + String(10 + index),
      vacancyId: vacancy.id,
      role: vacancy.title,
      department: vacancy.department,
      location: vacancy.location,
      stage,
      rating: 3 + (index % 3),
      interviewer: vacancy.hiringManager,
      recruiter: "Rachel Nguyen",
      expectedSalary: vacancy.salaryBand,
      availability: index % 2 === 0 ? "2 weeks" : "4 weeks",
      source: ["LinkedIn", "Referral", "Agency", "Careers page"][index % 4]!,
      appliedAt: isoDaysFromNow(-(12 + index)),
      notes: "Northstar manufacturing ICP fit.",
      cvLabel: `${name.replace(/\s+/g, "-")}-CV.pdf`,
      rejected: false,
      interviews: [interview],
      offer: stage === "offer" ? { ...emptyOfferDetails(), status: "sent", salary: vacancy.salaryBand } : emptyOfferDetails(),
      timeline: [
        {
          id: `nst-cand-tl-${index + 1}`,
          at: isoDaysFromNow(-(12 + index)),
          label: "Applied",
          detail: `Applied for ${vacancy.title}`,
        },
      ],
    };
  });
}

function buildNorthstarPerformanceReviews(): HrPerformanceReview[] {
  return getNorthstarHrEmployees().slice(0, 6).map((row, index) => ({
    id: `rev-nst-${index + 1}`,
    employeeId: row.id,
    employeeName: row.fullName,
    department: row.department,
    role: row.role,
    managerName: row.manager,
    reviewPeriod: "H1 2026",
    status: index % 3 === 0 ? "draft" : "submitted",
    overallRating: ([4, 5, 4, 3, 4, 5] as const)[index % 6]!,
    strengths: "Strong delivery on Atlas programmes and clear cross-site communication.",
    areasForImprovement: "Protect focus time during concurrent customer go-lives.",
    trainingRecommendations: "Advanced leadership programme",
    promotionRecommendation: index < 2 ? "later" : "no",
    salaryReviewRecommendation: "increase",
    managerRecommendation: "develop",
    employeeGoals: "Own two customer deployments and mentor one graduate engineer.",
    nextReviewDate: isoDaysFromNow(90 + index * 5),
    summary: "On track for H1 objectives.",
    responses: blankQuestionResponses(),
    objectives: [] as HrPerformanceObjective[],
    competencies: blankCompetencyScores(),
    developmentPlan: [],
    createdAt: isoDaysFromNow(-(40 + index)),
    updatedAt: isoDaysFromNow(-(8 + index)),
    submittedAt: index % 3 === 0 ? null : isoDaysFromNow(-(6 + index)),
    approvedAt: null,
    completedAt: null,
  }));
}

export function buildNorthstarHrReports(): HrSavedReport[] {
  return [
    {
      id: "nst-rep-1",
      name: "Northstar Headcount — Aug 2026",
      kind: "headcount",
      output: "excel",
      filters: emptyHrReportFilters(),
      createdAt: isoDaysFromNow(-2),
      updatedAt: isoDaysFromNow(-2),
      createdBy: "Rachel Nguyen",
      rowCount: 25,
      previewLines: [
        "Headcount",
        "As at Aug 2026",
        "",
        "Office,Count,Share",
        "Manchester,12,48%",
        "Bristol,7,28%",
        "Austin,6,24%",
      ],
    },
    {
      id: "nst-rep-2",
      name: "Leave Summary — Q3 2026",
      kind: "leave_summary",
      output: "pdf",
      filters: { ...emptyHrReportFilters(), dateFrom: "2026-07-01", dateTo: "2026-09-30" },
      createdAt: isoDaysFromNow(-4),
      updatedAt: isoDaysFromNow(-4),
      createdBy: "Rachel Nguyen",
      rowCount: 8,
      previewLines: [
        "Leave Summary",
        "3 employees on leave today",
        "",
        "Type,Approved days,Pending",
        "Annual,42,1",
        "Sick,6,0",
        "Paternity,14,0",
      ],
    },
    {
      id: "nst-rep-3",
      name: "Engineering Performance — H1 2026",
      kind: "performance_summary",
      output: "pdf",
      filters: { ...emptyHrReportFilters(), department: "Engineering" },
      createdAt: isoDaysFromNow(-6),
      updatedAt: isoDaysFromNow(-6),
      createdBy: "Mia Bennett",
      rowCount: 8,
      previewLines: ["Performance Summary", "Engineering", "", "Rating band,Count", "4–5,6", "3,2"],
    },
    {
      id: "nst-rep-4",
      name: "Fixed-term Contract Expiry",
      kind: "contract_expiry",
      output: "csv",
      filters: emptyHrReportFilters(),
      createdAt: isoDaysFromNow(-1),
      updatedAt: isoDaysFromNow(-1),
      createdBy: "Rachel Nguyen",
      rowCount: 2,
      previewLines: [
        "Contract Expiry",
        "Next 60 days",
        "",
        "Employee,End date,Department",
        "Elena Reed," + isoDaysFromNow(45) + ",Engineering",
        "Priya Kelly," + isoDaysFromNow(32) + ",Operations",
      ],
    },
    {
      id: "nst-rep-5",
      name: "Open Roles Pipeline — Aug 2026",
      kind: "recruitment",
      output: "excel",
      filters: emptyHrReportFilters(),
      createdAt: isoDaysFromNow(-3),
      updatedAt: isoDaysFromNow(-3),
      createdBy: "Rachel Nguyen",
      rowCount: 12,
      previewLines: [
        "Recruitment Pipeline",
        "3 open vacancies · 12 active candidates",
        "",
        "Stage,Candidates",
        "Applications,2",
        "Screening,2",
        "Interview,2",
        "Offer,1",
        "Onboarding,1",
      ],
    },
  ];
}

export function buildNorthstarHrMockState() {
  const employees = getNorthstarHrEmployees();
  return {
    leaveRequests: buildNorthstarLeaveRequests(),
    leaveBalances: buildNorthstarLeaveBalances(),
    publicHolidays: [
      {
        id: "hol-nst-1",
        name: "UK Summer Bank Holiday",
        date: isoDaysFromNow(18),
        calendar: "United Kingdom",
      },
      {
        id: "hol-nst-2",
        name: "Labor Day (US)",
        date: "2026-09-07",
        calendar: "United States",
      },
    ],
    vacancies: buildNorthstarRecruitmentVacancies(),
    candidates: buildNorthstarRecruitmentCandidates(),
    reviews: buildNorthstarPerformanceReviews(),
    goals: employees.slice(0, 6).map((row, index) => ({
      id: `goal-nst-${index + 1}`,
      title: index % 2 === 0 ? "Atlas release quality ≥ 99.5%" : "Customer NPS ≥ 4.6",
      description: "Northstar H1 operational objective.",
      progressPercent: 62 + (index % 25),
      dueDate: isoDaysFromNow(75 + index * 4),
      status: "on_track" as const,
      weight: 25,
      owner: row.fullName,
      scope: "employee" as const,
      employeeId: row.id,
      employeeName: row.fullName,
      department: row.department,
    })),
    reports: buildNorthstarHrReports(),
    activity: [],
  };
}

export function getNorthstarPayrollSettings(): PayrollSettings {
  return {
    workspaceId: "northstar-demo",
    ...DEFAULT_PAYROLL_SETTINGS,
    defaultCurrency: "GBP",
    countryCode: "GB",
    defaultTaxState: "ENG",
    federalTaxPct: 20,
    stateTaxPct: 0,
    socialSecurityPct: 12,
    medicarePct: 0,
    employerPayrollPct: 13.8,
    payrollFrequency: "monthly",
    payDay: 28,
    updatedAt: new Date().toISOString(),
  };
}

export function getNorthstarPayrollDashboard(): PayrollDashboardSnapshot {
  const employees = getNorthstarHrEmployees();
  const settings = getNorthstarPayrollSettings();
  const monthlyGross = employees.reduce((sum, row) => sum + row.salaryCurrent / 12 + row.bonus / 12, 0);
  const employerTax = Math.round(monthlyGross * (settings.employerPayrollPct / 100));
  const employeeTax = Math.round(monthlyGross * 0.28);
  const net = Math.round(monthlyGross - employeeTax);

  const deptMap = new Map<string, { gross: number; net: number; employees: number }>();
  for (const row of employees) {
    const gross = row.salaryCurrent / 12 + row.bonus / 12;
    const entry = deptMap.get(row.department) ?? { gross: 0, net: 0, employees: 0 };
    entry.gross += gross;
    entry.net += gross * 0.72;
    entry.employees += 1;
    deptMap.set(row.department, entry);
  }

  const recentRuns: PayrollRun[] = [
    {
      id: "nst-run-1",
      workspaceId: "northstar-demo",
      periodStart: "2026-07-01",
      periodEnd: "2026-07-31",
      payDate: "2026-07-28",
      status: "paid",
      employeeCount: 25,
      grossPayroll: Math.round(monthlyGross),
      employeeTax,
      employerTax,
      netPayroll: net,
      currency: "GBP",
      journalEntryId: null,
      paymentJournalEntryId: null,
      wiseBatchId: null,
      wisePaymentStatus: "paid",
      notes: "July payroll — 25 employees",
      createdAt: "2026-07-25T09:00:00.000Z",
      updatedAt: "2026-07-28T08:30:00.000Z",
      approvedAt: "2026-07-26T11:00:00.000Z",
      paidAt: "2026-07-28T08:30:00.000Z",
    },
  ];

  return {
    monthlyGrossPayroll: Math.round(monthlyGross),
    estimatedEmployerTaxes: employerTax,
    estimatedEmployeeTaxWithheld: employeeTax,
    estimatedNetPayroll: net,
    nextPayrollDate: isoDaysFromNow(11),
    nextBonusPayDate: nextBonusPayDate(settings),
    totalBonusDueThisYear: employees.reduce((sum, row) => sum + row.bonus, 0),
    payrollRunStatus: "ready",
    employeesPaid: 25,
    pendingPayroll: 0,
    averageSalary: Math.round(employees.reduce((sum, row) => sum + row.salaryCurrent + row.bonus, 0) / employees.length),
    currency: "GBP",
    employeeCount: 25,
    trend: ["Mar", "Apr", "May", "Jun", "Jul", "Aug"].map((month, index) => ({
      month,
      gross: Math.round(monthlyGross * (0.97 + index * 0.01)),
      net: Math.round(net * (0.97 + index * 0.01)),
      employerTax: Math.round(employerTax * (0.97 + index * 0.01)),
    })),
    departmentBreakdown: [...deptMap.entries()].map(([department, row]) => ({
      department,
      gross: Math.round(row.gross),
      net: Math.round(row.net),
      employees: row.employees,
    })),
    upcomingCalendar: [
      { date: isoDaysFromNow(11), label: "Monthly payroll run", amount: Math.round(monthlyGross) },
      { date: "2026-12-31", label: "Annual bonus run", amount: employees.reduce((sum, row) => sum + row.bonus, 0) },
    ],
    recentRuns,
  };
}

export function getNorthstarEmployeePayrollProfile(employeeId: string) {
  const employee = getNorthstarHrEmployees().find((row) => row.id === employeeId);
  if (!employee) return null;
  const settings = getNorthstarPayrollSettings();
  const profile: PayrollEmployeeProfile = {
    id: `pay-${employeeId}`,
    workspaceId: "northstar-demo",
    employeeId,
    annualSalary: employee.salaryCurrent,
    monthlySalary: employee.salaryCurrent / 12,
    hourlyRate: null,
    bonus: employee.bonus,
    commission: 0,
    payrollFrequency: "monthly",
    currency: employee.currency,
    taxState: employee.location === "Austin" ? "TX" : "ENG",
    federalTaxPct: null,
    stateTaxPct: null,
    socialSecurityPct: null,
    medicarePct: null,
    employerPayrollPct: null,
    payrollStatus: "active",
    bankAccount: "****4821",
    routingNumber: "****",
    payrollEmployeeId: employee.employeeNumber,
    taxId: "****",
    hireDate: employee.dateJoined,
    terminationDate: null,
    manager: employee.manager,
    department: employee.department,
    costCentre: employee.department,
    updatedAt: new Date().toISOString(),
  };
  const calculation = calculateEmployeePayroll(
    {
      salaryCurrent: employee.salaryCurrent,
      bonus: employee.bonus,
      payFrequency: employee.payFrequency,
      currency: employee.currency,
      profile,
      joinedOn: employee.dateJoined,
    },
    settings,
  );
  const nextBonus = nextBonusPayDate(settings);
  const bonusDueThisYear = prorateAnnualBonus({
    annualBonus: employee.bonus,
    joinedOn: employee.dateJoined,
    year: Number(nextBonus.slice(0, 4)),
    throughMonth: settings.bonusPayMonth,
  });
  return { profile, calculation, settings, employee, nextBonusPayDate: nextBonus, bonusDueThisYear };
}

export function listNorthstarAttentionContracts(): HrAttentionItem[] {
  return getNorthstarHrEmployees()
    .filter((row) => row.endDate)
    .map((row) => ({
      id: `contract-${row.id}`,
      name: row.fullName,
      detail: `Contract ends ${row.endDate}`,
      when: row.endDate,
      meta: row.department,
    }));
}
