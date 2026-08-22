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

export type WorkspaceProvisioningStepStatus =
  | "not_started"
  | "pending"
  | "complete"
  | "skipped"
  | "failed";

export type WorkspaceProvisioningOverallStatus =
  | "not_started"
  | "in_progress"
  | "complete"
  | "failed";

export type WorkspaceProvisioningState = {
  databaseStatus: WorkspaceProvisioningStepStatus;
  authenticationStatus: WorkspaceProvisioningStepStatus;
  infrastructureStatus: WorkspaceProvisioningStepStatus;
  deploymentStatus: WorkspaceProvisioningStepStatus;
  workspaceRecordStatus: "not_started" | "pending" | "complete" | "failed";
  loginPageStatus?: WorkspaceProvisioningStepStatus;
  initialAdminStatus?: WorkspaceProvisioningStepStatus;
  overallStatus?: WorkspaceProvisioningOverallStatus;
  lastMessage?: string;
};

export type InitialWorkspaceAdministratorInput = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type WorkspaceLoginPageInput = {
  title: string;
  /** Base64 data URL from wizard file upload — never persisted in metadata. */
  logoDataUrl?: string | null;
  /** Base64 data URL for JPG background — never persisted in metadata. */
  backgroundDataUrl?: string | null;
};

export type WorkspaceLoginPageConfig = {
  title: string;
  logoUrl: string | null;
  backgroundUrl: string | null;
};

export type InitialWorkspaceAdministratorSummary = {
  email: string;
  firstName: string;
  lastName: string;
  userId?: string;
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
  customerHostname: string;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  provisioning: WorkspaceProvisioningState;
  loginPage: WorkspaceLoginPageConfig;
  initialAdministrator: InitialWorkspaceAdministratorSummary | null;
};

export type CreateWorkspaceInput = {
  type: "Customer" | "Demo";
  name: string;
  slug: string;
  customerHostname?: string;
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
  loginPage: WorkspaceLoginPageInput;
  initialAdministrator: InitialWorkspaceAdministratorInput;
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
