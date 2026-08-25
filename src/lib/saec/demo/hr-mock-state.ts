import type { HrMockState } from "@/lib/hr-mock-store";
import { isoDaysFromNow, uid } from "@/lib/hr-mock-store";

export function buildSaecHrMockState(): HrMockState {
  return {
    leaveRequests: [
      {
        id: "saec-leave-1",
        employeeId: "saec-person-thabo",
        employeeName: "Thabo Mokoena",
        department: "Sales",
        location: "Johannesburg",
        role: "Regional Sales Manager",
        managerName: "Dewald Lassen",
        type: "annual",
        startDate: isoDaysFromNow(10),
        endDate: isoDaysFromNow(14),
        days: 5,
        status: "approved",
        notes: "Family travel",
        requestedAt: isoDaysFromNow(-7),
        decidedAt: isoDaysFromNow(-5),
      },
    ],
    leaveBalances: [],
    publicHolidays: [
      {
        id: "saec-hol-heritage",
        name: "Heritage Day",
        date: "2026-09-24",
        calendar: "South Africa",
      },
    ],
    vacancies: [
      {
        id: "saec-vac-eng",
        title: "Senior Installation Engineer",
        department: "Installation",
        location: "Gauteng",
        employmentType: "Full time",
        hiringManager: "Pieter van der Merwe",
        status: "open",
        openedAt: isoDaysFromNow(-21),
        targetStartDate: isoDaysFromNow(45),
        closingDate: isoDaysFromNow(30),
        headcount: 1,
        salaryBand: "R 480k – R 620k",
        description: "Lead escalator and lift installation projects nationally.",
        requirements: "Trade qualification and 5+ years vertical transport experience.",
      },
    ],
    candidates: [],
    reviews: [],
    goals: [],
    reports: [],
    activity: [
      {
        id: uid("saec-hr-act"),
        at: isoDaysFromNow(0),
        label: "SAEC HR dataset loaded",
        detail: "Demonstration employees and recruitment pipeline.",
      },
    ],
  };
}
