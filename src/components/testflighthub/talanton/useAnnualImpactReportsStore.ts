"use client";

import { useSyncExternalStore } from "react";

import {
  getAnnualImpactReportsSnapshot,
  subscribeAnnualImpactReports,
} from "@/lib/talanton/annual-impact-report-store";

export function useAnnualImpactReportsStore() {
  return useSyncExternalStore(
    subscribeAnnualImpactReports,
    getAnnualImpactReportsSnapshot,
    getAnnualImpactReportsSnapshot,
  );
}
