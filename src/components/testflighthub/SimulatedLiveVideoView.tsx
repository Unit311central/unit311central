"use client";

import { useEffect, useRef } from "react";

import type { Telemetry } from "@/lib/telemetry";

export const TESTING_VIDEO_SRC = "/videos/testingvideo.mp4";

type SimulatedLiveVideoViewProps = {
  telemetry?: Telemetry | null;
  compact?: boolean;
  /** Unused — kept for call-site compatibility; feed is the real test video. */
  terrainStyle?: "satellite" | "urban";
  sessionKey: string;
};

function formatHudTime(date: Date) {
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export default function SimulatedLiveVideoView({
  telemetry = null,
  compact = false,
  sessionKey,
}: SimulatedLiveVideoViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.load();
    void video.play().catch(() => {
      // Autoplay can be blocked until user gesture; muted + playsInline usually OK.
    });
  }, [sessionKey]);

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] ${
        compact ? "flex h-full min-h-[280px] flex-col" : "w-full"
      }`}
    >
      <div
        className={`flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.04] ${
          compact ? "px-3 py-2" : "gap-3 px-4 py-3 sm:px-6"
        }`}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#60a5fa]">
            FPV Camera
          </p>
          <h2 className={`font-semibold text-white ${compact ? "text-sm" : "mt-1 text-lg"}`}>
            Live Video
          </h2>
        </div>
        <div className={`flex items-center ${compact ? "gap-1.5" : "gap-3"}`}>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-red-300">
            <span className="live-video-rec h-1.5 w-1.5 rounded-full bg-red-400" />
            Rec
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-300">
            <span className="live-video-pulse h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Live
          </span>
        </div>
      </div>

      <div
        className={`live-video-viewport relative w-full overflow-hidden bg-[#020617] ${
          compact ? "min-h-0 flex-1" : "aspect-video max-h-[min(56vh,520px)]"
        }`}
      >
        <video
          ref={videoRef}
          key={sessionKey}
          src={TESTING_VIDEO_SRC}
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          aria-label="Testing flight video"
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#020617]/45"
          aria-hidden
        />
        <div className="live-video-lens-ring pointer-events-none absolute inset-5 rounded-[18px] border border-white/10" aria-hidden />

        {telemetry ? (
          <>
            <div
              className={`pointer-events-none absolute left-2 top-2 rounded-md border border-white/15 bg-black/45 font-mono text-white/85 backdrop-blur-sm ${
                compact ? "px-2 py-1 text-[9px]" : "left-4 top-4 px-3 py-2 text-[11px]"
              }`}
            >
              <p>{telemetry.droneId}</p>
              {!compact && (
                <p className="mt-1 text-white/60">{formatHudTime(telemetry.lastUpdated)} UTC</p>
              )}
            </div>

            <div
              className={`pointer-events-none absolute right-2 top-2 rounded-md border border-white/15 bg-black/45 text-right font-mono text-white/85 backdrop-blur-sm ${
                compact ? "px-2 py-1 text-[9px]" : "right-4 top-4 px-3 py-2 text-[11px]"
              }`}
            >
              <p>ALT {telemetry.altitudeFt.toFixed(0)} FT</p>
              <p className="mt-0.5">SPD {telemetry.speedMph.toFixed(1)} MPH</p>
              {!compact && (
                <p className="mt-1 text-emerald-300">BAT {telemetry.batteryPct.toFixed(1)}%</p>
              )}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
