/**
 * Browser smoke test: Demo login → Engineering → Technical Files page loads.
 */
import { chromium } from "playwright";

const BASE = process.env.DEMO_PROD_HOST ?? "https://demo.unit311central.com";
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "admin@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const login = await context.request.post(`${BASE}/api/auth/login`, {
    data: { username: USERNAME, password: PASSWORD },
  });
  if (!login.ok()) {
    throw new Error(`Login API failed (${login.status()}): ${await login.text()}`);
  }

  const page = await context.newPage();
  await page.goto(`${BASE}/dashboard?view=engineering-technical-files`, {
    waitUntil: "domcontentloaded",
  });

  if (page.url().includes("/login")) {
    throw new Error(`Expected dashboard shell, redirected to ${page.url()}`);
  }

  await page.getByRole("heading", { name: "Technical Files" }).waitFor({ timeout: 45000 });

  if (await page.getByText("Authentication required").count()) {
    throw new Error("Technical Files page shows Authentication required.");
  }

  await page.getByText("No technical files yet").waitFor({ timeout: 45000 });

  console.log(JSON.stringify({ ok: true, url: page.url() }));
  await browser.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
