/**
 * ABHI-only recruitment fixtures — HealthTech trade association roles (London).
 */
import type { HrVacancy } from "@/lib/hr-recruitment-data";

function isoDaysFromNow(offset: number) {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Three open roles aligned to ABHI membership, policy, and events work. */
export function buildAbhiRecruitmentVacancies(): HrVacancy[] {
  return [
    {
      id: "abhi-vac-1",
      title: "Membership Engagement Manager",
      department: "Membership",
      location: "London",
      employmentType: "Full time",
      hiringManager: "Peter Ellingworth",
      status: "open",
      openedAt: isoDaysFromNow(-21),
      targetStartDate: isoDaysFromNow(42),
      closingDate: isoDaysFromNow(28),
      headcount: 1,
      salaryBand: "£55–68k",
      description:
        "Grow and retain ABHI member companies across UK HealthTech — account plans, onboarding journeys, and value realisation for SMEs through to multinationals.",
      requirements:
        "B2B membership or association experience · HealthTech / life sciences familiarity · CRM fluency · excellent stakeholder management",
    },
    {
      id: "abhi-vac-2",
      title: "Policy & Public Affairs Advisor",
      department: "UK Market Affairs",
      location: "London / Hybrid",
      employmentType: "Full time",
      hiringManager: "Judith Mellis",
      status: "open",
      openedAt: isoDaysFromNow(-14),
      targetStartDate: isoDaysFromNow(35),
      closingDate: isoDaysFromNow(21),
      headcount: 1,
      salaryBand: "£48–60k",
      description:
        "Shape ABHI positions on MHRA, NICE, and NHS adoption pathways; draft briefings and support member consultation responses.",
      requirements:
        "UK health / medtech policy background · strong written English · parliamentary or regulator engagement preferred · London-based",
    },
    {
      id: "abhi-vac-3",
      title: "Events & Conferences Coordinator",
      department: "Communications",
      location: "London",
      employmentType: "Full time",
      hiringManager: "Charlotte Hart",
      status: "open",
      openedAt: isoDaysFromNow(-7),
      targetStartDate: isoDaysFromNow(30),
      closingDate: isoDaysFromNow(24),
      headcount: 1,
      salaryBand: "£38–46k",
      description:
        "Deliver ABHI member events, roundtables, and the annual conference — venue, programme, sponsors, and on-the-day operations.",
      requirements:
        "Events coordination experience · supplier management · calm under pressure · willingness to travel within the UK",
    },
  ];
}
