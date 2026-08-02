/**
 * Seed ABHI LMS catalog with full playable demo course packs.
 * - Clones Anti-Bribery from talantonimpact → abhi (if present), rewrites for ABHI HealthTech
 * - Builds full packs for the remaining 10 programme courses
 * - Seeds demo staff enrolments with mixed progress states
 *
 * Hard-refuses non-abhi targets.
 *
 *   node scripts/seed-abhi-lms-catalog.mjs
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
  console.error("Missing valid SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const TARGET_SLUG = "abhi";
const SOURCE_SLUG = "talantonimpact";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

const ABHI_CTX =
  "Association of British Healthtech Industries (ABHI) — the UK's medtech trade association representing member companies, NHS engagement, international trade missions, the UK Pavilion, and working groups.";

const IMG = {
  conference:
    "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=80",
  medtech:
    "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1600&q=80",
  nhs:
    "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1600&q=80",
  pavilion:
    "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=1600&q=80",
  office:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80",
  hospitality:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1600&q=80",
};

const COURSES = [
  {
    slug: "anti-bribery",
    title: "Anti-Bribery & Corruption",
    category: "Ethics & Integrity",
    durationMinutes: 45,
    cloneFull: true,
  },
  { slug: "aml", title: "AML", category: "Financial Crime", durationMinutes: 40 },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    category: "Ethics & Integrity",
    durationMinutes: 35,
  },
  {
    slug: "conflicts-of-interest",
    title: "Conflicts of Interest",
    category: "Ethics & Integrity",
    durationMinutes: 30,
  },
  {
    slug: "information-security",
    title: "Information Security",
    category: "Cyber & Privacy",
    durationMinutes: 50,
  },
  {
    slug: "whistleblowing",
    title: "Whistleblowing",
    category: "Ethics & Integrity",
    durationMinutes: 25,
  },
  { slug: "dei", title: "DEI", category: "People & Culture", durationMinutes: 40 },
  {
    slug: "harassment-prevention",
    title: "Harassment Prevention",
    category: "People & Culture",
    durationMinutes: 35,
  },
  {
    slug: "procurement-gifts-hospitality",
    title: "Procurement / Gifts & Hospitality",
    category: "Procurement",
    durationMinutes: 30,
  },
  {
    slug: "health-and-safety",
    title: "Health & Safety",
    category: "Operations",
    durationMinutes: 45,
  },
  {
    slug: "modern-slavery",
    title: "Modern Slavery",
    category: "Human Rights",
    durationMinutes: 40,
  },
];

function choice(id, label) {
  return { id, label };
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

function scenarioQ(stem, correct, wrongs, explanation, difficulty = "hard") {
  return { ...mcq(stem, correct, wrongs, explanation, difficulty), question_type: "scenario" };
}

function rt(blocks) {
  return { type: "rich_text", blocks };
}

function kc(prompt, correct, wrongs, explanation) {
  return {
    type: "knowledge_check",
    prompt,
    choices: [
      choice("a", correct),
      ...wrongs.map((w, i) => choice(String.fromCharCode(98 + i), w)),
    ],
    correctId: "a",
    explanation,
  };
}

/** Per-course ABHI HealthTech pack definitions */
const COURSE_PACKS = {
  aml: {
    description:
      "Anti-money laundering awareness for ABHI staff handling member subscriptions, event sponsorship, international trade missions, and third-party payments.",
    intro: rt([
      { kind: "heading", level: 2, text: "AML in a trade association context" },
      {
        kind: "paragraph",
        text: `${ABHI_CTX} Staff must recognise when payments, sponsorships, or member arrangements could disguise illicit funds or benefit undisclosed third parties.`,
      },
      {
        kind: "bullet_list",
        items: [
          "Verify member and sponsor identity before large or unusual payments",
          "Escalate cash, crypto, or structured payments that bypass normal invoicing",
          "Apply enhanced due diligence for high-risk jurisdictions linked to UK Pavilion missions",
        ],
      },
      {
        kind: "callout",
        tone: "warning",
        title: "ABHI policy",
        text: "Report suspicious activity to the CEO and compliance lead — do not tip off the counterparty.",
      },
    ]),
    introKc: kc(
      "A new member company offers to pay five years' membership upfront in cash at a WHX reception. Best first step?",
      "Decline cash, request standard invoicing, and complete AML/sanctions checks before accepting",
      [
        "Accept cash to secure the membership quickly",
        "Ask a colleague to hold the cash overnight",
        "Invoice after the event without identity checks",
      ],
      "Trade shows are high-touch environments — stick to approved payment channels and due diligence.",
    ),
    scenario: {
      story:
        "During Medica, a delegate at the UK Pavilion offers ABHI a 'consultancy fee' to fast-track their company onto a working group shortlist. They suggest wiring funds to a personal account abroad.",
      character: { name: "Sarah", role: "International Trade Manager", imageUrl: IMG.pavilion },
      choices: [
        {
          id: "refuse",
          label: "Refuse, document the approach, and escalate to compliance",
          correct: true,
          feedback: "Correct. Working group placement must never be sold or influenced by improper payments.",
        },
        {
          id: "accept",
          label: "Accept if the funds go to a member charity",
          correct: false,
          feedback: "Incorrect. Disguised payments still create AML and bribery risk.",
        },
        {
          id: "delay",
          label: "Delay response until after the trade show",
          correct: false,
          feedback: "Incorrect. Document and escalate promptly.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Red flags at member events" },
      {
        kind: "paragraph",
        text: "At NHS partnership forums and ABHI working groups, watch for: requests to split invoices, refusal to provide UBO details, or sponsors who insist on confidentiality from finance.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Practical tip",
        text: "Use the standard member onboarding checklist before any preferential listing or pavilion slot is confirmed.",
      },
    ]),
    questions: [
      mcq(
        "Which ABHI activity most often triggers enhanced due diligence?",
        "New international member or sponsor with complex ownership and urgent pavilion placement",
        ["Routine UK SME renewing annual membership", "Internal staff expenses under £25", "Publishing a press release"],
        "Cross-border members, sponsors, and agents need stronger checks than routine renewals.",
        "easy",
      ),
      mcq(
        "Structuring payments means:",
        "Splitting transactions to avoid reporting thresholds",
        ["Paying invoices on time", "Using multiple currencies for FX efficiency", "Grouping member renewals quarterly"],
        "Structuring is a classic AML red flag.",
      ),
      scenarioQ(
        "A member asks ABHI to refund sponsorship to a different company not on the contract. You should:",
        "Refuse and require refund to the original payer after verification",
        ["Process quickly to maintain the relationship", "Send to the CEO's personal account", "Ignore the email"],
        "Refunds to unrelated parties can facilitate layering.",
      ),
      mcq(
        "Politically exposed persons (PEPs) in ABHI's context may include:",
        "Senior NHS officials or ministers engaging in paid advisory roles with members",
        ["Only foreign heads of state", "Any clinician using ABHI resources", "Volunteer patient advocates"],
        "NHS and government engagement makes PEP screening relevant.",
      ),
      scenarioQ(
        "Sanctions screening flags a potential match on a MedTech Week exhibitor. Next step?",
        "Pause onboarding, gather evidence, escalate — do not proceed until cleared",
        ["Approve because the stand is already built", "Ask the member to self-certify", "Delete the screening result"],
        "Never bypass sanctions hits without formal clearance.",
      ),
      mcq(
        "Best record-keeping practice for ABHI finance teams:",
        "Retain KYC, contracts, and payment trails aligned to member/sponsor IDs",
        ["Keep only email threads", "Store cash receipts in desk drawers", "Discard checks after 30 days"],
        "Audit trails protect ABHI and members.",
      ),
    ],
  },

  "code-of-conduct": {
    description:
      "Expected behaviours for ABHI staff representing the association with member companies, NHS stakeholders, and at international trade events.",
    intro: rt([
      { kind: "heading", level: 2, text: "How ABHI staff show up" },
      {
        kind: "paragraph",
        text: "You represent 300+ healthtech members and the UK sector globally. The Code covers integrity, respect, confidentiality, and responsible use of ABHI resources at HQ, member visits, and the UK Pavilion.",
      },
      {
        kind: "bullet_list",
        items: [
          "Act in ABHI's interests, not personal or member-company gain",
          "Treat members, NHS partners, and colleagues with respect",
          "Protect confidential member and policy information",
        ],
      },
    ]),
    introKc: kc(
      "You are offered free VIP tickets to a luxury box by a member while ABHI is reviewing their grant application. What aligns with the Code?",
      "Decline or disclose and recuse per conflicts policy; never accept undue influence",
      ["Accept — it's hospitality not a bribe", "Accept but don't tell your manager", "Sell the tickets for charity"],
      "Even generous hospitality can compromise perceived fairness.",
    ),
    scenario: {
      story:
        "On LinkedIn you criticise a member CEO using your ABHI job title after a difficult working group meeting. The post is gaining traction among members.",
      character: { name: "James", role: "Policy Lead", imageUrl: IMG.office },
      choices: [
        {
          id: "delete",
          label: "Delete the post, apologise, and follow social media guidance",
          correct: true,
          feedback: "Correct. Personal attacks using ABHI's brand breach the Code.",
        },
        {
          id: "double",
          label: "Double down — it's your personal opinion",
          correct: false,
          feedback: "Incorrect. Role and association visibility matter.",
        },
        {
          id: "ignore",
          label: "Ignore member complaints",
          correct: false,
          feedback: "Incorrect. Reputational harm affects all members.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "At WHX and Medica" },
      {
        kind: "paragraph",
        text: "Staff must wear ABHI credentials honestly, avoid favouritism in pavilion briefings, and never promise NHS access or regulatory outcomes members cannot rely on.",
      },
    ]),
    questions: [
      mcq("ABHI resources (data, contacts, brand) should be used:", "Only for legitimate ABHI business", ["For side consulting if unpaid", "For a friend's startup", "For political campaigning"], "Misuse of resources violates the Code."),
      mcq("Confidential member information shared at a working group:", "Stays confidential unless publicly released by ABHI process", ["Can be tweeted if interesting", "Belongs to whoever notes it", "Expires after 24 hours"], "Working group trust underpins ABHI value."),
      scenarioQ("You discover a colleague falsifying event attendance records for a grant report. You should:", "Report via whistleblowing channels promptly", ["Help fix the numbers", "Wait until annual review", "Tell the member company first"], "Integrity reporting is protected."),
      mcq("Acceptable social media conduct for ABHI staff:", "Professional tone; clear when speaking personally vs officially", ["Anonymous attacks on competitors", "Sharing draft policy leaks for transparency", "Live-streaming confidential NHS meetings"], "Brand and trust are collective assets."),
      scenarioQ("A member asks you to backdate a letter of support. Best response?", "Refuse — provide only accurate, authorised documents", ["Backdate if the substance is true", "Ask the CEO to sign instead", "Ignore the request"], "Document integrity is non-negotiable."),
      mcq("When representing ABHI overseas:", "Follow travel, gifts, and anti-bribery policies", ["Adapt to local 'custom' payments", "Skip disclosures to move faster", "Use personal email for speed"], "UK standards apply to ABHI missions."),
    ],
  },

  "conflicts-of-interest": {
    description:
      "Identifying and managing conflicts when ABHI staff, board members, or working group chairs have ties to member companies or NHS bodies.",
    intro: rt([
      { kind: "heading", level: 2, text: "Conflicts in a member-led association" },
      {
        kind: "paragraph",
        text: "ABHI staff and volunteers may hold shares, advisory roles, or family ties to member companies. Transparency protects programme fairness — from pavilion allocation to policy consultations.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Declare early",
        text: "Complete the ABHI interests register before joining procurement panels, working groups, or member selection processes.",
      },
    ]),
    introKc: kc(
      "You own shares in a member company applying for a UK Pavilion prime slot. What should you do?",
      "Declare the interest and recuse from decisions affecting that member",
      ["Vote but abstain from speaking", "Hide the holding — it's small", "Sell shares during the event only"],
      "Even small holdings can create perceived bias.",
    ),
    scenario: {
      story:
        "You chair the Digital Health working group. Your sibling was recently hired as sales director at a member submitting a position paper you will grade.",
      character: { name: "Helen", role: "Working Group Chair", imageUrl: IMG.medtech },
      choices: [
        {
          id: "recuse",
          label: "Declare, hand chair duties to a neutral colleague for that item",
          correct: true,
          feedback: "Correct. Family employment is a disclosable conflict.",
        },
        {
          id: "stay",
          label: "Stay chair — you can be objective",
          correct: false,
          feedback: "Incorrect. Perception matters in member forums.",
        },
        {
          id: "favour",
          label: "Give extra feedback privately to help them",
          correct: false,
          feedback: "Incorrect. Preferential treatment breaches policy.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "NHS secondments and advisory roles" },
      {
        kind: "paragraph",
        text: "Staff moving between NHS and ABHI roles, or advising member boards, must clear arrangements with HR and the CEO to avoid dual loyalty in procurement or policy work.",
      },
    ]),
    questions: [
      mcq("A 'perceived conflict' occurs when:", "A reasonable observer might doubt your impartiality", ["You feel stressed", "Two members disagree", "An invoice is late"], "Perception drives trust in ABHI governance."),
      scenarioQ("Board member also consults for a member bidding for ABHI sponsorship tiers. Action?", "Disclose; abstain from sponsorship pricing votes", ["No issue if disclosed after award", "Consulting is personal time", "Resign from ABHI immediately always"], "Board conflicts need active management."),
      mcq("Gifts from members during a tender for event services:", "Declined or declared per gifts policy", ["Accepted if under £100", "Accepted if shared with team", "Always acceptable at trade shows"], "Procurement integrity applies to ABHI spend."),
      scenarioQ("You learn a working group peer failed to declare a member board seat. You should:", "Prompt them to declare and notify the secretariat", ["Expose them publicly on social media", "Use it for negotiation", "Ignore it"], "Fix governance issues through proper channels."),
      mcq("Recusal means:", "Not participating in discussion or decision on the affected matter", ["Attending but not voting", "Voting present only", "Reading papers silently"], "Full recusal prevents improper influence."),
      mcq("Annual interest declarations at ABHI should be:", "Updated when circumstances change, not only once a year", ["Optional for junior staff", "Submitted after decisions", "Verbal only"], "Ongoing disclosure keeps registers accurate."),
    ],
  },

  "information-security": {
    description:
      "Protecting member data, NHS engagement materials, event systems, and ABHI intellectual property across HQ and travel.",
    intro: rt([
      { kind: "heading", level: 2, text: "Security for a data-rich trade body" },
      {
        kind: "paragraph",
        text: "ABHI holds member CRM records, NHS correspondence, pavilion plans, and financial data. Breaches harm members and UK sector reputation.",
      },
      {
        kind: "bullet_list",
        items: [
          "Use ABHI-managed devices and MFA on all accounts",
          "Classify documents: public, member-confidential, restricted",
          "Report phishing attempts — especially around Medica/WHX season",
        ],
      },
    ]),
    introKc: kc(
      "You receive a 'NHS contract' PDF from an unknown sender before an ABHI NHS forum. Best action?",
      "Do not open — report to IT and verify through known NHS contacts",
      ["Open on your phone quickly", "Forward to all members", "Reply with member list attached"],
      "Spear-phishing spikes before high-profile ABHI events.",
    ),
    scenario: {
      story:
        "At a conference hotel you join the free Wi‑Fi to download a confidential member export. A shoulder-surfer appears to be watching your screen.",
      character: { name: "Alex", role: "Membership Manager", imageUrl: IMG.conference },
      choices: [
        {
          id: "stop",
          label: "Stop work, use VPN/secure hotspot, move to private area",
          correct: true,
          feedback: "Correct. Public Wi‑Fi and shoulder surfing are real risks.",
        },
        {
          id: "continue",
          label: "Continue — the file is almost downloaded",
          correct: false,
          feedback: "Incorrect. Member exports require secure environments.",
        },
        {
          id: "usb",
          label: "Ask the stranger to watch your laptop while you coffee-run",
          correct: false,
          feedback: "Incorrect. Never leave devices unattended with open data.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Member portal & working group files" },
      {
        kind: "paragraph",
        text: "Share working group packs only via approved ABHI channels. Do not sync confidential folders to personal cloud drives or member Slack workspaces without DPA review.",
      },
    ]),
    questions: [
      mcq("Strong passwords at ABHI should be:", "Unique, long, stored in the approved password manager", ["Reused across tools for memory", "Shared in Teams for cover", "Changed only if breached"], "Credential reuse is a top attack vector."),
      scenarioQ("A member asks for another member's unreleased financials from CRM. You:", "Verify authority and follow data-sharing rules — usually refuse", ["Send if they're also a member", "Export entire CRM", "Ask the CEO verbally only"], "Member data isn't automatically mutual."),
      mcq("MFA (multi-factor authentication) on ABHI accounts:", "Required — reduces account takeover risk", ["Optional for senior staff", "Only for finance", "Disabled on mobile"], "MFA protects NHS and member correspondence."),
      mcq("Lost ABHI laptop at an airport during UK Pavilion travel:", "Report immediately — remote wipe initiated", ["Wait until back in UK", "Buy a replacement quietly", "Assume it will turn up"], "Speed limits data exposure."),
      scenarioQ("USB stick found in the WHX ABHI stand kitchen. You should:", "Hand to IT — do not plug into any ABHI device", ["Plug in to see owner", "Give to first visitor", "Throw away"], "Unknown USBs may contain malware."),
      mcq("Classification 'restricted' at ABHI typically includes:", "Unreleased policy drafts and sensitive NHS negotiations", ["Published press releases", "Public event agenda", "ABHI website copy"], "Restricted data needs tight access control."),
    ],
  },

  whistleblowing: {
    description:
      "How ABHI staff and contractors can raise concerns about misconduct, fraud, or retaliation — safely and in good faith.",
    intro: rt([
      { kind: "heading", level: 2, text: "Speaking up protects members and staff" },
      {
        kind: "paragraph",
        text: "Concerns may involve financial misconduct, bullying at events, misuse of member funds, or pressure to bend pavilion rules. ABHI prohibits retaliation against good-faith reporters.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "Routes",
        text: "Line manager → CEO → designated trustee / external hotline where configured.",
      },
    ]),
    introKc: kc(
      "You suspect a colleague is invoicing fake WHX contractors. What is the best first step?",
      "Raise via whistleblowing process with facts — do not confront alone",
      ["Post anonymously on member forum", "Ignore — not your department", "Tell the suspected colleague to stop"],
      "Structured reporting preserves evidence and protection.",
    ),
    scenario: {
      story:
        "After you flagged irregular sponsor credits, your manager excludes you from UK Pavilion planning emails and suggests you 'find another role'.",
      character: { name: "Priya", role: "Events Coordinator", imageUrl: IMG.pavilion },
      choices: [
        {
          id: "escalate",
          label: "Document incidents and escalate as potential retaliation",
          correct: true,
          feedback: "Correct. Adverse treatment after reporting is serious.",
        },
        {
          id: "quit",
          label: "Resign immediately without records",
          correct: false,
          feedback: "Incorrect. Documentation and escalation protect you and ABHI.",
        },
        {
          id: "retaliate",
          label: "Leak member data to press",
          correct: false,
          feedback: "Incorrect. Unlawful disclosure creates new violations.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Good faith vs malicious complaints" },
      {
        kind: "paragraph",
        text: "You need not be certain — reasonable belief is enough to report. Malicious false accusations may be disciplinary, but mistakes in good faith are not punished.",
      },
    ]),
    questions: [
      mcq("Whistleblowing at ABHI protects:", "Good-faith reporters raising genuine concerns", ["Only board members", "Only finance staff", "People who leak to competitors"], "Protection encourages early detection."),
      scenarioQ("You witness a senior leader accepting undeclared hospitality from a member during NHS week. You should:", "Report via whistleblowing channels with details", ["Confront publicly at the reception", "Accept similar gifts to balance", "Delete calendar entries"], "Escalate — don't self-investigate alone."),
      mcq("Retaliation includes:", "Demotion, isolation, or punitive schedule changes after a report", ["Normal performance management", "Unrelated training assignments", "Office desk moves for ergonomics"], "Link to reporting makes it retaliation."),
      mcq("External disclosure may be appropriate when:", "Internal channels failed and serious harm/risk persists — seek advice", ["You want media attention", "You disagree with policy", "A member complained"], "External routes have legal thresholds."),
      scenarioQ("A contractor on the Medica build asks you to stay quiet about unsafe wiring. You:", "Report via ABHI H&S and whistleblowing routes", ["Stay quiet — not ABHI staff problem", "Fix it yourself anonymously", "Film and post online only"], "Safety issues require formal escalation."),
    ],
  },

  dei: {
    description:
      "Building inclusive ABHI programmes, events, and member engagement — from HQ hiring to UK Pavilion representation.",
    intro: rt([
      { kind: "heading", level: 2, text: "Inclusive healthtech leadership" },
      {
        kind: "paragraph",
        text: "ABHI's DEI commitment spans hiring, speaker panels at WHX, working group participation, and supporting members to broaden leadership pipelines in UK medtech.",
      },
      {
        kind: "bullet_list",
        items: [
          "Design events accessible to disabled delegates and carers",
          "Seek diverse panels — avoid all-male NHS keynotes",
          "Challenge stereotypes about who 'looks like' a founder",
        ],
      },
    ]),
    introKc: kc(
      "Planning a UK Pavilion panel, you notice all confirmed speakers are from one demographic. Best response?",
      "Pause and broaden outreach before publishing the lineup",
      ["Proceed — quality matters most", "Add one token speaker at the end", "Cancel the panel"],
      "Inclusive design requires intentional outreach early.",
    ),
    scenario: {
      story:
        "A member jokes about a colleague's accent during an ABHI working group Teams call. Others laugh nervously.",
      character: { name: "Mo", role: "Working Group Secretariat", imageUrl: IMG.office },
      choices: [
        {
          id: "interrupt",
          label: "Interrupt politely, restate inclusion norms, follow up privately",
          correct: true,
          feedback: "Correct. Microaggressions undermine participation.",
        },
        {
          id: "laugh",
          label: "Laugh along to keep momentum",
          correct: false,
          feedback: "Incorrect. Silence signals acceptance.",
        },
        {
          id: "ignore",
          label: "Ignore — not a formal HR issue",
          correct: false,
          feedback: "Incorrect. ABHI sets tone in member forums.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Member company support" },
      {
        kind: "paragraph",
        text: "When mentoring SMEs for NHS adoption, avoid assuming London-centric networks — promote regional innovators and diverse clinical voices in case studies.",
      },
    ]),
    questions: [
      mcq("Unconscious bias at ABHI events might look like:", "Always picking the same senior men for panels", ["Using simultaneous translation", "Offering wheelchair access", "Publishing code of conduct"], "Pattern selection excludes talent."),
      mcq("Reasonable adjustments for staff may include:", "Flexible hours, assistive tech, quiet rooms at conferences", ["Lower performance standards permanently", "Exemption from all travel", "Public disclosure of medical records"], "Adjustments enable equal participation."),
      scenarioQ("A member requests ABHI only promote 'traditional' leadership photos. You:", "Decline — ABHI showcases diverse UK healthtech", ["Agree to avoid conflict", "Remove all people from marketing", "Charge extra fees"], "DEI is part of ABHI's public mission."),
      mcq("Inclusive language in ABHI communications:", "Uses person-first terms unless individuals prefer otherwise", ["Avoids mentioning disability ever", "Mirrors outdated member style guides", "Is optional for working groups"], "Respectful language evolves — ask when unsure."),
      scenarioQ("You hear a subcontractor use slurs at WHX build. Action?", "Stop work if needed, report to ABHI HR/events lead", ["Wait until show ends", "Join the conversation", "Film for social media"], "Zero tolerance at ABHI events."),
    ],
  },

  "harassment-prevention": {
    description:
      "Preventing harassment and bullying at ABHI HQ, member meetings, and international trade shows including WHX and Medica.",
    intro: rt([
      { kind: "heading", level: 2, text: "Safe spaces at ABHI events" },
      {
        kind: "paragraph",
        text: "High-pressure trade shows, evening receptions, and working group debates can blur boundaries. ABHI expects professional conduct and clear escalation routes.",
      },
      {
        kind: "callout",
        tone: "warning",
        title: "Zero tolerance",
        text: "Sexual harassment, bullying, and intimidation lead to disciplinary action and removal from events.",
      },
    ]),
    introKc: kc(
      "A delegate at the UK Pavilion reception repeatedly asks a junior ABHI staffer for personal drinks after they said no. This is:",
      "Harassment — intervene and report",
      ["Normal networking persistence", "A cultural misunderstanding only", "The staffer's problem to handle alone"],
      "Repeated unwanted advances are harassment.",
    ),
    scenario: {
      story:
        "During Medica setup, a member company's contractor makes lewd comments about ABHI staff on the stand. The member CEO is nearby but silent.",
      character: { name: "Lisa", role: "Events Director", imageUrl: IMG.conference },
      choices: [
        {
          id: "act",
          label: "Stop the behaviour, document, notify member CEO and ABHI HR",
          correct: true,
          feedback: "Correct. ABHI controls pavilion conduct standards.",
        },
        {
          id: "tolerate",
          label: "Tolerate until the show opens",
          correct: false,
          feedback: "Incorrect. Immediate action protects staff.",
        },
        {
          id: "ban",
          label: "Publicly ban the entire member company without process",
          correct: false,
          feedback: "Incorrect. Act firmly but follow ABHI procedures.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Virtual harassment" },
      {
        kind: "paragraph",
        text: "Inappropriate DMs after virtual NHS briefings, or hostile chat during hybrid working groups, are in scope — save evidence and report.",
      },
    ]),
    questions: [
      mcq("Harassment under ABHI policy includes:", "Unwanted conduct related to protected characteristics or power abuse", ["Single polite compliment", "Constructive feedback", "Disagreement on policy"], "Severity and context matter — patterns count."),
      scenarioQ("A member sends late-night personal messages to an ABHI intern. The intern is unsure. You advise:", "Document, report HR, support intern — do not minimise", ["Ignore unless physical", "Tell intern to block silently only", "Warn member privately once only"], "Power imbalance requires active support."),
      mcq("Bystander intervention at ABHI receptions can be:", "Direct ('stop'), delegate (manager/security), or distract", ["Always physical confrontation", "Never — stay neutral", "Only HR's job"], "Safe intervention options exist."),
      mcq("After a harassment report at WHX:", "Separate parties if needed, preserve evidence, investigate promptly", ["Wait until return to UK", "Force public apology only", "Auto-fire without hearing"], "Fair process protects all parties."),
      scenarioQ("Banter that targets someone's religion at a working group lunch:", "Challenge it — may be harassment", ["Always harmless", "Allowed if joking", "Only HR offsite issue"], "Religion is a protected characteristic."),
      mcq("ABHI's event code of conduct should be:", "Communicated to staff, members, and contractors pre-event", ["Verbal only on day one", "For staff not members", "Optional at Medica"], "Clear rules prevent harm."),
    ],
  },

  "procurement-gifts-hospitality": {
    description:
      "Gifts, hospitality, and procurement integrity when ABHI deals with venues, suppliers, members, and NHS partners.",
    intro: rt([
      { kind: "heading", level: 2, text: "Gifts at the association–member boundary" },
      {
        kind: "paragraph",
        text: "ABHI procures pavilion builds, AV, travel, and consultancy. Members offer hospitality at WHX. NHS contacts may invite staff to advisory dinners. Know the green, amber, and red zones.",
      },
      {
        kind: "bullet_list",
        items: [
          "Green: modest branded items, working lunches with agenda",
          "Amber: declare before acceptance — tickets, travel upgrades",
          "Red: cash, luxury gifts, hospitality during active tenders",
        ],
      },
    ]),
    introKc: kc(
      "A WHX stand builder offers free holidays if ABHI skips the competitive tender. You should:",
      "Decline, document, and run the proper procurement process",
      ["Accept — saves ABHI money", "Take holiday but tender anyway", "Ask member to pay instead"],
      "Inducements corrupt procurement outcomes.",
    ),
    scenario: {
      story:
        "During an NHS engagement week, a member invites you to Wimbledon corporate hospitality the same week ABHI will announce shortlist grants they applied for.",
      character: { name: "Tom", role: "NHS Partnerships Manager", imageUrl: IMG.hospitality },
      choices: [
        {
          id: "decline",
          label: "Decline or seek CEO approval with declaration and recusal",
          correct: true,
          feedback: "Correct. Timing creates apparent influence.",
        },
        {
          id: "attend",
          label: "Attend — it's industry networking",
          correct: false,
          feedback: "Incorrect. Active decisions plus luxury hospitality = red zone.",
        },
        {
          id: "invoice",
          label: "Attend if member invoices ABHI later",
          correct: false,
          feedback: "Incorrect. Disguised hospitality still counts.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Member company procurement" },
      {
        kind: "paragraph",
        text: "When ABHI recommends suppliers to members, disclose commissions or referral fees. Never steer members to vendors giving personal kickbacks.",
      },
    ]),
    questions: [
      mcq("ABHI staff should log gifts/hospitality:", "In the central register within 5 working days", ["Only if over £500", "Never if eaten on site", "Only at year end"], "Transparency is the control."),
      scenarioQ("A member sends ABHI branded pens worth £15 to all staff during a policy consultation. Likely:", "Green/low risk — but still log if policy requires all gifts", ["Always bribery", "Must be returned individually", "Ignore completely"], "Low value branded items are often acceptable — check policy."),
      mcq("Procurement red flags include:", "Single-bid justification without market test", ["Three written quotes", "Published evaluation criteria", "Contract post-mortem"], "Competition protects member subs."),
      scenarioQ("NHS contact offers ABHI free conference space if a member product is highlighted. You:", "Decline undue influence — follow partnership governance", ["Accept — benefits members", "Swap member weekly", "Charge NHS admin fee only"], "NHS integrity matters to ABHI credibility."),
      mcq("Hospitality during active supplier negotiations:", "Generally prohibited or requires prior approval", ["Encouraged to build trust", "Allowed under £200", "Allowed if off-site"], "Timing drives risk."),
      scenarioQ("You find a colleague's expense claim listing 'client dinner' that was a luxury member yacht day. You:", "Report via compliance — misclassification is misconduct", ["Approve to avoid conflict", "Ask for invitation next time", "Delete receipt"], "False descriptions hide improper benefits."),
    ],
  },

  "health-and-safety": {
    description:
      "Keeping ABHI staff, contractors, and visitors safe at HQ, member site visits, and major trade shows.",
    intro: rt([
      { kind: "heading", level: 2, text: "Safety across ABHI operations" },
      {
        kind: "paragraph",
        text: "From pavilion rigging at WHX to office ergonomics and lone travel to member factories — ABHI must assess risks and train staff.",
      },
      {
        kind: "bullet_list",
        items: [
          "Complete event risk assessments before build/open",
          "Report near-misses on stand construction",
          "Follow member site PPE rules during visits",
        ],
      },
    ]),
    introKc: kc(
      "A contractor is drilling on the UK Pavilion without eye protection. Your first action?",
      "Stop work, enforce PPE, notify events lead",
      ["Film for social media", "Ignore — contractor's employer liable only", "Move staff away silently"],
      "ABHI duty of care covers contractors on ABHI-managed stands.",
    ),
    scenario: {
      story:
        "During a late Medica build, scaffolding looks unstable and the hall is quiet. The contractor says they'll 'fix it in the morning'.",
      character: { name: "Dan", role: "Operations Manager", imageUrl: IMG.pavilion },
      choices: [
        {
          id: "stop",
          label: "Stop work, bar access, escalate to venue safety officer",
          correct: true,
          feedback: "Correct. Unstable scaffolding is an immediate hazard.",
        },
        {
          id: "morning",
          label: "Accept fix in morning — deadline pressure",
          correct: false,
          feedback: "Incorrect. Never trade safety for schedule.",
        },
        {
          id: "sign",
          label: "Sign contractor waiver",
          correct: false,
          feedback: "Incorrect. Waivers don't remove ABHI duties.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Member factory visits" },
      {
        kind: "paragraph",
        text: "Confirm PPE, emergency exits, and escort rules before visiting member manufacturing sites. Decline if safety briefing is inadequate.",
      },
    ]),
    questions: [
      mcq("A near-miss at an ABHI event should be:", "Recorded and investigated to prevent recurrence", ["Ignored if no injury", "Only told to insurer annually", "Kept secret to protect brand"], "Near-miss data prevents serious incidents."),
      scenarioQ("Fire alarm sounds during WHX setup. You:", "Evacuate via nearest route — do not collect laptops first", ["Finish cable run quickly", "Assume it's a drill always", "Send intern to investigate"], "Treat alarms as real until confirmed."),
      mcq("Display screen equipment assessments at ABHI HQ:", "Required for DSE users — adjust chairs/screens", ["Optional luxury", "Only for finance", "One-off at hire"], "UK HSE expectations apply."),
      mcq("Lone working while travelling for ABHI:", "Follow check-in protocol and share itinerary", ["Disable phone GPS", "Meet strangers in private hotel rooms", "Skip risk assessment"], "Travel risk assessments protect staff."),
      scenarioQ("Member visit floor is wet with no signage. You:", "Request cleaning/signage before entering area", ["Run through quickly", "Wear trainers so fine", "Film complaint only"], "Slip risks are foreseeable."),
      mcq("First aid at ABHI-hosted events:", "Trained first aiders and kit location identified in event plan", ["Assumed venue only", "Not needed under 50 people", "Member responsibility always"], "Event plans must cover medical response."),
    ],
  },

  "modern-slavery": {
    description:
      "Understanding modern slavery risks in healthtech supply chains and ABHI's role promoting member transparency.",
    intro: rt([
      { kind: "heading", level: 2, text: "Slavery risks in medtech supply chains" },
      {
        kind: "paragraph",
        text: "From surgical instruments to PPE and electronics, healthtech supply chains can involve forced labour overseas. ABHI expects staff and members to take the UK Modern Slavery Act seriously.",
      },
      {
        kind: "callout",
        tone: "info",
        title: "ABHI's role",
        text: "Support member statements, due diligence workshops, and responsible procurement guidance — not silent acceptance.",
      },
    ]),
    introKc: kc(
      "A member sources components from a supplier refusing site audits. ABHI policy event spotlight should:",
      "Question sourcing transparency — slavery risk may exist",
      ["Ignore — member's problem only", "Promote them heavily for revenue", "Assume UK law covers it abroad"],
      "ABHI amplifies sector standards through membership.",
    ),
    scenario: {
      story:
        "Visiting a member's packaging subcontractor abroad, you notice workers' passports held by security and dormitories behind locked gates.",
      character: { name: "Nina", role: "Supply Chain Programme Lead", imageUrl: IMG.medtech },
      choices: [
        {
          id: "report",
          label: "Document safely, leave if needed, escalate via ABHI modern slavery lead",
          correct: true,
          feedback: "Correct. Passport retention is a classic forced labour indicator.",
        },
        {
          id: "negotiate",
          label: "Negotiate cheaper rates while there",
          correct: false,
          feedback: "Incorrect. Do not compound exploitation.",
        },
        {
          id: "post",
          label: "Live-stream the conditions",
          correct: false,
          feedback: "Incorrect. Protect victim safety — formal escalation first.",
        },
      ],
    },
    scenarioRich: rt([
      { kind: "heading", level: 2, text: "Member Modern Slavery statements" },
      {
        kind: "paragraph",
        text: "ABHI can signpost template statements and training, but staff must not endorse members whose practices ignore credible abuse allegations.",
      },
    ]),
    questions: [
      mcq("Indicators of forced labour can include:", "Debt bondage, withheld documents, restricted movement", ["Paid overtime", "Union membership", "Annual leave"], "Multiple indicators warrant investigation."),
      scenarioQ("ABHI procures branded merchandise from a low-cost vendor with no audit trail. You:", "Require social compliance checks before order", ["Order urgently for WHX", "Assume UK port checks enough", "Use cash to save VAT"], "ABHI procurement must model standards."),
      mcq("UK Modern Slavery Act statements apply to ABHI members:", "Above turnover threshold — ABHI encourages broader adoption", ["Only if NHS customers ask", "Never for SMEs", "Only overseas firms"], "Sector leadership exceeds legal minimums."),
      mcq("If a whistleblower reports slavery links in a member supply chain:", "Investigate via proper channels; consider membership consequences", ["Ignore — commercial risk", "Publicly accuse immediately", "Delete report"], "Credible reports need structured response."),
      scenarioQ("Subcontract cleaners at ABHI's WHX stand appear underpaid and housed by supervisor. Action?", "Raise with events agency and ABHI HR — potential labour abuse", ["Tip extra personally", "Replace them mid-show without inquiry", "Post photos online"], "Event supply chains are in scope."),
      mcq("Due diligence on suppliers should:", "Scale with risk — geography, sector, and audit history", ["Be skipped for gifts", "Rely on logos only", "Happen after contract only"], "Risk-based diligence is best practice."),
    ],
  },
};

async function must(label, result) {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data;
}

async function deleteCourseTree(workspaceId, courseId) {
  await sb.from("lms_questions").delete().eq("course_id", courseId);
  await sb.from("lms_lessons").delete().eq("course_id", courseId);
  await sb.from("lms_modules").delete().eq("course_id", courseId);
  await sb.from("lms_assignments").delete().eq("course_id", courseId);
  await sb.from("lms_enrolments").delete().eq("course_id", courseId);
  await sb.from("lms_courses").delete().eq("id", courseId).eq("workspace_id", workspaceId);
}

function abhiRewriteText(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/\bTalanton(?: Impact)?\b/gi, "ABHI")
    .replace(/\bportfolio companies?\b/gi, "ABHI member companies")
    .replace(/\bportfolio leadership\b/gi, "ABHI staff and leaders")
    .replace(/\bEast African\b/gi, "UK healthtech")
    .replace(/\bAfrican enterprise\b/gi, "UK medtech sector")
    .replace(/\bAfrican business\b/gi, "ABHI member business")
    .replace(/\bAfrican city skyline representing portfolio company markets\b/gi, "UK healthtech innovation representing ABHI member markets")
    .replace(/\bintegrity is a growth strategy\b/gi, "integrity protects ABHI's NHS and trade reputation");
}

function abhiRewriteContent(content) {
  if (!content || typeof content !== "object") return content;
  const out = { ...content };
  if (typeof out.title === "string") out.title = abhiRewriteText(out.title);
  if (typeof out.script === "string") out.script = abhiRewriteText(out.script);
  if (typeof out.intro === "string") out.intro = abhiRewriteText(out.intro);
  if (typeof out.story === "string") out.story = abhiRewriteText(out.story);
  if (typeof out.prompt === "string") out.prompt = abhiRewriteText(out.prompt);
  if (typeof out.caption === "string") out.caption = abhiRewriteText(out.caption);
  if (Array.isArray(out.blocks)) {
    out.blocks = out.blocks.map((b) => {
      const block = { ...b };
      if (typeof block.text === "string") block.text = abhiRewriteText(block.text);
      if (Array.isArray(block.items)) block.items = block.items.map((i) => abhiRewriteText(i));
      return block;
    });
  }
  if (Array.isArray(out.highlights)) {
    out.highlights = out.highlights.map((h) => ({
      ...h,
      text: typeof h.text === "string" ? abhiRewriteText(h.text) : h.text,
    }));
  }
  if (Array.isArray(out.cards)) {
    out.cards = out.cards.map((c) => ({
      ...c,
      title: abhiRewriteText(c.title),
      summary: abhiRewriteText(c.summary),
      body: abhiRewriteText(c.body),
    }));
  }
  if (Array.isArray(out.choices)) {
    out.choices = out.choices.map((c) => ({
      ...c,
      label: abhiRewriteText(c.label),
      feedback: abhiRewriteText(c.feedback),
    }));
  }
  return out;
}

async function buildFullCoursePack(workspaceId, def, pack) {
  const { data: existing } = await sb
    .from("lms_courses")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("slug", def.slug)
    .maybeSingle();
  if (existing?.id) await deleteCourseTree(workspaceId, existing.id);

  const code = `ABHI-${def.slug.replace(/[^a-z0-9]+/g, "-").toUpperCase().slice(0, 24)}`;
  const course = await must(
    `insert ${def.slug}`,
    await sb
      .from("lms_courses")
      .insert({
        workspace_id: workspaceId,
        code,
        slug: def.slug,
        title: `${def.title} for ABHI`,
        description: pack.description,
        category: def.category,
        duration_minutes: def.durationMinutes,
        status: "published",
        pass_mark: 80,
        certificate_prefix: code.slice(0, 12),
        sort_order: 100,
      })
      .select("*")
      .single(),
  );

  const moduleDefs = [
    { title: "Introduction", summary: `ABHI context and expectations for ${def.title}.`, sort_order: 1 },
    { title: "Scenarios", summary: "Realistic ABHI HealthTech situations at events, NHS engagement, and member forums.", sort_order: 2 },
    { title: "Assessment", summary: "Knowledge check and final assessment drawn from the question bank.", sort_order: 3 },
  ];

  const modules = [];
  for (const mdef of moduleDefs) {
    modules.push(
      await must(
        `module ${def.slug} ${mdef.sort_order}`,
        await sb
          .from("lms_modules")
          .insert({
            workspace_id: workspaceId,
            course_id: course.id,
            title: mdef.title,
            summary: mdef.summary,
            sort_order: mdef.sort_order,
          })
          .select("*")
          .single(),
      ),
    );
  }
  const m = (n) => modules[n - 1];

  const lessons = [
    {
      module: 1,
      title: `Welcome — ${def.title} at ABHI`,
      lesson_type: "rich_text",
      estimated_minutes: 5,
      sort_order: 1,
      content: pack.intro,
    },
    {
      module: 1,
      title: "Knowledge check — key points",
      lesson_type: "knowledge_check",
      estimated_minutes: 3,
      sort_order: 2,
      content: pack.introKc,
    },
    {
      module: 2,
      title: "Scenario — ABHI event",
      lesson_type: "scenario",
      estimated_minutes: 4,
      sort_order: 1,
      content: { type: "scenario", ...pack.scenario },
    },
    {
      module: 2,
      title: "ABHI in practice",
      lesson_type: "rich_text",
      estimated_minutes: 4,
      sort_order: 2,
      content: pack.scenarioRich,
    },
    {
      module: 3,
      title: "Assessment briefing",
      lesson_type: "rich_text",
      estimated_minutes: 2,
      sort_order: 1,
      content: rt([
        { kind: "heading", level: 2, text: "Final assessment" },
        {
          kind: "paragraph",
          text: `You will answer questions drawn from this ${def.title} bank. Pass mark is 80%. Apply ABHI policies on NHS engagement, member companies, UK Pavilion events, and working groups.`,
        },
        {
          kind: "callout",
          tone: "info",
          title: "Ready?",
          text: "Review scenarios from WHX, Medica, and HQ before you begin.",
        },
      ]),
    },
    {
      module: 3,
      title: "Final assessment",
      lesson_type: "assessment",
      estimated_minutes: 15,
      sort_order: 2,
      content: {
        type: "assessment",
        drawCount: Math.min(10, pack.questions.length),
        passMark: 80,
        questionBankScope: "course",
      },
    },
  ];

  let lessonCount = 0;
  for (const lesson of lessons) {
    await must(
      `lesson ${def.slug} ${lesson.title}`,
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

  const questionRows = pack.questions.map((q, i) => ({
    workspace_id: workspaceId,
    course_id: course.id,
    module_id: null,
    question_type: q.question_type,
    stem: q.stem,
    choices: q.choices,
    correct_choice_id: q.correct_choice_id,
    explanation: q.explanation,
    difficulty: q.difficulty,
    sort_order: i + 1,
  }));

  for (let i = 0; i < questionRows.length; i += 25) {
    await must(`questions ${def.slug} ${i}`, await sb.from("lms_questions").insert(questionRows.slice(i, i + 25)));
  }

  return { course, lessonCount, questionCount: pack.questions.length, moduleCount: modules.length };
}

async function cloneAntiBribery(sourceWorkspaceId, targetWorkspaceId) {
  const { data: source } = await sb
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", sourceWorkspaceId)
    .eq("slug", "anti-bribery")
    .maybeSingle();
  if (!source) {
    console.warn("Source anti-bribery course not found on talantonimpact — building ABHI pack instead");
    const pack = {
      description:
        "Anti-bribery and corruption training for ABHI staff engaging NHS stakeholders, member companies, international trade missions, UK Pavilion events, and working groups — including gifts and hospitality at WHX and Medica.",
      intro: rt([
        { kind: "heading", level: 2, text: "Anti-Bribery & Corruption for ABHI HealthTech" },
        {
          kind: "paragraph",
          text: `${ABHI_CTX} Bribery risks appear in pavilion allocation, NHS introductions, agent commissions, and hospitality at WHX — not only cash in envelopes.`,
        },
        {
          kind: "callout",
          tone: "warning",
          title: "Zero tolerance",
          text: "ABHI prohibits improper payments to public officials, NHS contacts, and private counterparties.",
        },
      ]),
      introKc: kc(
        "Why does ABHI treat anti-bribery as core to trade association work?",
        "Integrity protects member trust, NHS partnerships, and UK Pavilion reputation",
        ["Only listed companies need ABC training", "Trade shows are exempt from UK law", "Hospitality never influences decisions"],
        "ABHI's credibility depends on clean engagement with members and the NHS.",
      ),
      scenario: {
        story:
          "At WHX Dubai, a distributor offers your ABHI colleague cash to prioritise their member's UK Pavilion briefing slot over others on the waiting list.",
        character: { name: "Emma", role: "International Events Lead", imageUrl: IMG.pavilion },
        choices: [
          {
            id: "refuse",
            label: "Refuse, log the offer, escalate to CEO/compliance",
            correct: true,
            feedback: "Correct. Pavilion access must never be sold or traded for secret payments.",
          },
          {
            id: "accept",
            label: "Accept if donated to ABHI charity",
            correct: false,
            feedback: "Incorrect. Disguised payments remain bribery.",
          },
          {
            id: "delay",
            label: "Delay all pavilion decisions until after the show",
            correct: false,
            feedback: "Incorrect. Document and escalate promptly.",
          },
        ],
      },
      scenarioRich: rt([
        { kind: "heading", level: 2, text: "Gifts & hospitality at ABHI events" },
        {
          kind: "paragraph",
          text: "Member hospitality during NHS working groups, luxury travel from agents, or 'consultancy' fees tied to policy access are red flags. Use ABHI's gifts register and declare before accepting.",
        },
      ]),
      questions: [
        mcq("A bribe at ABHI is best defined as:", "Anything of value offered to improperly influence a decision", ["Only cash over £1,000", "Marketing sponsorship", "Publicly listed tickets"], "Improper influence is the test."),
        scenarioQ("NHS contact hints ABHI will get a meeting if a member sponsors a private dinner. You:", "Decline improper linkage; follow NHS engagement rules", ["Proceed — it's for members", "Invoice ABHI later", "Ignore NHS process"], "Access must not be bought."),
        mcq("Third-party agents representing ABHI members:", "Can create liability if they pay bribes on your direction", ["Are always independent legally", "Are exempt overseas", "Need no due diligence"], "Third-party risk applies to associations."),
        scenarioQ("Facilitation payment to 'speed' pavilion customs clearance. Response?", "Refuse — use official channels and escalate delays", ["Pay if under £50", "Ask member to pay", "Cash only once"], "Facilitation payments are prohibited."),
        mcq("Best action when offered undeclared hospitality during a member grant review:", "Decline or disclose and recuse per ABHI policy", ["Accept if under policy limit verbally", "Transfer to colleague", "Accept for team morale"], "Timing plus value creates risk."),
        scenarioQ("Member asks ABHI staff to backdate a support letter for their tender. You:", "Refuse — only accurate authorised letters", ["Backdate if substance true", "Ask CEO verbally", "Ignore"], "Document integrity prevents fraud."),
        mcq("Books and records for ABHI expenses must:", "Accurately describe purpose and beneficiary", ["Use vague labels like 'client meeting'", "Exclude WHX costs", "Be optional under £100"], "Transparent records deter misconduct."),
      ],
    };
    return buildFullCoursePack(targetWorkspaceId, COURSES[0], pack);
  }

  const { data: existing } = await sb
    .from("lms_courses")
    .select("id")
    .eq("workspace_id", targetWorkspaceId)
    .eq("slug", "anti-bribery")
    .maybeSingle();
  if (existing?.id) await deleteCourseTree(targetWorkspaceId, existing.id);

  const {
    id: _id,
    created_at: _c,
    updated_at: _u,
    workspace_id: _w,
    code: _code,
    ...courseFields
  } = source;

  const course = await must(
    "clone course",
    await sb
      .from("lms_courses")
      .insert({
        ...courseFields,
        workspace_id: targetWorkspaceId,
        code: "ABHI-ABC",
        title: "Anti-Bribery & Corruption for ABHI",
        description:
          "Anti-bribery and corruption training for ABHI staff and leaders engaging the NHS, member companies, international trade shows, UK Pavilion programmes, and working groups — including gifts and hospitality at WHX and Medica.",
        certificate_prefix: "ABHI-ABC",
      })
      .select("*")
      .single(),
  );

  const { data: modules } = await sb
    .from("lms_modules")
    .select("*")
    .eq("course_id", source.id)
    .order("sort_order");
  const moduleIdMap = new Map();
  for (const mod of modules || []) {
    const {
      id: oldId,
      course_id: _cid,
      workspace_id: _wid,
      created_at: _ca,
      updated_at: _ua,
      ...modFields
    } = mod;
    const created = await must(
      `clone module ${mod.title}`,
      await sb
        .from("lms_modules")
        .insert({
          ...modFields,
          workspace_id: targetWorkspaceId,
          course_id: course.id,
          title: abhiRewriteText(mod.title),
          summary: mod.summary ? abhiRewriteText(mod.summary) : mod.summary,
        })
        .select("*")
        .single(),
    );
    moduleIdMap.set(oldId, created.id);
  }

  const { data: lessons } = await sb
    .from("lms_lessons")
    .select("*")
    .eq("course_id", source.id)
    .order("sort_order");
  let lessonCount = 0;
  for (const lesson of lessons || []) {
    const {
      id: _lid,
      course_id: _cid,
      module_id,
      workspace_id: _wid,
      created_at: _ca,
      updated_at: _ua,
      ...lessonFields
    } = lesson;
    const rewrittenContent = abhiRewriteContent(lessonFields.content);
    if (lessonCount === 0 && rewrittenContent?.type === "narration") {
      rewrittenContent.script =
        "Welcome to Anti-Bribery and Corruption for ABHI. As the UK's healthtech trade association, ABHI engages the NHS, member companies, and global markets through the UK Pavilion and working groups. Bribery threatens that licence — from improper pavilion favours to undisclosed hospitality at WHX. This programme helps you recognise risk and escalate properly.";
    }
    await must(
      `clone lesson ${lesson.title}`,
      await sb.from("lms_lessons").insert({
        ...lessonFields,
        workspace_id: targetWorkspaceId,
        course_id: course.id,
        module_id: moduleIdMap.get(module_id) ?? null,
        title: abhiRewriteText(lesson.title),
        content: rewrittenContent,
      }),
    );
    lessonCount += 1;
  }

  const { data: questions } = await sb.from("lms_questions").select("*").eq("course_id", source.id);
  const qRows = (questions || []).map((q, i) => {
    const {
      id: _qid,
      course_id: _cid,
      workspace_id: _wid,
      module_id,
      created_at: _ca,
      updated_at: _ua,
      ...qFields
    } = q;
    return {
      ...qFields,
      workspace_id: targetWorkspaceId,
      course_id: course.id,
      module_id: module_id ? moduleIdMap.get(module_id) ?? null : null,
      stem: abhiRewriteText(qFields.stem),
      explanation: abhiRewriteText(qFields.explanation),
      sort_order: qFields.sort_order ?? i + 1,
    };
  });
  for (let i = 0; i < qRows.length; i += 25) {
    await must(`clone questions ${i}`, await sb.from("lms_questions").insert(qRows.slice(i, i + 25)));
  }

  return {
    course,
    lessonCount,
    questionCount: qRows.length,
    moduleCount: (modules || []).length,
  };
}

async function findAbhiStaffUsers(workspaceId) {
  const { data: employees, error: empErr } = await sb
    .from("hr_employees")
    .select("id, full_name, email, platform_user_id, employment_status")
    .eq("workspace_id", workspaceId)
    .not("platform_user_id", "is", null)
    .neq("employment_status", "archived")
    .neq("employment_status", "former_employee")
    .order("full_name")
    .limit(12);
  if (empErr) throw empErr;

  const fromEmployees = (employees || [])
    .filter((e) => e.platform_user_id)
    .map((e) => ({
      userId: e.platform_user_id,
      name: e.full_name,
      email: e.email,
      source: "hr_employees",
    }));

  if (fromEmployees.length >= 4) return fromEmployees;

  const { data: memberships, error: memErr } = await sb
    .from("workspace_users")
    .select("user_id")
    .eq("workspace_id", workspaceId)
    .not("user_id", "is", null)
    .limit(12);
  if (memErr) throw memErr;

  const userIds = [...new Set((memberships || []).map((m) => m.user_id).filter(Boolean))];
  if (userIds.length === 0) return fromEmployees;

  const { data: users, error: userErr } = await sb
    .from("platform_users")
    .select("id, username, display_name, email")
    .in("id", userIds);
  if (userErr) throw userErr;

  const fromWorkspace = (users || []).map((u) => ({
    userId: u.id,
    name: u.display_name || u.username,
    email: u.email || u.username,
    source: "workspace_users",
  }));

  const seen = new Set(fromEmployees.map((e) => e.userId));
  for (const u of fromWorkspace) {
    if (!seen.has(u.userId)) fromEmployees.push(u);
  }
  return fromEmployees;
}

async function getCourseLessons(workspaceId, courseId) {
  const { data, error } = await sb
    .from("lms_lessons")
    .select("id, sort_order")
    .eq("workspace_id", workspaceId)
    .eq("course_id", courseId)
    .order("sort_order");
  if (error) throw error;
  return data || [];
}

async function seedDemoEnrolments(workspaceId, courseBySlug, staff) {
  const enrolments = [];
  const assignments = [];
  const errors = [];

  if (staff.length === 0) {
    return { enrolments, assignments, errors: ["No ABHI staff users with platform accounts found"] };
  }

  const antiBribery = courseBySlug.get("anti-bribery");
  const aml = courseBySlug.get("aml");
  const codeOfConduct = courseBySlug.get("code-of-conduct");
  const infoSec = courseBySlug.get("information-security");
  const whistle = courseBySlug.get("whistleblowing");

  const plans = [
    { user: staff[0], course: antiBribery, status: "assigned", progress: 0, completedLessons: 0 },
    { user: staff[1] ?? staff[0], course: antiBribery, status: "in_progress", progress: 35, completedLessons: 2 },
    { user: staff[2] ?? staff[0], course: aml, status: "in_progress", progress: 55, completedLessons: 3 },
    { user: staff[3] ?? staff[0], course: codeOfConduct, status: "assigned", progress: 0, completedLessons: 0 },
    { user: staff[4] ?? staff[0], course: infoSec, status: "completed", progress: 100, completedLessons: 999, score: 88 },
    { user: staff[5] ?? staff[1] ?? staff[0], course: whistle, status: "assigned", progress: 0, completedLessons: 0 },
  ].filter((p) => p.course?.id);

  for (const plan of plans) {
    try {
      await sb
        .from("lms_assignments")
        .delete()
        .eq("workspace_id", workspaceId)
        .eq("course_id", plan.course.id)
        .eq("user_id", plan.user.userId);

      assignments.push(
        await must(
          `assignment ${plan.course.slug} ${plan.user.userId}`,
          await sb
            .from("lms_assignments")
            .insert({
              workspace_id: workspaceId,
              course_id: plan.course.id,
              user_id: plan.user.userId,
              client_id: null,
              mandatory: true,
              due_at: null,
            })
            .select("*")
            .single(),
        ),
      );

      const lessons = await getCourseLessons(workspaceId, plan.course.id);
      const completedIds =
        plan.completedLessons >= 999
          ? lessons.map((l) => l.id)
          : lessons.slice(0, plan.completedLessons).map((l) => l.id);
      const lastLessonId = completedIds.length > 0 ? completedIds[completedIds.length - 1] : null;

      const row = {
        workspace_id: workspaceId,
        course_id: plan.course.id,
        user_id: plan.user.userId,
        client_id: null,
        status: plan.status,
        progress_pct: plan.progress,
        lesson_state: { completedLessonIds: completedIds },
        time_spent_seconds: plan.status === "completed" ? 2400 : plan.progress * 30,
        score: plan.score ?? null,
        started_at: plan.status !== "assigned" ? new Date(Date.now() - 86400000 * 3).toISOString() : null,
        completed_at: plan.status === "completed" ? new Date().toISOString() : null,
        last_lesson_id: lastLessonId,
      };

      const enr = await must(
        `enrolment ${plan.course.slug} ${plan.user.userId}`,
        await sb
          .from("lms_enrolments")
          .upsert(row, { onConflict: "workspace_id,course_id,user_id" })
          .select("*")
          .single(),
      );

      enrolments.push({
        id: enr.id,
        courseSlug: plan.course.slug,
        userId: plan.user.userId,
        userName: plan.user.name,
        status: plan.status,
        progressPct: plan.progress,
      });
    } catch (err) {
      errors.push(`${plan.course.slug}/${plan.user.email}: ${err.message}`);
    }
  }

  return { enrolments, assignments, errors };
}

async function main() {
  const target = await must(
    "target workspace",
    await sb.from("workspaces").select("id, slug").eq("slug", TARGET_SLUG).maybeSingle(),
  );
  if (!target?.id) throw new Error("ABHI workspace not found");
  if (FORBIDDEN.has(target.slug)) throw new Error(`Refusing forbidden slug ${target.slug}`);

  const source = await must(
    "source workspace",
    await sb.from("workspaces").select("id, slug").eq("slug", SOURCE_SLUG).maybeSingle(),
  );

  const created = [];
  const courseBySlug = new Map();

  for (const def of COURSES) {
    if (def.cloneFull && source?.id) {
      const result = await cloneAntiBribery(source.id, target.id);
      created.push({
        slug: def.slug,
        id: result.course.id,
        mode: "cloned",
        lessonCount: result.lessonCount,
        questionCount: result.questionCount,
        moduleCount: result.moduleCount,
      });
      courseBySlug.set(def.slug, result.course);
    } else {
      const pack = COURSE_PACKS[def.slug];
      if (!pack) throw new Error(`Missing pack definition for ${def.slug}`);
      const result = await buildFullCoursePack(target.id, def, pack);
      created.push({
        slug: def.slug,
        id: result.course.id,
        mode: "full_pack",
        lessonCount: result.lessonCount,
        questionCount: result.questionCount,
        moduleCount: result.moduleCount,
      });
      courseBySlug.set(def.slug, result.course);
    }
  }

  const staff = await findAbhiStaffUsers(target.id);
  const enrolmentResult = await seedDemoEnrolments(target.id, courseBySlug, staff);

  const { count: courseCount } = await sb
    .from("lms_courses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", target.id);

  const { count: lessonCount } = await sb
    .from("lms_lessons")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", target.id);

  const { count: questionCount } = await sb
    .from("lms_questions")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", target.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: TARGET_SLUG,
        courseCount,
        totalLessons: lessonCount,
        totalQuestions: questionCount,
        staffFound: staff.length,
        created,
        enrolments: enrolmentResult.enrolments,
        assignmentCount: enrolmentResult.assignments.length,
        enrolmentCount: enrolmentResult.enrolments.length,
        errors: enrolmentResult.errors,
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
