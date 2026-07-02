"use client";

import { createContext, useContext } from "react";

import {
  INTERNAL_OPERATIONS_BASE_PATH,
  type InternalOperationsView,
} from "@/lib/internal-operations-data";
import type { SurveyOperationsBasePath } from "@/lib/survey-operations-mock-data";

const InternalOperationsBasePathContext = createContext<SurveyOperationsBasePath>(
  INTERNAL_OPERATIONS_BASE_PATH,
);

export function InternalOperationsBasePathProvider({
  basePath,
  children,
}: {
  basePath: SurveyOperationsBasePath;
  children: React.ReactNode;
}) {
  return (
    <InternalOperationsBasePathContext.Provider value={basePath}>
      {children}
    </InternalOperationsBasePathContext.Provider>
  );
}

export function useInternalOperationsBasePath() {
  return useContext(InternalOperationsBasePathContext);
}

export type { InternalOperationsView };
