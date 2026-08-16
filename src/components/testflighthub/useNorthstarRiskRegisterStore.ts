"use client";

import { useSyncExternalStore } from "react";

import {
  getNorthstarRiskRegisterServerSnapshot,
  getNorthstarRiskRegisterState,
  subscribeNorthstarRiskRegister,
  type NorthstarRiskRegisterState,
} from "@/lib/demo/northstar-risk-register-store";

export function useNorthstarRiskRegisterStore(): NorthstarRiskRegisterState {
  return useSyncExternalStore(
    subscribeNorthstarRiskRegister,
    getNorthstarRiskRegisterState,
    getNorthstarRiskRegisterServerSnapshot,
  );
}
