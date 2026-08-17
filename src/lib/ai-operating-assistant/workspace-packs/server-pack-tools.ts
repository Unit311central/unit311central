/**
 * Server-only workspace tool handlers.
 */

import { abhiPackToolHandlers } from "./handlers/abhi";
import { demoPackToolHandlers } from "./handlers/demo";
import { onwardAirPackToolHandlers } from "./handlers/onwardair";
import { talantonPackToolHandlers } from "./handlers/talanton";

export { SERVER_PACK_TOOL_DEFINITIONS } from "./server-pack-tool-definitions";

export const SERVER_PACK_TOOL_HANDLERS: Record<string, Record<string, unknown>> = {
  abhi: abhiPackToolHandlers,
  talanton: talantonPackToolHandlers,
  onwardair: onwardAirPackToolHandlers,
  demo: demoPackToolHandlers,
};
