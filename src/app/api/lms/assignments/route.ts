import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import {
  assignCourseToStaff,
  listAssignableStaffForCourse,
} from "@/lib/lms/service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const courseSlug = String(request.nextUrl.searchParams.get("courseSlug") ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const result = await listAssignableStaffForCourse({
      workspaceId: auth.workspace.id,
      courseSlug,
    });

    return NextResponse.json({
      course: result.course,
      staff: result.staff,
      assignedCount: result.staff.filter((row) => row.alreadyAssigned).length,
      assignableCount: result.staff.filter((row) => row.userId && !row.alreadyAssigned).length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load assignments.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as {
      courseSlug?: string;
      employeeIds?: string[];
      assignAllActive?: boolean;
      mandatory?: boolean;
      dueAt?: string | null;
    };

    const courseSlug = String(body.courseSlug ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const employeeIds = Array.isArray(body.employeeIds)
      ? body.employeeIds.map((id) => String(id).trim()).filter(Boolean)
      : [];
    const assignAllActive = Boolean(body.assignAllActive);

    if (!assignAllActive && employeeIds.length === 0) {
      return NextResponse.json(
        { error: "Select at least one staff member, or assign to all active staff." },
        { status: 400 },
      );
    }

    const result = await assignCourseToStaff({
      workspaceId: auth.workspace.id,
      courseSlug,
      employeeIds,
      assignAllActive,
      mandatory: body.mandatory !== false,
      dueAt: body.dueAt ? String(body.dueAt) : null,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign course.";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
