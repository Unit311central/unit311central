/**
 * CorpCentre-only: seed Australian Pipeline (Discovery), Discovery & Demo, and Client Onboarding.
 * Does NOT touch Demo or Internal workspaces.
 *
 * Usage: node scripts/seed-corpcentre-crm-funnel.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const WS = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const TZ = "Australia/Sydney";
const ACTOR = "Peter Durning";

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function id(key) {
  const hex = createHash("sha256").update(`corpcentre-funnel:${key}`).digest("hex");
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `a${hex.slice(17, 20)}`,
    hex.slice(20, 32),
  ].join("-");
}

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  return {
    first: parts[0] || "Contact",
    surname: parts.slice(1).join(" ") || "Team",
  };
}

function isoDaysFromNow(days, hour = 10) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateDaysFromNow(days) {
  return isoDaysFromNow(days).slice(0, 10);
}

const PROSPECTS = [
  {
    key: "northside-msp",
    company: "Northside Managed IT Pty Ltd",
    contact: "Rebecca Tan",
    role: "Managing Director",
    email: "rebecca.tan@northsidemsp.example",
    phone: "+61 2 8912 3301",
    source: "Referral",
    status: "Hot",
    value: 180000,
    next: "Send managed services proposal",
    discovery: true,
  },
  {
    key: "coastal-legal",
    company: "Coastal Legal Partners",
    contact: "Andrew Fitzpatrick",
    role: "Practice Manager",
    email: "a.fitzpatrick@coastallegal.example",
    phone: "+61 2 9251 7740",
    source: "Inbound web",
    status: "Warm",
    value: 96000,
    next: "Schedule discovery call",
    discovery: true,
  },
  {
    key: "murray-agri",
    company: "Murray Valley Agri Co-op",
    contact: "Diane Walsh",
    role: "COO",
    email: "diane.walsh@murrayagri.example",
    phone: "+61 3 5881 2200",
    source: "Conference",
    status: "Warm",
    value: 140000,
    next: "Demo regional offices stack",
    discovery: true,
  },
  {
    key: "bondi-health",
    company: "Bondi Health Clinics",
    contact: "Dr Samir Patel",
    role: "Clinic Director",
    email: "samir.patel@bondihealth.example",
    phone: "+61 2 9130 4411",
    source: "Partner intro",
    status: "Hot",
    value: 210000,
    next: "Security questionnaire follow-up",
    discovery: true,
  },
  {
    key: "tasman-freight",
    company: "Tasman Freight Systems",
    contact: "Kelly Nguyen",
    role: "IT Lead",
    email: "kelly.nguyen@tasmanfreight.example",
    phone: "+61 3 6224 1188",
    source: "Cold outreach",
    status: "Cold",
    value: 72000,
    next: "Qualify budget owners",
    discovery: false,
  },
  {
    key: "goldcoast-retail",
    company: "Gold Coast Retail Group",
    contact: "Chris Barlow",
    role: "Operations Director",
    email: "chris.barlow@gcrg.example",
    phone: "+61 7 5557 9020",
    source: "Inbound web",
    status: "Cold",
    value: 85000,
    next: "Send capability pack",
    discovery: false,
  },
  {
    key: "darwin-mining-it",
    company: "Top End Mining IT",
    contact: "Lauren Okeke",
    role: "GM Technology",
    email: "lauren.okeke@topendmining.example",
    phone: "+61 8 8941 5500",
    source: "Referral",
    status: "Warm",
    value: 260000,
    next: "Site readiness checklist",
    discovery: true,
  },
  {
    key: "canberra-policy",
    company: "Capital Policy Advisors",
    contact: "Michael Crowe",
    role: "Partner",
    email: "m.crowe@capitalpolicy.example",
    phone: "+61 2 6270 3310",
    source: "Event",
    status: "Cold",
    value: 54000,
    next: "Nurture sequence",
    discovery: false,
  },
  {
    key: "sunshine-dental",
    company: "Sunshine Coast Dental Alliance",
    contact: "Nina Brooks",
    role: "CEO",
    email: "nina.brooks@scda.example",
    phone: "+61 7 5443 2199",
    source: "Inbound web",
    status: "Hot",
    value: 125000,
    next: "Contract redlines",
    discovery: true,
  },
  {
    key: "hunter-water-tech",
    company: "Hunter Water Tech Services",
    contact: "Paul Ibrahim",
    role: "Digital Lead",
    email: "paul.ibrahim@hunterwatertech.example",
    phone: "+61 2 4940 8800",
    source: "Tender portal",
    status: "Won",
    value: 198000,
    next: "Handover to onboarding",
    discovery: true,
  },
  {
    key: "parramatta-finance",
    company: "Parramatta Finance Collective",
    contact: "Amy Zhou",
    role: "Head of Ops",
    email: "amy.zhou@pfc.example",
    phone: "+61 2 9635 7711",
    source: "Referral",
    status: "Won",
    value: 156000,
    next: "Kickoff workshop",
    discovery: true,
  },
  {
    key: "geelong-fab",
    company: "Geelong Fabrication Works",
    contact: "Brett Collins",
    role: "Owner",
    email: "brett.collins@geelongfab.example",
    phone: "+61 3 5222 1090",
    source: "Cold outreach",
    status: "Lost",
    value: 48000,
    next: "Archive — chose incumbent",
    discovery: false,
  },
];

function discoveryHtml(company, contact) {
  return `<p><strong>Discovery notes — ${company}</strong></p>
<ul>
<li>Primary contact: ${contact}</li>
<li>Current stack: mix of Microsoft 365, on-prem file shares, and ad-hoc MSP support</li>
<li>Pain: fragmented ticketing, weak asset visibility, no single executive dashboard</li>
<li>Priority outcomes: centralised ops, AU data residency, monthly board pack automation</li>
<li>Stakeholders: MD, Operations, Finance</li>
<li>Next step: scoped demo of Client Directory, Projects, and Financials</li>
</ul>`;
}

const STAGE_PROGRESS = {
  signed_up: 17,
  payment_received: 33,
  questionnaire_complete: 50,
  platform_clone_complete: 67,
  review_complete: 83,
  platform_live: 100,
};

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WS).maybeSingle();
  if (!ws || !["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing non-corpcentre workspace: ${ws?.slug}`);
  }

  // Wipe prior CorpCentre funnel data only.
  const { data: oldBookings } = await admin
    .from("founder_session_bookings")
    .select("id")
    .eq("workspace_id", WS);
  if (oldBookings?.length) {
    await admin
      .from("founder_session_bookings")
      .delete()
      .in(
        "id",
        oldBookings.map((r) => r.id),
      );
  }

  const { data: oldOnboarding } = await admin
    .from("client_onboarding_records")
    .select("id")
    .eq("workspace_id", WS);
  if (oldOnboarding?.length) {
    await admin
      .from("client_onboarding_records")
      .delete()
      .in(
        "id",
        oldOnboarding.map((r) => r.id),
      );
  }

  const { data: oldLeads } = await admin.from("crm_leads").select("id").eq("workspace_id", WS);
  if (oldLeads?.length) {
    await admin
      .from("crm_leads")
      .delete()
      .in(
        "id",
        oldLeads.map((r) => r.id),
      );
  }

  // —— Pipeline / Discovery leads ——
  const leadRows = PROSPECTS.map((p, index) => {
    const names = splitName(p.contact);
    return {
      id: id(`lead:${p.key}`),
      workspace_id: WS,
      company_name: p.company,
      contact_name: p.contact,
      first_name: names.first,
      surname: names.surname,
      role: p.role,
      email: p.email,
      phone: p.phone,
      status: p.status,
      source: p.source,
      next_action: p.next,
      next_action_date: dateDaysFromNow(3 + (index % 10)),
      estimated_value: p.value,
      notes: `${p.company} · Australian MSP / professional services prospect · AUD pricing`,
      discovery_notes: p.discovery ? discoveryHtml(p.company, p.contact) : null,
      created_at: isoDaysFromNow(-(40 - index)),
      updated_at: isoDaysFromNow(-(index % 7)),
    };
  });

  {
    const { error } = await admin.from("crm_leads").insert(leadRows);
    if (error) throw new Error(`crm_leads: ${error.message}`);
  }

  // —— Discovery & Demo bookings ——
  const demoSpecs = [
    { key: "northside-msp", days: 3, status: "scheduled", hour: 1 }, // ~11:00 Sydney-ish UTC+10 winter varies
    { key: "coastal-legal", days: 5, status: "scheduled", hour: 2 },
    { key: "bondi-health", days: 8, status: "scheduled", hour: 0 },
    { key: "sunshine-dental", days: 12, status: "scheduled", hour: 3 },
    { key: "murray-agri", days: -4, status: "completed", hour: 1 },
    { key: "darwin-mining-it", days: -11, status: "completed", hour: 2 },
    { key: "hunter-water-tech", days: -18, status: "completed", hour: 0 },
    { key: "geelong-fab", days: -9, status: "cancelled", hour: 1 },
  ];

  const bookingRows = demoSpecs.map((spec) => {
    const prospect = PROSPECTS.find((p) => p.key === spec.key);
    const starts = isoDaysFromNow(spec.days, spec.hour + 1);
    const endsDate = new Date(starts);
    endsDate.setUTCMinutes(endsDate.getUTCMinutes() + 45);
    const slug = `cc-${spec.key}-${spec.status}`.slice(0, 48);
    return {
      id: id(`booking:${spec.key}:${spec.status}`),
      workspace_id: WS,
      name: prospect.contact,
      organization: prospect.company,
      role: prospect.role,
      email: prospect.email,
      starts_at: starts,
      ends_at: endsDate.toISOString(),
      client_timezone: TZ,
      status: spec.status,
      meeting_slug: slug,
      video_link: `https://corpcentre.unit311central.com/meet/video/${slug}`,
      crm_lead_id: id(`lead:${spec.key}`),
    };
  });

  {
    const { error } = await admin.from("founder_session_bookings").insert(bookingRows);
    if (error) throw new Error(`founder_session_bookings: ${error.message}`);
  }

  // —— Client Onboarding ——
  const onboardingSpecs = [
    {
      key: "hunter-water-tech",
      stage: "platform_live",
      daysAgo: 45,
    },
    {
      key: "parramatta-finance",
      stage: "review_complete",
      daysAgo: 18,
    },
    {
      key: "sunshine-dental",
      stage: "platform_clone_complete",
      daysAgo: 12,
    },
    {
      key: "bondi-health",
      stage: "questionnaire_complete",
      daysAgo: 8,
    },
    {
      key: "northside-msp",
      stage: "payment_received",
      daysAgo: 5,
    },
    {
      key: "coastal-legal",
      stage: "signed_up",
      daysAgo: 2,
    },
  ];

  const stageOrder = [
    "signed_up",
    "payment_received",
    "questionnaire_complete",
    "platform_clone_complete",
    "review_complete",
    "platform_live",
  ];

  const onboardingRows = onboardingSpecs.map((spec) => {
    const prospect = PROSPECTS.find((p) => p.key === spec.key);
    const signedUpAt = isoDaysFromNow(-spec.daysAgo);
    const stageIndex = stageOrder.indexOf(spec.stage);
    const stamp = (index) =>
      index <= stageIndex ? isoDaysFromNow(-(spec.daysAgo - index * 2)) : null;

    return {
      id: id(`onboarding:${spec.key}`),
      workspace_id: WS,
      company_name: prospect.company,
      contact_name: prospect.contact,
      contact_email: prospect.email,
      signup_date: signedUpAt.slice(0, 10),
      current_stage: spec.stage,
      progress_percent: STAGE_PROGRESS[spec.stage],
      current_status: spec.stage === "platform_live" ? "Platform Live" : "In Progress",
      signed_up_at: stamp(0) || signedUpAt,
      signed_up_by: ACTOR,
      payment_received_at: stamp(1),
      payment_received_by: stamp(1) ? ACTOR : null,
      questionnaire_complete_at: stamp(2),
      questionnaire_complete_by: stamp(2) ? ACTOR : null,
      platform_clone_complete_at: stamp(3),
      platform_clone_complete_by: stamp(3) ? ACTOR : null,
      review_complete_at: stamp(4),
      review_complete_by: stamp(4) ? ACTOR : null,
      platform_live_at: stamp(5),
      platform_live_by: stamp(5) ? ACTOR : null,
      created_at: signedUpAt,
      updated_at: isoDaysFromNow(-1),
    };
  });

  {
    const { error } = await admin.from("client_onboarding_records").insert(onboardingRows);
    if (error) throw new Error(`client_onboarding_records: ${error.message}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspaceId: WS,
        pipelineLeads: leadRows.length,
        discoveryDemos: bookingRows.length,
        clientOnboarding: onboardingRows.length,
        statuses: {
          leads: Object.fromEntries(
            ["Cold", "Warm", "Hot", "Won", "Lost"].map((s) => [
              s,
              leadRows.filter((r) => r.status === s).length,
            ]),
          ),
          demos: Object.fromEntries(
            ["scheduled", "completed", "cancelled"].map((s) => [
              s,
              bookingRows.filter((r) => r.status === s).length,
            ]),
          ),
          onboarding: Object.fromEntries(
            stageOrder.map((s) => [s, onboardingRows.filter((r) => r.current_stage === s).length]),
          ),
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
