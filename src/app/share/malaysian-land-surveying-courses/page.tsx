import type { Metadata } from "next";

import { fileTypeLabel, formatFileSize } from "@/lib/internal-files-data";
import { listMalaysianLandSurveyCourseFiles } from "@/lib/course/malaysian-land-survey-courses-share";
import {
  MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH,
  publicCourseFileDownloadPath,
} from "@/lib/course/malaysian-land-survey-courses-share-path";
import { createPageMetadata } from "@/lib/metadata";

export const metadata: Metadata = createPageMetadata({
  title: "Malaysian Land Surveying Courses",
  description: "Course files for the Malaysian land surveying courses.",
  path: MALAYSIAN_LAND_SURVEY_COURSES_SHARE_PATH,
  index: false,
  follow: false,
});

export const dynamic = "force-dynamic";

export default async function MalaysianLandSurveyCoursesSharePage() {
  const listing = await listMalaysianLandSurveyCourseFiles();

  return (
    <div className="min-h-screen bg-[#f4f7f5] text-slate-900">
      <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#1a4d3a]">
            WOLF course files
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Malaysian Land Surveying Courses
          </h1>
          <p className="mt-3 text-base text-slate-700">
            Open this page to see the course files and download them. No sign-in is required.
          </p>
        </header>

        {listing && listing.files.length > 0 ? (
          <ul className="space-y-3">
            {listing.files.map((file) => (
              <li
                key={file.id}
                className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-base font-semibold text-slate-950">{file.name}</p>
                  <p className="mt-1 text-sm text-slate-600">
                    {fileTypeLabel(file.extension, file.mimeType)} · {formatFileSize(file.sizeBytes)}
                  </p>
                </div>
                <a
                  href={publicCourseFileDownloadPath(file.id)}
                  className="inline-flex items-center justify-center rounded-xl bg-[#1a4d3a] px-5 py-3 text-sm font-semibold text-white hover:bg-[#143d2e]"
                >
                  Download
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white px-6 py-10 shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">No files yet</h2>
            <p className="mt-3 text-base text-slate-700">
              This folder does not have any files to download.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
