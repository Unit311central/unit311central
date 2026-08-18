import type { InternalRoleView } from "@/lib/internal-role-views";
import type { UserDepartment, UserRole } from "@/lib/user-management-data";

export type ManagementSectionId =
  | "dashboard"
  | "meetings"
  | "function-packs"
  | "actions-decisions";

export type ContentStudioFunctionId =
  | "corporate"
  | "management"
  | "fundraising"
  | "sales"
  | "marketing"
  | "projects"
  | "operations"
  | "finance"
  | "hr"
  | "engineering"
  | "qms"
  | "regulatory"
  | "administration";

export type CentralCapabilityAccessContext = {
  roleView: InternalRoleView | null;
  roles: UserRole[];
  departments: UserDepartment[];
};

export type ManagementPackStatus = "ready" | "outstanding" | "draft" | "not-started";

export type ManagementParticipantReadiness = {
  role: string;
  name: string;
  status: ManagementPackStatus;
};

export type ManagementMeetingPlaceholder = {
  id: string;
  name: string;
  schedule: string;
  participants: string[];
  functionPackLabel: string;
  readiness: ManagementParticipantReadiness[];
  packsReady: number;
  packsTotal: number;
};

export type ManagementFunctionPackPlaceholder = {
  id: string;
  title: string;
  ownerRole: string;
  lastGenerated: string | null;
  reportingPeriod: string;
  status: "current" | "draft" | "archived";
};

export type ManagementActionPlaceholder = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: "open" | "overdue" | "complete";
  meeting: string;
  kind: "action" | "decision";
};

export type ContentStudioTemplatePlaceholder = {
  id: string;
  name: string;
  description: string;
  lastUpdated: string;
  status: "approved" | "draft" | "review";
  canEdit: boolean;
};

export type ContentStudioFunctionNode = {
  id: ContentStudioFunctionId;
  label: string;
  description: string;
};

export type ContentStudioPageConfig = {
  id: string;
  label: string;
  enabled: boolean;
};

export type ContentStudioSavedContent = {
  id: string;
  templateId: string;
  templateName: string;
  functionId: ContentStudioFunctionId;
  name: string;
  frequency: string;
  pages: ContentStudioPageConfig[];
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};
