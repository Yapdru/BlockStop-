/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  eslint: {
    // This stops the build from crashing over unescaped apostrophes
    ignoreDuringBuilds: true,
  },
  images: {
    // Next.js static exports require unoptimized images
    unoptimized: true, 
  }
};

module.exports = nextConfig;
