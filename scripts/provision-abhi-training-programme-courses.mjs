/**
 * Align ABHI LMS catalogue with the Training programme list:
 * publish drafts + rename titles to exact programme names.
 *
 *   node scripts/provision-abhi-training-programme-courses.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envText = fs.existsSync(path.join(root, ".env.corporatecentre.runtime"))
  ? fs.readFileSync(path.join(root, ".env.corporatecentre.runtime"), "utf8")
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

const sb = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Exact titles from the ABHI training programme list. */
const PROGRAMME = [
  {
    slug: "managing-medical-devices-training",
    title: "Managing Medical Devices Training",
    category: "Regulatory",
    durationMinutes: 60,
    sortOrder: 10,
  },
  {
    slug: "abhi-board-meeting-insights-august-2026",
    title: "ABHI Board Meeting Insights: August 2026",
    category: "Governance",
    durationMinutes: 45,
    sortOrder: 20,
  },
  {
    slug: "information-security",
    title: "Information Security",
    category: "Cyber & Privacy",
    durationMinutes: 50,
    sortOrder: 30,
  },
  {
    slug: "whistleblowing",
    title: "Whistleblowing",
    category: "Ethics & Integrity",
    durationMinutes: 25,
    sortOrder: 40,
  },
  {
    slug: "dei",
    title: "DEI",
    category: "People & Culture",
    durationMinutes: 40,
    sortOrder: 50,
  },
  {
    slug: "harassment-prevention",
    title: "Harassment Prevention",
    category: "People & Culture",
    durationMinutes: 35,
    sortOrder: 60,
  },
  {
    slug: "procurement-gifts-hospitality",
    title: "Procurement / Gifts & Hospitality",
    category: "Procurement",
    durationMinutes: 30,
    sortOrder: 70,
  },
  {
    slug: "health-and-safety",
    title: "Health & Safety",
    category: "Operations",
    durationMinutes: 45,
    sortOrder: 80,
  },
  {
    slug: "modern-slavery",
    title: "Modern Slavery",
    category: "Human Rights",
    durationMinutes: 40,
    sortOrder: 90,
  },
  {
    slug: "aml",
    title: "AML",
    category: "Financial Crime",
    durationMinutes: 40,
    sortOrder: 100,
  },
  {
    slug: "code-of-conduct",
    title: "Code of Conduct",
    category: "Ethics & Integrity",
    durationMinutes: 35,
    sortOrder: 110,
  },
  {
    slug: "conflicts-of-interest",
    title: "Conflicts of Interest",
    category: "Ethics & Integrity",
    durationMinutes: 30,
    sortOrder: 120,
  },
];

async function main() {
  const { data: ws, error: wsErr } = await sb
    .from("workspaces")
    .select("id, slug")
    .eq("slug", "abhi")
    .maybeSingle();
  if (wsErr || !ws) {
    console.error("ABHI workspace not found", wsErr?.message);
    process.exit(1);
  }

  const now = new Date().toISOString();
  const results = [];

  for (const item of PROGRAMME) {
    const { data: existing } = await sb
      .from("lms_courses")
      .select("id, slug, title, status")
      .eq("workspace_id", ws.id)
      .eq("slug", item.slug)
      .maybeSingle();

    if (!existing?.id) {
      results.push({ slug: item.slug, ok: false, error: "Course missing — run seed-abhi-lms-catalog.mjs first" });
      continue;
    }

    const { count: lessons } = await sb
      .from("lms_lessons")
      .select("id", { count: "exact", head: true })
      .eq("course_id", existing.id);

    if (!lessons) {
      results.push({ slug: item.slug, ok: false, error: "No lessons — cannot publish empty course" });
      continue;
    }

    const { data: updated, error } = await sb
      .from("lms_courses")
      .update({
        title: item.title,
        category: item.category,
        duration_minutes: item.durationMinutes,
        status: "published",
        sort_order: item.sortOrder,
        updated_at: now,
      })
      .eq("id", existing.id)
      .eq("workspace_id", ws.id)
      .select("id, slug, title, status")
      .single();

    if (error) {
      results.push({ slug: item.slug, ok: false, error: error.message });
      continue;
    }

    results.push({
      slug: item.slug,
      ok: true,
      before: { title: existing.title, status: existing.status },
      after: updated,
      lessons,
    });
  }

  // Also tidy anti-bribery title if present
  await sb
    .from("lms_courses")
    .update({ title: "Anti-Bribery & Corruption", updated_at: now })
    .eq("workspace_id", ws.id)
    .eq("slug", "anti-bribery");

  const { data: published } = await sb
    .from("lms_courses")
    .select("slug, title, status, sort_order")
    .eq("workspace_id", ws.id)
    .eq("status", "published")
    .order("sort_order");

  console.log(
    JSON.stringify(
      {
        ok: results.every((r) => r.ok),
        updated: results,
        publishedCatalogue: published,
      },
      null,
      2,
    ),
  );

  if (!results.every((r) => r.ok)) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
