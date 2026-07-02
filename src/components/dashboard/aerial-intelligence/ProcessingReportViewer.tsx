"use client";

import type { WebODMDeliverablesMission } from "@/lib/webodm-deliverables";

import ViewerCard from "./ViewerCard";

type ProcessingReportViewerProps = {
  reportPdfUrl: string;
  mission: WebODMDeliverablesMission;
};

export default function ProcessingReportViewer({
  reportPdfUrl,
  mission,
}: ProcessingReportViewerProps) {
  return (
    <ViewerCard
      title="Processing Report"
      description={`Photogrammetry quality summary for ${mission.name}.`}
      badge="Live"
      badgeClassName="border-red-400/30 bg-red-500/10 text-red-300"
    >
      <iframe
        src={reportPdfUrl}
        title={`Processing report — ${mission.name}`}
        className="h-[min(72vh,720px)] w-full border-0 bg-white"
      />
    </ViewerCard>
  );
}
