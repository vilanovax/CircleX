import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سیرکل | Circle",
    short_name: "سیرکل",
    description:
      "شبکه‌ی اجتماعی اعتمادمحور برای خرید، فروش و معرفی خدمات بین خانواده، دوستان و آشنایان.",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f4f7",
    theme_color: "#7c3aed",
    lang: "fa",
    dir: "rtl",
    orientation: "portrait",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
