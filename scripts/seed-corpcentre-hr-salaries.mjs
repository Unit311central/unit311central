/**
 * Seed CorpCentre HR salaries / bonuses in AUD + payroll settings.
 *
 * Leaders (Peter, Daniel): AU$250,000 / year monthly + AU$25,000 bonus in December
 * Other staff: AU$100,000 / year monthly + AU$5,000 bonus end of year
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8");
function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  return m ? m[1].trim().replace(/^["']|["']$/g, "") : "";
}

const WS = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";
const EFFECTIVE = "2026-01-01";

const LEADER_IDS = new Set(["cc-emp-peter-durning", "cc-emp-daniel-sazdanoff"]);
const LEADER_NAMES = /peter durning|daniel sazdanoff/i;

const admin = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false },
});

function packageFor(employee) {
  const isLeader =
    LEADER_IDS.has(employee.id) || LEADER_NAMES.test(String(employee.full_name || ""));
  if (isLeader) {
    return { salary: 250_000, bonus: 25_000, role: "leader" };
  }
  return { salary: 100_000, bonus: 5_000, role: "staff" };
}

async function main() {
  const { data: ws } = await admin.from("workspaces").select("id, slug").eq("id", WS).maybeSingle();
  if (!ws || !["corpcentre", "corporatecentre"].includes(String(ws.slug).toLowerCase())) {
    throw new Error(`Refusing non-corpcentre workspace: ${ws?.slug}`);
  }

  const { data: employees, error } = await admin
    .from("hr_employees")
    .select("id, full_name, email, employee_number, department, manager, date_joined, end_date")
    .eq("workspace_id", WS);
  if (error) throw new Error(error.message);
  if (!employees?.length) throw new Error("No CorpCentre employees found");

  // Workspace payroll settings — AUD, monthly, bonus paid late December.
  const { error: settingsErr } = await admin.from("payroll_settings").upsert(
    {
      workspace_id: WS,
      default_currency: "AUD",
      payroll_frequency: "monthly",
      pay_day: 28,
      bonus_pay_month: 12,
      bonus_pay_day: 31,
      country_code: "AU",
      default_tax_state: "NSW",
      federal_tax_pct: 0,
      state_tax_pct: 0,
      social_security_pct: 0,
      medicare_pct: 0,
      employer_payroll_pct: 11.5,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "workspace_id" },
  );
  if (settingsErr) throw new Error(`payroll_settings: ${settingsErr.message}`);

  // Clear prior compensation history for a clean seed.
  await admin.from("hr_employee_compensation_history").delete().eq("workspace_id", WS);

  const results = [];
  for (const employee of employees) {
    const pkg = packageFor(employee);
    const monthly = Math.round((pkg.salary / 12) * 100) / 100;

    const { error: empErr } = await admin
      .from("hr_employees")
      .update({
        currency: "AUD",
        salary_current: pkg.salary,
        bonus: pkg.bonus,
        pay_frequency: "monthly",
        salary_previous: 0,
        salary_increase_amount: 0,
        salary_increase_date: EFFECTIVE,
        updated_at: new Date().toISOString(),
      })
      .eq("id", employee.id)
      .eq("workspace_id", WS);
    if (empErr) throw new Error(`employee ${employee.full_name}: ${empErr.message}`);

    const { error: histErr } = await admin.from("hr_employee_compensation_history").insert([
      {
        id: randomUUID(),
        workspace_id: WS,
        employee_id: employee.id,
        category: "salary",
        amount: pkg.salary,
        currency: "AUD",
        effective_date: EFFECTIVE,
        reason: `Annual salary · paid monthly (AU$${monthly.toLocaleString("en-AU")}/mo)`,
        created_at: new Date().toISOString(),
      },
      {
        id: randomUUID(),
        workspace_id: WS,
        employee_id: employee.id,
        category: "bonus",
        amount: pkg.bonus,
        currency: "AUD",
        effective_date: EFFECTIVE,
        reason: "Annual bonus · paid December each year",
        created_at: new Date().toISOString(),
      },
    ]);
    if (histErr) throw new Error(`comp history ${employee.full_name}: ${histErr.message}`);

    const { data: existingProfile } = await admin
      .from("payroll_employee_profiles")
      .select("id")
      .eq("workspace_id", WS)
      .eq("employee_id", employee.id)
      .maybeSingle();

    const profileRow = {
      id: existingProfile?.id || randomUUID(),
      workspace_id: WS,
      employee_id: employee.id,
      annual_salary: pkg.salary,
      monthly_salary: monthly,
      bonus: pkg.bonus,
      commission: 0,
      payroll_frequency: "monthly",
      currency: "AUD",
      tax_state: "NSW",
      payroll_status: "active",
      bank_account: "",
      routing_number: "",
      payroll_employee_id: employee.employee_number || employee.id,
      tax_id: "",
      hire_date: employee.date_joined || EFFECTIVE,
      termination_date: employee.end_date || null,
      manager: employee.manager || "",
      department: employee.department || "",
      cost_centre: employee.department || "",
      updated_at: new Date().toISOString(),
    };

    const { error: profileErr } = await admin
      .from("payroll_employee_profiles")
      .upsert(profileRow, { onConflict: "workspace_id,employee_id" });
    if (profileErr) throw new Error(`profile ${employee.full_name}: ${profileErr.message}`);

    results.push({
      name: employee.full_name,
      role: pkg.role,
      salary: pkg.salary,
      bonus: pkg.bonus,
      monthly,
    });
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        count: results.length,
        operationalAnnual:
          results.reduce((s, r) => s + r.salary, 0) + results.reduce((s, r) => s + r.bonus, 0),
        results,
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
