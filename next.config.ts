import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (required for Next.js 16)
  turbopack: {},
  
  // TypeScript checking enabled for production quality
  typescript: {
    ignoreBuildErrors: false, // ✅ Enable type checking for better code quality
  },
  
  // Production optimizations
  compress: true,
  poweredByHeader: false,
  
  // Disable logging in production for better performance
  logging: process.env.NODE_ENV === "production" ? undefined : {
    fetches: {
      fullUrl: true,
    },
  },
  
  // External packages for server components
  serverExternalPackages: ['@prisma/client', 'winston', 'nodemailer', 'swagger-jsdoc', 'swagger-ui-react', '@logtail/node'],
  
  // Production build optimizations
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    // Add image quality configurations
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp'],
    // Add custom quality configurations
    qualities: [75, 90, 95],
  },
  
  // Bundle size optimization
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-tooltip',
      'recharts',
    ],
  },
  
  // ✅ Performance: Block RSC prefetch requests using rewrites
  // This intercepts RSC requests before they reach the server
  async rewrites() {
    return {
      beforeFiles: [
        // Block RSC prefetch requests
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'next-router-prefetch',
              value: '1',
            },
          ],
          destination: '/api/block-rsc',
        },
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'rsc',
              value: '1',
            },
          ],
          destination: '/api/block-rsc',
        },
        {
          source: '/:path*',
          has: [
            {
              type: 'header',
              key: 'next-router-state-tree',
            },
          ],
          destination: '/api/block-rsc',
        },
      ],
    };
  },
  
  // Security Headers & CORS Configuration
  async headers() {
    const securityHeaders = [
      {
        key: 'X-DNS-Prefetch-Control',
        value: 'on'
      },
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=63072000; includeSubDomains; preload'
      },
      {
        key: 'X-Frame-Options',
        value: 'SAMEORIGIN'
      },
      {
        key: 'X-Content-Type-Options',
        value: 'nosniff'
      },
      {
        key: 'X-XSS-Protection',
        value: '1; mode=block'
      },
      {
        key: 'Referrer-Policy',
        value: 'origin-when-cross-origin'
      },
      {
        key: 'Permissions-Policy',
        value: 'geolocation=(self), camera=(), microphone=()'
      },
      {
        key: 'Content-Security-Policy',
        value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.groq.com https://*.supabase.com https://*.cloudinary.com https://*.vercel.app https://*.vercel.com wss://* ws://* http://localhost:* https://localhost:*; frame-src 'self' https://vercel.live; report-uri /api/csp-report;"
      },
      // ✅ Performance: Disable RSC prefetching at header level
      {
        key: 'X-RSC-Prefetch',
        value: 'disabled'
      },
    ];

    // Cache headers for static assets
    const cacheHeaders = [
      {
        key: 'Cache-Control',
        value: 'public, max-age=31536000, immutable'
      },
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: cacheHeaders,
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800'
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          ...securityHeaders,
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? (process.env.ALLOWED_ORIGINS || '') 
              : (process.env.ALLOWED_ORIGINS || 'http://localhost:3005'),
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          {
            key: 'Access-Control-Allow-Credentials',
            value: 'true',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        events: false,
        string_decoder: false,
        'readable-stream': false,
        zlib: false,
      };
      
      config.resolve.alias = {
        ...config.resolve.alias,
        '@/lib/logger-winston': false,
        'winston': false,
        'nodemailer': false,
      };

      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // ✅ Performance: Optimize framework bundle
            framework: {
              name: 'framework',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
              enforce: true,
            },
            // ✅ Performance: Separate vendor libraries
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
              reuseExistingChunk: true,
            },
            // ✅ Performance: Common chunks for shared code
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        },
      };
    }
    return config;
  },
};

export default nextConfig;
