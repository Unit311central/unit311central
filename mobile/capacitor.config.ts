import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.barcelonadronecenter.app",
  appName: "BCN Drone Center",
  webDir: "www",
  server: {
    url: "https://barcelonadronecenter.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    backgroundColor: "#07111F",
  },
};

export default config;
