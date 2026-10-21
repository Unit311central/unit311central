import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { generateAbhiCourseFromDocument } from "@/lib/abhi/lms-course-generator";
import { finalizeGeneratedCourseDraft } from "@/lib/lms/course-draft-finalize";
import { extractTextFromBuffer } from "@/lib/document-extract";
import { requireLmsStaffSession } from "@/lib/lms/auth";
import { getCourseBySlug, listCourseQuestions, replaceCourseTreeContent } from "@/lib/lms/service";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Staff: rebuild course modules/lessons/questions in-place from an uploaded PDF/DOCX.
 * Preserves course id, slug, status, enrolments, and certificates.
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsStaffSession();
  if ("error" in auth) return auth.error;
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json({ error: "Not available on this workspace." }, { status: 403 });
  }

  try {
    const { slug } = await context.params;
    const existing = await getCourseBySlug(auth.workspace.id, slug);
    if (!existing) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    const form = await request.formData();
    const file = form.get("file");
    const forceFive = form.get("forceFiveModules") === "1";
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required (PDF or Word)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const extracted = await extractTextFromBuffer(bytes, file.name, file.type);
    if (extracted.text.length < 80) {
      return NextResponse.json(
        { error: "Document text is too short to rebuild this course." },
        { status: 400 },
      );
    }

    const draft = await generateAbhiCourseFromDocument({
      documentText: extracted.text,
      sourceFileName: file.name,
      preferredTitle: existing.title,
    });

    const finalized = finalizeGeneratedCourseDraft(
      {
        ...draft,
        title: existing.title,
        passMark: existing.passMark ?? 80,
        status: existing.status,
      },
      extracted.text,
      { forceFiveModules: forceFive },
    );

    const tree = await replaceCourseTreeContent(auth.workspace.id, slug, {
      title: existing.title,
      description: finalized.description,
      category: finalized.category,
      durationMinutes: finalized.durationMinutes,
      passMark: 80,
      certificatePrefix: finalized.certificatePrefix,
      status: existing.status,
      modules: finalized.modules,
      questions: finalized.questions,
    });

    const bank = await listCourseQuestions(auth.workspace.id, existing.id);

    return NextResponse.json({
      course: tree,
      preserved: {
        courseId: existing.id,
        slug: existing.slug,
        status: existing.status,
      },
      stats: {
        moduleCount: tree.modules.length,
        lessonCount: tree.modules.reduce((n, m) => n + m.lessons.length, 0),
        questionBankCount: bank.length,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Course repair failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
