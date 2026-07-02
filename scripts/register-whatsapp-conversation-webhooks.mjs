/**
 * Register CallMeBot webhooks for the multi-step WhatsApp support ticket flow.
 *
 * CallMeBot matches queries EXACTLY — register every message you plan to send.
 *
 * Usage:
 *   CALLMEBOT_API_KEY=... WHATSAPP_NOTIFY_PHONE=34657106176 \
 *   node scripts/register-whatsapp-conversation-webhooks.mjs
 */

const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
const phone = (process.env.WHATSAPP_NOTIFY_PHONE ?? "34657106176").replace(/\D/g, "");
const siteUrl = (process.env.SITE_URL ?? "https://barcelonadronecenter.vercel.app").replace(
  /\/$/,
  "",
);

const defaultMessages = [
  "Open new support ticket",
  "Paul Fotheringham",
  "Drone Catalyst",
  "Priority Medium",
  "This is a test ticket",
  "Assign to User 1",
];

const messages = process.argv.length > 2 ? process.argv.slice(2) : defaultMessages;

if (!apiKey) {
  console.error("Missing CALLMEBOT_API_KEY");
  process.exit(1);
}

async function registerQuery(query) {
  const action = `${siteUrl}/api/whatsapp/inbound?text=${encodeURIComponent(query)}`;
  const registerUrl = new URL("https://api.callmebot.com/whatsapp_add.php");
  registerUrl.searchParams.set("phone", phone);
  registerUrl.searchParams.set("apikey", apiKey);
  registerUrl.searchParams.set("query", query);
  registerUrl.searchParams.set("action", action);

  const response = await fetch(registerUrl.toString(), { cache: "no-store" });
  const body = await response.text();
  return { query, status: response.status, body: body.slice(0, 300), action };
}

console.log("Registering WhatsApp conversation webhooks");
console.log("Site:", siteUrl);
console.log("Phone:", phone);
console.log("Messages:", messages.length);

for (const query of messages) {
  const result = await registerQuery(query);
  console.log(`\n[${result.status}] ${result.query}`);
  console.log(result.body);
  if (result.status === 404) {
    console.log("CallMeBot inbound API unavailable (404). Use /whatsapp/ticket to simulate steps.");
  }
}

console.log("\nDone. Send messages to CallMeBot in order:");
messages.forEach((message, index) => console.log(`${index + 1}. ${message}`));
