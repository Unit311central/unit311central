import type { ClientOnboardingAdvanceAction, ClientOnboardingRecord } from "@/lib/client-onboarding-data";

const ONBOARDING_SEED: ClientOnboardingRecord[] = [
  {
    id: "nst-onb-001",
    companyName: "Lancashire Packaging Systems",
    contactName: "Rachel Owen",
    contactEmail: "r.owen@lancashirepackaging.co.uk",
    signupDate: "2026-08-01",
    currentStage: "questionnaire_complete",
    progressPercent: 60,
    currentStatus: "In Progress",
    signedUpAt: "2026-08-01T09:00:00.000Z",
    paymentReceivedAt: "2026-08-02T14:00:00.000Z",
    questionnaireCompleteAt: "2026-08-10T16:30:00.000Z",
  },
  {
    id: "nst-onb-002",
    companyName: "Nottingham Automation Group",
    contactName: "Chris Palmer",
    contactEmail: "c.palmer@nottinghamauto.co.uk",
    signupDate: "2026-07-20",
    currentStage: "platform_clone_complete",
    progressPercent: 80,
    currentStatus: "In Progress",
    signedUpAt: "2026-07-20T11:00:00.000Z",
    paymentReceivedAt: "2026-07-21T09:00:00.000Z",
    questionnaireCompleteAt: "2026-07-28T10:00:00.000Z",
    platformCloneCompleteAt: "2026-08-05T12:00:00.000Z",
  },
];

let onboardingRecords: ClientOnboardingRecord[] | null = null;

function seedOnboarding(): ClientOnboardingRecord[] {
  if (!onboardingRecords) {
    onboardingRecords = ONBOARDING_SEED.map((row) => ({ ...row }));
  }
  return onboardingRecords;
}

const ADVANCE_MAP: Record<
  ClientOnboardingAdvanceAction,
  { stage: ClientOnboardingRecord["currentStage"]; progress: number; status: ClientOnboardingRecord["currentStatus"]; field: keyof ClientOnboardingRecord }
> = {
  payment_received: {
    stage: "payment_received",
    progress: 30,
    status: "In Progress",
    field: "paymentReceivedAt",
  },
  questionnaire_complete: {
    stage: "questionnaire_complete",
    progress: 50,
    status: "In Progress",
    field: "questionnaireCompleteAt",
  },
  platform_clone_complete: {
    stage: "platform_clone_complete",
    progress: 70,
    status: "In Progress",
    field: "platformCloneCompleteAt",
  },
  review_complete: {
    stage: "review_complete",
    progress: 85,
    status: "In Progress",
    field: "reviewCompleteAt",
  },
  platform_live: {
    stage: "platform_live",
    progress: 100,
    status: "Platform Live",
    field: "platformLiveAt",
  },
};

export function listNorthstarOnboardingDemoRecords(): ClientOnboardingRecord[] {
  return seedOnboarding().map((row) => ({ ...row }));
}

export function advanceNorthstarOnboardingDemo(
  id: string,
  action: ClientOnboardingAdvanceAction,
): ClientOnboardingRecord {
  const rows = seedOnboarding();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Onboarding record not found");
  const patch = ADVANCE_MAP[action];
  const now = new Date().toISOString();
  const next: ClientOnboardingRecord = {
    ...rows[index]!,
    currentStage: patch.stage,
    progressPercent: patch.progress,
    currentStatus: patch.status,
    [patch.field]: now,
  };
  rows[index] = next;
  return { ...next };
}

export function updateNorthstarOnboardingDemo(
  id: string,
  patch: Partial<Pick<ClientOnboardingRecord, "currentStatus" | "currentStage" | "progressPercent">>,
): ClientOnboardingRecord {
  const rows = seedOnboarding();
  const index = rows.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Onboarding record not found");
  rows[index] = { ...rows[index]!, ...patch };
  return { ...rows[index]! };
}
