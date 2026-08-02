/**
 * ABHI-only CRM, meetings, onboarding, and project-task seed.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-crm-and-projects.mjs
 */
import { createHash, randomUUID } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const SEED_TAG = "ABHI CRM seed";
const SLUG = "abhi";
const ACTOR = "Jane Lewis";
const TZ = "Europe/London";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

function loadEnv(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    if (index < 0) continue;
    const key = trimmed.slice(0, index).trim();
    let value = trimmed.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    const weak =
      !value ||
      value === "[]" ||
      value.includes("SENSITIVE") ||
      value.startsWith("env_");
    if (!process.env[key] || (!weak && process.env[key]?.includes("SENSITIVE"))) {
      if (!weak) process.env[key] = value;
    }
  }
}

loadEnv(resolve(process.cwd(), ".env.local"));
loadEnv(resolve(process.cwd(), ".env.deploy.pull"));
loadEnv(resolve(process.cwd(), ".env.corporatecentre.runtime"));

function deterministicUuid(key) {
  const hex = createHash("sha256").update(key).digest("hex");
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

function isoDaysFromNow(days, hour = 10, minute = 0) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(hour, minute, 0, 0);
  return d.toISOString();
}

function dateDaysFromNow(days) {
  return isoDaysFromNow(days).slice(0, 10);
}

function addDays(isoDate, days) {
  const d = new Date(`${isoDate}T12:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function sqlEscape(value) {
  if (value == null) return "null";
  if (typeof value === "boolean") return value ? "true" : "false";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "null";
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function fetchServiceRoleViaManagement(token, projectRef) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/api-keys`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data)) return null;
  const row =
    data.find((item) => item.name === "service_role") ??
    data.find((item) => String(item.tags || "").includes("service_role"));
  const key = row?.api_key || row?.key || "";
  return key.length >= 40 ? key : null;
}

async function mgmtQuery(token, projectRef, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }
  if (!res.ok) {
    throw new Error(`Management SQL failed (${res.status}): ${String(text).slice(0, 400)}`);
  }
  return data;
}

async function resolveAdminClient() {
  const supabaseUrl = (
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ""
  ).trim();
  let serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || "").trim();
  const accessToken = (process.env.SUPABASE_ACCESS_TOKEN || "").trim();
  const projectRef = (process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq").trim();

  if ((!serviceKey || serviceKey.includes("SENSITIVE")) && accessToken && projectRef) {
    serviceKey = (await fetchServiceRoleViaManagement(accessToken, projectRef)) || "";
    if (serviceKey) console.log("Resolved service role via management API");
  }

  if (supabaseUrl.startsWith("http") && serviceKey.length >= 40) {
    return {
      mode: "supabase",
      admin: createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }),
    };
  }

  if (accessToken && projectRef) {
    return {
      mode: "management",
      query: (sql) => mgmtQuery(accessToken, projectRef, sql),
    };
  }

  throw new Error(
    "Missing credentials: need SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF",
  );
}

const STAGE_PROGRESS = {
  signed_up: 17,
  payment_received: 33,
  questionnaire_complete: 50,
  platform_clone_complete: 67,
  review_complete: 83,
  platform_live: 100,
};

const PROSPECTS = [
  {
    key: "oxbridge-medtech",
    company: "Oxbridge MedTech Ltd",
    contact: "Dr Fiona Marsh",
    role: "Commercial Director",
    email: "fiona.marsh@oxbridgemedtech.co.uk",
    phone: "+44 1223 555 410",
    source: "ABHI event",
    status: "Hot",
    value: 18000,
    next: "Send membership proposal pack",
    discovery: true,
  },
  {
    key: "cambridge-diagnostics",
    company: "Cambridge Diagnostics Group",
    contact: "James Whitfield",
    role: "CEO",
    email: "j.whitfield@camdiag.co.uk",
    phone: "+44 1223 555 812",
    source: "Partner referral",
    status: "Warm",
    value: 12000,
    next: "Schedule ABHI discovery session",
    discovery: true,
  },
  {
    key: "midlands-surgical",
    company: "Midlands Surgical Innovations",
    contact: "Priya Natarajan",
    role: "Regulatory Lead",
    email: "p.natarajan@midlandssurgical.co.uk",
    phone: "+44 121 555 0198",
    source: "Inbound web",
    status: "Cold",
    value: 9000,
    next: "Qualify NHS supplier status",
    discovery: false,
  },
  {
    key: "scottish-health-analytics",
    company: "Scottish Health Analytics",
    contact: "Andrew MacLeod",
    role: "Head of Partnerships",
    email: "a.macleod@scottishhealthanalytics.co.uk",
    phone: "+44 131 555 7720",
    source: "Conference",
    status: "Warm",
    value: 15000,
    next: "Share market access briefing",
    discovery: true,
  },
  {
    key: "thames-nhs-frameworks",
    company: "Thames Valley NHS Frameworks",
    contact: "Helen Cartwright",
    role: "Procurement Manager",
    email: "h.cartwright@tvnhsframeworks.nhs.uk",
    phone: "+44 1865 555 3301",
    source: "NHS supplier network",
    status: "Hot",
    value: 24000,
    next: "Demo membership portal & policy hub",
    discovery: true,
  },
];

function discoveryHtml(company, contact) {
  return `<p><strong>Discovery notes — ${company}</strong></p>
<ul>
<li>Primary contact: ${contact}</li>
<li>Sector: UK HealthTech / NHS supplier ecosystem</li>
<li>Interest: ABHI membership, market access, regulatory insight</li>
<li>Current pain: fragmented NHS engagement, limited policy visibility</li>
<li>Priority outcomes: membership benefits, international trade support, policy briefings</li>
<li>Next step: ABHI membership discovery & demo session</li>
</ul>`;
}

const INTERNAL_TASK_TEMPLATES = [
  { name: "Programme kickoff & stakeholder map", milestone: true, critical: true, weight: 0.08 },
  { name: "Member journey discovery workshops", milestone: false, critical: true, weight: 0.1 },
  { name: "Process blueprint & RACI", milestone: true, critical: true, weight: 0.1 },
  { name: "Platform configuration sprint", milestone: false, critical: true, weight: 0.12 },
  { name: "Policy content alignment", milestone: true, critical: false, weight: 0.1 },
  { name: "Pilot member cohort UAT", milestone: true, critical: true, weight: 0.12 },
  { name: "Comms & change plan", milestone: false, critical: false, weight: 0.08 },
  { name: "Training & playbook rollout", milestone: true, critical: true, weight: 0.12 },
  { name: "Go-live readiness review", milestone: true, critical: true, weight: 0.1 },
  { name: "Hypercare & benefits realisation", milestone: true, critical: false, weight: 0.08 },
];

const EXTERNAL_TASK_TEMPLATES = [
  { name: "Contract mobilisation & governance", milestone: true, critical: true, weight: 0.08 },
  { name: "NHS stakeholder mapping", milestone: false, critical: true, weight: 0.1 },
  { name: "Market access baseline assessment", milestone: true, critical: true, weight: 0.1 },
  { name: "Regulatory readiness gap analysis", milestone: false, critical: true, weight: 0.12 },
  { name: "Value dossier workshop", milestone: true, critical: false, weight: 0.1 },
  { name: "Pilot site engagement", milestone: true, critical: true, weight: 0.12 },
  { name: "International trade briefing", milestone: false, critical: false, weight: 0.08 },
  { name: "Executive steering committee", milestone: true, critical: true, weight: 0.1 },
  { name: "Delivery milestone acceptance", milestone: true, critical: true, weight: 0.1 },
  { name: "Close-out & membership handover", milestone: true, critical: false, weight: 0.1 },
];

function buildProjectTasks(project) {
  const templates = project.client_id ? EXTERNAL_TASK_TEMPLATES : INTERNAL_TASK_TEMPLATES;
  const start = new Date(`${project.start_date}T12:00:00.000Z`);
  const end = new Date(`${project.end_date}T12:00:00.000Z`);
  const spanMs = Math.max(end.getTime() - start.getTime(), 7 * 86400000);
  const progressPct = Number(project.progress_pct || 0);
  const resource = project.operator || "ABHI Team";

  return templates.map((template, index) => {
    const offsetStart = Math.floor((spanMs * templates.slice(0, index).reduce((s, t) => s + t.weight, 0)) / 86400000);
    const offsetEnd = Math.floor(
      (spanMs * templates.slice(0, index + 1).reduce((s, t) => s + t.weight, 0)) / 86400000,
    );
    const startDate = addDays(project.start_date, offsetStart);
    const dueDate = addDays(project.start_date, Math.max(offsetEnd, offsetStart + 7));
    const taskProgress =
      progressPct >= ((index + 1) / templates.length) * 100
        ? 100
        : progressPct >= (index / templates.length) * 100
          ? Math.round(((progressPct - (index / templates.length) * 100) / (100 / templates.length)) * 100)
          : 0;

    return {
      id: `abhi-task-${project.id.slice(0, 8)}-${String(index + 1).padStart(2, "0")}`,
      project_id: project.id,
      workspace_id: project.workspace_id,
      name: template.name,
      description: `${template.name} · ${project.name} · ${SEED_TAG}`,
      start_date: startDate,
      due_date: dueDate,
      progress: Math.max(0, Math.min(100, taskProgress)),
      resource,
      milestone: template.milestone,
      critical: template.critical,
      sort_order: index,
    };
  });
}

async function wipeAbhiFunnel(admin, workspaceId) {
  const tables = [
    ["founder_session_bookings", "workspace_id"],
    ["client_onboarding_records", "workspace_id"],
    ["crm_leads", "workspace_id"],
  ];

  for (const [table] of tables) {
    const { data, error } = await admin.from(table).select("id").eq("workspace_id", workspaceId);
    if (error) throw new Error(`${table} select: ${error.message}`);
    if (!data?.length) continue;
    const { error: delErr } = await admin.from(table).delete().in(
      "id",
      data.map((row) => row.id),
    );
    if (delErr) throw new Error(`${table} delete: ${delErr.message}`);
  }
}

async function wipeProjectTasks(admin, workspaceId, projectIds) {
  if (!projectIds.length) return;
  const { error } = await admin
    .from("internal_project_tasks")
    .delete()
    .eq("workspace_id", workspaceId)
    .in("project_id", projectIds);
  if (error) throw new Error(`internal_project_tasks delete: ${error.message}`);
}

async function assertAbhiWorkspace(admin) {
  if (FORBIDDEN.has(SLUG)) throw new Error(`Refusing forbidden slug ${SLUG}`);

  const { data: ws, error } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (error || !ws?.id) throw new Error(`ABHI workspace missing: ${error?.message || "not found"}`);
  if (FORBIDDEN.has(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing protected workspace ${ws.slug}`);
  }
  return ws;
}

async function seedViaSupabase(admin, workspaceId) {
  await wipeAbhiFunnel(admin, workspaceId);

  const leadRows = PROSPECTS.map((p, index) => {
    const names = splitName(p.contact);
    return {
      id: deterministicUuid(`abhi-crm-lead:${p.key}`),
      workspace_id: workspaceId,
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
      next_action_date: dateDaysFromNow(2 + (index % 8)),
      estimated_value: p.value,
      notes: `${p.company} · UK HealthTech / NHS supplier prospect · ${SEED_TAG}`,
      discovery_notes: p.discovery ? discoveryHtml(p.company, p.contact) : null,
      created_at: isoDaysFromNow(-(30 - index * 3)),
      updated_at: isoDaysFromNow(-(index % 5)),
    };
  });

  {
    const { error } = await admin.from("crm_leads").insert(leadRows);
    if (error) throw new Error(`crm_leads: ${error.message}`);
  }

  const demoSpecs = [
    { key: "oxbridge-medtech", days: 4, status: "scheduled", hour: 9, minute: 30 },
    { key: "cambridge-diagnostics", days: 7, status: "scheduled", hour: 11, minute: 0 },
    { key: "scottish-health-analytics", days: 10, status: "scheduled", hour: 14, minute: 15 },
    { key: "thames-nhs-frameworks", days: 14, status: "scheduled", hour: 10, minute: 45 },
    { key: "midlands-surgical", days: -6, status: "completed", hour: 15, minute: 30 },
  ];

  const bookingRows = demoSpecs.map((spec) => {
    const prospect = PROSPECTS.find((p) => p.key === spec.key);
    const starts = isoDaysFromNow(spec.days, spec.hour, spec.minute);
    const endsDate = new Date(starts);
    endsDate.setUTCMinutes(endsDate.getUTCMinutes() + 45);
    const slug = `abhi-${spec.key}-${spec.status}`.slice(0, 48);
    return {
      id: deterministicUuid(`abhi-booking:${spec.key}:${spec.status}`),
      workspace_id: workspaceId,
      name: prospect.contact,
      organization: prospect.company,
      role: prospect.role,
      email: prospect.email,
      starts_at: starts,
      ends_at: endsDate.toISOString(),
      client_timezone: TZ,
      status: spec.status,
      meeting_slug: slug,
      video_link: `https://abhi.unit311central.com/meet/video/${slug}`,
      crm_lead_id: deterministicUuid(`abhi-crm-lead:${spec.key}`),
    };
  });

  {
    const { error } = await admin.from("founder_session_bookings").insert(bookingRows);
    if (error) throw new Error(`founder_session_bookings: ${error.message}`);
  }

  const onboardingSpecs = [
    { key: "oxbridge-medtech", stage: "platform_live", daysAgo: 42 },
    { key: "cambridge-diagnostics", stage: "review_complete", daysAgo: 21 },
    { key: "scottish-health-analytics", stage: "platform_clone_complete", daysAgo: 14 },
    { key: "thames-nhs-frameworks", stage: "questionnaire_complete", daysAgo: 9 },
    { key: "midlands-surgical", stage: "payment_received", daysAgo: 4 },
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
      id: deterministicUuid(`abhi-onboarding:${spec.key}`),
      workspace_id: workspaceId,
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

  const { data: projects, error: projErr } = await admin
    .from("internal_projects")
    .select("id, name, client_id, operator, start_date, end_date, progress_pct, workspace_id")
    .eq("workspace_id", workspaceId)
    .order("start_date");
  if (projErr) throw new Error(`internal_projects: ${projErr.message}`);
  if (!projects?.length) {
    throw new Error("No ABHI internal_projects found — run scripts/seed-abhi-ops-data.mjs first");
  }

  await wipeProjectTasks(
    admin,
    workspaceId,
    projects.map((p) => p.id),
  );

  const taskRows = projects.flatMap((project) => buildProjectTasks(project));
  for (let i = 0; i < taskRows.length; i += 50) {
    const batch = taskRows.slice(i, i + 50);
    const { error } = await admin.from("internal_project_tasks").insert(batch);
    if (error) throw new Error(`internal_project_tasks: ${error.message}`);
  }

  return {
    pipelineLeads: leadRows.length,
    discoveryDemos: bookingRows.length,
    clientOnboarding: onboardingRows.length,
    projects: projects.length,
    projectTasks: taskRows.length,
  };
}

async function seedViaManagement(query, workspaceId) {
  await query(`
    delete from public.founder_session_bookings where workspace_id = ${sqlEscape(workspaceId)};
    delete from public.client_onboarding_records where workspace_id = ${sqlEscape(workspaceId)};
    delete from public.crm_leads where workspace_id = ${sqlEscape(workspaceId)};
  `);

  const leadValues = PROSPECTS.map((p, index) => {
    const names = splitName(p.contact);
    const id = deterministicUuid(`abhi-crm-lead:${p.key}`);
    return `(
      ${sqlEscape(id)}::uuid,
      ${sqlEscape(workspaceId)}::uuid,
      ${sqlEscape(p.company)},
      ${sqlEscape(p.contact)},
      ${sqlEscape(names.first)},
      ${sqlEscape(names.surname)},
      ${sqlEscape(p.role)},
      ${sqlEscape(p.email)},
      ${sqlEscape(p.phone)},
      ${sqlEscape(p.status)},
      ${sqlEscape(p.source)},
      ${sqlEscape(p.next)},
      ${sqlEscape(dateDaysFromNow(2 + (index % 8)))}::date,
      ${sqlEscape(p.value)}::numeric,
      ${sqlEscape(`${p.company} · UK HealthTech / NHS supplier prospect · ${SEED_TAG}`)},
      ${p.discovery ? sqlEscape(discoveryHtml(p.company, p.contact)) : "null"},
      ${sqlEscape(isoDaysFromNow(-(30 - index * 3)))}::timestamptz,
      ${sqlEscape(isoDaysFromNow(-(index % 5)))}::timestamptz
    )`;
  }).join(",\n");

  await query(`
    insert into public.crm_leads (
      id, workspace_id, company_name, contact_name, first_name, surname, role, email, phone,
      status, source, next_action, next_action_date, estimated_value, notes, discovery_notes,
      created_at, updated_at
    ) values ${leadValues};
  `);

  const demoSpecs = [
    { key: "oxbridge-medtech", days: 4, status: "scheduled", hour: 9, minute: 30 },
    { key: "cambridge-diagnostics", days: 7, status: "scheduled", hour: 11, minute: 0 },
    { key: "scottish-health-analytics", days: 10, status: "scheduled", hour: 14, minute: 15 },
    { key: "thames-nhs-frameworks", days: 14, status: "scheduled", hour: 10, minute: 45 },
    { key: "midlands-surgical", days: -6, status: "completed", hour: 15, minute: 30 },
  ];

  const bookingValues = demoSpecs.map((spec) => {
    const prospect = PROSPECTS.find((p) => p.key === spec.key);
    const starts = isoDaysFromNow(spec.days, spec.hour, spec.minute);
    const ends = new Date(starts);
    ends.setUTCMinutes(ends.getUTCMinutes() + 45);
    const slug = `abhi-${spec.key}-${spec.status}`.slice(0, 48);
    return `(
      ${sqlEscape(deterministicUuid(`abhi-booking:${spec.key}:${spec.status}`))}::uuid,
      ${sqlEscape(workspaceId)}::uuid,
      ${sqlEscape(prospect.contact)},
      ${sqlEscape(prospect.company)},
      ${sqlEscape(prospect.role)},
      ${sqlEscape(prospect.email)},
      ${sqlEscape(starts)}::timestamptz,
      ${sqlEscape(ends.toISOString())}::timestamptz,
      ${sqlEscape(TZ)},
      ${sqlEscape(spec.status)},
      ${sqlEscape(slug)},
      ${sqlEscape(`https://abhi.unit311central.com/meet/video/${slug}`)},
      ${sqlEscape(deterministicUuid(`abhi-crm-lead:${spec.key}`))}::uuid
    )`;
  }).join(",\n");

  await query(`
    insert into public.founder_session_bookings (
      id, workspace_id, name, organization, role, email, starts_at, ends_at,
      client_timezone, status, meeting_slug, video_link, crm_lead_id
    ) values ${bookingValues};
  `);

  const onboardingSpecs = [
    { key: "oxbridge-medtech", stage: "platform_live", daysAgo: 42 },
    { key: "cambridge-diagnostics", stage: "review_complete", daysAgo: 21 },
    { key: "scottish-health-analytics", stage: "platform_clone_complete", daysAgo: 14 },
    { key: "thames-nhs-frameworks", stage: "questionnaire_complete", daysAgo: 9 },
    { key: "midlands-surgical", stage: "payment_received", daysAgo: 4 },
  ];
  const stageOrder = [
    "signed_up",
    "payment_received",
    "questionnaire_complete",
    "platform_clone_complete",
    "review_complete",
    "platform_live",
  ];

  const onboardingValues = onboardingSpecs.map((spec) => {
    const prospect = PROSPECTS.find((p) => p.key === spec.key);
    const signedUpAt = isoDaysFromNow(-spec.daysAgo);
    const stageIndex = stageOrder.indexOf(spec.stage);
    const stamp = (index) =>
      index <= stageIndex ? isoDaysFromNow(-(spec.daysAgo - index * 2)) : null;
    return `(
      ${sqlEscape(deterministicUuid(`abhi-onboarding:${spec.key}`))}::uuid,
      ${sqlEscape(workspaceId)}::uuid,
      ${sqlEscape(prospect.company)},
      ${sqlEscape(prospect.contact)},
      ${sqlEscape(prospect.email)},
      ${sqlEscape(signedUpAt.slice(0, 10))}::date,
      ${sqlEscape(spec.stage)},
      ${sqlEscape(STAGE_PROGRESS[spec.stage])}::integer,
      ${sqlEscape(spec.stage === "platform_live" ? "Platform Live" : "In Progress")},
      ${sqlEscape(stamp(0) || signedUpAt)}::timestamptz,
      ${sqlEscape(ACTOR)},
      ${stamp(1) ? `${sqlEscape(stamp(1))}::timestamptz` : "null"},
      ${stamp(1) ? sqlEscape(ACTOR) : "null"},
      ${stamp(2) ? `${sqlEscape(stamp(2))}::timestamptz` : "null"},
      ${stamp(2) ? sqlEscape(ACTOR) : "null"},
      ${stamp(3) ? `${sqlEscape(stamp(3))}::timestamptz` : "null"},
      ${stamp(3) ? sqlEscape(ACTOR) : "null"},
      ${stamp(4) ? `${sqlEscape(stamp(4))}::timestamptz` : "null"},
      ${stamp(4) ? sqlEscape(ACTOR) : "null"},
      ${stamp(5) ? `${sqlEscape(stamp(5))}::timestamptz` : "null"},
      ${stamp(5) ? sqlEscape(ACTOR) : "null"},
      ${sqlEscape(signedUpAt)}::timestamptz,
      ${sqlEscape(isoDaysFromNow(-1))}::timestamptz
    )`;
  }).join(",\n");

  await query(`
    insert into public.client_onboarding_records (
      id, workspace_id, company_name, contact_name, contact_email, signup_date,
      current_stage, progress_percent, current_status,
      signed_up_at, signed_up_by,
      payment_received_at, payment_received_by,
      questionnaire_complete_at, questionnaire_complete_by,
      platform_clone_complete_at, platform_clone_complete_by,
      review_complete_at, review_complete_by,
      platform_live_at, platform_live_by,
      created_at, updated_at
    ) values ${onboardingValues};
  `);

  const projectsResult = await query(`
    select id, name, client_id, operator, start_date, end_date, progress_pct, workspace_id
    from public.internal_projects
    where workspace_id = ${sqlEscape(workspaceId)}::uuid
    order by start_date;
  `);
  const projects = Array.isArray(projectsResult) ? projectsResult : [];
  if (!projects.length) {
    throw new Error("No ABHI internal_projects found — run scripts/seed-abhi-ops-data.mjs first");
  }

  const projectIds = projects.map((p) => sqlEscape(p.id)).join(", ");
  await query(`
    delete from public.internal_project_tasks
    where workspace_id = ${sqlEscape(workspaceId)}::uuid
      and project_id in (${projectIds});
  `);

  const taskRows = projects.flatMap((project) => buildProjectTasks(project));
  const taskValues = taskRows
    .map(
      (task) => `(
      ${sqlEscape(task.id)},
      ${sqlEscape(task.project_id)},
      ${sqlEscape(task.workspace_id)}::uuid,
      ${sqlEscape(task.name)},
      ${sqlEscape(task.start_date)}::date,
      ${sqlEscape(task.due_date)}::date,
      ${sqlEscape(task.progress)}::numeric,
      ${sqlEscape(task.resource)},
      ${sqlEscape(task.milestone)}::boolean,
      ${sqlEscape(task.critical)}::boolean,
      ${sqlEscape(task.sort_order)}::integer
    )`,
    )
    .join(",\n");

  await query(`
    insert into public.internal_project_tasks (
      id, project_id, workspace_id, name, start_date, due_date, progress, resource,
      milestone, critical, sort_order
    ) values ${taskValues};
  `);

  return {
    pipelineLeads: PROSPECTS.length,
    discoveryDemos: demoSpecs.length,
    clientOnboarding: onboardingSpecs.length,
    projects: projects.length,
    projectTasks: taskRows.length,
  };
}

async function verifyIsolation(admin, abhiWorkspaceId) {
  for (const slug of ["demo", "corpcentre", "internal"]) {
    const { data: other } = await admin.from("workspaces").select("id").eq("slug", slug).maybeSingle();
    if (!other?.id) continue;
    const { count } = await admin
      .from("crm_leads")
      .select("*", { count: "exact", head: true })
      .eq("workspace_id", other.id)
      .ilike("notes", `%${SEED_TAG}%`);
    if (count) throw new Error(`CRM leak into ${slug}: ${count}`);
  }

  const { count: abhiLeads } = await admin
    .from("crm_leads")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", abhiWorkspaceId);
  const { count: abhiMeetings } = await admin
    .from("founder_session_bookings")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", abhiWorkspaceId);
  const { count: abhiOnboarding } = await admin
    .from("client_onboarding_records")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", abhiWorkspaceId);
  const { count: abhiTasks } = await admin
    .from("internal_project_tasks")
    .select("*", { count: "exact", head: true })
    .eq("workspace_id", abhiWorkspaceId);

  return {
    crmLeads: abhiLeads,
    meetings: abhiMeetings,
    onboarding: abhiOnboarding,
    projectTasks: abhiTasks,
  };
}

async function main() {
  const client = await resolveAdminClient();
  console.log(`Credential mode: ${client.mode}`);

  let workspace;
  let summary;
  let verify;

  if (client.mode === "supabase") {
    workspace = await assertAbhiWorkspace(client.admin);
    console.log("ABHI workspace", workspace.id, workspace.slug);
    summary = await seedViaSupabase(client.admin, workspace.id);
    verify = await verifyIsolation(client.admin, workspace.id);
  } else {
    const wsResult = await client.query(`
      select id, slug, name from public.workspaces where slug = ${sqlEscape(SLUG)} limit 1;
    `);
    workspace = Array.isArray(wsResult) ? wsResult[0] : null;
    if (!workspace?.id) throw new Error("ABHI workspace missing");
    if (FORBIDDEN.has(String(workspace.slug).toLowerCase())) {
      throw new Error(`Refusing protected workspace ${workspace.slug}`);
    }
    console.log("ABHI workspace", workspace.id, workspace.slug);
    summary = await seedViaManagement(client.query, workspace.id);
    verify = {
      crmLeads: summary.pipelineLeads,
      meetings: summary.discoveryDemos,
      onboarding: summary.clientOnboarding,
      projectTasks: summary.projectTasks,
    };
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        mode: client.mode,
        workspaceId: workspace.id,
        workspaceSlug: workspace.slug,
        ...summary,
        verify,
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
