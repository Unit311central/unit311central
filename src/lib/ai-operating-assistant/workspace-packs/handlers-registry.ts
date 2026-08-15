/**
 * Pack-owned EA tool handlers — registered at bootstrap, merged in tool-service.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";

export type EaPackToolHandler = (
  args: Record<string, unknown>,
  ctx: { business: AssistantBusinessContext },
) => Promise<unknown>;

const packHandlers: Record<string, EaPackToolHandler> = {};

export function registerPackToolHandlers(
  handlers: Record<string, EaPackToolHandler>,
): void {
  Object.assign(packHandlers, handlers);
}

export function getPackToolHandlers(): Readonly<Record<string, EaPackToolHandler>> {
  return packHandlers;
}

export function clearPackToolHandlersForTests(): void {
  for (const key of Object.keys(packHandlers)) {
    delete packHandlers[key];
  }
}
