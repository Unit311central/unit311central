export type MeetingType =
  | "Board Meeting"
  | "Investment Committee"
  | "Management Meeting"
  | "Impact Review"
  | "Special Committee";

export type MeetingStatus = "Draft" | "Scheduled" | "Held" | "Archived";
export type ActionStatus = "Open" | "Underway" | "Completed" | "Overdue";
export type DecisionStatus = "Proposed" | "Approved" | "Deferred" | "Rejected";

export type GovernanceAttendee = {
  name: string;
  role: string;
};

export type GovernanceDecision = {
  id: string;
  text: string;
  status: DecisionStatus;
  owner: string;
};

export type GovernanceAction = {
  id: string;
  title: string;
  owner: string;
  dueDate: string;
  status: ActionStatus;
};

export type GovernanceMeeting = {
  id: string;
  meetingDate: string;
  meetingType: MeetingType;
  title: string;
  status: MeetingStatus;
  attendees: GovernanceAttendee[];
  minutes: string;
  decisions: GovernanceDecision[];
  actions: GovernanceAction[];
  archived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type GovernanceLoadStatus = "idle" | "loading" | "ready" | "error";

export type GovernanceSnapshot = {
  meetings: GovernanceMeeting[];
  status: GovernanceLoadStatus;
  error: string | null;
};
