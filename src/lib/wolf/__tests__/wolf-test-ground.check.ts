/**
 * WOLF Test Ground playlist rewrite and MediaMTX CDN fetch.
 *
 * Run: npx tsx src/lib/wolf/__tests__/wolf-test-ground.check.ts
 */
import assert from "node:assert/strict";

import {
  getWolfHlsUpstreamUrl,
  rewriteWolfHlsPlaylist,
  WOLF_HLS_UPSTREAM_URL,
  wolfTestGroundPlaybackPath,
  wolfTestGroundUpstreamUrl,
} from "@/lib/wolf/live-stream-proxy";
import { fetchWolfHlsResource } from "@/lib/wolf/live-stream-upstream";

const playlist = `#EXTM3U
#EXT-X-MEDIA:TYPE=AUDIO,GROUP-ID="audio",NAME="audio2",DEFAULT=YES,URI="audio2_stream.m3u8"
#EXT-X-STREAM-INF:BANDWIDTH=1,RESOLUTION=1280x720,CODECS="avc1.64001f,mp4a.40.2"
video1_stream.m3u8
#EXT-X-MAP:URI="init.mp4"
#EXT-X-PART:DURATION=0.20000,URI="video1_part1.m4s"
seg1.mp4
old.ts
`;

delete process.env.WOLF_LIVE_STREAM_URL;
assert.equal(getWolfHlsUpstreamUrl(), WOLF_HLS_UPSTREAM_URL);
assert.equal(wolfTestGroundPlaybackPath(), "/api/live/stream/index.m3u8");
assert.equal(
  wolfTestGroundUpstreamUrl("index.m3u8")?.href,
  "https://qep1qch979u8pa-8888.proxy.runpod.net/live/test/index.m3u8",
);
assert.equal(
  wolfTestGroundUpstreamUrl("video1_seg1.mp4", "?session=abc")?.href,
  "https://qep1qch979u8pa-8888.proxy.runpod.net/live/test/video1_seg1.mp4?session=abc",
);
assert.equal(
  wolfTestGroundUpstreamUrl("part1.m4s")?.href,
  "https://qep1qch979u8pa-8888.proxy.runpod.net/live/test/part1.m4s",
);
assert.equal(wolfTestGroundUpstreamUrl("../secret"), null);
assert.equal(wolfTestGroundUpstreamUrl("a/../../etc"), null);
assert.equal(wolfTestGroundUpstreamUrl("notes.txt"), null);

const rewritten = rewriteWolfHlsPlaylist(playlist);
assert.match(rewritten, /\/api\/live\/stream\/audio2_stream\.m3u8/);
assert.match(rewritten, /\/api\/live\/stream\/video1_stream\.m3u8/);
assert.match(rewritten, /\/api\/live\/stream\/init\.mp4/);
assert.match(rewritten, /\/api\/live\/stream\/video1_part1\.m4s/);
assert.match(rewritten, /\/api\/live\/stream\/seg1\.mp4/);
assert.match(rewritten, /\/api\/live\/stream\/old\.ts/);
assert.doesNotMatch(rewritten, /4s4dzedw76v0re|qep1qch979u8pa/);
assert.doesNotMatch(rewritten, /wolf-aeris/);
assert.doesNotMatch(rewritten, /8890/);

async function main(): Promise<void> {
const requested: string[] = [];
const originalFetch = globalThis.fetch;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = String(input);
  requested.push(url);
  const headers = new Headers(init?.headers);
  assert.equal(headers.get("authorization"), "Bearer test-secret");
  if (url.endsWith("/index.m3u8")) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: `${url}?cookieCheck=1`,
        "Set-Cookie": "cookieCheck=1; HttpOnly",
      },
    });
  }
  if (url.includes("cookieCheck=1")) {
    assert.match(headers.get("cookie") ?? "", /cookieCheck=1/);
    return new Response("#EXTM3U\nvideo1_stream.m3u8\n", {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.apple.mpegurl",
        "Set-Cookie": "hlsSession=abc; HttpOnly",
      },
    });
  }
  if (url.endsWith("/video1_seg1.mp4")) {
    return new Response(new Uint8Array([0x00, 0x00, 0x00, 0x18]), {
      status: 200,
      headers: { "Content-Type": "video/mp4" },
    });
  }
  return new Response("unexpected", { status: 500 });
}) as typeof fetch;

const manifest = WOLF_HLS_UPSTREAM_URL;
const master = await fetchWolfHlsResource(new URL(manifest), manifest, "test-secret");
assert.equal(master.status, 200);
assert.match(await master.text(), /video1_stream\.m3u8/);
const segment = await fetchWolfHlsResource(
  new URL("https://qep1qch979u8pa-8888.proxy.runpod.net/live/test/video1_seg1.mp4"),
  manifest,
  "test-secret",
);
assert.equal(segment.status, 200);
assert.equal((await segment.arrayBuffer()).byteLength, 4);
assert.equal(requested.some((url) => url.includes("8890")), false);
assert.equal(requested[0]?.includes("cookieCheck"), false);

globalThis.fetch = originalFetch;
console.log("wolf-test-ground.check.ts — all assertions passed.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
