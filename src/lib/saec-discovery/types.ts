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

export type SaecDiscoveryDraftRecord = {
  id: string;
  workspaceId: string;
  workspaceSlug: string;
  workspaceName: string;
  ownerUserId: string;
  ownerEmail: string | null;
  responses: SaecDiscoveryState;
  lastSavedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type SaecDiscoveryFeedbackSnapshot = {
  drafts: SaecDiscoveryDraftRecord[];
  submissions: SaecDiscoverySubmissionRecord[];
};
