"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import type { FlightProfileId } from "@/lib/flight-simulation";
import type { Telemetry } from "@/lib/telemetry";

import FlightHubSandbox, { type FlightHubSandboxHandle } from "./FlightHubSandbox";

type SurveyOperationsSimulatorContextValue = {
  sandboxRef: React.RefObject<FlightHubSandboxHandle | null>;
  liveTelemetry: Telemetry | null;
  isRunning: boolean;
  setSandboxMountTarget: (target: HTMLElement | null) => void;
  setExcludedProfileIds: (ids: FlightProfileId[]) => void;
};

const SurveyOperationsSimulatorContext =
  createContext<SurveyOperationsSimulatorContextValue | null>(null);

export function useSurveyOperationsSimulator() {
  const context = useContext(SurveyOperationsSimulatorContext);
  if (!context) {
    throw new Error(
      "useSurveyOperationsSimulator must be used within SurveyOperationsSimulatorProvider",
    );
  }
  return context;
}

export default function SurveyOperationsSimulatorProvider({ children }: { children: ReactNode }) {
  const sandboxRef = useRef<FlightHubSandboxHandle>(null);
  const hiddenHostRef = useRef<HTMLDivElement>(null);
  const [liveTelemetry, setLiveTelemetry] = useState<Telemetry | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [visibleMountTarget, setVisibleMountTarget] = useState<HTMLElement | null>(null);
  const [portalHost, setPortalHost] = useState<HTMLElement | null>(null);
  const [excludedProfileIds, setExcludedProfileIds] = useState<FlightProfileId[]>([]);

  const handleTelemetryChange = useCallback((telemetry: Telemetry | null, running: boolean) => {
    setLiveTelemetry(telemetry);
    setIsRunning(running);
  }, []);

  const setSandboxMountTarget = useCallback((target: HTMLElement | null) => {
    setVisibleMountTarget(target);
  }, []);

  useLayoutEffect(() => {
    setPortalHost(visibleMountTarget ?? hiddenHostRef.current);
  }, [visibleMountTarget]);

  const sandbox =
    portalHost &&
    createPortal(
      <FlightHubSandbox
        ref={sandboxRef}
        onTelemetryChange={handleTelemetryChange}
        excludedProfileIds={excludedProfileIds}
      />,
      portalHost,
    );

  return (
    <SurveyOperationsSimulatorContext.Provider
      value={{
        sandboxRef,
        liveTelemetry,
        isRunning,
        setSandboxMountTarget,
        setExcludedProfileIds,
      }}
    >
      {children}
      <div ref={hiddenHostRef} className="hidden" aria-hidden />
      {sandbox}
    </SurveyOperationsSimulatorContext.Provider>
  );
}
