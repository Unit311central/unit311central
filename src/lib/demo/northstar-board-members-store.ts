/**
 * Northstar Demo — editable board members.
 */

type Listener = () => void;

export type NorthstarBoardMember = {
  id: string;
  name: string;
  role: string;
  type: "Executive" | "Non-Executive" | "Investor" | "Independent";
};

export type NorthstarBoardMembersState = {
  members: NorthstarBoardMember[];
};

const STORAGE_KEY = "unit311-northstar-board-members-v2";
const listeners = new Set<Listener>();

function seedMembers(): NorthstarBoardMember[] {
  return [
    {
      id: "dir-ceo",
      name: "Paul Fotheringham",
      role: "Chief Executive Officer & Director",
      type: "Executive",
    },
    {
      id: "dir-chair",
      name: "Sarah Pemberton",
      role: "Chair",
      type: "Non-Executive",
    },
    {
      id: "dir-cto",
      name: "James Okonkwo",
      role: "Chief Technology Officer",
      type: "Executive",
    },
    {
      id: "dir-ned-1",
      name: "David Chen",
      role: "Non-Executive Director",
      type: "Investor",
    },
    {
      id: "dir-ned-2",
      name: "Amira Hassan",
      role: "Independent Non-Executive Director",
      type: "Independent",
    },
    {
      id: "dir-cfo",
      name: "Priya Shah",
      role: "Chief Financial Officer",
      type: "Executive",
    },
  ];
}

let state: NorthstarBoardMembersState = { members: seedMembers() };
const serverSnapshot: NorthstarBoardMembersState = { members: seedMembers() };
let hydrated = false;

function persistState(next: NorthstarBoardMembersState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as NorthstarBoardMembersState;
      if (parsed?.members?.length) state = parsed;
      else persistState(state);
    } else persistState(state);
  } catch {
    persistState(state);
  }
}

function writeState(next: NorthstarBoardMembersState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((l) => l());
}

export function getNorthstarBoardMembersState(): NorthstarBoardMembersState {
  ensureHydrated();
  return state;
}

export function getNorthstarBoardMembersServerSnapshot(): NorthstarBoardMembersState {
  return serverSnapshot;
}

export function subscribeNorthstarBoardMembers(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextMemberId(existing: NorthstarBoardMember[]): string {
  return `dir-${Date.now().toString(36)}-${existing.length}`;
}

export function upsertNorthstarBoardMember(
  input: Partial<NorthstarBoardMember> & { name: string },
): NorthstarBoardMember {
  const current = getNorthstarBoardMembersState();
  const existing = input.id ? current.members.find((m) => m.id === input.id) : undefined;
  const next: NorthstarBoardMember = {
    id: existing?.id ?? input.id ?? nextMemberId(current.members),
    name: input.name.trim(),
    role: (input.role ?? existing?.role ?? "Director").trim(),
    type: input.type ?? existing?.type ?? "Independent",
  };
  const members = existing
    ? current.members.map((m) => (m.id === existing.id ? next : m))
    : [next, ...current.members];
  writeState({ members });
  return next;
}

export function deleteNorthstarBoardMember(id: string) {
  const current = getNorthstarBoardMembersState();
  writeState({ members: current.members.filter((m) => m.id !== id) });
}
