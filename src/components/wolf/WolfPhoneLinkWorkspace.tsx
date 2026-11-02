"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { wolfCardClass, wolfEyebrowClass, wolfShellClass } from "@/components/wolf/wolf-ui";
import { WOLF_PHONE_TELEMETRY_PATH, type PhoneFixInput } from "@/lib/wolf/phone-telemetry";

type ShareState = "idle" | "sharing" | "denied" | "error";

export default function WolfPhoneLinkWorkspace() {
  const [state, setState] = useState<ShareState>("idle");
  const [detail, setDetail] = useState("Location stays off until you start sharing.");
  const watchRef = useRef<number | null>(null);
  const latestRef = useRef<PhoneFixInput | null>(null);

  const stop = useCallback(() => {
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    latestRef.current = null;
    setState("idle");
    setDetail("Location sharing is off.");
  }, []);

  useEffect(() => {
    const post = async () => {
      const fix = latestRef.current;
      if (!fix) return;
      try {
        const response = await fetch(WOLF_PHONE_TELEMETRY_PATH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(fix),
        });
        if (!response.ok) {
          setState("error");
          setDetail("WOLF did not accept the location.");
        }
      } catch {
        setState("error");
        setDetail("The phone could not reach WOLF.");
      }
    };
    const timer = window.setInterval(() => void post(), 2000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const start = () => {
    if (!navigator.geolocation) {
      setState("error");
      setDetail("This browser has no location.");
      return;
    }
    if (watchRef.current != null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    setState("sharing");
    setDetail("Waiting for the first GPS fix.");
    const wakeLock = navigator.wakeLock;
    if (wakeLock) {
      void wakeLock.request("screen").catch(() => undefined);
    }
    watchRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, altitude, speed, heading } = position.coords;
        latestRef.current = {
          latitude,
          longitude,
          altitudeM: altitude,
          speedMps: speed != null && speed >= 0 ? speed : null,
          headingDeg: heading != null && heading >= 0 ? heading : null,
        };
        setState("sharing");
        setDetail("Sharing location. Keep this page on screen beside Brix.");
      },
      () => {
        latestRef.current = null;
        setState("denied");
        setDetail("Location permission was denied.");
      },
      { enableHighAccuracy: true, maximumAge: 1000, timeout: 15000 },
    );
  };

  return (
    <div className={`${wolfShellClass} px-4 py-6 sm:px-6 sm:py-8`}>
      <header className="mb-6 max-w-3xl">
        <p className={wolfEyebrowClass}>Tools</p>
        <h1 className="mt-1 text-2xl font-semibold text-white">Phone Link</h1>
        <p className="mt-2 text-sm text-white/70">
          Sends this phone’s GPS to the WebRTC page. Brix keeps sending a clean picture on stream key test.
        </p>
      </header>
      <section className={`${wolfCardClass} max-w-xl px-4 py-4`}>
        <p className="text-sm text-white/80" role="status">
          {detail}
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            {state === "sharing" ? "Sharing" : "Share location"}
          </button>
          <button
            type="button"
            onClick={stop}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-semibold text-white"
          >
            Stop
          </button>
        </div>
        <p className="mt-4 text-sm text-white/60">
          Use Android split screen so this page stays visible while Brix is streaming. If this page is covered, Android pauses the location.
        </p>
      </section>
    </div>
  );
}
