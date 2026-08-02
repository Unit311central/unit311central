/**
 * Rebuild thin/broken AI ABHI courses with full playable lesson content.
 * Targets:
 *  - managing-medical-devices-training
 *  - abhi-board-meeting-insights-august-2026
 *
 *   node scripts/repair-abhi-empty-course-content.mjs
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

async function deleteCourseChildren(workspaceId, courseId) {
  await sb.from("lms_questions").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
  await sb.from("lms_lessons").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
  await sb.from("lms_modules").delete().eq("course_id", courseId).eq("workspace_id", workspaceId);
}

async function rebuildCourse(workspaceId, slug, pack) {
  const course = await must(
    `course ${slug}`,
    await sb
      .from("lms_courses")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("slug", slug)
      .maybeSingle(),
  );
  if (!course) throw new Error(`Missing course ${slug}`);

  await deleteCourseChildren(workspaceId, course.id);

  await must(
    `update meta ${slug}`,
    await sb
      .from("lms_courses")
      .update({
        title: pack.title,
        description: pack.description,
        category: pack.category,
        duration_minutes: pack.durationMinutes,
        status: "published",
        pass_mark: 80,
        updated_at: new Date().toISOString(),
      })
      .eq("id", course.id),
  );

  const modules = [];
  for (let i = 0; i < pack.modules.length; i += 1) {
    const m = pack.modules[i];
    modules.push(
      await must(
        `module ${slug} ${i}`,
        await sb
          .from("lms_modules")
          .insert({
            workspace_id: workspaceId,
            course_id: course.id,
            title: m.title,
            summary: m.summary || "",
            sort_order: i + 1,
          })
          .select("*")
          .single(),
      ),
    );
  }

  let lessonCount = 0;
  for (let mi = 0; mi < pack.modules.length; mi += 1) {
    const lessons = pack.modules[mi].lessons;
    for (let li = 0; li < lessons.length; li += 1) {
      const lesson = lessons[li];
      await must(
        `lesson ${slug} ${lesson.title}`,
        await sb.from("lms_lessons").insert({
          workspace_id: workspaceId,
          course_id: course.id,
          module_id: modules[mi].id,
          title: lesson.title,
          lesson_type: lesson.lessonType,
          content: lesson.content,
          sort_order: li + 1,
          estimated_minutes: lesson.estimatedMinutes || 5,
        }),
      );
      lessonCount += 1;
    }
  }

  const qRows = pack.questions.map((q, i) => ({
    workspace_id: workspaceId,
    course_id: course.id,
    module_id: null,
    question_type: q.question_type,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct_choice_id,
    explanation: q.explanation,
    difficulty: q.difficulty || "medium",
    sort_order: i + 1,
  }));
  if (qRows.length) {
    await must(`questions ${slug}`, await sb.from("lms_questions").insert(qRows));
  }

  return { slug, title: pack.title, modules: modules.length, lessons: lessonCount, questions: qRows.length };
}

const MEDICAL_DEVICES = {
  title: "Managing Medical Devices Training",
  category: "Regulatory",
  durationMinutes: 55,
  description:
    "ABHI training based on MHRA Managing Medical Devices principles — roles, policies, training records, incident reporting, and governance for HealthTech organisations and member support teams.",
  modules: [
    {
      title: "Introduction to Medical Device Management",
      summary: "Why device governance matters for patient safety and ABHI members.",
      lessons: [
        {
          title: "Aims of the Guidance",
          lessonType: "rich_text",
          estimatedMinutes: 6,
          content: rt([
            { kind: "heading", level: 2, text: "Aims of Managing Medical Devices" },
            {
              kind: "paragraph",
              text: "Effective medical device management keeps patients safe, protects staff, and ensures devices are selected, used, maintained, and retired under clear accountability. For ABHI and member HealthTech companies, this is also about supporting NHS and care providers with trustworthy products and clear post-market processes.",
            },
            {
              kind: "bullet_list",
              items: [
                "Define clear ownership for device safety across the organisation",
                "Ensure devices are suitable for intended clinical use",
                "Maintain training, maintenance, and traceability records",
                "Report and learn from adverse incidents and near misses",
              ],
            },
            {
              kind: "callout",
              tone: "info",
              title: "ABHI context",
              text: "Member companies and association staff supporting NHS engagement should understand how provider-side device governance connects to manufacturer vigilance and MHRA expectations.",
            },
          ]),
        },
        {
          title: "Role of MHRA",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "MHRA’s role" },
            {
              kind: "paragraph",
              text: "The Medicines and Healthcare products Regulatory Agency (MHRA) protects public health and patient safety in the UK. For medical devices this includes regulation, market surveillance, safety communications, and investigation of serious adverse incidents.",
            },
            {
              kind: "bullet_list",
              items: [
                "Sets and enforces device regulatory requirements",
                "Issues safety alerts and Field Safety Notices expectations",
                "Investigates serious incidents and systemic risks",
                "Expects organisations to have competent local device management arrangements",
              ],
            },
            {
              kind: "callout",
              tone: "warning",
              title: "Do not wait for MHRA",
              text: "Local organisations must still investigate, quarantine unsafe devices, and protect patients immediately — MHRA reporting sits alongside, not instead of, local action.",
            },
          ]),
        },
        {
          title: "Quick check — purpose",
          lessonType: "knowledge_check",
          estimatedMinutes: 3,
          content: kc(
            "What is the primary purpose of medical device management guidance?",
            "Keep patients and staff safe through controlled selection, use, maintenance, and learning from incidents",
            [
              "Reduce purchasing paperwork only",
              "Replace clinical judgement entirely",
              "Eliminate the need for manufacturer vigilance",
            ],
            "Device management is a safety system covering the full device lifecycle.",
          ),
        },
      ],
    },
    {
      title: "Systems of Management",
      summary: "Leadership, groups, and policy.",
      lessons: [
        {
          title: "Management Responsibility",
          lessonType: "rich_text",
          estimatedMinutes: 6,
          content: rt([
            { kind: "heading", level: 2, text: "Management responsibility" },
            {
              kind: "paragraph",
              text: "Senior leaders must appoint clear responsibility for medical device management — often a named director or senior manager — with authority to set policy, allocate resource, and escalate risk. Responsibility cannot sit only with technicians or individual clinicians.",
            },
            {
              kind: "bullet_list",
              items: [
                "Name an accountable lead for device management",
                "Provide authority to enforce policy across departments",
                "Review device risk and incident trends at governance meetings",
                "Ensure budget for training, maintenance, and replacements",
              ],
            },
            {
              kind: "callout",
              tone: "success",
              title: "Good practice",
              text: "Include medical device risk on the organisational risk register with an executive owner and review date.",
            },
          ]),
        },
        {
          title: "Medical Devices Management Group",
          lessonType: "infographic",
          estimatedMinutes: 4,
          content: {
            type: "infographic",
            title: "Building the management group",
            layout: "flow",
            items: [
              {
                id: "1",
                label: "Establish the group",
                body: "Create a cross-functional medical devices management group with a clear terms of reference.",
                icon: "01",
              },
              {
                id: "2",
                label: "Include the right people",
                body: "Clinical users, estates/EBME, infection prevention, procurement, IT (for connected devices), and risk/governance.",
                icon: "02",
              },
              {
                id: "3",
                label: "Set responsibilities",
                body: "Define who approves new devices, who owns training, and who handles incidents.",
                icon: "03",
              },
              {
                id: "4",
                label: "Monitor and improve",
                body: "Review incidents, overdue maintenance, and training gaps every meeting cycle.",
                icon: "04",
              },
            ],
          },
        },
        {
          title: "Device Management Policy",
          lessonType: "scenario",
          estimatedMinutes: 5,
          content: {
            type: "scenario",
            story:
              "Your organisation is drafting a device management policy. A manager wants to skip training requirements for 'experienced staff' and omit incident learning from the policy to keep it short. What should the policy prioritise?",
            character: { name: "Priya", role: "Clinical Governance Lead" },
            choices: [
              {
                id: "a",
                label:
                  "Cover acquisition, acceptance, training, use, maintenance, decontamination, repair, disposal, and incident reporting/learning",
                correct: true,
                feedback:
                  "Correct. A usable policy spans the full lifecycle and requires competence evidence for all users.",
              },
              {
                id: "b",
                label: "Focus only on purchase approval to control spend",
                correct: false,
                feedback: "Incorrect. Cost control matters, but safety lifecycle controls are mandatory.",
              },
              {
                id: "c",
                label: "Leave training optional for senior clinicians",
                correct: false,
                feedback: "Incorrect. Competence must be demonstrated for the specific device — seniority is not enough.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Training and Record Keeping",
      summary: "Competence and traceability.",
      lessons: [
        {
          title: "User Training",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "User training" },
            {
              kind: "paragraph",
              text: "Only trained and assessed users should operate medical devices. Training must match the device, clinical setting, and manufacturer instructions. Refresher training is required when devices change, incidents occur, or competence lapses.",
            },
            {
              kind: "bullet_list",
              items: [
                "Train before first use — not after an incident",
                "Record who was trained, on which device model, and by whom",
                "Include cleaning/decontamination and emergency stop procedures",
                "Reassess competence after significant software or hardware updates",
              ],
            },
          ]),
        },
        {
          title: "Record Keeping",
          lessonType: "drag_drop",
          estimatedMinutes: 5,
          content: {
            type: "drag_drop",
            prompt: "Match each record type to why it matters.",
            mode: "match",
            zones: [
              { id: "zone-1", label: "Purchase / acceptance", hint: "What entered service?" },
              { id: "zone-2", label: "Maintenance", hint: "Is it still safe?" },
              { id: "zone-3", label: "User training", hint: "Who may use it?" },
            ],
            items: [
              {
                id: "item-1",
                label: "Device model, serial number, and acceptance checks",
                correctZoneId: "zone-1",
              },
              {
                id: "item-2",
                label: "Service history, calibration dates, and overdue jobs",
                correctZoneId: "zone-2",
              },
              {
                id: "item-3",
                label: "Named users with competence dates for this device",
                correctZoneId: "zone-3",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Reporting and Incident Management",
      summary: "Act fast, report, learn.",
      lessons: [
        {
          title: "Adverse Incident Reporting",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "Adverse incident reporting" },
            {
              kind: "paragraph",
              text: "When a device may have contributed to harm, near miss, or unsafe condition: protect the patient, quarantine the device and consumables, preserve evidence, inform the device lead, and report through local governance and to MHRA / manufacturer as required.",
            },
            {
              kind: "callout",
              tone: "warning",
              title: "Preserve evidence",
              text: "Do not discard disposables, settings logs, or packaging needed for investigation.",
            },
            {
              kind: "bullet_list",
              items: [
                "Make the situation safe first",
                "Label and isolate the device",
                "Capture time, settings, batch/lot, and people involved",
                "Share learning so the same failure does not recur",
              ],
            },
          ]),
        },
        {
          title: "Scenario: Reporting an Incident",
          lessonType: "scenario",
          estimatedMinutes: 5,
          content: {
            type: "scenario",
            story:
              "A syringe pump delivers an unexpected bolus. The patient is stable after clinical intervention. A colleague suggests resetting the pump and putting it back into use to avoid delaying the list. What should you do?",
            character: { name: "James", role: "Ward Manager" },
            choices: [
              {
                id: "a",
                label:
                  "Quarantine the pump with consumables/settings evidence, escalate to the device lead, and report via local incident process",
                correct: true,
                feedback:
                  "Correct. Returning a suspect device to service risks further harm and destroys the investigation trail.",
              },
              {
                id: "b",
                label: "Reset and reuse it because the patient recovered",
                correct: false,
                feedback: "Incorrect. Patient recovery does not clear the device of fault.",
              },
              {
                id: "c",
                label: "Wait a week to see if it happens again before reporting",
                correct: false,
                feedback: "Incorrect. Report promptly — delays lose evidence and increase risk.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Assessment and Review",
      summary: "Final assessment.",
      lessons: [
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
      "What is the primary role of the MHRA in relation to medical devices?",
      "To protect public health and patient safety through regulation and surveillance",
      [
        "To manufacture medical devices",
        "To sell devices to NHS trusts",
        "To provide only optional marketing guidance",
      ],
      "MHRA’s mandate is public health and patient safety.",
      "easy",
    ),
    mcq(
      "Who should hold overall accountability for medical device management?",
      "A named senior manager / director with authority and resources",
      [
        "Any available bank nurse",
        "Only the device manufacturer",
        "External visitors at trade shows",
      ],
      "Accountability must be named and resourced at leadership level.",
    ),
    mcq(
      "Before a staff member uses a new device model they should:",
      "Complete device-specific training and have competence recorded",
      [
        "Watch a colleague once without assessment",
        "Rely on general clinical seniority",
        "Start using it and read the manual later",
      ],
      "Competence must be device-specific and evidenced.",
    ),
    mcq(
      "After a suspected device-related incident you should first:",
      "Make the patient safe, then quarantine the device and preserve evidence",
      [
        "Return the device to service immediately",
        "Discard consumables to tidy the bay",
        "Post about it on social media",
      ],
      "Safety and evidence preservation come first.",
    ),
    mcq(
      "A medical devices management group should typically include:",
      "Clinical users, technical/EBME, procurement, and governance/risk roles",
      [
        "Only finance staff",
        "Only marketing",
        "Only external sales representatives",
      ],
      "Cross-functional membership is required for effective control.",
    ),
    mcq(
      "Device records should enable you to know:",
      "What device is in service, who may use it, and whether maintenance is in date",
      [
        "Only the purchase price",
        "Only the colour of the casing",
        "Only the supplier’s logo",
      ],
      "Traceability and competence records are core controls.",
    ),
    mcq(
      "Field Safety Notices and MHRA alerts should be:",
      "Actioned, documented, and tracked to closure by the device lead",
      [
        "Filed unread",
        "Ignored if the ward is busy",
        "Shared only with sales teams",
      ],
      "Safety communications require controlled action and closure.",
    ),
    mcq(
      "Why is ‘experienced staff don’t need training’ unsafe?",
      "Competence is device- and model-specific; experience elsewhere is not sufficient",
      [
        "Training is only for students",
        "MHRA bans experienced staff",
        "Training increases device failure rates",
      ],
      "Prior experience does not replace assessed competence on the specific device.",
      "hard",
    ),
  ],
};

const BOARD_INSIGHTS = {
  title: "ABHI Board Meeting Insights: August 2026",
  category: "Governance",
  durationMinutes: 40,
  description:
    "Board-ready learning module covering August 2026 ABHI board themes: membership, financial performance, risk, and key decisions.",
  modules: [
    {
      title: "Membership & Growth",
      summary: "What the numbers mean for strategy.",
      lessons: [
        {
          title: "Membership Growth Insights",
          lessonType: "rich_text",
          estimatedMinutes: 6,
          content: rt([
            { kind: "heading", level: 2, text: "Membership growth — August 2026" },
            {
              kind: "paragraph",
              text: "ABHI reports 379 active members, a net growth of 7. Growth is positive, but the board should test quality of joiners, segment mix (SME vs large), and churn risk in the next quarter — especially where sponsorship dependency is high.",
            },
            {
              kind: "bullet_list",
              items: [
                "379 active members (+7 net)",
                "Track onboarding completion for new joiners within 60 days",
                "Segment growth: UK core vs international vs start-up members",
                "Link membership pipeline to working-group participation",
              ],
            },
            {
              kind: "callout",
              tone: "info",
              title: "Board question",
              text: "Is growth translating into engagement and renewals, or only into headline headcount?",
            },
          ]),
        },
        {
          title: "Knowledge Check — membership",
          lessonType: "knowledge_check",
          estimatedMinutes: 3,
          content: kc(
            "What is the current number of active ABHI members referenced in the August pack?",
            "379",
            ["350", "400", "312"],
            "The August pack cites 379 active members with net growth of 7.",
          ),
        },
      ],
    },
    {
      title: "Financial Performance",
      summary: "Revenue, cash, and sponsorship pressure.",
      lessons: [
        {
          title: "Financial Performance Analysis",
          lessonType: "infographic",
          estimatedMinutes: 5,
          content: {
            type: "infographic",
            title: "August financial snapshot",
            layout: "steps",
            items: [
              {
                id: "1",
                label: "Revenue YTD",
                body: "£2.0m YTD — around 7% below budget. Focus recovery on sponsorship and events.",
                icon: "£",
              },
              {
                id: "2",
                label: "Sponsorship gap",
                body: "Sponsorship revenue ~£120k below budget — tier-one renewals need an owner and weekly chase plan.",
                icon: "SP",
              },
              {
                id: "3",
                label: "Cash position",
                body: "Cash £4.24m (+£143k MoM) — resilient, but not a reason to ignore the revenue gap.",
                icon: "CA",
              },
              {
                id: "4",
                label: "Debtors watch",
                body: "Overdue invoices ~£18k — tighten credit control without damaging member relationships.",
                icon: "AR",
              },
            ],
          },
        },
        {
          title: "Scenario: Sponsorship Renewal Delay",
          lessonType: "scenario",
          estimatedMinutes: 5,
          content: {
            type: "scenario",
            story:
              "A tier-one sponsor has delayed renewal past the board pack cut-off. Commercial proposes discounting heavily to close this week. Finance warns the discount would widen the YTD gap. What should the board push for?",
            character: { name: "Jane", role: "Deputy CEO & CFO" },
            choices: [
              {
                id: "a",
                label:
                  "Approve a time-bound recovery plan with named owners, retain value where possible, and report weekly until closed",
                correct: true,
                feedback:
                  "Correct. Boards should demand paced recovery with accountability — not panic discounting or silence.",
              },
              {
                id: "b",
                label: "Ignore the delay because cash is strong",
                correct: false,
                feedback: "Incorrect. Cash strength does not fix structural sponsorship risk.",
              },
              {
                id: "c",
                label: "Offer any discount needed with no conditions",
                correct: false,
                feedback: "Incorrect. Unconditional discounting trains poor renewal behaviour.",
              },
            ],
          },
        },
      ],
    },
    {
      title: "Risk & Decisions",
      summary: "What the board must decide.",
      lessons: [
        {
          title: "Identifying New Risks",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "New and elevated risks" },
            {
              kind: "paragraph",
              text: "August risk discussion highlights delays in tier-one sponsorship renewals and MHRA SaMD reclassification compliance burden on members — both can hit ABHI revenue and member value if unmanaged.",
            },
            {
              kind: "bullet_list",
              items: [
                "Sponsorship renewal delay — commercial concentration risk",
                "MHRA SaMD reclassification — member support demand spike",
                "Ensure mitigations have owners, dates, and board reporting cadence",
              ],
            },
            {
              kind: "callout",
              tone: "warning",
              title: "Board expectation",
              text: "Risks without owners are not mitigations — assign before the next meeting.",
            },
          ]),
        },
        {
          title: "Key Decisions Overview",
          lessonType: "rich_text",
          estimatedMinutes: 5,
          content: rt([
            { kind: "heading", level: 2, text: "Key decisions" },
            {
              kind: "paragraph",
              text: "The August board is asked to approve the Q4 sponsorship recovery plan and confirm funding for the NHS adoption working group. Decisions should be minuted with success metrics and review points.",
            },
            {
              kind: "bullet_list",
              items: [
                "Approve Q4 sponsorship recovery plan (owners + weekly KPI)",
                "Confirm NHS adoption working group funding envelope",
                "Request a mid-quarter checkpoint on both items",
              ],
            },
          ]),
        },
        {
          title: "Scenario: NHS Adoption Funding",
          lessonType: "scenario",
          estimatedMinutes: 5,
          content: {
            type: "scenario",
            story:
              "A non-executive asks you to justify NHS adoption working group funding while sponsorship is behind budget. How do you frame the decision?",
            character: { name: "Andrew", role: "Non-Executive Director" },
            choices: [
              {
                id: "a",
                label:
                  "Tie funding to member value and measurable NHS adoption outcomes, with a capped envelope and review gate",
                correct: true,
                feedback:
                  "Correct. Investment cases should be outcome-linked and controllable when revenue is tight.",
              },
              {
                id: "b",
                label: "Fund indefinitely without metrics because advocacy is intangible",
                correct: false,
                feedback: "Incorrect. Boards still need measurable outcomes and review points.",
              },
              {
                id: "c",
                label: "Cut the working group entirely without assessing member impact",
                correct: false,
                feedback: "Incorrect. Abrupt cuts may damage the membership proposition.",
              },
            ],
          },
        },
        {
          title: "Final Assessment",
          lessonType: "assessment",
          estimatedMinutes: 10,
          content: {
            type: "assessment",
            drawCount: 6,
            passMark: 80,
            questionBankScope: "course",
          },
        },
      ],
    },
  ],
  questions: [
    mcq(
      "How many active members are cited in the August 2026 pack?",
      "379",
      ["350", "400", "295"],
      "The pack references 379 active members.",
      "easy",
    ),
    mcq(
      "Sponsorship revenue is approximately how far below budget?",
      "£120k below budget",
      ["£12k below budget", "£1.2m below budget", "On budget"],
      "The pack flags ~£120k sponsorship shortfall.",
    ),
    mcq(
      "Cash position in the August snapshot is described as:",
      "£4.24m with a month-on-month increase",
      ["Negative cash", "Exactly break-even", "Unknown / not reported"],
      "Cash is resilient at £4.24m (+£143k MoM).",
    ),
    mcq(
      "A key elevated risk in the pack is:",
      "Delay in tier-one sponsorship renewals",
      ["Office stationery costs", "Too many completed actions", "Excess surplus with no plan"],
      "Sponsorship renewal delay is called out explicitly.",
    ),
    mcq(
      "Which decision is the board asked to confirm?",
      "NHS adoption working group funding",
      ["Closing the association", "Removing all member events", "Ending financial reporting"],
      "NHS adoption working group funding is a listed decision.",
    ),
    mcq(
      "Best board response to a sponsorship gap is:",
      "A named recovery plan with owners, timeline, and weekly reporting",
      ["No action because cash is strong", "Unlimited discounting", "Stop reading packs"],
      "Accountability and paced recovery beat denial or panic.",
      "hard",
    ),
    mcq(
      "MHRA SaMD reclassification matters to ABHI because:",
      "It can increase member support demand and compliance burden",
      ["It only affects food retailers", "It removes all device regulation", "It is unrelated to HealthTech"],
      "SaMD changes affect member companies ABHI represents.",
    ),
    mcq(
      "Net membership growth of 7 should prompt the board to also ask:",
      "Whether engagement and renewals quality match headline growth",
      ["Only about the logo colour", "Whether to hide the figure", "Whether finance should stop invoicing"],
      "Growth quality matters as much as headcount.",
    ),
  ],
};

async function main() {
  const ws = await must(
    "workspace",
    await sb.from("workspaces").select("id,slug").eq("slug", "abhi").maybeSingle(),
  );
  if (!ws?.id) throw new Error("ABHI workspace not found");

  const results = [];
  results.push(await rebuildCourse(ws.id, "managing-medical-devices-training", MEDICAL_DEVICES));
  results.push(await rebuildCourse(ws.id, "abhi-board-meeting-insights-august-2026", BOARD_INSIGHTS));

  console.log(JSON.stringify({ ok: true, repaired: results }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
