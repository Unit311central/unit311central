import type { CapacitorConfig } from "@capacitor/cli";

const phoneLink =
  "/dashboard?view=wolf-phone-link";

const config: CapacitorConfig = {
  appId: "com.unit311central.app",
  appName: "WOLF Central",
  webDir: "www",
  server: {
    url: `https://wolf.unit311central.com/login?next=${encodeURIComponent(phoneLink)}`,
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#07111F",
  },
};

export default config;
