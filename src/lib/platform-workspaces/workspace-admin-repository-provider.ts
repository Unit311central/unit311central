import type { WorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository";
import type { WorkspaceAdminRepositoryKind } from "@/lib/platform-workspaces/workspace-admin-repository";
import { createMemoryWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository-memory";
import { createSupabaseWorkspaceAdminRepository } from "@/lib/platform-workspaces/workspace-admin-repository.supabase";
import { isSupabaseConfigured } from "@/lib/supabase/server";

let testRepositoryOverride: WorkspaceAdminRepository | null = null;
let memoryRepositorySingleton: WorkspaceAdminRepository | null = null;
let supabaseRepositorySingleton: WorkspaceAdminRepository | null = null;

export function setWorkspaceAdminRepositoryForTests(
  repository: WorkspaceAdminRepository | null,
): void {
  testRepositoryOverride = repository;
}

export function resolveWorkspaceAdminRepositoryKind(): WorkspaceAdminRepositoryKind {
  if (testRepositoryOverride) {
    return testRepositoryOverride.kind;
  }
  if (process.env.WORKSPACE_ADMIN_REPOSITORY === "memory") {
    return "memory";
  }
  if (process.env.WORKSPACE_ADMIN_REPOSITORY === "supabase") {
    return "supabase";
  }
  if (process.env.NODE_ENV === "test") {
    return "memory";
  }
  if (process.env.NODE_ENV === "production") {
    return "supabase";
  }
  return isSupabaseConfigured() ? "supabase" : "memory";
}

export function getWorkspaceAdminRepository(): WorkspaceAdminRepository {
  if (testRepositoryOverride) {
    return testRepositoryOverride;
  }

  const kind = resolveWorkspaceAdminRepositoryKind();
  if (kind === "memory") {
    memoryRepositorySingleton ??= createMemoryWorkspaceAdminRepository();
    return memoryRepositorySingleton;
  }

  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase is required for Workspaces administration persistence in production.",
    );
  }

  supabaseRepositorySingleton ??= createSupabaseWorkspaceAdminRepository();
  return supabaseRepositorySingleton;
}
