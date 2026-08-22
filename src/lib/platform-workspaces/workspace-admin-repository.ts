import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
  WorkspaceAdminRecord,
  WorkspaceListFilters,
} from "@/lib/platform-workspaces/types";

export type WorkspaceAdminRepositoryKind = "supabase" | "memory";

export interface WorkspaceAdminRepository {
  readonly kind: WorkspaceAdminRepositoryKind;
  list(filters?: WorkspaceListFilters): Promise<WorkspaceAdminRecord[]>;
  getById(workspaceId: string): Promise<WorkspaceAdminRecord | null>;
  isSlugAvailable(slug: string): Promise<boolean>;
  create(input: CreateWorkspaceInput, createdBy: string): Promise<WorkspaceAdminRecord>;
  update(workspaceId: string, patch: UpdateWorkspaceInput): Promise<WorkspaceAdminRecord>;
  archive(workspaceId: string): Promise<WorkspaceAdminRecord>;
}
