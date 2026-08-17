/**
 * Server-only workspace tool definitions and handlers.
 */

import { ABHI_EA_PDF_TOOL_DEFINITIONS } from "@/lib/abhi/ea-pdf-tools";
import { NORTHSTAR_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/northstar-executive-tools";
import { ABHI_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/talanton-executive-tools";
import { ONWARDAIR_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/onwardair-executive-tools";
import { TALANTON_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/talanton-executive-tools";

import { abhiPackToolHandlers } from "./handlers/abhi";
import { demoPackToolHandlers } from "./handlers/demo";
import { onwardAirPackToolHandlers } from "./handlers/onwardair";
import { talantonPackToolHandlers } from "./handlers/talanton";
import type { EaWorkspacePack } from "./types";

export const SERVER_PACK_TOOL_DEFINITIONS: Record<string, EaWorkspacePack["toolDefinitions"]> = {
  abhi: [...ABHI_EXECUTIVE_TOOL_DEFINITIONS, ...ABHI_EA_PDF_TOOL_DEFINITIONS],
  talanton: [...TALANTON_EXECUTIVE_TOOL_DEFINITIONS],
  onwardair: [...ONWARDAIR_EXECUTIVE_TOOL_DEFINITIONS],
  demo: [...NORTHSTAR_EXECUTIVE_TOOL_DEFINITIONS],
};

export const SERVER_PACK_TOOL_HANDLERS: Record<string, Record<string, unknown>> = {
  abhi: abhiPackToolHandlers,
  talanton: talantonPackToolHandlers,
  onwardair: onwardAirPackToolHandlers,
  demo: demoPackToolHandlers,
};
