import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isVercelBuild = process.env.VERCEL === "1";
const copyTradeApiUpstream = (
  process.env.COPY_TRADE_API_URL ?? "https://api.zerostrategy.fun"
).replace(/\/$/, "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Lint and typecheck run in GitHub Actions CI; skipping here avoids slow/OOM Vercel builds.
  eslint: {
    ignoreDuringBuilds: true
  },
  typescript: {
    ignoreBuildErrors: true
  },
  // modularizeImports: {
  //   "lucide-react": {
  //     transform: "lucide-react/dist/esm/icons/{{member}}"
  //   }
  // },
  experimental: {
    webpackMemoryOptimizations: true,
    // Vercel build containers have ~8GB RAM; a single worker avoids OOM from parallel heaps.
    // Cloudflare Workers Builds can use more parallelism with script-level heap limits.
    cpus: 1
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  outputFileTracingExcludes: {
    "*": [
      "./node_modules/esbuild/**",
      "./node_modules/webpack/**",
      "./node_modules/terser/**",
      "./node_modules/sass/**",
      "./node_modules/caniuse-lite/**"
    ]
  },
  async redirects() {
    return [
      {
        source: "/trade/:slug/pro",
        destination: "/trade/team?slug=:slug",
        permanent: true
      },
      {
        source: "/news/:slug",
        destination: "/news?slug=:slug",
        permanent: true
      },
      {
        source: "/team/:slug",
        destination: "/team?slug=:slug",
        permanent: true
      },
      {
        source: "/trade/team/:slug",
        destination: "/trade/team?slug=:slug",
        permanent: true
      },
      {
        source: "/trade/game/:slug",
        destination: "/trade/game?slug=:slug",
        permanent: true
      },
      {
        source: "/landing",
        destination: "/referral",
        permanent: true
      },
      {
        source: "/landing/:path*",
        destination: "/referral/:path*",
        permanent: true
      }
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/copy-trade/:path*",
        destination: `${copyTradeApiUpstream}/:path*`
      }
    ];
  }
};

export default withNextIntl(nextConfig);
