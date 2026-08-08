import type { Metadata, Viewport } from "next";
import "@mantine/core/styles.layer.css";
import "./globals.css";
import { StoreProvider } from "@/lib/store";
import { ToastProvider } from "@/components/Toast";
import { ThemeProvider, themeScript } from "@/lib/theme";
import { UIModeProvider, uiModeScript } from "@/lib/ui-mode";
import MantineRoot from "@/components/mantine/MantineRoot";
import ChakraRoot from "@/components/chakra/ChakraRoot";
import MuiRoot from "@/components/mui/MuiRoot";
import HeroUIRoot from "@/components/heroui/HeroUIRoot";

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
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/vazirmatn@33.0.3/Vazirmatn-font-face.css"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script dangerouslySetInnerHTML={{ __html: uiModeScript }} />
      </head>
      <body className="font-sans">
        <ThemeProvider>
          <MantineRoot>
            <ChakraRoot>
              <MuiRoot>
                <HeroUIRoot>
                  <UIModeProvider>
                    <StoreProvider>
                      <ToastProvider>
                        <div className="app-shell">{children}</div>
                      </ToastProvider>
                    </StoreProvider>
                  </UIModeProvider>
                </HeroUIRoot>
              </MuiRoot>
            </ChakraRoot>
          </MantineRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
