import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession, resolveLmsClientId } from "@/lib/lms/auth";
import {
  ensureEnrolment,
  getCourseBySlug,
  issueCertificate,
} from "@/lib/lms/service";
import { getCompanyPortalByPath } from "@/lib/talanton/company-portal-routes";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;

  try {
    const body = (await request.json().catch(() => ({}))) as { courseSlug?: string };
    const courseSlug = String(body.courseSlug ?? "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const course = await getCourseBySlug(auth.workspace.id, courseSlug);
    if (!course || course.status !== "published") {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const clientId = resolveLmsClientId(auth.session, auth.workspace.slug);
    const enrolment = await ensureEnrolment({
      workspaceId: auth.workspace.id,
      courseId: course.id,
      userId: auth.session.sub,
      clientId,
    });

    if (enrolment.status !== "completed" || enrolment.score == null) {
      return NextResponse.json(
        { error: "Course must be completed with a passing assessment score first." },
        { status: 400 },
      );
    }

    if (enrolment.score < course.passMark) {
      return NextResponse.json(
        { error: `Score ${enrolment.score}% is below pass mark ${course.passMark}%.` },
        { status: 400 },
      );
    }

    let companyName = "Portfolio Company";
    if (
      auth.session.userType === "external" &&
      auth.workspace.slug === TALANTON_IMPACT_SLUG
    ) {
      const portal = getCompanyPortalByPath(auth.session.redirectPath);
      if (portal) companyName = portal.displayName;
    } else if (auth.session.userType === "internal") {
      companyName = auth.workspace.name;
    }

    const certificate = await issueCertificate({
      workspaceId: auth.workspace.id,
      course,
      enrolment,
      userId: auth.session.sub,
      learnerName: auth.session.displayName || auth.session.username,
      companyName,
      score: enrolment.score,
    });

    return NextResponse.json({ certificate, enrolment });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to issue certificate.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
