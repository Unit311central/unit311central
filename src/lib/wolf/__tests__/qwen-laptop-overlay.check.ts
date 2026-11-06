/**
 * Qwen scene overlay parsing, placement, and the RunPod vision client.
 *
 * Run: npx tsx src/lib/wolf/__tests__/qwen-laptop-overlay.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";

import { askQwenAboutLaptop } from "@/lib/wolf/qwen-laptop-client";
import { laptopOverlayPixels, parseQwenLaptopOverlay, qwenLaptopPrompt } from "@/lib/wolf/qwen-laptop-overlay";

assert.match(qwenLaptopPrompt(), /tables and chairs/);
assert.match(qwenLaptopPrompt(), /DJI Neo/);

const scene = parseQwenLaptopOverlay(
  '```json\n{"objects":[{"label":"chair","box":{"x":0.2,"y":0.3,"width":0.4,"height":0.25}},{"label":"table","box":{"x":0.1,"y":0.5,"width":0.5,"height":0.2}}]}\n```',
);
assert.deepEqual(
  scene.objects.map((object) => object.label),
  ["chair", "table"],
);
assert.deepEqual(scene.objects[0]?.box, { x: 0.2, y: 0.3, width: 0.4, height: 0.25 });

const empty = parseQwenLaptopOverlay('{"objects":[]}');
assert.deepEqual(empty.objects, []);
assert.equal(parseQwenLaptopOverlay("a chair is here").objects.length, 0);
assert.equal(
  parseQwenLaptopOverlay('{"objects":[{"label":"chair","box":{"x":2,"y":0,"width":0.2,"height":0.2}}]}').objects[0]
    ?.box,
  null,
);
assert.equal(
  parseQwenLaptopOverlay('{"objects":[{"label":"dining table!","box":{"x":0.1,"y":0.1,"width":0.2,"height":0.2}}]}')
    .objects[0]?.label,
  "dining table",
);

const pixels = laptopOverlayPixels(
  { width: 640, height: 360 },
  { width: 1280, height: 720 },
  { x: 0.2, y: 0.3, width: 0.4, height: 0.25 },
);
assert.equal(pixels.left, 128);
assert.equal(pixels.top, 108);
assert.equal(pixels.width, 256);
assert.equal(pixels.height, 90);
assert.equal(pixels.labelTop, -28);

const letterbox = laptopOverlayPixels(
  { width: 800, height: 360 },
  { width: 1280, height: 720 },
  { x: 0, y: 0, width: 1, height: 1 },
);
assert.equal(letterbox.left, 80);
assert.equal(letterbox.top, 0);
assert.equal(letterbox.width, 640);
assert.equal(letterbox.height, 360);

const page = fs.readFileSync("src/components/wolf/WolfGroundWebRtcWorkspace.tsx", "utf8");
assert.match(page, /WolfQwenLaptopOverlay/);
const sky = fs.readFileSync("src/components/wolf/WolfSkyWorkspace.tsx", "utf8");
assert.match(sky, /DJI Neo/);
const route = fs.readFileSync("src/app/api/wolf/live/qwen-overlay/route.ts", "utf8");
assert.match(route, /requireWolfCentralWorkspace/);
assert.match(route, /askQwenAboutLaptop/);
assert.match(route, /image\/jpeg/);

async function checkClient() {
  delete process.env.QWEN_API_KEY;
  delete process.env.WOLF_QWEN_API_KEY;
  delete process.env.WOLF_VISION_URL;
  delete process.env.QWEN_BASE_URL;
  delete process.env.QWEN_VISION_MODEL;
  const missing = await askQwenAboutLaptop(new Uint8Array([1, 2, 3]));
  assert.equal(missing.configured, false);
  assert.deepEqual(missing.objects, []);
  assert.match(missing.error ?? "", /WOLF_VISION_URL/);

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      assert.equal(req.headers.authorization, "Bearer EMPTY");
      assert.match(body, /data:image\/jpeg;base64,/);
      assert.match(body, /Qwen\/Qwen2\.5-VL-7B-Instruct/);
      assert.match(body, /tables and chairs/);
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  {
                    text: '{"objects":[{"label":"chair","box":{"x":0.1,"y":0.2,"width":0.3,"height":0.4}},{"label":"table","box":{"x":0.4,"y":0.5,"width":0.4,"height":0.3}}]}',
                  },
                ],
              },
            },
          ],
        }),
      );
    });
  });

  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("mock Qwen did not bind");
  process.env.WOLF_VISION_URL = `http://127.0.0.1:${address.port}/v1`;
  const seen = await askQwenAboutLaptop(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]));
  assert.equal(seen.configured, true);
  assert.equal(seen.error, null);
  assert.deepEqual(
    seen.objects.map((object) => object.label),
    ["chair", "table"],
  );
  assert.deepEqual(seen.objects[0]?.box, { x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
  server.close();
  delete process.env.WOLF_VISION_URL;
}

checkClient()
  .then(() => {
    console.log("qwen-laptop-overlay.check.ts — all assertions passed.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
