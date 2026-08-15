/**
 * EA workspace provisioning checklist — developer guard for new workspaces.
 * Run: npm run prove:ea-provisioning
 */
import assert from "node:assert/strict";

import { listPlatformModules } from "@/lib/ai-operating-assistant/application-catalogue";
import { shouldSynthesizeExecutiveToolResult } from "@/lib/ai-operating-assistant/ea-llm-synthesis";
import { getOpenAIToolSchemas } from "@/lib/ai-operating-assistant/tool-service";
import { getPackToolHandlers } from "@/lib/ai-operating-assistant/workspace-packs/handlers-registry";
import { getServerBoardPackConfigForPackId } from "@/lib/ai-operating-assistant/workspace-packs/server-pack-config";
import { SERVER_PACK_TOOL_DEFINITIONS } from "@/lib/ai-operating-assistant/workspace-packs/server-pack-tools";
import {
  EA_PROVISIONING_REQUIRED_PACK_IDS,
  ensureEaWorkspacePacksRegistered,
  getEaWorkspacePackForSlug,
  listEaWorkspacePacks,
} from "@/lib/ai-operating-assistant/workspace-packs";

const WORKSPACE_SLUGS: Record<string, string> = {
  abhi: "abhi",
  talanton: "talantonimpact",
  onwardair: "onwardair",
  internal: "unit311",
  demo: "demo",
};

const CORE_EA_TOOLS = ["queryBusiness", "getDailyBrief", "searchApplications"] as const;

function assertGenericCentralTools(slug: string, packId: string) {
  const schemas = getOpenAIToolSchemas(slug);
  assert.ok(schemas.length > 0, `${packId}: tool schemas missing`);
  const names = new Set(schemas.map((schema) => schema.name));
  for (const required of CORE_EA_TOOLS) {
    assert.ok(names.has(required), `${packId}: missing central tool ${required}`);
  }
}

function main() {
  ensureEaWorkspacePacksRegistered();
  const packs = listEaWorkspacePacks();
  const packIds = new Set(packs.map((pack) => pack.id));

  for (const requiredId of EA_PROVISIONING_REQUIRED_PACK_IDS) {
    assert.ok(packIds.has(requiredId), `missing required pack: ${requiredId}`);
  }

  for (const pack of packs) {
    assert.ok(pack.matchesSlug, `${pack.id}: matchesSlug required`);
    assert.ok(pack.navProvider, `${pack.id}: navProvider required`);
    assert.ok(
      pack.synthesisRules?.length,
      `${pack.id}: synthesisRules required for EA-enabled workspace`,
    );

    const slug = WORKSPACE_SLUGS[pack.id];
    if (!slug) continue;

    assert.ok(pack.matchesSlug(slug), `${pack.id}: matchesSlug("${slug}") failed`);
    const nav = pack.navProvider(slug);
    assert.ok(nav.length > 0, `${pack.id}: navProvider returned empty nav`);

    const modules = listPlatformModules({ workspaceSlug: slug });
    assert.ok(modules.length > 0, `${pack.id}: catalogue spot-check failed`);

    assertGenericCentralTools(slug, pack.id);

    const toolDefinitions = SERVER_PACK_TOOL_DEFINITIONS[pack.id];
    if (toolDefinitions?.length) {
      for (const tool of toolDefinitions) {
        const handler = getPackToolHandlers()[tool.name];
        assert.ok(handler, `${pack.id}: missing handler for ${tool.name}`);
      }
    }

    if (pack.clientSupportsBoardPack) {
      assert.ok(
        getServerBoardPackConfigForPackId(pack.id)?.supportsBoardPack,
        `${pack.id}: client board-pack flag without server config`,
      );
    } else {
      assert.equal(
        getServerBoardPackConfigForPackId(pack.id)?.supportsBoardPack ?? false,
        false,
        `${pack.id}: unexpected server board-pack config without client flag`,
      );
    }

    const synthesizesCore = shouldSynthesizeExecutiveToolResult({
      workspaceSlug: slug,
      toolName: "queryBusiness",
      toolArgs: { question: "test" },
      userMessage: "test",
      toolResult: { status: "ok" },
    });
    assert.ok(synthesizesCore, `${pack.id}: queryBusiness synthesis not configured`);
  }

  console.log(
    `EA provisioning checklist passed (${EA_PROVISIONING_REQUIRED_PACK_IDS.length} active workspace packs).`,
  );
}

main();
