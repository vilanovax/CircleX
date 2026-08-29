import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import "./globals.css";
import "./login-gate.css";
import AppFrame from "@/components/AppFrame";
import WebVitals from "@/components/WebVitals";
import { loadAppBoot } from "@/lib/app-boot";
import { ThemeProvider, themeScript } from "@/lib/theme";
import { vazirmatn } from "@/lib/fonts";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "سیرکل | Circle",
  description:
    "خرید و فروش بین خانواده، دوستان و آشنایان — فقط حلقه‌ات.",
  // Do not set metadata.manifest — Next 14 ignores basePath and 404s at /.
  icons: {
    icon: `${BASE}/icon.svg`,
    apple: `${BASE}/icon.svg`,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "سیرکل",
  },
};

export const viewport: Viewport = {
  themeColor: "#4a3a8f",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const dynamic = "force-dynamic";

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = headers().get("x-circle-pathname") || "/";
  const boot = await loadAppBoot(pathname);

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />
      </head>
      <body className={`${vazirmatn.className} font-sans`}>
        <ThemeProvider>
          <WebVitals />
          <AppFrame boot={boot}>{children}</AppFrame>
        </ThemeProvider>
      </body>
    </html>
  );
}
