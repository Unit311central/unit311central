import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.unit311central.app",
  appName: "Unit311 Central",
  webDir: "www",
  server: {
    url: "https://unit311central.com/login",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#07111F",
  },
};

export default config;
