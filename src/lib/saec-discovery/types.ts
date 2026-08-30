export type SaecDiscoveryModuleState = {
  completed: boolean;
  responses: Record<string, string>;
};

/** Module id → saved answers for that discovery area. */
export type SaecDiscoveryState = Record<string, SaecDiscoveryModuleState>;

export type SaecDiscoverySubmissionRecord = {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  status: "submitted";
  responses: SaecDiscoveryState;
  metadata: Record<string, unknown>;
  submittedByEmail: string | null;
  submittedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaecDiscoverySubmissionStatus = {
  submitted: boolean;
  submittedAt: string | null;
  updatedAt: string | null;
};
