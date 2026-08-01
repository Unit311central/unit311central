/**
 * Seed Talanton Impact LMS course 001: Anti-Bribery & Corruption.
 *
 * Usage: node scripts/seed-lms-talanton-course-001.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path, { overwrite = false } = {}) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!value) continue;
    if (overwrite || !process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.deploy.pull"));
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));
loadEnvFile(resolve(process.cwd(), ".env.vercel.lms"), { overwrite: true });
loadEnvFile(resolve(process.cwd(), ".env.corporatecentre.runtime"), { overwrite: true });

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "").trim();
const SERVICE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();

if (!SUPABASE_URL.startsWith("http") || SERVICE_KEY.length < 40) {
  console.error("Missing valid SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY", {
    urlLen: SUPABASE_URL.length,
    keyLen: SERVICE_KEY.length,
  });
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const WORKSPACE_SLUG = "talantonimpact";
const COURSE_SLUG = "anti-bribery";
const DEMO_USERNAME = "demo@ethicalapparelafrica.com";

/** Portal client_ids matching company-portal-routes / portfolio seed */
const CLIENT_IDS = [
  "ti-cli-ethical-apparel-africa",
  "ti-cli-arc-ride",
  "ti-cli-burn-manufacturing",
  "ti-cli-kentegra-biotechnology",
  "ti-cli-long-miles-coffee",
  "ti-cli-pharmakina",
  "ti-cli-moko-home-living",
  "ti-cli-power-resources-international",
  "ti-cli-auto-springs-east-africa-plc",
  "ti-cli-biofarms-limited",
  "ti-cli-enda-sportswear",
  "ti-cli-kijani-forestry",
  "ti-cli-kivu-tilapia-farm-ltd",
  "ti-cli-masaka-farms",
  "ti-cli-owp-pharmaceuticals",
  "ti-cli-pezesha",
  "ti-cli-poa-internet",
  "ti-cli-rabboni-group",
  "ti-cli-taraji-afrika",
];

const IMG = {
  boardroom:
    "https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1600&q=80",
  handshake:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1600&q=80",
  factory:
    "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1600&q=80",
  market:
    "https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  team:
    "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?auto=format&fit=crop&w=1600&q=80",
  cafe:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1600&q=80",
  city:
    "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1600&q=80",
};

function choice(id, label) {
  return { id, label };
}

function mcq(stem, correct, wrongs, explanation, difficulty = "medium") {
  const choices = [
    choice("a", correct),
    ...wrongs.map((w, i) => choice(String.fromCharCode(98 + i), w)),
  ];
  return {
    question_type: "multiple_choice",
    stem,
    choices,
    correct_choice_id: "a",
    explanation,
    difficulty,
  };
}

function tf(stem, correctIsTrue, explanation, difficulty = "easy") {
  return {
    question_type: "true_false",
    stem,
    choices: [choice("true", "True"), choice("false", "False")],
    correct_choice_id: correctIsTrue ? "true" : "false",
    explanation,
    difficulty,
  };
}

function scenarioQ(stem, correct, wrongs, explanation, difficulty = "hard") {
  return {
    ...mcq(stem, correct, wrongs, explanation, difficulty),
    question_type: "scenario",
  };
}

function buildQuestionBank() {
  const bank = [
    mcq(
      "Which of the following best defines a bribe?",
      "Anything of value offered to improperly influence a decision",
      [
        "Only cash payments above USD 1,000",
        "Gifts given after a contract is signed",
        "Hospitality that is publicly disclosed",
      ],
      "Bribery is about improper influence, not only cash or large amounts.",
      "easy",
    ),
    mcq(
      "Facilitation payments are typically:",
      "Small unofficial payments to speed routine government actions — still prohibited",
      [
        "Always legal if under USD 50",
        "Required by East African commercial codes",
        "Acceptable when booked as marketing expense",
      ],
      "Most anti-bribery regimes (and Talanton policy) ban facilitation payments.",
    ),
    mcq(
      "Who can be a bribery risk contact for a portfolio company?",
      "Public officials, private counterparties, agents, and intermediaries",
      [
        "Only elected politicians",
        "Only customs officers",
        "Only foreign suppliers",
      ],
      "Private-to-private bribery and third-party agents are common risk channels.",
    ),
    tf(
      "A payment made through a distributor can still be a bribe attributable to your company.",
      true,
      "Third-party payments do not break the chain of responsibility if made on your behalf.",
    ),
    tf(
      "If local custom expects a 'token of appreciation' to win a licence, it is automatically allowed.",
      false,
      "Local custom does not override anti-bribery law or Talanton policy.",
    ),
    scenarioQ(
      "A port officer says containers will clear next week unless you pay a 'special handling fee' in cash. Best response?",
      "Refuse, document the request, escalate to compliance, and use official channels",
      [
        "Pay cash and expense it as logistics",
        "Pay via a freight forwarder so it is not on your books",
        "Agree verbally but ask for a discount",
      ],
      "Refuse, record, escalate — never pay unofficial cash to officials.",
    ),
    mcq(
      "Which gift is most likely acceptable under a green-zone gifts policy?",
      "Branded low-value merchandise with no decision pending",
      [
        "Cash equivalent gift cards during a tender",
        "Luxury watch for a licensing officer",
        "All-expenses safari for a procurement manager evaluating your bid",
      ],
      "Low-value branded items with no pending decision are typically green.",
    ),
    mcq(
      "Amber-zone hospitality usually requires:",
      "Pre-approval, transparency, and a clear business purpose",
      [
        "No record if under USD 200",
        "Verbal approval from any colleague",
        "Payment in cash to avoid invoices",
      ],
      "Amber items need controls: approval, purpose, and documentation.",
    ),
    mcq(
      "Red-zone gifts include:",
      "Cash, kickbacks, and anything tied to a pending official decision",
      [
        "Company-branded notebooks",
        "Working lunches at modest venues",
        "Conference badges",
      ],
      "Cash and influence-linked benefits are always red.",
      "easy",
    ),
    scenarioQ(
      "A ministry contact invites your MD to an exclusive resort weekend while your licence renewal is pending. You should:",
      "Decline and explain policy; offer a transparent business meeting instead",
      [
        "Accept if the resort invoices the ministry",
        "Accept but leave early on Sunday",
        "Send a junior staffer instead of the MD",
      ],
      "Pending decisions + lavish hospitality = classic red flag.",
    ),
    mcq(
      "Procurement red flags include all except:",
      "Competitive tender with documented evaluation criteria",
      [
        "Single-source award to a relative of the buyer",
        "Vague scope and inflated change orders",
        "Pressure to bypass due diligence on an agent",
      ],
      "Transparent competitive procurement is a control, not a red flag.",
    ),
    tf(
      "Conflicts of interest must be disclosed even if no bribe has been paid.",
      true,
      "Undisclosed conflicts enable corruption and breach governance duties.",
    ),
    mcq(
      "An agent who refuses to sign an anti-bribery clause should be:",
      "Treated as high risk — pause engagement until resolved or exit",
      [
        "Paid a higher commission for the inconvenience",
        "Engaged only for government tenders",
        "Ignored if they deliver results",
      ],
      "Refusal to accept ABC clauses is a serious third-party red flag.",
    ),
    scenarioQ(
      "Your cousin owns a logistics firm bidding for your company's contract. Best action?",
      "Disclose the relationship, recuse from the decision, and follow competitive process",
      [
        "Award them the contract quietly to keep family peace",
        "Increase their score in the evaluation sheet",
        "Ask them to bid under a different company name",
      ],
      "Disclose and recuse — family bidding needs transparent handling.",
    ),
    mcq(
      "Speaking up / whistleblowing should be:",
      "Protected, confidential where possible, and free from retaliation",
      [
        "Only allowed after you have proof beyond doubt",
        "Shared first on social media",
        "Limited to HR complaints about leave",
      ],
      "Credible concerns should be raised safely without fear of retaliation.",
    ),
    tf(
      "Retaliating against someone who reports suspected bribery in good faith is itself misconduct.",
      true,
      "Non-retaliation is a core speak-up principle.",
      "easy",
    ),
    mcq(
      "Books and records must:",
      "Accurately reflect transactions — no off-books slush funds",
      [
        "Hide facilitation payments as 'miscellaneous'",
        "Omit agent commissions under USD 500",
        "Use cash only for government fees",
      ],
      "Accurate books are both a legal and investor requirement.",
    ),
    mcq(
      "Talanton portfolio companies should treat anti-bribery as:",
      "A leadership responsibility affecting investment trust and operations",
      [
        "Optional training for juniors only",
        "Relevant only to companies listed on a stock exchange",
        "A problem limited to extractives",
      ],
      "Integrity protects value across sectors and ownership structures.",
    ),
    scenarioQ(
      "A supplier offers a 5% 'success fee' to your procurement manager personally if selected. Response?",
      "Reject, report immediately, and exclude the supplier from the process",
      [
        "Negotiate the fee down to 2%",
        "Accept if shared with the team",
        "Delay reporting until after award",
      ],
      "Personal success fees to buyers are classic kickbacks.",
    ),
    mcq(
      "Due diligence on intermediaries should include:",
      "Ownership, reputation, scope of work, and compensation reasonableness",
      [
        "Only checking that they have a business licence",
        "Asking them to self-certify with no verification",
        "Skipping checks for long-standing agents",
      ],
      "Risk-based due diligence is essential for agents and consultants.",
    ),
    tf(
      "Lavish entertainment is acceptable if nobody asks for a receipt.",
      false,
      "Lack of documentation increases risk; lavish entertainment can still be improper.",
    ),
    mcq(
      "Which statement about public officials is correct?",
      "They include employees of state-owned enterprises and regulators",
      [
        "Only elected MPs count as public officials",
        "SOE staff are always treated as private persons",
        "Customs brokers are never considered connected to officials",
      ],
      "SOE and regulatory staff are typically covered as public officials.",
    ),
    scenarioQ(
      "Customs insists on an unofficial cash fee to release perishable goods. Your ops lead wants to pay to avoid spoilage. You should:",
      "Refuse cash; escalate; pursue official escalation paths and document losses",
      [
        "Pay and label it 'spoilage insurance'",
        "Pay via the driver's personal account",
        "Promise future employment to the officer instead",
      ],
      "Commercial pressure does not legitimise facilitation payments.",
    ),
    mcq(
      "A charitable donation requested by a decision-maker during a tender is:",
      "High risk — may be a disguised bribe; seek compliance approval or decline",
      [
        "Always fine if the charity is real",
        "Required ESG spend",
        "Safe if under USD 10,000",
      ],
      "Donations tied to decisions can be improper inducements.",
    ),
    tf(
      "Training completion alone guarantees zero bribery risk.",
      false,
      "Training is necessary but must be paired with controls, culture, and enforcement.",
    ),
    mcq(
      "Accurate expense claims matter because:",
      "Mischaracterised expenses can conceal bribes",
      [
        "Finance teams enjoy paperwork",
        "Only auditors care about coding",
        "Cash expenses never need categories",
      ],
      "False expense descriptions are a common concealment method.",
    ),
    scenarioQ(
      "A regulator's relative asks for a 'consulting' retainer with no defined work while a permit is pending. You should:",
      "Decline; insist on transparent scope or no engagement; disclose the request",
      [
        "Sign a vague retainer to keep relations warm",
        "Pay via a shell company",
        "Hire them after the permit is issued without disclosure",
      ],
      "Sham consulting near decisions is a bribery red flag.",
    ),
    mcq(
      "Green-zone hospitality examples include:",
      "Modest working lunch during a legitimate site visit",
      [
        "First-class flights for a spouse on holiday",
        "Casino chips for a tender committee",
        "Undisclosed cash envelopes",
      ],
      "Modest, purpose-linked hospitality is typically acceptable.",
      "easy",
    ),
    mcq(
      "When unsure whether a payment is proper, the safest step is:",
      "Pause and ask compliance / legal before proceeding",
      [
        "Ask the counterparty to confirm it is fine",
        "Pay first and check later",
        "Use WhatsApp only so there is no email trail",
      ],
      "When in doubt, stop and escalate internally.",
    ),
    tf(
      "Private-sector kickbacks between companies can still violate law and Talanton policy.",
      true,
      "Commercial bribery is prohibited even when no public official is involved.",
    ),
    mcq(
      "Record retention for ABC-related approvals should be:",
      "Complete enough to show who approved what, when, and why",
      [
        "Deleted after 30 days for privacy",
        "Kept only on personal phones",
        "Optional for amounts under USD 100",
      ],
      "Audit trails demonstrate control effectiveness.",
    ),
    scenarioQ(
      "Your team wins a tender after an agent 'handled government relations' with no invoices. Risk?",
      "High — possible concealed bribes via the agent; investigate and strengthen controls",
      [
        "None — agents always operate without paperwork",
        "Low if revenue is strong",
        "Only a tax issue",
      ],
      "Opaque agent activity is a classic ABC risk indicator.",
    ),
    mcq(
      "Tone from the top means:",
      "Leaders model integrity and enforce consequences consistently",
      [
        "Posting a policy PDF once a year",
        "Delegating ethics solely to interns",
        "Celebrating wins regardless of how they were achieved",
      ],
      "Culture follows what leaders reward and punish.",
    ),
    tf(
      "You may promise employment to an official's family member to obtain a favourable inspection.",
      false,
      "Preferential employment can be a corrupt inducement.",
    ),
    mcq(
      "Which control reduces procurement corruption risk?",
      "Segregation of duties between requestor, approver, and payer",
      [
        "One person owning end-to-end purchasing in cash",
        "Verbal-only supplier selection",
        "Sharing passwords for ERP approvals",
      ],
      "Segregation of duties is a foundational control.",
    ),
    scenarioQ(
      "A licensing clerk says the queue is long unless you buy 'express stickers' sold only in cash at their desk. You should:",
      "Use only published official fees and channels; refuse desk cash sales",
      [
        "Buy stickers to save time",
        "Buy stickers and reclaim as travel",
        "Ask a contractor to buy them for you",
      ],
      "Unofficial cash 'express' schemes are facilitation payments.",
    ),
    mcq(
      "Hospitality during an active bid evaluation is usually:",
      "Amber or red — heightened risk of improper influence",
      [
        "Always green because it builds relationships",
        "Irrelevant to ABC policy",
        "Mandatory in African markets",
      ],
      "Pending decisions raise the risk profile of any benefit.",
    ),
    tf(
      "Anonymous speak-up channels can still be investigated fairly.",
      true,
      "Anonymity can protect reporters; investigations focus on facts.",
    ),
    mcq(
      "A 'success fee' paid only if a government contract is won should trigger:",
      "Enhanced due diligence and clear contractual ABC warranties",
      [
        "Automatic approval",
        "Payment in cash to avoid banks",
        "No documentation of the fee formula",
      ],
      "Contingent fees around government awards need strong controls.",
    ),
    scenarioQ(
      "Finance notices repeated round-number payments to a new 'consultant' with no deliverables. Next step?",
      "Freeze payments, investigate, and escalate to compliance leadership",
      [
        "Increase the budget line",
        "Ask the consultant to invoice larger amounts less often",
        "Ignore if under materiality thresholds",
      ],
      "Suspicious consulting payments warrant immediate investigation.",
    ),
    mcq(
      "Investor trust is damaged when portfolio companies:",
      "Tolerate bribery as 'how business gets done'",
      [
        "Complete mandatory compliance training",
        "Document gifts transparently",
        "Refuse facilitation payments",
      ],
      "Corruption destroys value and reputation for funds and companies.",
      "easy",
    ),
    tf(
      "If a manager ordered a bribe, junior staff who paid it have no personal exposure.",
      false,
      "Individuals can face consequences even when following improper orders.",
    ),
    mcq(
      "Best practice after receiving a gifts policy question mid-meeting is:",
      "Defer the benefit, check policy/approval, then respond",
      [
        "Accept everything and sort it later",
        "Let the guest decide what is appropriate",
        "Hide the gift in inventory",
      ],
      "Pause and apply policy rather than improvising under pressure.",
    ),
    scenarioQ(
      "A competitor allegedly bribed an official. Your sales lead wants to 'match their approach'. You should:",
      "Refuse; compete on merit; report concerns through proper channels if needed",
      [
        "Match the bribe to stay competitive",
        "Offer a larger bribe",
        "Use an unregistered fixer",
      ],
      "Competitor misconduct never justifies your own bribery.",
    ),
    mcq(
      "Which is a legitimate government fee?",
      "Published tariff paid to an official account with a receipt",
      [
        "Cash to an officer's personal mobile money",
        "Unreceipted desk payment for 'priority'",
        "Payment routed to a relative's company for 'coordination'",
      ],
      "Official, receipted, published fees are legitimate.",
    ),
    tf(
      "ABC risks exist in manufacturing, agribusiness, fintech, and apparel alike.",
      true,
      "Every sector interacting with officials, buyers, or agents faces ABC risk.",
      "easy",
    ),
    mcq(
      "Board / executive oversight of ABC should include:",
      "Metrics on training, incidents, investigations, and third-party risk",
      [
        "Only celebrating revenue growth",
        "Never discussing speak-up themes",
        "Outsourcing all ethics to suppliers",
      ],
      "Governance requires visible monitoring of integrity KPIs.",
    ),
    scenarioQ(
      "An employee reports suspected kickbacks. Two weeks later their bonus is cut without explanation. This may be:",
      "Retaliation — investigate the bonus change and protect the reporter",
      [
        "Normal performance management with no ABC angle",
        "Proof the report was false",
        "A reason to ignore future reports",
      ],
      "Adverse actions after reporting can be retaliation.",
    ),
    mcq(
      "Dual-use invoices (inflated prices with kickback) are:",
      "A common bribery concealment technique",
      [
        "Recommended accounting practice",
        "Only a VAT issue",
        "Acceptable if both parties agree verbally",
      ],
      "Inflated invoices often fund kickbacks.",
    ),
    tf(
      "Completing this course replaces the need for company-specific gifts & hospitality procedures.",
      false,
      "Training complements — does not replace — local policies and approvals.",
    ),
    mcq(
      "The pass mark for this Talanton ABC programme assessment is:",
      "80%",
      ["50%", "60%", "100%"],
      "Learners must score at least 80% on the final assessment.",
      "easy",
    ),
    scenarioQ(
      "You are offered premium match tickets by a vendor one day before you score their RFP. Best action?",
      "Decline and document; continue evaluation on documented criteria only",
      [
        "Accept and disclose after the award",
        "Accept if you sit in a different stand",
        "Transfer the tickets to a friend",
      ],
      "Benefits during evaluation create improper influence risk.",
    ),
    mcq(
      "Which third party often presents elevated ABC risk?",
      "Customs brokers, sales agents, and licence consultants",
      [
        "Independent statutory auditors",
        "Internal payroll clerks with no external remit",
        "Branded merchandise suppliers with fixed catalogues",
      ],
      "Parties who interact with officials on your behalf need scrutiny.",
    ),
    tf(
      "Documenting a declined bribe request strengthens your compliance posture.",
      true,
      "Contemporaneous records support investigations and demonstrate culture.",
    ),
  ];

  return bank.map((q, i) => ({
    ...q,
    sort_order: i + 1,
  }));
}

async function must(label, result) {
  if (result.error) {
    console.error(label, result.error);
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

async function main() {
  console.log("Seeding LMS Anti-Bribery course for", WORKSPACE_SLUG);

  const { data: workspace, error: wsErr } = await sb
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", WORKSPACE_SLUG)
    .maybeSingle();
  if (wsErr) throw wsErr;
  if (!workspace) throw new Error(`Workspace ${WORKSPACE_SLUG} not found`);
  const workspaceId = workspace.id;
  console.log("Workspace", workspaceId);

  const { data: existing } = await sb
    .from("lms_courses")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("slug", COURSE_SLUG)
    .maybeSingle();

  if (existing?.id) {
    console.log("Deleting existing course", existing.id);
    const del = await sb.from("lms_courses").delete().eq("id", existing.id);
    if (del.error) throw del.error;
  }

  const course = await must(
    "insert course",
    await sb
      .from("lms_courses")
      .insert({
        workspace_id: workspaceId,
        code: "TAL-ABC",
        slug: COURSE_SLUG,
        title: "Anti-Bribery & Corruption for Talanton Portfolio Companies",
        description:
          "Interactive compliance programme for CEOs, CFOs, procurement, HR and senior leaders across Talanton's African portfolio. Covers bribery definitions, African business scenarios, gifts & hospitality, procurement integrity, speak-up culture, and a scored final assessment.",
        category: "Ethics & Integrity",
        duration_minutes: 60,
        pass_mark: 80,
        status: "published",
        certificate_prefix: "TAL-ABC",
        sort_order: 1,
        cover_image_url: IMG.boardroom,
      })
      .select("*")
      .single(),
  );

  const moduleDefs = [
    {
      title: "Why Integrity Matters",
      summary:
        "How bribery destroys value for investors, employees, customers and communities — and why Talanton requires zero tolerance.",
      sort_order: 1,
    },
    {
      title: "What Is Bribery?",
      summary:
        "Definitions, facilitation payments, public vs private bribery, and third-party risk.",
      sort_order: 2,
    },
    {
      title: "African Business Scenarios",
      summary:
        "Four realistic scenarios: customs, licensing, hospitality, and family bidding.",
      sort_order: 3,
    },
    {
      title: "Gifts & Hospitality",
      summary: "Sort benefits into green, amber and red zones with policy guidance.",
      sort_order: 4,
    },
    {
      title: "Procurement Integrity",
      summary: "Spot red flags in tenders, agents, and conflicts of interest.",
      sort_order: 5,
    },
    {
      title: "Speaking Up",
      summary: "Whistleblowing pathways, non-retaliation, and leadership responses.",
      sort_order: 6,
    },
    {
      title: "Final Assessment",
      summary: "Draw 20 questions from the bank. Pass mark 80%.",
      sort_order: 7,
    },
  ];

  const modules = [];
  for (const def of moduleDefs) {
    const row = await must(
      `module ${def.sort_order}`,
      await sb
        .from("lms_modules")
        .insert({
          workspace_id: workspaceId,
          course_id: course.id,
          title: def.title,
          summary: def.summary,
          sort_order: def.sort_order,
        })
        .select("*")
        .single(),
    );
    modules.push(row);
  }

  const m = (n) => modules[n - 1];

  const lessons = [
    // Module 1
    {
      module: 1,
      title: "Welcome & purpose",
      lesson_type: "narration",
      estimated_minutes: 4,
      sort_order: 1,
      content: {
        type: "narration",
        title: "Integrity is a growth strategy",
        script:
          "Welcome to Anti-Bribery and Corruption for Talanton Portfolio Companies. You lead businesses that create jobs and impact across Africa. Bribery is not a shortcut — it is a threat to licences, financing, reputation and people. This programme equips you to recognise risk, refuse improper requests, and set a tone that protects your company and Talanton's investment.",
        voiceHint: "calm professional East African English",
        autoplay: false,
        highlights: [
          { t: 0, text: "Welcome leaders across the Talanton portfolio" },
          { t: 12, text: "Bribery threatens licences, capital and trust" },
          { t: 24, text: "Your decisions set the tone from the top" },
        ],
      },
    },
    {
      module: 1,
      title: "Who is affected",
      lesson_type: "infographic",
      estimated_minutes: 3,
      sort_order: 2,
      content: {
        type: "infographic",
        title: "Stakeholder impact of corruption",
        items: [
          {
            id: "investors",
            label: "Investors",
            body: "Hidden liabilities, valuation haircuts, and potential fund-level reputational harm.",
            icon: "trending-down",
          },
          {
            id: "employees",
            label: "Employees",
            body: "Unsafe cultures, unfair promotions, and pressure to break rules.",
            icon: "users",
          },
          {
            id: "customers",
            label: "Customers",
            body: "Higher prices, lower quality, and eroded trust in your brand.",
            icon: "shopping-bag",
          },
          {
            id: "communities",
            label: "Communities",
            body: "Diverted public resources and unfair competition that hurts honest firms.",
            icon: "globe",
          },
        ],
      },
    },
    {
      module: 1,
      title: "Talanton's expectation",
      lesson_type: "rich_text",
      estimated_minutes: 4,
      sort_order: 3,
      content: {
        type: "rich_text",
        title: "Zero tolerance, practical judgement",
        blocks: [
          {
            kind: "heading",
            level: 2,
            text: "What Talanton expects from portfolio leadership",
          },
          {
            kind: "paragraph",
            text: "Every portfolio company must prohibit bribery of public officials and commercial counterparties, ban facilitation payments, keep accurate books, and protect people who speak up in good faith.",
          },
          {
            kind: "bullet_list",
            items: [
              "Leaders model the standard — not exceptions for 'strategic' deals",
              "Third parties acting for you are in scope",
              "Training, approvals and investigations are operational controls, not paperwork theatre",
            ],
          },
          {
            kind: "callout",
            tone: "warning",
            title: "Remember",
            text: "Commercial urgency never legitimises an improper payment.",
          },
        ],
      },
    },
    {
      module: 1,
      title: "African enterprise context",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 4,
      content: {
        type: "image",
        src: IMG.city,
        alt: "Modern African city skyline representing portfolio company markets",
        caption:
          "Growth markets bring opportunity and complexity — integrity is non-negotiable in both.",
        layout: "full",
      },
    },
    {
      module: 1,
      title: "Knowledge check — stakes",
      lesson_type: "knowledge_check",
      estimated_minutes: 2,
      sort_order: 5,
      content: {
        type: "knowledge_check",
        prompt: "Why does Talanton treat ABC as a leadership issue, not only a legal formality?",
        choices: [
          choice("a", "Because integrity protects enterprise value, people and licence to operate"),
          choice("b", "Because only listed companies face bribery risk"),
          choice("c", "Because training alone satisfies all investor covenants"),
          choice("d", "Because facilitation payments are always legal under USD 20"),
        ],
        correctId: "a",
        explanation:
          "ABC failures destroy value and trust. Leadership ownership is essential.",
      },
    },

    // Module 2
    {
      module: 2,
      title: "Core definitions",
      lesson_type: "interactive_cards",
      estimated_minutes: 5,
      sort_order: 1,
      content: {
        type: "interactive_cards",
        intro: "Tap each card to reveal the working definition used in this programme.",
        cards: [
          {
            id: "bribe",
            title: "Bribe",
            summary: "Improper influence",
            body: "Anything of value offered, promised or given to improperly influence a decision or secure an unfair advantage.",
            icon: "banknote",
          },
          {
            id: "facilitation",
            title: "Facilitation payment",
            summary: "Unofficial 'speed' money",
            body: "Small unofficial payments to speed routine government actions. Still prohibited under Talanton policy.",
            icon: "zap",
          },
          {
            id: "kickback",
            title: "Kickback",
            summary: "Return of value",
            body: "A portion of a contract value secretly returned to a decision-maker who steered the award.",
            icon: "repeat",
          },
          {
            id: "agent",
            title: "Third-party risk",
            summary: "Acting on your behalf",
            body: "Agents, brokers and consultants can create liability if they bribe while representing you.",
            icon: "user-cog",
          },
        ],
      },
    },
    {
      module: 2,
      title: "Public and private bribery",
      lesson_type: "rich_text",
      estimated_minutes: 4,
      sort_order: 2,
      content: {
        type: "rich_text",
        blocks: [
          { kind: "heading", level: 2, text: "Not only government" },
          {
            kind: "paragraph",
            text: "Bribing a customs officer is classic public-sector corruption. Paying a buyer at another company for a contract award is commercial bribery — also prohibited.",
          },
          {
            kind: "bullet_list",
            items: [
              "Public officials include regulators, SOE staff, and licensing authorities",
              "Private counterparties include procurement managers and distributors",
              "Benefits include cash, jobs, travel, donations and favours",
            ],
          },
          {
            kind: "callout",
            tone: "info",
            title: "Books & records",
            text: "Off-books funds and false expense descriptions are themselves red flags.",
          },
        ],
      },
    },
    {
      module: 2,
      title: "Meeting rooms & markets",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 3,
      content: {
        type: "image",
        src: IMG.handshake,
        alt: "Business professionals shaking hands in a meeting",
        caption: "Legitimate partnerships are built on transparent terms — not hidden inducements.",
        layout: "card",
      },
    },
    {
      module: 2,
      title: "Knowledge check — facilitation",
      lesson_type: "knowledge_check",
      estimated_minutes: 2,
      sort_order: 4,
      content: {
        type: "knowledge_check",
        prompt: "A clerk asks for USD 30 cash to 'move your file to the top'. This is:",
        choices: [
          choice("a", "A facilitation payment — refuse and use official channels"),
          choice("b", "Always legal if under USD 50"),
          choice("c", "Acceptable if booked as stationery"),
          choice("d", "Required courtesy in all markets"),
        ],
        correctId: "a",
        explanation: "Unofficial speed payments are facilitation payments and are banned.",
      },
    },

    // Module 3 — 4 scenarios
    {
      module: 3,
      title: "Scenario: Customs clearance",
      lesson_type: "scenario",
      estimated_minutes: 4,
      sort_order: 1,
      content: {
        type: "scenario",
        story:
          "Your perishable shipment is held at the port. An officer says it will clear tomorrow if you pay a 'special handling fee' in cash to his mobile money — no receipt.",
        character: {
          name: "Amina",
          role: "Operations Lead",
          imageUrl: IMG.team,
        },
        choices: [
          {
            id: "refuse",
            label: "Refuse, document the request, escalate to compliance and use official escalation",
            correct: true,
            feedback:
              "Correct. Commercial pressure does not justify facilitation payments. Record and escalate.",
          },
          {
            id: "pay",
            label: "Pay cash to protect the goods and expense it as logistics",
            correct: false,
            feedback: "Incorrect. This is an improper unofficial payment.",
          },
          {
            id: "forwarder",
            label: "Ask the freight forwarder to pay so it stays off your books",
            correct: false,
            feedback: "Incorrect. Payments via intermediaries on your behalf still create risk.",
          },
        ],
      },
    },
    {
      module: 3,
      title: "Scenario: Licensing desk",
      lesson_type: "scenario",
      estimated_minutes: 4,
      sort_order: 2,
      content: {
        type: "scenario",
        story:
          "A licensing clerk says the published queue is eight weeks, but 'express stickers' sold only in cash at their desk can cut it to three days while your plant expansion waits.",
        character: { name: "Kwame", role: "Plant Manager" },
        choices: [
          {
            id: "official",
            label: "Pay only published official fees to official accounts with receipts",
            correct: true,
            feedback: "Correct. Stick to transparent, receipted official channels.",
          },
          {
            id: "stickers",
            label: "Buy the stickers to keep the expansion on schedule",
            correct: false,
            feedback: "Incorrect. Desk cash schemes are facilitation payments.",
          },
          {
            id: "contractor",
            label: "Have a contractor buy the stickers so leadership stays insulated",
            correct: false,
            feedback: "Incorrect. You remain responsible for parties acting for you.",
          },
        ],
      },
    },
    {
      module: 3,
      title: "Scenario: Hospitality during renewal",
      lesson_type: "scenario",
      estimated_minutes: 4,
      sort_order: 3,
      content: {
        type: "scenario",
        story:
          "While your operating licence renewal is pending, a ministry contact invites your MD to an all-expenses weekend at a luxury resort 'to deepen the relationship'.",
        character: { name: "Nthabiseng", role: "Managing Director" },
        choices: [
          {
            id: "decline",
            label: "Decline politely, cite policy, and offer a transparent business meeting",
            correct: true,
            feedback: "Correct. Lavish hospitality tied to a pending decision is red-zone risk.",
          },
          {
            id: "accept",
            label: "Accept because the ministry is hosting on its budget",
            correct: false,
            feedback: "Incorrect. Pending decisions make lavish benefits improper regardless of host.",
          },
          {
            id: "junior",
            label: "Send a junior employee instead of the MD",
            correct: false,
            feedback: "Incorrect. Substituting attendees does not fix the conflict.",
          },
        ],
      },
    },
    {
      module: 3,
      title: "Scenario: Family bidding",
      lesson_type: "scenario",
      estimated_minutes: 4,
      sort_order: 4,
      content: {
        type: "scenario",
        story:
          "Your cousin's logistics firm is bidding for a multi-year contract. You sit on the evaluation panel and feel pressure to 'look after family'.",
        character: { name: "Joseph", role: "Procurement Manager" },
        choices: [
          {
            id: "disclose",
            label: "Disclose the relationship, recuse from scoring, and keep a competitive process",
            correct: true,
            feedback: "Correct. Conflicts require disclosure and recusal — not quiet favouritism.",
          },
          {
            id: "award",
            label: "Award them quietly to keep family peace",
            correct: false,
            feedback: "Incorrect. Undisclosed preferential awards are corrupt and unfair.",
          },
          {
            id: "rename",
            label: "Ask them to bid under another company name",
            correct: false,
            feedback: "Incorrect. Concealment aggravates the misconduct.",
          },
        ],
      },
    },
    {
      module: 3,
      title: "Market realities",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 5,
      content: {
        type: "image",
        src: IMG.market,
        alt: "Busy African market street illustrating real operating environments",
        caption: "Real markets include pressure — your response still defines culture.",
        layout: "full",
      },
    },

    // Module 4 — drag_drop gifts
    {
      module: 4,
      title: "Gifts policy overview",
      lesson_type: "rich_text",
      estimated_minutes: 3,
      sort_order: 1,
      content: {
        type: "rich_text",
        title: "Green · Amber · Red",
        blocks: [
          {
            kind: "paragraph",
            text: "Sort every benefit by influence risk. When a decision is pending, treat hospitality as higher risk. Cash and kickbacks are never acceptable.",
          },
          {
            kind: "bullet_list",
            items: [
              "Green: modest, transparent, no pending decision",
              "Amber: needs approval, business purpose, documentation",
              "Red: cash, lavish inducements, anything tied to improper influence",
            ],
          },
        ],
      },
    },
    {
      module: 4,
      title: "Sort gifts into zones",
      lesson_type: "drag_drop",
      estimated_minutes: 6,
      sort_order: 2,
      content: {
        type: "drag_drop",
        prompt: "Drag each item into the correct gifts & hospitality zone.",
        mode: "sort",
        zones: [
          { id: "green", label: "Green — generally acceptable", hint: "Low value, transparent" },
          { id: "amber", label: "Amber — approval required", hint: "Document & pre-approve" },
          { id: "red", label: "Red — prohibited", hint: "Refuse and report" },
        ],
        items: [
          { id: "notebook", label: "Branded company notebook (no tender pending)", correctZoneId: "green" },
          { id: "lunch", label: "Modest working lunch during a site visit", correctZoneId: "green" },
          { id: "conference", label: "Industry conference ticket with pre-approval", correctZoneId: "amber" },
          { id: "dinner", label: "Dinner with a supplier during active bid scoring", correctZoneId: "amber" },
          { id: "cash", label: "Cash 'thank you' after a contract award", correctZoneId: "red" },
          { id: "watch", label: "Luxury watch for a licensing officer", correctZoneId: "red" },
          { id: "safari", label: "All-expenses safari for a tender committee member", correctZoneId: "red" },
          { id: "giftcard", label: "Gift card to a procurement manager mid-RFP", correctZoneId: "red" },
        ],
      },
    },
    {
      module: 4,
      title: "Hospitality in practice",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 3,
      content: {
        type: "image",
        src: IMG.cafe,
        alt: "Professionals meeting over coffee in a business setting",
        caption: "Modest, purpose-linked hospitality can be fine — lavish inducements are not.",
        layout: "split",
      },
    },
    {
      module: 4,
      title: "Knowledge check — red zone",
      lesson_type: "knowledge_check",
      estimated_minutes: 2,
      sort_order: 4,
      content: {
        type: "knowledge_check",
        prompt: "Which item belongs in the red zone?",
        choices: [
          choice("a", "Cash envelope for a customs officer"),
          choice("b", "Branded pen set with no decision pending"),
          choice("c", "Working lunch under policy limits"),
          choice("d", "Approved conference badge"),
        ],
        correctId: "a",
        explanation: "Cash to officials is always prohibited.",
      },
    },

    // Module 5
    {
      module: 5,
      title: "Procurement red flags",
      lesson_type: "interactive_cards",
      estimated_minutes: 5,
      sort_order: 1,
      content: {
        type: "interactive_cards",
        intro: "Learn the patterns that signal procurement integrity failures.",
        cards: [
          {
            id: "single",
            title: "Unjustified single source",
            summary: "No competition",
            body: "Awards without competition or documentation often hide conflicts or kickbacks.",
          },
          {
            id: "agent",
            title: "Opaque agents",
            summary: "No deliverables",
            body: "High commissions for vague 'government relations' work are a classic risk.",
          },
          {
            id: "inflate",
            title: "Inflated invoices",
            summary: "Dual pricing",
            body: "Overstated prices can fund secret kickbacks to decision-makers.",
          },
          {
            id: "pressure",
            title: "Bypass pressure",
            summary: "Skip controls",
            body: "Urgency used to skip due diligence or dual approvals is a warning sign.",
          },
        ],
      },
    },
    {
      module: 5,
      title: "Case study narrative",
      lesson_type: "rich_text",
      estimated_minutes: 4,
      sort_order: 2,
      content: {
        type: "rich_text",
        blocks: [
          { kind: "heading", level: 2, text: "The 'helpful' agent" },
          {
            kind: "paragraph",
            text: "A sales agent offers to secure a municipal supply contract for a 12% success fee, refuses written ABC clauses, and asks to be paid through a personal account. Leadership feels pressure because competitors 'do the same'.",
          },
          {
            kind: "callout",
            tone: "warning",
            title: "Required response",
            text: "Pause. Perform enhanced due diligence. Do not engage without warranties, transparent scope, and banking in the agent's registered name.",
          },
        ],
      },
    },
    {
      module: 5,
      title: "Factory & supply chain",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 3,
      content: {
        type: "image",
        src: IMG.factory,
        alt: "Manufacturing operations representing procurement and supply decisions",
        caption: "Procurement integrity protects quality, cost and compliance across the chain.",
        layout: "full",
      },
    },
    {
      module: 5,
      title: "Policy pack",
      lesson_type: "document",
      estimated_minutes: 3,
      sort_order: 4,
      content: {
        type: "document",
        intro: "Reference materials for procurement and ABC governance (illustrative public sources).",
        files: [
          {
            title: "UN Convention against Corruption (overview PDF)",
            url: "https://www.unodc.org/documents/treaties/UNCAC/Publications/Convention/08-50026_E.pdf",
            mime: "application/pdf",
            sizeLabel: "PDF",
          },
          {
            title: "OECD Anti-Bribery Convention materials",
            url: "https://www.oecd.org/content/dam/oecd/en/publications/reports/2011/11/convention-on-combating-bribery-of-foreign-public-officials-in-international-business-transactions_g1g147db/9789264065659-en.pdf",
            mime: "application/pdf",
            sizeLabel: "PDF",
          },
        ],
      },
    },
    {
      module: 5,
      title: "Knowledge check — agents",
      lesson_type: "knowledge_check",
      estimated_minutes: 2,
      sort_order: 5,
      content: {
        type: "knowledge_check",
        prompt: "An agent refuses to sign an anti-bribery clause. You should:",
        choices: [
          choice("a", "Treat as high risk — pause or exit until resolved"),
          choice("b", "Pay a higher commission instead"),
          choice("c", "Engage them only for government deals"),
          choice("d", "Ignore if they have strong relationships"),
        ],
        correctId: "a",
        explanation: "Refusal to accept ABC terms is a serious third-party red flag.",
      },
    },

    // Module 6
    {
      module: 6,
      title: "Speak-up principles",
      lesson_type: "rich_text",
      estimated_minutes: 3,
      sort_order: 1,
      content: {
        type: "rich_text",
        blocks: [
          {
            kind: "heading",
            level: 2,
            text: "Raise concerns early",
          },
          {
            kind: "paragraph",
            text: "You do not need courtroom proof to speak up. Good-faith concerns about suspected bribery, kickbacks or retaliation should be raised through company channels, compliance, or confidential hotlines where available.",
          },
          {
            kind: "bullet_list",
            items: [
              "No retaliation for good-faith reports",
              "Confidentiality protected to the extent possible",
              "Leaders must take action — not bury issues",
            ],
          },
        ],
      },
    },
    {
      module: 6,
      title: "Branching: a report lands on your desk",
      lesson_type: "branching",
      estimated_minutes: 6,
      sort_order: 2,
      content: {
        type: "branching",
        startId: "start",
        nodes: {
          start: {
            text: "An employee anonymously reports that a supplier is paying kickbacks to a buyer on your team. What do you do first?",
            choices: [
              { label: "Open a confidential investigation and protect the reporter", to: "investigate" },
              { label: "Confront the buyer publicly in the next all-hands", to: "public" },
              { label: "Delete the report to avoid disruption", to: "delete" },
            ],
          },
          investigate: {
            text: "Good. You preserve records and interview carefully. The buyer asks who reported them and demands the person be fired.",
            choices: [
              { label: "Refuse to identify; warn that retaliation is misconduct", to: "protect" },
              { label: "Share the name so the team can 'clear the air'", to: "dox" },
            ],
          },
          public: {
            text: "Public confrontation can destroy confidentiality and chill future reporting.",
            outcome: "bad",
            end: true,
          },
          delete: {
            text: "Destroying a report is serious misconduct and may itself be illegal.",
            outcome: "bad",
            end: true,
          },
          protect: {
            text: "Correct approach. Non-retaliation and fair process protect culture and evidence quality.",
            outcome: "good",
            end: true,
          },
          dox: {
            text: "Revealing a reporter's identity invites retaliation and breaks trust.",
            outcome: "bad",
            end: true,
          },
        },
      },
    },
    {
      module: 6,
      title: "Office culture",
      lesson_type: "image",
      estimated_minutes: 2,
      sort_order: 3,
      content: {
        type: "image",
        src: IMG.office,
        alt: "Open office environment representing speak-up culture at work",
        caption: "Psychological safety is a control — people must be able to raise issues.",
        layout: "card",
      },
    },
    {
      module: 6,
      title: "Embedded policy reference",
      lesson_type: "embedded_pdf",
      estimated_minutes: 3,
      sort_order: 4,
      content: {
        type: "embedded_pdf",
        title: "UNCAC text (reference)",
        url: "https://www.unodc.org/documents/treaties/UNCAC/Publications/Convention/08-50026_E.pdf",
        height: 640,
      },
    },
    {
      module: 6,
      title: "Knowledge check — retaliation",
      lesson_type: "knowledge_check",
      estimated_minutes: 2,
      sort_order: 5,
      content: {
        type: "knowledge_check",
        prompt: "Cutting a reporter's bonus without explanation after a good-faith ABC report may be:",
        choices: [
          choice("a", "Retaliation that must be investigated"),
          choice("b", "Normal and unrelated by definition"),
          choice("c", "Proof the report was false"),
          choice("d", "Required to protect the accused"),
        ],
        correctId: "a",
        explanation: "Adverse actions after reporting can constitute retaliation.",
      },
    },

    // Module 7
    {
      module: 7,
      title: "Assessment briefing",
      lesson_type: "narration",
      estimated_minutes: 2,
      sort_order: 1,
      content: {
        type: "narration",
        title: "Final assessment",
        script:
          "You will receive twenty questions drawn at random from the course bank. You need eighty percent to pass. Take your time, apply the scenarios you practised, and remember: when in doubt, refuse improper payments and escalate.",
        voiceHint: "clear instructional",
        autoplay: false,
      },
    },
    {
      module: 7,
      title: "Final assessment",
      lesson_type: "assessment",
      estimated_minutes: 20,
      sort_order: 2,
      content: {
        type: "assessment",
        drawCount: 20,
        passMark: 80,
        questionBankScope: "course",
      },
    },
  ];

  let lessonCount = 0;
  for (const lesson of lessons) {
    await must(
      `lesson ${lesson.title}`,
      await sb.from("lms_lessons").insert({
        workspace_id: workspaceId,
        course_id: course.id,
        module_id: m(lesson.module).id,
        title: lesson.title,
        lesson_type: lesson.lesson_type,
        content: lesson.content,
        sort_order: lesson.sort_order,
        estimated_minutes: lesson.estimated_minutes,
      }),
    );
    lessonCount += 1;
  }

  const bank = buildQuestionBank();
  const questionRows = bank.map((q) => ({
    workspace_id: workspaceId,
    course_id: course.id,
    module_id: null,
    question_type: q.question_type,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct_choice_id,
    explanation: q.explanation,
    difficulty: q.difficulty,
    sort_order: q.sort_order,
  }));

  // Insert in chunks for reliability
  const chunkSize = 25;
  for (let i = 0; i < questionRows.length; i += chunkSize) {
    const chunk = questionRows.slice(i, i + chunkSize);
    await must(`questions ${i}`, await sb.from("lms_questions").insert(chunk));
  }

  const assignmentRows = CLIENT_IDS.map((clientId) => ({
    workspace_id: workspaceId,
    course_id: course.id,
    client_id: clientId,
    user_id: null,
    mandatory: true,
    due_at: null,
  }));
  await must("assignments", await sb.from("lms_assignments").insert(assignmentRows));

  const { data: demoUser, error: userErr } = await sb
    .from("platform_users")
    .select("id, username, display_name")
    .eq("username", DEMO_USERNAME)
    .maybeSingle();
  if (userErr) throw userErr;

  let enrolmentId = null;
  if (demoUser?.id) {
    const enrolment = await must(
      "enrolment",
      await sb
        .from("lms_enrolments")
        .upsert(
          {
            workspace_id: workspaceId,
            course_id: course.id,
            user_id: demoUser.id,
            client_id: "ti-cli-ethical-apparel-africa",
            status: "assigned",
            progress_pct: 0,
            lesson_state: {},
            time_spent_seconds: 0,
          },
          { onConflict: "workspace_id,course_id,user_id" },
        )
        .select("id")
        .single(),
    );
    enrolmentId = enrolment.id;
  } else {
    console.warn(`Demo user ${DEMO_USERNAME} not found — enrolment skipped`);
  }

  console.log(
    JSON.stringify(
      {
        courseId: course.id,
        courseSlug: course.slug,
        lessonCount,
        questionCount: bank.length,
        assignmentCount: CLIENT_IDS.length,
        moduleCount: modules.length,
        enrolmentId,
        demoUserFound: Boolean(demoUser?.id),
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
