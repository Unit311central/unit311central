"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type DemoDashboardModuleId =
  | "sales"
  | "fundraising"
  | "operations"
  | "marketing"
  | "events-external"
  | "events-managed"
  | "support"
  | "engineering";

type DemoDashboardMotionContextValue = {
  moduleId: DemoDashboardModuleId;
  armed: boolean;
  visitKey: number;
  introComplete: boolean;
  markIntroComplete: () => void;
  contentEpoch: number;
};

const DemoDashboardMotionContext = createContext<DemoDashboardMotionContextValue | null>(null);

export function DemoDashboardMotionProvider({
  moduleId,
  armed,
  filterKey,
  children,
}: {
  moduleId: DemoDashboardModuleId;
  armed: boolean;
  filterKey?: string | number;
  children: ReactNode;
}) {
  const [visitKey, setVisitKey] = useState(0);
  const [introComplete, setIntroComplete] = useState(false);
  const [contentEpoch, setContentEpoch] = useState(0);
  const prevFilter = useRef(filterKey);

  useEffect(() => {
    setIntroComplete(false);
    setVisitKey((k) => k + 1);
  }, [moduleId]);

  useEffect(() => {
    if (prevFilter.current === filterKey) return;
    prevFilter.current = filterKey;
    if (introComplete) setContentEpoch((e) => e + 1);
  }, [filterKey, introComplete]);

  const markIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <DemoDashboardMotionContext.Provider
      value={{
        moduleId,
        armed,
        visitKey,
        introComplete,
        markIntroComplete,
        contentEpoch,
      }}
    >
      {children}
    </DemoDashboardMotionContext.Provider>
  );
}

export function useDemoDashboardMotionContext(): DemoDashboardMotionContextValue | null {
  return useContext(DemoDashboardMotionContext);
}
