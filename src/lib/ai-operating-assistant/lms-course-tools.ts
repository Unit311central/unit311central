/**
 * ABHI-only EA tool: lms.generateCourseFromDocument
 */

import {
  generateAbhiCourseFromDocument,
  summarizeGeneratedCourse,
} from "@/lib/abhi/lms-course-generator";
import { isAbhiSlug } from "@/lib/abhi-surface";
import { clipDocumentText, extractTextFromBuffer } from "@/lib/document-extract";
import { downloadFileBuffer, getFileById } from "@/lib/internal-files-service";
import { createCourseTree } from "@/lib/lms/service";
import {
  toolError,
  toolForbidden,
  toolOk,
  type AssistantToolExecutionContext,
  type AssistantToolResult,
} from "@/lib/ai-operating-assistant/tool-result";

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function loadFileBytes(fileId: string): Promise<{ bytes: Buffer; fileName: string; mime: string }> {
  const meta = await getFileById(fileId);
  if (!meta) throw new Error("File not found.");
  const downloaded = await downloadFileBuffer(fileId);
  if (!downloaded?.buffer) throw new Error("Could not download file.");
  return {
    bytes: Buffer.from(downloaded.buffer),
    fileName: String(meta.name || downloaded.name || "document.pdf"),
    mime: String(meta.mimeType || downloaded.mimeType || ""),
  };
}

export async function generateLmsCourseFromDocumentTool(
  args: Record<string, unknown>,
  ctx: AssistantToolExecutionContext,
): Promise<AssistantToolResult> {
  const tool = "lms.generateCourseFromDocument";

  if (!isAbhiSlug(ctx.business.workspace.slug)) {
    return toolForbidden(tool, "AI course generation from documents is available on ABHI only.");
  }

  const fileId =
    asString(args.fileId) || asString(ctx.business.selection?.fileId);
  const documentText = asString(args.documentText);
  const preferredTitle = asString(args.title) || undefined;
  const sourceFileName = asString(args.fileName) || undefined;

  try {
    let text = documentText;
    let fileName = sourceFileName || "document";

    if (!text && fileId) {
      const file = await loadFileBytes(fileId);
      const extracted = await extractTextFromBuffer(file.bytes, file.fileName, file.mime);
      text = extracted.text;
      fileName = extracted.fileName;
    }

    if (!text || text.length < 80) {
      return toolError(
        tool,
        "Provide a PDF/Word file (select it in Files) or paste document text to generate a course.",
      );
    }

    const draft = await generateAbhiCourseFromDocument({
      documentText: clipDocumentText(text),
      sourceFileName: fileName,
      preferredTitle,
    });

    const workspaceId = ctx.business.workspace.id;
    if (!workspaceId) {
      return toolError(tool, "Workspace is not available for course creation.");
    }

    const course = await createCourseTree(workspaceId, {
      ...draft,
      status: "draft",
    });

    const summary = summarizeGeneratedCourse(draft);
    const openHref = `/dashboard?view=training`;

    return toolOk(
      tool,
      [
        {
          courseSlug: course.slug,
          courseId: course.id,
          title: course.title,
          status: course.status,
        },
      ],
      {
        source: ["abhi:lms", "abhi:ai-course-generator", fileName],
        summary: {
          executed: true,
          message: `Draft course ready: “${course.title}”`,
          courseSlug: course.slug,
          courseId: course.id,
          status: course.status,
          ...summary,
          openPath: openHref,
        },
        followUpActions: [
          {
            id: "open_training_courses",
            label: "Review & publish in Training",
            kind: "navigate",
            href: openHref,
          },
        ],
      },
    );
  } catch (error) {
    return toolError(
      tool,
      error instanceof Error ? error.message : "Course generation failed.",
    );
  }
}
