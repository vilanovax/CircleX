/** @type {import('next').NextConfig} */

// Served under a sub-path (e.g. https://<app>.liara.run/circle), not the root.
const basePath = "/circle";

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
  basePath,
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
