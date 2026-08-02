/**
 * Rebuild & publish ABHI Board Meeting Essentials (broken AI draft).
 *   node scripts/repair-abhi-board-meeting-essentials.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const sb = createClient(
  env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

function choice(id, label) {
  return { id, label };
}
function rt(blocks) {
  return { type: "rich_text", blocks };
}
function kc(prompt, correct, wrongs, explanation) {
  return {
    type: "knowledge_check",
    prompt,
    choices: [choice("a", correct), ...wrongs.map((w, i) => choice(String.fromCharCode(98 + i), w))],
    correctId: "a",
    explanation,
  };
}
function mcq(stem, correct, wrongs, explanation, difficulty = "medium") {
  return {
    question_type: "multiple_choice",
    stem,
    choices: [choice("a", correct), ...wrongs.map((w, i) => choice(String.fromCharCode(98 + i), w))],
    correct_choice_id: "a",
    explanation,
    difficulty,
  };
}

async function must(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

const SLUG = "abhi-board-meeting-essentials";

const PACK = {
  title: "ABHI Board Meeting Essentials",
  category: "Governance",
  durationMinutes: 45,
  description:
    "Practical primer for ABHI board meeting participation — structure and roles, reading financials, using the risk register, and contributing to decisions.",
  modules: [
    {
      title: "Board Structure & Roles",
      summary: "How an ABHI board meeting is organised.",
      lessons: [
        {
          title: "Overview of Board Structure",
          lessonType: "rich_text",
          estimatedMinutes: 6,
          content: rt([
            { kind: "heading", level: 2, text: "How the ABHI board works" },
            {
              kind: "paragraph",
              text: "ABHI’s board provides strategic oversight for the UK’s HealthTech trade association. Meetings typically cover membership and commercial performance, risk, policy/advocacy priorities, international events (including UK Pavilion activity), and decisions that need formal approval or funding.",
            },
            {
              kind: "bullet_list",
              items: [
                "Chair sets tone and keeps the agenda moving",
                "Executives present packs; non-executives challenge and decide",
                "Minutes record decisions, owners, and due dates",
                "Board packs should be read before the meeting — not discovered live",
              ],
            },
            {
              kind: "callout",
              tone: "info",
              title: "Board member habit",
              text: "Arrive with 2–3 clarifying questions per major paper and one view on the decision asked.",
            },
          ]),
        },
        {
          title: "Key Roles and Responsibilities",
          lessonType: "infographic",
          estimatedMinutes: 4,
          content: {
            type: "infographic",
            title: "Who does what",
            layout: "flow",
            items: [
              {
                id: "1",
                label: "Chair",
                body: "Facilitates debate, ensures all voices are heard, and confirms decisions.",
                icon: "01",
              },
              {
                id: "2",
                label: "CEO / Executive",
                body: "Owns the narrative, options, and implementation after approval.",
                icon: "02",
              },
              {
                id: "3",
                label: "CFO / Finance",
                body: "Explains financial trajectory, risks to budget, and cash implications.",
                icon: "03",
              },
              {
                id: "4",
                label: "Non-executives",
                body: "Test assumptions, insist on owners/dates, and protect long-term member value.",
                icon: "04",
              },
            ],
          },
        },
        {
          title: "Quick check — roles",
          lessonType: "knowledge_check",
          estimatedMinutes: 3,
          content: kc(
            "What is the non-executive director’s primary contribution in an ABHI board meeting?",
            "Challenge assumptions, insist on clear owners/dates, and protect long-term member value",
            [
              "Write every operational email",
              "Ignore financial papers",
              "Approve decisions without reading the pack",
            ],
            "NEDs provide independent challenge and governance discipline.",
          ),
        },
      ],
    },
    {
      title: "Reading the Numbers",
      summary: "Revenue, P&L, and board questions.",
      lessons: [
        {
          title: "Understanding Revenue Streams",
          lessonType: "rich_text",
          estimatedMinutes: 6,
          content: rt([
            { kind: "heading", level: 2, text: "ABHI revenue building blocks" },
            {
              kind: "paragraph",
              text: "Association revenue typically mixes membership subscriptions, events/sponsorship, projects/programmes, and other commercial activity. Boards should understand concentration risk — e.g. dependence on a small number of tier-one sponsors — and whether growth is recurring or one-off.",
            },
            {
              kind: "bullet_list",
              items: [
                "Membership — recurring, quality of renewals matters",
                "Sponsorship / events — timing and pipeline risk",
                "Programmes / projects — often restricted or milestone-based",
                "Ask: is the forecast driven by signed commitments or hope?",
              ],
            },
            {
              kind: "callout",
              tone: "warning",
              title: "Watch concentration",
              text: "A sponsorship gap can look small in cash terms but large for budget credibility if renewals slip.",
            },
          ]),
        },
        {
          title: "Analyzing the Profit & Loss Statement",
          lessonType: "scenario",
          estimatedMinutes: 5,
          content: {
            type: "scenario",
            story:
              "YTD revenue is ~7% below budget while cash remains healthy. Commercial proposes an aggressive discount to close a delayed tier-one sponsorship this week. Finance wants a paced recovery plan. As a board member, what do you push for?",
            character: { name: "Jane", role: "Deputy CEO & CFO" },
            choices: [
              {
                id: "a",
                label:
                  "A time-bound recovery plan with named owners, weekly KPIs, and disciplined commercial terms",
                correct: true,
                feedback:
                  "Correct. Healthy cash is not permission to ignore a budget gap or discount without control.",
              },
              {
                id: "b",
                label: "Ignore the gap because cash is up month-on-month",
                correct: false,
                feedback: "Incorrect. Cash strength can mask structural revenue risk.",
              },
              {
                id: "c",
                label: "Approve any discount with no conditions to close immediately",
                correct: false,
                feedback: "Incorrect. Unconditional discounting sets a poor renewal precedent.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Risk & Decisions",
      summary: "Using the register and making decisions stick.",
      lessons: [
        {
          title: "Identifying Key Risks",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "What good risk discussion looks like" },
            {
              kind: "paragraph",
              text: "Board risk conversations should move beyond listing issues. For each material risk ask: impact, likelihood, owner, mitigation, residual rating, and next review date. Typical ABHI themes include commercial concentration, regulatory change affecting members (e.g. SaMD), event delivery, and reputation.",
            },
            {
              kind: "bullet_list",
              items: [
                "No owner = not mitigated",
                "Mitigations need dates, not slogans",
                "Link high risks to agenda decisions and actions",
                "Escalate early when residual risk remains high",
              ],
            },
          ]),
        },
        {
          title: "Risk Register Analysis",
          lessonType: "drag_drop",
          estimatedMinutes: 5,
          content: {
            type: "drag_drop",
            prompt: "Match each risk element to the board question it answers.",
            mode: "match",
            zones: [
              { id: "zone-1", label: "Impact / likelihood", hint: "How bad / how likely?" },
              { id: "zone-2", label: "Owner", hint: "Who is accountable?" },
              { id: "zone-3", label: "Mitigation & due date", hint: "What changes by when?" },
            ],
            items: [
              {
                id: "item-1",
                label: "Rating that drives whether the risk is tolerated or treated",
                correctZoneId: "zone-1",
              },
              {
                id: "item-2",
                label: "Named executive responsible for residual risk",
                correctZoneId: "zone-2",
              },
              {
                id: "item-3",
                label: "Concrete actions with a checkpoint before the next board",
                correctZoneId: "zone-3",
              },
            ],
          },
        },
        {
          title: "Final Assessment",
          lessonType: "assessment",
          estimatedMinutes: 12,
          content: {
            type: "assessment",
            drawCount: 8,
            passMark: 80,
            questionBankScope: "course",
          },
        },
      ],
    },
  ],
  questions: [
    mcq(
      "Before an ABHI board meeting, members should:",
      "Read the pack and prepare focused questions on the decisions asked",
      ["Wait to discover papers in the meeting", "Only skim the cover page", "Skip finance papers"],
      "Preparation is part of the governance duty.",
      "easy",
    ),
    mcq(
      "A healthy cash balance means:",
      "The board can still challenge revenue gaps and demand recovery plans",
      ["Budget misses can be ignored", "Sponsorship risk disappears", "No mitigations are needed"],
      "Cash resilience does not remove performance accountability.",
    ),
    mcq(
      "Which revenue type is usually most recurring?",
      "Membership subscriptions",
      ["One-off emergency grants only", "Unconfirmed sponsorship ideas", "Personal staff loans"],
      "Membership is typically the recurring core.",
    ),
    mcq(
      "A risk without an owner should be treated as:",
      "Not adequately mitigated",
      ["Fully closed", "Someone else’s problem forever", "Automatically low impact"],
      "Ownership is a minimum control.",
    ),
    mcq(
      "Non-executive directors add most value when they:",
      "Test assumptions and insist on clear owners, dates, and outcomes",
      ["Rewrite operational emails", "Avoid challenging executives", "Approve every paper unread"],
      "Independent challenge is the NED role.",
    ),
    mcq(
      "When sponsorship renewals slip, the board should ask for:",
      "Named owners, timeline, and weekly progress reporting",
      ["Silence until year-end", "Unlimited discounting only", "Deleting the risk from the register"],
      "Paced, accountable recovery beats denial or panic.",
    ),
    mcq(
      "Minutes should capture:",
      "Decisions, action owners, and due dates",
      ["Only jokes", "Only slide titles", "Nothing if people are busy"],
      "Minutes are the accountability record.",
    ),
    mcq(
      "Linking a high residual risk to a board decision means:",
      "The decision paper should address how the risk is treated or accepted",
      ["Risks and decisions must never be discussed together", "Finance can ignore risk", "Only HR reviews risks"],
      "Material risks should inform decisions.",
      "hard",
    ),
  ],
};

async function main() {
  const ws = await must(
    "workspace",
    await sb.from("workspaces").select("id").eq("slug", "abhi").maybeSingle(),
  );
  const course = await must(
    "course",
    await sb
      .from("lms_courses")
      .select("*")
      .eq("workspace_id", ws.id)
      .eq("slug", SLUG)
      .maybeSingle(),
  );
  if (!course) throw new Error(`Missing ${SLUG}`);

  await sb.from("lms_questions").delete().eq("course_id", course.id).eq("workspace_id", ws.id);
  await sb.from("lms_lessons").delete().eq("course_id", course.id).eq("workspace_id", ws.id);
  await sb.from("lms_modules").delete().eq("course_id", course.id).eq("workspace_id", ws.id);

  await must(
    "meta",
    await sb
      .from("lms_courses")
      .update({
        title: PACK.title,
        description: PACK.description,
        category: PACK.category,
        duration_minutes: PACK.durationMinutes,
        status: "published",
        pass_mark: 80,
        sort_order: 25,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id),
  );

  const modules = [];
  for (let i = 0; i < PACK.modules.length; i += 1) {
    modules.push(
      await must(
        `module ${i}`,
        await sb
          .from("lms_modules")
          .insert({
            workspace_id: ws.id,
            course_id: course.id,
            title: PACK.modules[i].title,
            summary: PACK.modules[i].summary || "",
            sort_order: i + 1,
          })
          .select("*")
          .single(),
      ),
    );
  }

  let lessons = 0;
  for (let mi = 0; mi < PACK.modules.length; mi += 1) {
    for (let li = 0; li < PACK.modules[mi].lessons.length; li += 1) {
      const lesson = PACK.modules[mi].lessons[li];
      await must(
        lesson.title,
        await sb.from("lms_lessons").insert({
          workspace_id: ws.id,
          course_id: course.id,
          module_id: modules[mi].id,
          title: lesson.title,
          lesson_type: lesson.lessonType,
          content: lesson.content,
          sort_order: li + 1,
          estimated_minutes: lesson.estimatedMinutes || 5,
        }),
      );
      lessons += 1;
    }
  }

  await must(
    "questions",
    await sb.from("lms_questions").insert(
      PACK.questions.map((q, i) => ({
        workspace_id: ws.id,
        course_id: course.id,
        module_id: null,
        question_type: q.question_type,
        stem: q.stem,
        choices: q.choices,
        correct_choice_id: q.correct_choice_id,
        explanation: q.explanation,
        difficulty: q.difficulty || "medium",
        sort_order: i + 1,
      })),
    ),
  );

  console.log(
    JSON.stringify(
      { ok: true, slug: SLUG, status: "published", modules: modules.length, lessons, questions: PACK.questions.length },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
