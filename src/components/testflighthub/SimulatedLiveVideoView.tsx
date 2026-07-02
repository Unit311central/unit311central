"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef } from "react";

import type { Telemetry } from "@/lib/telemetry";

const LiveVideoTerrainMap = dynamic(() => import("./LiveVideoTerrainMap"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex items-center justify-center bg-[#1a2418] text-sm text-white/50">
      Loading terrain feed...
    </div>
  ),
});

type SimulatedLiveVideoViewProps = {
  telemetry: Telemetry;
  compact?: boolean;
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

function VideoEffectsOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let frameId = 0;
    let seed = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * dpr);
      canvas.height = Math.floor(rect.height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      seed += 1;

      context.clearRect(0, 0, width, height);

      context.fillStyle = "rgba(255,255,255,0.028)";
      for (let index = 0; index < 110; index += 1) {
        const x = ((index * 83 + seed * 11) % width) | 0;
        const y = ((index * 47 + seed * 17) % height) | 0;
        context.fillRect(x, y, 1, 1);
      }

      if (seed % 47 === 0) {
        const blockY = ((seed * 19) % (height - 24)) | 0;
        context.fillStyle = "rgba(255,255,255,0.015)";
        context.fillRect(0, blockY, width, 8);
      }

      frameId = window.requestAnimationFrame(draw);
    };

    frameId = window.requestAnimationFrame(draw);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-50 mix-blend-overlay"
      aria-hidden
    />
  );
}

export default function SimulatedLiveVideoView({
  telemetry,
  compact = false,
  terrainStyle = "satellite",
  sessionKey,
}: SimulatedLiveVideoViewProps) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-white/15 bg-black shadow-[0_24px_64px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] ${
        compact ? "flex h-full min-h-[280px] flex-col" : ""
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
        className={`live-video-viewport relative w-full flex-1 overflow-hidden bg-[#020617] ${
          compact ? "min-h-0" : "aspect-video"
        }`}
      >
        <LiveVideoTerrainMap
          key={sessionKey}
          sessionKey={sessionKey}
          telemetry={telemetry}
          terrainStyle={terrainStyle}
        />

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-900/35 via-transparent to-[#020617]/55"
          aria-hidden
        />
        <div className="live-video-horizon pointer-events-none absolute inset-x-0 top-[18%]" aria-hidden />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_28%,rgba(0,0,0,0.62)_100%)]"
          aria-hidden
        />
        <div className="live-video-lens-ring pointer-events-none absolute inset-5 rounded-[18px] border border-white/10" aria-hidden />
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:100%_2px] opacity-20" />
        <VideoEffectsOverlay />

        <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2">
          <span className="absolute left-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/75" />
          <span className="absolute right-0 top-1/2 h-px w-2 -translate-y-1/2 bg-white/75" />
          <span className="absolute left-1/2 top-0 w-px h-2 -translate-x-1/2 bg-white/75" />
          <span className="absolute bottom-0 left-1/2 w-px h-2 -translate-x-1/2 bg-white/75" />
        </div>

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

        {!compact && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-white/15 bg-black/45 px-3 py-2 font-mono text-[11px] text-white/75 backdrop-blur-sm">
            <p>
              {telemetry.latitude.toFixed(6)}, {telemetry.longitude.toFixed(6)}
            </p>
            <p className="mt-1 text-white/50">Aerial FPV · Matrice 4T</p>
          </div>
        )}
      </div>
    </section>
  );
}
