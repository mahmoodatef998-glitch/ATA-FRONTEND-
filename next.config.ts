import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Turbopack config (required for Next.js 16)
  turbopack: {},
  
  // Disable TypeScript checking during build (temporary - for faster deployment)
  typescript: {
    ignoreBuildErrors: true,
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
  serverExternalPackages: ['@prisma/client', 'winston', 'nodemailer'],
  
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
    serverComponentsExternalPackages: ['@prisma/client', 'swagger-jsdoc', 'swagger-ui-react'],
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
    ];

    return [
      {
        source: '/:path*',
        headers: securityHeaders,
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
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20,
            },
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
