/**
 * Next.js Performance Optimization Configuration
 * Add these configurations to your next.config.js for optimal performance
 */

module.exports = {
  // Enable SWC minification for faster builds
  swcMinify: true,

  // Image optimization configuration
  images: {
    deviceSizes: [640, 750, 828, 1080, 1280, 1536],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
    dangerouslyAllowSVG: false,
    unoptimized: false, // Set to true only for static exports
  },

  // Build optimization
  productionBrowserSourceMaps: false, // Disable in production for smaller builds
  compress: true, // Enable gzip compression
  poweredByHeader: false, // Remove X-Powered-By header

  // Font optimization
  fonts: {
    fontFamilies: [
      {
        name: 'Inter',
        fonts: [
          {
            path: './public/fonts/inter-var.woff2',
            style: 'normal',
          },
        ],
      },
    ],
  },

  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Production optimizations
    if (!isServer) {
      config.optimization.runtimeChunk = 'single';
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // React and dependencies
          react: {
            name: 'react',
            test: /[\\/]node_modules[\\/](react|react-dom|next)[\\/]/,
            priority: 40,
            reuseExistingChunk: true,
            enforce: true,
          },
          // Large dependencies
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 20,
            reuseExistingChunk: true,
          },
          // Common modules used by at least 2 chunks
          common: {
            minChunks: 2,
            priority: 10,
            reuseExistingChunk: true,
            name: 'common',
          },
        },
      };
    }

    return config;
  },

  // Experimental features for performance
  experimental: {
    optimizePackageImports: [
      '@visx/axis',
      '@visx/grid',
      '@visx/scale',
      '@visx/shape',
      '@visx/xychart',
    ],
  },

  // Headers for caching optimization
  async headers() {
    return [
      {
        source: '/public/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable', // 1 year for versioned assets
          },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [];
  },

  // Rewrites for performance
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [],
    };
  },
};
