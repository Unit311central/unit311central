"use client";

import { createContext, useContext } from "react";

type LivingHomeMotionContextValue = {
  /** When false, intro motion is held so widgets mount in their final layout first. */
  armed: boolean;
};

const LivingHomeMotionContext = createContext<LivingHomeMotionContextValue>({ armed: true });

export function LivingHomeMotionProvider({
  armed,
  children,
}: {
  armed: boolean;
  children: React.ReactNode;
}) {
  return (
    <LivingHomeMotionContext.Provider value={{ armed }}>{children}</LivingHomeMotionContext.Provider>
  );
}

export function useLivingHomeMotionArmed(): boolean {
  return useContext(LivingHomeMotionContext).armed;
}
