/**
 * Management-lessons synthesis from Talanton portfolio + journey field stories.
 */

import {
  createAssistantResponse,
  getAssistantModel,
} from "@/lib/ai-operating-assistant/openai-client";
import {
  describeScope,
  type StoriesQueryResult,
  type StoryRow,
} from "@/lib/talanton/executive-stories-intelligence";

export type StoryLessonEvidence = {
  storyTitle: string;
  company: string;
  detail: string;
};

export type StoryManagementLesson = {
  title: string;
  explanation: string;
  evidence: StoryLessonEvidence[];
};

export type StoriesLessonsAnalysis = {
  documentTitle: string;
  intro: string;
  lessons: StoryManagementLesson[];
  scopeLabel: string;
  storyCount: number;
  portfolioCount: number;
  journeyCount: number;
  synthesisSource: "gpt" | "deterministic";
};

const CATEGORY_LESSON_TITLES: Record<string, string> = {
  "Jobs & Livelihoods": "Sustainable jobs require operational discipline, not just capital",
  "Women & Youth": "Inclusive programmes need deliberate design and local leadership",
  "Community Development": "Community outcomes depend on trust built before scale",
  "Climate & Environment": "Environmental impact must be measured alongside commercial viability",
  "Financial Inclusion": "Access to finance succeeds when paired with capability building",
  "Health & Wellbeing": "Health outcomes improve when services integrate with local networks",
  "Faith & Dignity of Work": "Dignity-centred employment models sustain retention and quality",
};

function rowEvidence(row: StoryRow): StoryLessonEvidence {
  return {
    storyTitle: row.title,
    company: row.companyNames.join(", ") || "—",
    detail: row.summary.slice(0, 220),
  };
}

function lessonTitleForCategory(category: string): string {
  return CATEGORY_LESSON_TITLES[category] ?? `Recurring theme: ${category}`;
}

function categoryLessonExplanation(category: string, rows: StoryRow[]): string {
  const companies = [...new Set(rows.flatMap((r) => r.companyNames))].slice(0, 4);
  const companyPhrase =
    companies.length > 0 ? `Across ${companies.join(", ")}` : "Across portfolio holdings";
  return `${companyPhrase}, field evidence in ${category} shows recurring patterns managers should treat as operational lessons — not one-off anecdotes. The stories below illustrate how this theme shows up in live portfolio submissions and journey visits.`;
}

export function buildDeterministicStoriesLessonsAnalysis(
  result: StoriesQueryResult,
  userQuestion?: string,
): StoriesLessonsAnalysis {
  const scopeLabel = describeScope(result.scope);
  const rows = result.rows;

  if (rows.length === 0) {
    return {
      documentTitle: "Management Lessons from Field Stories",
      intro:
        "No field stories matched the requested scope. Widen companies, impact areas, or status filters before synthesising management lessons.",
      lessons: [],
      scopeLabel,
      storyCount: 0,
      portfolioCount: result.counts.portfolio,
      journeyCount: result.counts.journey,
      synthesisSource: "deterministic",
    };
  }

  const byCategory = new Map<string, StoryRow[]>();
  for (const row of rows) {
    const cat = row.categoryOrSector?.trim() || "Portfolio learning";
    const bucket = byCategory.get(cat) ?? [];
    bucket.push(row);
    byCategory.set(cat, bucket);
  }

  const ranked = [...byCategory.entries()].sort((a, b) => b[1].length - a[1].length);
  const lessons: StoryManagementLesson[] = ranked.slice(0, 3).map(([category, catRows]) => ({
    title: lessonTitleForCategory(category),
    explanation: categoryLessonExplanation(category, catRows),
    evidence: catRows.slice(0, 3).map(rowEvidence),
  }));

  const intro =
    userQuestion?.trim()
      ? `Synthesised from ${rows.length} Talanton field stories (${result.counts.portfolio} portfolio submissions, ${result.counts.journey} journey visits) in response to: ${userQuestion.trim()}`
      : `Synthesised from ${rows.length} Talanton field stories (${result.counts.portfolio} portfolio submissions, ${result.counts.journey} journey visits).`;

  return {
    documentTitle: "Management Lessons from Field Stories",
    intro,
    lessons,
    scopeLabel,
    storyCount: rows.length,
    portfolioCount: result.counts.portfolio,
    journeyCount: result.counts.journey,
    synthesisSource: "deterministic",
  };
}

function storiesPayloadForSynthesis(result: StoriesQueryResult): string {
  const slim = result.rows.slice(0, 40).map((row) => ({
    title: row.title,
    kind: row.kind,
    companies: row.companyNames,
    country: row.country,
    status: row.status,
    category: row.categoryOrSector,
    date: row.date,
    summary: row.summary,
  }));
  try {
    return JSON.stringify({ scope: describeScope(result.scope), stories: slim }).slice(0, 12_000);
  } catch {
    return String(slim.length);
  }
}

function parseLessonsFromGpt(text: string, result: StoriesQueryResult): StoriesLessonsAnalysis | null {
  try {
    const parsed = JSON.parse(text) as {
      documentTitle?: string;
      intro?: string;
      lessons?: Array<{
        title?: string;
        explanation?: string;
        evidence?: Array<{ storyTitle?: string; company?: string; detail?: string }>;
      }>;
    };
    const lessonsRaw = parsed.lessons ?? [];
    if (!lessonsRaw.length) return null;

    const titleSet = new Set(result.rows.map((r) => r.title.toLowerCase()));
    const lessons: StoryManagementLesson[] = lessonsRaw.slice(0, 3).map((lesson) => {
      const evidence = (lesson.evidence ?? [])
        .slice(0, 4)
        .map((ev) => ({
          storyTitle: String(ev.storyTitle ?? "—").trim(),
          company: String(ev.company ?? "—").trim(),
          detail: String(ev.detail ?? "").trim(),
        }))
        .filter((ev) => ev.storyTitle !== "—" || ev.detail);

      // Attach matching row summaries when GPT omitted detail
      for (const ev of evidence) {
        if (!ev.detail && titleSet.has(ev.storyTitle.toLowerCase())) {
          const row = result.rows.find((r) => r.title.toLowerCase() === ev.storyTitle.toLowerCase());
          if (row) ev.detail = row.summary.slice(0, 220);
        }
      }

      return {
        title: String(lesson.title ?? "Management lesson").trim(),
        explanation: String(lesson.explanation ?? "").trim(),
        evidence,
      };
    });

    if (!lessons.every((l) => l.title && l.explanation)) return null;

    return {
      documentTitle: String(parsed.documentTitle ?? "Management Lessons from Field Stories").trim(),
      intro: String(parsed.intro ?? "").trim(),
      lessons,
      scopeLabel: describeScope(result.scope),
      storyCount: result.rows.length,
      portfolioCount: result.counts.portfolio,
      journeyCount: result.counts.journey,
      synthesisSource: "gpt",
    };
  } catch {
    return null;
  }
}

export async function synthesizeTalantonStoriesLessons(
  result: StoriesQueryResult,
  userQuestion: string,
): Promise<StoriesLessonsAnalysis> {
  const fallback = () => buildDeterministicStoriesLessonsAnalysis(result, userQuestion);

  if (!process.env.OPENAI_API_KEY?.trim()) {
    return fallback();
  }

  try {
    const response = await createAssistantResponse(
      {
        model: getAssistantModel(),
        instructions: [
          "You synthesise Talanton Impact portfolio and journey field stories for executives.",
          "Use ONLY the story records in the user payload. Do not invent companies, metrics, or story titles.",
          "Identify the three strongest recurring management lessons or themes across the stories.",
          "Return JSON only with shape:",
          "{ documentTitle, intro, lessons: [{ title, explanation, evidence: [{ storyTitle, company, detail }] }] }",
          "Each lesson must cite evidence from specific stories in the payload.",
          "If fewer than three distinct lessons exist, return only what the data supports.",
        ].join("\n"),
        input: [
          {
            role: "user",
            content: JSON.stringify({
              question: userQuestion,
              stories: storiesPayloadForSynthesis(result),
            }),
          },
        ],
        text: { format: { type: "json_object" as const } },
        store: false,
      },
      { callSite: "talanton_stories_lessons_synthesis" },
    );

    const text =
      typeof (response as { output_text?: string }).output_text === "string"
        ? (response as { output_text: string }).output_text
        : "";
    if (!text.trim()) return fallback();

    const parsed = parseLessonsFromGpt(text, result);
    return parsed ?? fallback();
  } catch {
    return fallback();
  }
}

export function formatStoriesLessonsProse(analysis: StoriesLessonsAnalysis): string {
  const lines = [analysis.documentTitle, "", analysis.intro, ""];
  for (const lesson of analysis.lessons) {
    lines.push(`## ${lesson.title}`);
    lines.push(lesson.explanation);
    for (const ev of lesson.evidence) {
      lines.push(`• ${ev.storyTitle} (${ev.company}) — ${ev.detail}`);
    }
    lines.push("");
  }
  lines.push(`Scope: ${analysis.scopeLabel}`);
  return lines.join("\n");
}
