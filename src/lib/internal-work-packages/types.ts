export type WorkPackageStatus =
  | "Not Started"
  | "In Progress"
  | "Blocked"
  | "Complete"
  | "Cancelled";

export type WorkPackageTaskStatus =
  | "Not Started"
  | "In Progress"
  | "Blocked"
  | "Complete"
  | "Cancelled";

export type WorkPackagePriority = "Low" | "Normal" | "High" | "Urgent";

export type WorkPackageMember = {
  id: string;
  userId: string | null;
  displayName: string;
};

export type WorkPackageTask = {
  id: string;
  taskCode: string;
  category: string;
  description: string;
  assignedToUserId: string | null;
  assignedToName: string;
  startDate: string | null;
  expectedCompletionDate: string | null;
  finished: boolean;
  finishedAt: string | null;
  status: WorkPackageTaskStatus;
  priority: WorkPackagePriority;
  notes: string;
};

export type WorkPackageListItem = {
  id: string;
  packageCode: string;
  name: string;
  description: string;
  status: WorkPackageStatus;
  priority: WorkPackagePriority;
  ownerUserId: string | null;
  ownerName: string;
  createdByName: string;
  startDate: string | null;
  expectedCompletionDate: string | null;
  actualCompletionDate: string | null;
  progressPct: number;
  teamCount: number;
  taskCount: number;
  completedTaskCount: number;
  updatedAt: string;
};

export type WorkPackageDetail = WorkPackageListItem & {
  notes: string;
  members: WorkPackageMember[];
  tasks: WorkPackageTask[];
  questions: WorkPackageQuestion[];
};

export type WorkPackageQuestion = {
  id: string;
  category: string;
  questionText: string;
  sortOrder: number;
  currentAnswer: string;
  answeredAt: string | null;
  answeredByUserId: string | null;
  answeredByName: string;
};

export type WorkPackageQuestionAnswerLogEntry = {
  id: string;
  questionId: string;
  questionText: string;
  category: string;
  answerText: string;
  answeredAt: string;
  answeredByUserId: string | null;
  answeredByName: string;
};
