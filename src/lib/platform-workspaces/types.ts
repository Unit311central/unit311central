export type WorkspaceType = "Customer" | "Demo" | "Internal";

export type WorkspaceAdminStatus =
  | "Active"
  | "Pending Payment"
  | "Onboarding"
  | "Archived"
  | "Preparing";

export type WorkspaceContact = {
  name: string;
  email: string;
};

export type WorkspaceBranding = {
  displayName: string;
  logoUrl: string | null;
  primaryColour: string;
  secondaryColour: string;
};

export type WorkspaceImportEmployee = {
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
  department?: string;
};

export type WorkspaceImportClient = {
  name: string;
  email?: string;
  country?: string;
};

export type WorkspaceProvisioningState = {
  databaseStatus: "not_started" | "pending" | "complete" | "skipped";
  authenticationStatus: "not_started" | "pending" | "complete" | "skipped";
  infrastructureStatus: "not_started" | "pending" | "complete" | "skipped";
  deploymentStatus: "not_started" | "pending" | "complete" | "skipped";
  workspaceRecordStatus: "not_started" | "pending" | "complete" | "failed";
  lastMessage?: string;
};

export type WorkspaceAdminRecord = {
  workspaceId: string;
  name: string;
  slug: string;
  type: WorkspaceType;
  status: WorkspaceAdminStatus;
  companyName: string;
  contact: WorkspaceContact;
  country: string;
  timezone: string;
  currency: string;
  description: string;
  enabledModules: string[];
  enabledSubModules: string[];
  branding: WorkspaceBranding;
  pendingEmployees: WorkspaceImportEmployee[];
  pendingClients: WorkspaceImportClient[];
  userCount: number;
  enabledModuleCount: number;
  primaryUrl: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  provisioning: WorkspaceProvisioningState;
};

export type CreateWorkspaceInput = {
  type: "Customer" | "Demo";
  name: string;
  slug: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  country: string;
  timezone: string;
  currency: string;
  description: string;
  enabledModules: string[];
  enabledSubModules: string[];
  branding: WorkspaceBranding;
  employees: WorkspaceImportEmployee[];
  clients: WorkspaceImportClient[];
};

export type UpdateWorkspaceInput = Partial<
  Pick<
    WorkspaceAdminRecord,
    | "name"
    | "status"
    | "companyName"
    | "contact"
    | "country"
    | "timezone"
    | "currency"
    | "description"
    | "enabledModules"
    | "enabledSubModules"
    | "branding"
    | "pendingEmployees"
    | "pendingClients"
  >
>;

export type WorkspaceListFilters = {
  query?: string;
  type?: WorkspaceType | "all";
  status?: WorkspaceAdminStatus | "all";
};

export type CsvValidationResult<T> = {
  rows: T[];
  errors: Array<{ row: number; message: string }>;
};
