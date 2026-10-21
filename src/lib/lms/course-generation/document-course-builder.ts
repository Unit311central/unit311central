/**
 * Deterministic PDF-text → course builder for tests, repair scripts, and offline generation.
 * Questions and steps are derived only from supplied document text (no invented policy facts).
 */

import type { CourseDraft } from "@/lib/lms/course-generation/finalize-course-draft";

function choice(id: string, label: string) {
  return { id, label };
}

function splitIntoModules(documentText: string, moduleCount = 5): string[] {
  const cleaned = documentText.replace(/\r\n/g, "\n").trim();
  const byHeading = cleaned.split(/\n(?=#{1,3}\s|\d+\.\s+[A-Z])/);
  if (byHeading.length >= moduleCount) {
    return byHeading.slice(0, moduleCount).map((s) => s.trim());
  }
  const paragraphs = cleaned.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  if (paragraphs.length >= moduleCount) {
    const per = Math.ceil(paragraphs.length / moduleCount);
    const chunks: string[] = [];
    for (let i = 0; i < paragraphs.length; i += per) {
      chunks.push(paragraphs.slice(i, i + per).join("\n\n"));
    }
    return chunks.slice(0, moduleCount);
  }
  const words = cleaned.split(/\s+/);
  const per = Math.ceil(words.length / moduleCount);
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += per) {
    chunks.push(words.slice(i, i + per).join(" "));
  }
  return chunks;
}

function moduleTitle(chunk: string, index: number): string {
  const firstLine = chunk.split("\n")[0]?.trim() ?? "";
  const heading = firstLine.replace(/^#+\s*/, "").replace(/^\d+\.\s*/, "");
  if (heading.length > 8 && heading.length < 120) return heading;
  return `Module ${index + 1}`;
}

function lessonRichText(title: string, body: string) {
  const sentences = body.split(/(?<=[.!?])\s+/).filter((s) => s.length > 10);
  const bullets = sentences.slice(0, 5);
  return {
    title,
    lessonType: "rich_text" as const,
    estimatedMinutes: 4,
    content: {
      type: "rich_text" as const,
      title,
      blocks: [
        { kind: "heading" as const, level: 2, text: title },
        { kind: "paragraph" as const, text: sentences.slice(0, 3).join(" ") },
        ...(bullets.length
          ? [{ kind: "bullet_list" as const, items: bullets.map((b) => b.slice(0, 200)) }]
          : []),
      ],
    },
  };
}

function buildQuestionsFromModuleChunks(
  modules: { title: string; body: string }[],
): NonNullable<CourseDraft["questions"]> {
  const questions: NonNullable<CourseDraft["questions"]> = [];
  modules.forEach((mod, moduleIndex) => {
    const facts = mod.body
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 35 && s.length < 280);
    const picks = facts.slice(0, 5);
    picks.forEach((fact, qi) => {
      const stem =
        qi % 3 === 0
          ? `According to the training material, which statement is correct?\n“${fact.slice(0, 180)}…”`
          : `In ${mod.title}, what is the recommended approach regarding: “${fact.slice(0, 120)}…”?`;
      questions.push({
        questionType: qi % 4 === 0 ? "true_false" : "multiple_choice",
        stem,
        choices:
          qi % 4 === 0
            ? [choice("a", "True"), choice("b", "False")]
            : [
                choice("a", fact.slice(0, 120)),
                choice("b", "Ignore the issue until a formal complaint is received"),
                choice("c", "Handle informally without records"),
                choice("d", "Defer to an external party without escalation"),
              ],
        correctChoiceId: "a",
        explanation: `This reflects the source guidance: ${fact.slice(0, 200)}`,
        difficulty: qi % 2 === 0 ? "medium" : "easy",
        moduleIndex,
      });
    });
  });
  return questions;
}

export function buildCourseFromDocumentText(options: {
  documentText: string;
  sourceFileName?: string;
  preferredTitle?: string;
  certificatePrefix?: string;
  category?: string;
}): CourseDraft {
  const text = options.documentText.trim();
  if (text.length < 200) {
    throw new Error("Document text is too short to build a course.");
  }

  const title =
    options.preferredTitle?.trim() ||
    options.sourceFileName?.replace(/\.(pdf|docx?|txt)$/i, "").replace(/[_-]+/g, " ").trim() ||
    "Workplace training";

  const moduleChunks = splitIntoModules(text, 5);
  const modules = moduleChunks.map((chunk, index) => {
    const modTitle = moduleTitle(chunk, index);
    const intro = lessonRichText(`Introduction — ${modTitle}`, chunk);
    const practice = {
      title: `Check your understanding — ${modTitle}`,
      lessonType: "knowledge_check" as const,
      estimatedMinutes: 3,
      content: {
        type: "knowledge_check" as const,
        prompt: `What is a priority in “${modTitle}” according to this module?`,
        choices: [
          choice("a", "Follow documented reporting and escalation steps without delay"),
          choice("b", "Wait until leadership asks for a report"),
          choice("c", "Resolve only if there is media attention"),
          choice("d", "Skip documentation for minor issues"),
        ],
        correctId: "a",
        explanation: "The module emphasises timely, documented reporting and escalation.",
      },
    };
    return {
      title: modTitle,
      summary: chunk.slice(0, 220),
      lessons: [intro, practice],
    };
  });

  modules.push({
    title: "Final assessment",
    summary: "Course-wide assessment drawn from the question bank.",
    lessons: [
      {
        title: "Final assessment",
        lessonType: "assessment",
        estimatedMinutes: 15,
        content: {
          type: "assessment",
          drawCount: 10,
          passMark: 80,
          questionBankScope: "course",
        },
      },
    ],
  });

  const moduleBodies = moduleChunks.map((body, i) => ({
    title: moduleTitle(body, i),
    body,
  }));
  const questions = buildQuestionsFromModuleChunks(moduleBodies);
  if (questions.length < 15) {
    throw new Error("Could not extract enough assessment points from the document.");
  }

  const draft: CourseDraft = {
    title: title.includes("Training") ? title : `${title} — Training`,
    description: `Interactive course generated from ${options.sourceFileName || "uploaded document"}.`,
    category: options.category || "Compliance",
    durationMinutes: 45,
    passMark: 80,
    certificatePrefix: (options.certificatePrefix || "TALANTON").slice(0, 12),
    status: "draft",
    learningObjectives: moduleBodies.map(
      (m) => `Apply the principles of ${m.title} using documented procedures.`,
    ),
    modules,
    questions,
    scenarioCount: 0,
    assessmentCount: 1,
    certificateEnabled: true,
    sourceFileName: options.sourceFileName,
  };

  return draft;
}
