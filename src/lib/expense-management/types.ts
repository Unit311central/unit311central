export const EXPENSE_WORKFLOW_STATUSES = [
  "draft",
  "submitted",
  "changes_requested",
  "approved",
  "rejected",
  "scheduled",
  "paid",
  "cancelled",
] as const;

export type ExpenseWorkflowStatus = (typeof EXPENSE_WORKFLOW_STATUSES)[number];

export const EXPENSE_RUN_STATUSES = [
  "open",
  "review",
  "approved",
  "payment_scheduled",
  "paid",
] as const;

export type ExpenseRunStatus = (typeof EXPENSE_RUN_STATUSES)[number];

export type ExpenseType = "standard" | "mileage";

export type ExpenseCategory = {
  id: string;
  workspaceId: string;
  name: string;
  code: string;
  glAccountCode: string;
  active: boolean;
  archivedAt: string | null;
  sortOrder: number;
};

export type ExpenseBillingCode = {
  id: string;
  workspaceId: string;
  code: string;
  name: string;
  active: boolean;
  archivedAt: string | null;
  sortOrder: number;
};

export type ExpenseMileageRate = {
  id: string;
  workspaceId: string;
  countryCode: string;
  vehicleType: string;
  ratePerUnit: number;
  distanceUnit: "miles" | "kilometres";
  active: boolean;
};

export type ExpensePaymentSchedule = {
  workspaceId: string;
  frequency: "weekly" | "fortnightly" | "monthly" | "custom";
  cutoffDay: number;
  approvalDeadlineDay: number;
  paymentDay: number;
};

export type ExpenseRun = {
  id: string;
  workspaceId: string;
  label: string;
  periodStart: string;
  periodEnd: string;
  cutoffDate: string;
  paymentDate: string;
  status: ExpenseRunStatus;
  totalAmount: number;
  currency: string;
  expenseCount: number;
  paymentReference: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseApprovalEvent = {
  id: string;
  workspaceId: string;
  expenseId: string;
  actorUserId: string;
  actorName: string;
  action: string;
  comment: string | null;
  createdAt: string;
};

export type EmployeePaymentDetails = {
  id: string;
  workspaceId: string;
  employeeId: string;
  countryCode: string;
  accountHolderName: string;
  bankName: string;
  bankAddress: string;
  sortCode: string | null;
  accountNumber: string | null;
  routingNumber: string | null;
  iban: string | null;
  swiftBic: string | null;
};

export type ExpenseNotification = {
  id: string;
  workspaceId: string;
  recipientUserId: string;
  expenseId: string | null;
  kind: string;
  message: string;
  readAt: string | null;
  createdAt: string;
};
