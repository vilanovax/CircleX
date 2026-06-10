import type { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سیرکل | Circle",
    short_name: "سیرکل",
    description:
      "شبکه‌ی اجتماعی اعتمادمحور برای خرید، فروش و معرفی خدمات بین خانواده، دوستان و آشنایان.",
    start_url: `${BASE}/`,
    scope: `${BASE}/`,
    id: `${BASE}/`,
    display: "standalone",
    background_color: "#f4f4f7",
    theme_color: "#7c3aed",
    lang: "fa",
    dir: "rtl",
    orientation: "portrait",
    icons: [
      {
        src: `${BASE}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: `${BASE}/icon.svg`,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
