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

/** Staff catalogue: published and draft courses for the active workspace. */
export async function fetchStaffLmsCoursesWithStats(): Promise<LmsCourseListItem[]> {
  const response = await fetch("/api/lms/courses?all=1&includeStats=1", {
    cache: "no-store",
    credentials: "include",
  });
  const data = (await response.json()) as { courses?: LmsCourseListItem[]; error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Failed to load courses.");
  }
  return data.courses ?? [];
}

export async function deleteLmsCourseBySlug(slug: string): Promise<{
  title: string;
  status: string;
}> {
  const response = await fetch(`/api/lms/courses/${encodeURIComponent(slug)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = (await response.json()) as { title?: string; status?: string; error?: string };
  if (!response.ok) {
    throw new Error(data.error || "Failed to delete course.");
  }
  return { title: data.title ?? slug, status: data.status ?? "draft" };
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
