/**
 * Talanton Impact Board Members — Supabase-backed roster.
 */

import type { TiBoardMember } from "@/lib/talanton/board-portal-data";
import {
  deleteBoardMemberApi,
  fetchBoardMembers,
  migrateLocalGovernanceOnce,
  patchBoardMember,
  postBoardMember,
} from "@/lib/talanton/governance-api-client";

type Listener = () => void;

export type BoardMembersState = {
  members: TiBoardMember[];
  status: "idle" | "loading" | "ready" | "error";
  error: string | null;
};

const listeners = new Set<Listener>();

let state: BoardMembersState = {
  members: [],
  status: "idle",
  error: null,
};

let loadPromise: Promise<void> | null = null;

function emit() {
  state = { ...state, members: [...state.members] };
  for (const listener of listeners) listener();
}

function setState(partial: Partial<BoardMembersState>) {
  state = { ...state, ...partial };
  emit();
}

export async function refreshBoardMembersFromServer(): Promise<void> {
  setState({ status: "loading", error: null });
  try {
    await migrateLocalGovernanceOnce();
    const members = await fetchBoardMembers();
    setState({ members, status: "ready", error: null });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load board members.";
    console.error("[board-members-store refresh]", message);
    setState({ members: [], status: "error", error: message });
  }
}

function ensureLoaded() {
  if (typeof window === "undefined") return Promise.resolve();
  if (state.status === "ready" || state.status === "error") return Promise.resolve();
  if (!loadPromise) {
    loadPromise = refreshBoardMembersFromServer().finally(() => {
      loadPromise = null;
    });
  }
  return loadPromise;
}

export function subscribeBoardMembersStore(listener: Listener) {
  listeners.add(listener);
  void ensureLoaded();
  return () => listeners.delete(listener);
}

export function listMembers(): TiBoardMember[] {
  void ensureLoaded();
  return state.members;
}

export function getBoardMembersState(): BoardMembersState {
  void ensureLoaded();
  return state;
}

export function getBoardMembersServerSnapshot(): BoardMembersState {
  return { members: [], status: "idle", error: null };
}

export async function addMember(
  input: Omit<TiBoardMember, "id" | "name">,
): Promise<TiBoardMember> {
  const saved = await postBoardMember(input);
  setState({
    members: [...state.members, saved],
    status: "ready",
    error: null,
  });
  return saved;
}

export async function updateMember(
  id: string,
  patch: Partial<Omit<TiBoardMember, "id">>,
): Promise<TiBoardMember | null> {
  const saved = await patchBoardMember(id, patch);
  setState({
    members: state.members.map((member) => (member.id === id ? saved : member)),
    status: "ready",
    error: null,
  });
  return saved;
}

export async function removeMember(id: string): Promise<boolean> {
  const before = state.members.length;
  await deleteBoardMemberApi(id);
  setState({
    members: state.members.filter((member) => member.id !== id),
    status: "ready",
    error: null,
  });
  return state.members.length < before;
}

export async function resetBoardMembersStore() {
  await refreshBoardMembersFromServer();
}
