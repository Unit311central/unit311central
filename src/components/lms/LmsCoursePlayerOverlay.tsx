"use client";

import CoursePlayer from "@/components/lms/CoursePlayer";
import WorkspaceErrorBoundary from "@/components/testflighthub/WorkspaceErrorBoundary";

export default function LmsCoursePlayerOverlay({
  courseSlug,
  onClose,
}: {
  courseSlug: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[90] bg-[#070d18]">
      <WorkspaceErrorBoundary title="Course player" onReset={onClose}>
        <CoursePlayer courseSlug={courseSlug} onClose={onClose} />
      </WorkspaceErrorBoundary>
    </div>
  );
}
