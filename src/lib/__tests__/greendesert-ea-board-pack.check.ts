/**
 * Green Desert EA board pack routing checks.
 * Run: npx tsx src/lib/__tests__/greendesert-ea-board-pack.check.ts
 */
import assert from "node:assert/strict";

import { resolveAbhiBoardPackIntent } from "@/lib/abhi/board-pack-intent";
import { ensureEaClientWorkspacePacksRegistered } from "@/lib/ai-operating-assistant/workspace-packs/client-bootstrap";
import {
  workspacePackSupportsBoardPack,
} from "@/lib/ai-operating-assistant/workspace-packs/client-pack-ui";
import { getEaClientWorkspacePackForSlug } from "@/lib/ai-operating-assistant/workspace-packs/registry-client";
import { getServerBoardPackConfigForPackId } from "@/lib/ai-operating-assistant/workspace-packs/server-pack-config";
import { GREENDESERT_SLUG } from "@/lib/greendesert-surface";

ensureEaClientWorkspacePacksRegistered();

const pack = getEaClientWorkspacePackForSlug(GREENDESERT_SLUG);
assert.ok(pack);
assert.equal(pack?.id, "greendesert");
assert.equal(workspacePackSupportsBoardPack(GREENDESERT_SLUG), true);

async function main() {
  const boardPack = await getServerBoardPackConfigForPackId("greendesert");
  assert.ok(boardPack?.supportsBoardPack);
  assert.equal(typeof boardPack?.generateArtifacts, "function");

  const intent = resolveAbhiBoardPackIntent("build me a board deck pdf");
  assert.ok(intent);
  assert.equal(intent?.tool, "boardpack.generate");

  console.log("greendesert-ea-board-pack.check.ts — all assertions passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
