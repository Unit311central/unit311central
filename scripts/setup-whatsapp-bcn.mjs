/**
 * One-time production setup for BCN WhatsApp support tickets.
 * Env vars are added via Vercel CLI — this script registers the intake test message
 * when CallMeBot inbound API is available.
 */

const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
const phone = (process.env.WHATSAPP_NOTIFY_PHONE ?? "34657106176").replace(/\D/g, "");
const siteUrl = (process.env.SITE_URL ?? "https://barcelonadronecenter.vercel.app").replace(
  /\/$/,
  "",
);

const ticketMessage =
  process.argv[2] ??
  "Westport paul ormandy open ticket low priority This is a test new ticket";

console.log("BCN WhatsApp support setup");
console.log("Site:", siteUrl);
console.log("Phone:", phone);
console.log("CallMeBot configured:", Boolean(apiKey));

if (apiKey) {
  const testUrl = new URL("https://api.callmebot.com/whatsapp.php");
  testUrl.searchParams.set("phone", phone);
  testUrl.searchParams.set("text", "BCN Support WhatsApp is configured.");
  testUrl.searchParams.set("apikey", apiKey);

  const testRes = await fetch(testUrl.toString(), { cache: "no-store" });
  const testBody = await testRes.text();
  console.log("Send test:", testRes.status, testBody.slice(0, 200));
}

const action = `${siteUrl}/api/whatsapp/inbound?text=${encodeURIComponent(ticketMessage)}`;
if (apiKey) {
  const registerUrl = new URL("https://api.callmebot.com/whatsapp_add.php");
  registerUrl.searchParams.set("phone", phone);
  registerUrl.searchParams.set("apikey", apiKey);
  registerUrl.searchParams.set("query", ticketMessage);
  registerUrl.searchParams.set("action", action);

  const regRes = await fetch(registerUrl.toString(), { cache: "no-store" });
  const regBody = await regRes.text();
  console.log("Register inbound query:", regRes.status, regBody.slice(0, 200));
  if (regRes.status === 404) {
    console.log(
      "CallMeBot inbound webhooks are unavailable (404). Use the mobile test page:",
      `${siteUrl}/whatsapp/ticket`,
    );
  }
}

console.log("Intake URL:", action);
console.log("Test page:", `${siteUrl}/whatsapp/ticket`);
