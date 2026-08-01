/**
 * ABHI UK Healthcare Pavilion advertisers — companies signed up to be listed on
 * https://ukhealthcarepavilion.com/
 */

type Listener = () => void;

export const UK_PAVILION_FEE_GBP = 850;
export const UK_PAVILION_SITE = "https://ukhealthcarepavilion.com/";

export type UkPavilionStatus = "pending" | "active" | "expired" | "cancelled";

export type UkPavilionMember = {
  id: string;
  companyName: string;
  contactName: string;
  contactEmail: string;
  signedUpAt: string;
  amountGbp: number;
  status: UkPavilionStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type UkPavilionState = {
  members: UkPavilionMember[];
};

const STORAGE_KEY = "unit311-abhi-uk-pavilion-v1";
const listeners = new Set<Listener>();

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function nowIso() {
  return new Date().toISOString();
}

function newId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `abhi-pav-${crypto.randomUUID().slice(0, 10)}`;
  }
  return `abhi-pav-${Date.now().toString(36)}`;
}

function seedMembers(): UkPavilionMember[] {
  return [
    {
      id: "abhi-pav-centrak",
      companyName: "Centrak",
      contactName: "Demo User",
      contactEmail: "demo@centrak.com",
      signedUpAt: "2026-03-12",
      amountGbp: UK_PAVILION_FEE_GBP,
      status: "active",
      notes: "Listed on UK Healthcare Pavilion — renew annually.",
      createdAt: "2026-03-12T10:00:00Z",
      updatedAt: "2026-03-12T10:00:00Z",
    },
    {
      id: "abhi-pav-braun",
      companyName: "B. Braun Medical",
      contactName: "Membership Desk",
      contactEmail: "membership@bbraun.com",
      signedUpAt: "2026-01-20",
      amountGbp: UK_PAVILION_FEE_GBP,
      status: "active",
      notes: "",
      createdAt: "2026-01-20T09:00:00Z",
      updatedAt: "2026-01-20T09:00:00Z",
    },
    {
      id: "abhi-pav-owens",
      companyName: "Owen Mumford",
      contactName: "Marketing",
      contactEmail: "marketing@owenmumford.com",
      signedUpAt: "2026-05-08",
      amountGbp: UK_PAVILION_FEE_GBP,
      status: "pending",
      notes: "Awaiting invoice payment.",
      createdAt: "2026-05-08T14:20:00Z",
      updatedAt: "2026-05-08T14:20:00Z",
    },
    {
      id: "abhi-pav-renishaw",
      companyName: "Renishaw",
      contactName: "HealthTech Team",
      contactEmail: "healthtech@renishaw.com",
      signedUpAt: "2025-11-02",
      amountGbp: UK_PAVILION_FEE_GBP,
      status: "expired",
      notes: "Renewal outreach due.",
      createdAt: "2025-11-02T11:00:00Z",
      updatedAt: "2026-07-01T09:00:00Z",
    },
  ];
}

function defaultState(): UkPavilionState {
  return { members: seedMembers() };
}

function normalizeState(raw: unknown): UkPavilionState | null {
  if (!raw || typeof raw !== "object") return null;
  const parsed = raw as UkPavilionState;
  if (!Array.isArray(parsed.members)) return null;
  return {
    members: parsed.members.map((row) => ({
      ...row,
      amountGbp: Number(row.amountGbp) || UK_PAVILION_FEE_GBP,
      status: row.status ?? "active",
      notes: row.notes ?? "",
    })),
  };
}

function readPersistedState(): UkPavilionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

function persistState(next: UkPavilionState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

let state: UkPavilionState = defaultState();
let hydrated = false;

/** Frozen SSR/hydration snapshot — never touch localStorage. */
const serverSnapshot: UkPavilionState = defaultState();

function ensureHydrated() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  const persisted = readPersistedState();
  if (persisted) {
    state = persisted;
  } else {
    persistState(state);
  }
}

function writeState(next: UkPavilionState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((listener) => listener());
}

/** Stable client snapshot for useSyncExternalStore — must not allocate a new object each call. */
export function getUkPavilionState(): UkPavilionState {
  ensureHydrated();
  return state;
}

export function getUkPavilionServerSnapshot(): UkPavilionState {
  return serverSnapshot;
}

export function subscribeUkPavilion(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function upsertUkPavilionMember(
  input: Partial<UkPavilionMember> & {
    companyName: string;
    contactEmail: string;
  },
): UkPavilionMember {
  const current = getUkPavilionState();
  const now = nowIso();
  const existing = input.id
    ? current.members.find((row) => row.id === input.id)
    : undefined;

  const next: UkPavilionMember = {
    id: existing?.id ?? input.id ?? newId(),
    companyName: input.companyName.trim(),
    contactName: (input.contactName ?? existing?.contactName ?? "").trim(),
    contactEmail: input.contactEmail.trim(),
    signedUpAt: (input.signedUpAt ?? existing?.signedUpAt ?? todayIso()).slice(0, 10),
    amountGbp:
      Number(input.amountGbp ?? existing?.amountGbp ?? UK_PAVILION_FEE_GBP) ||
      UK_PAVILION_FEE_GBP,
    status: input.status ?? existing?.status ?? "pending",
    notes: (input.notes ?? existing?.notes ?? "").trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const members = existing
    ? current.members.map((row) => (row.id === existing.id ? next : row))
    : [next, ...current.members];

  writeState({ members });
  return next;
}

export function deleteUkPavilionMember(id: string) {
  const current = getUkPavilionState();
  writeState({ members: current.members.filter((row) => row.id !== id) });
}

export function formatPavilionMoney(amount: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
