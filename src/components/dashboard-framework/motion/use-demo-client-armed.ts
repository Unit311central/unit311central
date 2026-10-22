"use client";

import { useEffect, useState } from "react";

import { isBrowserDemoSurface } from "@/lib/demo-enterprise";

import { useLivingMotionEnabled } from "./living-motion";

/** Client-only demo host + reduced-motion gate (avoids SSR skipping the motion provider). */
export function useDemoClientMotionArmed(): boolean {
  const motionEnabled = useLivingMotionEnabled();
  const [demoHost, setDemoHost] = useState(false);

  useEffect(() => {
    setDemoHost(isBrowserDemoSurface());
  }, []);

  return motionEnabled && demoHost;
}
