import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider, themeScript } from "@/lib/theme";
import RequireAuth from "@/components/RequireAuth";
import { vazirmatn } from "@/lib/fonts";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "سیرکل | Circle",
  description:
    "خرید و فروش بین خانواده، دوستان و آشنایان — فقط حلقهٔ شما.",
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning className={vazirmatn.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="manifest" href={`${BASE}/manifest.webmanifest`} />
      </head>
      <body className={`${vazirmatn.className} font-sans`}>
        <ThemeProvider>
          <StoreProvider>
            <ToastProvider>
              <div className="app-shell">
                <RequireAuth>{children}</RequireAuth>
              </div>
            </ToastProvider>
          </StoreProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
