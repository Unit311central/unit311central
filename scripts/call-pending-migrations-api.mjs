const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim() ?? "";
console.log("secret length", secret.length);
if (!secret || secret.length < 8) {
  console.error("No INTERNAL_FILES_SETUP_SECRET in environment");
  process.exit(1);
}

const url = "https://unit311central.com/api/internal/apply-assistant-artifacts-migration";
const response = await fetch(url, {
  method: "POST",
  headers: {
    "x-setup-secret": secret,
    "Content-Type": "application/json",
  },
});

const text = await response.text();
console.log("status", response.status);
console.log(text.slice(0, 4000));
