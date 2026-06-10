/** @type {import('next').NextConfig} */

// Served under a sub-path (e.g. https://<app>.liara.run/circle), not the root.
const basePath = "/circle";

const nextConfig = {
  reactStrictMode: true,
  basePath,
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
};

module.exports = nextConfig;
