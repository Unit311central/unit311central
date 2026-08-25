/**
 * Demo Fundraising — browser-persisted workspace data (localStorage).
 * Replaces ephemeral useState-only CRUD on the Demo host.
 */

import type {
  DataRoomRow,
  DemoInvestor,
  FundraisingMeeting,
  FundraisingPipelineDeal,
  PitchDeckVersion,
} from "@/lib/demo/fundraising-data";
import {
  NORTHSTAR_FUNDING_ROUNDS,
  NORTHSTAR_FUNDRAISING_PIPELINE_SEED,
  NORTHSTAR_INVESTORS,
} from "@/lib/demo/fundraising-data";
import {
  getNorthstarDataRooms,
  getNorthstarFundraisingMeetings,
  getNorthstarPitchDecks,
} from "@/lib/demo/module-fixtures";
import type { DemoFundingRoundId } from "@/lib/demo/demo-company-identity";

const STORAGE_KEY = "unit311-demo-fundraising-v1";

type FundraisingStore = {
  investors: DemoInvestor[];
  pipeline: FundraisingPipelineDeal[];
  meetings: FundraisingMeeting[];
  dataRooms: DataRoomRow[];
  pitchDecks: PitchDeckVersion[];
  currentRoundId: DemoFundingRoundId;
};

function defaultStore(): FundraisingStore {
  return {
    investors: NORTHSTAR_INVESTORS.map((row) => ({ ...row })),
    pipeline: NORTHSTAR_FUNDRAISING_PIPELINE_SEED.map((row) => ({ ...row })),
    meetings: getNorthstarFundraisingMeetings().map((row) => ({ ...row })),
    dataRooms: getNorthstarDataRooms().map((row) => ({ ...row })),
    pitchDecks: getNorthstarPitchDecks().map((row) => ({ ...row })),
    currentRoundId: "seed",
  };
}

function readStore(): FundraisingStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<FundraisingStore>;
    const base = defaultStore();
    return {
      investors: Array.isArray(parsed.investors) ? parsed.investors : base.investors,
      pipeline: Array.isArray(parsed.pipeline) ? parsed.pipeline : base.pipeline,
      meetings: Array.isArray(parsed.meetings) ? parsed.meetings : base.meetings,
      dataRooms: Array.isArray(parsed.dataRooms) ? parsed.dataRooms : base.dataRooms,
      pitchDecks: Array.isArray(parsed.pitchDecks) ? parsed.pitchDecks : base.pitchDecks,
      currentRoundId:
        parsed.currentRoundId === "pre-seed" ||
        parsed.currentRoundId === "seed" ||
        parsed.currentRoundId === "series-a" ||
        parsed.currentRoundId === "series-b"
          ? parsed.currentRoundId
          : base.currentRoundId,
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: FundraisingStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // quota / private mode
  }
}

export function loadDemoFundraisingInvestors(): DemoInvestor[] {
  return readStore().investors;
}

export function saveDemoFundraisingInvestors(investors: DemoInvestor[]) {
  const store = readStore();
  store.investors = investors;
  writeStore(store);
}

export function loadDemoFundraisingPipeline(): FundraisingPipelineDeal[] {
  return readStore().pipeline;
}

export function saveDemoFundraisingPipeline(pipeline: FundraisingPipelineDeal[]) {
  const store = readStore();
  store.pipeline = pipeline;
  writeStore(store);
}

export function loadDemoFundraisingMeetings(): FundraisingMeeting[] {
  return readStore().meetings;
}

export function saveDemoFundraisingMeetings(meetings: FundraisingMeeting[]) {
  const store = readStore();
  store.meetings = meetings;
  writeStore(store);
}

export function loadDemoFundraisingDataRooms(): DataRoomRow[] {
  return readStore().dataRooms;
}

export function saveDemoFundraisingDataRooms(dataRooms: DataRoomRow[]) {
  const store = readStore();
  store.dataRooms = dataRooms;
  writeStore(store);
}

export function loadDemoFundraisingPitchDecks(): PitchDeckVersion[] {
  return readStore().pitchDecks;
}

export function saveDemoFundraisingPitchDecks(pitchDecks: PitchDeckVersion[]) {
  const store = readStore();
  store.pitchDecks = pitchDecks;
  writeStore(store);
}

export function loadDemoCurrentFundingRoundId(): DemoFundingRoundId {
  return readStore().currentRoundId;
}

export function saveDemoCurrentFundingRoundId(roundId: DemoFundingRoundId) {
  const store = readStore();
  store.currentRoundId = roundId;
  writeStore(store);
}

export function loadDemoFundingRounds() {
  return NORTHSTAR_FUNDING_ROUNDS.map((round) => ({ ...round }));
}
