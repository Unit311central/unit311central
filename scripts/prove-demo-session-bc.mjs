/**
 * Verify Demo session survives Business Central dashboard tile Link prefetch.
 *
 * Usage: npm run prove:demo-session-bc
 */
import { chromium } from "playwright";

const ORIGIN = "https://demo.unit311central.com";
const USERNAME = process.env.DEMO_PROSPECT_USERNAME ?? "demo@unit311central.com";
const PASSWORD = process.env.DEMO_PROSPECT_PASSWORD ?? "Letmein2026$";

async function sessionCookieCount(context) {
  const cookies = await context.cookies();
  return cookies.filter((cookie) => cookie.name === "dc_platform_session").length;
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${ORIGIN}/login?next=${encodeURIComponent("/dashboard?view=home")}`, {
    waitUntil: "domcontentloaded",
  });
  await page.locator("input[name=username]").fill(USERNAME);
  await page.locator("input[name=password][type=password]").fill(PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL(/\/dashboard/, { timeout: 60000 });
  await page.waitForLoadState("networkidle");

  if ((await sessionCookieCount(context)) !== 1) {
    throw new Error("Expected session cookie after login");
  }

  const badPrefetches = [];
  page.on("request", (req) => {
    const url = req.url();
    if (
      url.startsWith(`${ORIGIN}/login?view=`) ||
      (url.startsWith(`${ORIGIN}/?view=`) && !url.includes("/dashboard"))
    ) {
      badPrefetches.push(url);
    }
  });

  await page.goto(`${ORIGIN}/dashboard?view=business-central-dashboard`, {
    waitUntil: "networkidle",
    timeout: 90000,
  });
  await page.waitForTimeout(1500);

  if ((await sessionCookieCount(context)) !== 1) {
    throw new Error("Session cookie cleared after Business Central dashboard");
  }

  await page.goto(`${ORIGIN}/dashboard?view=clients`, { waitUntil: "networkidle", timeout: 90000 });
  if (page.url().includes("/login")) {
    throw new Error(`Redirected to login after BC dashboard: ${page.url()}`);
  }
  if ((await sessionCookieCount(context)) !== 1) {
    throw new Error("Session cookie missing after navigating to clients");
  }

  if (badPrefetches.length > 0) {
    throw new Error(`Bad tile prefetch URLs: ${badPrefetches.slice(0, 5).join(", ")}`);
  }

  await browser.close();
  console.log("ok  prove:demo-session-bc passed\n");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
