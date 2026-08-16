/**
 * Northstar Demo — editable minutes, decisions, and actions (separate from meeting register).
 */

type Listener = () => void;

export type NorthstarMinuteSummary = {
  id: string;
  meetingId: string;
  meetingDate: string;
  meetingTitle: string;
  summary: string;
};

export type NorthstarDecisionRecord = {
  id: string;
  meetingId: string;
  meetingDate: string;
  text: string;
  resolution: string;
};

export type NorthstarActionRecord = {
  id: string;
  meetingId: string;
  meetingDate: string;
  title: string;
  owner: string;
  dueDate: string;
  status: string;
};

export type NorthstarMinutesState = {
  summaries: NorthstarMinuteSummary[];
  decisions: NorthstarDecisionRecord[];
  actions: NorthstarActionRecord[];
};

const STORAGE_KEY = "unit311-northstar-board-minutes-v1";
const listeners = new Set<Listener>();

function seedState(): NorthstarMinutesState {
  return {
    summaries: [
      {
        id: "min-q1",
        meetingId: "NS-BM-2026-Q1",
        meetingDate: "2026-03-20",
        meetingTitle: "Northstar Board Meeting — Q1 2026",
        summary:
          "Q1 revenue ahead of plan but margin compressed. Board endorsed margin recovery programme and phased Atlas delivery. Supplier risk elevated pending diversification update.",
      },
      {
        id: "min-q2",
        meetingId: "NS-BM-2026-Q2",
        meetingDate: "2026-06-19",
        meetingTitle: "Northstar Board Meeting — Q2 2026",
        summary:
          "Margin recovery on track. Atlas UAT progressing. Board approved US expansion within controlled burn and signed off Siemens backup supplier path.",
      },
    ],
    decisions: [
      {
        id: "NS-D-Q1-01",
        meetingId: "NS-BM-2026-Q1",
        meetingDate: "2026-03-20",
        text: "Approve margin recovery plan targeting 58% gross margin by Q3.",
        resolution: "Approved unanimously.",
      },
      {
        id: "NS-D-Q1-02",
        meetingId: "NS-BM-2026-Q1",
        meetingDate: "2026-03-20",
        text: "Authorise phased Atlas go-live with Sheffield Precision Engineering.",
        resolution: "Approved — weekly steering until stabilised.",
      },
      {
        id: "NS-D-Q2-01",
        meetingId: "NS-BM-2026-Q2",
        meetingDate: "2026-06-19",
        text: "Confirm US Austin sales expansion — two FTE authorised within burn guardrails.",
        resolution: "Approved.",
      },
      {
        id: "NS-D-Q2-02",
        meetingId: "NS-BM-2026-Q2",
        meetingDate: "2026-06-19",
        text: "Approve backup supplier MOU with Siemens Industrial.",
        resolution: "Approved — procurement to execute by July.",
      },
    ],
    actions: [
      {
        id: "NS-A-Q1-01",
        meetingId: "NS-BM-2026-Q1",
        meetingDate: "2026-03-20",
        title: "Present supplier diversification plan (Siemens Industrial MOU)",
        owner: "James Okonkwo",
        dueDate: "2026-05-15",
        status: "Completed",
      },
      {
        id: "NS-A-Q2-01",
        meetingId: "NS-BM-2026-Q2",
        meetingDate: "2026-06-19",
        title: "Execute Siemens Industrial backup supplier MOU",
        owner: "James Okonkwo",
        dueDate: "2026-07-31",
        status: "Underway",
      },
    ],
  };
}

let state: NorthstarMinutesState = seedState();
const serverSnapshot = seedState();
let hydrated = false;

function persistState(next: NorthstarMinutesState) {
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
      const parsed = JSON.parse(raw) as NorthstarMinutesState;
      if (parsed?.summaries && parsed?.decisions && parsed?.actions) state = parsed;
      else persistState(state);
    } else persistState(state);
  } catch {
    persistState(state);
  }
}

function writeState(next: NorthstarMinutesState) {
  ensureHydrated();
  state = next;
  persistState(next);
  listeners.forEach((l) => l());
}

export function getNorthstarMinutesState(): NorthstarMinutesState {
  ensureHydrated();
  return state;
}

export function getNorthstarMinutesServerSnapshot(): NorthstarMinutesState {
  return serverSnapshot;
}

export function subscribeNorthstarMinutes(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function nextId(prefix: string, existing: string[]): string {
  let n = existing.length + 1;
  let id = `${prefix}-${n}`;
  while (existing.includes(id)) {
    n += 1;
    id = `${prefix}-${n}`;
  }
  return id;
}

export function upsertNorthstarMinuteSummary(
  input: Partial<NorthstarMinuteSummary> & { meetingDate: string; meetingTitle: string },
): NorthstarMinuteSummary {
  const current = getNorthstarMinutesState();
  const existing = input.id
    ? current.summaries.find((s) => s.id === input.id)
    : undefined;
  const next: NorthstarMinuteSummary = {
    id:
      existing?.id ??
      input.id ??
      nextId(
        "min",
        current.summaries.map((s) => s.id),
      ),
    meetingId: input.meetingId ?? existing?.meetingId ?? `NS-BM-${input.meetingDate.slice(0, 7)}`,
    meetingDate: input.meetingDate,
    meetingTitle: input.meetingTitle,
    summary: (input.summary ?? existing?.summary ?? "").trim(),
  };
  const summaries = existing
    ? current.summaries.map((s) => (s.id === existing.id ? next : s))
    : [next, ...current.summaries];
  writeState({ ...current, summaries });
  return next;
}

export function deleteNorthstarMinuteSummary(id: string) {
  const current = getNorthstarMinutesState();
  writeState({ ...current, summaries: current.summaries.filter((s) => s.id !== id) });
}

export function upsertNorthstarDecision(
  input: Partial<NorthstarDecisionRecord> & { text: string; meetingDate: string },
): NorthstarDecisionRecord {
  const current = getNorthstarMinutesState();
  const existing = input.id ? current.decisions.find((d) => d.id === input.id) : undefined;
  const next: NorthstarDecisionRecord = {
    id:
      existing?.id ??
      input.id ??
      nextId(
        "NS-D",
        current.decisions.map((d) => d.id),
      ),
    meetingId: input.meetingId ?? existing?.meetingId ?? "",
    meetingDate: input.meetingDate,
    text: input.text.trim(),
    resolution: (input.resolution ?? existing?.resolution ?? "").trim(),
  };
  const decisions = existing
    ? current.decisions.map((d) => (d.id === existing.id ? next : d))
    : [next, ...current.decisions];
  writeState({ ...current, decisions });
  return next;
}

export function deleteNorthstarDecision(id: string) {
  const current = getNorthstarMinutesState();
  writeState({ ...current, decisions: current.decisions.filter((d) => d.id !== id) });
}

export function upsertNorthstarActionRecord(
  input: Partial<NorthstarActionRecord> & { title: string; meetingDate: string },
): NorthstarActionRecord {
  const current = getNorthstarMinutesState();
  const existing = input.id ? current.actions.find((a) => a.id === input.id) : undefined;
  const next: NorthstarActionRecord = {
    id:
      existing?.id ??
      input.id ??
      nextId(
        "NS-A",
        current.actions.map((a) => a.id),
      ),
    meetingId: input.meetingId ?? existing?.meetingId ?? "",
    meetingDate: input.meetingDate,
    title: input.title.trim(),
    owner: (input.owner ?? existing?.owner ?? "").trim(),
    dueDate: (input.dueDate ?? existing?.dueDate ?? input.meetingDate).slice(0, 10),
    status: (input.status ?? existing?.status ?? "Underway").trim(),
  };
  const actions = existing
    ? current.actions.map((a) => (a.id === existing.id ? next : a))
    : [next, ...current.actions];
  writeState({ ...current, actions });
  return next;
}

export function deleteNorthstarActionRecord(id: string) {
  const current = getNorthstarMinutesState();
  writeState({ ...current, actions: current.actions.filter((a) => a.id !== id) });
}
