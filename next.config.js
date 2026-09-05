/** @type {import('next').NextConfig} */

// Liara used /circle. Production on app.mycircle.ir is the site root.
// Set NEXT_PUBLIC_BASE_PATH=/circle at build time to restore the sub-path.
const rawBase = process.env.NEXT_PUBLIC_BASE_PATH?.trim() ?? "";
const basePath = rawBase === "/" ? "" : rawBase.replace(/\/$/, "");

function mediaHostname() {
  const raw = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (!raw) return "c237334.parspack.net";
  try {
    return new URL(raw.includes("://") ? raw : `https://${raw}`).hostname;
  } catch {
    return "c237334.parspack.net";
  }
}

const nextConfig = {
  reactStrictMode: true,
  ...(basePath ? { basePath } : {}),
  experimental: {
    serverComponentsExternalPackages: ["sharp", "@aws-sdk/client-s3"],
  },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    // Match PHOTO_SLOT (+ 2×) in lib/media.ts — thumbs, avatars, hero.
    imageSizes: [32, 44, 48, 56, 64, 96, 128, 192, 320, 384],
    deviceSizes: [480, 640, 750, 960],
    remotePatterns: [
      {
        protocol: "https",
        hostname: mediaHostname(),
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/listings/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/avatars/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  async redirects() {
    if (!basePath) return [];
    return [
      {
        source: "/",
        destination: basePath,
        permanent: false,
        basePath: false,
      },
    ];
  },
};

module.exports = nextConfig;
