import type {
  WorkPackageDetail,
  WorkPackageListItem,
  WorkPackagePriority,
  WorkPackageStatus,
  WorkPackageTask,
  WorkPackageTaskStatus,
} from "@/lib/internal-work-packages/types";

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error ?? "Request failed.");
  return payload;
}

export async function listWorkPackagesApi(filters?: {
  search?: string;
  status?: string;
  owner?: string;
  priority?: string;
  teamMember?: string;
}) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.status) params.set("status", filters.status);
  if (filters?.owner) params.set("owner", filters.owner);
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.teamMember) params.set("teamMember", filters.teamMember);
  const query = params.toString();
  const response = await fetch(`/api/internal-work-packages${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  const payload = await parseJson<{ packages: WorkPackageListItem[] }>(response);
  return payload.packages;
}

export async function getWorkPackageApi(id: string) {
  const response = await fetch(`/api/internal-work-packages/${id}`, { credentials: "include" });
  const payload = await parseJson<{ workPackage: WorkPackageDetail }>(response);
  return payload.workPackage;
}

export async function createWorkPackageApi(input: {
  name: string;
  description?: string;
  status?: WorkPackageStatus;
  priority?: WorkPackagePriority;
  ownerName?: string;
  ownerUserId?: string;
  startDate?: string | null;
  expectedCompletionDate?: string | null;
  notes?: string;
  members?: Array<{ userId?: string | null; displayName: string }>;
}) {
  const response = await fetch("/api/internal-work-packages", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ workPackage: WorkPackageDetail }>(response);
  return payload.workPackage;
}

export async function updateWorkPackageApi(
  id: string,
  patch: Partial<{
    name: string;
    description: string;
    status: WorkPackageStatus;
    priority: WorkPackagePriority;
    ownerName: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    actualCompletionDate: string | null;
    notes: string;
  }>,
) {
  const response = await fetch(`/api/internal-work-packages/${id}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const payload = await parseJson<{ workPackage: WorkPackageDetail }>(response);
  return payload.workPackage;
}

export async function deleteWorkPackageApi(id: string) {
  const response = await fetch(`/api/internal-work-packages/${id}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Delete failed.");
  }
}

export async function setWorkPackageMembersApi(
  id: string,
  members: Array<{ userId?: string | null; displayName: string }>,
) {
  const response = await fetch(`/api/internal-work-packages/${id}/members`, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members }),
  });
  const payload = await parseJson<{ workPackage: WorkPackageDetail }>(response);
  return payload.workPackage;
}

export async function createWorkPackageTaskApi(
  packageId: string,
  input: {
    category?: string;
    description: string;
    assignedToName?: string;
    startDate?: string | null;
    expectedCompletionDate?: string | null;
    status?: WorkPackageTaskStatus;
    priority?: WorkPackagePriority;
    notes?: string;
  },
) {
  const response = await fetch(`/api/internal-work-packages/${packageId}/tasks`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const payload = await parseJson<{ task: WorkPackageTask; workPackage: WorkPackageDetail }>(response);
  return payload;
}

export async function updateWorkPackageTaskApi(
  packageId: string,
  taskId: string,
  patch: Partial<{
    category: string;
    description: string;
    assignedToName: string;
    startDate: string | null;
    expectedCompletionDate: string | null;
    finished: boolean;
    status: WorkPackageTaskStatus;
    priority: WorkPackagePriority;
    notes: string;
  }>,
) {
  const response = await fetch(`/api/internal-work-packages/${packageId}/tasks/${taskId}`, {
    method: "PATCH",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  const payload = await parseJson<{ task: WorkPackageTask; workPackage: WorkPackageDetail }>(response);
  return payload;
}

export async function deleteWorkPackageTaskApi(packageId: string, taskId: string) {
  const response = await fetch(`/api/internal-work-packages/${packageId}/tasks/${taskId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error ?? "Delete failed.");
  }
}
