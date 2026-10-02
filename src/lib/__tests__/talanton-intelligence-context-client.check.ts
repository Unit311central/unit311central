/**
 * Talanton intelligence context client store must expose a stable useSyncExternalStore snapshot.
 * Run: node --import tsx src/lib/__tests__/talanton-intelligence-context-client.check.ts
 */
import assert from "node:assert/strict";

import {
  getTalantonIntelligenceContextClientSnapshot,
  subscribeTalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context-client";

const a = getTalantonIntelligenceContextClientSnapshot();
const b = getTalantonIntelligenceContextClientSnapshot();
assert.equal(a, b, "client snapshot reference must be stable between reads");

const listener = () => {};
const unsub = subscribeTalantonIntelligenceContext(listener);
const afterSubscribe = getTalantonIntelligenceContextClientSnapshot();
const again = getTalantonIntelligenceContextClientSnapshot();
assert.equal(afterSubscribe, again, "snapshot must stay stable after subscribe");
unsub();

console.log("talanton-intelligence-context-client.check.ts ok");
