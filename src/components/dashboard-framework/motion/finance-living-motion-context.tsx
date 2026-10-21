"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";

type FinanceLivingMotionContextValue = {
  armed: boolean;
  visitKey: number;
  introComplete: boolean;
  markIntroComplete: () => void;
  replayIntro: () => void;
};

const FinanceLivingMotionContext = createContext<FinanceLivingMotionContextValue>({
  armed: false,
  visitKey: 0,
  introComplete: false,
  markIntroComplete: () => {},
  replayIntro: () => {},
});

export function FinanceLivingMotionProvider({
  armed,
  children,
}: {
  armed: boolean;
  children: ReactNode;
}) {
  const [visitKey, setVisitKey] = useState(0);
  const [introComplete, setIntroComplete] = useState(false);

  const markIntroComplete = useCallback(() => {
    setIntroComplete(true);
  }, []);

  const replayIntro = useCallback(() => {
    setIntroComplete(false);
    setVisitKey((key) => key + 1);
  }, []);

  return (
    <FinanceLivingMotionContext.Provider
      value={{ armed, visitKey, introComplete, markIntroComplete, replayIntro }}
    >
      {children}
    </FinanceLivingMotionContext.Provider>
  );
}

export function useFinanceMotionArmed(): boolean {
  return useContext(FinanceLivingMotionContext).armed;
}

export function useFinanceVisitKey(): number {
  return useContext(FinanceLivingMotionContext).visitKey;
}

export function useFinanceIntroComplete(): {
  introComplete: boolean;
  markIntroComplete: () => void;
} {
  const { introComplete, markIntroComplete } = useContext(FinanceLivingMotionContext);
  return { introComplete, markIntroComplete };
}

export function useFinanceReplayIntro(): () => void {
  return useContext(FinanceLivingMotionContext).replayIntro;
}
