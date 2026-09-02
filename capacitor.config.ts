import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Native shell loads the live Next.js app (API + auth stay on the server).
 * Override at sync time: CAPACITOR_SERVER_URL=http://10.x.x.x:3000/circle
 */
const serverUrl =
  process.env.CAPACITOR_SERVER_URL?.trim() ||
  "https://circle.liara.run/circle";

const config: CapacitorConfig = {
  appId: "app.circle.social",
  appName: "سیرکل",
  webDir: "www",
  server: {
    url: serverUrl,
    cleartext: serverUrl.startsWith("http://"),
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#ebe8e3",
      androidSplashResourceName: "splash",
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#4a3a8f",
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: "#ebe8e3",
  },
};

export default config;
