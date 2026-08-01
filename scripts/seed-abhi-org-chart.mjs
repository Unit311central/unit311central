/**
 * ABHI-only: set manager_employee_id + departments for a live Org Chart hierarchy.
 *
 *   node scripts/seed-abhi-org-chart.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
  : fs.existsSync(path.join(root, ".env.unit311central.prod"))
    ? fs.readFileSync(path.join(root, ".env.unit311central.prod"), "utf8")
    : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

const PETER = "abhi-emp-peter-ellingworth";
const JANE = "abhi-emp-jane-lewis";
const ANDREW = "abhi-emp-andrew-davies";
const PHIL = "abhi-emp-phil-brown";
const PAUL = "abhi-emp-paul-benton";
const JONATHAN = "abhi-emp-jonathan-evans";
const LUELLA = "abhi-emp-luella-trickett";
const MICHELLE = "abhi-emp-michelle-michelucci";
const JUDITH = "abhi-emp-judith-mellis";

const LINKS = [
  { employeeId: PETER, department: "Leadership", managerEmployeeId: null },
  { employeeId: JANE, department: "Leadership", managerEmployeeId: PETER },
  { employeeId: ANDREW, department: "Digital Health", managerEmployeeId: PETER },
  { employeeId: "abhi-emp-rebecca-parkin", department: "Digital Health", managerEmployeeId: ANDREW },
  { employeeId: PHIL, department: "Regulatory", managerEmployeeId: PETER },
  { employeeId: PAUL, department: "International", managerEmployeeId: PETER },
  { employeeId: "abhi-emp-sophie-green", department: "International", managerEmployeeId: PAUL },
  { employeeId: JONATHAN, department: "Communications", managerEmployeeId: JANE },
  {
    employeeId: "abhi-emp-charlotte-hart",
    department: "Communications",
    managerEmployeeId: JONATHAN,
  },
  { employeeId: LUELLA, department: "Market Access", managerEmployeeId: JANE },
  {
    employeeId: "abhi-emp-owain-prescott",
    department: "Market Access",
    managerEmployeeId: LUELLA,
  },
  { employeeId: MICHELLE, department: "International Events", managerEmployeeId: JANE },
  { employeeId: JUDITH, department: "UK Market Affairs", managerEmployeeId: PETER },
  {
    employeeId: "abhi-emp-addie-macgregor",
    department: "Sustainability",
    managerEmployeeId: JANE,
  },
];

function managerDisplayName(employees, managerId) {
  if (!managerId) return "";
  return employees.find((e) => e.id === managerId)?.full_name ?? "";
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw wsErr;
  if (!ws) throw new Error("ABHI workspace not found");
  if (FORBIDDEN.has(String(ws.slug || "").toLowerCase())) {
    throw new Error(`Refusing to mutate forbidden slug ${ws.slug}`);
  }

  const { data: employees, error } = await admin
    .from("hr_employees")
    .select("id, full_name, role, department, manager, manager_employee_id, employment_status")
    .eq("workspace_id", ws.id);
  if (error) throw error;

  const byId = new Map((employees ?? []).map((e) => [e.id, e]));
  const linkById = new Map(LINKS.map((l) => [l.employeeId, l]));
  let updated = 0;
  let skipped = 0;

  for (const employee of employees ?? []) {
    if (employee.employment_status === "archived") {
      skipped += 1;
      continue;
    }

    const explicit = linkById.get(employee.id);
    let managerEmployeeId = explicit?.managerEmployeeId ?? null;
    let department = explicit?.department ?? employee.department ?? "ABHI";

    if (!explicit) {
      // Default: everyone else reports to CEO when present; otherwise leave as-is.
      if (employee.id !== PETER && byId.has(PETER)) {
        managerEmployeeId = PETER;
      } else if (employee.manager_employee_id && byId.has(employee.manager_employee_id)) {
        managerEmployeeId = employee.manager_employee_id;
      }
      if (!department || department === "ABHI") {
        const role = String(employee.role || "");
        if (/chief executive/i.test(role)) department = "Leadership";
        else if (/finance|operating|coo|cfo/i.test(role)) department = "Leadership";
        else if (/digital health/i.test(role)) department = "Digital Health";
        else if (/regulator/i.test(role)) department = "Regulatory";
        else if (/international/i.test(role)) department = "International";
        else if (/communicat|events executive/i.test(role)) department = "Communications";
        else if (/market access/i.test(role)) department = "Market Access";
        else if (/event/i.test(role)) department = "International Events";
        else if (/market affairs|nhs/i.test(role)) department = "UK Market Affairs";
        else if (/sustainab|ethics/i.test(role)) department = "Sustainability";
      }
    }

    const managerName = managerDisplayName(employees, managerEmployeeId);
    const { error: updErr } = await admin
      .from("hr_employees")
      .update({
        manager_employee_id: managerEmployeeId,
        manager: managerName,
        department,
      })
      .eq("id", employee.id)
      .eq("workspace_id", ws.id);

    if (updErr) {
      console.warn(`Failed ${employee.full_name}:`, updErr.message);
      skipped += 1;
    } else {
      updated += 1;
    }
  }

  console.log(
    JSON.stringify(
      {
        workspace: ws.slug,
        employees: employees?.length ?? 0,
        updated,
        skipped,
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
