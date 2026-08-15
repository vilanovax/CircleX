/** @type {import('next').NextConfig} */

// Served under a sub-path (e.g. https://<app>.liara.run/circle), not the root.
const basePath = "/circle";

const nextConfig = {
  reactStrictMode: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
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
  images: {
    // Remote/data listing photos use `unoptimized` on the Image component.
    // Local public paths stay eligible for the optimizer.
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "**.githubusercontent.com" },
    ],
  },
};

module.exports = nextConfig;
