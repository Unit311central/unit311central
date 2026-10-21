import type { PlatformSession } from "@/lib/platform-session";

type CourseLike = { status: "draft" | "published" | "archived" };

/** Published courses for learners; internal staff may preview draft courses without publishing. */
export function learnerCanAccessCourse(course: CourseLike, session: PlatformSession): boolean {
  if (course.status === "published") return true;
  if (course.status === "draft" && session.userType === "internal") return true;
  return false;
}
