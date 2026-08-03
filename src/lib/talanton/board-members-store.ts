/**
 * Talanton Impact Board Members — editable roster backed by localStorage.
 * Seeded from TI_BOARD_MEMBERS; edits persist per-browser under talanton-board-members-v1.
 */

import { TI_BOARD_MEMBERS, type TiBoardMember } from "@/lib/talanton/board-portal-data";

const STORAGE_KEY = "talanton-board-members-v1";

type Listener = () => void;

const listeners = new Set<Listener>();

function emit() {
  for (const listener of listeners) listener();
}

function readStored(): TiBoardMember[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TiBoardMember[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writeStored(members: TiBoardMember[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(members));
  } catch {
    /* storage unavailable — ignore */
  }
}

let state: TiBoardMember[] = readStored() ?? TI_BOARD_MEMBERS.map((m) => ({ ...m }));

export function subscribeBoardMembersStore(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function listMembers(): TiBoardMember[] {
  return state;
}

function nextMemberId() {
  const nums = state
    .map((m) => /^ti-bm-(\d+)$/.exec(m.id)?.[1])
    .filter(Boolean)
    .map((n) => Number(n));
  const next = (nums.length ? Math.max(...nums) : state.length) + 1;
  return `ti-bm-${next}`;
}

export function addMember(
  input: Omit<TiBoardMember, "id" | "name">,
): TiBoardMember {
  const member: TiBoardMember = {
    ...input,
    id: nextMemberId(),
    name: `${input.firstName} ${input.lastName}`.trim(),
  };
  state = [...state, member];
  writeStored(state);
  emit();
  return member;
}

export function updateMember(
  id: string,
  patch: Partial<Omit<TiBoardMember, "id">>,
): TiBoardMember | null {
  let updated: TiBoardMember | null = null;
  state = state.map((member) => {
    if (member.id !== id) return member;
    const next: TiBoardMember = { ...member, ...patch };
    next.name = `${next.firstName} ${next.lastName}`.trim();
    updated = next;
    return next;
  });
  if (updated) {
    writeStored(state);
    emit();
  }
  return updated;
}

export function removeMember(id: string): boolean {
  const before = state.length;
  state = state.filter((member) => member.id !== id);
  if (state.length === before) return false;
  writeStored(state);
  emit();
  return true;
}

export function resetBoardMembersStore() {
  state = TI_BOARD_MEMBERS.map((m) => ({ ...m }));
  writeStored(state);
  emit();
}
