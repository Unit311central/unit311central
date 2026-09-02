import { AsyncLocalStorage } from "node:async_hooks";

import { WOLF_CENTRAL_SLUG } from "@/lib/wolf/wolf-surface";
import { INTERNAL_WORKSPACE_SLUG } from "@/lib/workspace-host";

type PipelineWorkspaceContext = { workspaceSlug: string };

const storage = new AsyncLocalStorage<PipelineWorkspaceContext>();

export function runWithPipelineWorkspaceContext<T>(
  workspaceSlug: string,
  fn: () => T | Promise<T>,
): T | Promise<T> {
  return storage.run({ workspaceSlug }, fn);
}

export function getPipelineWorkspaceSlug(): string {
  return storage.getStore()?.workspaceSlug ?? INTERNAL_WORKSPACE_SLUG;
}

export function shouldAutoSeedPipelineScenarios(): boolean {
  return getPipelineWorkspaceSlug() === INTERNAL_WORKSPACE_SLUG;
}

export function isWolfCentralPipelineContext(): boolean {
  return getPipelineWorkspaceSlug() === WOLF_CENTRAL_SLUG;
}
