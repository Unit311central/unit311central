/**
 * Register a CallMeBot WhatsApp query that triggers support ticket intake.
 *
 * CallMeBot matches the query EXACTLY — register the full message you plan to send.
 *
 * Usage:
 *   CALLMEBOT_API_KEY=... WHATSAPP_NOTIFY_PHONE=34657106176 \
 *   node scripts/register-whatsapp-ticket-webhook.mjs "Westport paul ormandy open ticket low priority This is a test new ticket"
 */

const apiKey = process.env.CALLMEBOT_API_KEY?.trim();
const phone = (process.env.WHATSAPP_NOTIFY_PHONE ?? "34657106176").replace(/\D/g, "");
const siteUrl = (process.env.SITE_URL ?? "https://barcelonadronecenter.vercel.app").replace(/\/$/, "");

const ticketMessage =
  process.argv[2] ??
  "Westport paul ormandy open ticket low priority This is a test new ticket";

if (!apiKey) {
  console.error("Missing CALLMEBOT_API_KEY");
  process.exit(1);
}

const action = `${siteUrl}/api/whatsapp/inbound?text=${encodeURIComponent(ticketMessage)}`;
const registerUrl = new URL("https://api.callmebot.com/whatsapp_add.php");
registerUrl.searchParams.set("phone", phone);
registerUrl.searchParams.set("apikey", apiKey);
registerUrl.searchParams.set("query", ticketMessage);
registerUrl.searchParams.set("action", action);

const response = await fetch(registerUrl.toString(), { cache: "no-store" });
const body = await response.text();

console.log("register", response.status, body.slice(0, 500));
console.log("query:", ticketMessage);
console.log("webhook:", action);
