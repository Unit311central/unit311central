import type { LmsCourseListItem } from "@/lib/lms/types";

export async function fetchPublishedLmsCoursesWithStats(): Promise<LmsCourseListItem[]> {
  const response = await fetch("/api/lms/courses?includeStats=1", {
    cache: "no-store",
    credentials: "include",
  });
  const data = (await response.json()) as { courses?: LmsCourseListItem[]; error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Failed to load published courses.");
  }
  return data.courses ?? [];
}

export function summarizeLmsDescription(description: string, maxLength = 160): string {
  const plain = description.replace(/\s+/g, " ").trim();
  if (plain.length <= maxLength) return plain;
  return `${plain.slice(0, maxLength - 1)}…`;
}

export function formatLmsDurationHours(durationMinutes: number): string {
  const hours = durationMinutes / 60;
  if (hours >= 1) {
    const rounded = Math.round(hours * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }
  return (Math.max(1, durationMinutes) / 60).toFixed(1);
}
