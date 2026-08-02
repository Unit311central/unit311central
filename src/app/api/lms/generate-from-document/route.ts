import { NextRequest, NextResponse } from "next/server";

import {
  generateAbhiCourseFromDocument,
  summarizeGeneratedCourse,
} from "@/lib/abhi/lms-course-generator";
import { extractTextFromBuffer } from "@/lib/document-extract";
import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { createCourseTree } from "@/lib/lms/service";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ABHI / Talanton Impact staff: upload PDF/DOCX → AI course draft persisted to LMS.
 */
export async function POST(request: NextRequest) {
  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json(
      { error: "AI course generation is not available on this workspace." },
      { status: 403 },
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const preferredTitle = String(form.get("title") || "").trim() || undefined;
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "file is required (PDF or Word)." }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const extracted = await extractTextFromBuffer(bytes, file.name, file.type);
    if (extracted.text.length < 80) {
      return NextResponse.json(
        { error: "Document text is too short to build a course." },
        { status: 400 },
      );
    }

    const draft = await generateAbhiCourseFromDocument({
      documentText: extracted.text,
      sourceFileName: file.name,
      preferredTitle,
    });

    const course = await createCourseTree(auth.workspace.id, {
      ...draft,
      status: "draft",
    });

    return NextResponse.json({
      course,
      summary: summarizeGeneratedCourse(draft),
      draft,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Course generation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
