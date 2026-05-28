import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: true, // Disable auto generation, use manual service worker
  register: true,
  fallbacks: {
    document: '/offline',
  },
});

const nextConfig: NextConfig = {
  /* config options here */

  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),
  
  // Remove console.log in production using Next.js built-in compiler
  compiler: {
    removeConsole: process.env.NODE_ENV === "production" ? {
      exclude: ['error', 'warn'] // Keep console.error and console.warn for debugging
    } : false,
  },
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: ['@radix-ui/react-icons', 'lucide-react'],
    optimizeCss: true,
  },
  
  // Turbopack configuration
  turbopack: {
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },
  
  // Compress responses
  compress: true,
  
  // Build performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },  // Optimasi images
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "smarthr.my.id",
      },
      {
        protocol: "http",
        hostname: "smarthr.my.id",
      },
      // Backend URL untuk images
      ...(process.env.NEXT_PUBLIC_BACKEND_URL ? [
        {
          protocol: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).protocol.slice(0, -1) as "http" | "https",
          hostname: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).hostname,
          port: new URL(process.env.NEXT_PUBLIC_BACKEND_URL).port || undefined,
        }
      ] : []),
      // Frontend URL untuk images yang di-proxy
      ...(process.env.NEXT_PUBLIC_BASE_URL ? [
        {
          protocol: new URL(process.env.NEXT_PUBLIC_BASE_URL).protocol.slice(0, -1) as "http" | "https",
          hostname: new URL(process.env.NEXT_PUBLIC_BASE_URL).hostname,
          port: new URL(process.env.NEXT_PUBLIC_BASE_URL).port || undefined,
        }
      ] : []),
    ],
    // Optimasi untuk mengurangi requests
    minimumCacheTTL: 60,
    formats: ['image/webp', 'image/avif'],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },
  // CORS configuration dan MIME type headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization',
          },
          // CSP removed - handled elsewhere to avoid duplicate headers
        ],
      },
      // CSS files
      {
        source: '/_next/static/css/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'text/css; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // JavaScript files
      {
        source: '/_next/static/js/(.*)',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // PWA Manifest
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      // Service Worker
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript; charset=utf-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
      // MediaPipe model files
      {
        source: '/models/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  // Redirect API calls to backend
  async rewrites() {
    return [
      // Disabled to avoid double /api prefix since we're making direct calls
      // {
      //   source: '/api/:path*',
      //   destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api'}/:path*`,
      // },
    ];
  },
};

export default withPWA(nextConfig);
