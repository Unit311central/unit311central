/**
 * Server-only EA org-state request wrappers (node:async_hooks).
 * Not imported from client bundles — assistant-runtime only.
 */

import {
  iterateWithAbhiRequestOrgState,
  parseAbhiClientOrgState,
} from "@/lib/abhi/abhi-request-org-state";
import {
  iterateWithTalantonRequestOrgState,
  parseTalantonClientOrgState,
} from "@/lib/talanton/talanton-request-org-state";

export type EaServerOrgStateBinding = {
  requestField: string;
  parseRequestPayload: (raw: unknown) => unknown;
  wrapAssistantTurn: (
    state: unknown,
    inner: () => AsyncGenerator<unknown, void, unknown>,
  ) => AsyncGenerator<unknown, void, unknown>;
};

export const EA_SERVER_ORG_STATE_BINDINGS: readonly EaServerOrgStateBinding[] = [
  {
    requestField: "abhiOrgState",
    parseRequestPayload: parseAbhiClientOrgState,
    wrapAssistantTurn: (state, inner) =>
      iterateWithAbhiRequestOrgState(
        state as Parameters<typeof iterateWithAbhiRequestOrgState>[0],
        inner() as AsyncGenerator<unknown>,
      ),
  },
  {
    requestField: "talantonOrgState",
    parseRequestPayload: parseTalantonClientOrgState,
    wrapAssistantTurn: (state, inner) =>
      iterateWithTalantonRequestOrgState(
        state as Parameters<typeof iterateWithTalantonRequestOrgState>[0],
        inner() as AsyncGenerator<unknown>,
      ),
  },
];
