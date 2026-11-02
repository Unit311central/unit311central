/**
 * WOLF Test Ground playlist rewrite.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-test-ground.check.ts
 */
import assert from "node:assert/strict";

import {
  rewriteWolfCloudPlaylist,
  wolfTestGroundPlaybackPath,
  wolfTestGroundUpstreamUrl,
} from "@/lib/wolf/live-stream-proxy";

const playlist = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=1280x720
/api/live/stream/main_stream.m3u8
`;

const rewritten = rewriteWolfCloudPlaylist(playlist);
assert.match(rewritten, /\/api\/wolf\/live\/stream\/main_stream\.m3u8/);
assert.doesNotMatch(rewritten, /\/api\/live\/stream\//);
assert.equal(wolfTestGroundPlaybackPath(), "/api/wolf/live/stream/index.m3u8");
assert.equal(
  wolfTestGroundUpstreamUrl("index.m3u8"),
  "https://wolf-aeris.vercel.app/api/live/stream/index.m3u8",
);
assert.equal(
  wolfTestGroundUpstreamUrl("eb6dab1ed7b1_main_seg1.ts", "?x=1"),
  "https://wolf-aeris.vercel.app/api/live/stream/eb6dab1ed7b1_main_seg1.ts?x=1",
);
assert.equal(wolfTestGroundUpstreamUrl("../secret"), null);
assert.equal(wolfTestGroundUpstreamUrl("a/../../etc"), null);

console.log("wolf-test-ground.check.ts — all assertions passed.");
