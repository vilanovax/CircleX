import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";

export const metadata: Metadata = {
  title: "سیرکل | Circle",
  description:
    "شبکه‌ی اجتماعی اعتمادمحور برای خرید، فروش و معرفی خدمات بین خانواده، دوستان و آشنایان.",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "سیرکل",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css"
        />
      </head>
      <body className="font-sans">
        <StoreProvider>
          <ToastProvider>
            <div className="app-shell">{children}</div>
          </ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
