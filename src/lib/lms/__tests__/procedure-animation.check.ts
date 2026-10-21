/**
 * Procedure animation spec + document inference (generic fixtures only).
 */
import assert from "node:assert/strict";

import {
  countKnowledgeCheckLessons,
  ensureKnowledgeCheckLessons,
} from "@/lib/lms/ensure-document-knowledge-checks";
import { ensureProcedureAnimationLessons, countProcedureAnimationLessons } from "@/lib/lms/ensure-procedure-animations";
import {
  buildLinearProcedureSpecFromSteps,
  inferProcedureStepsFromDocument,
  validateProcedureAnimationSpec,
} from "@/lib/lms/procedure-animation-spec";
import { sanitizeLessonContent } from "@/lib/lms/sanitize-lesson-content";
import { buildDocumentTemplateCourse } from "@/lib/lms/document-template-course";

const genericDoc = `
1. Identify the operational issue and record the time and location.
2. Notify the duty manager using the approved channel.
3. If severity is high, escalate to the compliance lead within one hour.
4. Document actions taken in the central register.
`;

const steps = inferProcedureStepsFromDocument(genericDoc);
assert.ok(steps.length >= 3, "numbered steps must be inferred from generic document");

const spec = buildLinearProcedureSpecFromSteps("Generic workflow", steps);
assert.equal(spec.version, 1);
assert.ok(validateProcedureAnimationSpec(spec), "linear spec must validate");

const decisionSpec = validateProcedureAnimationSpec({
  version: 1,
  title: "Branching example",
  layout: "decision_tree",
  nodes: [
    { id: "start", label: "Start", kind: "start" },
    { id: "check", label: "Check severity", kind: "decision" },
    { id: "escalate", label: "Escalate", kind: "step" },
    { id: "log", label: "Log only", kind: "step" },
    { id: "end", label: "Done", kind: "end" },
  ],
  edges: [
    { id: "e1", from: "start", to: "check" },
    { id: "e2", from: "check", to: "escalate", label: "High" },
    { id: "e3", from: "check", to: "log", label: "Low" },
    { id: "e4", from: "escalate", to: "end" },
    { id: "e5", from: "log", to: "end" },
  ],
});
assert.ok(decisionSpec);

const sanitized = sanitizeLessonContent(
  "procedure_animation",
  { type: "procedure_animation", title: "Walkthrough", spec },
  "Walkthrough",
);
assert.equal(sanitized.lessonType, "procedure_animation");
assert.equal(sanitized.content.type, "procedure_animation");

const draft = ensureProcedureAnimationLessons(
  {
    title: "Test course",
    description: "desc",
    category: "Compliance",
    durationMinutes: 20,
    passMark: 80,
    status: "draft",
    modules: [
      {
        title: "Module",
        summary: "s",
        lessons: [
          {
            title: "Intro",
            lessonType: "rich_text",
            estimatedMinutes: 2,
            content: { type: "rich_text", blocks: [{ kind: "paragraph", text: "Hello" }] },
          },
        ],
      },
    ],
  },
  genericDoc,
);
assert.ok(countProcedureAnimationLessons(draft) >= 1, "ensure adds animation when missing");

const template = buildDocumentTemplateCourse(genericDoc, "incident-reporting.pdf");
assert.equal(template.generationSource, "document_template");
assert.ok(template.questions && template.questions.length >= 8);
assert.ok(
  template.questions.some((q) => /duty manager|escalat|register/i.test(q.stem)),
  "question bank should reference document steps",
);
assert.ok(countProcedureAnimationLessons(template) >= 1);
assert.ok(countKnowledgeCheckLessons(template) >= 2, "template must include in-flow knowledge checks");

const aiLike = ensureKnowledgeCheckLessons(draft, genericDoc);
assert.ok(
  countKnowledgeCheckLessons(aiLike) >= 2,
  "ensureKnowledgeCheckLessons injects checks when AI omits them",
);

console.log("ok  procedure-animation checks passed\n");
