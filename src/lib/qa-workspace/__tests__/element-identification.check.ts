/**
 * Regression tests for QA element resolution.
 * Run: npm run prove:qa-element-identification
 */
import assert from "node:assert/strict";

import {
  BROAD_AI_TARGET_IDS,
  isBroadLayoutContainerSnapshot,
  isCapturableQaSnapshot,
  isDashboardTileArticleSnapshot,
  isDashboardWidgetShellSnapshot,
  pickBestQaCandidateIndex,
  qaElementSpecificityScore,
  type QaElementSnapshot,
} from "@/lib/qa-workspace/element-identification";

function snap(partial: Partial<QaElementSnapshot> & Pick<QaElementSnapshot, "tagName">): QaElementSnapshot {
  return {
    className: "",
    role: null,
    dataAiTarget: null,
    dataQaTarget: null,
    textContentLength: 0,
    childElementCount: 0,
    ...partial,
  };
}

// --- Home dashboard: Cash Available KPI tile vs home-tiles wrapper ---
const cashAvailableTile = snap({
  tagName: "div",
  className: "rounded-[12px] border p-4 border-[color:var(--platform-card-border,#243347)] px-3 py-3.5",
  textContentLength: 42,
  childElementCount: 3,
});

const cashLabel = snap({
  tagName: "p",
  className: "min-w-0 text-[11px] font-medium text-white/45",
  textContentLength: 14,
});

const homeTilesWrapper = snap({
  tagName: "div",
  dataAiTarget: "home-tiles",
  className: "space-y-3",
  textContentLength: 420,
  childElementCount: 4,
});

assert.ok(isDashboardWidgetShellSnapshot(cashAvailableTile), "KPI widget shell is recognised");
assert.ok(isBroadLayoutContainerSnapshot(homeTilesWrapper), "home-tiles is a broad layout container");
assert.equal(BROAD_AI_TARGET_IDS.has("home-tiles"), true);
assert.ok(!isCapturableQaSnapshot(homeTilesWrapper), "home-tiles must not be capturable");
assert.ok(isCapturableQaSnapshot(cashAvailableTile), "KPI tile must be capturable");

const homeClickChain = [cashLabel, cashAvailableTile, homeTilesWrapper];
const homePick = pickBestQaCandidateIndex(homeClickChain);
assert.equal(homePick, 1, "Cash Available click must resolve to KPI tile, not home-tiles wrapper");

// --- Business Central Clients: article tile vs inner label ---
const bcTile = snap({
  tagName: "article",
  className: "relative rounded-xl border p-4 border-white/10 bg-white/[0.03]",
  textContentLength: 28,
  childElementCount: 2,
});

const bcLabel = snap({
  tagName: "p",
  className: "text-[10px] font-medium uppercase tracking-[0.12em] text-white/45",
  textContentLength: 13,
});

assert.ok(isDashboardTileArticleSnapshot(bcTile), "BC dashboard tile article is recognised");
const bcPick = pickBestQaCandidateIndex([bcLabel, bcTile]);
assert.equal(bcPick, 1, "BC tile click must resolve to article tile");

// --- Button inside tile prefers the button ---
const addClientButton = snap({
  tagName: "button",
  className: "inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-xs",
  textContentLength: 10,
});

const bcButtonPick = pickBestQaCandidateIndex([addClientButton, bcTile]);
assert.equal(bcButtonPick, 0, "Button click must resolve to the button, not parent tile");

// --- Table cell targeting ---
const tableCell = snap({
  tagName: "td",
  className: "px-3 py-2 text-sm text-white/80",
  textContentLength: 18,
});

assert.ok(isCapturableQaSnapshot(tableCell), "table cells remain capturable");
assert.ok(qaElementSpecificityScore(tableCell) >= 90, "table cells score highly");

// --- Large rounded-xl wrapper is deprioritised ---
const largeWrapper = snap({
  tagName: "div",
  className: "rounded-xl border border-white/10 bg-white/[0.03] p-4",
  textContentLength: 360,
  childElementCount: 12,
});

assert.ok(
  qaElementSpecificityScore(cashAvailableTile) > qaElementSpecificityScore(largeWrapper),
  "specific KPI tile must outrank a large generic wrapper",
);

console.log("ok  qa-element-identification checks passed\n");
