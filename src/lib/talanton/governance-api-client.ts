import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import type { GovernanceMeeting } from "@/lib/talanton/governance-types";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";

const LOCAL_MEETINGS_KEY = "unit311-talanton-governance-v1";
const LOCAL_RISKS_KEY = "unit311-talanton-risk-register-v1";
const LOCAL_MEMBERS_KEY = "talanton-board-members-v1";

const IMPORT_KEYS = {
  meetings: "localStorage:unit311-talanton-governance-v1",
  risks: "localStorage:unit311-talanton-risk-register-v1",
  members: "localStorage:talanton-board-members-v1",
} as const;

async function parseJson<T>(res: Response): Promise<T & { error?: string }> {
  return (await res.json()) as T & { error?: string };
}

export async function fetchGovernanceMeetings(): Promise<GovernanceMeeting[]> {
  const res = await fetch("/api/talanton/governance/meetings", { credentials: "include" });
  const data = await parseJson<{ meetings?: GovernanceMeeting[] }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load governance meetings.");
  return data.meetings ?? [];
}

export async function postGovernanceMeeting(
  meeting: Partial<GovernanceMeeting> & Pick<GovernanceMeeting, "title">,
): Promise<GovernanceMeeting> {
  const res = await fetch("/api/talanton/governance/meetings", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meeting),
  });
  const data = await parseJson<{ meeting?: GovernanceMeeting }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to create meeting.");
  if (!data.meeting) throw new Error("Meeting save returned no record.");
  return data.meeting;
}

export async function patchGovernanceMeeting(meeting: GovernanceMeeting): Promise<GovernanceMeeting> {
  const res = await fetch(`/api/talanton/governance/meetings/${encodeURIComponent(meeting.id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(meeting),
  });
  const data = await parseJson<{ meeting?: GovernanceMeeting }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to save meeting.");
  if (!data.meeting) throw new Error("Meeting save returned no record.");
  return data.meeting;
}

export async function deleteGovernanceMeetingApi(meetingId: string): Promise<void> {
  const res = await fetch(`/api/talanton/governance/meetings/${encodeURIComponent(meetingId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to delete meeting.");
}

export async function fetchGovernanceRisks(): Promise<TiRiskRegisterEntry[]> {
  const res = await fetch("/api/talanton/governance/risks", { credentials: "include" });
  const data = await parseJson<{ risks?: TiRiskRegisterEntry[] }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load risks.");
  return data.risks ?? [];
}

export async function postGovernanceRisk(
  risk: Partial<TiRiskRegisterEntry> & { description: string },
): Promise<TiRiskRegisterEntry> {
  const res = await fetch("/api/talanton/governance/risks", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(risk),
  });
  const data = await parseJson<{ risk?: TiRiskRegisterEntry }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to save risk.");
  if (!data.risk) throw new Error("Risk save returned no record.");
  return data.risk;
}

export async function patchGovernanceRisk(
  id: string,
  risk: Partial<TiRiskRegisterEntry> & { description: string },
): Promise<TiRiskRegisterEntry> {
  const res = await fetch(`/api/talanton/governance/risks/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(risk),
  });
  const data = await parseJson<{ risk?: TiRiskRegisterEntry }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to update risk.");
  if (!data.risk) throw new Error("Risk save returned no record.");
  return data.risk;
}

export async function deleteGovernanceRiskApi(riskId: string): Promise<void> {
  const res = await fetch(`/api/talanton/governance/risks/${encodeURIComponent(riskId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to delete risk.");
}

export async function fetchBoardMembers(): Promise<TiBoardMember[]> {
  const res = await fetch("/api/talanton/governance/board-members", { credentials: "include" });
  const data = await parseJson<{ members?: TiBoardMember[] }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to load board members.");
  return data.members ?? [];
}

export async function postBoardMember(
  input: Omit<TiBoardMember, "id" | "name"> & { id?: string },
): Promise<TiBoardMember> {
  const res = await fetch("/api/talanton/governance/board-members", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await parseJson<{ member?: TiBoardMember }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to add board member.");
  if (!data.member) throw new Error("Board member save returned no record.");
  return data.member;
}

export async function patchBoardMember(
  id: string,
  patch: Partial<Omit<TiBoardMember, "id">>,
): Promise<TiBoardMember> {
  const res = await fetch(`/api/talanton/governance/board-members/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const data = await parseJson<{ member?: TiBoardMember }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to update board member.");
  if (!data.member) throw new Error("Board member save returned no record.");
  return data.member;
}

export async function deleteBoardMemberApi(memberId: string): Promise<void> {
  const res = await fetch(`/api/talanton/governance/board-members/${encodeURIComponent(memberId)}`, {
    method: "DELETE",
    credentials: "include",
  });
  const data = await parseJson<{ error?: string }>(res);
  if (!res.ok) throw new Error(data.error || "Failed to remove board member.");
}

function readLocalJson<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function migrateLocalGovernanceOnce(): Promise<void> {
  if (typeof window === "undefined") return;

  const meetings = readLocalJson<GovernanceMeeting[]>(LOCAL_MEETINGS_KEY);
  const risksRaw = readLocalJson<{ risks?: TiRiskRegisterEntry[] } | TiRiskRegisterEntry[]>(
    LOCAL_RISKS_KEY,
  );
  const risks = Array.isArray(risksRaw) ? risksRaw : risksRaw?.risks;
  const members = readLocalJson<TiBoardMember[]>(LOCAL_MEMBERS_KEY);

  const jobs: { importKey: string; payload: Record<string, unknown> }[] = [];
  if (meetings?.length) {
    jobs.push({ importKey: IMPORT_KEYS.meetings, payload: { meetings } });
  }
  if (risks?.length) {
    jobs.push({ importKey: IMPORT_KEYS.risks, payload: { risks } });
  }
  if (members?.length) {
    jobs.push({ importKey: IMPORT_KEYS.members, payload: { members } });
  }
  if (!jobs.length) return;

  for (const job of jobs) {
    const res = await fetch("/api/talanton/governance/migrate-local", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ importKey: job.importKey, ...job.payload }),
    });
    const data = await parseJson<{ imported?: boolean; error?: string }>(res);
    if (!res.ok) {
      console.warn("[governance migrate-local]", job.importKey, data.error);
      continue;
    }
    if (data.imported) {
      if (job.importKey === IMPORT_KEYS.meetings) {
        window.localStorage.removeItem(LOCAL_MEETINGS_KEY);
      } else if (job.importKey === IMPORT_KEYS.risks) {
        window.localStorage.removeItem(LOCAL_RISKS_KEY);
      } else if (job.importKey === IMPORT_KEYS.members) {
        window.localStorage.removeItem(LOCAL_MEMBERS_KEY);
      }
    }
  }
}
