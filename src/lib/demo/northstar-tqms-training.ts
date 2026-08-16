import type { TqmsCourse, TqmsEvent } from "@/lib/tqms-data";
import type { TqmsMockState } from "@/lib/tqms-mock-store";

export const NORTHSTAR_TRAINING_EVENTS: TqmsEvent[] = [
  {
    id: "nst-evt-1",
    title: "Edge controller safety briefing — Engineering",
    kind: "Session",
    when: "2026-08-19",
    owner: "Mia Bennett",
  },
  {
    id: "nst-evt-2",
    title: "Sheffield Precision client onboarding workshop",
    kind: "Classroom",
    when: "2026-08-21",
    owner: "Emily Hughes",
  },
  {
    id: "nst-evt-3",
    title: "ISO 9001 internal auditor prep",
    kind: "Session",
    when: "2026-08-22",
    owner: "Sofia Mendes",
  },
  {
    id: "nst-evt-4",
    title: "InfoSec certificate renewal — 3 engineers",
    kind: "Renewal",
    when: "2026-09-05",
    owner: "Harry Shah",
  },
];

const NORTHSTAR_STAFF_COURSES: TqmsCourse[] = [
  {
    id: "crs-001",
    code: "NST-101",
    title: "Northstar Workplace Induction",
    category: "Induction",
    mandatory: true,
    durationHours: 2,
    status: "Published",
    owner: "People Ops",
    description: "Company values, sites, and ways of working at Northstar Industrial Technologies.",
  },
  {
    id: "crs-002",
    code: "NST-210",
    title: "Industrial Health & Safety Essentials",
    category: "Compliance",
    mandatory: true,
    durationHours: 3,
    status: "Published",
    owner: "H&S Lead",
    description: "Shop-floor safety, PPE, and incident reporting across UK sites.",
  },
  {
    id: "crs-003",
    code: "NST-220",
    title: "Information Security Awareness",
    category: "Compliance",
    mandatory: true,
    durationHours: 1.5,
    status: "Published",
    owner: "IT Security",
    description: "Protecting customer data, edge devices, and cloud credentials.",
  },
  {
    id: "crs-004",
    code: "NST-310",
    title: "Edge IoT Deployment Standards",
    category: "Engineering",
    mandatory: true,
    durationHours: 4,
    status: "Published",
    owner: "Engineering",
    description: "Site surveys, controller install, and remote monitoring handover.",
  },
  {
    id: "crs-005",
    code: "NST-320",
    title: "Customer Site Communication",
    category: "Operations",
    mandatory: false,
    durationHours: 2,
    status: "Published",
    owner: "Delivery",
    description: "Client updates, escalation paths, and SOW change control.",
  },
  {
    id: "crs-007",
    code: "NST-QMS-101",
    title: "ISO 9001 Quality Fundamentals",
    category: "QMS",
    mandatory: true,
    durationHours: 3,
    status: "Published",
    owner: "Quality Manager",
    description: "Document control, CAPA, and audit readiness for Northstar QMS.",
  },
];

export function applyNorthstarTqmsSeed(state: TqmsMockState): TqmsMockState {
  const nonAviation = state.courses.filter(
    (course) => course.category !== "Aviation" && !/flight ops/i.test(course.title),
  );
  const mergedCourses = [
    ...NORTHSTAR_STAFF_COURSES,
    ...nonAviation.filter(
      (course) => !NORTHSTAR_STAFF_COURSES.some((seed) => seed.id === course.id),
    ),
  ];

  return {
    ...state,
    courses: mergedCourses,
    events: NORTHSTAR_TRAINING_EVENTS,
  };
}
