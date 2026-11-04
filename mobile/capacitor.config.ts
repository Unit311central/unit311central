import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.unit311central.app",
  appName: "WOLF Central",
  webDir: "www",
  server: {
    url: "https://wolf.unit311central.com/login",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#07111F",
    appendUserAgent: " WOLFCentralCapacitor/1",
  },
  ios: {
    backgroundColor: "#07111F",
    appendUserAgent: " WOLFCentralCapacitor/1",
    contentInset: "automatic",
  },
};

export default config;
