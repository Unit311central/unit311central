"use client";

import type { LmsLesson } from "@/lib/lms/types";
import { sanitizeLessonContent } from "@/lib/lms/sanitize-lesson-content";

import AssessmentLesson from "./AssessmentLesson";
import BranchingLesson from "./BranchingLesson";
import DocumentLesson from "./DocumentLesson";
import DragDropLesson from "./DragDropLesson";
import EmbeddedPdfLesson from "./EmbeddedPdfLesson";
import HotspotLesson from "./HotspotLesson";
import ImageLesson from "./ImageLesson";
import InfographicLesson from "./InfographicLesson";
import InteractiveCardsLesson from "./InteractiveCardsLesson";
import KnowledgeCheckLesson from "./KnowledgeCheckLesson";
import NarrationLesson from "./NarrationLesson";
import QuizLesson from "./QuizLesson";
import RichTextLesson from "./RichTextLesson";
import ScenarioLesson from "./ScenarioLesson";
import UnsupportedLesson from "./UnsupportedLesson";
import VideoLesson from "./VideoLesson";

export type LessonRendererProps = {
  lesson: LmsLesson;
  onComplete: (meta?: { score?: number; passed?: boolean }) => void;
  courseId?: string;
  courseSlug?: string;
  enrolmentId?: string;
};

export function LessonRenderer({
  lesson,
  onComplete,
  courseSlug,
  enrolmentId,
}: LessonRendererProps) {
  const complete = () => onComplete();
  const sanitized = sanitizeLessonContent(lesson.lessonType, lesson.content, lesson.title);
  const safeLesson: LmsLesson = {
    ...lesson,
    lessonType: sanitized.lessonType,
    content: sanitized.content,
  };
  const content = safeLesson.content;

  try {
    switch (content.type) {
      case "rich_text":
        return <RichTextLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "image":
        return <ImageLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "video":
        return <VideoLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "interactive_cards":
        return (
          <InteractiveCardsLesson lesson={safeLesson} content={content} onComplete={complete} />
        );
      case "scenario":
        return <ScenarioLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "drag_drop":
        return <DragDropLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "knowledge_check":
        return (
          <KnowledgeCheckLesson lesson={safeLesson} content={content} onComplete={complete} />
        );
      case "quiz":
        return <QuizLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "document":
        return <DocumentLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "embedded_pdf":
        return <EmbeddedPdfLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "narration":
        return <NarrationLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "infographic":
        return <InfographicLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "branching":
        return <BranchingLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "hotspot":
        return <HotspotLesson lesson={safeLesson} content={content} onComplete={complete} />;
      case "assessment":
        if (!courseSlug || !enrolmentId) {
          return <UnsupportedLesson lesson={safeLesson} onComplete={complete} />;
        }
        return (
          <AssessmentLesson
            lesson={safeLesson}
            courseSlug={courseSlug}
            enrolmentId={enrolmentId}
            passMark={content.passMark}
            onComplete={(result) => onComplete(result)}
          />
        );
      default:
        return <UnsupportedLesson lesson={safeLesson} onComplete={complete} />;
    }
  } catch (error) {
    console.error("[LessonRenderer]", safeLesson.id, error);
    return <UnsupportedLesson lesson={safeLesson} onComplete={complete} />;
  }
}

export default LessonRenderer;
