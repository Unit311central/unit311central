"use client";

import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";

import WolfEstateMap from "@/components/wolf/WolfEstateMap";
import WolfEstateMetricsPanel from "@/components/wolf/WolfEstateMetrics";
import WolfReserveStatusCard from "@/components/wolf/WolfReserveStatusCard";
import WolfWatch from "@/components/wolf/WolfWatch";
import WolfRealtimeAiVisionCompact from "@/components/wolf-realtime-website/WolfRealtimeAiVisionCompact";
import { WolfStatusPill, wolfCardClass, wolfEyebrowClass } from "@/components/wolf/wolf-ui";
import { SHARK_TEST_VIDEOS } from "@/lib/wolf/shark/constants";
import { buildWolfRealtimeMarketingEstateSnapshot } from "@/lib/wolf-realtime-website/demo-estate";
import type { WolfReserveRecord } from "@/lib/wolf/central/types";
import { cn } from "@/lib/utils";

const flightArchitectureSteps = [
  { title: "Drone", detail: "Aerial camera · encoded video from reserve flights" },
  { title: "Field relay", detail: "BCN radio base · backhaul from the flight line" },
  {
    title: "Field operations",
    detail: "Mission Planner · QGroundControl · local monitoring (reference field stack)",
  },
  { title: "Connectivity", detail: "Satellite / IP uplink toward cloud processing" },
  { title: "Ingest", detail: "Video and telemetry received for WOLF intelligence pipelines" },
] as const;

const intelligencePipelineSteps = [
  "GPU model inference",
  "WOLF AI processing",
  "WOLF Intelligence",
  "Signals & events",
  "Operator review",
  "WOLF Central",
] as const;

function PipelineConnector({ className }: { className?: string }) {
  return (
    <div className={cn("flex justify-center py-3 sm:py-4", className)} aria-hidden>
      <div className="flex flex-col items-center gap-1 text-emerald-400/50">
        <span className="h-8 w-px bg-gradient-to-b from-emerald-400/40 to-emerald-400/10 wolf-realtime-flow-line" />
        <ChevronDown className="h-5 w-5 animate-pulse" strokeWidth={1.5} />
        <span className="h-8 w-px bg-gradient-to-b from-emerald-400/10 to-emerald-400/40 wolf-realtime-flow-line" />
      </div>
    </div>
  );
}

function DomainSummaryStrip({ reserve }: { reserve: WolfReserveRecord }) {
  const domains = [
    { label: "Animals", summary: reserve.animals },
    { label: "Containment", summary: reserve.containment },
    { label: "Environment", summary: reserve.environment },
    { label: "Drone ops", summary: reserve.droneOperations },
  ] as const;

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {domains.map((domain) => (
        <div
          key={domain.label}
          className="rounded-xl border border-white/[0.06] bg-black/20 px-3 py-2.5"
        >
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
              {domain.label}
            </p>
            <WolfStatusPill status={domain.summary.status} />
          </div>
          <p className="mt-1 text-sm text-white/80">{domain.summary.headline}</p>
        </div>
      ))}
    </div>
  );
}

function DroneOperationsSummary({ reserves }: { reserves: WolfReserveRecord[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {reserves.map((reserve) => (
        <div key={reserve.id} className={cn(wolfCardClass, "p-4")}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-white">{reserve.name}</p>
            <WolfStatusPill status={reserve.droneOperations.status} />
          </div>
          <p className="mt-2 text-sm text-white/75">{reserve.droneOperations.headline}</p>
          <p className="mt-2 text-xs text-white/45">
            Active {reserve.droneOperations.activeMissions ?? 0} · Completed{" "}
            {reserve.droneOperations.completedMissions ?? 0} · Failed{" "}
            {reserve.droneOperations.failedMissions ?? 0}
          </p>
        </div>
      ))}
    </div>
  );
}

function SharkEngineeringPanel() {
  return (
    <div className={cn(wolfCardClass, "bg-[#071018] p-4")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className={wolfEyebrowClass}>SHARK · Engineering test bench</p>
          <p className="mt-1 text-sm text-white/70">
            Video analysis and model benchmark runs — not a deployed reserve operations module.
          </p>
        </div>
        <span className="rounded-full border border-sky-400/35 bg-sky-500/10 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-sky-200">
          Test capability
        </span>
      </div>
      <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
        {SHARK_TEST_VIDEOS.map((video) => (
          <li
            key={video.id}
            className="flex items-center justify-between gap-3 text-xs text-white/55"
          >
            <span className="font-mono text-white/70">{video.label}</span>
            <span className="text-[10px] uppercase tracking-wide text-white/35">
              Expected tracks · {video.expectedSharks}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function WolfRealtimeOperatingModelSection() {
  const estate = useMemo(() => buildWolfRealtimeMarketingEstateSnapshot(), []);
  const [selectedReserve, setSelectedReserve] = useState<WolfReserveRecord | null>(
    estate.reserves[0] ?? null,
  );
  const activeReserve = selectedReserve ?? estate.reserves[0] ?? null;

  return (
    <section
      id="wolf-operating-model"
      className="relative border-t border-white/[0.08] bg-[#080c0a] py-16 text-white sm:py-20 lg:py-28"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(26,77,58,0.22),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <p className={wolfEyebrowClass}>The operating model</p>
        <h2 className="mt-3 text-2xl font-semibold uppercase tracking-[0.05em] sm:text-3xl">
          Flight → Intelligence → Command
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">
          One connected system — aerial data enters at the reserve, intelligence is produced from
          video and models, and operators command the estate from WOLF Central.
        </p>

        <div className="mt-14 lg:mt-16">
          {/* FLIGHT */}
          <article className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0a1210] to-[#060908] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] lg:items-start">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                  Flight
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  Aerial data from drone operations
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                  WOLF receives aerial video and related telemetry from drone operations across the
                  wildlife reserve. Flight activity is tracked at estate level in WOLF Central; the
                  platform does not currently provide autonomous mission planning or direct aircraft
                  control inside the command workspace.
                </p>
                <p className="mt-3 text-xs leading-relaxed text-white/40">
                  Field flight stacks (reference architecture): Mission Planner and QGroundControl on
                  operator laptops — illustrated below, not a WOLF Central screen.
                </p>
              </div>
              <div className="space-y-4">
                <div className={cn(wolfCardClass, "overflow-x-auto p-4")}>
                  <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    Reference ingest path · PAILEX infrastructure diagram
                  </p>
                  <ol className="flex min-w-[520px] gap-2">
                    {flightArchitectureSteps.map((step, index) => (
                      <li key={step.title} className="flex flex-1 flex-col">
                        <div className="flex h-full flex-col rounded-lg border border-white/[0.08] bg-black/30 px-2.5 py-3">
                          <span className="text-[9px] font-semibold text-emerald-300/60">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <p className="mt-1 text-xs font-semibold text-white">{step.title}</p>
                          <p className="mt-1 text-[10px] leading-snug text-white/45">{step.detail}</p>
                        </div>
                        {index < flightArchitectureSteps.length - 1 ? (
                          <span className="mx-auto mt-2 text-[10px] text-white/25">→</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    WOLF Central · Drone operations summary (demonstration data)
                  </p>
                  <DroneOperationsSummary reserves={estate.reserves} />
                </div>
              </div>
            </div>
          </article>

          <PipelineConnector />

          {/* INTELLIGENCE */}
          <article className="relative rounded-3xl border border-white/[0.1] bg-gradient-to-br from-[#0a1014] to-[#060908] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-8 xl:grid-cols-[minmax(0,0.4fr)_minmax(0,0.6fr)]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-300/80">
                  Intelligence
                </p>
                <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                  From aerial video to actionable signals
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                  WOLF transforms aerial and video data into detections, tracks, and intelligence
                  artefacts through GPU inference, WOLF AI processing, and the WOLF Intelligence
                  pipeline — with operator review before delivery to command software.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-x-1.5 gap-y-2">
                  {intelligencePipelineSteps.map((step, index) => (
                    <span key={step} className="inline-flex items-center gap-1.5">
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-white/50">
                        {step}
                      </span>
                      {index < intelligencePipelineSteps.length - 1 ? (
                        <span className="text-[10px] text-white/25" aria-hidden>
                          →
                        </span>
                      ) : null}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-xs text-white/40">
                  Pipeline stages align with the WOLF Intelligence architecture in the Information
                  Repository (engineering reference).
                </p>
              </div>
              <div className="space-y-4">
                <WolfRealtimeAiVisionCompact />
                <SharkEngineeringPanel />
              </div>
            </div>
          </article>

          <PipelineConnector />

          {/* COMMAND */}
          <article className="relative rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-[#0a1410] to-[#060908] p-6 shadow-[0_0_80px_-20px_rgba(26,77,58,0.45)] sm:p-8 lg:p-10">
            <div className="mb-8 max-w-2xl">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-300/80">
                Command
              </p>
              <h3 className="mt-2 text-xl font-semibold text-white sm:text-2xl">
                WOLF Central — operational command layer
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-white/55 sm:text-base">
                Authorised operators monitor the estate on a single screen: geographic context,
                fleet and mission roll-ups, reserve status, domain summaries, and WOLF Watch alerts.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className={wolfEyebrowClass}>Estate overview · demonstration data</p>
              </div>
              <WolfEstateMetricsPanel metrics={estate.metrics} />
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
                <WolfEstateMap
                  reserves={estate.reserves}
                  selectedReserveId={activeReserve?.id ?? null}
                  onSelectReserve={setSelectedReserve}
                />
                <div className="space-y-4">
                  {activeReserve ? (
                    <>
                      <WolfReserveStatusCard reserve={activeReserve} selected />
                      <div>
                        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                          Domain summaries
                        </p>
                        <DomainSummaryStrip reserve={activeReserve} />
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
              <WolfWatch alerts={estate.alerts} />
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
