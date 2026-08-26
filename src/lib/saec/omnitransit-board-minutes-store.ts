/**
 * OmniTransit board minutes / decisions / actions — client-editable demo store.
 */

export type OmniTransitMinuteSummary = {
  id: string;
  meetingDate: string;
  meetingTitle: string;
  summary: string;
};

export type OmniTransitBoardDecision = {
  id: string;
  meetingDate: string;
  text: string;
  resolution: string;
};

export type OmniTransitBoardAction = {
  id: string;
  meetingDate: string;
  title: string;
  owner: string;
  dueDate: string;
  status: string;
};

const STORAGE_KEY = "omnitransit-board-minutes-v1";

type StoreState = {
  summaries: OmniTransitMinuteSummary[];
  decisions: OmniTransitBoardDecision[];
  actions: OmniTransitBoardAction[];
};

const SEED: StoreState = {
  summaries: [
    {
      id: "omt-min-q2",
      meetingDate: "2026-06-18",
      meetingTitle: "Q2 2026 board meeting",
      summary:
        "Safety performance across Gauteng and KwaZulu-Natal portfolios reviewed. Western Cape expansion capex approved at R12.4M.",
    },
    {
      id: "omt-min-q1",
      meetingDate: "2026-03-14",
      meetingTitle: "Q1 2026 board meeting",
      summary:
        "Annual maintenance pricing model adopted. National escalator modernisation pipeline prioritised for public-sector tenders.",
    },
  ],
  decisions: [
    {
      id: "omt-dec-001",
      meetingDate: "2026-06-18",
      text: "Approve Western Cape depot expansion",
      resolution: "Capex envelope R12.4M with phased commissioning through FY2027.",
    },
    {
      id: "omt-dec-002",
      meetingDate: "2026-03-14",
      text: "Adopt national SLA pricing framework",
      resolution: "Commercial team to roll out tiered maintenance contracts from July 2026.",
    },
  ],
  actions: [
    {
      id: "omt-act-001",
      meetingDate: "2026-06-18",
      title: "Submit City of Johannesburg tender response",
      owner: "Johan Ferreira",
      dueDate: "2026-09-05",
      status: "In progress",
    },
    {
      id: "omt-act-002",
      meetingDate: "2026-06-18",
      title: "Complete CANNY supplier diversification review",
      owner: "Naledi Khumalo",
      dueDate: "2026-08-30",
      status: "Outstanding",
    },
    {
      id: "omt-act-003",
      meetingDate: "2026-03-14",
      title: "Publish FY2026 safety dashboard to board portal",
      owner: "Sipho Ndlovu",
      dueDate: "2026-08-20",
      status: "Complete",
    },
  ],
};

function readStore(): StoreState {
  if (typeof window === "undefined") return structuredClone(SEED);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(SEED);
    const parsed = JSON.parse(raw) as StoreState;
    if (!parsed?.summaries || !parsed?.decisions || !parsed?.actions) return structuredClone(SEED);
    return parsed;
  } catch {
    return structuredClone(SEED);
  }
}

function writeStore(state: StoreState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadOmniTransitMinutesStore(): StoreState {
  return readStore();
}

export function upsertOmniTransitMinuteSummary(
  input: Omit<OmniTransitMinuteSummary, "id"> & { id?: string },
) {
  const store = readStore();
  const id = input.id ?? `omt-min-${Date.now()}`;
  const row: OmniTransitMinuteSummary = { ...input, id };
  const idx = store.summaries.findIndex((s) => s.id === id);
  if (idx >= 0) store.summaries[idx] = row;
  else store.summaries.push(row);
  writeStore(store);
  return row;
}

export function deleteOmniTransitMinuteSummary(id: string) {
  const store = readStore();
  store.summaries = store.summaries.filter((s) => s.id !== id);
  writeStore(store);
}

export function upsertOmniTransitDecision(
  input: Omit<OmniTransitBoardDecision, "id"> & { id?: string },
) {
  const store = readStore();
  const id = input.id ?? `omt-dec-${Date.now()}`;
  const row: OmniTransitBoardDecision = { ...input, id };
  const idx = store.decisions.findIndex((s) => s.id === id);
  if (idx >= 0) store.decisions[idx] = row;
  else store.decisions.push(row);
  writeStore(store);
  return row;
}

export function deleteOmniTransitDecision(id: string) {
  const store = readStore();
  store.decisions = store.decisions.filter((s) => s.id !== id);
  writeStore(store);
}

export function upsertOmniTransitAction(
  input: Omit<OmniTransitBoardAction, "id"> & { id?: string },
) {
  const store = readStore();
  const id = input.id ?? `omt-act-${Date.now()}`;
  const row: OmniTransitBoardAction = { ...input, id };
  const idx = store.actions.findIndex((s) => s.id === id);
  if (idx >= 0) store.actions[idx] = row;
  else store.actions.push(row);
  writeStore(store);
  return row;
}

export function deleteOmniTransitAction(id: string) {
  const store = readStore();
  store.actions = store.actions.filter((s) => s.id !== id);
  writeStore(store);
}
