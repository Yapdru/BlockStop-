/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  // GitHub Pages configuration
  output: process.env.GITHUB_PAGES === "true" ? "export" : "standalone",

  // Static generation
  experimental: {
    optimizePackageImports: ["@mui/material"],
  },

  images: {
    unoptimized: true, // Required for static export
  },

  // Base path for GitHub Pages (if needed)
  basePath: process.env.GITHUB_PAGES === "true" ? "/BlockStop-" : "",
};

module.exports = nextConfig;
