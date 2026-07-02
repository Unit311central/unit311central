"use client";

import { useEffect, useState } from "react";

import DsmElevationViewer from "@/components/dashboard/aerial-intelligence/DsmElevationViewer";
import MissionIntelBar from "@/components/dashboard/aerial-intelligence/MissionIntelBar";
import MissionReplayPlayer from "@/components/dashboard/aerial-intelligence/MissionReplayPlayer";
import ModelViewer3D from "@/components/dashboard/aerial-intelligence/ModelViewer3D";
import OrthomosaicViewer from "@/components/dashboard/aerial-intelligence/OrthomosaicViewer";
import PointCloudComingSoon from "@/components/dashboard/aerial-intelligence/PointCloudComingSoon";
import ProcessingReportViewer from "@/components/dashboard/aerial-intelligence/ProcessingReportViewer";
import {
  BRIGHTON_BEACH_TASK_NAME,
  type AerialIntelligenceWorkspace,
} from "@/lib/webodm-deliverables";
import { Loader2 } from "lucide-react";

type WorkspaceResponse = {
  configured: boolean;
  error?: string;
  dashboardUrl?: string;
} & Partial<AerialIntelligenceWorkspace>;

export default function AerialIntelligenceSection() {
  const [loading, setLoading] = useState(true);
  const [response, setResponse] = useState<WorkspaceResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWorkspace() {
      setLoading(true);

      try {
        const res = await fetch(
          `/api/webodm/deliverables?task=${encodeURIComponent(BRIGHTON_BEACH_TASK_NAME)}`,
          { cache: "no-store" },
        );
        const data = (await res.json()) as WorkspaceResponse;

        if (!cancelled) {
          setResponse(data);
        }
      } catch {
        if (!cancelled) {
          setResponse({
            configured: false,
            error: "Could not reach the aerial intelligence workspace.",
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadWorkspace();

    return () => {
      cancelled = true;
    };
  }, []);

  const mission = response?.mission;

  return (
    <section className="space-y-6" aria-label="Aerial intelligence workspace">
      <MissionReplayPlayer />

      {loading ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0D1B2A]/80 px-4 py-8 shadow-[0_20px_48px_rgba(0,0,0,0.28)] sm:px-6">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading live survey viewers from WebODM…
          </div>
        </div>
      ) : response?.error ? (
        <div className="rounded-2xl border border-white/[0.07] bg-[#0D1B2A]/80 px-4 py-5 shadow-[0_20px_48px_rgba(0,0,0,0.28)] sm:px-6">
          <p className="rounded-xl border border-red-400/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {response.error}
          </p>
        </div>
      ) : mission ? (
        <>
          <MissionIntelBar mission={mission} />

          <div className="space-y-5">
            {response?.orthophoto ? <OrthomosaicViewer config={response.orthophoto} /> : null}

            {response?.dsm || response?.dsmGeotiffUrl ? (
              <DsmElevationViewer
                tileConfig={response.dsm ?? null}
                geotiffUrl={response.dsmGeotiffUrl ?? null}
              />
            ) : null}

            {response?.modelGlbUrl ? <ModelViewer3D modelUrl={response.modelGlbUrl} /> : null}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            {response?.reportPdfUrl ? (
              <ProcessingReportViewer reportPdfUrl={response.reportPdfUrl} mission={mission} />
            ) : null}
            {response?.hasPointCloud ? (
              <PointCloudComingSoon pointCount={mission.pointCount} />
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-sm text-white/45">No mission workspace is available.</p>
      )}
    </section>
  );
}
