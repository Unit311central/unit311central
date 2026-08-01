"use client";

import { TALANTON_COMPLIANCE_COURSES, type ComplianceCourse } from "@/lib/talanton/portfolio-data";

export type ManagedCourse = ComplianceCourse & {
  archived: boolean;
  materials: string[];
  assignedCompanyIds: string[];
  assignedUserLabels: string[];
  enrolmentCount: number;
};

const STORAGE_KEY = "talanton-course-management-v1";

function seedCourses(): ManagedCourse[] {
  return TALANTON_COMPLIANCE_COURSES.map((c) => ({
    ...c,
    archived: false,
    materials: [`${c.title}.pdf`],
    assignedCompanyIds: [],
    assignedUserLabels: [],
    enrolmentCount: Math.round(c.assignedCompanies * 12 * (c.completionPct / 100 + 0.35)),
  }));
}

function readStore(): ManagedCourse[] {
  if (typeof window === "undefined") return seedCourses();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedCourses();
    const parsed = JSON.parse(raw) as ManagedCourse[];
    if (!Array.isArray(parsed) || parsed.length === 0) return seedCourses();
    return parsed;
  } catch {
    return seedCourses();
  }
}

function writeStore(courses: ManagedCourse[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function listManagedCourses(): ManagedCourse[] {
  return readStore();
}

export function saveManagedCourses(courses: ManagedCourse[]) {
  writeStore(courses);
}

export function createBlankCourse(): ManagedCourse {
  return {
    id: `ti-course-${Date.now()}`,
    title: "New compliance course",
    category: "Ethics & Integrity",
    durationMinutes: 30,
    mandatory: true,
    assignedCompanies: 0,
    completionPct: 0,
    renewEveryMonths: 12,
    archived: false,
    materials: [],
    assignedCompanyIds: [],
    assignedUserLabels: [],
    enrolmentCount: 0,
  };
}
