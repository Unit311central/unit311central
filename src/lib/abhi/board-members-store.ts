/**
 * ABHI Board Members — editable roster backed by localStorage.
 * Seeded from ABHI_BOARD_MEMBERS; edits persist per-browser under abhi-board-members-v1.
 */

import { ABHI_BOARD_MEMBERS, type AbhiBoardMember } from "@/lib/abhi/board-portal-data";

const STORAGE_KEY = "abhi-board-members-v1";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function readStored(): AbhiBoardMember[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AbhiBoardMember[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(members: AbhiBoardMember[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    /* storage unavailable */
  }
}

let state: AbhiBoardMember[] = readStored() ?? ABHI_BOARD_MEMBERS.map((m) => ({ ...m }));

export function subscribeAbhiBoardMembersStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listAbhiBoardMembers(): AbhiBoardMember[] {
  return state;
}

export function getAbhiBoardMembersServerSnapshot(): AbhiBoardMember[] {
  return ABHI_BOARD_MEMBERS.map((m) => ({ ...m }));
}

function nextMemberId() {
  const nums = state
    .map((m) => /^bm-(\d+)$/.exec(m.id)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const next = (nums.length ? Math.max(...nums) : state.length) + 1;
  return `bm-${next}`;
}

export type AbhiBoardMemberInput = {
  name: string;
  role: string;
  email: string;
  committees: string[];
};

export function addAbhiBoardMember(input: AbhiBoardMemberInput): AbhiBoardMember {
  const member: AbhiBoardMember = {
    id: nextMemberId(),
    name: input.name.trim(),
    role: input.role.trim(),
    email: input.email.trim(),
    committees: input.committees.map((c) => c.trim()).filter(Boolean),
  };
  state = [...state, member];
  writeStored(state);
  emit();
  return member;
}

export function updateAbhiBoardMember(
  id: string,
  patch: Partial<AbhiBoardMemberInput>,
): AbhiBoardMember | null {
  let updated: AbhiBoardMember | null = null;
  state = state.map((member) => {
    if (member.id !== id) return member;
    const next: AbhiBoardMember = {
      ...member,
      ...patch,
      committees: patch.committees
        ? patch.committees.map((c) => c.trim()).filter(Boolean)
        : member.committees,
    };
    updated = next;
    return next;
  });
  if (updated) {
    writeStored(state);
    emit();
  }
  return updated;
}

export function removeAbhiBoardMember(id: string): boolean {
  const before = state.length;
  state = state.filter((member) => member.id !== id);
  if (state.length === before) return false;
  writeStored(state);
  emit();
  return true;
}

export function resetAbhiBoardMembersStore() {
  state = ABHI_BOARD_MEMBERS.map((m) => ({ ...m }));
  writeStored(state);
  emit();
}
