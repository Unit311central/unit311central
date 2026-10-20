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

type LivingHomeMotionContextValue = {
  /** When false, intro motion is held so widgets mount in their final layout first. */
  armed: boolean;
  /** Home workspace pane is visible (not a hidden warm mount). */
  paneActive: boolean;
  /** Bumps when the user returns to Home so widgets remount and replay intro motion. */
  homeVisitKey: number;
  introComplete: boolean;
  markIntroComplete: () => void;
};

const LivingHomeMotionContext = createContext<LivingHomeMotionContextValue>({
  armed: false,
  paneActive: true,
  homeVisitKey: 0,
  introComplete: false,
  markIntroComplete: () => {},
});

export function LivingHomeMotionProvider({
  armed,
  paneActive,
  children,
}: {
  armed: boolean;
  paneActive: boolean;
  children: ReactNode;
}) {
  const [homeVisitKey, setHomeVisitKey] = useState(0);
  const [introComplete, setIntroComplete] = useState(false);
  const prevPaneActive = useRef(paneActive);

  useEffect(() => {
    if (paneActive && !prevPaneActive.current) {
      setIntroComplete(false);
      setHomeVisitKey((key) => key + 1);
    }
    prevPaneActive.current = paneActive;
  }, [paneActive]);

  const markIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  return (
    <LivingHomeMotionContext.Provider
      value={{ armed, paneActive, homeVisitKey, introComplete, markIntroComplete }}
    >
      {children}
    </LivingHomeMotionContext.Provider>
  );
}

export function useLivingHomeMotionArmed(): boolean {
  return useContext(LivingHomeMotionContext).armed;
}

export function useLivingHomeMotionPaneActive(): boolean {
  return useContext(LivingHomeMotionContext).paneActive;
}

export function useLivingHomeVisitKey(): number {
  return useContext(LivingHomeMotionContext).homeVisitKey;
}

export function useLivingHomeIntroComplete(): {
  introComplete: boolean;
  markIntroComplete: () => void;
} {
  const { introComplete, markIntroComplete } = useContext(LivingHomeMotionContext);
  return { introComplete, markIntroComplete };
}
