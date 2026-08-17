/**
 * Server-only workspace tool schemas (no handler imports — avoids circular deps).
 */

import { ABHI_EA_PDF_TOOL_DEFINITIONS } from "@/lib/abhi/ea-pdf-tools";
import { NORTHSTAR_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/northstar-executive-tools";
import { ONWARDAIR_EXECUTIVE_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/onwardair-executive-tools";
import {
  ABHI_EXECUTIVE_TOOL_DEFINITIONS,
  TALANTON_EXECUTIVE_TOOL_DEFINITIONS,
} from "@/lib/ai-operating-assistant/talanton-executive-tools";
import type { EaWorkspacePack } from "./types";

export const SERVER_PACK_TOOL_DEFINITIONS: Record<
  string,
  NonNullable<EaWorkspacePack["toolDefinitions"]>
> = {
  abhi: [...ABHI_EXECUTIVE_TOOL_DEFINITIONS, ...ABHI_EA_PDF_TOOL_DEFINITIONS],
  talanton: [...TALANTON_EXECUTIVE_TOOL_DEFINITIONS],
  onwardair: [...ONWARDAIR_EXECUTIVE_TOOL_DEFINITIONS],
  demo: [...NORTHSTAR_EXECUTIVE_TOOL_DEFINITIONS],
};
