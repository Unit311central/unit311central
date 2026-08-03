"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import {
  TALANTON_COMPLIANCE_COURSES,
  courseTitleById,
} from "@/lib/talanton/portfolio-data";
import {
  buildCompanyLearningRows,
  buildTrainingExecutiveSummary,
  type CompanyLearningRow,
} from "@/lib/talanton/training-phase2";
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

export default function TalantonPortfolioCoursesWorkspace() {
  const summary = useMemo(() => buildTrainingExecutiveSummary(), []);
  const rows = useMemo(() => buildCompanyLearningRows(), []);
  const [query, setQuery] = useState("");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | CompanyLearningRow["status"]>("all");
  const [certFilter, setCertFilter] = useState<"all" | "has" | "none">("all");
  const [sort, setSort] = useState<"completion-asc" | "completion-desc" | "name">("completion-asc");

  const filtered = useMemo(() => {
    let list = rows.filter((r) => {
      if (companyFilter !== "all" && r.company.id !== companyFilter) return false;
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
    if (courseFilter !== "all") {
      // Demo: surface companies with lower completion as needing that course attention
      list = list.filter((r) => r.completionPct < 95 || courseFilter === TALANTON_COMPLIANCE_COURSES[0]?.id);
    }
    list = [...list].sort((a, b) => {
      if (sort === "name") return a.company.name.localeCompare(b.company.name);
      if (sort === "completion-desc") return b.completionPct - a.completionPct;
      return a.completionPct - b.completionPct;
    });
    return list;
  }, [rows, query, companyFilter, courseFilter, statusFilter, certFilter, sort]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5 overflow-auto p-5 sm:p-6">
      <TalantonIntelligenceHeader
        moduleLabel="Training"
        title="Portfolio Courses"
        description="Company-centric learning view across Talanton holdings — assignments, completion, certifications and last activity by portfolio company."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <TalantonImpactMetric label="Portfolio companies" value={summary.portfolioCompanies} />
        <TalantonImpactMetric label="Active learners" value={summary.activeLearners.toLocaleString()} />
        <TalantonImpactMetric label="Courses assigned" value={summary.coursesAssigned.toLocaleString()} />
        <TalantonImpactMetric label="Courses completed" value={summary.coursesCompleted.toLocaleString()} tone="good" />
        <TalantonImpactMetric label="Certifications earned" value={summary.certificationsEarned} />
      </div>

      <section className="rounded-2xl border border-white/10 bg-black/20 p-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <label className="relative xl:col-span-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              className={cn(selectClass, "w-full pl-9")}
              placeholder="Search portfolio companies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <select className={selectClass} value={companyFilter} onChange={(e) => setCompanyFilter(e.target.value)}>
            <option value="all">All companies</option>
            {rows.map((r) => (
              <option key={r.company.id} value={r.company.id}>
                {r.company.name}
              </option>
            ))}
          </select>
          <select className={selectClass} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
            <option value="all">All courses</option>
            {TALANTON_COMPLIANCE_COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
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
        </div>
        <div className="mt-3">
          <select className={selectClass} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="completion-asc">Sort: completion (low → high)</option>
            <option value="completion-desc">Sort: completion (high → low)</option>
            <option value="name">Sort: company name</option>
          </select>
        </div>
      </section>

      <div className="space-y-3">
        {filtered.map((r) => (
          <article
            key={r.company.id}
            className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#0f2a1f]/40 via-[#0b1a14]/80 to-[#08110d] p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-base font-semibold text-white">{r.company.name}</h3>
                  <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", statusClass(r.status))}>
                    {r.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/45">
                  {r.company.country} · {r.company.sector} · Last activity {r.lastActivity}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-semibold tabular-nums text-emerald-200">{r.completionPct}%</p>
                <p className="text-[11px] text-white/40">Completion</p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
              <div
                className={cn(
                  "h-full rounded-full",
                  r.completionPct >= 90
                    ? "bg-emerald-400"
                    : r.completionPct >= 70
                      ? "bg-amber-400"
                      : "bg-rose-400",
                )}
                style={{ width: `${r.completionPct}%` }}
              />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">Assigned</p>
                <p className="mt-1 text-lg font-semibold text-white">{r.assigned}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">Completed</p>
                <p className="mt-1 text-lg font-semibold text-white">{r.completed}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">In progress</p>
                <p className="mt-1 text-lg font-semibold text-white">{r.inProgress}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5">
                <p className="text-[10px] uppercase tracking-wide text-white/40">Certifications</p>
                <p className="mt-1 text-lg font-semibold text-white">{r.certifications}</p>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/20 px-3 py-2.5 sm:col-span-2 xl:col-span-1">
                <p className="text-[10px] uppercase tracking-wide text-white/40">Focus course</p>
                <p className="mt-1 truncate text-sm text-white/75">
                  {courseTitleById(TALANTON_COMPLIANCE_COURSES[0]!.id)}
                </p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
