import { normalizeSlug } from "@/lib/platform-workspaces/workspace-admin-mappers";
import type { ProvisionWorkspaceOptions } from "@/lib/platform-workspaces/workspace-admin-repository";
import {
  getWorkspaceAdminRepository,
  resolveWorkspaceAdminRepositoryKind,
} from "@/lib/platform-workspaces/workspace-admin-repository-provider";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceListFilters,
} from "@/lib/platform-workspaces/types";

export { normalizeSlug, resolveWorkspaceAdminRepositoryKind };

export async function listWorkspaceAdminRecords(
  filters: WorkspaceListFilters = {},
): Promise<WorkspaceAdminRecord[]> {
  return getWorkspaceAdminRepository().list(filters);
}

export async function getWorkspaceAdminRecord(
  workspaceId: string,
): Promise<WorkspaceAdminRecord | null> {
  return getWorkspaceAdminRepository().getById(workspaceId);
}

export async function isWorkspaceSlugAvailable(slug: string): Promise<boolean> {
  return getWorkspaceAdminRepository().isSlugAvailable(slug);
}

export async function createWorkspaceAdminRecord(
  input: CreateWorkspaceInput,
  createdBy: string,
): Promise<WorkspaceAdminRecord> {
  return getWorkspaceAdminRepository().create(input, createdBy);
}

export async function provisionWorkspaceAdminRecord(
  workspaceId: string,
  options?: ProvisionWorkspaceOptions,
): Promise<WorkspaceAdminRecord> {
  return getWorkspaceAdminRepository().provision(workspaceId, options);
}

export async function updateWorkspaceAdminRecord(
  workspaceId: string,
  patch: UpdateWorkspaceInput,
): Promise<WorkspaceAdminRecord> {
  return getWorkspaceAdminRepository().update(workspaceId, patch);
}

export async function archiveWorkspaceAdminRecord(
  workspaceId: string,
): Promise<WorkspaceAdminRecord> {
  return getWorkspaceAdminRepository().archive(workspaceId);
}
