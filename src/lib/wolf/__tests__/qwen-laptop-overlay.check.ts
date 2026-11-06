/**
 * Qwen laptop overlay parsing, placement, and the vision client.
 *
 * Run: npx tsx src/lib/wolf/__tests__/qwen-laptop-overlay.check.ts
 */
import assert from "node:assert/strict";
import fs from "node:fs";
import http from "node:http";

import { askQwenAboutLaptop } from "@/lib/wolf/qwen-laptop-client";
import {
  QWEN_LAPTOP_LABEL,
  laptopOverlayPixels,
  parseQwenLaptopOverlay,
  qwenLaptopPrompt,
} from "@/lib/wolf/qwen-laptop-overlay";

assert.match(qwenLaptopPrompt(), /laptop computer/);

const fenced = parseQwenLaptopOverlay(
  '```json\n{"laptop":true,"label":"a computer","box":{"x":0.2,"y":0.3,"width":0.4,"height":0.25}}\n```',
);
assert.equal(fenced.laptop, true);
assert.equal(fenced.label, QWEN_LAPTOP_LABEL);
assert.deepEqual(fenced.box, { x: 0.2, y: 0.3, width: 0.4, height: 0.25 });

const clear = parseQwenLaptopOverlay('{"laptop":false,"box":{"x":0.2,"y":0.3,"width":0.4,"height":0.25}}');
assert.equal(clear.laptop, false);
assert.equal(clear.label, null);
assert.equal(clear.box, null);

const loose = parseQwenLaptopOverlay("I can see a laptop on the desk.");
assert.equal(loose.laptop, true);
assert.equal(loose.label, QWEN_LAPTOP_LABEL);
assert.equal(loose.box, null);

assert.equal(parseQwenLaptopOverlay("no laptop in this frame").laptop, false);
assert.equal(parseQwenLaptopOverlay('{"laptop":true,"box":{"x":2,"y":0,"width":0.2,"height":0.2}}').box, null);

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
const route = fs.readFileSync("src/app/api/wolf/live/qwen-overlay/route.ts", "utf8");
assert.match(route, /requireWolfCentralWorkspace/);
assert.match(route, /askQwenAboutLaptop/);
assert.match(route, /image\/jpeg/);

async function checkClient() {
  delete process.env.QWEN_API_KEY;
  delete process.env.WOLF_QWEN_API_KEY;
  const missing = await askQwenAboutLaptop(new Uint8Array([1, 2, 3]));
  assert.equal(missing.configured, false);
  assert.equal(missing.laptop, false);
  assert.match(missing.error ?? "", /QWEN_API_KEY/);

  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const body = Buffer.concat(chunks).toString("utf8");
      assert.equal(req.headers.authorization, "Bearer test-qwen-key");
      assert.match(body, /data:image\/jpeg;base64,/);
      assert.match(body, /qwen-vl-plus/);
      res.setHeader("content-type", "application/json");
      res.end(
        JSON.stringify({
          choices: [
            {
              message: {
                content: [
                  { text: '{"laptop":true,"box":{"x":0.1,"y":0.2,"width":0.3,"height":0.4}}' },
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
  process.env.QWEN_API_KEY = "test-qwen-key";
  process.env.QWEN_BASE_URL = `http://127.0.0.1:${address.port}/v1`;
  const seen = await askQwenAboutLaptop(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]));
  assert.equal(seen.configured, true);
  assert.equal(seen.error, null);
  assert.equal(seen.label, QWEN_LAPTOP_LABEL);
  assert.deepEqual(seen.box, { x: 0.1, y: 0.2, width: 0.3, height: 0.4 });
  server.close();
  delete process.env.QWEN_API_KEY;
  delete process.env.QWEN_BASE_URL;
}

checkClient()
  .then(() => {
    console.log("qwen-laptop-overlay.check.ts — all assertions passed.");
  })
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
