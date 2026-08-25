/** @type {import('next').NextConfig} */

// Served under a sub-path (e.g. https://<app>.liara.run/circle), not the root.
const basePath = "/circle";

const nextConfig = {
  reactStrictMode: true,
  basePath,
  experimental: {
    serverComponentsExternalPackages: ["sharp"],
  },
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
      {
        source: "/listings/:path*",
        destination: `${basePath}/listings/:path*`,
        permanent: false,
        basePath: false,
      },
    ];
  },
};

module.exports = nextConfig;
