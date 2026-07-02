"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import {
  advanceHomeDashboardTelemetry,
  createHomeDashboardTelemetry,
  getHomeDashboardOrbitPath,
} from "@/lib/home-dashboard-demo";
import type { Telemetry } from "@/lib/telemetry";

const FlightPathMap = dynamic(() => import("@/components/testflighthub/FlightPathMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[132px] items-center justify-center bg-[#0b1524] text-[10px] text-white/45">
      Loading flight path…
    </div>
  ),
});

const LiveVideoTerrainMap = dynamic(() => import("@/components/testflighthub/LiveVideoTerrainMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[132px] items-center justify-center bg-[#1a2418] text-[10px] text-white/45">
      Loading FPV…
    </div>
  ),
});

type LatLng = [number, number];

export function HomeDashboardFlightPathPanel() {
  const [telemetry, setTelemetry] = useState<Telemetry>(() => createHomeDashboardTelemetry());
  const [flightPath, setFlightPath] = useState<LatLng[]>(() => {
    const initial = createHomeDashboardTelemetry();
    return [[initial.latitude, initial.longitude] as LatLng];
  });
  const orbitAngleRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((previous) => {
        const { telemetry: next, nextAngle } = advanceHomeDashboardTelemetry(
          previous,
          orbitAngleRef.current,
        );
        orbitAngleRef.current = nextAngle;
        setFlightPath((path) =>
          [...path, [next.latitude, next.longitude] as LatLng].slice(-48),
        );
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const plannedOrbit = getHomeDashboardOrbitPath();

  return (
    <div className="relative h-full min-h-[132px] overflow-hidden rounded-lg border border-white/[0.14] bg-[#151b26]">
      <div className="absolute left-2 top-2 z-[500] rounded bg-black/70 px-2 py-0.5 text-[9px] font-medium text-white">
        Flight path map
      </div>
      <span className="absolute right-2 top-2 z-[500] inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-emerald-300">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
        Live
      </span>
      <FlightPathMap
        position={[telemetry.latitude, telemetry.longitude]}
        path={flightPath}
        plannedOrbit={plannedOrbit}
        followCenter
        satelliteTerrainOverlay
        mapHeightClassName="h-[132px]"
      />
    </div>
  );
}

export function HomeDashboardFpvPanel() {
  const [telemetry, setTelemetry] = useState<Telemetry>(() => createHomeDashboardTelemetry());
  const orbitAngleRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetry((previous) => {
        const { telemetry: next, nextAngle } = advanceHomeDashboardTelemetry(
          previous,
          orbitAngleRef.current,
        );
        orbitAngleRef.current = nextAngle;
        return next;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-full min-h-[132px] overflow-hidden rounded-lg border border-white/[0.14] bg-[#151b26]">
      <div className="absolute left-2 top-2 z-[500] rounded bg-black/70 px-2 py-0.5 text-[9px] font-medium text-white">
        FPV Live camera
      </div>
      <span className="absolute right-2 top-2 z-[500] inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/15 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.1em] text-red-300">
        <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
        Rec
      </span>
      <div className="live-video-viewport relative h-[132px] w-full overflow-hidden bg-[#020617]">
        <LiveVideoTerrainMap
          sessionKey="home-dashboard-fpv"
          telemetry={telemetry}
          terrainStyle="satellite"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-sky-900/25 via-transparent to-[#020617]/45"
          aria-hidden
        />
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/20" />
      </div>
    </div>
  );
}
