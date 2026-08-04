"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";

import { isOaExternalCourse, OA_EXTERNAL_COURSES } from "@/lib/onwardair/training-data";
import { OaCourseCatalogueScroller } from "./OaCourseCatalogueScroller";
import { useTqmsMockStore } from "./useTqmsMockStore";
import { TqmsSection } from "./tqms-ui";

export default function ExternalTrainingWorkspace() {
  const store = useTqmsMockStore();
  const [launchCourseId, setLaunchCourseId] = useState<string | null>(null);

  const courses = useMemo(() => {
    const fromStore = store.courses
      .filter(isOaExternalCourse)
      .sort((a, b) => a.title.localeCompare(b.title));
    return fromStore.length > 0
      ? fromStore
      : [...OA_EXTERNAL_COURSES].sort((a, b) => a.title.localeCompare(b.title));
  }, [store.courses]);

  return (
    <div className="space-y-5">
      <TqmsSection
        title="External Courses"
        subtitle="Vendor, regulator, and third-party programmes — open the interactive overview scroller, then enrol with the provider."
        actions={
          <span className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-white/50">
            <ExternalLink className="h-3.5 w-3.5 text-amber-300" />
            {courses.length} catalogue items
          </span>
        }
      >
        <OaCourseCatalogueScroller
          title="External catalogue"
          subtitle="Horizontal course strip + launch into the LMS lesson scroller."
          courses={courses}
          emptyMessage="No external courses seeded for this workspace."
          launchCourseId={launchCourseId}
          onLaunch={setLaunchCourseId}
          onClosePlayer={() => setLaunchCourseId(null)}
        />
      </TqmsSection>
    </div>
  );
}
