"use client";

import { useEffect, useRef } from "react";

type DroneTakeoffOverlayProps = {
  onComplete?: () => void;
};

function DroneSvg() {
  return (
    <svg
      width="72"
      height="72"
      viewBox="0 0 56 56"
      fill="none"
      aria-hidden
      className="drop-shadow-[0_10px_28px_rgba(56,189,248,0.55)]"
    >
      <circle cx="28" cy="28" r="10" fill="rgba(37,99,235,0.18)" stroke="#38bdf8" strokeWidth="1" />
      <circle cx="28" cy="28" r="6" fill="#1e3a8a" stroke="#93c5fd" strokeWidth="1.5" />
      <path
        d="M28 22V14M28 42V34M22 28H14M42 28H34"
        stroke="#60a5fa"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="14" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="42" cy="14" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="14" cy="42" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <circle cx="42" cy="42" r="4.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.5" />
      <g className="drone-propeller" style={{ transformOrigin: "14px 14px" }}>
        <ellipse cx="14" cy="14" rx="7" ry="1.5" fill="#bae6fd" opacity="0.7" />
      </g>
      <g className="drone-propeller drone-propeller-delay" style={{ transformOrigin: "42px 42px" }}>
        <ellipse cx="42" cy="42" rx="7" ry="1.5" fill="#bae6fd" opacity="0.7" />
      </g>
      <path
        d="M28 34L24 40H32L28 34Z"
        fill="#2563eb"
        stroke="#93c5fd"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DroneTakeoffOverlay({ onComplete }: DroneTakeoffOverlayProps) {
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => onCompleteRef.current?.(), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-[5000] overflow-hidden rounded-xl">
      <div className="absolute inset-0 bg-gradient-to-t from-[#020617]/70 via-[#020617]/25 to-transparent" />
      <div className="drone-takeoff-ring absolute bottom-[24%] left-1/2 h-24 w-24 -translate-x-1/2 rounded-full border border-sky-400/30 bg-sky-500/10" />
      <div className="drone-takeoff-scene absolute bottom-[24%] left-1/2">
        <DroneSvg />
        <div className="drone-takeoff-trail mx-auto mt-1 h-12 w-px bg-gradient-to-t from-sky-300/80 to-transparent" />
      </div>
      <p className="drone-takeoff-label absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/90">
        Drone airborne
      </p>
    </div>
  );
}
