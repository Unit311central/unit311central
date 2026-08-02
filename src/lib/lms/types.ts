/** Structured JSON lesson content — never plain HTML blobs. */

export const LMS_LESSON_TYPES = [
  "rich_text",
  "image",
  "video",
  "interactive_cards",
  "scenario",
  "drag_drop",
  "knowledge_check",
  "quiz",
  "document",
  "embedded_pdf",
  "narration",
  "assessment",
  "infographic",
  "branching",
  "hotspot",
] as const;

export type LmsLessonType = (typeof LMS_LESSON_TYPES)[number];

export type RichTextBlock =
  | { kind: "heading"; text: string; level?: 1 | 2 | 3 }
  | { kind: "paragraph"; text: string }
  | { kind: "bullet_list"; items: string[] }
  | { kind: "callout"; tone?: "info" | "warning" | "success"; title?: string; text: string };

export type LessonContent =
  | { type: "rich_text"; title?: string; blocks: RichTextBlock[] }
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      layout?: "full" | "card" | "split";
    }
  | {
      type: "video";
      src: string;
      poster?: string;
      caption?: string;
      provider?: "file" | "youtube" | "vimeo";
    }
  | {
      type: "interactive_cards";
      intro?: string;
      cards: { id: string; title: string; summary: string; body: string; icon?: string }[];
    }
  | {
      type: "scenario";
      story: string;
      character?: { name: string; role: string; imageUrl?: string };
      choices: { id: string; label: string; correct?: boolean; feedback: string }[];
    }
  | {
      type: "drag_drop";
      prompt: string;
      mode: "sort" | "match";
      items: { id: string; label: string; correctZoneId: string }[];
      zones: { id: string; label: string; hint?: string }[];
    }
  | {
      type: "knowledge_check";
      prompt: string;
      choices: { id: string; label: string }[];
      correctId: string;
      explanation: string;
    }
  | {
      type: "quiz";
      passMark?: number;
      questionIds?: string[];
      inlineQuestions?: {
        id: string;
        stem: string;
        choices: { id: string; label: string }[];
        correctId: string;
        explanation?: string;
      }[];
    }
  | {
      type: "document";
      intro?: string;
      files: { title: string; url: string; mime?: string; sizeLabel?: string }[];
    }
  | { type: "embedded_pdf"; url: string; title?: string; height?: number }
  | {
      type: "narration";
      title?: string;
      script: string;
      audioUrl?: string | null;
      voiceHint?: string;
      autoplay?: boolean;
      highlights?: { t: number; text: string }[];
    }
  | {
      type: "assessment";
      drawCount: number;
      passMark: number;
      questionBankScope: "course" | "module";
    }
  | {
      type: "infographic";
      title?: string;
      layout?: "steps" | "flow" | "grid";
      items: { id: string; label: string; body: string; icon?: string }[];
    }
  | {
      type: "branching";
      startId: string;
      nodes: Record<
        string,
        {
          text: string;
          end?: boolean;
          outcome?: "good" | "bad" | "neutral";
          choices?: { label: string; to: string }[];
        }
      >;
    }
  | {
      type: "hotspot";
      title?: string;
      prompt: string;
      imageUrl: string;
      regions: {
        id: string;
        label: string;
        x: number;
        y: number;
        w: number;
        h: number;
        correct?: boolean;
        feedback: string;
      }[];
    };

export type LmsCourse = {
  id: string;
  workspaceId: string;
  code: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  durationMinutes: number;
  passMark: number;
  status: "draft" | "published" | "archived";
  certificatePrefix: string;
  sortOrder: number;
  coverImageUrl: string | null;
};

export type LmsModule = {
  id: string;
  courseId: string;
  title: string;
  summary: string;
  sortOrder: number;
};

export type LmsLesson = {
  id: string;
  courseId: string;
  moduleId: string;
  title: string;
  lessonType: LmsLessonType;
  content: LessonContent;
  sortOrder: number;
  estimatedMinutes: number;
};

export type LmsQuestion = {
  id: string;
  courseId: string;
  moduleId: string | null;
  questionType: "multiple_choice" | "true_false" | "scenario";
  stem: string;
  choices: { id: string; label: string }[];
  correctChoiceId: string;
  explanation: string;
  difficulty: string;
};

export type LmsEnrolment = {
  id: string;
  courseId: string;
  userId: string;
  clientId: string | null;
  status: "assigned" | "in_progress" | "completed" | "failed";
  progressPct: number;
  lessonState: Record<string, unknown>;
  timeSpentSeconds: number;
  score: number | null;
  startedAt: string | null;
  completedAt: string | null;
  lastLessonId: string | null;
};

export type LmsCertificate = {
  id: string;
  courseId: string;
  enrolmentId: string;
  userId: string;
  clientId: string | null;
  certificateNumber: string;
  verifyToken: string;
  learnerName: string;
  companyName: string;
  courseTitle: string;
  score: number;
  issuedAt: string;
};

export type LmsCourseTree = LmsCourse & {
  modules: (LmsModule & { lessons: LmsLesson[] })[];
  questionCount: number;
};

/** Payload for AI / wizard course creation into live LMS tables. */
export type LmsCourseCreateInput = {
  slug?: string;
  code?: string;
  title: string;
  description: string;
  category?: string;
  durationMinutes?: number;
  passMark?: number;
  certificatePrefix?: string;
  status?: "draft" | "published";
  learningObjectives?: string[];
  modules: {
    title: string;
    summary?: string;
    lessons: {
      title: string;
      lessonType: LmsLessonType;
      content: LessonContent;
      estimatedMinutes?: number;
    }[];
  }[];
  questions?: {
    questionType: LmsQuestion["questionType"];
    stem: string;
    choices: { id: string; label: string }[];
    correctChoiceId: string;
    explanation?: string;
    difficulty?: string;
  }[];
};
