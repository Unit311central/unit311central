"use client";

import { useMemo, useRef, useState } from "react";
import { Loader2, Search, Sparkles, Upload } from "lucide-react";

import CourseReviewScreen from "@/components/lms/CourseReviewScreen";
import { TALANTON_COMPLIANCE_COURSES } from "@/lib/talanton/portfolio-data";
import {
  buildCompanyLearningRows,
  buildTrainingExecutiveSummary,
  type CompanyLearningRow,
} from "@/lib/talanton/training-phase2";
import type { LmsCourseTree } from "@/lib/lms/types";
import { cn } from "@/lib/utils";
import {
  TalantonImpactMetric,
  TalantonIntelligenceHeader,
} from "./talanton-intelligence-ui";

const selectClass =
  "rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80 outline-none focus:border-emerald-400/40";

function statusClass(status: CompanyLearningRow["status"]) {
  if (status === "On track") return "border-emerald-400/30 bg-emerald-500/10 text-emerald-100";
  if (status === "Watch") return "border-amber-400/30 bg-amber-500/10 text-amber-100";
  return "border-rose-400/30 bg-rose-500/10 text-rose-100";
}

function completionBarColor(pct: number) {
  if (pct >= 90) return "bg-emerald-400";
  if (pct >= 70) return "bg-amber-400";
  return "bg-rose-400";
}

type GenerationSummary = {
  title: string;
  durationMinutes: number;
  moduleCount: number;
  lessonCount: number;
  scenarioCount: number;
  assessmentCount: number;
  questionCount: number;
  certificateEnabled: boolean;
  learningObjectives?: string[];
};

export default function TalantonPortfolioCoursesWorkspace() {
  const summary = useMemo(() => buildTrainingExecutiveSummary(), []);
  const rows = useMemo(() => buildCompanyLearningRows(), []);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | CompanyLearningRow["status"]>("all");
  const [certFilter, setCertFilter] = useState<"all" | "has" | "none">("all");
  const [sort, setSort] = useState<"completion-asc" | "completion-desc" | "name">("completion-asc");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [reviewCourse, setReviewCourse] = useState<LmsCourseTree | null>(null);
  const [reviewSummary, setReviewSummary] = useState<GenerationSummary | null>(null);

  async function generateFromFile(file: File) {
    setGenerating(true);
    setGenError(null);
    setNotice(null);
    setLastFile(file);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/lms/generate-from-document", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = (await res.json()) as {
        course?: LmsCourseTree;
        summary?: GenerationSummary;
        error?: string;
      };
      if (!res.ok || !data.course || !data.summary) {
        throw new Error(data.error || "Course generation failed.");
      }
      setReviewCourse(data.course);
      setReviewSummary(data.summary);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Course generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  // Companies are never hidden by course selection — filters only narrow by
  // search text, completion status, and certification presence.
  const filteredCompanies = useMemo(() => {
    const list = rows.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (certFilter === "has" && r.certifications <= 0) return false;
      if (certFilter === "none" && r.certifications > 0) return false;
      if (query.trim()) {
        const q = query.toLowerCase();
        if (!r.company.name.toLowerCase().includes(q) && !r.company.country.toLowerCase().includes(q))
          return false;
      }
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "name") return a.company.name.localeCompare(b.company.name);
      if (sort === "completion-desc") return b.completionPct - a.completionPct;
      return a.completionPct - b.completionPct;
    });
  }, [rows, query, statusFilter, certFilter, sort]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Portfolio Courses"
        description="Compliance course catalogue and company-by-company learning coverage across every Talanton portfolio holding."
      />

      {notice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {notice}
        </div>
      ) : null}

      <section className="rounded-3xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
              <Sparkles className="h-3.5 w-3.5" />
              Talanton Impact AI Course Generator
            </p>
            <h3 className="mt-2 text-lg font-semibold text-white">
              Upload a policy — get a complete interactive course
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-white/55">
              PDF or Word (policies, handbooks, ESG, investment process, portfolio SOPs). AI builds
              modules, scenarios, assessments, and certificate settings for review.
            </p>
          </div>
          <button
            type="button"
            disabled={generating}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2.5 text-sm font-semibold text-emerald-50 hover:bg-emerald-500/30 disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {generating ? "Building course…" : "Upload PDF / Word"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void generateFromFile(file);
              e.target.value = "";
            }}
          />
        </div>
        {genError ? (
          <p className="mt-3 rounded-lg border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
            {genError}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TalantonImpactMetric label="Portfolio companies" value={summary.portfolioCompanies} />
        <TalantonImpactMetric label="Active learners" value={summary.activeLearners.toLocaleString()} />
        <TalantonImpactMetric label="Courses assigned" value={summary.coursesAssigned.toLocaleString()} />
        <TalantonImpactMetric label="Courses completed" value={summary.coursesCompleted.toLocaleString()} tone="good" />
        <TalantonImpactMetric label="Certifications earned" value={summary.certificationsEarned} />
      </div>

      {/* Courses */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">
          Courses <span className="text-white/40">({TALANTON_COMPLIANCE_COURSES.length})</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Category</th>
                <th className="py-2 pr-4 font-medium">Mandatory</th>
                <th className="py-2 pr-4 font-medium">Assigned companies</th>
                <th className="py-2 pr-4 font-medium">Completion</th>
              </tr>
            </thead>
            <tbody>
              {TALANTON_COMPLIANCE_COURSES.map((course) => (
                <tr key={course.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-4 text-white/85">{course.title}</td>
                  <td className="py-2.5 pr-4 text-white/60">{course.category}</td>
                  <td className="py-2.5 pr-4">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px]",
                        course.mandatory
                          ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                          : "border-white/15 bg-white/5 text-white/50",
                      )}
                    >
                      {course.mandatory ? "Mandatory" : "Optional"}
                    </span>
                  </td>
                  <td className="py-2.5 pr-4 tabular-nums text-white/70">{course.assignedCompanies}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn("h-full rounded-full", completionBarColor(course.completionPct))}
                          style={{ width: `${course.completionPct}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-white/70">{course.completionPct}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Portfolio companies */}
      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">
            Portfolio companies{" "}
            <span className="text-white/40">
              ({filteredCompanies.length} of {rows.length})
            </span>
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className={cn(selectClass, "w-full pl-9")}
              placeholder="Search portfolio companies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select
            className={selectClass}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          >
            <option value="all">All statuses</option>
            <option value="On track">On track</option>
            <option value="Watch">Watch</option>
            <option value="At risk">At risk</option>
          </select>
          <select
            className={selectClass}
            value={certFilter}
            onChange={(e) => setCertFilter(e.target.value as typeof certFilter)}
          >
            <option value="all">All certifications</option>
            <option value="has">Has certifications</option>
            <option value="none">No certifications</option>
          </select>
          <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="completion-asc">Sort: completion (low → high)</option>
            <option value="completion-desc">Sort: completion (high → low)</option>
            <option value="name">Sort: company name</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[820px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-[11px] uppercase tracking-wide text-white/40">
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Country</th>
                <th className="py-2 pr-4 font-medium">Assigned</th>
                <th className="py-2 pr-4 font-medium">Completed</th>
                <th className="py-2 pr-4 font-medium">In progress</th>
                <th className="py-2 pr-4 font-medium">Completion</th>
                <th className="py-2 pr-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredCompanies.map((r) => (
                <tr key={r.company.id} className="border-b border-white/5 last:border-0">
                  <td className="py-2.5 pr-4 text-white/85">{r.company.name}</td>
                  <td className="py-2.5 pr-4 text-white/60">{r.company.country}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-white/70">{r.assigned}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-white/70">{r.completed}</td>
                  <td className="py-2.5 pr-4 tabular-nums text-white/70">{r.inProgress}</td>
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={cn("h-full rounded-full", completionBarColor(r.completionPct))}
                          style={{ width: `${r.completionPct}%` }}
                        />
                      </div>
                      <span className="tabular-nums text-white/70">{r.completionPct}%</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4">
                    <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusClass(r.status))}>
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {reviewCourse && reviewSummary ? (
        <CourseReviewScreen
          course={reviewCourse}
          summary={reviewSummary}
          regenerating={generating}
          onClose={() => {
            setReviewCourse(null);
            setReviewSummary(null);
          }}
          onRegenerate={
            lastFile
              ? () => {
                  void generateFromFile(lastFile);
                }
              : undefined
          }
          onPublished={(slug) => {
            setReviewCourse(null);
            setReviewSummary(null);
            setNotice(`“${slug}” published. It is available in the LMS catalogue.`);
          }}
        />
      ) : null}
    </div>
  );
}
