import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isVercelBuild = process.env.VERCEL === "1";

/** @type {import('next').NextConfig} */
const nextConfig = {
  modularizeImports: {
    "lucide-react": {
      transform: "lucide-react/dist/esm/icons/{{member}}"
    }
  },
  experimental: {
    webpackMemoryOptimizations: true,
    // Vercel build containers have ~8GB RAM; a single worker avoids OOM from parallel heaps.
    // Cloudflare Workers Builds can use more parallelism with script-level heap limits.
    cpus: isVercelBuild ? 1 : 4
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**"
      }
    ]
  },
  outputFileTracingIncludes: {
    "/trade/game": [
      "./node_modules/@resvg/resvg-wasm/index_bg.wasm",
      "./public/fonts/Sora-*.ttf",
      "./public/referral/prophet-logo.png"
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
  }
};

export default withNextIntl(nextConfig);
