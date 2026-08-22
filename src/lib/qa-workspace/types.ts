import type { QaTaskStatus } from "@/lib/qa-workspace/constants";

export type QaWorkspaceTask = {
  id: string;
  workspaceId: string;
  status: QaTaskStatus;
  completed: boolean;
  moduleLabel: string;
  moduleId: string | null;
  pageLabel: string;
  pageViewId: string | null;
  routePath: string | null;
  elementLabel: string;
  elementType: string | null;
  elementId: string | null;
  description: string;
  createdBy: string | null;
  createdByEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type QaWorkspaceTaskInput = {
  moduleLabel: string;
  moduleId?: string | null;
  pageLabel: string;
  pageViewId?: string | null;
  routePath?: string | null;
  elementLabel: string;
  elementType?: string | null;
  elementId?: string | null;
  description: string;
  completed?: boolean;
  status?: QaTaskStatus;
};

export type QaWorkspaceTaskFilters = {
  moduleLabel?: string;
  pageLabel?: string;
  status?: QaTaskStatus | "all";
  elementType?: string;
};

export type QaPageContext = {
  moduleLabel: string;
  moduleId: string | null;
  pageLabel: string;
  pageViewId: string;
  routePath: string;
};

export type QaElementContext = {
  elementLabel: string;
  elementType: string | null;
  elementId: string | null;
};
