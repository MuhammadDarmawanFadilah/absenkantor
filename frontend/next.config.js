/** @type {import('next').NextConfig} */

const nextPwa = require("@ducanh2912/next-pwa");
const withPWAInit = nextPwa?.default ?? nextPwa;

const withPWA = withPWAInit({
  dest: "public",
  disable: true,
  register: true,
  fallbacks: {
    document: "/offline",
  },
});

function buildRemotePatterns() {
  /** @type {import('next').NextConfig['images']['remotePatterns']} */
  const remotePatterns = [
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
  ];

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (backendUrl) {
    const u = new URL(backendUrl);
    remotePatterns.push({
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      port: u.port || undefined,
    });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  if (baseUrl) {
    const u = new URL(baseUrl);
    remotePatterns.push({
      protocol: u.protocol.replace(":", ""),
      hostname: u.hostname,
      port: u.port || undefined,
    });
  }

  return remotePatterns;
}

const nextConfig = {
  ...(process.env.NEXT_STANDALONE === "true" ? { output: "standalone" } : {}),

  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  experimental: {
    optimizePackageImports: ["@radix-ui/react-icons", "lucide-react"],
    optimizeCss: true,
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },

  compress: true,

  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: "all",
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: "vendors",
            priority: 10,
            enforce: true,
          },
        },
      };
    }
    return config;
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  images: {
    remotePatterns: buildRemotePatterns(),
    minimumCacheTTL: 60,
    formats: ["image/webp", "image/avif"],
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    unoptimized: false,
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Content-Type, Authorization",
          },
        ],
      },
      {
        source: "/_next/static/css/(.*)",
        headers: [
          {
            key: "Content-Type",
            value: "text/css; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/js/(.*)",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
        ],
      },
      {
        source: "/models/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },

  async rewrites() {
    return [];
  },
};

module.exports = withPWA(nextConfig);
