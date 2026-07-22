import fs from "node:fs";
import https from "node:https";
import { URL } from "node:url";

const creds = JSON.parse(fs.readFileSync(".tmp-qa-creds.json", "utf8"));
const baseUrl = process.argv[2] || "https://unit311.vercel.app";

function request(url, { method = "GET", headers = {}, body } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const req = https.request(
      {
        hostname: u.hostname,
        path: u.pathname + u.search,
        method,
        headers: {
          ...headers,
          ...(body
            ? {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (res) => {
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => {
          const buf = Buffer.concat(chunks);
          resolve({
            status: res.statusCode,
            body: buf,
            setCookie: res.headers["set-cookie"] || [],
            contentType: res.headers["content-type"] || "",
          });
        });
      },
    );
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

const login = await request(`${baseUrl}/api/auth/login`, {
  method: "POST",
  body: JSON.stringify({ username: creds.username, password: creds.password }),
});
const cookie = login.setCookie.map((c) => c.split(";")[0]).join("; ");

const started = Date.now();
const tts = await request(`${baseUrl}/api/executive-assistant/tts`, {
  method: "POST",
  headers: { Cookie: cookie },
  body: JSON.stringify({
    text: "Hello from the Unit311 Executive Assistant.",
    gender: "male",
    speed: 1,
  }),
});
const elapsed = Date.now() - started;
const isMp3 =
  tts.status === 200 &&
  (tts.contentType.includes("audio") || tts.body.slice(0, 3).toString("binary").startsWith("ID3") || tts.body[0] === 0xff);

console.log(
  JSON.stringify({
    status: tts.status,
    contentType: tts.contentType,
    bytes: tts.body.length,
    elapsedMs: elapsed,
    ok: isMp3 && elapsed < 8000,
  }),
);

if (!(isMp3 && tts.status === 200)) process.exit(1);
