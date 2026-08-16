"use client";

import { useCallback, useRef, useState, startTransition } from "react";
import { Loader2, Plus, Sparkles, Upload } from "lucide-react";

import CourseReviewScreen from "@/components/lms/CourseReviewScreen";
import type { LmsCourseTree } from "@/lib/lms/types";
import { resolveCourseBuilderBrand } from "@/lib/lms/course-builder-brand";
import { cn } from "@/lib/utils";
import CreateCourseWizard from "./CreateCourseWizard";
import WorkspaceErrorBoundary from "./WorkspaceErrorBoundary";
import { TqmsSection, tqmsPrimaryButtonClass, tqmsSecondaryButtonClass } from "./tqms-ui";

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

export default function CourseBuilderWorkspace() {
  const brand = resolveCourseBuilderBrand();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [reviewCourse, setReviewCourse] = useState<LmsCourseTree | null>(null);
  const [reviewSummary, setReviewSummary] = useState<GenerationSummary | null>(null);
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [draftCount, setDraftCount] = useState(0);

  const reloadDraftCount = useCallback(async () => {
    try {
      const response = await fetch("/api/lms/courses?all=1", {
        cache: "no-store",
        credentials: "include",
      });
      if (!response.ok) return;
      const data = (await response.json()) as { courses?: unknown[] };
      setDraftCount(Array.isArray(data.courses) ? data.courses.length : 0);
    } catch {
      // LMS catalogue optional on demo / internal mock workspaces.
    }
  }, []);

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
      void reloadDraftCount();
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Course generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <WorkspaceErrorBoundary title="Course Builder">
      <div className="space-y-5">
        {notice ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {notice}
          </p>
        ) : null}

        <header>
          <h1 className="text-2xl font-semibold text-white">Course Builder</h1>
          <p className="mt-1 text-sm text-white/60">
            Central place to upload documents and build courses for {brand.orgName}.
          </p>
        </header>

        <div
          className={cn(
            "rounded-3xl border bg-gradient-to-br p-5",
            brand.accentBorder,
            brand.accentGradient,
          )}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={cn(
                  "inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em]",
                  brand.accentText,
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {brand.generatorLabel}
              </p>
              <h2 className="mt-2 text-lg font-semibold text-white">
                Upload a document — get a complete interactive course
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-white/55">{brand.description}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={generating}
                onClick={() => fileInputRef.current?.click()}
                className={cn(tqmsPrimaryButtonClass(), "inline-flex items-center gap-2")}
              >
                {generating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {generating ? "Building course…" : "Upload PDF / Word"}
              </button>
              <button
                type="button"
                onClick={() => setWizardOpen(true)}
                className={cn(tqmsSecondaryButtonClass(), "inline-flex items-center gap-2")}
              >
                <Plus className="h-4 w-4" />
                Manual builder
              </button>
            </div>
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
        </div>

        <TqmsSection
          title="Published & draft courses"
          subtitle="Courses created here appear in Staff Courses and the LMS player."
        >
          <p className="text-sm text-white/55">
            {draftCount > 0
              ? `${draftCount} course${draftCount === 1 ? "" : "s"} in the LMS catalogue.`
              : "Upload a document or use the manual builder to create your first course."}
          </p>
        </TqmsSection>

        {wizardOpen ? (
          <CreateCourseWizard
            suggestedCode={`${brand.codePrefix}-${String(draftCount + 1).padStart(3, "0")}`}
            onClose={() => setWizardOpen(false)}
            onSubmit={(course) => {
              setWizardOpen(false);
              setNotice(
                course.status === "Published"
                  ? `"${course.title}" published to Staff Courses.`
                  : `"${course.title}" draft saved in the course builder.`,
              );
              void reloadDraftCount();
            }}
          />
        ) : null}

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
              setNotice(`“${slug}” published. Open it from Staff Courses when ready.`);
              startTransition(() => {
                void reloadDraftCount();
              });
            }}
          />
        ) : null}
      </div>
    </WorkspaceErrorBoundary>
  );
}
