/**
 * Demo cap table — browser-persisted shareholder and option grant data.
 */

import {
  buildNorthstarCapTableSnapshot,
  type NorthstarCapTableRow,
  type NorthstarOptionGrant,
} from "@/lib/demo/northstar-cap-table-data";

const STORAGE_KEY = "unit311-demo-cap-table-v2";

type CapTableStore = {
  shareholders: NorthstarCapTableRow[];
  optionGrants: NorthstarOptionGrant[];
};

function defaultStore(): CapTableStore {
  const seed = buildNorthstarCapTableSnapshot();
  return {
    shareholders: seed.shareholders.map((row) => ({ ...row })),
    optionGrants: seed.optionGrants.map((row) => ({ ...row })),
  };
}

function readStore(): CapTableStore {
  if (typeof window === "undefined") return defaultStore();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<CapTableStore>;
    const base = defaultStore();
    return {
      shareholders: Array.isArray(parsed.shareholders) ? parsed.shareholders : base.shareholders,
      optionGrants: Array.isArray(parsed.optionGrants) ? parsed.optionGrants : base.optionGrants,
    };
  } catch {
    return defaultStore();
  }
}

function writeStore(store: CapTableStore) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore
  }
}

export function loadDemoCapTableShareholders(): NorthstarCapTableRow[] {
  return readStore().shareholders;
}

export function saveDemoCapTableShareholders(shareholders: NorthstarCapTableRow[]) {
  writeStore({ ...readStore(), shareholders });
}

export function loadDemoCapTableOptionGrants(): NorthstarOptionGrant[] {
  return readStore().optionGrants;
}

export function saveDemoCapTableOptionGrants(optionGrants: NorthstarOptionGrant[]) {
  writeStore({ ...readStore(), optionGrants });
}
