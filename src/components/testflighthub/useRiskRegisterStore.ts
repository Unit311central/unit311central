"use client";

import { useSyncExternalStore } from "react";

import {
  getAbhiRiskRegisterServerSnapshot,
  getAbhiRiskRegisterState,
  subscribeAbhiRiskRegister,
  type AbhiRiskRegisterState,
} from "@/lib/abhi/risk-register-store";

export function useRiskRegisterStore(): AbhiRiskRegisterState {
  return useSyncExternalStore(
    subscribeAbhiRiskRegister,
    getAbhiRiskRegisterState,
    getAbhiRiskRegisterServerSnapshot,
  );
}
