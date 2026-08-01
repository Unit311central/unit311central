/**
 * Seed ABHI LMS catalog with the Talanton Assigned Courses programme.
 * - Clones full Anti-Bribery course content from talantonimpact → abhi (if present)
 * - Creates published stub courses for the remaining 10 titles
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

async function upsertStubCourse(workspaceId, def) {
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
        description: `${def.title} compliance training for ABHI staff.`,
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

  const module = await must(
    `module ${def.slug}`,
    await sb
      .from("lms_modules")
      .insert({
        workspace_id: workspaceId,
        course_id: course.id,
        title: "Introduction",
        sort_order: 1,
      })
      .select("*")
      .single(),
  );

  await must(
    `lesson ${def.slug}`,
    await sb.from("lms_lessons").insert({
      workspace_id: workspaceId,
      course_id: course.id,
      module_id: module.id,
      title: `Welcome to ${def.title}`,
      lesson_type: "rich_text",
      sort_order: 1,
      estimated_minutes: 5,
      content: {
        type: "rich_text",
        blocks: [
          { kind: "heading", level: 2, text: def.title },
          {
            kind: "paragraph",
            text: `This ABHI course pack is scheduled for full content authoring. The catalogue entry is live so staff can see the programme alongside Anti-Bribery & Corruption.`,
          },
          {
            kind: "callout",
            tone: "info",
            title: "Coming soon",
            text: "Full modules, scenarios, and final assessment will be added in the next course build.",
          },
        ],
      },
    }),
  );

  return course;
}

async function cloneAntiBribery(sourceWorkspaceId, targetWorkspaceId) {
  const { data: source } = await sb
    .from("lms_courses")
    .select("*")
    .eq("workspace_id", sourceWorkspaceId)
    .eq("slug", "anti-bribery")
    .maybeSingle();
  if (!source) {
    console.warn("Source anti-bribery course not found on talantonimpact — seeding stub instead");
    return upsertStubCourse(targetWorkspaceId, COURSES[0]);
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
          "Anti-bribery and corruption training for ABHI staff and leaders — adapted from the Talanton compliance programme.",
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
    await must(
      `clone lesson ${lesson.title}`,
      await sb.from("lms_lessons").insert({
        ...lessonFields,
        workspace_id: targetWorkspaceId,
        course_id: course.id,
        module_id: moduleIdMap.get(module_id) ?? null,
      }),
    );
  }

  const { data: questions } = await sb.from("lms_questions").select("*").eq("course_id", source.id);
  const qRows = (questions || []).map((q) => {
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
    };
  });
  for (let i = 0; i < qRows.length; i += 25) {
    await must(`clone questions ${i}`, await sb.from("lms_questions").insert(qRows.slice(i, i + 25)));
  }

  return course;
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
  for (const def of COURSES) {
    if (def.cloneFull && source?.id) {
      const course = await cloneAntiBribery(source.id, target.id);
      created.push({ slug: def.slug, id: course.id, mode: "cloned" });
    } else {
      const course = await upsertStubCourse(target.id, def);
      created.push({ slug: def.slug, id: course.id, mode: "stub" });
    }
  }

  const { count } = await sb
    .from("lms_courses")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", target.id);

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: TARGET_SLUG,
        courseCount: count,
        created,
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
