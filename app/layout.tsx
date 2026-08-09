import type { Metadata, Viewport } from "next";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider, themeScript } from "@/lib/theme";
import { UIModeProvider, uiModeScript } from "@/lib/ui-mode";
import ActiveUIProviders from "@/components/ActiveUIProviders";
import { vazirmatn } from "@/lib/fonts";

export const metadata: Metadata = {
  title: "سیرکل | Circle",
  description:
    "شبکه‌ی اجتماعی اعتمادمحور برای خرید، فروش و معرفی خدمات بین خانواده، دوستان و آشنایان.",
  icons: {
    icon: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`,
    apple: `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}/icon.svg`,
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
        <script dangerouslySetInnerHTML={{ __html: uiModeScript }} />
      </head>
      <body className={`${vazirmatn.className} font-sans`}>
        <ThemeProvider>
          <UIModeProvider>
            <ActiveUIProviders>
              <StoreProvider>
                <ToastProvider>
                  <div className="app-shell">{children}</div>
                </ToastProvider>
              </StoreProvider>
            </ActiveUIProviders>
          </UIModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
