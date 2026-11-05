export const COURSE_NAME_MAX_LENGTH = 200;
export const COURSE_COMMENT_MAX_LENGTH = 1000;

export const COURSE_DUPLICATE_MESSAGE =
  "This name has already been used to submit a questionnaire. Please contact the course organizer if you need assistance.";

export const COURSE_QUESTION_1_OPTIONS = [
  "Urban development",
  "Construction and engineering",
  "Rural land and property",
  "Agriculture and plantations",
  "Industrial sites",
  "Rivers, coastal and marine",
  "Other",
] as const;

export const COURSE_QUESTION_2_OPTIONS = [
  "GPS/GNSS surveying receivers",
  "Total stations",
  "Laser levels and laser measuring devices",
  "Automatic/digital levels",
  "Laser scanners / 3D scanners",
  "Drones / UAVs",
  "Measuring tapes, wheels and other manual measuring tools",
  "Smartphones / mobile phones",
  "Tablets / handheld field computers",
  "Laptop or desktop computers",
  "Digital cameras",
  "Handheld laser pointers / distance meters",
  "Paper maps, notebooks and manual drawings",
  "Other specialist surveying equipment",
] as const;

export const COURSE_QUESTION_3_OPTIONS = [
  "CAD software (e.g. AutoCAD, Civil 3D)",
  "GIS / mapping software",
  "Surveying data-processing software",
  "3D modelling or point-cloud software",
  "Drone mapping / photogrammetry software",
  "Satellite imagery or remote-sensing applications",
  "Mobile surveying applications on phones or tablets",
  "Microsoft Excel or spreadsheets",
  "Other specialist software",
  "I don't use surveying software myself",
] as const;

export const COURSE_QUESTION_4_OPTIONS = [
  "Surveying work takes too long or involves too much manual effort.",
  "Collecting accurate measurements in the field is challenging.",
  "Difficult terrain, vegetation or inaccessible locations make surveying difficult.",
  "Processing survey data takes too much time.",
  "Producing maps, drawings and 3D models is time-consuming.",
  "Different equipment and software don't work well together.",
  "Software is complicated or difficult to use.",
  "Managing, storing and sharing large amounts of survey data is difficult.",
  "Checking accuracy and identifying errors is challenging.",
  "Equipment is expensive or difficult to maintain.",
  "Not having access to the right equipment or technology.",
  "Something else.",
] as const;

export const COURSE_CHOICE_QUESTIONS = [
  {
    id: "question1",
    column: "question_1_answers",
    number: 1,
    title: "What types of sites or projects do you work on?",
    hint: "Select all that apply.",
    options: COURSE_QUESTION_1_OPTIONS,
  },
  {
    id: "question2",
    column: "question_2_answers",
    number: 2,
    title: "Which tools and equipment do you use in your surveying work?",
    hint: "Select all that apply.",
    options: COURSE_QUESTION_2_OPTIONS,
  },
  {
    id: "question3",
    column: "question_3_answers",
    number: 3,
    title: "What software or applications do you use for your surveying work?",
    hint: "Select all that apply.",
    options: COURSE_QUESTION_3_OPTIONS,
  },
  {
    id: "question4",
    column: "question_4_answers",
    number: 4,
    title:
      "What are your biggest frustrations or challenges with the surveying work, equipment and technology you use today?",
    hint: "Optional – select all that apply.",
    options: COURSE_QUESTION_4_OPTIONS,
  },
] as const;

export type CourseChoiceQuestionId = (typeof COURSE_CHOICE_QUESTIONS)[number]["id"];

export const COURSE_QUESTION_5 = {
  id: "question5",
  column: "question_5_comments",
  number: 5,
  title:
    "Is there anything else about your surveying work, experience or expectations for this course that you would like us to know?",
  hint: "Optional – please add any comments, suggestions or questions.",
} as const;

export type CourseChoiceAnswers = Record<CourseChoiceQuestionId, string[] | null>;

export type CourseSubmissionInput = CourseChoiceAnswers & {
  participantName: string;
  normalizedName: string;
  question5: string | null;
};

export type CourseSubmissionRecord = CourseSubmissionInput & {
  id: string;
  submittedAt: string;
};

export type CourseOptionBreakdown = {
  label: string;
  count: number;
  percent: number;
};

export type CourseQuestionSummary = {
  id: CourseChoiceQuestionId;
  number: number;
  title: string;
  answered: number;
  unanswered: number;
  options: CourseOptionBreakdown[];
};

export type CourseResponsesSummary = {
  total: number;
  questions: CourseQuestionSummary[];
  commentsProvided: number;
  commentsUnanswered: number;
};

export function trimParticipantName(name: string): string {
  return name.trim();
}

/** Duplicate key: trimmed, case-insensitive. Internal spaces are preserved. */
export function normalizeParticipantName(name: string): string {
  return trimParticipantName(name).toLowerCase();
}

function canonicalSelections(
  value: unknown,
  allowed: readonly string[],
): { ok: true; value: string[] | null } | { ok: false } {
  if (value == null) return { ok: true, value: null };
  if (!Array.isArray(value)) return { ok: false };
  const selected = new Set<string>();
  for (const entry of value) {
    if (typeof entry !== "string" || !allowed.includes(entry)) return { ok: false };
    selected.add(entry);
  }
  if (selected.size === 0) return { ok: true, value: null };
  return { ok: true, value: allowed.filter((option) => selected.has(option)) };
}

export function parseCourseSubmission(
  body: unknown,
): { ok: true; value: CourseSubmissionInput } | { ok: false; message: string } {
  if (!body || typeof body !== "object") {
    return { ok: false, message: "The questionnaire could not be read. Please try again." };
  }
  const record = body as Record<string, unknown>;
  if (typeof record.participantName !== "string") {
    return { ok: false, message: "Please enter your name." };
  }
  const participantName = trimParticipantName(record.participantName);
  if (!participantName) {
    return { ok: false, message: "Please enter your name." };
  }
  if (participantName.length > COURSE_NAME_MAX_LENGTH) {
    return {
      ok: false,
      message: `Please enter a name of ${COURSE_NAME_MAX_LENGTH} characters or fewer.`,
    };
  }

  const choices = {} as CourseChoiceAnswers;
  for (const question of COURSE_CHOICE_QUESTIONS) {
    const parsed = canonicalSelections(record[question.id], question.options);
    if (!parsed.ok) {
      return {
        ok: false,
        message: "One or more answers could not be saved. Please refresh the page and try again.",
      };
    }
    choices[question.id] = parsed.value;
  }

  const rawComment = record.question5;
  let question5: string | null = null;
  if (rawComment != null) {
    if (typeof rawComment !== "string") {
      return {
        ok: false,
        message: "Additional comments could not be saved. Please try again.",
      };
    }
    const trimmed = rawComment.trim();
    if (trimmed.length > COURSE_COMMENT_MAX_LENGTH) {
      return {
        ok: false,
        message: `Additional comments must be ${COURSE_COMMENT_MAX_LENGTH.toLocaleString("en-GB")} characters or fewer.`,
      };
    }
    question5 = trimmed.length > 0 ? trimmed : null;
  }

  return {
    ok: true,
    value: {
      participantName,
      normalizedName: normalizeParticipantName(participantName),
      ...choices,
      question5,
    },
  };
}

export function classifyCourseInsertError(error: {
  code?: string | null;
  message?: string | null;
}): "duplicate" | "unavailable" | "unknown" {
  const code = error.code ?? "";
  const message = (error.message ?? "").toLowerCase();
  if (
    code === "23505" ||
    message.includes("normalized_name") ||
    message.includes("duplicate key")
  ) {
    return "duplicate";
  }
  if (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  ) {
    return "unavailable";
  }
  return "unknown";
}

function answeredSelections(value: string[] | null | undefined): boolean {
  return Array.isArray(value) && value.length > 0;
}

export function summarizeCourseResponses(
  submissions: readonly Pick<
    CourseSubmissionRecord,
    "question1" | "question2" | "question3" | "question4" | "question5"
  >[],
): CourseResponsesSummary {
  const total = submissions.length;
  const questions = COURSE_CHOICE_QUESTIONS.map((question) => {
    const answeredRows = submissions.filter((submission) =>
      answeredSelections(submission[question.id]),
    );
    const answered = answeredRows.length;
    const options = question.options.map((label) => {
      const count = answeredRows.filter((submission) =>
        submission[question.id]?.includes(label),
      ).length;
      const percent = answered === 0 ? 0 : Math.round((count / answered) * 100);
      return { label, count, percent };
    });
    return {
      id: question.id,
      number: question.number,
      title: question.title,
      answered,
      unanswered: total - answered,
      options,
    };
  });

  const commentsProvided = submissions.filter((submission) =>
    Boolean(submission.question5?.trim()),
  ).length;

  return {
    total,
    questions,
    commentsProvided,
    commentsUnanswered: total - commentsProvided,
  };
}

export function formatCourseSubmittedAt(iso: string, timeZone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}
