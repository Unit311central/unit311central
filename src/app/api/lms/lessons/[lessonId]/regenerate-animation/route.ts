import { assertDemoMutationAllowedForRequest } from "@/lib/demo/mutation-guard";
import { NextRequest, NextResponse } from "next/server";

import { requireLmsWorkspaceSession } from "@/lib/lms/auth";
import { regenerateProcedureAnimationSpec } from "@/lib/lms/regenerate-procedure-animation";
import { getCourseTree, updateLessonContent } from "@/lib/lms/service";
import { allowsLmsAiCourseGeneration } from "@/lib/lms/workspace-gates";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

type Params = { params: Promise<{ lessonId: string }> };

export async function POST(request: NextRequest, { params }: Params) {
  const demoMutationBlock = await assertDemoMutationAllowedForRequest(request);
  if (demoMutationBlock) return demoMutationBlock;

  const auth = await requireLmsWorkspaceSession();
  if ("error" in auth) return auth.error;
  if (auth.session.userType !== "internal") {
    return NextResponse.json({ error: "Staff only." }, { status: 403 });
  }
  if (!allowsLmsAiCourseGeneration(auth.workspace.slug)) {
    return NextResponse.json({ error: "Not available on this workspace." }, { status: 403 });
  }

  try {
    const { lessonId } = await params;
    const body = (await request.json()) as { courseSlug?: string; contextExcerpt?: string };
    const courseSlug = String(body.courseSlug || "").trim();
    if (!courseSlug) {
      return NextResponse.json({ error: "courseSlug is required." }, { status: 400 });
    }

    const tree = await getCourseTree(auth.workspace.id, courseSlug);
    if (!tree) {
      return NextResponse.json({ error: "Course not found." }, { status: 404 });
    }

    let targetLesson: (typeof tree.modules)[number]["lessons"][number] | null = null;
    let moduleTitle = "";
    for (const mod of tree.modules) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) {
        targetLesson = found;
        moduleTitle = mod.title;
        break;
      }
    }
    if (!targetLesson) {
      return NextResponse.json({ error: "Lesson not found in course." }, { status: 404 });
    }

    const contextExcerpt =
      String(body.contextExcerpt || "").trim() ||
      `${tree.description}\n\n${tree.modules
        .flatMap((m) => m.lessons)
        .filter((l) => l.lessonType === "rich_text" && l.content.type === "rich_text")
        .map((l) =>
          l.content.type === "rich_text"
            ? l.content.blocks.map((b) => (b.kind === "paragraph" ? b.text : "")).join(" ")
            : "",
        )
        .join("\n")}`.slice(0, 8000);

    const spec = await regenerateProcedureAnimationSpec({
      lesson: targetLesson,
      courseTitle: tree.title,
      courseDescription: tree.description,
      moduleTitle,
      contextExcerpt,
    });
    if (!spec) {
      return NextResponse.json({ error: "Could not build animation spec." }, { status: 422 });
    }

    const updated = await updateLessonContent(auth.workspace.id, lessonId, {
      lessonType: "procedure_animation",
      content: {
        type: "procedure_animation",
        title: targetLesson.title,
        spec,
      },
    });

    const refreshed = await getCourseTree(auth.workspace.id, courseSlug);
    return NextResponse.json({ lesson: updated, course: refreshed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Animation regeneration failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
