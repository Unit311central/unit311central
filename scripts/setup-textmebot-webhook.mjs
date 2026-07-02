/**
 * Configure TextMeBot for BCN WhatsApp support intake.
 *
 * Usage:
 *   TEXTMEBOT_API_KEY=reWJA3LBW6Gy WHATSAPP_NOTIFY_PHONE=34657106176 \
 *   node scripts/setup-textmebot-webhook.mjs
 */

const apiKey = process.env.TEXTMEBOT_API_KEY?.trim();
const phone = (process.env.WHATSAPP_NOTIFY_PHONE ?? "34657106176").replace(/\D/g, "");
const siteUrl = (process.env.SITE_URL ?? "https://barcelonadronecenter.vercel.app").replace(
  /\/$/,
  "",
);
const secret = process.env.WHATSAPP_WEBHOOK_SECRET?.trim();

const webhookPath = "/api/whatsapp/inbound";
const webhookUrl = secret
  ? `${siteUrl}${webhookPath}?secret=${encodeURIComponent(secret)}`
  : `${siteUrl}${webhookPath}`;

if (!apiKey) {
  console.error("Missing TEXTMEBOT_API_KEY");
  process.exit(1);
}

async function registerWebhook() {
  const body = new URLSearchParams({
    webhook: webhookUrl,
    apikey: apiKey,
    agregar: "",
  });

  const response = await fetch(
    `https://api.textmebot.com/crud/crud_webhook/AgregarNuevo.php?apikey=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );

  return { status: response.status, body: (await response.text()).slice(0, 200) };
}

async function registerPhone() {
  const body = new URLSearchParams({
    phone: `+${phone}`,
    apikey: apiKey,
    softr: "",
    agregar: "",
  });

  const response = await fetch(
    `https://api.textmebot.com/crud/crud_phone/AgregarNuevo.php?apikey=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store",
    },
  );

  return { status: response.status, body: (await response.text()).slice(0, 200) };
}

async function readStatus() {
  const response = await fetch(
    `https://api.textmebot.com/web_receive.php?apikey=${encodeURIComponent(apiKey)}`,
    { cache: "no-store" },
  );
  const html = await response.text();
  const webhookMatch = html.match(/Current webhook for this apikey:\s*<code>([^<]+)<\/code>/i);
  return webhookMatch?.[1] ?? "unknown";
}

console.log("BCN TextMeBot setup");
console.log("API key:", apiKey);
console.log("Phone:", `+${phone}`);
console.log("Webhook:", webhookUrl);

const webhookResult = await registerWebhook();
console.log("\nWebhook register:", webhookResult.status, webhookResult.body);

const phoneResult = await registerPhone();
console.log("Phone register:", phoneResult.status, phoneResult.body);

const currentWebhook = await readStatus();
console.log("Current webhook:", currentWebhook);

console.log(`
Next step (required once):
1. Open https://api.textmebot.com/status.php?apikey=${apiKey}
2. Scan the QR code with WhatsApp → Linked Devices → Link a device
3. Wait until status shows "Connected"

Then test by messaging +${phone} from any phone with:
Open new support ticket
Paul Fotheringham
Drone Catalyst
Priority Medium
This is a test ticket
Assign to User 1
`);
