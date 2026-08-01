/**
 * ABHI compliance training catalog — same programme as Talanton Assigned Courses.
 */

export type AbhiComplianceCourse = {
  id: string;
  slug: string;
  title: string;
  category: string;
  durationMinutes: number;
  mandatory: boolean;
  /** Demo progress for Assigned view until LMS enrolments exist. */
  progressPct: number;
  status: "assigned" | "in_progress" | "completed";
};

export const ABHI_COMPLIANCE_COURSES: AbhiComplianceCourse[] = [
  {
    id: "abhi-crs-abc",
    slug: "anti-bribery",
    title: "Anti-Bribery & Corruption",
    category: "Ethics & Integrity",
    durationMinutes: 45,
    mandatory: true,
    progressPct: 78,
    status: "in_progress",
  },
  {
    id: "abhi-crs-aml",
    slug: "aml",
    title: "AML",
    category: "Financial Crime",
    durationMinutes: 40,
    mandatory: true,
    progressPct: 74,
    status: "in_progress",
  },
  {
    id: "abhi-crs-conduct",
    slug: "code-of-conduct",
    title: "Code of Conduct",
    category: "Ethics & Integrity",
    durationMinutes: 35,
    mandatory: true,
    progressPct: 86,
    status: "in_progress",
  },
  {
    id: "abhi-crs-coi",
    slug: "conflicts-of-interest",
    title: "Conflicts of Interest",
    category: "Ethics & Integrity",
    durationMinutes: 30,
    mandatory: true,
    progressPct: 81,
    status: "in_progress",
  },
  {
    id: "abhi-crs-infosec",
    slug: "information-security",
    title: "Information Security",
    category: "Cyber & Privacy",
    durationMinutes: 50,
    mandatory: true,
    progressPct: 72,
    status: "in_progress",
  },
  {
    id: "abhi-crs-whistle",
    slug: "whistleblowing",
    title: "Whistleblowing",
    category: "Ethics & Integrity",
    durationMinutes: 25,
    mandatory: true,
    progressPct: 83,
    status: "in_progress",
  },
  {
    id: "abhi-crs-dei",
    slug: "dei",
    title: "DEI",
    category: "People & Culture",
    durationMinutes: 40,
    mandatory: true,
    progressPct: 77,
    status: "in_progress",
  },
  {
    id: "abhi-crs-harassment",
    slug: "harassment-prevention",
    title: "Harassment Prevention",
    category: "People & Culture",
    durationMinutes: 35,
    mandatory: true,
    progressPct: 80,
    status: "in_progress",
  },
  {
    id: "abhi-crs-procurement",
    slug: "procurement-gifts-hospitality",
    title: "Procurement / Gifts & Hospitality",
    category: "Procurement",
    durationMinutes: 30,
    mandatory: true,
    progressPct: 69,
    status: "in_progress",
  },
  {
    id: "abhi-crs-hs",
    slug: "health-and-safety",
    title: "Health & Safety",
    category: "Operations",
    durationMinutes: 45,
    mandatory: true,
    progressPct: 85,
    status: "in_progress",
  },
  {
    id: "abhi-crs-slavery",
    slug: "modern-slavery",
    title: "Modern Slavery",
    category: "Human Rights",
    durationMinutes: 40,
    mandatory: true,
    progressPct: 71,
    status: "in_progress",
  },
];
