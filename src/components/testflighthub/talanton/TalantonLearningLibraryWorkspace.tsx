"use client";

import { useCallback, useEffect, useMemo, useState, startTransition } from "react";
import { Loader2 } from "lucide-react";

import LmsCoursePlayerOverlay from "@/components/lms/LmsCoursePlayerOverlay";
import {
  fetchPublishedLmsCoursesWithStats,
  formatLmsDurationHours,
  summarizeLmsDescription,
} from "@/lib/lms/fetch-published-courses";
import type { LmsCourseListItem } from "@/lib/lms/types";
import { LEARNING_CATEGORIES } from "@/lib/talanton/training-phase2";
import { cn } from "@/lib/utils";
import { TalantonIntelligenceHeader } from "./talanton-intelligence-ui";

const selectClass =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-emerald-400/40";

export default function TalantonLearningLibraryWorkspace() {
  const [category, setCategory] = useState<string>("all");
  const [audience, setAudience] = useState<"all" | "Internal Staff" | "Portfolio Companies" | "Both">(
    "all",
  );
  const [courses, setCourses] = useState<LmsCourseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [launchSlug, setLaunchSlug] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await fetchPublishedLmsCoursesWithStats();
      setCourses(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load library.");
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    startTransition(() => {
      void reload();
    });
  }, [reload]);

  const categoryOptions = useMemo(() => {
    const fromCourses = [...new Set(courses.map((course) => course.category).filter(Boolean))].sort(
      (a, b) => a.localeCompare(b),
    );
    return [...new Set([...LEARNING_CATEGORIES, ...fromCourses])];
  }, [courses]);

  const filtered = useMemo(() => {
    return courses.filter((course) => {
      if (category !== "all" && course.category !== category) return false;
      return true;
    });
  }, [courses, category]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Learning Library"
        description="Talanton-focused curricula for governance, leadership, financial management, impact measurement, ESG, operations and growth — for staff and portfolio companies."
      />

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <select
            className={selectClass}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="all">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
          >
            <option value="all">All audiences</option>
            <option value="Internal Staff">Internal staff</option>
            <option value="Portfolio Companies">Portfolio companies</option>
            <option value="Both">Both</option>
          </select>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setCategory("all")}
          className={cn(
            "rounded-full border px-3 py-1 text-xs",
            category === "all"
              ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
              : "border-white/10 text-white/50 hover:text-white",
          )}
        >
          All
        </button>
        {categoryOptions.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs",
              category === c
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-100"
                : "border-white/10 text-white/50 hover:text-white",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="inline-flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading published courses…
        </p>
      ) : null}

      {!loading && filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/15 px-4 py-8 text-center text-sm text-white/45">
          No published courses match this filter yet. Publish a course from Portfolio Courses to add
          it here.
        </p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((course) => {
          const durationHours = formatLmsDurationHours(course.durationMinutes);
          const moduleCount = course.moduleCount ?? 0;
          const hasCertification = course.passMark > 0;
          return (
            <article
              key={course.id}
              className="flex flex-col rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/45 via-[#0b1a14]/85 to-[#08110d] p-5"
            >
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/75">
                {course.category}
              </p>
              <h3 className="mt-2 text-base font-semibold text-white">{course.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/60">
                {summarizeLmsDescription(course.description)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                  Published
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                  {durationHours}h · {moduleCount} modules
                </span>
                <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/55">
                  Pass {course.passMark}%
                </span>
                {hasCertification ? (
                  <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-emerald-100">
                    Certification
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => setLaunchSlug(course.slug)}
                className="mt-4 inline-flex w-full items-center justify-center rounded-xl bg-emerald-500/90 py-2 text-sm font-semibold text-white hover:bg-emerald-400"
              >
                Open course
              </button>
            </article>
          );
        })}
      </div>

      {launchSlug ? (
        <LmsCoursePlayerOverlay courseSlug={launchSlug} onClose={() => setLaunchSlug(null)} />
      ) : null}
    </div>
  );
}
