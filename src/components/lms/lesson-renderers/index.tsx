"use client";

import type { LmsLesson } from "@/lib/lms/types";

import AssessmentLesson from "./AssessmentLesson";
import BranchingLesson from "./BranchingLesson";
import DocumentLesson from "./DocumentLesson";
import DragDropLesson from "./DragDropLesson";
import EmbeddedPdfLesson from "./EmbeddedPdfLesson";
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
  const content = lesson.content;
  const complete = () => onComplete();

  switch (content.type) {
    case "rich_text":
      return <RichTextLesson lesson={lesson} content={content} onComplete={complete} />;
    case "image":
      return <ImageLesson lesson={lesson} content={content} onComplete={complete} />;
    case "video":
      return <VideoLesson lesson={lesson} content={content} onComplete={complete} />;
    case "interactive_cards":
      return (
        <InteractiveCardsLesson lesson={lesson} content={content} onComplete={complete} />
      );
    case "scenario":
      return <ScenarioLesson lesson={lesson} content={content} onComplete={complete} />;
    case "drag_drop":
      return <DragDropLesson lesson={lesson} content={content} onComplete={complete} />;
    case "knowledge_check":
      return (
        <KnowledgeCheckLesson lesson={lesson} content={content} onComplete={complete} />
      );
    case "quiz":
      return <QuizLesson lesson={lesson} content={content} onComplete={complete} />;
    case "document":
      return <DocumentLesson lesson={lesson} content={content} onComplete={complete} />;
    case "embedded_pdf":
      return <EmbeddedPdfLesson lesson={lesson} content={content} onComplete={complete} />;
    case "narration":
      return <NarrationLesson lesson={lesson} content={content} onComplete={complete} />;
    case "infographic":
      return <InfographicLesson lesson={lesson} content={content} onComplete={complete} />;
    case "branching":
      return <BranchingLesson lesson={lesson} content={content} onComplete={complete} />;
    case "assessment":
      if (!courseSlug || !enrolmentId) {
        return <UnsupportedLesson lesson={lesson} onComplete={complete} />;
      }
      return (
        <AssessmentLesson
          lesson={lesson}
          courseSlug={courseSlug}
          enrolmentId={enrolmentId}
          passMark={content.passMark}
          onComplete={(result) => onComplete(result)}
        />
      );
    default:
      return <UnsupportedLesson lesson={lesson} onComplete={complete} />;
  }
}

export default LessonRenderer;
