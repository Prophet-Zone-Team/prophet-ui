import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep heavy Node/Web3 packages external in API routes and RSC to reduce dev compile memory.
  // serverExternalPackages: [
  //   "@defuse-protocol/contract-types",
  //   // Bundle intents-sdk/internal-utils: their ESM imports omit .js on near-api-js subpaths.
  //   "@defuse-protocol/one-click-sdk-typescript",
  //   "@polymarket/builder-relayer-client",
  //   "@polymarket/builder-signing-sdk",
  //   "@polymarket/clob-client-v2",
  //   "@stableflow/core",
  //   "undici",
  //   "viem",
  //   "wagmi"
  // ],
  experimental: {
    webpackMemoryOptimizations: true,
    // Lower build parallelism to reduce peak memory on Cloudflare Workers Builds.
    cpus: 4
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
