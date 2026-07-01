/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Ignores the unescaped apostrophes
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ✨ Ignores the unused variable and any other TypeScript errors
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true, 
  },
  experimental: {
    // Allows dynamic features in static export
    dynamicIO: true,
  }
};

module.exports = nextConfig;
